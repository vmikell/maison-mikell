# Maison Mikell Production Readiness Checklist

## Objective

Move Maison Mikell from "works for our household" to "safe to sell to other households."

## 1. Product reliability

### Must complete
- [ ] Verify the sign-in flow on the real deployed app, especially the join-screen flash issue.
- [x] Add a dedicated signed-in loading state before membership resolution completes.
- [x] Add a subtle loading animation so the signed-in loading state feels intentional.
- [x] Audit and polish the main loading, empty, and error states across planner, calendar, shopping, admin, signed-out, and join flows.
- [ ] Add crash/error tracking (recommended: Sentry).
- [ ] Add product analytics for core events.
- [ ] Confirm Firestore rules cover all intended household actions safely.
- [ ] Verify write scenarios explicitly by role: owner settings, invite generation, member join, shopping writes, planner writes.
- [ ] Review reminder flows for duplicate sends, partial failures, and silent failures.
- [ ] Add a clear recovery path for failed writes and offline/reconnect edge cases.
- [x] Standardize write-failure user feedback across planner, shopping, and admin actions.
- [x] Remove or hide consumer-visible debug detail before launch.
- [x] Make sign-out, session expiry, and membership transitions more predictable at the UI level.

### Core analytics events
- [ ] account_created
- [ ] signed_in
- [ ] household_joined
- [ ] invite_code_used
- [ ] task_added
- [ ] task_completed
- [ ] shopping_item_added
- [ ] shopping_item_checked
- [ ] reminder_sent

## 2. Data and operations

### Must complete
- [ ] Define backup/export strategy for household data.
- [x] Add an internal admin/debug checklist for production incidents.
- [ ] Document Netlify deployment recovery steps, since auto-deploy is currently unreliable.
- [ ] Repair Git-based Netlify deployment configuration or replace it with a trusted deploy workflow.

## 3. Legal and trust

### Must complete
- [ ] Privacy policy
- [ ] Terms of service
- [ ] Support email and support flow
- [ ] Account deletion/request flow
- [ ] Basic data retention policy

## 4. Product polish

### Must complete
- [ ] Redesign color system and core visual language.
- [ ] Tighten spacing, typography, and interaction consistency.
- [ ] Improve onboarding clarity for first-time users.
- [ ] Add a cleaner household invitation experience.
- [ ] Review mobile responsiveness across common iPhone and Android sizes.

## 5. Launch gate

Maison Mikell is launch-ready only when:
- sign-in and join flows are stable on real devices
- analytics and error logging are live
- billing approach is decided
- legal pages exist
- app-store packaging is functioning on both platforms
- the app looks intentionally designed, not just functional
