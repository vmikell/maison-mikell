# iPhone Xcode Signing Checklist

Use this when the Maison iOS shell is opened on a Mac and we are ready to get the first real iPhone install done without wandering around Xcode.

## Goal

Get a signed Maison build onto a real iPhone as fast as possible so the first native auth pass can happen.

## Before opening Xcode

From the repo root:
- run `npm run native:doctor`
- confirm the repo still builds and the Capacitor shell is present
- confirm the app id is still `com.maisonmikell.app`

Files that matter:
- `ios/App/App.xcodeproj`
- `ios/App/App/Info.plist`
- `capacitor.config.json`

## Open the project

- On macOS, run `npm run cap:open:ios`
- Or open `ios/App/App.xcodeproj` directly in Xcode

## Signing setup

Inside Xcode:
1. Select the **App** project in the navigator.
2. Select the **App** target.
3. Open **Signing & Capabilities**.
4. Confirm the bundle identifier is `com.maisonmikell.app`.
5. Choose the correct Apple Team.
6. Let Xcode manage signing unless there is a specific reason not to.
7. Confirm a valid signing certificate and provisioning profile are selected.

## Device setup

1. Connect the iPhone by cable.
2. Unlock the phone.
3. If prompted, trust the Mac on the device.
4. In Xcode, choose the real iPhone as the run target.
5. If Developer Mode is required, enable it on the phone and reconnect.

## First install pass

1. Build and run from Xcode.
2. Confirm the Maison icon appears on the phone.
3. Confirm the splash screen looks correct.
4. Confirm the app opens without a white screen, black screen, or immediate crash.

## Callback smoke test

Before Google auth, verify the reserved callback path:
- paste or tap `com.maisonmikell.app://auth?source=safari` from Safari, Notes, or another tappable surface
- confirm Maison opens
- confirm the Native diagnostics panel records an `appUrlOpen` event

## First auth pass

Then run the device flow from `native-device-test-runbook.md`:
- Google sign-in start
- return to app
- session persistence after relaunch
- sign-out and sign-back-in
- background / resume
- outbound links

## If signing fails

Check these first:
- wrong Apple Team selected
- bundle id mismatch
- stale provisioning profile
- device not trusted
- Developer Mode not enabled on the phone
- old build cached on device

## Fast success criteria

This checklist counts as a success when:
- the app is installed on a real iPhone
- Maison launches cleanly
- callback smoke test works
- the phone is ready for the real Google auth pass

## Record the result

After the install/signing pass, log the outcome in:
- `docs/launch/native-device-test-results-template.md`
