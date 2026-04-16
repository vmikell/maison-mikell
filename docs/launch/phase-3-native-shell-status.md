# Phase 3 Native Shell Status

## Done locally

- Replaced the stock Capacitor placeholder assets with Maison-branded draft assets for both platforms.
- Generated and saved source previews in `mobile/branding/`.
- Added a reproducible asset generator: `scripts/generate_native_brand_assets.py`.
- Added an npm shortcut: `npm run native:assets`.
- Re-synced the Capacitor shells after the asset update.

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
- `npm run cap:sync`

Both passed after the asset refresh.

## Current blockers for deeper native verification

### Android
- `./gradlew assembleDebug` is blocked in this environment because Java is not installed or `JAVA_HOME` is unset.
- Exact failure:
  - `ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.`

### iOS
- Xcode signing and device installs must still be done on macOS.

### Native auth gap
- Google sign-in is still using the Firebase **web** redirect flow in `src/lib/auth.js`.
- The native shell does not yet include a dedicated Capacitor Firebase / Google auth plugin.
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
1. Install a JDK and Android SDK if they are not already available.
2. Open `android/` in Android Studio.
3. Configure signing for debug/release builds.
4. Build and install on a real Android device.
5. Verify sign-in, resume/background behavior, and outbound links.
