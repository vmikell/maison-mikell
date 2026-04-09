import { useEffect, useState } from 'react'
import { GoogleAuthProvider, getRedirectResult, onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth'
import { auth, hasFirebaseConfig } from './firebase'

const provider = new GoogleAuthProvider()

function toPlainEnglishAuthError(error) {
  const code = error?.code || ''
  if (code.includes('popup-blocked')) return 'Your browser blocked the Google sign-in popup. Try the full-page sign-in button instead.'
  if (code.includes('popup-closed')) return 'The sign-in popup was closed before Google finished. Try again.'
  if (code.includes('unauthorized-domain')) return 'Google sign-in is not allowed on this site yet. Firebase needs this Netlify domain added as an authorized domain.'
  if (code.includes('operation-not-allowed')) return 'Google sign-in is not enabled in Firebase yet.'
  return 'Sign-in did not finish. Check that Google sign-in is enabled in Firebase and that this Netlify domain is authorized.'
}

export function useAuthState() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(() => Boolean(hasFirebaseConfig && auth))
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    if (!hasFirebaseConfig || !auth) return

    getRedirectResult(auth)
      .then(() => {})
      .catch((error) => setAuthError(toPlainEnglishAuthError(error)))

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setAuthLoading(false)
      if (nextUser) setAuthError('')
    })
    return unsubscribe
  }, [])

  return { user, authLoading, authError, setAuthError }
}

export async function signInWithGoogle() {
  if (!auth) return null
  try {
    const result = await signInWithPopup(auth, provider)
    return { user: result.user, redirected: false }
  } catch (error) {
    const message = toPlainEnglishAuthError(error)
    return { user: null, redirected: false, error: message, rawCode: error?.code || '' }
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
