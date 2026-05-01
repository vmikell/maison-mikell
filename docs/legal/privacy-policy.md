# Maison Privacy Policy

Effective date: Needs confirmation before publication

Maison is operated by Mikell Labs. This Privacy Policy explains what information Maison collects, how it is used, and what choices you have.

This draft is written for the first App Store release of Maison. It should be reviewed against the final production build, support process, subscription implementation, and any added analytics, crash reporting, push notifications, or third-party services before publication.

## Contact

Developer: Mikell Labs

Privacy contact: Needs confirmation

Support contact: Needs confirmation

## What Maison Does

Maison is a shared household app for managing shopping lists, recurring home maintenance, household reminders, and household planning.

## Information We Collect

Maison may collect the information needed to create your account, operate your household workspace, and provide the app:

- Account information, such as your email address, display name, login provider, and authentication identifiers.
- Login information from supported sign-in methods, including email/password login and Google login.
- Household information you or household members enter, such as household name, home setup details, invite codes, member records, shopping lists, shopping items, maintenance tasks, reminders, task claims, completion history, and related timestamps.
- Email delivery information needed to send signup/welcome emails and forgot-password/reset emails.
- Subscription status information needed to confirm whether your iOS app-access subscription is active.
- Limited diagnostic information if enabled in the app build, such as sign-in or native-app troubleshooting events stored locally on the device or browser.

Maison should not list analytics, crash reporting, advertising tracking, Stripe payments, physical-product payments, push notifications, or other data practices unless they are confirmed in the final production build.

## Information From Apple Subscriptions

For iOS app access, Maison is expected to use Apple in-app purchases managed through RevenueCat:

- Founding lifetime access: $179, available for the first 14 days after launch
- Monthly subscription: $12
- Yearly subscription: $96

Apple processes App Store purchases and subscription payments. Mikell Labs does not receive your full payment card number from Apple.

Final implementation details for subscription receipt validation, entitlement storage, renewal status, cancellation status, and subscription event handling need confirmation before publication.

## How We Use Information

Maison uses information to:

- Create and manage your account.
- Let you sign in with email/password or Google.
- Create, join, and manage a household.
- Sync household planning data across members and devices.
- Send welcome, signup, password reset, and account-related emails.
- Provide subscription-gated app access on iOS.
- Maintain security, prevent abuse, troubleshoot sign-in problems, and support account deletion requests.
- Respond to support or privacy requests.

## How We Share Information

Maison may share information with service providers that help operate the app. Known or expected providers for v1 include:

- Firebase / Google services for authentication, Google login, database storage, and related app infrastructure.
- Apple for App Store subscriptions and in-app purchase processing.
- Email delivery infrastructure for welcome and password reset emails. Provider needs confirmation.

Maison does not sell personal information. Advertising data sharing, third-party ad tracking, third-party analytics, and crash reporting are not confirmed for v1 and should not be disclosed as active practices unless implemented.

## Google Login

If you choose Google login, Google provides Maison with information needed to authenticate your account, such as your email address and Google account identifier. Your use of Google login is also subject to Google's policies and account settings.

## Emails

Maison sends or may send:

- Signup or welcome emails.
- Forgot-password or password-reset emails.
- Account-related operational emails.

Marketing email plans are not confirmed for v1. Do not publish marketing-email language unless a mailing list, consent flow, unsubscribe flow, and provider are confirmed.

## Push Notifications

Push notifications are not planned for v1 unless later confirmed. If push notifications are added, this policy and App Store privacy answers should be updated before release.

## Data Retention

Maison keeps account and household information for as long as needed to provide the app, maintain household records, comply with legal obligations, resolve disputes, and enforce terms.

Specific retention periods for deleted accounts, backups, logs, subscription records, and support emails need confirmation before publication.

## Account Deletion

Maison includes an in-app account deletion flow in the current codebase. The flow is intended to remove the signed-in account from the household and delete the household if no members remain.

Before App Store submission, Mikell Labs should confirm:

- Where users access account deletion in the released iOS app.
- Whether deletion removes Firebase Authentication records, household membership records, and household data as expected.
- What happens when the deleting user is the household owner and other members remain.
- Whether subscription cancellation instructions are shown separately, since deleting a Maison account may not cancel an Apple subscription.
- How users can request deletion by email if they cannot access the app.

## Your Choices

You may:

- Sign in using email/password or Google.
- Request a password reset.
- Delete your Maison account through the in-app deletion flow, once confirmed for the released build.
- Contact Mikell Labs about privacy or support requests using the confirmed privacy/support contact.
- Manage or cancel Apple subscriptions through your Apple ID subscription settings.

## Children's Privacy

Maison is intended for household coordination by adults and is not intended for children under 13. Age rating and child-directed status should be confirmed before App Store submission.

## Security

Maison uses service providers and technical safeguards intended to protect account and household information. No method of storage or transmission is perfect, and Mikell Labs cannot guarantee absolute security.

## International Users

Maison may use service providers that process information in the United States or other countries. Final hosting and service-provider details should be confirmed before publication.

## Changes

Mikell Labs may update this Privacy Policy as Maison changes. The effective date should be updated when the policy changes.

