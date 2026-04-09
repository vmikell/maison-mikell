import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import path from 'node:path'
import process from 'node:process'

const projectRoot = path.resolve(new URL('..', import.meta.url).pathname)

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return
  const raw = readFileSync(filePath, 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    let value = trimmed.slice(idx + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1)
    if (!(key in process.env)) process.env[key] = value
  }
}

loadEnvFile(path.join(projectRoot, '.env.local'))
loadEnvFile(path.join(projectRoot, '.env'))

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || '',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || '',
}

if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
  console.error('Missing Firebase env for household export.')
  process.exit(1)
}

const householdId = process.env.MAISON_RESET_HOUSEHOLD_ID || 'victor-home'
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const snap = await getDoc(doc(db, 'households', householdId))
const members = snap.exists() ? (snap.data().members || []) : []
const patchedMembers = members.map((member) => {
  const normalizedName = (member.name || '').trim().toLowerCase()
  if (normalizedName === 'riah' || normalizedName === 'mariah neuroth' || normalizedName === 'mariah') {
    return { ...member, email: 'mariah@rawartworks.org' }
  }
  return member
})

const outputPath = path.join(projectRoot, 'household-members.json')
writeFileSync(outputPath, JSON.stringify(patchedMembers, null, 2))
console.log(`Exported ${patchedMembers.length} household members to ${outputPath}.`)
