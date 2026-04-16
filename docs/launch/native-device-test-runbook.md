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

## Test accounts

Prepare before testing:

- one owner account
- one member account
- one invite code for a real shared-household join flow

## Diagnostics panel

- In the packaged iPhone and Android shells, Maison now shows a **Native diagnostics** panel automatically.
- Use it to confirm the current runtime, platform, URL, latest lifecycle changes, and any `appUrlOpen` callback events.
- Tap **Copy snapshot** whenever a flow breaks so you have a clean event trace to paste into notes.
- In a normal desktop or mobile browser, you can reveal the same panel with `?nativeDebug=1` for quick comparison without changing default web behavior.

## iPhone runbook

### 1. Install and boot
- Install the debug build from Xcode onto a real iPhone.
- Confirm the Maison icon and splash screen look correct.
- Confirm the app opens without a white screen, black screen, or crash.

### 2. Fresh launch auth test
- If already signed in, sign out first.
- Expand the **Native diagnostics** panel before starting so the event list is visible.
- Tap **Continue with Google**.
- Confirm Google sign-in opens correctly.
- Complete sign-in.
- Confirm Maison returns to the app instead of getting stuck in Safari / browser tabs.
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
- Install the debug build from Android Studio.
- Confirm the Maison icon and splash screen look correct.
- Confirm the app opens without crash or blank screen.

### 2. Fresh launch auth test
- If already signed in, sign out first.
- Expand the **Native diagnostics** panel before starting so the event list is visible.
- Tap **Continue with Google**.
- Confirm Google sign-in opens correctly.
- Complete sign-in.
- Confirm Maison returns to the app instead of getting stuck in Chrome / Custom Tabs.
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
