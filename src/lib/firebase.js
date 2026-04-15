import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

function resolveAuthDomain() {
  const configuredAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || ''
  if (typeof window === 'undefined') return configuredAuthDomain
  const currentHost = window.location.hostname || ''
  if (currentHost === 'maison-mikell.netlify.app') return currentHost
  return configuredAuthDomain
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: resolveAuthDomain(),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
}

export const hasFirebaseConfig = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId)

export const firebaseApp = hasFirebaseConfig ? (getApps()[0] ?? initializeApp(firebaseConfig)) : null
export const auth = hasFirebaseConfig ? getAuth(firebaseApp) : null
export const firestore = hasFirebaseConfig ? getFirestore(firebaseApp) : null
