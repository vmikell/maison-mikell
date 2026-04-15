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
import { houseProfile, starterHouseProfile, shoppingLists } from './data'
import { buildCompletionRecord, buildReminderRecord, buildTasksFromSetup, completeTask, normalizeShoppingItemInput, normalizeTaskInput } from './model'

function householdsRef() { return collection(firestore, 'households') }
function householdRef(householdId) { return doc(firestore, 'households', householdId) }
function tasksRef(householdId) { return collection(firestore, 'households', householdId, 'maintenanceTasks') }
function taskDoc(householdId, taskId) { return doc(firestore, 'households', householdId, 'maintenanceTasks', taskId) }
function listsRef(householdId) { return collection(firestore, 'households', householdId, 'shoppingLists') }
function listDoc(householdId, listId) { return doc(firestore, 'households', householdId, 'shoppingLists', listId) }
function listItemsRef(householdId, listId) { return collection(firestore, 'households', householdId, 'shoppingLists', listId, 'items') }
function listItemDoc(householdId, listId, itemId) { return doc(firestore, 'households', householdId, 'shoppingLists', listId, 'items', itemId) }
function remindersRef(householdId) { return collection(firestore, 'households', householdId, 'reminders') }
function reminderDoc(householdId, reminderId) { return doc(firestore, 'households', householdId, 'reminders', reminderId) }
function completionsRef(householdId) { return collection(firestore, 'households', householdId, 'completions') }
function completionDoc(householdId, completionId) { return doc(firestore, 'households', householdId, 'completions', completionId) }
function userMembershipRef(userId) { return doc(firestore, 'users', userId, 'meta', 'membership') }

function buildHouseholdId() {
  return `household-${Math.random().toString(36).slice(2, 10)}`
}

function buildInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

async function resolveMembershipIdentity(currentUser) {
  const fallbackEmail = currentUser?.email || ''
  const fallbackName = currentUser?.displayName || fallbackEmail

  try {
    const tokenResult = await currentUser?.getIdTokenResult?.()
    const tokenName = tokenResult?.claims?.name
    return {
      email: fallbackEmail,
      name: tokenName || fallbackEmail || fallbackName,
    }
  } catch {
    return {
      email: fallbackEmail,
      name: fallbackEmail || fallbackName,
    }
  }
}

async function seedHouseholdIfNeeded(householdId, overrides = {}) {
  const homeSnap = await getDoc(householdRef(householdId))
  const batch = writeBatch(firestore)

  if (!homeSnap.exists()) {
    batch.set(householdRef(householdId), {
      ...starterHouseProfile,
      id: householdId,
      ...overrides,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    await batch.commit()
    return true
  }

  return false
}

async function readShoppingLists(householdId) {
  const listSnaps = await getDocs(listsRef(householdId))
  const lists = await Promise.all(listSnaps.docs.map(async (listSnap) => {
    const itemSnaps = await getDocs(listItemsRef(householdId, listSnap.id))
    return { id: listSnap.id, ...listSnap.data(), items: itemSnaps.docs.map((itemSnap) => ({ id: itemSnap.id, ...itemSnap.data() })) }
  }))
  return lists.sort((a, b) => a.title.localeCompare(b.title))
}

async function readReminders(householdId) {
  const snaps = await getDocs(remindersRef(householdId))
  return snaps.docs.map((snap) => ({ id: snap.id, ...snap.data() }))
}

async function readCompletions(householdId) {
  const snaps = await getDocs(completionsRef(householdId))
  return snaps.docs.map((snap) => ({ id: snap.id, ...snap.data() })).sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''))
}

export async function ensurePlannerSeeded(householdId, overrides = {}) {
  if (!hasFirebaseConfig || !firestore || !householdId) return false
  if (householdId !== houseProfile.id) return false
  return seedHouseholdIfNeeded(householdId, overrides)
}

export async function ensureHouseholdMembership(currentUser) {
  if (!hasFirebaseConfig || !firestore || !currentUser) return null

  const membershipSnap = await getDoc(userMembershipRef(currentUser.uid))
  if (membershipSnap.exists()) {
    const membership = membershipSnap.data()
    if (membership?.householdId) {
      await ensurePlannerSeeded(membership.householdId)
      return membership
    }
  }

  const legacySnap = await getDoc(doc(firestore, 'households', houseProfile.id))
  if (!legacySnap.exists()) return null
  const legacyData = legacySnap.data()
  const existing = (legacyData.members ?? []).find((member) => member.email === currentUser.email)
  if (!existing) return null

  const membership = { ...existing, householdId: houseProfile.id }
  await setDoc(userMembershipRef(currentUser.uid), membership, { merge: true })
  return membership
}

export async function createHouseholdForCurrentUser(currentUser, options = {}) {
  if (!hasFirebaseConfig || !firestore || !currentUser) return { ok: false, error: 'Sign in first to create a household.' }

  const existingMembership = await ensureHouseholdMembership(currentUser)
  if (existingMembership) return { ok: true, membership: existingMembership, inviteCode: existingMembership.inviteCode || '', created: false }

  const householdId = buildHouseholdId()
  const inviteCode = buildInviteCode()
  const nextHouseholdName = (options.name || '').trim()
  const identity = await resolveMembershipIdentity(currentUser)
  const nextMember = {
    id: currentUser.uid,
    email: identity.email,
    name: identity.name,
    role: 'owner',
    joinedAt: new Date().toISOString(),
    householdId,
  }

  const bootstrapBatch = writeBatch(firestore)
  bootstrapBatch.set(householdRef(householdId), {
    ...starterHouseProfile,
    id: householdId,
    name: nextHouseholdName,
    inviteCode,
    members: [nextMember],
    setupCompleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  bootstrapBatch.set(userMembershipRef(currentUser.uid), { ...nextMember, inviteCode }, { merge: true })
  await bootstrapBatch.commit()

  const seedBatch = writeBatch(firestore)
  shoppingLists.forEach((list) => {
    const { items = [], ...listMeta } = list
    seedBatch.set(listDoc(householdId, list.id), {
      ...listMeta,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    items.forEach((item) => {
      seedBatch.set(listItemDoc(householdId, list.id, item.id), {
        ...item,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    })
  })
  await seedBatch.commit()

  return { ok: true, membership: nextMember, inviteCode, created: true }
}

export async function joinHouseholdWithInviteCode(currentUser, inviteCode) {
  if (!hasFirebaseConfig || !firestore || !currentUser) return { ok: false, error: 'Sign in first to join the household.' }

  const existingMembership = await ensureHouseholdMembership(currentUser)
  if (existingMembership) return { ok: true, membership: existingMembership }

  const normalizedCode = (inviteCode || '').trim().toUpperCase()
  if (!normalizedCode) return { ok: false, error: 'Enter the household invite code.' }

  const matchingHouseholds = await getDocs(query(householdsRef(), where('inviteCode', '==', normalizedCode)))
  if (matchingHouseholds.empty) return { ok: false, error: 'That invite code does not match a household.' }

  const householdSnap = matchingHouseholds.docs[0]
  const householdId = householdSnap.id
  const household = householdSnap.data()
  const members = household.members ?? []
  const nextRole = members.length === 0 ? 'owner' : 'member'
  const identity = await resolveMembershipIdentity(currentUser)
  const nextMember = {
    id: currentUser.uid,
    email: identity.email,
    name: identity.name,
    role: nextRole,
    joinedAt: new Date().toISOString(),
    householdId,
  }

  await setDoc(householdRef(householdId), {
    members: [...members, nextMember],
    updatedAt: serverTimestamp(),
  }, { merge: true })
  await setDoc(userMembershipRef(currentUser.uid), { ...nextMember, inviteCode: household.inviteCode || normalizedCode }, { merge: true })

  return { ok: true, membership: nextMember }
}

export async function completeHouseholdSetup(householdId, setupInput = {}) {
  if (!hasFirebaseConfig || !firestore || !householdId) return { ok: false, error: 'Firebase is not configured.' }

  const normalizedProfile = {
    name: (setupInput.name || '').trim(),
    homeType: (setupInput.homeType || '').trim(),
    sizeSqFt: Number(setupInput.sizeSqFt || 0) || '',
    levels: Number(setupInput.levels || 0) || '',
    bedrooms: Number(setupInput.bedrooms || 0) || '',
    bathrooms: Number(setupInput.bathrooms || 0) || '',
    hvac: {
      system: (setupInput.hvac?.system || '').trim(),
      heads: Number(setupInput.hvac?.heads || 0) || '',
    },
    reminderRules: {
      majorLeadDays: 30,
      standardLeadDays: 7,
    },
    setupCompleted: true,
  }

  try {
    const generatedTasks = buildTasksFromSetup(normalizedProfile)
    const existingTaskSnaps = await getDocs(tasksRef(householdId))
    const batch = writeBatch(firestore)

    batch.update(householdRef(householdId), {
      ...normalizedProfile,
      updatedAt: serverTimestamp(),
    })

    existingTaskSnaps.docs.forEach((snap) => batch.delete(snap.ref))
    generatedTasks.forEach((task) => {
      batch.set(taskDoc(householdId, task.id), {
        ...task,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    })

    await batch.commit()
    return { ok: true, tasks: generatedTasks }
  } catch (error) {
    console.error('Failed to complete household setup', error)
    return {
      ok: false,
      error: error?.message || 'Failed to save household setup.',
      code: error?.code || null,
    }
  }
}

export async function updateHouseholdMembership(householdId, patch) {
  if (!hasFirebaseConfig || !firestore || !householdId) return { ok: false, error: 'Firebase is not configured.' }
  try {
    await updateDoc(householdRef(householdId), { ...patch, updatedAt: serverTimestamp() })
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

export async function readPlannerState(householdId) {
  if (!hasFirebaseConfig || !firestore || !householdId) return null
  await ensurePlannerSeeded(householdId)
  const [homeSnap, taskSnaps, shopping, reminders, completions] = await Promise.all([getDoc(householdRef(householdId)), getDocs(tasksRef(householdId)), readShoppingLists(householdId), readReminders(householdId), readCompletions(householdId)])
  return {
    houseProfile: { id: homeSnap.id, ...homeSnap.data() },
    maintenanceTasks: taskSnaps.docs.map((snap) => ({ id: snap.id, ...snap.data() })),
    shoppingLists: shopping,
    reminders,
    completions,
  }
}

export async function subscribePlannerState(householdId, onChange) {
  if (!hasFirebaseConfig || !firestore || !householdId) return () => {}
  await ensurePlannerSeeded(householdId)

  const emit = async (taskSnap = null) => {
    const homeSnap = await getDoc(householdRef(householdId))
    const shopping = await readShoppingLists(householdId)
    const reminders = await readReminders(householdId)
    const completions = await readCompletions(householdId)
    const nextTasks = taskSnap
      ? taskSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      : (await getDocs(tasksRef(householdId))).docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
    onChange({ houseProfile: { id: homeSnap.id, ...homeSnap.data() }, maintenanceTasks: nextTasks, shoppingLists: shopping, reminders, completions })
  }

  const taskUnsub = onSnapshot(tasksRef(householdId), emit)
  const homeUnsub = onSnapshot(householdRef(householdId), async () => emit())
  const listsUnsub = onSnapshot(listsRef(householdId), async () => emit())
  const remindersUnsub = onSnapshot(remindersRef(householdId), async () => emit())
  const completionsUnsub = onSnapshot(completionsRef(householdId), async () => emit())
  return () => [taskUnsub, homeUnsub, listsUnsub, remindersUnsub, completionsUnsub].forEach((unsub) => unsub())
}

async function syncReminderForTask(householdId, task) {
  const reminder = buildReminderRecord(task)
  await setDoc(reminderDoc(householdId, reminder.id), { ...reminder, updatedAt: serverTimestamp(), createdAt: serverTimestamp() }, { merge: true })
}

export async function markTaskCompleted(householdId, taskId, lastDone, actor = 'Household member') {
  if (!hasFirebaseConfig || !firestore || !householdId) return false
  const taskSnap = await getDoc(taskDoc(householdId, taskId))
  if (!taskSnap.exists()) return false
  const completedTask = completeTask({ id: taskSnap.id, ...taskSnap.data() }, lastDone, actor)
  const completion = buildCompletionRecord(completedTask, actor, new Date().toISOString())
  await updateDoc(taskDoc(householdId, taskId), {
    lastDone: completedTask.lastDone,
    lastCompletedAt: completedTask.lastCompletedAt,
    lastCompletedBy: completedTask.lastCompletedBy,
    updatedAt: serverTimestamp(),
  })
  await setDoc(completionDoc(householdId, completion.id), { ...completion, createdAt: serverTimestamp() })
  await syncReminderForTask(householdId, completedTask)
  await updateDoc(householdRef(householdId), { updatedAt: serverTimestamp() })
  return true
}

export async function saveTask(householdId, input) {
  if (!hasFirebaseConfig || !firestore || !householdId) return false
  const task = normalizeTaskInput(input)
  await setDoc(taskDoc(householdId, task.id), { ...task, updatedAt: serverTimestamp(), createdAt: serverTimestamp() }, { merge: true })
  await syncReminderForTask(householdId, task)
  await updateDoc(householdRef(householdId), { updatedAt: serverTimestamp() })
  return true
}

export async function deleteTask(householdId, taskId) {
  if (!hasFirebaseConfig || !firestore || !householdId) return false
  const reminderSnaps = await getDocs(query(remindersRef(householdId), where('taskId', '==', taskId)))
  const completionSnaps = await getDocs(query(completionsRef(householdId), where('taskId', '==', taskId)))
  await Promise.all(reminderSnaps.docs.map((snap) => deleteDoc(reminderDoc(householdId, snap.id))))
  await Promise.all(completionSnaps.docs.map((snap) => deleteDoc(completionDoc(householdId, snap.id))))
  await deleteDoc(taskDoc(householdId, taskId))
  await updateDoc(householdRef(householdId), { updatedAt: serverTimestamp() })
  return true
}

export async function saveShoppingItem(householdId, listId, input) {
  if (!hasFirebaseConfig || !firestore || !householdId) return { ok: false, error: 'Firebase is not configured.' }
  const item = normalizeShoppingItemInput(input)
  try {
    await setDoc(listItemDoc(householdId, listId, item.id), { ...item, updatedAt: serverTimestamp(), createdAt: serverTimestamp() }, { merge: true })
    await updateDoc(listDoc(householdId, listId), { updatedAt: serverTimestamp() })
    return { ok: true, item }
  } catch (error) {
    console.error('Failed to save shopping item', error)
    return {
      ok: false,
      error: error?.message || 'Failed to save shopping item.',
      code: error?.code || null,
    }
  }
}

export async function deleteShoppingItem(householdId, listId, itemId) {
  if (!hasFirebaseConfig || !firestore || !householdId) return false
  await deleteDoc(listItemDoc(householdId, listId, itemId))
  await updateDoc(listDoc(householdId, listId), { updatedAt: serverTimestamp() })
  return true
}

export async function deleteCheckedShoppingItems(householdId, listId) {
  if (!hasFirebaseConfig || !firestore || !householdId) return false
  const checkedSnaps = await getDocs(query(listItemsRef(householdId, listId), where('checked', '==', true)))
  const batch = writeBatch(firestore)
  checkedSnaps.docs.forEach((snap) => batch.delete(snap.ref))
  batch.update(listDoc(householdId, listId), { updatedAt: serverTimestamp() })
  await batch.commit()
  return true
}

export async function toggleShoppingItemChecked(householdId, listId, itemId, checked) {
  if (!hasFirebaseConfig || !firestore || !householdId) return false
  await updateDoc(listItemDoc(householdId, listId, itemId), { checked, updatedAt: serverTimestamp() })
  await updateDoc(listDoc(householdId, listId), { updatedAt: serverTimestamp() })
  return true
}

export async function readPendingReminders(householdId) {
  if (!hasFirebaseConfig || !firestore || !householdId) return []
  await ensurePlannerSeeded(householdId)
  const snaps = await getDocs(query(remindersRef(householdId), where('sent', '==', false)))
  return snaps.docs.map((snap) => ({ id: snap.id, ...snap.data() }))
}

export async function markReminderSent(householdId, reminderId, channel = 'email') {
  if (!hasFirebaseConfig || !firestore || !householdId) return false
  await updateDoc(reminderDoc(householdId, reminderId), {
    sent: true,
    sentAt: new Date().toISOString(),
    sentChannel: channel,
    updatedAt: serverTimestamp(),
  })
  await updateDoc(householdRef(householdId), {
    lastReminderRunAt: new Date().toISOString(),
    lastReminderChannel: channel,
    updatedAt: serverTimestamp(),
  })
  return true
}

export async function setTaskClaim(householdId, taskId, actor = null) {
  if (!hasFirebaseConfig || !firestore || !householdId) return false
  await updateDoc(taskDoc(householdId, taskId), {
    claimedBy: actor,
    claimedAt: actor ? new Date().toISOString() : null,
    updatedAt: serverTimestamp(),
  })
  await updateDoc(householdRef(householdId), { updatedAt: serverTimestamp() })
  return true
}

export async function saveShoppingListMeta(householdId, listId, patch) {
  if (!hasFirebaseConfig || !firestore || !householdId) return false
  await updateDoc(listDoc(householdId, listId), { ...patch, updatedAt: serverTimestamp() })
  return true
}

export async function deleteCurrentUserData(currentUser, membership) {
  if (!hasFirebaseConfig || !firestore || !currentUser || !membership?.householdId) {
    return { ok: false, error: 'Missing account or household context.' }
  }

  const householdId = membership.householdId
  const householdSnap = await getDoc(householdRef(householdId))
  if (!householdSnap.exists()) {
    await deleteDoc(userMembershipRef(currentUser.uid))
    return { ok: true, deletedHousehold: false }
  }

  const household = householdSnap.data()
  const members = household.members ?? []
  const remainingMembers = members.filter((member) => member.id !== currentUser.uid)

  if (remainingMembers.length === 0) {
    const reminderSnaps = await getDocs(remindersRef(householdId))
    const completionSnaps = await getDocs(completionsRef(householdId))
    const taskSnaps = await getDocs(tasksRef(householdId))
    const listSnaps = await getDocs(listsRef(householdId))

    await Promise.all(reminderSnaps.docs.map((snap) => deleteDoc(reminderDoc(householdId, snap.id))))
    await Promise.all(completionSnaps.docs.map((snap) => deleteDoc(completionDoc(householdId, snap.id))))
    await Promise.all(taskSnaps.docs.map((snap) => deleteDoc(taskDoc(householdId, snap.id))))
    for (const listSnap of listSnaps.docs) {
      const itemSnaps = await getDocs(listItemsRef(householdId, listSnap.id))
      await Promise.all(itemSnaps.docs.map((snap) => deleteDoc(listItemDoc(householdId, listSnap.id, snap.id))))
      await deleteDoc(listDoc(householdId, listSnap.id))
    }
    await deleteDoc(householdRef(householdId))
    await deleteDoc(userMembershipRef(currentUser.uid))
    return { ok: true, deletedHousehold: true }
  }

  await updateDoc(householdRef(householdId), {
    members: remainingMembers,
    updatedAt: serverTimestamp(),
  })
  await deleteDoc(userMembershipRef(currentUser.uid))
  return { ok: true, deletedHousehold: false }
}
