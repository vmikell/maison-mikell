# Maison Mikell Ops Recovery Runbook

This is the practical recovery doc for production deploys, Firebase verification, and incident response.

## 1. Known production surface

- Production site: `https://maison-mikell.netlify.app`
- App type: Vite static app on Netlify
- Netlify build config:
  - command: `npm run build`
  - publish dir: `dist`
- Netlify SPA redirect is handled in `netlify.toml`
- Firestore rules source: `/home/vboxuser/.openclaw/workspace/maison-mikell/firestore.rules`
- Firebase config manifest: `/home/vboxuser/.openclaw/workspace/maison-mikell/firebase.json`

## 2. Fast deploy recovery

If the live site needs a known-good redeploy:

1. Use the repo root:
   - `/home/vboxuser/.openclaw/workspace/maison-mikell`
2. Rebuild locally:
   - `npm run build`
3. Verify `dist/` was produced successfully.
4. Deploy directly to Netlify:
   - `npx netlify deploy --prod --dir=dist`
5. Confirm the production URL:
   - `https://maison-mikell.netlify.app`
6. Record the resulting unique deploy URL in incident notes.

## 3. If Netlify Git auto-deploy is unreliable

Current safe fallback is manual deploy from local build output.

Operational rule:
- treat `npx netlify deploy --prod --dir=dist` as the known-good deploy path until Git-based deploy automation is explicitly repaired and re-verified

## 4. Production smoke checks after deploy

Run these in order:

### Minimal checks
- open `https://maison-mikell.netlify.app`
- confirm the app shell loads
- confirm the main signed-out screen renders cleanly
- confirm no obvious blank screen / fatal error

### Local command checks
- `npm run build`
- optional scripted fetch check against production URL

### Important caveat
A raw HTML fetch of the production site will only confirm the SPA shell, not authenticated client-rendered state.
Do not use raw HTML alone as proof that auth flows are working.

## 5. Firebase / Firestore verification checklist

Before trusting production behavior, confirm:

### Config presence
- Netlify environment includes all required `VITE_FIREBASE_*` values
- app is not silently falling back to local seed mode when production should be live

### Firestore rules sanity
Current rules intend:
- household read: public
- owner-only household admin updates
- special self-join invite-code path for new member join
- owner-only create/delete for maintenance tasks
- member-or-owner limited task claim/complete updates
- member-or-owner shopping list and shopping item writes
- owner-or-limited-member reminder updates depending on field set
- member completion record creation

### Data shape sanity
Confirm the expected household exists:
- `households/victor-home`

Confirm expected subcollections exist as needed:
- `maintenanceTasks`
- `shoppingLists`
- `reminders`
- `completions`

Confirm household member records include expected owner/member roles.

## 6. Incident triage categories

### A. Site down / blank / broken deploy
Capture:
- current production URL behavior
- most recent Netlify deploy id / unique deploy URL
- whether local `npm run build` passes
- whether manual Netlify redeploy fixes it

### B. Auth or join flow issue
Capture:
- signed-out screen behavior
- post-sign-in loading screen behavior
- whether join screen appears incorrectly
- valid invite code result
- invalid invite code result
- exact visible user-facing error text

### C. Write failure issue
Capture for every failed action:
- role used
- exact action attempted
- expected result
- actual result
- visible user-facing message
- whether optimistic UI rolled back correctly
- whether the database actually changed

### D. Data freshness / sync issue
Capture:
- whether remote warning banner is visible
- whether stale data appears in planner/calendar/shopping/admin
- whether refresh or sign-out/sign-in clears the issue

## 7. Incident logging template

Use this template in incident notes:

- Date/time:
- Environment: production
- URL:
- User role:
- Scenario:
- Expected behavior:
- Actual behavior:
- Visible message shown to user:
- Data changed in Firestore? yes/no/unknown
- Rollback behavior correct? yes/no/unknown
- Screenshot/evidence:
- Resolution:
- Follow-up fix needed:

## 8. What is still not enough evidence

These are still not considered proven unless exercised in a real signed-in deployed session:
- owner invite refresh
n- owner promote member
- owner task create/edit/delete
- member join success
- member and owner shopping writes
- reminder mark-delivered flow

Code-path review is useful, but it does not replace live verification.
