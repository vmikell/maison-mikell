# Native Auth Mobile Audit

## Current implementation

Maison now has two Google auth paths:

- Web still uses the Firebase web SDK redirect flow in `src/lib/auth.js` via `signInWithRedirect(auth, provider)` and `getRedirectResult(auth)`.
- Native shells can now use `@capacitor-firebase/authentication` to launch Google sign-in natively, return an ID token, and bridge that credential back into the Firebase JS SDK with `signInWithCredential(...)`.
- The Firebase auth bootstrap now uses IndexedDB persistence on Capacitor so the bridged JS session survives app relaunches more reliably.
- `src/lib/googleAuthStrategy.js` remains the decision point. The native bridge is enabled when `VITE_NATIVE_GOOGLE_AUTH_MODE=native-bridge`. Web builds still stay on the web redirect flow.
- `capacitor.config.json` now registers the Firebase Authentication plugin with `skipNativeAuth: true` and `providers: ["google.com"]`, which keeps Maison's existing JS auth and Firestore usage intact.
- Android now has the required plugin variable scaffold in `android/variables.gradle` for Google provider support.
- The app still includes the passive diagnostics surface backed by `@capacitor/app`, plus persistent local auth/runtime event history, so device tests can capture lifecycle, callback, and redirect evidence without changing auth behavior.
- The shell still reserves an app-owned callback route, `com.maisonmikell.app://auth`, through the Android manifest and iOS URL-type configuration.

## Why this matters for Phase 3

This Google flow is now verified on the hosted web app, but native packaging changes the runtime:

- Android Capacitor runs from a local WebView origin such as `http://localhost`.
- iOS Capacitor typically runs from a local app WebView origin rather than the public site.
- Firebase redirect auth may behave differently in a native WebView than it does on Netlify or Firebase Hosting.

That means Google sign-in is now the biggest native-shell risk even though the web flow is fixed.

## Current assessment

Before real-device testing, the native auth path should be treated as **unproven**.

The shell currently has:
- working Capacitor packaging
- branded native assets
- default Capacitor app delegates / activities
- diagnostics and doctor tooling
- reserved callback-path scaffolding for `com.maisonmikell.app://auth`

The shell still does **not** yet have:
- checked-in mobile Firebase client config files (`android/app/google-services.json`, `ios/App/App/GoogleService-Info.plist`)
- the iOS reversed-client-id URL scheme wired from a real `GoogleService-Info.plist`
- provider-specific, end-to-end verified Google auth behavior on real iPhone / Android hardware
- proof yet that native sign-in, relaunch persistence, and sign-out are clean on devices

The shell **does** now have a real first-pass native auth implementation:
- a strategy layer that can switch between web redirect and native bridge mode without rewriting the sign-in UI
- a native Google sign-in bridge that turns the returned mobile credential into the existing Firebase JS session

## Recommended Phase 3 path

### First pass, finish native wiring and verify on devices

1. Add the real Firebase mobile config files for Android and iOS.
2. On iOS, add the reversed client ID URL scheme from `GoogleService-Info.plist`.
3. Build fresh native shells with `npx cap sync`.
4. Test:
   - Google sign-in start
   - Google return to app
   - JS-session establishment after native sign-in
   - session persistence after app restart
   - sign-out and sign-back-in
   - outbound links
   - background / resume behavior

### If Google auth is flaky in native shells

Do **not** keep forcing the raw web redirect flow.

Instead, move to a dedicated native auth path, likely one of these:

1. **Native Firebase / Google auth plugin for Capacitor**
   - preferred if we want the cleanest iOS and Android login UX
   - likely the best long-term option for store builds

2. **Hosted browser + deep-link callback approach**
   - possible fallback if we want to keep more of the auth logic on the web side
   - still requires careful deep-link and callback verification

## Recommendation

For store-ready mobile builds, plan on **native Google auth integration if device tests expose any redirect instability at all**.

That is the safest assumption right now.

## Practical next decision

After the first real-device auth test, choose one of these immediately:

- **Green path:** native shell already handles Google auth cleanly, keep current flow.
- **Yellow path:** Android works but iPhone is flaky, switch to native auth integration before further polish.
- **Red path:** both devices are unreliable, pause store polish and fix auth first.
