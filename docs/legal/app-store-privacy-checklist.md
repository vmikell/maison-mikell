# Maison App Store Privacy Questionnaire and Submission Checklist

Owner: Mikell Labs

App: Maison

Target: App Store submission after paid subscription flow is ready.

Status: Draft. Confirm against the final production build before submitting App Store privacy answers.

## Known V1 Facts

- App access on iOS uses Apple in-app purchase subscriptions.
- Subscription prices: founding lifetime $179 for the first 14 days, monthly $12, and yearly $96.
- No free tier in v1.
- Founders lifetime access is included as a limited 14-day launch offer.
- Authentication: email/password and Google login.
- Emails: signup/welcome and forgot-password/reset.
- Push notifications: not v1 unless later confirmed.
- Payments: Apple IAP subscriptions for iOS app access.
- No Stripe or physical-product payments for app access.
- Do not claim analytics, crash reporting, advertising, payment-card handling, or other data practices unless confirmed in the final build.

## App Store Connect: Data Collection

Answer: Yes, Maison collects data from users.

Rationale: Maison requires account login and stores user-entered household planning data.

## Data Types To Disclose If Final Build Matches Current Facts

### Contact Info

Email Address

- Collected: Yes.
- Purpose: App functionality, account management, authentication, password reset, welcome/signup emails, household membership, support if contacted.
- Linked to user: Yes.
- Used for tracking: No, unless a later marketing/advertising system changes this.
- Needs confirmation: Whether email is also used for marketing emails.

Name

- Collected: Yes, if the user enters a name, uses a Google profile name, or Maison creates/display stores a display name.
- Purpose: App functionality and household membership display.
- Linked to user: Yes.
- Used for tracking: No.

### User Content

Other User Content

- Collected: Yes.
- Examples: Household name, home setup details, shopping lists, shopping items, maintenance tasks, reminders, task ownership/claims, completion records, invite codes, member-entered household data.
- Purpose: App functionality.
- Linked to user: Yes, because it is tied to the user's household/account.
- Used for tracking: No.
- Needs confirmation: Whether any user content is reviewed by support staff or exported to support tools.

### Identifiers

User ID

- Collected: Yes.
- Examples: Firebase Authentication user ID, Google account identifier or provider identifier, household membership ID, Apple subscription/customer/transaction identifiers if stored.
- Purpose: App functionality, authentication, account management, subscription entitlement, fraud/security where applicable.
- Linked to user: Yes.
- Used for tracking: No.
- Needs confirmation: Exact IAP entitlement/receipt fields stored by Mikell Labs after subscription flow is implemented.

### Purchases

Purchase History

- Collected: Needs confirmation.
- Expected answer if Maison stores or receives subscription entitlement, transaction, renewal, or receipt status from Apple: Yes.
- Purpose: App functionality, subscription entitlement, account access.
- Linked to user: Yes if tied to the Maison account or Firebase user.
- Used for tracking: No.
- Needs confirmation: Whether subscription status is stored server-side, client-side, in Firebase, or only checked with Apple.

### Diagnostics

Crash Data

- Collected: Needs confirmation.
- Current known status: No crash reporting practice is confirmed for v1.
- Do not disclose as collected unless Sentry, Firebase Crashlytics, Apple diagnostics access, or another crash tool is intentionally used and documented.

Performance Data

- Collected: Needs confirmation.
- Current known status: No performance monitoring practice is confirmed for v1.

Other Diagnostic Data

- Collected: Needs confirmation.
- Current code includes limited local native/auth diagnostic events for troubleshooting. Confirm whether these remain local-only or are transmitted to Mikell Labs or a third party.
- If local-only and not transmitted off device, they may not need App Store privacy disclosure as collected data. Confirm before submission.

## Data Types Currently Not Confirmed For V1

Do not mark these as collected unless implementation is confirmed:

- Location.
- Contacts.
- Photos or videos.
- Audio data.
- Camera access.
- Health and fitness.
- Financial information beyond Apple IAP subscription status.
- Payment information such as credit/debit card numbers.
- Browsing history.
- Search history.
- Advertising data.
- Product interaction analytics.
- Third-party advertising identifiers.
- Precise device identifiers beyond what Apple/Firebase require for authentication or subscriptions.

## Tracking

Recommended App Store answer based on current facts: No, Maison does not use data to track users across apps and websites owned by other companies.

Needs confirmation before submission:

- No third-party advertising SDKs.
- No cross-app tracking pixels.
- No data broker sharing.
- No analytics configured for advertising attribution or cross-app profiling.

## Third-Party Services To Confirm

Known or expected:

- Firebase / Google: authentication, Google login, Firestore/app infrastructure.
- Apple: in-app purchase subscriptions.
- Email delivery provider: Needs confirmation for welcome/signup emails and password reset emails.

Needs confirmation:

- Whether Firebase Analytics is enabled or disabled.
- Whether Crashlytics, Sentry, or other crash/error tooling is enabled.
- Whether any support desk, CRM, mailing list, or transactional email provider stores user data.
- Whether RevenueCat stores subscription status only, or whether Mikell Labs also stores entitlement/receipt fields in Firebase or another backend.

## App Store Submission Checklist

### Required Before Privacy Answers Are Final

- [x] Confirm support email: `support@maisonhomeapp.com`.
- [x] Confirm privacy email: `privacy@maisonhomeapp.com`.
- [x] Confirm public Privacy Policy URL: `https://maisonhomeapp.com/privacy.html`.
- [x] Confirm Support URL: `https://maisonhomeapp.com/support.html`.
- [x] Confirm Terms of Use / EULA URL: `https://maisonhomeapp.com/terms.html`.
- [ ] Confirm App Store / RevenueCat products are founding lifetime $179, monthly $12, and yearly $96.
- [ ] Confirm no free tier is exposed in the submitted iOS build.
- [ ] Confirm the founders lifetime tier is limited to the first 14 days after launch.
- [ ] Confirm no Stripe or physical-product payment path is used for iOS app access.
- [ ] Confirm Apple IAP purchase, restore purchase, subscription status, cancellation messaging, and entitlement checks are implemented.
- [ ] Confirm whether one subscription covers one household or one individual account.
- [ ] Confirm whether deleted accounts keep, cancel, or unlink active Apple subscriptions, and show users Apple cancellation instructions.
- [ ] Confirm Firebase Analytics status.
- [ ] Confirm crash/error reporting status.
- [ ] Confirm push notifications are absent from v1 or update disclosures if added.
- [ ] Confirm email provider and email data retention.
- [ ] Confirm data retention for deleted accounts, household deletion, backups, logs, support requests, and subscription records.
- [ ] Confirm account deletion is reachable in the released iOS app.
- [ ] Confirm account deletion works for email/password users and Google users.
- [ ] Confirm account deletion behavior for household owners, members, and last remaining household member.
- [ ] Confirm a manual deletion request path for users who cannot access the app.

### Store Metadata / Legal Blocks

- Privacy Policy URL: `https://maisonhomeapp.com/privacy.html`.
- Support URL: `https://maisonhomeapp.com/support.html`.
- Terms/EULA URL: `https://maisonhomeapp.com/terms.html`.
- Marketing URL: Optional / needs confirmation.
- Copyright holder: Mikell Labs, needs confirmation of exact legal name.
- App category and age rating: Needs confirmation.
- Export compliance / encryption answers: Needs confirmation.
- Terms of Use / EULA: Needs confirmation.

## Factual Gaps and Blockers

1. Support email is not confirmed.
2. Privacy email is not confirmed.
3. Public Privacy Policy URL is not confirmed.
4. Support URL is not confirmed.
5. Terms of Use or EULA URL is not confirmed.
6. Apple IAP subscription implementation is not yet confirmed complete.
7. Subscription entitlement data practices are unknown until IAP flow is implemented.
8. Email delivery provider and retention are not confirmed.
9. Analytics status is unknown; do not claim analytics collection until confirmed.
10. Crash/error reporting status is unknown; do not claim crash collection until confirmed.
11. Push notifications are out of v1 unless later confirmed.
12. Account deletion exists in the codebase, but the released iOS UX and full production deletion behavior need final QA.
13. Manual account deletion request path is not confirmed.
14. Retention periods for deleted data, backups, logs, support requests, and subscription records are not confirmed.
15. Whether one subscription covers one household or one account needs final billing/product wording.

