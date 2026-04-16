# Native Device Test Runbook

Use this once the Maison Mikell Capacitor shells are opened in Xcode and Android Studio.

## Goal

Validate that the packaged native apps behave like the live web app where it matters most:

- launch cleanly
- sign in correctly
- stay signed in
- survive background / resume
- open external links safely
- avoid auth loops or blank screens

Use `docs/launch/native-device-test-results-template.md` to capture each device pass in a consistent format.

## Test accounts

Prepare before testing:

- one owner account
- one member account
- one invite code for a real shared-household join flow

## Diagnostics panel

- In the packaged iPhone and Android shells, Maison now shows a **Native diagnostics** panel automatically.
- Use it to confirm the current runtime, platform, URL, latest lifecycle changes, and any `appUrlOpen` callback events.
- Tap **Copy snapshot** whenever a flow breaks so you have a clean event trace to paste into notes.
- Tap **Clear history** before a fresh auth attempt if you want a clean redirect trace.
- The diagnostics history now survives auth redirects and reloads, which helps when Google hands control out to Safari, Chrome, or Custom Tabs before returning.
- In a normal desktop or mobile browser, you can reveal the same panel with `?nativeDebug=1` for quick comparison without changing default web behavior.

## Before opening the native IDEs

- Run `npm run native:doctor` from the repo root.
- Use it as a quick readiness check for Java, Android SDK wiring, Capacitor shell presence, and basic project wiring before you lose time in Xcode or Android Studio.
- Confirm the doctor reports the reserved app callback route too. Right now it should show Android callback routing for `com.maisonmikell.app://auth` and matching iOS `CFBundleURLTypes` for `com.maisonmikell.app`.
- If you want to test the new native Google path instead of the web redirect path, build with `VITE_NATIVE_GOOGLE_AUTH_MODE=native-bridge`.
- Before that native test, add `android/app/google-services.json` and `ios/App/App/GoogleService-Info.plist`, then wire the iOS reversed client ID URL scheme from the plist into Xcode.

## Optional callback-path smoke test

Use this before Google auth if you want to verify the shell can reopen itself with the reserved callback route, independent of Firebase behavior.

### iPhone
- On Simulator, run:
  - `xcrun simctl openurl booted "com.maisonmikell.app://auth?source=simctl"`
- On a real iPhone, tap or paste `com.maisonmikell.app://auth?source=safari` into Safari, Notes, or another tappable surface.
- Confirm Maison opens and the diagnostics panel records an `appUrlOpen` event.

### Android
- One-command helper from the repo root:
  - `npm run native:android:callback-smoke`
- Or install the debug APK first and then trigger the callback in one pass:
  - `npm run native:android:callback-smoke:install`
- With a connected device, run:
  - `adb shell am start -W -a android.intent.action.VIEW -d "com.maisonmikell.app://auth?source=adb" com.maisonmikell.app`
- Confirm Maison opens and the diagnostics panel records an `appUrlOpen` event.

This smoke test proves only that the shell can handle the reserved callback route. It does **not** prove that Google auth itself is stable yet.

## iPhone runbook

### 1. Install and boot
- Install the debug build from Xcode onto a real iPhone.
- Confirm the Maison icon and splash screen look correct.
- Confirm the app opens without a white screen, black screen, or crash.

### 2. Fresh launch auth test
- If already signed in, sign out first.
- Expand the **Native diagnostics** panel before starting so the event list is visible.
- Note whether this build is using web redirect mode or `native-bridge` mode.
- Tap **Continue with Google**.
- Confirm Google sign-in opens correctly.
- Complete sign-in.
- In `native-bridge` mode, confirm Maison returns with a signed-in JS session even if there is no Firebase web redirect round-trip.
- In web redirect mode, confirm Maison returns to the app instead of getting stuck in Safari / browser tabs.
- Confirm the app lands in the expected household flow.
- Confirm the diagnostics panel records the URL transition and any lifecycle / callback events during the return.

### 3. Session persistence
- Force close the app.
- Re-open it.
- Confirm the user is still signed in.
- Confirm the correct household data loads.

### 4. Background / resume
- Open the app.
- Send it to the background for 10 seconds.
- Return to the app.
- Repeat after a few minutes.
- Confirm no auth loop, blank screen, or stale loading state appears.
- Confirm the diagnostics panel records the pause / resume sequence instead of going silent.

### 5. Shared-household flow
- Test invite-code join on device.
- Confirm a member can enter the code and land in the right household.
- Confirm owner/member role behavior still looks right.

### 6. Outbound link behavior
- Tap any external product / shopping link.
- Confirm it opens outside the app cleanly.
- Return to the app and confirm Maison still works.

### 7. Failure capture
If anything breaks, record:
- exact step
- device model + iOS version
- whether Safari opened
- whether Maison returned to app
- copied diagnostics snapshot
- screenshot / screen recording
- whether relaunch fixes it

## Android runbook

### 1. Install and boot
- Install the debug build from Android Studio, or run `npm run native:android:callback-smoke:install` if adb already sees the device.
- Confirm the Maison icon and splash screen look correct.
- Confirm the app opens without crash or blank screen.

### 2. Fresh launch auth test
- If already signed in, sign out first.
- Expand the **Native diagnostics** panel before starting so the event list is visible.
- Note whether this build is using web redirect mode or `native-bridge` mode.
- Tap **Continue with Google**.
- Confirm Google sign-in opens correctly.
- Complete sign-in.
- In `native-bridge` mode, confirm Maison returns with a signed-in JS session even if there is no Firebase web redirect round-trip.
- In web redirect mode, confirm Maison returns to the app instead of getting stuck in Chrome / Custom Tabs.
- Confirm the app lands in the expected household flow.
- Confirm the diagnostics panel records the URL transition and any lifecycle / callback events during the return.

### 3. Session persistence
- Swipe the app away.
- Re-open it.
- Confirm the user is still signed in.
- Confirm household data reloads correctly.

### 4. Background / resume
- Put the app in background.
- Re-open it after a short wait.
- Re-open it after a longer wait.
- Confirm the app resumes without auth breakage or duplicate redirects.
- Confirm the diagnostics panel records pause / resume or app-state transitions.

### 5. Shared-household flow
- Test invite-code join.
- Confirm the member lands in the right household.
- Confirm the owner can still manage the household correctly.

### 6. Outbound link behavior
- Tap an external link.
- Confirm it opens correctly.
- Return to Maison and confirm it is still stable.

### 7. Failure capture
If anything breaks, record:
- exact step
- device model + Android version
- whether Chrome / Custom Tab opened
- whether Maison returned to app
- copied diagnostics snapshot
- screenshot / screen recording
- whether relaunch fixes it

## Pass / fail rules

### Pass
- Google sign-in completes and returns to Maison reliably on both platforms.
- The session survives relaunch.
- Background / resume does not break auth.
- No blank-screen or redirect-loop behavior appears.

### Fail
Any of these should count as a Phase 3 blocker:
- Google sign-in opens but does not return cleanly
- redirect loop
- blank screen after auth
- session loss on relaunch
- background / resume breaks auth state

## Decision after first device pass

### If both platforms pass
Keep the current auth flow and continue deeper store prep.

### If either platform is flaky
Treat native auth as the next engineering task and switch from the raw web redirect assumption to a native-capable mobile auth path.
