import { useEffect, useState } from 'react'
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  deleteUser,
  getRedirectResult,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithRedirect,
  signOut,
  updateProfile,
  getIdTokenResult,
} from 'firebase/auth'
import { auth, hasFirebaseConfig } from './firebase'
import { appendDiagnosticsEvent } from './diagnosticsStore'

const provider = new GoogleAuthProvider()

function getCurrentPageUrl() {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}${window.location.pathname}${window.location.search}${window.location.hash}`
}

function recordAuthDiagnostic(type, detail) {
  try {
    appendDiagnosticsEvent(type, detail)
  } catch {
    // Diagnostics must stay passive and never block auth flows.
  }
}

function summarizeAuthUser(user) {
  if (!user) return { signedIn: false }
  return {
    signedIn: true,
    isAnonymous: Boolean(user.isAnonymous),
    providerIds: user.providerData?.map((providerItem) => providerItem.providerId).filter(Boolean) || [],
  }
}

function missingFirebaseConfigResult() {
  return {
    error: 'Maison auth is not configured in this live build yet. Firebase environment variables are missing, so sign-in cannot start.',
    rawCode: 'maison/missing-firebase-config',
    rawMessage: 'Firebase auth is unavailable because VITE_FIREBASE_* variables were not available at build time.',
  }
}

function normalizeEmail(value = '') {
  return value.trim().toLowerCase()
}

function buildDisplayNameFallback(email = '') {
  const localPart = normalizeEmail(email).split('@')[0] || 'Maison member'
  return localPart
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase())
}

function toPlainEnglishAuthError(error, context = {}) {
  const code = error?.code || ''

  if (code.includes('popup-blocked')) return 'Your browser blocked the Google sign-in popup. Maison now uses full-page Google sign-in instead, so try again.'
  if (code.includes('popup-closed')) return 'The Google sign-in window closed before the login finished. Try again.'
  if (code.includes('unauthorized-domain')) return 'Google sign-in is not allowed on this site yet. Firebase needs this Netlify domain added as an authorized domain.'
  if (code.includes('operation-not-allowed')) {
    return context.provider === 'email'
      ? 'Email and password sign-in is not enabled in Firebase yet.'
      : 'Google sign-in is not enabled in Firebase yet.'
  }
  if (code.includes('invalid-email')) return 'That email address does not look valid.'
  if (code.includes('missing-password')) return 'Enter your password to continue.'
  if (code.includes('weak-password')) return 'Use a stronger password, at least 6 characters.'
  if (code.includes('email-already-in-use')) return 'That email already has an account. Try signing in instead.'
  if (code.includes('invalid-credential') || code.includes('invalid-login-credentials') || code.includes('wrong-password') || code.includes('user-not-found')) {
    return 'That email or password did not match an account.'
  }
  if (code.includes('too-many-requests')) return 'Too many sign-in attempts just now. Give it a minute and try again.'
  if (code.includes('missing-email')) return 'Enter your email address first.'
  if (code.includes('requires-recent-login')) return 'For security, sign in again and retry that action right away.'

  if (context.provider === 'email') {
    return 'Email sign-in did not finish. Check that email/password is enabled in Firebase and try again.'
  }

  return 'Sign-in did not finish. Check that Google sign-in is enabled in Firebase and that this Netlify domain is authorized.'
}

export function useAuthState() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(() => Boolean(hasFirebaseConfig && auth))
  const [authError, setAuthError] = useState('')
  const [authErrorCode, setAuthErrorCode] = useState('')

  useEffect(() => {
    if (!hasFirebaseConfig || !auth) return

    let isActive = true
    let sawInitialAuthSnapshot = false
    let redirectCheckFinished = false
    let lastAuthSnapshotKey = ''

    function settleLoading() {
      if (!isActive) return
      if (sawInitialAuthSnapshot && redirectCheckFinished) setAuthLoading(false)
    }

    getRedirectResult(auth)
      .then((result) => {
        if (!isActive || !result?.user) return
        recordAuthDiagnostic('auth_redirect_result_success', {
          providerId: result.providerId || 'unknown',
          url: getCurrentPageUrl(),
        })
        setUser(result.user)
        setAuthError('')
        setAuthErrorCode('')
      })
      .catch((error) => {
        if (!isActive) return
        recordAuthDiagnostic('auth_redirect_result_error', {
          code: error?.code || 'unknown',
          message: toPlainEnglishAuthError(error),
          url: getCurrentPageUrl(),
        })
        setAuthError(toPlainEnglishAuthError(error))
        setAuthErrorCode(error?.code || '')
      })
      .finally(() => {
        redirectCheckFinished = true
        settleLoading()
      })

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      if (!isActive) return
      sawInitialAuthSnapshot = true
      const authSnapshot = summarizeAuthUser(nextUser)
      const authSnapshotKey = JSON.stringify(authSnapshot)
      if (authSnapshotKey !== lastAuthSnapshotKey) {
        recordAuthDiagnostic('auth_state_change', authSnapshot)
        lastAuthSnapshotKey = authSnapshotKey
      }
      setUser(nextUser)
      if (nextUser) {
        setAuthError('')
        setAuthErrorCode('')
      }
      settleLoading()
    })
    return () => {
      isActive = false
      unsubscribe()
    }
  }, [])

  return { user, authLoading, authError, authErrorCode, setAuthError, setAuthErrorCode }
}

export async function signInWithGoogle() {
  if (!hasFirebaseConfig || !auth) return { redirected: false, ...missingFirebaseConfigResult() }
  try {
    recordAuthDiagnostic('auth_google_redirect_start', {
      url: getCurrentPageUrl(),
      userAgent: typeof navigator === 'undefined' ? 'unknown' : navigator.userAgent,
    })
    await signInWithRedirect(auth, provider)
    return { redirected: true }
  } catch (error) {
    const message = toPlainEnglishAuthError(error)
    recordAuthDiagnostic('auth_google_redirect_error', {
      code: error?.code || 'unknown',
      message,
      url: getCurrentPageUrl(),
    })
    return { redirected: false, error: message, rawCode: error?.code || '', rawMessage: error?.message || '' }
  }
}

export async function signInWithEmailPassword(input = {}) {
  if (!hasFirebaseConfig || !auth) return { user: null, ...missingFirebaseConfigResult() }
  try {
    const result = await signInWithEmailAndPassword(auth, normalizeEmail(input.email), input.password || '')
    return { user: result.user }
  } catch (error) {
    const message = toPlainEnglishAuthError(error, { provider: 'email' })
    return { user: null, error: message, rawCode: error?.code || '', rawMessage: error?.message || '' }
  }
}

export async function createEmailPasswordAccount(input = {}) {
  if (!hasFirebaseConfig || !auth) return { user: null, ...missingFirebaseConfigResult() }
  try {
    const normalizedEmail = normalizeEmail(input.email)
    const result = await createUserWithEmailAndPassword(auth, normalizedEmail, input.password || '')
    const displayName = (input.name || '').trim() || buildDisplayNameFallback(normalizedEmail)

    if (displayName) {
      await updateProfile(result.user, { displayName })
      await result.user.reload()
      await getIdTokenResult(result.user, true)
    }

    return { user: auth.currentUser ?? result.user, displayName }
  } catch (error) {
    const message = toPlainEnglishAuthError(error, { provider: 'email' })
    return { user: null, error: message, rawCode: error?.code || '', rawMessage: error?.message || '' }
  }
}

export async function sendPasswordReset(input = {}) {
  if (!hasFirebaseConfig || !auth) return missingFirebaseConfigResult()
  try {
    await sendPasswordResetEmail(auth, normalizeEmail(input.email))
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: toPlainEnglishAuthError(error, { provider: 'email' }),
      rawCode: error?.code || '',
      rawMessage: error?.message || '',
    }
  }
}

export async function signOutUser() {
  if (!auth) return
  recordAuthDiagnostic('auth_sign_out_start', { url: getCurrentPageUrl() })
  await signOut(auth)
  recordAuthDiagnostic('auth_sign_out_complete', { url: getCurrentPageUrl() })
}

export async function ensureRecentLogin(input = {}) {
  if (!auth?.currentUser) return { ok: false, error: 'No signed-in user.' }

  const providerIds = auth.currentUser.providerData?.map((provider) => provider.providerId).filter(Boolean) || []
  if (providerIds.includes('password')) {
    const email = normalizeEmail(input.email || auth.currentUser.email || '')
    const password = input.password || ''
    if (!email || !password) {
      return { ok: false, needsPassword: true, error: 'Enter your current password to confirm account deletion.' }
    }

    try {
      const credential = EmailAuthProvider.credential(email, password)
      await reauthenticateWithCredential(auth.currentUser, credential)
      return { ok: true }
    } catch (error) {
      return {
        ok: false,
        needsPassword: true,
        error: toPlainEnglishAuthError(error, { provider: 'email' }),
        rawCode: error?.code || '',
      }
    }
  }

  const lastSignInAt = Number(auth.currentUser.metadata?.lastSignInTime ? new Date(auth.currentUser.metadata.lastSignInTime) : 0)
  const maxAgeMs = 10 * 60 * 1000
  if (Date.now() - lastSignInAt > maxAgeMs) {
    return {
      ok: false,
      error: 'For security, sign out, sign back in, and then retry account deletion right away.',
      requiresFreshSignIn: true,
    }
  }

  return { ok: true }
}

export async function deleteSignedInAuthUser() {
  if (!auth?.currentUser) return { ok: false, error: 'No signed-in user.' }
  try {
    await deleteUser(auth.currentUser)
    return { ok: true }
  } catch (error) {
    const code = error?.code || ''
    if (code.includes('requires-recent-login')) {
      try {
        await signOut(auth)
      } catch {
        // Ignore sign-out cleanup failures here, the main issue is the stale auth session.
      }
      return {
        ok: false,
        error: 'For security, you need a fresh sign-in before Maison can fully delete this account. You have been signed out, so sign back in and retry deletion right away.',
      }
    }
    return {
      ok: false,
      error: error?.message || 'Could not delete the signed-in account.',
    }
  }
}
