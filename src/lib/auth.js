import { useEffect, useState } from 'react'
import { GoogleAuthProvider, deleteUser, getRedirectResult, onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth'
import { auth, hasFirebaseConfig } from './firebase'

const provider = new GoogleAuthProvider()

function prefersRedirectSignIn() {
  if (typeof window === 'undefined') return false
  const ua = window.navigator?.userAgent || ''
  return /iPhone|iPad|iPod|Mobile Safari/i.test(ua)
}

function toPlainEnglishAuthError(error) {
  const code = error?.code || ''
  if (code.includes('popup-blocked')) return 'Your browser blocked the Google sign-in popup. Try the full-page sign-in button instead.'
  if (code.includes('popup-closed')) return 'The sign-in popup was closed before Google finished. Try again.'
  if (code.includes('unauthorized-domain')) return 'Google sign-in is not allowed on this site yet. Firebase needs this Netlify domain added as an authorized domain.'
  if (code.includes('operation-not-allowed')) return 'Google sign-in is not enabled in Firebase yet.'
  return 'Sign-in did not finish. On mobile, use the full-page sign-in button. If it still fails, Firebase likely needs this Netlify domain added as an authorized domain.'
}

export function useAuthState() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(() => Boolean(hasFirebaseConfig && auth))
  const [authError, setAuthError] = useState('')
  const [authErrorCode, setAuthErrorCode] = useState('')

  useEffect(() => {
    if (!hasFirebaseConfig || !auth) return

    getRedirectResult(auth)
      .then(() => {})
      .catch((error) => {
        setAuthError(toPlainEnglishAuthError(error))
        setAuthErrorCode(error?.code || '')
      })

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setAuthLoading(false)
      if (nextUser) {
        setAuthError('')
        setAuthErrorCode('')
      }
    })
    return unsubscribe
  }, [])

  return { user, authLoading, authError, authErrorCode, setAuthError, setAuthErrorCode }
}

export async function signInWithGoogle() {
  if (!auth) return null
  if (prefersRedirectSignIn()) {
    await signInWithRedirect(auth, provider)
    return { user: null, redirected: true, mobileRedirect: true }
  }
  try {
    const result = await signInWithPopup(auth, provider)
    return { user: result.user, redirected: false }
  } catch (error) {
    const message = toPlainEnglishAuthError(error)
    return { user: null, redirected: false, error: message, rawCode: error?.code || '', rawMessage: error?.message || '' }
  }
}

export async function signInWithGoogleRedirect() {
  if (!auth) return null
  await signInWithRedirect(auth, provider)
  return { redirected: true }
}

export async function signOutUser() {
  if (!auth) return
  await signOut(auth)
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
      } catch {}
      return {
        ok: false,
        error: 'For security, Google needs a fresh sign-in before it can fully delete this account. You have been signed out, so if you sign in again you can retry deletion immediately.',
      }
    }
    return {
      ok: false,
      error: error?.message || 'Could not delete the signed-in account.',
    }
  }
}
