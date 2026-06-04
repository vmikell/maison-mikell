import { initializeApp } from 'firebase/app'
import { getFirestore, writeBatch, doc, serverTimestamp } from 'firebase/firestore'
import { shoppingLists } from '../src/lib/data.js'

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
const batch = writeBatch(db)
for (const list of shoppingLists) {
  for (const item of list.items) {
    batch.set(doc(db, 'households', 'victor-home', 'shoppingLists', list.id, 'items', item.id), {
      ...item,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true })
  }
}
await batch.commit()
console.log('RESEEDED')
process.exit(0)
