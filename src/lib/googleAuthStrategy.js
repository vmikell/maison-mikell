import { Capacitor } from '@capacitor/core'

export const WEB_REDIRECT_MODE = 'firebase-web-redirect'
export const NATIVE_BRIDGE_MODE = 'native-bridge'
export const HOSTED_BROWSER_MODE = 'hosted-browser-deeplink'

function normalizePreferredMode(rawValue = '') {
  const value = String(rawValue || '').trim().toLowerCase()
  if (!value) return WEB_REDIRECT_MODE
  if (value === WEB_REDIRECT_MODE) return WEB_REDIRECT_MODE
  if (value === NATIVE_BRIDGE_MODE) return NATIVE_BRIDGE_MODE
  if (value === HOSTED_BROWSER_MODE) return HOSTED_BROWSER_MODE
  if (value === 'native' || value === 'native-google-auth') return NATIVE_BRIDGE_MODE
  if (value === 'browser' || value === 'hosted-browser') return HOSTED_BROWSER_MODE
  return WEB_REDIRECT_MODE
}

function isNativeShellPlatform(platform) {
  return platform === 'ios' || platform === 'android'
}

export function getGoogleAuthStrategyPlan() {
  const platform = Capacitor.getPlatform()
  const isNativeShell = isNativeShellPlatform(platform)
  const preferredMode = normalizePreferredMode(import.meta.env.VITE_NATIVE_GOOGLE_AUTH_MODE)

  if (!isNativeShell) {
    return {
      platform,
      isNativeShell,
      preferredMode,
      effectiveMode: WEB_REDIRECT_MODE,
      fallbackApplied: preferredMode !== WEB_REDIRECT_MODE,
      rationale: 'Web builds always use the Firebase web redirect flow.',
    }
  }

  if (preferredMode === WEB_REDIRECT_MODE) {
    return {
      platform,
      isNativeShell,
      preferredMode,
      effectiveMode: WEB_REDIRECT_MODE,
      fallbackApplied: false,
      rationale: 'Native auth scaffold is present, but the shell is intentionally still using Firebase web redirect until the dedicated mobile path is fully wired and verified.',
    }
  }

  if (preferredMode === NATIVE_BRIDGE_MODE) {
    return {
      platform,
      isNativeShell,
      preferredMode,
      effectiveMode: NATIVE_BRIDGE_MODE,
      fallbackApplied: false,
      rationale: 'Native shells can now use the Capacitor Firebase Authentication bridge for Google sign-in when the mobile Firebase client config is present.',
    }
  }

  return {
    platform,
    isNativeShell,
    preferredMode,
    effectiveMode: WEB_REDIRECT_MODE,
    fallbackApplied: true,
    rationale: 'Requested hosted browser deep-link mode is still scaffolded only, so Maison is falling back to the current Firebase web redirect flow.',
  }
}

export function getGoogleAuthStrategySummary() {
  const plan = getGoogleAuthStrategyPlan()
  return `${plan.platform}:${plan.effectiveMode}${plan.fallbackApplied ? ':fallback' : ''}`
}
