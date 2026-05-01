import { useCallback, useEffect, useMemo, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { LOG_LEVEL, PACKAGE_TYPE, PAYWALL_RESULT, Purchases } from '@revenuecat/purchases-capacitor'
import { PaywallPresentationConfiguration, RevenueCatUI } from '@revenuecat/purchases-capacitor-ui'

export const REVENUECAT_TEST_API_KEY = 'test_BhuminqNyhGvPzGGrqsWmLjijdY'
export const SUBSCRIPTION_ENTITLEMENT_DISPLAY_NAME = 'Mikell Labs | Maison Pro'
export const SUBSCRIPTION_ENTITLEMENT_ID = import.meta.env.VITE_REVENUECAT_ENTITLEMENT_ID || 'Mikell Labs | Maison Pro'
export const LIFETIME_PRODUCT_ID = import.meta.env.VITE_REVENUECAT_LIFETIME_PRODUCT_ID || 'founders_lifetime_v2'
export const YEARLY_PRODUCT_ID = import.meta.env.VITE_REVENUECAT_YEARLY_PRODUCT_ID || 'yearly_v2'
export const MONTHLY_PRODUCT_ID = import.meta.env.VITE_REVENUECAT_MONTHLY_PRODUCT_ID || 'monthly_v2'
export const REVENUECAT_OFFERING_ID = import.meta.env.VITE_REVENUECAT_OFFERING_ID || 'default'
export const PRIVACY_POLICY_URL = import.meta.env.VITE_PRIVACY_POLICY_URL || '/privacy.html'
export const TERMS_URL = import.meta.env.VITE_TERMS_URL || '/terms.html'

let configuredForUserId = ''
let didSetLogLevel = false

function getRevenueCatApiKey() {
  const platform = Capacitor.getPlatform()
  if (platform === 'ios') return import.meta.env.VITE_REVENUECAT_IOS_API_KEY || REVENUECAT_TEST_API_KEY
  if (platform === 'android') return import.meta.env.VITE_REVENUECAT_ANDROID_API_KEY || REVENUECAT_TEST_API_KEY
  return ''
}

function normalizeCustomerInfo(result) {
  return result?.customerInfo || result || null
}

function normalizeOfferings(result) {
  return result?.offerings || result || null
}

function getEntitlement(customerInfo) {
  return customerInfo?.entitlements?.active?.[SUBSCRIPTION_ENTITLEMENT_ID] || null
}

function isProCustomer(customerInfo) {
  return Boolean(getEntitlement(customerInfo))
}

function getPackageProductId(revenueCatPackage) {
  return revenueCatPackage?.product?.identifier || revenueCatPackage?.product?.productIdentifier || ''
}

function getPackageIdentifier(revenueCatPackage) {
  return revenueCatPackage?.identifier || ''
}

function getPackageByPlan(availablePackages, currentOffering, plan) {
  const productIdByPlan = {
    lifetime: LIFETIME_PRODUCT_ID,
    yearly: YEARLY_PRODUCT_ID,
    monthly: MONTHLY_PRODUCT_ID,
  }
  const packageTypeByPlan = {
    lifetime: PACKAGE_TYPE.LIFETIME,
    yearly: PACKAGE_TYPE.ANNUAL,
    monthly: PACKAGE_TYPE.MONTHLY,
  }
  const currentKeyByPlan = {
    lifetime: 'lifetime',
    yearly: 'annual',
    monthly: 'monthly',
  }
  const productId = productIdByPlan[plan]
  const packageType = packageTypeByPlan[plan]
  const currentKey = currentKeyByPlan[plan]

  return availablePackages.find((item) => getPackageProductId(item) === productId)
    || availablePackages.find((item) => getPackageIdentifier(item) === plan)
    || availablePackages.find((item) => item?.packageType === packageType)
    || currentOffering?.[currentKey]
    || null
}

function normalizeRevenueCatError(error, fallback) {
  if (error?.userCancelled) return 'Purchase cancelled.'
  if (error?.code && error?.message) return `${error.message} (${error.code})`
  return error?.message || fallback
}

async function configureRevenueCat(user) {
  if (!Capacitor.isNativePlatform()) {
    return { configured: false, reason: 'RevenueCat purchases are available in the native iOS and Android apps.' }
  }

  const apiKey = getRevenueCatApiKey()
  if (!apiKey) {
    return { configured: false, reason: 'RevenueCat API key is missing for this native platform.' }
  }

  if (!didSetLogLevel) {
    await Purchases.setLogLevel({ level: import.meta.env.DEV ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN })
    didSetLogLevel = true
  }

  const appUserID = user?.uid || ''
  const configurationKey = `${Capacitor.getPlatform()}:${appUserID || 'anonymous'}`
  if (configuredForUserId === configurationKey) return { configured: true, reason: '' }

  if (configuredForUserId && appUserID) {
    await Purchases.logIn({ appUserID })
    configuredForUserId = configurationKey
    return { configured: true, reason: '' }
  }

  await Purchases.configure(appUserID ? { apiKey, appUserID } : { apiKey })
  configuredForUserId = configurationKey
  return { configured: true, reason: '' }
}

async function fetchSubscriptionSnapshot(user) {
  const configuration = await configureRevenueCat(user)
  if (!configuration.configured) {
    return {
      configured: false,
      configurationReason: configuration.reason,
      customerInfo: null,
      offerings: null,
      isActive: false,
      lifetimePackage: null,
      yearlyPackage: null,
      monthlyPackage: null,
    }
  }

  const [customerInfoResult, offeringsResult] = await Promise.all([
    Purchases.getCustomerInfo(),
    Purchases.getOfferings(),
  ])
  const customerInfo = normalizeCustomerInfo(customerInfoResult)
  const offerings = normalizeOfferings(offeringsResult)
  const currentOffering = offerings?.all?.[REVENUECAT_OFFERING_ID] || offerings?.current || null
  const availablePackages = currentOffering?.availablePackages || []

  return {
    configured: true,
    configurationReason: '',
    customerInfo,
    offerings,
    isActive: isProCustomer(customerInfo),
    lifetimePackage: getPackageByPlan(availablePackages, currentOffering, 'lifetime'),
    yearlyPackage: getPackageByPlan(availablePackages, currentOffering, 'yearly'),
    monthlyPackage: getPackageByPlan(availablePackages, currentOffering, 'monthly'),
  }
}

function didPaywallUnlockAccess(result) {
  return result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED
}

export function useSubscriptionAccess(user) {
  const [state, setState] = useState({
    loading: Boolean(user),
    configured: false,
    configurationReason: '',
    customerInfo: null,
    offerings: null,
    isActive: false,
    lifetimePackage: null,
    yearlyPackage: null,
    monthlyPackage: null,
    error: '',
    action: '',
  })

  const refresh = useCallback(async () => {
    if (!user) {
      setState((current) => ({ ...current, loading: false, isActive: false, customerInfo: null, error: '', action: '' }))
      return null
    }

    setState((current) => ({ ...current, loading: true, error: '' }))
    try {
      const snapshot = await fetchSubscriptionSnapshot(user)
      setState((current) => ({ ...current, ...snapshot, loading: false, error: '', action: '' }))
      return snapshot
    } catch (error) {
      const message = normalizeRevenueCatError(error, 'Maison could not check your subscription. Try again.')
      setState((current) => ({ ...current, loading: false, isActive: false, error: message, action: '' }))
      return null
    }
  }, [user])

  useEffect(() => {
    let cancelled = false
    async function load() {
      const snapshot = await refresh()
      if (cancelled || !snapshot) return
    }
    load()
    return () => {
      cancelled = true
    }
  }, [refresh])

  useEffect(() => {
    if (!user || !Capacitor.isNativePlatform()) return undefined
    let listenerId = ''
    let cancelled = false

    async function attachCustomerInfoListener() {
      try {
        const configuration = await configureRevenueCat(user)
        if (!configuration.configured || cancelled) return
        listenerId = await Purchases.addCustomerInfoUpdateListener((customerInfo) => {
          setState((current) => ({
            ...current,
            customerInfo,
            isActive: isProCustomer(customerInfo),
            error: '',
          }))
        })
      } catch (error) {
        if (!cancelled) {
          setState((current) => ({
            ...current,
            error: normalizeRevenueCatError(error, 'Maison could not listen for subscription updates.'),
          }))
        }
      }
    }

    attachCustomerInfoListener()
    return () => {
      cancelled = true
      if (listenerId) Purchases.removeCustomerInfoUpdateListener({ listenerToRemove: listenerId })
    }
  }, [user])

  const purchase = useCallback(async (revenueCatPackage) => {
    if (!revenueCatPackage) {
      setState((current) => ({ ...current, error: 'That subscription product is not available yet.' }))
      return null
    }

    setState((current) => ({ ...current, action: 'purchase', error: '' }))
    try {
      const result = await Purchases.purchasePackage({ aPackage: revenueCatPackage })
      const customerInfo = normalizeCustomerInfo(result)
      const isActive = isProCustomer(customerInfo)
      setState((current) => ({ ...current, customerInfo, isActive, action: '', error: '' }))
      if (!isActive) await refresh()
      return customerInfo
    } catch (error) {
      const message = normalizeRevenueCatError(error, 'Purchase did not finish. Try again.')
      setState((current) => ({ ...current, action: '', error: message }))
      return null
    }
  }, [refresh])

  const restore = useCallback(async () => {
    setState((current) => ({ ...current, action: 'restore', error: '' }))
    try {
      const result = await Purchases.restorePurchases()
      const customerInfo = normalizeCustomerInfo(result)
      setState((current) => ({ ...current, customerInfo, isActive: isProCustomer(customerInfo), action: '', error: '' }))
      return customerInfo
    } catch (error) {
      setState((current) => ({ ...current, action: '', error: normalizeRevenueCatError(error, 'Restore did not finish. Try again.') }))
      return null
    }
  }, [])

  const presentPaywall = useCallback(async () => {
    setState((current) => ({ ...current, action: 'paywall', error: '' }))
    try {
      const snapshot = await fetchSubscriptionSnapshot(user)
      const offering = snapshot?.offerings?.all?.[REVENUECAT_OFFERING_ID] || snapshot?.offerings?.current || undefined
      const { result } = await RevenueCatUI.presentPaywall({
        offering,
        displayCloseButton: true,
        presentationConfiguration: PaywallPresentationConfiguration.DEFAULT,
        customVariables: {
          app_name: 'Mikell Labs | Maison',
          entitlement_name: SUBSCRIPTION_ENTITLEMENT_DISPLAY_NAME,
        },
      })
      const nextSnapshot = await refresh()
      setState((current) => ({
        ...current,
        action: '',
        error: didPaywallUnlockAccess(result) || nextSnapshot?.isActive ? '' : current.error,
      }))
      return result
    } catch (error) {
      setState((current) => ({ ...current, action: '', error: normalizeRevenueCatError(error, 'Paywall could not be shown. Try again.') }))
      return PAYWALL_RESULT.ERROR
    }
  }, [refresh, user])

  const presentPaywallIfNeeded = useCallback(async () => {
    setState((current) => ({ ...current, action: 'paywall', error: '' }))
    try {
      const snapshot = await fetchSubscriptionSnapshot(user)
      const offering = snapshot?.offerings?.all?.[REVENUECAT_OFFERING_ID] || snapshot?.offerings?.current || undefined
      const { result } = await RevenueCatUI.presentPaywallIfNeeded({
        offering,
        requiredEntitlementIdentifier: SUBSCRIPTION_ENTITLEMENT_ID,
        displayCloseButton: true,
        presentationConfiguration: PaywallPresentationConfiguration.DEFAULT,
        customVariables: {
          app_name: 'Mikell Labs | Maison',
          entitlement_name: SUBSCRIPTION_ENTITLEMENT_DISPLAY_NAME,
        },
      })
      await refresh()
      setState((current) => ({ ...current, action: '', error: '' }))
      return result
    } catch (error) {
      setState((current) => ({ ...current, action: '', error: normalizeRevenueCatError(error, 'Paywall could not be shown. Try again.') }))
      return PAYWALL_RESULT.ERROR
    }
  }, [refresh, user])

  const presentCustomerCenter = useCallback(async () => {
    setState((current) => ({ ...current, action: 'customer-center', error: '' }))
    try {
      await configureRevenueCat(user)
      await RevenueCatUI.presentCustomerCenter()
      await refresh()
      setState((current) => ({ ...current, action: '', error: '' }))
    } catch (error) {
      setState((current) => ({ ...current, action: '', error: normalizeRevenueCatError(error, 'Customer Center could not be opened. Try again.') }))
    }
  }, [refresh, user])

  return useMemo(() => ({
    ...state,
    refresh,
    purchase,
    restore,
    presentPaywall,
    presentPaywallIfNeeded,
    presentCustomerCenter,
  }), [state, refresh, purchase, restore, presentPaywall, presentPaywallIfNeeded, presentCustomerCenter])
}
