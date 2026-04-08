import { useEffect, useState } from 'react'
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { auth, hasFirebaseConfig } from './firebase'

const provider = new GoogleAuthProvider()

export function useAuthState() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(hasFirebaseConfig)

  useEffect(() => {
    if (!hasFirebaseConfig || !auth) {
      setAuthLoading(false)
      return
    }
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setAuthLoading(false)
    })
    return unsubscribe
  }, [])

  return { user, authLoading }
}

export async function signInWithGoogle() {
  if (!auth) return null
  const result = await signInWithPopup(auth, provider)
  return result.user
}

export async function signOutUser() {
  if (!auth) return
  await signOut(auth)
}
