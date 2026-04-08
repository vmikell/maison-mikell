# Maison Reset

Maison Reset is a mobile-first home maintenance and shopping planner for Victor + Riah.

It tracks recurring household maintenance, reminder records, completion history, task ownership, and shopping lists using React + Vite on the frontend and Firebase / Firestore for persistence.

## What it does

- Maintains a recurring home maintenance schedule
- Tracks overdue, reminder-window, and upcoming tasks
- Lets household members claim and complete tasks
- Stores completion history
- Keeps store-specific shopping lists
- Syncs state through Firestore

## Current product state

Implemented now:
- Planner view
- Shopping list view
- Firestore-backed maintenance tasks, reminders, completions, and shopping lists
- Task claiming and completion tracking
- Local fallback data when Firebase env vars are missing

Still to build:
- Shared household auth for Victor + Riah
- Calendar / seasonal / room-by-room views
- Stronger household onboarding and admin tools

## Tech stack

- React 19
- Vite
- Firebase App SDK
- Firestore

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## Environment variables

Create a `.env` file from `.env.example` and fill in the Firebase values.

Required values:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

If these are missing, the app falls back to local built-in seed data and does not sync with Firestore.

## Firestore shape

Top-level household document:

- `households/{householdId}`

Subcollections:

- `maintenanceTasks`
- `shoppingLists`
- `shoppingLists/{listId}/items`
- `reminders`
- `completions`

Current seeded household id:

- `victor-home`

## Deploying to Netlify

This repo is configured as a standard Vite static build.

Build settings:
- Build command: `npm run build`
- Publish directory: `dist`

Make sure the Firebase `VITE_...` variables are set in Netlify before deploying.

## Reminder delivery worker

Maison Reset now includes a reminder-delivery worker script:

- `npm run reminders:dry-run`
- `npm run reminders:send`

What it does:
- reads unsent reminder records from Firestore
- filters to reminders whose `remindAt` date is due
- sends an email reminder
- appends a push payload to the push outbox JSON
- marks the reminder as sent in Firestore

Worker env vars:
- `MAISON_RESET_HOUSEHOLD_ID`
- `MAISON_RESET_REMINDER_EMAIL`
- `MAISON_RESET_PUSH_OUTBOX`

## Calendar sync helpers

Available scripts:
- `npm run calendar:preview`
- `npm run calendar:sync`

## Recommended next build phases

1. Household auth and membership
2. Calendar / room / seasonal views
3. Better operational tooling and onboarding
