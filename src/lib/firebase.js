import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const publicFirebaseConfig = {
  apiKey: 'AIzaSyC-wLhbsi_rBdjlIpMc6qMLFxuPqsakTF0',
  authDomain: 'maison-reset.firebaseapp.com',
  projectId: 'maison-reset',
  storageBucket: 'maison-reset.firebasestorage.app',
  messagingSenderId: '521736129971',
  appId: '1:521736129971:web:d175060e3361f1881d0fc6',
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || publicFirebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || publicFirebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || publicFirebaseConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || publicFirebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || publicFirebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || publicFirebaseConfig.appId,
}

export const hasFirebaseConfig = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId)

export const firebaseApp = hasFirebaseConfig ? (getApps()[0] ?? initializeApp(firebaseConfig)) : null
export const auth = hasFirebaseConfig ? getAuth(firebaseApp) : null
export const firestore = hasFirebaseConfig ? getFirestore(firebaseApp) : null
