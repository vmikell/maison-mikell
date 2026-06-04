# Maison Push Notification Setup

Maison now has the client and backend code needed for reminder push notifications.

## Client Registration

Native iOS/Android installs register through `@capacitor-firebase/messaging`, which returns Firebase Cloud Messaging registration tokens on both platforms. Tokens are stored in Firestore at:

`users/{uid}/pushTokens/{encodedToken}`

Each token document includes:

- `token`
- `platform`
- `householdId`
- `updatedAt`

Firestore rules allow signed-in users to create/update/delete only their own push token documents.

## Backend Sender

Firebase Functions live in `functions/index.js`:

- `sendDueReminderPushesScheduled`: scheduled daily at 8:00 AM America/New_York.
- `sendDueReminderPushesNow`: callable manual trigger for a household owner. Supports `{ householdId, dryRun, today }`.

The sender:

1. Reads unsent due reminder records from `households/{householdId}/reminders`.
2. Resolves owner/assigned/claimed household members.
3. Reads their saved FCM tokens from `users/{uid}/pushTokens`.
4. Sends through Firebase Admin Messaging.
5. Deletes invalid/dead tokens.
6. Marks reminders sent only after at least one push succeeds.

## Native Requirements

### iOS

- `ios/App/App/App.entitlements` includes the APNs environment, using `development` for Debug and `production` for Release.
- `AppDelegate.swift` forwards APNs registration and remote notification events to Capacitor/Firebase Messaging.
- `ios/App/App/GoogleService-Info.plist` is present.
- In Apple Developer, enable Push Notifications for `com.maisonmikell.app`.
- In Firebase project settings, upload an APNs Auth Key or certificate for the iOS app. Firebase needs this before FCM can deliver to iOS.

### Android

- Add Firebase's Android config file at `android/app/google-services.json` for package `com.maisonmikell.app`.
- Android 13+ notification permission and the default `maison-reminders` notification channel are configured.

## Deployment Blocker

Firebase CLI dry-run confirmed the project `maison-reset` is not currently on the Blaze/pay-as-you-go plan. Cloud Functions cannot be deployed until Blaze is enabled because Firebase needs to enable Cloud Functions, Cloud Build, and Artifact Registry APIs.

Upgrade URL:

https://console.firebase.google.com/project/maison-reset/usage/details

After upgrading, deploy with:

```bash
npx firebase deploy --only functions,firestore:rules --project maison-reset
```

Then install a fresh native build, sign in, accept notification permission, and confirm a token appears under `users/{uid}/pushTokens` before sending a real test notification.
