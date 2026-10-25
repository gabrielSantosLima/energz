#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PORT="${METRO_PORT:-8081}"
METRO_URL="http://127.0.0.1:${PORT}/status"
LOG_FILE=".expo/dev-server.log"

for command in node npx curl; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "Error: '$command' was not found in PATH." >&2
    exit 1
  fi
done

ADB="${ADB:-adb}"
if ! command -v "$ADB" >/dev/null 2>&1; then
  for sdk_dir in "${ANDROID_HOME:-}" "${ANDROID_SDK_ROOT:-}"; do
    if [ -n "$sdk_dir" ] && [ -x "${sdk_dir}/platform-tools/adb" ]; then
      ADB="${sdk_dir}/platform-tools/adb"
      break
    fi
  done
fi

if ! command -v "$ADB" >/dev/null 2>&1; then
  echo "Error: 'adb' was not found in PATH or ANDROID_HOME/ANDROID_SDK_ROOT." >&2
  exit 1
fi

PACKAGE_NAME="$(node -p "require('./app.json').expo.android.package")"
if [ -z "$PACKAGE_NAME" ] || [ "$PACKAGE_NAME" = "undefined" ]; then
  echo "Error: android.package is not defined in app.json." >&2
  exit 1
fi

"$ADB" start-server >/dev/null 2>&1

if ! "$ADB" devices | awk 'NR > 1 && $2 == "device" { found = 1 } END { exit found ? 0 : 1 }'; then
  echo "Error: no authorized Android device connected." >&2
  "$ADB" devices
  exit 1
fi

if ! curl -fsS "$METRO_URL" >/dev/null 2>&1; then
  echo "Starting Metro on port ${PORT}..."
  mkdir -p .expo
  nohup npx expo start --port "$PORT" >"$LOG_FILE" 2>&1 &

  for _ in $(seq 1 60); do
    if curl -fsS "$METRO_URL" >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done

  if ! curl -fsS "$METRO_URL" >/dev/null 2>&1; then
    echo "Error: Metro did not start. See ${LOG_FILE}." >&2
    exit 1
  fi
fi

"$ADB" reverse "tcp:${PORT}" "tcp:${PORT}" >/dev/null
"$ADB" shell am force-stop "$PACKAGE_NAME" >/dev/null 2>&1 || true
"$ADB" shell monkey -p "$PACKAGE_NAME" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1

echo "Development mode ready: ${PACKAGE_NAME} connected to Metro on port ${PORT}."
