# Maison Auth Polish Report - 2026-04-27

## Acceptance criteria

A smooth Maison auth flow should satisfy these checks before it is considered launch-ready:

- First screen makes the entry intent obvious: start/return vs join with invite.
- If a user chooses the invite path before Google/email auth, that intent survives redirect, reload, and native WebView relaunch long enough to land on code entry.
- Google auth has a clear pending state and does not label non-error progress text as an error.
- Email sign-in and password reset show success/error tone correctly.
- Returning members go directly into the app after membership resolution.
- New owners can create a household, complete setup, and get the partner invite handoff.
- Invited members can enter the code after auth and can switch accounts if needed.
- Native diagnostics remain passive and visible only in native/debug contexts.
- Web redirect auth remains the default for hosted web builds; native bridge remains opt-in.

## Findings

The main practical flaw was not Firebase config or Capacitor wiring. It was onboarding state architecture: the unauthenticated invite-choice button only updated in-memory React state, and the Google sign-in handler explicitly cleared that choice before redirecting. A full-page redirect or native WebView auth handoff could therefore drop the user's selected join path and return them to the create-household path.

The visual issue was related: Maison told users to keep the invite path selected, but the UI had no persistent selected state and progress messages were rendered with the error class.

## Changes made

- Persisted the pre-auth invite intent in `sessionStorage` through `usePlannerState` so it survives redirect/reload without becoming permanent account state.
- Cleared the stored invite intent after successful household creation or join.
- Added a visible two-option auth intent selector for start/return vs invite join.
- Preserved the selected invite path when launching Google auth.
- Added Google-auth loading state and disabled the Google CTA while it is starting.
- Split auth progress/success/error message tone so normal progress is not styled as an error.
- Added responsive styling for the new auth selector.

## Verification

Run after implementation:

- `npm run lint` - passes with one existing warning about an unused eslint-disable directive in `src/App.jsx`.
- `npm run build` - passes.
- Local Playwright mobile smoke on Vite dev server - invite option changes CTA to `Continue with Google to join`, writes `maison:onboarding-invite-intent=1` to session storage, and has no horizontal overflow on an iPhone 13 viewport.

## Remaining blockers

- Real iOS/Android device verification is still required before native auth can be called store-ready.
- Native Google bridge still depends on real Firebase mobile client config files and platform URL-scheme wiring.
- No live Google login was completed during this pass because that requires an interactive external account flow.
