import { initializeApp } from 'firebase/app'
import { initializeFirestore, collection, getDocs } from 'firebase/firestore'

const config = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(config)
const db = initializeFirestore(app, { experimentalForceLongPolling: true, useFetchStreams: false })

for (const listId of ['home-depot','grocery','amazon','costco','other']) {
  try {
    const snap = await getDocs(collection(db, 'households', 'victor-home', 'shoppingLists', listId, 'items'))
    console.log('ITEMS', listId, snap.size)
    for (const d of snap.docs) console.log(listId, d.id, JSON.stringify(d.data(), null, 2))
  } catch (err) {
    console.error('ITEMS_ERROR', listId, err.code || '', err.message || err)
  }
}
process.exit(0)
