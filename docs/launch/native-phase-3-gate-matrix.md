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
| Android shell build on this machine | ⛔ Blocked | `npm run native:doctor` reports missing Java / JDK and missing `ANDROID_HOME` / `ANDROID_SDK_ROOT` | Install a JDK, install Android SDK tools, set the env vars, then retry the doctor and Gradle build. |
| Android callback return path wiring | ⚠️ Warning | Doctor reports no Android `VIEW` intent filter in `android/app/src/main/AndroidManifest.xml` | If the team moves to a native mobile auth callback path, wire the chosen scheme/host deliberately instead of guessing. |
| iOS callback return path wiring | ⚠️ Warning | Doctor reports no `CFBundleURLTypes` entry in `ios/App/App/Info.plist` | Add the real callback scheme only when the mobile auth path is chosen. |
| iOS shell opening and signing | ⏳ Manual | Shell exists, but no Xcode signing has been done locally here | Open `ios/App/App.xcodeproj` on macOS, configure signing for `com.maisonmikell.app`, then install on a real iPhone. |
| Real-device Google auth validation | ⏳ Manual | Not run yet | Test start, return-to-app, persistence, sign-out/sign-back-in, and background/resume on both platforms. |
| Native auth implementation certainty | ⚠️ Warning | `docs/launch/native-auth-mobile-audit.md` still marks native auth as unproven | If either platform is flaky, move to a dedicated native mobile auth path next. |

## Practical interpretation

### Ready now
- local web build still works
- Capacitor shells sync cleanly
- device-test diagnostics are in place
- the repo has a repeatable readiness check

### Not ready yet
- Android builds on this Linux box
- iPhone installs and signing
- confirmed OAuth return path behavior on devices
- store-submission confidence

## Recommended next execution order

1. On an Android-capable machine, install Java and the Android SDK, then run:
   - `npm run native:doctor`
   - `./gradlew assembleDebug`
2. On macOS, open Xcode, configure signing, and install on a real iPhone.
3. Run the device checklist in `docs/launch/native-device-test-runbook.md`.
4. Use the diagnostics panel plus copied snapshots to judge whether the current web redirect flow is viable in the native shells.
5. If auth handoff is unstable, stop polishing and switch to a real mobile auth path before store prep.

## Supporting docs

- `docs/launch/phase-3-native-shell-status.md`
- `docs/launch/native-device-test-runbook.md`
- `docs/launch/native-auth-mobile-audit.md`
- `docs/launch/app-store-packaging-roadmap.md`
