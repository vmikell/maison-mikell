# Native Auth Fallback Plan

Use this if the first real iPhone or Android device pass shows that Google sign-in is unstable inside the current Capacitor shell.

This document exists so the team does not improvise under pressure after the first flaky auth run.

## Trigger condition

Switch from investigation mode to fallback execution if **either** platform shows any of these during real-device testing:

- Google sign-in starts but does not return cleanly to Maison
- redirect loop after sign-in
- blank screen after auth
- session is lost after relaunch
- background / resume breaks auth state
- browser or Custom Tab handoff returns inconsistently

If that happens, treat it as a **Phase 3 blocker**, not a polish issue.

## Decision rule

### Green
Both platforms pass.
- Keep the current Firebase web redirect flow.
- Continue store prep.

### Yellow
One platform is flaky.
- Stop assuming the web redirect flow is safe enough.
- Move to a native-capable auth path before more polish.

### Red
Both platforms are flaky.
- Pause packaging polish.
- Move auth remediation to the top of the queue.

## Recommended fallback choice

If the fallback is triggered, the preferred next move is:

## Option A, recommended: native Google auth integration for Capacitor

Status now: **partially implemented**.

Why this is still the default recommendation:
- best chance of reliable iPhone and Android login UX
- better fit for store-ready builds than continuing to force a web redirect flow inside a WebView
- reduces dependence on hosted-web assumptions that may keep breaking inside native shells

What is already in place:
- a Capacitor Firebase Authentication plugin is installed
- Maison can now request native Google sign-in and bridge the returned token into the Firebase JS SDK
- the path is gated behind `VITE_NATIVE_GOOGLE_AUTH_MODE=native-bridge`, so normal web auth stays on the current redirect flow

What still must happen before calling this fallback complete:
- add real Android and iOS Firebase mobile config files
- wire the iOS reversed client ID URL scheme from `GoogleService-Info.plist`
- verify sign-in, relaunch persistence, and sign-out on real devices

## Option B, fallback if Option A is blocked: hosted browser plus deep-link callback

Use this only if native plugin integration is blocked or proves unexpectedly messy.

Why it is second choice:
- still depends on cross-app handoff behavior
- still needs careful return-to-app validation
- more moving parts than a cleaner native sign-in path

## Immediate execution sequence after a failed first pass

1. Stop further store-polish work.
2. Save the diagnostics evidence.
3. Record whether the failure happened on iPhone, Android, or both.
4. Classify the failure:
   - no return to app
   - loop after return
   - blank screen
   - session loss
   - resume/background corruption
5. Decide whether the fallback path is **Option A** or **Option B**.
6. Open a focused auth-remediation branch.
7. Do not resume packaging polish until the replacement auth path is verified on real devices.

## Evidence to capture before changing implementation

For every auth failure, save:
- device model
- OS version
- exact step that broke
- whether Safari, Chrome, or Custom Tabs opened
- whether Maison returned to app at all
- copied Native diagnostics snapshot
- screenshot or screen recording
- whether relaunch temporarily fixes it

This evidence matters because it tells us whether the failure is:
- callback routing
- WebView redirect handling
- Firebase redirect result recovery
- session persistence
- lifecycle/resume handling

## Scope of fallback implementation

The replacement auth work should cover all of these before it is considered done:

- Google sign-in start on iPhone
- Google sign-in start on Android
- clean return to Maison
- Firebase-authenticated session establishment
- relaunch persistence
- sign-out and sign-back-in
- background / resume stability
- no blank-screen or redirect-loop regressions

## What does not count as success

These are false positives and should not be treated as a pass:
- callback smoke test works, but Google auth is still flaky
- one platform passes while the other is unstable
- sign-in works once but fails on relaunch
- auth works only when the app stays foregrounded
- auth works only on simulator/emulator but not on a real device

## Proposed execution order if fallback is triggered

1. Confirm the failure on at least one real device pass.
2. Freeze non-auth launch polish.
3. Implement the native-capable auth path.
4. Re-run the full checklist in `docs/launch/native-device-test-runbook.md`.
5. Record results in `docs/launch/native-device-test-results-template.md`.
6. Only then reopen store-prep work.

## Recommended owner mindset

If the fallback is triggered, that is not a surprise and not a setback in judgment.
It is the exact risk already called out in the launch docs.

The goal is not to defend the current auth path.
The goal is to get to a stable, store-safe mobile auth flow as fast and cleanly as possible.
