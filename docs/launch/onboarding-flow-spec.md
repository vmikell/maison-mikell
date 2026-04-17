# Maison Onboarding Flow Spec

This is a product flow spec, not a reliability checklist.

Goal: make first-run household entry feel calm, premium, obvious, and low-friction for couples.

## Product intent

Maison should not feel like:
- a generic auth gate
- a Firebase demo
- an app that dumps users into a confusing invite-code screen

Maison should feel like:
- a calm home operating system
- a shared household app for two people who live together
- an app that understands whether you are starting a household or joining one

## Core onboarding principle

Separate these paths clearly instead of blending them:

1. owner starting or returning to the household
2. invited member joining an existing household
3. wrong-account recovery
4. no-household-yet state

The app should explain which state the person is in before asking them to do work.

## Desired onboarding architecture

### Screen 1: Welcome screen
Purpose:
- introduce Maison simply
- frame the app as shared household coordination
- give two clear next actions

Primary CTA:
- `Continue with Google`

Secondary CTA:
- `I already have an invite code`

Support copy:
- one sentence on what the app does
- one sentence on who it is for
- one sentence that this is meant for shared home management, not solo productivity

Do not show:
- raw auth troubleshooting text by default
- admin language
- debug codes

## After sign-in: resolve into one of four paths

### Path A: Returning owner
Condition:
- signed in
- user belongs to a household
- role is `owner`

Experience:
- short loading state
- soft success handoff into the app
- no onboarding friction

Optional welcome treatment:
- `Welcome back, Victor.`
- `Your household is ready.`

Behavior:
- land in planner or dashboard
- admin controls available but not forced

### Path B: Returning member
Condition:
- signed in
- user belongs to a household
- role is `member`

Experience:
- same calm loading state
- direct entry into app
- no request for invite code again

Optional welcome treatment:
- `Welcome back.`
- `Your household is synced.`

Behavior:
- land in planner or dashboard
- no admin-first framing

### Path C: Invited member joining for the first time
Condition:
- signed in
- no household membership yet
- user intends to join an existing household

Experience:
- dedicated join screen
- headline like: `Join your household`
- short explanatory copy: `Enter the invite code your partner sent you.`

Fields/actions:
- invite code field
- primary CTA: `Join household`
- secondary CTA: `Use a different Google account`
- tertiary text link: `I need a new invite code`

Success state:
- brief success confirmation
- then transition straight into the live app

Failure states:
- invalid code
- expired/replaced code
- wrong account
- network issue

Each failure should explain what to do next.

### Path D: No household yet
Condition:
- signed in
- no household membership yet
- user is not joining with an invite code

This is the missing product path today.

Experience:
- dedicated setup screen
- headline like: `Set up your household`
- subcopy like: `Start your shared home in a minute, then invite your partner.`

Primary CTA:
- `Create household`

Secondary CTA:
- `I already have an invite code`

Behavior after create:
- create household
- make signed-in user owner
- generate invite code
- show lightweight success screen with share instructions

This path matters because otherwise the product feels like it assumes a household already exists.

## Wrong-account recovery path

This needs to be explicit in both member join and owner/member return scenarios.

### Wrong-account symptoms
- user signs in and sees they are not recognized as expected
- user lands on join flow but expected direct access
- user uses an account that is not the invited email/account

### Recovery UI
Always provide a visible action:
- `Use a different Google account`
- which signs the user out and returns to welcome

Support copy example:
- `If this isn’t the Google account your household uses, sign out and try the other one.`

## Invite-code experience

Invite codes should feel like a household invitation, not a secret admin token.

### Desired owner-side language
Current concept:
- owner sees invite code in admin

Desired improved flow:
- onboarding/setup should present invite code as part of inviting a partner
- owner sees:
  - invite code
  - short share instructions
  - optional copy button
  - optional system share button later

### Desired member-side language
- `Enter the code your partner shared with you.`
- avoid language like `household membership update`

## Recommended first-run flow

### First household owner
1. arrive on welcome screen
2. continue with Google
3. no membership found
4. land on `Set up your household`
5. tap `Create household`
6. household created, user becomes owner
7. see invite screen with code and share instructions
8. continue into planner

### Invited partner
1. arrive on welcome screen
2. either tap `I already have an invite code` or sign in first
3. continue with Google
4. no membership found
5. land on `Join your household`
6. enter invite code
7. see success state
8. enter planner

## UX tone rules

Onboarding should feel:
- warm
- clear
- domestic, not enterprise
- premium but simple

Avoid:
- technical jargon
- admin-heavy wording
- showing roles too early unless needed
- exposing implementation details

## Recommended screen set

1. `Welcome`
2. `Set up your household`
3. `Join your household`
4. `Invite your partner`
5. `Loading / resolving household`
6. optional lightweight `Welcome back`

## Copy direction

### Welcome
- headline: `A calmer way to run your home.`
- body: `Maintenance, shopping, reminders, and shared household coordination in one place.`

### Set up your household
- headline: `Start your household`
- body: `Create your home base, then invite your partner to join.`

### Join
- headline: `Join your household`
- body: `Use the invite code your partner shared with you.`

### Invite
- headline: `Invite your partner`
- body: `Send this code so they can join your shared home.`

## Product decisions to make

1. Should household creation happen automatically for the first signed-in user, or require an explicit `Create household` tap?
   - recommendation: require explicit tap so the user understands what is happening

2. Should invite code entry happen before or after sign-in?
   - recommendation: allow the user to indicate they have a code before sign-in, but require sign-in before final join

3. Should users land in planner or a short welcome/interstitial screen after successful join/create?
   - recommendation: planner directly, unless we want one lightweight celebratory transition

4. Should owner onboarding include partner-invite nudges until a second member joins?
   - recommendation: yes, lightly

## Recommended implementation order

### Phase 1: structure
- separate welcome, create-household, and join-household flows
- stop treating `no membership` as only a join problem

### Phase 2: owner setup
- add explicit `Create household` path
- make new user owner on creation
- generate invite code
- show invite screen

### Phase 3: member join polish
- improve join copy and recovery states
- improve success transition into app

### Phase 4: invite UX polish
- copy button
- share button
- better owner invitation presentation

## Success criteria

Onboarding is working when:
- a new owner understands what to do without explanation
- an invited partner joins without confusion
- wrong-account recovery is obvious
- nobody feels dumped into a strange admin/auth edge state
- the flow feels like a real product, not stitched-together plumbing
