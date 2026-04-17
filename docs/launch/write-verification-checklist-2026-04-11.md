# Maison Write Verification Checklist - 2026-04-11

Status values:
- VERIFIED
- FAILED
- NEEDS FIX
- NOT RUN YET

## Owner actions

### Household admin
- [ ] Refresh invite code — NOT RUN YET
- [ ] Promote member to owner — NOT RUN YET

### Planner
- [ ] Create task — NOT RUN YET
- [ ] Edit task — NOT RUN YET
- [ ] Delete task — NOT RUN YET
- [ ] Claim task — NOT RUN YET
- [ ] Clear claim — NOT RUN YET
- [ ] Mark task complete — NOT RUN YET

### Shopping
- [ ] Add shopping item — NOT RUN YET
- [ ] Edit shopping item — NOT RUN YET
- [ ] Check shopping item — NOT RUN YET
- [ ] Uncheck shopping item — NOT RUN YET
- [ ] Delete shopping item — NOT RUN YET
- [ ] Update shopping list metadata — NOT RUN YET
- [ ] Open saved product URL — NOT RUN YET

### Reminder/admin ops
- [ ] Mark reminder sent — NOT RUN YET

## Member actions

### Household access
- [ ] Join household with valid invite code — NOT RUN YET
- [ ] Join household with invalid invite code — NOT RUN YET

### Planner
- [ ] Claim task — NOT RUN YET
- [ ] Clear claim — NOT RUN YET
- [ ] Mark task complete — NOT RUN YET

### Shopping
- [ ] Add shopping item — NOT RUN YET
- [ ] Edit shopping item — NOT RUN YET
- [ ] Check shopping item — NOT RUN YET
- [ ] Uncheck shopping item — NOT RUN YET
- [ ] Delete shopping item — NOT RUN YET
- [ ] Update shopping list metadata — NOT RUN YET
- [ ] Open saved product URL — NOT RUN YET

## Evidence to capture for each run
- role used
- action taken
- expected result
- actual result
- visible error, if any
- whether UI rolled back correctly on failure
- final verdict: VERIFIED / FAILED / NEEDS FIX

## Current recommendation
Start with owner actions first, then member actions.

## Verified prep completed before the live write pass
- [x] Consumer-facing debug detail removed from core auth/admin/shopping surfaces
- [x] Shared visible success/failure messaging added across planner, shopping, and admin writes
- [x] Signed-out, join, filtered-empty, remote-warning, admin-empty, and shopping-empty states polished in code and deployed UI

## Still intentionally unverified
- None of the role-based write actions above should be marked VERIFIED until they are exercised in a real signed-in deployed session with the appropriate role.
