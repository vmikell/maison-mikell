# Maison RevenueCat Subscription Setup

Maison now has the RevenueCat Capacitor SDK and RevenueCat UI plugin wired for the native app. The codebase itself is React + Vite, not Vue, so the production implementation lives in `src/lib/subscriptions.js` and `src/App.jsx`. Vue examples are included below for future Vue/Ionic usage.

## Installed Packages

```sh
npm install @revenuecat/purchases-capacitor @revenuecat/purchases-capacitor-ui
npx cap sync
```

Installed versions:

- `@revenuecat/purchases-capacitor@13.0.1`
- `@revenuecat/purchases-capacitor-ui@13.0.1`

`npx cap sync` updates both native projects:

- Android Gradle includes `revenuecat-purchases-capacitor` and `revenuecat-purchases-capacitor-ui`.
- iOS SPM includes `RevenuecatPurchasesCapacitor` and `RevenuecatPurchasesCapacitorUi`.

## Current App Defaults

- App: `Mikell Labs | Maison`
- Entitlement display name: `Mikell Labs | Maison Pro`
- Entitlement identifier used in code: `Mikell Labs | Maison Pro`
- RevenueCat Test Store SDK key: `test_BhuminqNyhGvPzGGrqsWmLjijdY`
- Current offering ID: `default`
- Products:
  - Founders lifetime: `founders_lifetime_v2` at `$179`, available for the first 14 days after launch
  - Yearly: `yearly_v2` at `$96/year`
  - Monthly: `monthly_v2` at `$12/month`

RevenueCat usually works best with lowercase identifier strings, but this dashboard currently uses `Mikell Labs | Maison Pro` as both the entitlement identifier and display name. The app default now matches the dashboard exactly.

The Test Store products use `*_v2` identifiers because RevenueCat does not allow editing saved Test Store USD prices after a product is created. The stale `monthly`, `yearly`, and `lifetime` products are archived in RevenueCat.

## Required Env Vars

For local Test Store/dev, the code falls back to the provided Test Store key on native iOS/Android builds. For production, set platform-specific public SDK keys and never ship the Test Store key.

```env
VITE_REVENUECAT_IOS_API_KEY=appl_...
VITE_REVENUECAT_ANDROID_API_KEY=goog_...
VITE_REVENUECAT_ENTITLEMENT_ID=Mikell Labs | Maison Pro
VITE_REVENUECAT_OFFERING_ID=default
VITE_REVENUECAT_LIFETIME_PRODUCT_ID=founders_lifetime_v2
VITE_REVENUECAT_YEARLY_PRODUCT_ID=yearly_v2
VITE_REVENUECAT_MONTHLY_PRODUCT_ID=monthly_v2
VITE_PRIVACY_POLICY_URL=https://maisonhomeapp.com/privacy.html
VITE_TERMS_URL=https://maisonhomeapp.com/terms.html
```

## RevenueCat Dashboard Setup

1. Create or open the `Mikell Labs | Maison` project.
2. Create the entitlement:
   - Identifier: `Mikell Labs | Maison Pro`
   - Display name: `Mikell Labs | Maison Pro`
3. Add Test Store products:
   - `founders_lifetime_v2` as a non-consumable/lifetime product for the 14-day founders offer at `$179`.
   - `yearly_v2` as an annual subscription product at `$96/year`.
   - `monthly_v2` as a monthly subscription product at `$12/month`.
4. Attach all three products to `Mikell Labs | Maison Pro`.
5. Create the `default` offering.
6. Add packages to the offering:
   - Founders/lifetime package -> product `founders_lifetime_v2`
   - Annual/yearly package -> product `yearly_v2`
   - Monthly package -> product `monthly_v2`
7. Build a RevenueCat Paywall for the `default` offering.
8. Enable Customer Center after basic purchases and restore work on device.

## Native Platform Requirements

Android:

- Keep the main Activity launch mode as `singleTop` or `standard`. Maison currently uses `singleTop`, which matches RevenueCat's Capacitor guidance for purchase flows that may leave the app for payment verification.

IOS:

- Enable In-App Purchase capability in Xcode for the Maison target.
- Confirm Swift language version is at least 5.0.
- For Paywalls/Customer Center, test on iOS 15+.

## Implemented React Integration

The app implementation lives in `src/lib/subscriptions.js`:

```js
import { LOG_LEVEL, PACKAGE_TYPE, PAYWALL_RESULT, Purchases } from '@revenuecat/purchases-capacitor'
import { PaywallPresentationConfiguration, RevenueCatUI } from '@revenuecat/purchases-capacitor-ui'

await Purchases.setLogLevel({ level: import.meta.env.DEV ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN })
await Purchases.configure({ apiKey, appUserID: firebaseUser.uid })

const { customerInfo } = await Purchases.getCustomerInfo()
const hasPro = Boolean(customerInfo.entitlements.active['Mikell Labs | Maison Pro'])

const { result } = await RevenueCatUI.presentPaywallIfNeeded({
  requiredEntitlementIdentifier: 'Mikell Labs | Maison Pro',
  presentationConfiguration: PaywallPresentationConfiguration.DEFAULT,
})

if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
  await Purchases.getCustomerInfo()
}
```

The UI in `src/App.jsx` now supports:

- RevenueCat-hosted native Paywall.
- Direct selected-package purchase fallback.
- Restore purchases.
- Customer Center entry point.
- Customer info refresh.
- Entitlement-based app gating.

## Vue / Ionic Capacitor Example

Use this if Maison is ever ported to Vue. Important Vue-specific rule: if a package or offering is stored in `reactive()` state, pass `toRaw(package)` / `toRaw(offering)` into Capacitor plugin calls.

```js
// src/revenuecat.js
import { toRaw } from 'vue'
import { Capacitor } from '@capacitor/core'
import { LOG_LEVEL, PACKAGE_TYPE, PAYWALL_RESULT, Purchases } from '@revenuecat/purchases-capacitor'
import { PaywallPresentationConfiguration, RevenueCatUI } from '@revenuecat/purchases-capacitor-ui'

export const MAISON_PRO_ENTITLEMENT = 'Mikell Labs | Maison Pro'
export const PRODUCT_IDS = {
  lifetime: 'founders_lifetime_v2',
  yearly: 'yearly_v2',
  monthly: 'monthly_v2',
}

const TEST_API_KEY = 'test_BhuminqNyhGvPzGGrqsWmLjijdY'
let configured = false

export async function configureRevenueCat(appUserID) {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('RevenueCat purchases only run in native iOS and Android builds.')
  }

  await Purchases.setLogLevel({ level: import.meta.env.DEV ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN })
  await Purchases.configure({ apiKey: TEST_API_KEY, appUserID })
  configured = true
}

export async function getSubscriptionSnapshot() {
  if (!configured) throw new Error('RevenueCat is not configured yet.')

  const [customerInfoResult, offerings] = await Promise.all([
    Purchases.getCustomerInfo(),
    Purchases.getOfferings(),
  ])

  const customerInfo = customerInfoResult.customerInfo
  const offering = offerings.current
  const packages = offering?.availablePackages || []

  return {
    customerInfo,
    hasPro: Boolean(customerInfo.entitlements.active[MAISON_PRO_ENTITLEMENT]),
    offering,
    monthlyPackage: packages.find((p) => p.product.identifier === PRODUCT_IDS.monthly || p.packageType === PACKAGE_TYPE.MONTHLY),
    yearlyPackage: packages.find((p) => p.product.identifier === PRODUCT_IDS.yearly || p.packageType === PACKAGE_TYPE.ANNUAL),
    lifetimePackage: packages.find((p) => p.product.identifier === PRODUCT_IDS.lifetime || p.packageType === PACKAGE_TYPE.LIFETIME),
  }
}

export async function purchasePackage(packageToPurchase) {
  try {
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: toRaw(packageToPurchase) })
    return {
      customerInfo,
      hasPro: Boolean(customerInfo.entitlements.active[MAISON_PRO_ENTITLEMENT]),
    }
  } catch (error) {
    if (error.userCancelled) return { cancelled: true }
    throw error
  }
}

export async function restorePurchases() {
  const { customerInfo } = await Purchases.restorePurchases()
  return {
    customerInfo,
    hasPro: Boolean(customerInfo.entitlements.active[MAISON_PRO_ENTITLEMENT]),
  }
}

export async function presentMaisonPaywallIfNeeded(offering) {
  const { result } = await RevenueCatUI.presentPaywallIfNeeded({
    offering: offering ? toRaw(offering) : undefined,
    requiredEntitlementIdentifier: MAISON_PRO_ENTITLEMENT,
    displayCloseButton: true,
    presentationConfiguration: PaywallPresentationConfiguration.DEFAULT,
    customVariables: {
      app_name: 'Mikell Labs | Maison',
      entitlement_name: 'Mikell Labs | Maison Pro',
    },
  })

  return result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED
}

export async function presentCustomerCenter() {
  await RevenueCatUI.presentCustomerCenter()
}
```

```js
// src/main.js
import { createApp } from 'vue'
import { IonicVue } from '@ionic/vue'
import App from './App.vue'
import router from './router'
import { configureRevenueCat } from './revenuecat'

const app = createApp(App).use(IonicVue).use(router)

router.isReady().then(async () => {
  app.mount('#app')
  // Use the Firebase Auth UID once the user is known. If no user exists yet,
  // configure after login instead of creating an anonymous RevenueCat user.
  // await configureRevenueCat(firebaseUser.uid)
})
```

## Customer Info Listener Example

```js
const listenerId = await Purchases.addCustomerInfoUpdateListener((customerInfo) => {
  const hasPro = Boolean(customerInfo.entitlements.active[MAISON_PRO_ENTITLEMENT])
  // update Vue/React state here
})

await Purchases.removeCustomerInfoUpdateListener({ listenerToRemove: listenerId })
```

## Error Handling Rules

- Treat `error.userCancelled` as a normal cancellation, not a failure.
- Show human-readable `error.message`; log `error.code` during development.
- Always refresh customer info after purchase, restore, paywall close, and Customer Center close.
- Keep Firebase Auth `uid` as RevenueCat `appUserID` so subscriptions attach to Maison accounts predictably.
- Do not call `configure` repeatedly for the same user; configure once, then use `logIn` when changing users.
- Never ship with the Test Store API key. Use App Store / Google Play public SDK keys for release builds.

## Customer Center Guidance

Customer Center makes sense after:

- Paywall purchase succeeds on a real device.
- Restore purchase succeeds.
- RevenueCat dashboard Customer Center has support links, cancellation paths, and any promo offers configured.

Maison exposes it as `Manage subscription` on the paywall screen. It should remain available from a future account/settings screen for active subscribers.

## Real-Device QA

Current local verification, 2026-04-29:

- `npm run build` passes.
- `npm run lint` passes.
- `npm run cap:sync` passes and includes both RevenueCat Capacitor plugins in iOS and Android.
- `npx cap doctor ios` reports the iOS Capacitor project is healthy.
- Xcode 26.4.1 is installed and selected at `/Applications/Xcode.app/Contents/Developer`.
- `VITE_NATIVE_GOOGLE_AUTH_MODE=native-bridge npm run native:doctor` passes all iOS checks, including `GoogleService-Info.plist` and the reversed client ID URL scheme.
- `xcodebuild -project ios/App/App.xcodeproj -scheme App -destination 'platform=iOS Simulator,name=iPhone 17 Pro' -clonedSourcePackagesDirPath .xcode-source-packages build` succeeds.
- iOS simulator install and launch succeeds for bundle ID `com.maisonmikell.app`.
- Simulator screenshot captured at `tmp/native-qa/maison-ios-sim-native-bridge.png`; the app lands in the native diagnostics shell signed out.
- Android remains blocked until Java/JDK, Android SDK, and `android/app/google-services.json` are added.

QA sequence for the next physical-device pass:

1. Connect an unlocked iPhone and trust this Mac.
2. Open `ios/App/App.xcodeproj`, select the physical device, and enable In-App Purchase capability on the Maison target.
3. Build native with `VITE_NATIVE_GOOGLE_AUTH_MODE=native-bridge` and the RevenueCat Test Store key first.
4. Sign in with a Maison test account and reach the gated subscription screen.
5. Confirm all three products are visible in the RevenueCat Paywall.
6. Buy monthly, yearly, and lifetime in separate test users.
7. Confirm `Mikell Labs | Maison Pro` becomes active in customer info and unlocks the Maison household experience.
8. Sign out/in with the same Firebase user and confirm access persists.
9. Tap Restore purchases and confirm access is restored.
10. Open Customer Center and confirm it loads.
11. Replace Test Store key with platform public SDK keys before App Store / Play Store submission.
