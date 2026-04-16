# Native Google Auth Handoff

Use this when you are back at the machine and ready to finish the last setup needed for Maison's native Google auth bridge.

## Goal

Get Maison to the point where native Google auth can actually run on Android and iPhone, then immediately test it on real hardware.

## What is already done

- native Google auth bridge code is in place
- web auth still stays on the safe Firebase redirect flow
- `npm run native:doctor` now checks for the missing native Firebase pieces directly

## What still must be added by hand

### Android
Add:
- `android/app/google-services.json`

It needs to match:
- package name: `com.maisonmikell.app`

### iPhone
Add:
- `ios/App/App/GoogleService-Info.plist`

Then copy the file's `REVERSED_CLIENT_ID` value into:
- `ios/App/App/Info.plist`
- inside `CFBundleURLTypes` -> `CFBundleURLSchemes`

## Native build mode switch

For the native bridge to activate, set:

- `VITE_NATIVE_GOOGLE_AUTH_MODE=native-bridge`

If that value is not present for the native build, Maison will stay on the web redirect path even inside the Capacitor shell.

## Recommended sequence when back at the machine

1. Log in to Codex.
2. Connect the Android phone.
3. Add `android/app/google-services.json`.
4. Add `ios/App/App/GoogleService-Info.plist`.
5. Add the iPhone `REVERSED_CLIENT_ID` URL scheme to `Info.plist`.
6. Set `VITE_NATIVE_GOOGLE_AUTH_MODE=native-bridge` for the native build.
7. Run `npm run cap:sync`.
8. Run `npm run native:doctor`.
9. If doctor is clean enough, run `npm run native:android:build-debug`.
10. Install on Android and run the first real device pass.
11. Move to iPhone right after that.

## What counts as ready

Maison is ready for the real native auth pass when:
- `npm run native:doctor` no longer warns about missing Google mobile config files
- Android debug build still succeeds
- the Android phone is attached and callback smoke test works
- the iPhone shell has the reversed client ID scheme wired

## After setup

Run these in order:
- `npm run native:doctor`
- `npm run native:android:build-debug`
- `npm run native:android:callback-smoke:install`

Then use:
- `docs/launch/native-first-device-pass-worksheet.md`
- `docs/launch/native-device-test-runbook.md`

## If it still fails

If Google auth is unstable after this setup:
- treat it as a real blocker
- use `docs/launch/native-auth-fallback-plan.md`
- do not waste time polishing around broken auth
