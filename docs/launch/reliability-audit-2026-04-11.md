# Maison Mikell Reliability Audit - 2026-04-11

## What is already in good shape

- The signed-out landing screen on the live deployed site is clean and understandable.
- The auth resolution path already has a dedicated intermediate loading state instead of immediately dropping signed-in users onto the join screen.
- The signed-out, join, and remote-failure surfaces now have cleaner user-facing guidance instead of terse or debug-heavy messaging.
- Planner filtered-empty states now explain what to do next instead of just collapsing to an empty view.
- Shopping item saves use optimistic UI with rollback when the Firestore write fails.
- Shopping list item toggles and deletes also attempt rollback behavior.

## Reliability risks found in the current implementation

### 1. Join flow is still not fully verified end to end on the real signed-in path
- Code suggests the prior join-screen flash issue is handled more carefully now.
- But this is not fully verified in a real deployed signed-in flow from my side yet.
- Status: improved in code, still requires true live sign-in verification.

### 2. Firestore permissions need explicit scenario verification
- A backend probe against the household hit `permission-denied` / `Missing or insufficient permissions`.
- That does not automatically mean the user-facing app is broken, because rules depend on authenticated browser context.
- It does mean write scenarios need a deliberate matrix check:
  - owner updates household settings
  - owner refreshes invite code
  - owner promotes member
  - member joins via invite code
  - member edits shopping list items
  - member completes or claims tasks

### 3. Some planner write paths lack user-facing rollback/error polish
- Shopping item save has good rollback and visible error detail.
- Shopping toggle and delete revert state, but do not surface as much user-facing feedback.
- Task operations rely more heavily on remote success and fallbacks, but the user-visible failure messaging is still uneven.
- Recommendation: standardize write failures with a shared toast/banner pattern.

### 4. Visible state coverage still still needs partial live verification, but the UI pass is materially stronger now
Areas improved in code and deployed UI:
- signed-out guidance now handles expired-session expectations more clearly
- join screen now better explains wrong-account/sign-out recovery
- remote failure state now has a clearer in-app warning panel when live sync is having trouble
- planner filtered-empty state now tells the user to clear filters
- admin owner list now has a true empty-state fallback
- shopping tab/list area now has explicit empty-state copy if lists are missing

Still not fully live-verified from my side:
- real signed-out after session expiry on deployed auth
- real join failure/success behavior in a signed-in browser context
- real remote failure behavior triggered naturally in deployed use

### 5. Consumer-visible debug details were removed from the main user-facing auth/admin/shopping surfaces
- The app no longer exposes raw debug detail text in those core consumer-facing areas.
- Remaining work is about true live verification, not cleanup of obvious debug copy.

## Recommended next engineering moves

1. Verify signed-in flow on the live deployed app with a real account.
2. Run the owner write-scenario checklist live, then the member checklist.
3. Confirm the polished visible states behave correctly during real auth/session edge cases.
4. Add crash/error tracking and analytics once the core flows are stable.
5. Revisit any remaining UX rough edges only after the live verification pass.

## Proposed scenario checklist

### Auth and membership
- sign in as existing owner
- sign in as existing second owner/member
- sign out and sign back in
- join with valid invite code
- join with invalid invite code
- reload after joining

### Planner
- complete task
- claim task
- unclaim task
- create task
- edit task
- delete task

### Shopping
- add item
- edit item
- check item
- uncheck item
- delete item
- edit store/list metadata
- verify clickable product URL behavior

### Admin
- generate invite code
- promote member
- confirm household settings update correctly

## Incident and recovery checklist additions needed

- confirm deployed site URL and last known-good deploy path
- confirm Firebase project and auth domain configuration
- confirm current Firestore rules are deployed
- confirm household document exists and has expected member records
- if writes fail, capture:
  - exact user role
  - exact action attempted
  - exact error code/message
  - whether optimistic UI reverted correctly
- if auth flow regresses, capture:
  - signed-out screen
  - loading screen
  - post-sign-in screen
  - whether join screen appeared incorrectly
