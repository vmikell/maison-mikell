# Native First Device Pass Worksheet

Use this as the tight, no-drift worksheet for the very first real-device Maison native pass.

This is intentionally shorter than the runbook. It is the execution sheet.

## Device under test

- Platform: iPhone / Android
- Model:
- OS version:
- Build installed:
- Tester:
- Date:

## Preflight

- [ ] `npm run native:doctor` passed
- [ ] Correct build installed on device
- [ ] Native diagnostics panel visible
- [ ] Diagnostics history cleared before auth attempt
- [ ] Test account ready
- [ ] Invite code ready for shared-household flow

## Callback smoke test

- [ ] Open `com.maisonmikell.app://auth?...`
- [ ] Maison reopens successfully
- [ ] `appUrlOpen` event appears in diagnostics
- Notes:

## Google auth start

- [ ] Tap **Continue with Google**
- [ ] Google sign-in screen opens correctly
- [ ] No immediate blank screen or loop
- Notes:

## Google auth return

- [ ] Complete Google sign-in
- [ ] Maison returns to app cleanly
- [ ] No stuck Safari / Chrome / Custom Tab state
- [ ] Diagnostics snapshot copied if anything looked wrong
- Notes:

## Signed-in state

- [ ] Correct household flow appears
- [ ] No missing data on first load
- [ ] No auth error banner
- Notes:

## Relaunch persistence

- [ ] Force close the app
- [ ] Reopen it
- [ ] User is still signed in
- [ ] Household data still loads correctly
- Notes:

## Background / resume

- [ ] Send app to background briefly
- [ ] Return to app
- [ ] Repeat after a longer wait
- [ ] No auth breakage, loop, or stale screen
- Notes:

## Shared-household flow

- [ ] Invite code flow works
- [ ] Member lands in correct household
- [ ] Owner/member behavior still looks correct
- Notes:

## Outbound links

- [ ] External link opens correctly
- [ ] Returning to Maison does not break state
- Notes:

## Failure classification

If the pass fails, choose the closest bucket:
- [ ] no return to app
- [ ] redirect loop
- [ ] blank screen after auth
- [ ] session loss after relaunch
- [ ] background/resume auth break
- [ ] other

## Evidence captured

- [ ] device model and OS written down
- [ ] exact failing step recorded
- [ ] diagnostics snapshot copied
- [ ] screenshot or screen recording saved
- [ ] whether relaunch temporarily fixes it recorded

## Final call

- [ ] PASS, current auth flow is viable on this device
- [ ] FAIL, trigger `native-auth-fallback-plan.md`

## One-line summary

Write the outcome in one blunt sentence:

> Example: Android Pixel 8 passed callback smoke test but failed Google return-to-app, triggered native auth fallback.
