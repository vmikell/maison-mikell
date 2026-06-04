import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore'

const config = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(config)
const db = getFirestore(app)

const home = await getDoc(doc(db, 'households', 'victor-home'))
console.log('HOUSEHOLD_EXISTS', home.exists())
if (home.exists()) console.log('HOUSEHOLD', JSON.stringify(home.data(), null, 2))

const snap = await getDocs(collection(db, 'households', 'victor-home', 'shoppingLists'))
console.log('LISTS', snap.size)
for (const d of snap.docs) console.log('LIST', d.id, JSON.stringify(d.data(), null, 2))
process.exit(0)
