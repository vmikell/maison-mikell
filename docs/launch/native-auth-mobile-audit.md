# Native Auth Mobile Audit

## Current implementation

Maison currently uses the Firebase web SDK auth flow inside the app shell:

- `src/lib/auth.js` uses `signInWithRedirect(auth, provider)` for Google sign-in.
- `src/lib/auth.js` also expects `getRedirectResult(auth)` to complete inside the same web runtime after the redirect returns.
- `package.json` includes Capacitor core packages, but no native Firebase / Google auth Capacitor plugin yet.
- `android/app/src/main/java/com/maisonmikell/app/MainActivity.java` is still the default `BridgeActivity`.
- `ios/App/App/AppDelegate.swift` is still the default Capacitor delegate proxy setup.

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

The shell does **not** yet have:
- a native Google sign-in plugin
- a native Firebase auth bridge
- a confirmed deep-link return path for mobile OAuth
- verified persistence behavior on actual iPhone / Android hardware

## Recommended Phase 3 path

### First pass, verify on devices

1. Install the current shell on a real iPhone.
2. Install the current shell on a real Android device.
3. Test:
   - Google sign-in start
   - Google return to app
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
