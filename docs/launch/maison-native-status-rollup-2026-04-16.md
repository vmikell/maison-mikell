# Maison Mikell Native Readiness Rollup

Prepared for Victor, April 16, 2026

## Bottom line

Maison Mikell is meaningfully further along on native packaging than it was a day ago, but it is **not yet store-ready**.

The current state is:
- the Capacitor shells exist for both iPhone and Android
- branded native assets are in place
- native diagnostics are in place
- Android now builds locally on the Linux machine
- an app-owned callback route is wired on both platforms
- the biggest remaining risk is still **real-device Google sign-in behavior inside the native shells**

## Executive readout

| Area | Status | What it means |
| --- | --- | --- |
| Capacitor shell generation | Done | `ios/` and `android/` shells already exist and continue to sync cleanly. |
| Branded native assets | Done | Draft Maison icons and splash assets are already applied. |
| Diagnostics and readiness tooling | Done | Native diagnostics panel plus `npm run native:doctor` are available for testing. |
| Android local build | Done | `cd android && ./gradlew assembleDebug` now succeeds on this Linux box. |
| Android callback smoke helper | Done | `npm run native:android:callback-smoke` reduces adb friction during device testing. |
| iOS signing and installs | Pending manual work | Still needs Xcode on macOS and a real iPhone. |
| Real-device auth verification | Not done yet | The highest-risk path is still unproven on actual hardware. |
| Store-readiness confidence | Not ready yet | Device auth stability has to pass before store polish matters. |

## What is done right now

### Native shell prep
- Capacitor app identity is already set to `com.maisonmikell.app`.
- Maison-branded assets replaced the default Capacitor placeholders.
- Capacitor shells have been re-synced after asset updates.

### Native visibility and debugging
- A **Native diagnostics** panel now appears automatically inside the packaged shells.
- Runtime listeners capture app state changes, pause/resume activity, launch URLs, and `appUrlOpen` callback events.
- Diagnostics history persists through reloads, which matters for redirect-based auth testing.
- The same diagnostics panel can be exposed in a browser with `?nativeDebug=1` for comparison.

### Callback-path scaffolding
- The reserved callback route `com.maisonmikell.app://auth` is now wired on Android and iOS.
- That route can be smoke-tested independently of Google auth.
- Android now has one-command callback helpers:
  - `npm run native:android:callback-smoke`
  - `npm run native:android:callback-smoke:install`

### Local verification already completed
- `npm run build`
- `npm run lint`
- `npm run cap:sync`
- `npm run native:doctor`
- `cd android && ./gradlew assembleDebug`
- `node scripts/native_android_callback_smoke.mjs --help`

## The real blocker

The current Google sign-in path is still the Firebase **web redirect** flow inside the Capacitor shell.

That means:
- the web app behavior is improved, but native behavior is still not proven
- Android and iPhone both run inside native WebViews, not the same environment as the hosted site
- redirect return-to-app behavior, persistence, and resume behavior can still fail even if the web app looks fine

## Practical risk call

Before a real device pass, native auth should still be treated as **unproven**.

If the first phone tests show instability, the right move is **not** more shell polish.
The right move is switching to a dedicated native-capable auth path.

## What later today should look like

## Android first pass
1. Run `npm run native:doctor`
2. Connect the device over adb
3. Run `npm run native:android:callback-smoke:install`
4. Confirm the diagnostics panel logs the callback event
5. Test Google sign-in start, return to app, persistence, sign-out/sign-back-in, and background/resume

## iPhone first pass
1. Open `ios/App/App.xcodeproj` in Xcode on macOS
2. Configure Apple signing for `com.maisonmikell.app`
3. Install on a real iPhone
4. Smoke-test `com.maisonmikell.app://auth`
5. Test the same auth, persistence, and resume flows as Android

## Decision rule after the first device pass

### Green
Both platforms handle Google auth cleanly.
- Keep the current auth flow.
- Continue store-prep work.

### Yellow
One platform is flaky.
- Stop assuming the web redirect flow is good enough.
- Move to native auth integration before more polish.

### Red
Both platforms are flaky.
- Pause store packaging polish.
- Fix auth first.

## Recommendation

The project is in a good **pre-device-test** state now.

The smartest next move is simple:
- use the current tooling to run the first real Android and iPhone passes
- treat those results as the gate for everything else
- if auth handoff is unstable on either platform, switch to native auth integration immediately instead of polishing around a broken core flow

## Short version

Maison Mikell native is now **prepared for real-device testing**, especially on Android, but it is **not yet validated**.

The biggest unknown is still mobile Google auth inside the Capacitor shells.
That first real device pass is the thing that decides whether Phase 3 stays green or turns into an auth-fix sprint.
