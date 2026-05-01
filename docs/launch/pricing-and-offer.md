# Maison Pricing and Offer

## Pricing stance

Maison should launch as a paid product.

Recommendation:
- no free tier
- no permanent free plan
- founding lifetime offer for the first 14 days after public launch
- standard monthly and yearly subscription pricing after the founding window closes
- one shared RevenueCat entitlement unlocks paid access

## Why no free tier makes sense

- The product is intended to run a real household, not be a toy checklist.
- Paid-only positioning creates cleaner customer expectations.
- A free tier adds support load and weakens premium framing early.

## Recommended launch offer

### Founding offer

- **Lifetime access:** `$179`
- availability: first 14 days after public launch
- framing: founding-member pricing, not an always-open discount
- RevenueCat product: `lifetime`

This should be presented as a limited early-adopter reward for households helping shape Maison at launch.

## Recommended standard pricing

- **Monthly:** `$12/month`
- **Yearly:** `$96/year`
- **Entitlement:** `Mikell Labs | Maison Pro`
- **Lifetime product:** `lifetime`
- **Monthly product:** `monthly`
- **Yearly product:** `yearly`

## Launch messaging

Maison should be framed as:
- the home operating system for shared households
- one calm place for maintenance, shopping, reminders, and household coordination
- built for real homes, not generic productivity hacks

## Open pricing questions

- [x] No free tier for v1.
- [x] Founding lifetime tier is included for the first 14 days.
- [x] iOS billing must use Apple In-App Purchase through RevenueCat/StoreKit, not Stripe.
- [x] Yearly pricing is the primary recurring offer with monthly as the flexible option.
- [ ] Confirm whether App Store Connect should expose the lifetime product at launch or whether founders access is handled in a separate launch/offering flow.
- [ ] Finalize whether the RevenueCat app user ID maps strictly to Firebase user ID or later needs household-level transfer rules.

## My current recommendation

Lead with the 14-day founding lifetime offer, keep monthly and yearly as the standard plans, and avoid adding any free tier.
