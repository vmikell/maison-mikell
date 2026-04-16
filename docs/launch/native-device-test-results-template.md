# Native Device Test Results Template

Copy this into a new dated note for each real-device validation pass.

Suggested filename pattern:
- `docs/launch/test-results/2026-04-16-iphone-15-pro-ios-18-2.md`
- `docs/launch/test-results/2026-04-16-pixel-8-android-15.md`

---

## Session metadata

- Date:
- Tester:
- Platform: iPhone / Android
- Device model:
- OS version:
- App build source:
- Git commit under test:
- Signed in account used:
- Invite code used:

## Pre-flight

- `npm run native:doctor` reviewed: yes / no
- Doctor blockers present:
- Doctor warnings present:
- Diagnostics history cleared before test: yes / no

## Result summary

- Overall result: pass / mixed / fail
- Most important finding:
- Should Phase 3 continue unchanged: yes / no
- If no, what should happen next:

## Test checklist

### 1. Install and boot
- Result: pass / fail
- Notes:

### 2. Fresh Google sign-in
- Result: pass / fail
- Did external browser or auth surface open correctly?
- Did Maison return to the app?
- Notes:

### 3. Session persistence after relaunch
- Result: pass / fail
- Notes:

### 4. Background / resume
- Result: pass / fail
- Notes:

### 5. Shared-household join flow
- Result: pass / fail / not tested
- Notes:

### 6. Outbound link behavior
- Result: pass / fail / not tested
- Notes:

### 7. Sign-out and sign-back-in
- Result: pass / fail / not tested
- Notes:

## Diagnostics capture

### Latest visible diagnostics summary
- Runtime:
- Platform:
- App state:
- Current URL:
- Stored events count:
- Latest event type:
- Latest event time:

### Copied diagnostics snapshot
Paste the copied snapshot here.

```json

```

## Issue log

### Issue 1
- Step where it happened:
- Exact behavior:
- Expected behavior:
- Did relaunch fix it:
- Screenshot / recording reference:
- Severity: blocker / major / minor

### Issue 2
- Step where it happened:
- Exact behavior:
- Expected behavior:
- Did relaunch fix it:
- Screenshot / recording reference:
- Severity: blocker / major / minor

## Final call

- Native Google auth looks viable with current web redirect flow: yes / no / unclear
- Recommended next action:
- Anything that must be fixed before more polish:
