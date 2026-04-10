# Maison Mikell App Store Packaging Roadmap

## Recommendation

Use **Capacitor** to wrap the existing Vite + React app for iOS and Android.

Why this is the right path now:
- fastest route to shipping on both stores
- preserves the current codebase
- supports gradual addition of native features later
- avoids premature full native rewrites

## Target architecture

- Frontend: existing React/Vite app
- Backend: Firebase Auth + Firestore
- Hosting: Netlify for web
- Mobile shell: Capacitor
- Native additions later: push notifications, deep links, app icons, splash screens, store billing hooks

## Phase 1: Prepare the web app for native wrapping

- [ ] Confirm all routes work cleanly in a webview.
- [ ] Audit Firebase auth behavior in a native context.
- [ ] Decide whether Google sign-in should use redirect, popup fallback, or a native plugin path.
- [ ] Remove dependencies on browser-only assumptions.
- [ ] Ensure environment config can be provided safely for app builds.

## Phase 2: Add Capacitor

- [ ] Install Capacitor packages.
- [ ] Initialize Capacitor in the Maison Mikell project.
- [ ] Set app id and app name.
- [ ] Point Capacitor to the Vite build output.
- [ ] Generate iOS and Android projects.

Recommended app identity draft:
- App name: Maison Mikell
- Bundle ID: `com.maisonmikell.app`

## Phase 3: Native shell setup

### iOS
- [ ] Open in Xcode.
- [ ] Configure signing.
- [ ] Add icons and launch assets.
- [ ] Test authentication and session persistence on a real iPhone.
- [ ] Test deep links and outbound links.

### Android
- [ ] Open in Android Studio.
- [ ] Configure application id and signing.
- [ ] Add icons and launch assets.
- [ ] Test authentication and session persistence on a real Android device.
- [ ] Test background/resume behavior.

## Phase 4: Store-readiness

- [ ] App privacy disclosures
- [ ] screenshots for phones
- [ ] app description and keywords
- [ ] support URL
- [ ] privacy policy URL
- [ ] terms URL
- [ ] review credentials/instructions if needed

## Phase 5: Billing

Decision needed:
- If the mobile apps are sold with in-app digital subscriptions, native billing compliance becomes important.

Recommended direction:
- launch with Apple App Store subscriptions and Google Play subscriptions if billing is inside the native apps
- keep pricing structure consistent across web and native

## First execution milestone

Create a `mobile/` implementation branch and get a working internal install on one iPhone and one Android device before doing any store-prep polish.
