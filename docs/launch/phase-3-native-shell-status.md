# Phase 3 Native Shell Status

See also: `docs/launch/native-phase-3-gate-matrix.md`

## Done locally

- Replaced the stock Capacitor placeholder assets with Maison-branded draft assets for both platforms.
- Generated and saved source previews in `mobile/branding/`.
- Added a reproducible asset generator: `scripts/generate_native_brand_assets.py`.
- Added an npm shortcut: `npm run native:assets`.
- Re-synced the Capacitor shells after the asset update.
- Added a native diagnostics panel that appears automatically inside Capacitor shells.
- Added passive runtime listeners through `@capacitor/app` for app state changes, pause / resume, launch URL capture, and `appUrlOpen` callbacks.
- Added persistent local diagnostics history so auth redirect attempts and return-path evidence survive page reloads until manually cleared.
- Added a web-only debug escape hatch via `?nativeDebug=1` so the same diagnostics surface can be checked in a browser without changing normal web behavior.
- Added `npm run native:doctor` to quickly report whether the local machine is actually ready for Android / iOS device testing.
- Reserved an app-owned callback route, `com.maisonmikell.app://auth`, in the Android manifest and iOS URL types so the native shell can be smoke-tested without changing the current web auth flow.
- Added Android callback smoke helpers so a connected device can install the debug APK and trigger the reserved callback route from one repo command.

## Files updated by the asset pass

### iOS
- `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png`
- `ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png`
- `ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-1.png`
- `ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-2.png`

### Android
- `android/app/src/main/res/mipmap-*/ic_launcher.png`
- `android/app/src/main/res/mipmap-*/ic_launcher_round.png`
- `android/app/src/main/res/mipmap-*/ic_launcher_foreground.png`
- `android/app/src/main/res/drawable*/splash.png`
- `android/app/src/main/res/values/ic_launcher_background.xml`

## Verification completed

- `npm run build`
- `npm run lint`
- `npm run cap:sync`
- `npm run native:doctor`
- `cd android && ./gradlew assembleDebug`
- `node scripts/native_android_callback_smoke.mjs --help`

All passed after the native shell prep updates.

## Current blockers and remaining native verification gaps

### Android
- User-local Java and Android SDK tooling are now installed on this Linux box.
- `./gradlew assembleDebug` now succeeds locally and produces a debug APK.
- `npm run native:android:callback-smoke` can now trigger `com.maisonmikell.app://auth` over adb when a device is attached.
- Real-device install, signing choices, and callback round-trip verification still need Android Studio and hardware.

### iOS
- Xcode signing and device installs must still be done on macOS.

### Native auth gap
- Google sign-in is still using the Firebase **web** redirect flow in `src/lib/auth.js`.
- The native shell does not yet include a dedicated Capacitor Firebase / Google auth plugin.
- The new diagnostics panel improves device-test visibility, but it does **not** change the auth implementation itself.
- The shell now reserves an app-owned callback path, `com.maisonmikell.app://auth`, on both platforms so return-to-app handling can be smoke-tested independently of Google auth.
- That reserved callback path is only scaffolding. It does **not** prove that the current Google auth redirect flow is stable inside the Capacitor WebView.
- That means the biggest remaining Phase 3 risk is real-device Google auth behavior inside the Capacitor WebView.
- Detailed notes are captured in `docs/launch/native-auth-mobile-audit.md`.
- Device validation steps are captured in `docs/launch/native-device-test-runbook.md`.

## Next manual Phase 3 steps

### iOS
1. Open `ios/App/App.xcodeproj` in Xcode.
2. Configure Apple signing for `com.maisonmikell.app`.
3. Run on a real iPhone.
4. Verify Google sign-in redirect and session persistence.
5. Verify outbound links and any deep-link flows.

### Android
1. Open `android/` in Android Studio or install `android/app/build/outputs/apk/debug/app-debug.apk` on a real Android device.
2. Configure signing for debug/release builds as needed.
3. Run `npm run native:android:callback-smoke` and confirm the diagnostics panel captures the callback event.
4. Verify sign-in, resume/background behavior, and outbound links.
