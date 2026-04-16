import { readFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFile as execFileCallback } from 'node:child_process'
import { promisify } from 'node:util'
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword, deleteUser, signOut } from 'firebase/auth'
import { getFirestore, collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, writeBatch } from 'firebase/firestore'

const execFile = promisify(execFileCallback)
const projectId = 'maison-reset'
const publicFirebaseConfig = {
  apiKey: 'AIzaSyC-wLhbsi_rBdjlIpMc6qMLFxuPqsakTF0',
  authDomain: 'maison-reset.firebaseapp.com',
  projectId: 'maison-reset',
  storageBucket: 'maison-reset.firebasestorage.app',
  messagingSenderId: '521736129971',
  appId: '1:521736129971:web:d175060e3361f1881d0fc6',
}

const argv = process.argv.slice(2)
const options = {
  domain: 'example.com',
  regex: '',
  password: '',
  confirm: false,
}

for (let index = 0; index < argv.length; index += 1) {
  const token = argv[index]
  if (token === '--domain') options.domain = argv[index + 1] || options.domain
  if (token === '--regex') options.regex = argv[index + 1] || ''
  if (token === '--password') options.password = argv[index + 1] || ''
  if (token === '--confirm') options.confirm = true
}

function buildMatcher() {
  if (options.regex) {
    const regex = new RegExp(options.regex, 'i')
    return (email = '') => regex.test(email)
  }
  const domain = (options.domain || '').trim().toLowerCase()
  return (email = '') => email.toLowerCase().endsWith(`@${domain}`)
}

function getFirebaseAccessToken() {
  const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json')
  const config = JSON.parse(readFileSync(configPath, 'utf8'))
  const token = config?.tokens?.access_token || ''
  if (!token) throw new Error('No Firebase CLI access token found. Run firebase login first.')
  return token
}

async function exportUsers() {
  const outFile = path.join(os.tmpdir(), `maison-auth-export-${Date.now()}.json`)
  await execFile('firebase', ['auth:export', outFile, '--format=json'], {
    cwd: process.cwd(),
    maxBuffer: 50 * 1024 * 1024,
  })
  const raw = JSON.parse(readFileSync(outFile, 'utf8'))
  return Array.isArray(raw?.users) ? raw.users : Array.isArray(raw) ? raw : []
}

function isPasswordOnlyUser(user) {
  const providers = (user.providerUserInfo || []).map((provider) => provider.providerId)
  return !providers.includes('google.com')
}

function householdRef(firestore, householdId) { return doc(firestore, 'households', householdId) }
function inviteCodeRef(firestore, inviteCode) { return doc(firestore, 'inviteCodes', inviteCode) }
function tasksRef(firestore, householdId) { return collection(firestore, 'households', householdId, 'maintenanceTasks') }
function taskDoc(firestore, householdId, taskId) { return doc(firestore, 'households', householdId, 'maintenanceTasks', taskId) }
function listsRef(firestore, householdId) { return collection(firestore, 'households', householdId, 'shoppingLists') }
function listDoc(firestore, householdId, listId) { return doc(firestore, 'households', householdId, 'shoppingLists', listId) }
function listItemsRef(firestore, householdId, listId) { return collection(firestore, 'households', householdId, 'shoppingLists', listId, 'items') }
function listItemDoc(firestore, householdId, listId, itemId) { return doc(firestore, 'households', householdId, 'shoppingLists', listId, 'items', itemId) }
function remindersRef(firestore, householdId) { return collection(firestore, 'households', householdId, 'reminders') }
function reminderDoc(firestore, householdId, reminderId) { return doc(firestore, 'households', householdId, 'reminders', reminderId) }
function completionsRef(firestore, householdId) { return collection(firestore, 'households', householdId, 'completions') }
function completionDoc(firestore, householdId, completionId) { return doc(firestore, 'households', householdId, 'completions', completionId) }
function userMembershipRef(firestore, userId) { return doc(firestore, 'users', userId, 'meta', 'membership') }

function getInviteCodeOwnerId(members = []) {
  return members.find((member) => member.role === 'owner')?.id || members[0]?.id || null
}

async function cleanupUserData(firestore, userId) {
  const membershipRef = userMembershipRef(firestore, userId)
  const membershipSnap = await getDoc(membershipRef)
  if (!membershipSnap.exists()) return { hadMembership: false, deletedHousehold: false }

  const membership = membershipSnap.data()
  const householdId = membership?.householdId
  if (!householdId) {
    await deleteDoc(membershipRef)
    return { hadMembership: true, deletedHousehold: false }
  }

  const homeRef = householdRef(firestore, householdId)
  const homeSnap = await getDoc(homeRef)
  if (!homeSnap.exists()) {
    await deleteDoc(membershipRef)
    return { hadMembership: true, deletedHousehold: false }
  }

  const household = homeSnap.data()
  const members = household.members ?? []
  const remainingMembers = members.filter((member) => member.id !== userId)

  if (remainingMembers.length === 0) {
    const [reminderSnaps, completionSnaps, taskSnaps, listSnaps] = await Promise.all([
      getDocs(remindersRef(firestore, householdId)),
      getDocs(completionsRef(firestore, householdId)),
      getDocs(tasksRef(firestore, householdId)),
      getDocs(listsRef(firestore, householdId)),
    ])

    await Promise.all(reminderSnaps.docs.map((snap) => deleteDoc(reminderDoc(firestore, householdId, snap.id))))
    await Promise.all(completionSnaps.docs.map((snap) => deleteDoc(completionDoc(firestore, householdId, snap.id))))
    await Promise.all(taskSnaps.docs.map((snap) => deleteDoc(taskDoc(firestore, householdId, snap.id))))
    for (const listSnap of listSnaps.docs) {
      const itemSnaps = await getDocs(listItemsRef(firestore, householdId, listSnap.id))
      await Promise.all(itemSnaps.docs.map((snap) => deleteDoc(listItemDoc(firestore, householdId, listSnap.id, snap.id))))
      await deleteDoc(listDoc(firestore, householdId, listSnap.id))
    }
    if (household.inviteCode) await deleteDoc(inviteCodeRef(firestore, household.inviteCode))
    await deleteDoc(homeRef)
    await deleteDoc(membershipRef)
    return { hadMembership: true, deletedHousehold: true }
  }

  const batch = writeBatch(firestore)
  batch.update(homeRef, {
    members: remainingMembers,
    updatedAt: serverTimestamp(),
  })
  if (household.inviteCode) {
    batch.set(inviteCodeRef(firestore, household.inviteCode), {
      householdId,
      ownerUid: getInviteCodeOwnerId(remainingMembers),
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }, { merge: true })
  }
  for (const member of remainingMembers) {
    batch.set(userMembershipRef(firestore, member.id), {
      ...member,
      inviteCode: household.inviteCode || '',
    }, { merge: true })
  }
  batch.delete(membershipRef)
  await batch.commit()
  return { hadMembership: true, deletedHousehold: false }
}

async function adminDelete(localId, accessToken) {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:delete`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ localId, targetProjectId: projectId }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`admin delete failed ${response.status}: ${text}`)
  }
}

async function main() {
  const matcher = buildMatcher()
  const users = (await exportUsers())
    .filter(isPasswordOnlyUser)
    .map((user) => ({ localId: user.localId, email: user.email || '' }))
    .filter((user) => matcher(user.email))

  const summary = {
    mode: options.confirm ? 'delete' : 'dry-run',
    domain: options.domain,
    regex: options.regex,
    totalMatched: users.length,
    matchedEmails: users.map((user) => user.email),
    deletedWithDataCleanup: [],
    deletedAuthOnly: [],
    failed: [],
  }

  if (!options.confirm || users.length === 0) {
    console.log(JSON.stringify(summary, null, 2))
    return
  }

  const app = initializeApp(publicFirebaseConfig, `cleanup-${Date.now()}`)
  const auth = getAuth(app)
  const firestore = getFirestore(app)
  const accessToken = getFirebaseAccessToken()

  for (const user of users) {
    try {
      if (options.password) {
        const credential = await signInWithEmailAndPassword(auth, user.email, options.password)
        await cleanupUserData(firestore, credential.user.uid)
        await deleteUser(credential.user)
        summary.deletedWithDataCleanup.push(user.email)
      } else {
        await adminDelete(user.localId, accessToken)
        summary.deletedAuthOnly.push(user.email)
      }
    } catch (error) {
      if (options.password) {
        try {
          await adminDelete(user.localId, accessToken)
          summary.deletedAuthOnly.push(user.email)
        } catch (fallbackError) {
          summary.failed.push({ email: user.email, error: fallbackError.message || String(fallbackError), original: error?.message || String(error) })
        }
      } else {
        summary.failed.push({ email: user.email, error: error?.message || String(error) })
      }
    } finally {
      try { await signOut(auth) } catch {}
    }
  }

  console.log(JSON.stringify(summary, null, 2))
  if (summary.failed.length) process.exitCode = 1
}

main().catch((error) => {
  console.error(error?.stack || error?.message || error)
  process.exit(1)
})
