#!/usr/bin/env bash
#
# Start the energz development environment.
#
#   bash scripts/dev.sh            # start Metro, build/install the debug app, open it
#   bash scripts/dev.sh --reload   # skip the native build, restart the installed app
#   bash scripts/dev.sh --clear    # restart Metro with a clean cache before building
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

MODE="build"
CLEAR=0

for arg in "$@"; do
  case "$arg" in
    --reload|--no-build)
      MODE="reload"
      ;;
    --clear)
      CLEAR=1
      ;;
    -h|--help)
      sed -n '3,8p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown option: $arg" >&2
      exit 1
      ;;
  esac
done

# --- Java -------------------------------------------------------------------
# Gradle needs JDK 17-24. JDK 25 breaks the CMake configuration of the native
# modules, so prefer the JDK 21 that Gradle already downloaded, then fall back
# to other runtimes.
jdk_ok() {
  [ -x "$1/bin/java.exe" ] && "$1/bin/java.exe" -version 2>&1 | grep -qE 'version "(1[7-9]|2[0-4])'
}

if [ -z "${JAVA_HOME:-}" ] || ! jdk_ok "$JAVA_HOME"; then
  GRADLE_JDK="$HOME/.gradle/jdks/eclipse_adoptium-21-amd64-windows.2"
  STUDIO_JDK="/c/Program Files/Android/Android Studio/jbr"

  if jdk_ok "$GRADLE_JDK"; then
    JAVA_HOME="$GRADLE_JDK"
  elif jdk_ok "$STUDIO_JDK"; then
    JAVA_HOME="$STUDIO_JDK"
  fi
fi
export JAVA_HOME
export PATH="$JAVA_HOME/bin:$PATH"

# --- Android SDK ------------------------------------------------------------
if [ -z "${ANDROID_HOME:-}" ] && [ -d "$LOCALAPPDATA/Android/Sdk" ]; then
  ANDROID_HOME="$LOCALAPPDATA/Android/Sdk"
fi
export ANDROID_HOME
export PATH="$ANDROID_HOME/platform-tools:$PATH"

if [ -x "$ANDROID_HOME/platform-tools/adb.exe" ]; then
  ADB="$ANDROID_HOME/platform-tools/adb.exe"
else
  ADB="$ANDROID_HOME/platform-tools/adb"
fi

read -r PACKAGE SCHEME < <(
  node -e "const app = require('./app.json').expo; console.log(app.android.package, app.scheme)"
)

# --- Metro ------------------------------------------------------------------
metro_running() {
  curl -fsS http://127.0.0.1:8081/status 2>/dev/null | grep -q 'packager-status:running'
}

stop_metro() {
  local pid
  pid="$(netstat -ano 2>/dev/null | grep LISTENING | grep -E '[:.]8081[[:space:]]' | awk '{print $NF}' | head -n 1)"
  if [ -n "$pid" ]; then
    taskkill //F //T //PID "$pid" >/dev/null 2>&1 || true
  fi
}

if [ "$CLEAR" -eq 1 ]; then
  stop_metro
fi

if ! metro_running; then
  mkdir -p .expo
  if [ "$CLEAR" -eq 1 ]; then
    nohup npx expo start --port 8081 --clear > .expo/dev-server.log 2>&1 &
  else
    nohup npx expo start --port 8081 > .expo/dev-server.log 2>&1 &
  fi

  for _ in $(seq 1 60); do
    if metro_running; then
      break
    fi
    sleep 1
  done

  if ! metro_running; then
    echo "Metro did not start. See .expo/dev-server.log" >&2
    tail -n 40 .expo/dev-server.log >&2 || true
    exit 1
  fi
fi

# The debug app always talks to Metro through the USB forward, so the LAN IP
# never has to be reachable.
"$ADB" reverse tcp:8081 tcp:8081 >/dev/null

launch_app() {
  "$ADB" shell am force-stop "$PACKAGE"
  sleep 1
  "$ADB" shell am start \
    -a android.intent.action.VIEW \
    -d "$SCHEME://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081" \
    >/dev/null
}

if [ "$MODE" = "reload" ]; then
  launch_app
  echo "App reloaded from Metro."
  exit 0
fi

npx expo run:android --no-bundler

# expo run:android opens the LAN URL; relaunch through adb reverse so it works
# even when the device cannot reach this machine over Wi-Fi.
launch_app
echo "Development build installed and opened."
