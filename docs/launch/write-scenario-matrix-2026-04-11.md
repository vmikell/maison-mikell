# Maison Mikell Write Scenario Matrix - 2026-04-11

Status legend:
- VERIFIED: confirmed in real deployed behavior
- CODE-PASS: code path and Firestore rules appear aligned, but not yet verified end to end live
- RISK: likely weak/error-prone or missing good user-facing failure handling
- BLOCKED: cannot responsibly mark without a real signed-in role test

## Household / membership writes

### 1. Owner refresh invite code
- UI path: Admin > Refresh invite code
- Code path: `handleGenerateInviteCode()` -> `updateHouseholdMembership({ inviteCode })`
- Firestore rule expectation: owner allowed to update household doc
- Status: CODE-PASS
- Notes: has user-facing error message if update fails

### 2. Owner promote member to owner
- UI path: Admin > Promote to owner
- Code path: `handlePromoteMember()` -> `updateHouseholdMembership({ members })`
- Firestore rule expectation: owner allowed to update household doc
- Status: CODE-PASS
- Notes: now has a clearer user-facing success/failure message, but still needs live owner verification

### 3. Member join with valid invite code
- UI path: Join screen > Join household
- Code path: `handleJoinHousehold()` -> `joinHouseholdWithInviteCode()`
- Firestore rule expectation: special self-join path
- Status: BLOCKED
- Notes: code is intentional, but requires real deployed signed-in verification

### 4. Member join with invalid invite code
- UI path: Join screen > Join household
- Code path: `handleJoinHousehold()` -> `joinHouseholdWithInviteCode()`
- Firestore rule expectation: reject
- Status: CODE-PASS
- Notes: should surface joinError clearly

## Planner writes

### 5. Owner create task
- UI path: Planner editor > Add task
- Code path: `handleSaveTask()` -> `saveTask()`
- Firestore rule expectation: owner only
- Status: CODE-PASS
- Notes: now surfaces a clearer success/failure message, but still needs live owner verification

### 6. Owner edit task
- UI path: Task modal/editor > Save changes
- Code path: `handleSaveTask()` -> `saveTask()`
- Firestore rule expectation: owner only
- Status: CODE-PASS
- Notes: same as create, clearer user-facing result messaging now, still not live-verified

### 7. Owner delete task
- UI path: Task modal > Delete
- Code path: `handleDeleteTask()` -> `deleteTask()`
- Firestore rule expectation: owner only
- Status: CODE-PASS
- Notes: clearer user-facing failure surfacing now, still not live-verified

### 8. Member/owner claim task
- UI path: Task modal > Claim as me / Claim for X / Clear claim
- Code path: `handleClaimTask()` -> `setTaskClaim()`
- Firestore rule expectation: household member allowed for claim fields
- Status: CODE-PASS
- Notes: backend/rules look aligned

### 9. Member/owner complete task
- UI path: Task modal > Mark done today
- Code path: `handleComplete()` -> `markTaskCompleted()`
- Firestore rule expectation: household member allowed to update completion-related fields and create completion record
- Status: CODE-PASS
- Notes: likely works, but should be verified live because it touches task update + completion create + reminder sync + household update

## Shopping writes

### 10. Member/owner add shopping item
- UI path: Shopping form > Add item
- Code path: `handleSaveShoppingItem()` -> `saveShoppingItem()`
- Firestore rule expectation: household member allowed
- Status: CODE-PASS
- Notes: best current write path, includes optimistic UI + rollback + error detail

### 11. Member/owner edit shopping item
- UI path: Shopping item > Edit > Save item
- Code path: `handleSaveShoppingItem()` -> `saveShoppingItem()`
- Firestore rule expectation: household member allowed
- Status: CODE-PASS
- Notes: same as add item, good relative to other flows

### 12. Member/owner check or uncheck shopping item
- UI path: Shopping list checkbox toggle
- Code path: `handleToggleShoppingItem()` -> `toggleShoppingItemChecked()`
- Firestore rule expectation: household member allowed
- Status: CODE-PASS
- Notes: has optimistic rollback and now clearer visible success/failure messaging, still needs live verification

### 13. Member/owner delete shopping item
- UI path: Shopping item > Delete
- Code path: `handleDeleteShoppingItem()` -> `deleteShoppingItem()`
- Firestore rule expectation: household member allowed
- Status: CODE-PASS
- Notes: rollback exists and failure messaging is now clearer, still needs live verification

### 14. Member/owner update shopping list metadata
- UI path: Shopping > Other store name field
- Code path: `handleSaveShoppingListMeta()` -> `saveShoppingListMeta()`
- Firestore rule expectation: household member allowed
- Status: CODE-PASS
- Notes: now has optimistic update rollback and clearer user-facing failure handling, but still needs live verification

## Reminder/admin writes

### 15. Owner mark reminder sent
- UI path: Admin > Reminder operations > Mark delivered
- Code path: `handleMarkReminderSent()` -> `markReminderSent()`
- Firestore rule expectation: household member can update reminder sent fields, household member can update limited household reminder-run metadata
- Status: CODE-PASS
- Notes: likely valid by rules, but not yet verified live

## Biggest gaps to fix next

1. Real deployed verification for:
- member join success
- owner invite refresh
- owner promote member
- task complete
- shopping add/edit/check/delete
- shopping metadata update

2. Confirm the newly polished visible states behave correctly during real auth/session edge cases.

3. Prevent ambiguous local fallback behavior when Firebase is configured but a remote write fails.

## Recommended next execution order

1. Live owner write pass
2. Live member write pass
3. Re-test matrix after the visible-state and write-feedback improvements
4. Document results with evidence only
