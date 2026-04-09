import { initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
}

const householdId = process.env.MAISON_RESET_HOUSEHOLD_ID || 'victor-home'
const app = initializeApp(firebaseConfig)
const firestore = getFirestore(app)
const householdRef = doc(firestore, 'households', householdId)
const snap = await getDoc(householdRef)
const data = snap.data() || {}

console.log(JSON.stringify({
  exists: snap.exists(),
  householdId,
  inviteCode: data.inviteCode || null,
  memberCount: Array.isArray(data.members) ? data.members.length : 0,
  members: Array.isArray(data.members) ? data.members.map((member) => ({ email: member.email, role: member.role, name: member.name })) : [],
}, null, 2))

await updateDoc(householdRef, { updatedAt: serverTimestamp() })
console.log('owner-style household update check: ok')
