# Maison Mikell Onboarding Implementation Plan

This plan turns `onboarding-flow-spec.md` into a build sequence.

Goal: ship onboarding as an intentional product flow instead of a patched auth/join edge case.

## Scope boundary

This work is separate from the reliability pass.

Included here:
- welcome flow structure
- create-household flow
- join-household flow polish
- wrong-account recovery
- invite-your-partner flow
- route/state decisions for first-run entry

Not included here:
- full live role-based write verification
- billing/paywall
- analytics instrumentation details
- native app packaging

## Product architecture recommendation

Use a small onboarding state machine instead of ad hoc conditional rendering.

Recommended top-level onboarding states:
- `signed_out_welcome`
- `resolving_membership`
- `create_household`
- `join_household`
- `invite_partner`
- `enter_app`

Derived conditions:
- signed in vs signed out
- membership found vs not found
- owner vs member
- user explicitly chose invite-code path before sign-in
- household just created vs already existed

## Build phases

## Phase 1. Refactor entry flow structure

### Objective
Separate onboarding decision-making from the main app shell.

### Tasks
- create a dedicated onboarding decision layer in the app
- stop treating `!membership` as only `join household`
- preserve existing signed-in loading state while routing to the correct onboarding screen
- make sure returning owner/member still pass through quickly

### UI deliverables
- clean welcome screen remains the signed-out entry point
- membership resolution screen remains but becomes routing logic, not a dead-end screen

### Technical notes
Possible implementation pattern:
- add a computed `onboardingStep` in `App.jsx` or a dedicated hook
- use explicit branching instead of scattered conditional UI blocks

### Done when
- returning owner goes straight into app
- returning member goes straight into app
- signed-in user with no household can be routed somewhere other than join by default

## Phase 2. Add create-household flow

### Objective
Give first-time owners a real setup path.

### Tasks
- add `Create household` screen/state
- add primary CTA: `Create household`
- create household document if none exists for that user path
- set current user as `owner`
- generate initial invite code
- persist household metadata cleanly
- route success into invite-your-partner screen

### UX requirements
- explain what creating a household means in one sentence
- keep the form minimal at first
- do not ask for too much setup data initially

### Recommended v1 create flow fields
- optional household name, or skip entirely for v1
- no long setup form yet

### Recommended backend behavior
On creation:
- create household doc
- add creator to `members` as owner
- set `inviteCode`
- initialize required subcollections or seed path only if truly needed

### Important decisions
- one household per owner account for v1
- explicit button tap required, not automatic household creation

### Done when
- brand-new signed-in user can create a household without touching Firestore manually
- newly created household makes the user owner
- user lands on invite-your-partner screen immediately after success

## Phase 3. Polish join-household flow

### Objective
Make invited-member entry feel intentional and safe.

### Tasks
- upgrade join screen copy based on the spec
- keep invite-code input simple and clear
- add clear recovery action: `Use a different Google account`
- tighten success transition into app
- tighten failure states for:
  - invalid code
  - replaced/expired code
  - network failure
  - wrong account expectation

### UX requirements
- no technical wording
- always explain next step after an error

### Done when
- invited member understands what to do immediately
- wrong-account recovery is obvious
- successful join feels like a handoff, not a dead-end form submission

## Phase 4. Add invite-your-partner screen

### Objective
Turn the invite code into a real invitation moment.

### Tasks
- create post-create household invite screen
- display invite code prominently
- add short share instructions
- add copy button
- optionally add share button later
- add CTA to continue into planner

### UX requirements
- this should feel warm and premium
- avoid admin jargon
- frame it as inviting a partner into a shared home

### Done when
- a new owner clearly understands the next step after household creation
- invite code is easy to read and copy

## Phase 5. Add wrong-account recovery consistently

### Objective
Make account mismatch survivable everywhere.

### Tasks
- add `Use a different Google account` on join-related screens
- ensure it signs the user out cleanly
- return to welcome screen without weird intermediate states
- confirm signed-out copy acknowledges expired/wrong session cases

### Done when
- user never feels trapped in the wrong account
- recovery path is visible, not hidden

## Phase 6. Integrate with app entry and persistence

### Objective
Make onboarding transitions clean and durable.

### Tasks
- define where onboarding completion state lives
- ensure refresh after create/join lands in the correct app state
- ensure invite screen does not reappear incorrectly for returning owners
- ensure household resolution is deterministic after sign-in

### Done when
- refresh behavior is predictable
- returning users bypass onboarding correctly

## Recommended file/work areas

Likely primary files:
- `src/App.jsx`
- `src/App.css`
- `src/hooks/usePlannerState.js`
- `src/lib/firestorePlanner.js`
- `src/lib/auth.js`

Possible new files if we want cleaner structure:
- `src/components/onboarding/WelcomeScreen.jsx`
- `src/components/onboarding/CreateHouseholdScreen.jsx`
- `src/components/onboarding/JoinHouseholdScreen.jsx`
- `src/components/onboarding/InvitePartnerScreen.jsx`
- `src/hooks/useOnboardingState.js`

## Recommended implementation order

### Order recommendation
1. Phase 1: entry flow refactor
2. Phase 2: create-household flow
3. Phase 4: invite-your-partner screen
4. Phase 3: join-household polish
5. Phase 5: wrong-account consistency
6. Phase 6: persistence/refresh cleanup

Why this order:
- the main missing product path is create-household
- invite flow should immediately follow creation
- join flow polish is important, but less structurally urgent than fixing the missing owner setup path

## Suggested acceptance checklist

### Signed out
- [ ] Welcome screen is clear
- [ ] Sign-in CTA is obvious
- [ ] Invite-code path is discoverable

### New owner
- [ ] Can sign in and reach create-household screen
- [ ] Can create household successfully
- [ ] Becomes owner automatically
- [ ] Sees invite-your-partner screen
- [ ] Can continue into app

### Invited member
- [ ] Can reach join screen clearly
- [ ] Can enter invite code
- [ ] Success transitions into app
- [ ] Failure state explains next step

### Wrong account
- [ ] User can sign out and retry from join flow
- [ ] No stuck state after wrong-account recovery

### Returning users
- [ ] Returning owner bypasses onboarding
- [ ] Returning member bypasses onboarding

## Risk notes

Main risk areas:
- household creation data model decisions
- Firestore rules for create/join behavior
- ensuring onboarding screens do not regress returning-user flow
- keeping UI simple without introducing a maze of state branches

## Recommendation for the first build pass

Keep v1 narrow.

Ship this first:
- refactored entry flow
- create-household screen
- invite-your-partner screen
- join flow polish
- wrong-account button

Do not overbuild onboarding analytics, fancy animations, or long setup forms in the first pass.

## Immediate next coding step

Begin **Phase 1**, then move directly into **Phase 2 create-household flow**.

That is the point where implementation stops being planning and starts materially changing the product.
