import { initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc, collection, getDocs, initializeFirestore } from 'firebase/firestore'

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

async function main() {
  const houseRef = doc(db, 'households', 'victor-home')
  const houseSnap = await getDoc(houseRef)
  console.log('HOUSE_EXISTS', houseSnap.exists())
  if (houseSnap.exists()) console.log(JSON.stringify(houseSnap.data(), null, 2))

  const listsSnap = await getDocs(collection(db, 'households', 'victor-home', 'shoppingLists'))
  console.log('LIST_COUNT', listsSnap.size)
  for (const d of listsSnap.docs) {
    console.log('LIST', d.id, JSON.stringify(d.data(), null, 2))
  }
}

main().catch((err) => {
  console.error('INSPECT_ERROR', err.code || '', err.message || err)
  process.exit(1)
})
