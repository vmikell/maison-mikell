import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore'
import { firestore, hasFirebaseConfig } from './firebase'
import { houseProfile, maintenanceTasks, shoppingLists } from './data'
import { buildCompletionRecord, buildReminderRecord, completeTask, normalizeShoppingItemInput, normalizeTaskInput } from './model'

const HOUSEHOLD_ID = houseProfile.id

function householdRef() { return doc(firestore, 'households', HOUSEHOLD_ID) }
function householdSettingsRef() { return doc(firestore, 'households', HOUSEHOLD_ID, 'private', 'settings') }
function tasksRef() { return collection(firestore, 'households', HOUSEHOLD_ID, 'maintenanceTasks') }
function taskDoc(taskId) { return doc(firestore, 'households', HOUSEHOLD_ID, 'maintenanceTasks', taskId) }
function listsRef() { return collection(firestore, 'households', HOUSEHOLD_ID, 'shoppingLists') }
function listDoc(listId) { return doc(firestore, 'households', HOUSEHOLD_ID, 'shoppingLists', listId) }
function listItemsRef(listId) { return collection(firestore, 'households', HOUSEHOLD_ID, 'shoppingLists', listId, 'items') }
function listItemDoc(listId, itemId) { return doc(firestore, 'households', HOUSEHOLD_ID, 'shoppingLists', listId, 'items', itemId) }
function remindersRef() { return collection(firestore, 'households', HOUSEHOLD_ID, 'reminders') }
function reminderDoc(reminderId) { return doc(firestore, 'households', HOUSEHOLD_ID, 'reminders', reminderId) }
function completionsRef() { return collection(firestore, 'households', HOUSEHOLD_ID, 'completions') }
function completionDoc(completionId) { return doc(firestore, 'households', HOUSEHOLD_ID, 'completions', completionId) }

export async function ensurePlannerSeeded() {
  if (!hasFirebaseConfig || !firestore) return false
  const homeSnap = await getDoc(householdRef())

  const batch = writeBatch(firestore)

  if (!homeSnap.exists()) {
    batch.set(householdRef(), { ...houseProfile, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
    batch.set(householdSettingsRef(), { inviteCode: buildInviteCode(), createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
    maintenanceTasks.forEach((task) => {
      batch.set(doc(tasksRef(), task.id), { ...task, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
      const reminder = buildReminderRecord(task)
      batch.set(reminderDoc(reminder.id), { ...reminder, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
    })
  }

  const existingListSnaps = await getDocs(listsRef())
  const existingListIds = new Set(existingListSnaps.docs.map((snap) => snap.id))
  shoppingLists.forEach((list) => {
    if (!existingListIds.has(list.id)) {
      batch.set(doc(listsRef(), list.id), { id: list.id, title: list.title, tone: list.tone, storeName: list.storeName ?? '', createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
      list.items.forEach((item) => batch.set(doc(listItemsRef(list.id), item.id), { ...item, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }))
    }
  })

  await batch.commit()
  return true
}

async function readShoppingLists() {
  const listSnaps = await getDocs(listsRef())
  const lists = await Promise.all(listSnaps.docs.map(async (listSnap) => {
    const itemSnaps = await getDocs(listItemsRef(listSnap.id))
    return { id: listSnap.id, ...listSnap.data(), items: itemSnaps.docs.map((itemSnap) => ({ id: itemSnap.id, ...itemSnap.data() })) }
  }))
  return lists.sort((a, b) => a.title.localeCompare(b.title))
}

async function readReminders() {
  const snaps = await getDocs(remindersRef())
  return snaps.docs.map((snap) => ({ id: snap.id, ...snap.data() }))
}

async function readCompletions() {
  const snaps = await getDocs(completionsRef())
  return snaps.docs.map((snap) => ({ id: snap.id, ...snap.data() })).sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''))
}

function buildInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

export async function ensureHouseholdMembership(currentUser) {
  if (!hasFirebaseConfig || !firestore || !currentUser) return null
  await ensurePlannerSeeded()
  const snap = await getDoc(householdRef())
  const settingsSnap = await getDoc(householdSettingsRef())
  const current = snap.exists() ? snap.data() : {}
  const members = current.members ?? []
  if (!current.inviteCode && settingsSnap.exists()) {
    current.inviteCode = settingsSnap.data().inviteCode || ''
  }
  const existing = members.find((member) => member.email === currentUser.email)
  return existing ?? null
}

export async function joinHouseholdWithInviteCode(currentUser, inviteCode) {
  if (!hasFirebaseConfig || !firestore || !currentUser) return { ok: false, error: 'Sign in first to join the household.' }
  await ensurePlannerSeeded()
  const normalizedCode = (inviteCode || '').trim().toUpperCase()
  if (!normalizedCode) return { ok: false, error: 'Enter the household invite code.' }

  const snap = await getDoc(householdRef())
  const settingsSnap = await getDoc(householdSettingsRef())
  const current = snap.exists() ? snap.data() : {}
  const members = current.members ?? []
  const activeInviteCode = ((settingsSnap.exists() ? settingsSnap.data().inviteCode : current.inviteCode) || '').trim().toUpperCase()
  const existing = members.find((member) => member.email === currentUser.email)
  if (existing) return { ok: true, membership: existing }

  if (activeInviteCode !== normalizedCode) {
    return { ok: false, error: 'That invite code does not match this household.' }
  }

  const nextRole = members.length === 0 ? 'owner' : 'member'
  const nextMember = {
    id: currentUser.uid,
    email: currentUser.email,
    name: currentUser.displayName || currentUser.email,
    role: nextRole,
    joinedAt: new Date().toISOString(),
  }

  await setDoc(householdRef(), {
    members: [...members, nextMember],
    updatedAt: serverTimestamp(),
  }, { merge: true })

  return { ok: true, membership: nextMember }
}

export async function updateHouseholdMembership(patch) {
  if (!hasFirebaseConfig || !firestore) return { ok: false, error: 'Firebase is not configured.' }
  try {
    if (Object.prototype.hasOwnProperty.call(patch, 'inviteCode')) {
      await setDoc(householdSettingsRef(), { inviteCode: patch.inviteCode, updatedAt: serverTimestamp() }, { merge: true })
      return { ok: true }
    }
    await updateDoc(householdRef(), { ...patch, updatedAt: serverTimestamp() })
    return { ok: true }
  } catch (error) {
    console.error('Failed to update household membership/settings', error)
    return {
      ok: false,
      error: error?.message || 'Failed to update household settings.',
      code: error?.code || null,
    }
  }
}

export async function readPlannerState() {
  if (!hasFirebaseConfig || !firestore) return null
  await ensurePlannerSeeded()
  const [homeSnap, settingsSnap, taskSnaps, shopping, reminders, completions] = await Promise.all([getDoc(householdRef()), getDoc(householdSettingsRef()), getDocs(tasksRef()), readShoppingLists(), readReminders(), readCompletions()])
  return {
    houseProfile: { id: homeSnap.id, ...homeSnap.data(), inviteCode: settingsSnap.exists() ? settingsSnap.data().inviteCode || '' : (homeSnap.data()?.inviteCode || '') },
    maintenanceTasks: taskSnaps.docs.map((snap) => ({ id: snap.id, ...snap.data() })),
    shoppingLists: shopping,
    reminders,
    completions,
  }
}

export async function subscribePlannerState(onChange) {
  if (!hasFirebaseConfig || !firestore) return () => {}
  await ensurePlannerSeeded()

  const emit = async (taskSnap = null) => {
    const homeSnap = await getDoc(householdRef())
    const settingsSnap = await getDoc(householdSettingsRef())
    const shopping = await readShoppingLists()
    const reminders = await readReminders()
    const completions = await readCompletions()
    const nextTasks = taskSnap
      ? taskSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      : (await getDocs(tasksRef())).docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
    onChange({ houseProfile: { id: homeSnap.id, ...homeSnap.data(), inviteCode: settingsSnap.exists() ? settingsSnap.data().inviteCode || '' : (homeSnap.data()?.inviteCode || '') }, maintenanceTasks: nextTasks, shoppingLists: shopping, reminders, completions })
  }

  const taskUnsub = onSnapshot(tasksRef(), emit)
  const homeUnsub = onSnapshot(householdRef(), async () => emit())
  const listsUnsub = onSnapshot(listsRef(), async () => emit())
  const remindersUnsub = onSnapshot(remindersRef(), async () => emit())
  const completionsUnsub = onSnapshot(completionsRef(), async () => emit())
  return () => [taskUnsub, homeUnsub, listsUnsub, remindersUnsub, completionsUnsub].forEach((unsub) => unsub())
}

async function syncReminderForTask(task) {
  const reminder = buildReminderRecord(task)
  await setDoc(reminderDoc(reminder.id), { ...reminder, updatedAt: serverTimestamp(), createdAt: serverTimestamp() }, { merge: true })
}

export async function markTaskCompleted(taskId, lastDone, actor = 'Victor') {
  if (!hasFirebaseConfig || !firestore) return false
  const taskSnap = await getDoc(taskDoc(taskId))
  if (!taskSnap.exists()) return false
  const completedTask = completeTask({ id: taskSnap.id, ...taskSnap.data() }, lastDone, actor)
  const completion = buildCompletionRecord(completedTask, actor, new Date().toISOString())
  await updateDoc(taskDoc(taskId), {
    lastDone: completedTask.lastDone,
    lastCompletedAt: completedTask.lastCompletedAt,
    lastCompletedBy: completedTask.lastCompletedBy,
    updatedAt: serverTimestamp(),
  })
  await setDoc(completionDoc(completion.id), { ...completion, createdAt: serverTimestamp() })
  await syncReminderForTask(completedTask)
  await updateDoc(householdRef(), { updatedAt: serverTimestamp() })
  return true
}

export async function saveTask(input) {
  if (!hasFirebaseConfig || !firestore) return false
  const task = normalizeTaskInput(input)
  await setDoc(taskDoc(task.id), { ...task, updatedAt: serverTimestamp(), createdAt: serverTimestamp() }, { merge: true })
  await syncReminderForTask(task)
  await updateDoc(householdRef(), { updatedAt: serverTimestamp() })
  return true
}

export async function deleteTask(taskId) {
  if (!hasFirebaseConfig || !firestore) return false
  const reminderSnaps = await getDocs(query(remindersRef(), where('taskId', '==', taskId)))
  const completionSnaps = await getDocs(query(completionsRef(), where('taskId', '==', taskId)))
  await Promise.all(reminderSnaps.docs.map((snap) => deleteDoc(reminderDoc(snap.id))))
  await Promise.all(completionSnaps.docs.map((snap) => deleteDoc(completionDoc(snap.id))))
  await deleteDoc(taskDoc(taskId))
  await updateDoc(householdRef(), { updatedAt: serverTimestamp() })
  return true
}

export async function saveShoppingItem(listId, input) {
  if (!hasFirebaseConfig || !firestore) return false
  const item = normalizeShoppingItemInput(input)
  await setDoc(listItemDoc(listId, item.id), { ...item, updatedAt: serverTimestamp(), createdAt: serverTimestamp() }, { merge: true })
  await updateDoc(listDoc(listId), { updatedAt: serverTimestamp() })
  return true
}

export async function deleteShoppingItem(listId, itemId) {
  if (!hasFirebaseConfig || !firestore) return false
  await deleteDoc(listItemDoc(listId, itemId))
  await updateDoc(listDoc(listId), { updatedAt: serverTimestamp() })
  return true
}

export async function toggleShoppingItemChecked(listId, itemId, checked) {
  if (!hasFirebaseConfig || !firestore) return false
  await updateDoc(listItemDoc(listId, itemId), { checked, updatedAt: serverTimestamp() })
  await updateDoc(listDoc(listId), { updatedAt: serverTimestamp() })
  return true
}

export async function readPendingReminders() {
  if (!hasFirebaseConfig || !firestore) return []
  await ensurePlannerSeeded()
  const snaps = await getDocs(query(remindersRef(), where('sent', '==', false)))
  return snaps.docs.map((snap) => ({ id: snap.id, ...snap.data() }))
}

export async function markReminderSent(reminderId, channel = 'email') {
  if (!hasFirebaseConfig || !firestore) return false
  await updateDoc(reminderDoc(reminderId), {
    sent: true,
    sentAt: new Date().toISOString(),
    sentChannel: channel,
    updatedAt: serverTimestamp(),
  })
  await updateDoc(householdRef(), {
    lastReminderRunAt: new Date().toISOString(),
    lastReminderChannel: channel,
    updatedAt: serverTimestamp(),
  })
  return true
}

export async function setTaskClaim(taskId, actor = null) {
  if (!hasFirebaseConfig || !firestore) return false
  await updateDoc(taskDoc(taskId), {
    claimedBy: actor,
    claimedAt: actor ? new Date().toISOString() : null,
    updatedAt: serverTimestamp(),
  })
  await updateDoc(householdRef(), { updatedAt: serverTimestamp() })
  return true
}

export async function saveShoppingListMeta(listId, patch) {
  if (!hasFirebaseConfig || !firestore) return false
  await updateDoc(listDoc(listId), { ...patch, updatedAt: serverTimestamp() })
  return true
}
