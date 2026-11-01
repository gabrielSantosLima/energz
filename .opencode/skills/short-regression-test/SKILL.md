---
name: Short regression test
description: Run the short happy-path regression on the energz dev build, keep the regression script in sync with new features or changes, and report a pass/fail table.
---

# Short regression test

Run the happy-path regression against the energz Android development build and
report the result as a table. The runnable script lives in
`scripts/regression.py`.

## Preconditions

- An Android device connected over USB with the energz **debug** build installed
  (release builds cannot load the bundle from Metro).
- Metro running on `http://127.0.0.1:8081`.
- App language set to **Português** (the checks assert Portuguese labels).

## Step 1 — Check the environment

1. `curl -fsS http://127.0.0.1:8081/status` should return
   `packager-status:running`. If not, start Metro in the background:
   `npx expo start --port 8081 > .expo/dev-server.log 2>&1 &`
2. `adb devices` must list an authorized device.
3. Confirm the installed app is debuggable:
   `adb shell dumpsys package <android.package> | grep DEBUGGABLE`.
   If it is a release build, ask before uninstalling it (that wipes local data),
   then install `android/app/build/outputs/apk/debug/app-debug.apk` with
   `adb install -r`.
4. If the home screen is not in Portuguese, stop and ask the user to set it in
   **Configurações → Idioma** before running.

The script resolves `adb` from `ADB`, `PATH`, or `LOCALAPPDATA/Android/Sdk` and
reads the package name from `app.json`.

## Step 2 — Keep the script in sync with the code

1. Latest release: `git describe --tags --abbrev=0`.
2. User-facing changes since the release (or since the last script update):
   `git log --oneline <tag>..HEAD -- src/app src/components src/hooks src/domain`.
3. Last script update:
   `git log -1 --format=%h -- .opencode/skills/short-regression-test/scripts/regression.py`.

If there are new screens, renamed labels, or changed happy paths after the last
script update, update `scripts/regression.py` to cover them before running:

- Add one `check(...)` per new user-visible flow (open screen, primary action,
  visible result).
- Keep values dynamic (for example, measurement values relative to the last
  reading) so the script can run repeatedly.
- Keep assertions in Portuguese, matching the app language.

When the script changes:

1. Run it and confirm it passes.
2. Commit only the script, e.g.
   `git add .opencode/skills/short-regression-test/scripts/regression.py` and
   `git commit -m "test: cover <feature> in short regression"`.
3. Do not push unless the user asks.

## Step 3 — Run

```bash
python .opencode/skills/short-regression-test/scripts/regression.py
```

The script prints one `PASS`/`FAIL` line per check, then a Markdown table and a
`SUMMARY {...}` JSON line. It exits non-zero when any check fails. It stops with
a clear message when there is no device, the build is not debuggable, or the app
is not in Portuguese.

## Step 4 — Report

Answer with a Markdown table built from the script output:

| # | Check | Result |
| --- | --- | --- |
| 1 | home loads | PASS |
| ... | ... | ... |

Then add:

- A one-line summary (passed/failed).
- For each failure, the current screen texts printed by the script and the
  relevant `logcat` lines.
- A note that the run creates one test measurement (and how to remove it if the
  user wants a clean database).
- Which flows are not covered: camera scanning, AI parsing, and the system share
  sheet (PDF/image/file import).

## Rules

- Never change application code from this skill; only update the script.
- Never delete user data to make a check pass.
- Do not rebuild the native app unless a check fails because of native changes;
  JS changes are picked up by Metro.
