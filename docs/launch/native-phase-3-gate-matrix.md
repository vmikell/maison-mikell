# Phase 3 Native Release Gate Matrix

Use this as the current source of truth for what is already done locally, what is still blocked by the machine, and what still requires real-device validation.

## Current readout

| Gate | Status | Evidence | Next move |
| --- | --- | --- | --- |
| Capacitor shells generated | ✅ Done | `6745878` | Keep using the existing `ios/` and `android/` shells. |
| Branded native assets | ✅ Done | `8fd8e26` | Final polish can wait until device testing confirms auth stability. |
| Native diagnostics panel | ✅ Done | `f95f33e` | Use it during every iPhone and Android auth test. |
| Auth redirect diagnostics persistence | ✅ Done | `47675fd` | Clear history before each fresh sign-in attempt, then copy the snapshot if anything breaks. |
| Native shell doctor | ✅ Done | `1e1e7ee` | Run `npm run native:doctor` before opening Xcode or Android Studio. |
| Callback readiness warnings surfaced | ✅ Done | `a75f616` | Treat the missing callback wiring as a known auth risk, not a surprise. |
| Android shell build on this machine | ✅ Done | `./gradlew assembleDebug` succeeds locally and produces `android/app/build/outputs/apk/debug/app-debug.apk` | Install the debug APK on a real device and validate auth behavior there. |
| Android callback return path wiring | ✅ Done | `android/app/src/main/AndroidManifest.xml` now declares a `VIEW` / `BROWSABLE` intent filter for `com.maisonmikell.app://auth` | Smoke-test the reserved callback route on a real Android device, then verify Google auth return behavior. |
| Android callback smoke helper | ✅ Done | `npm run native:android:callback-smoke` now wraps the adb deep-link launch | Use it to reduce setup friction during the first Android device pass. |
| iOS callback return path wiring | ✅ Done | `ios/App/App/Info.plist` now declares `CFBundleURLTypes` for `com.maisonmikell.app` | Smoke-test the reserved callback route on iPhone, then verify Google auth return behavior. |
| iOS shell opening and signing | ⏳ Manual | Shell exists, but no Xcode signing has been done locally here | Open `ios/App/App.xcodeproj` on macOS, configure signing for `com.maisonmikell.app`, then install on a real iPhone. |
| Real-device Google auth validation | ⏳ Manual | Not run yet | Test start, return-to-app, persistence, sign-out/sign-back-in, and background/resume on both platforms. |
| Native auth implementation certainty | ⚠️ Warning | `docs/launch/native-auth-mobile-audit.md` still marks native auth as unproven | If either platform is flaky, move to a dedicated native mobile auth path next. |

## Practical interpretation

### Ready now
- local web build still works
- Capacitor shells sync cleanly
- device-test diagnostics are in place
- Android debug APKs build locally on this Linux box
- the repo has a repeatable readiness check

### Not ready yet
- iPhone installs and signing
- confirmed OAuth return path behavior on devices
- store-submission confidence

## Recommended next execution order

1. Install `android/app/build/outputs/apk/debug/app-debug.apk` on a real Android device and smoke-test `com.maisonmikell.app://auth`.
   - fastest path once adb sees the phone: `npm run native:android:callback-smoke:install`
2. On macOS, open Xcode, configure signing, and install on a real iPhone.
3. Smoke-test `com.maisonmikell.app://auth` on iPhone too, then run the device checklist in `docs/launch/native-device-test-runbook.md`.
   - Record each pass with `docs/launch/native-device-test-results-template.md`.
4. Use the diagnostics panel plus copied snapshots to judge whether the current web redirect flow is viable in the native shells.
5. If auth handoff is unstable, stop polishing and switch to a real mobile auth path before store prep.

## Supporting docs

- `docs/launch/phase-3-native-shell-status.md`
- `docs/launch/native-device-test-runbook.md`
- `docs/launch/native-device-test-results-template.md`
- `docs/launch/native-auth-mobile-audit.md`
- `docs/launch/app-store-packaging-roadmap.md`
