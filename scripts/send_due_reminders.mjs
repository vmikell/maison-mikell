import { mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

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
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
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
  console.error('Missing Firebase env for reminder delivery worker.')
  process.exit(1)
}

const app = initializeApp(firebaseConfig)
const firestore = getFirestore(app)
const dryRun = process.argv.includes('--dry-run')
const fallbackRecipientEmail = process.env.MAISON_RESET_REMINDER_EMAIL || 'victormikell@gmail.com'
const pushOutboxPath = process.env.MAISON_RESET_PUSH_OUTBOX || path.join(projectRoot, 'push-outbox.json')
const householdId = process.env.MAISON_RESET_HOUSEHOLD_ID || 'victor-home'

function remindersRef() {
  return collection(firestore, 'households', householdId, 'reminders')
}

function householdDoc() {
  return doc(firestore, 'households', householdId)
}

function reminderDoc(reminderId) {
  return doc(firestore, 'households', householdId, 'reminders', reminderId)
}

async function readPendingReminders() {
  const snaps = await getDocs(query(remindersRef(), where('sent', '==', false)))
  return snaps.docs.map((snap) => ({ id: snap.id, ...snap.data() }))
}

async function readHousehold() {
  const snap = await getDoc(householdDoc())
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

async function readTasks() {
  const snaps = await getDocs(collection(firestore, 'households', householdId, 'maintenanceTasks'))
  return snaps.docs.map((snap) => ({ id: snap.id, ...snap.data() }))
}

async function markReminderSent(reminderId, channel = 'email+push') {
  const sentAt = new Date().toISOString()
  await updateDoc(reminderDoc(reminderId), {
    sent: true,
    sentAt,
    sentChannel: channel,
  })
  return sentAt
}

async function markReminderRun(channel = 'email+push', ranAt = new Date().toISOString()) {
  await updateDoc(householdDoc(), {
    lastReminderRunAt: ranAt,
    lastReminderChannel: channel,
    updatedAt: ranAt,
  })
}

function normalizeName(value) {
  return (value || '').trim().toLowerCase()
}

function resolveRecipients(item, household, tasks) {
  const members = household?.members || []
  const task = tasks.find((entry) => entry.id === item.taskId)
  const assignedName = normalizeName(task?.assignedTo)
  const claimedName = normalizeName(task?.claimedBy)

  const owners = members.filter((member) => member.role === 'owner' && (member.email || '').trim())
  const targetedMembers = members.filter((member) => {
    const memberName = normalizeName(member.name)
    const memberEmail = (member.email || '').trim()
    if (!memberEmail) return false
    if (claimedName) return memberName === claimedName
    if (assignedName) return memberName === assignedName
    return false
  })

  const deduped = new Map()
  for (const member of [...owners, ...targetedMembers]) {
    const email = (member.email || '').trim()
    if (!email) continue
    deduped.set(email.toLowerCase(), { email, name: member.name || email })
  }

  if (deduped.size) return Array.from(deduped.values())
  return [{ email: fallbackRecipientEmail, name: household?.name || 'Household owner' }]
}

function renderMessage(item, recipient) {
  const greeting = recipient?.name ? `Hi ${recipient.name},` : 'Hi,'
  return `${greeting}\n\n[Maison Reset] ${item.title} is due on ${item.dueAt}. Reminder window opened ${item.leadDays} day(s) ahead.`
}

function sendEmail(recipientEmail, item, message) {
  const tempDir = mkdtempSync(path.join(tmpdir(), 'maison-reset-'))
  const bodyPath = path.join(tempDir, 'body.txt')
  writeFileSync(bodyPath, `${message}\n\nTask: ${item.title}\nDue: ${item.dueAt}\nReminder opened: ${item.remindAt}\n`)
  const result = spawnSync('python3', [
    '/home/vboxuser/.openclaw/workspace/tools/send_email.py',
    recipientEmail,
    `Maison Reset reminder: ${item.title}`,
    bodyPath,
  ], { encoding: 'utf8' })
  rmSync(tempDir, { recursive: true, force: true })
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || 'Email delivery failed')
}

function queuePush(item, message, recipients) {
  const payload = {
    id: item.id,
    title: 'Maison Reset reminder',
    body: message,
    taskId: item.taskId,
    dueAt: item.dueAt,
    recipients,
    createdAt: new Date().toISOString(),
  }
  const items = existsSync(pushOutboxPath) ? JSON.parse(readFileSync(pushOutboxPath, 'utf8')) : []
  items.push(payload)
  writeFileSync(pushOutboxPath, JSON.stringify(items, null, 2))
}

const [reminders, household, tasks] = await Promise.all([
  readPendingReminders(),
  readHousehold(),
  readTasks(),
])
const today = new Date().toISOString().slice(0, 10)
const due = reminders.filter((item) => item.remindAt <= today && !item.sent)

console.log(`Pending reminders: ${reminders.length}`)
console.log(`Due to send today: ${due.length}`)

if (!dryRun && due.length) {
  const runAt = new Date().toISOString()
  for (const item of due) {
    const recipients = resolveRecipients(item, household, tasks)
    console.log(`[Reminder recipients] ${item.title}: ${recipients.map((entry) => entry.email).join(', ')}`)
    for (const recipient of recipients) {
      const message = renderMessage(item, recipient)
      console.log(message)
      sendEmail(recipient.email, item, message)
    }
    queuePush(item, renderMessage(item, recipients[0]), recipients.map((entry) => entry.email))
    await markReminderSent(item.id, 'email+push')
  }
  await markReminderRun('email+push', runAt)
} else {
  for (const item of due) {
    const recipients = resolveRecipients(item, household, tasks)
    console.log(`[Reminder recipients] ${item.title}: ${recipients.map((entry) => entry.email).join(', ')}`)
    for (const recipient of recipients) {
      const message = renderMessage(item, recipient)
      console.log(message)
    }
  }
}

console.log(dryRun ? 'Dry run complete.' : 'Reminder delivery execution complete.')
