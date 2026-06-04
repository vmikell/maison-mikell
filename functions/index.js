import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'
import { logger, setGlobalOptions } from 'firebase-functions'
import { HttpsError, onCall } from 'firebase-functions/https'
import { onSchedule } from 'firebase-functions/scheduler'

initializeApp()
setGlobalOptions({ region: 'us-east1', maxInstances: 1 })

const db = getFirestore()
const messaging = getMessaging()
const TIME_ZONE = 'America/New_York'
const MAX_MULTICAST_TOKENS = 500
const INVALID_TOKEN_CODES = new Set([
  'messaging/invalid-argument',
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
])

function todayISO(timeZone = TIME_ZONE) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

function normalize(value = '') {
  return String(value || '').trim().toLowerCase()
}

function chunk(items, size) {
  const chunks = []
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size))
  return chunks
}

function reminderIsDue(reminder, today = todayISO()) {
  return Boolean(reminder && reminder.sent !== true && reminder.remindAt && String(reminder.remindAt) <= today)
}

function renderNotification(reminder) {
  const dueAt = reminder.dueAt ? ` Due ${reminder.dueAt}.` : ''
  return {
    title: 'Maison reminder',
    body: `${reminder.title || 'A household task'} is ready.${dueAt}`,
  }
}

async function readTask(householdId, taskId) {
  if (!householdId || !taskId) return null
  const snap = await db.doc(`households/${householdId}/maintenanceTasks/${taskId}`).get()
  return snap.exists ? { id: snap.id, ...snap.data() } : null
}

function resolveTargetMembers(household, task) {
  const members = Array.isArray(household?.members) ? household.members : []
  const owners = members.filter((member) => member.role === 'owner')
  const assigned = normalize(task?.assignedTo)
  const claimed = normalize(task?.claimedBy)
  const target = claimed || assigned

  const selected = new Map()
  for (const member of owners) {
    if (member?.id) selected.set(member.id, member)
  }

  if (target) {
    for (const member of members) {
      const memberKeys = [member?.id, member?.name, member?.email].map(normalize).filter(Boolean)
      if (memberKeys.includes(target) && member?.id) selected.set(member.id, member)
    }
  }

  if (selected.size) return Array.from(selected.values())
  return members.filter((member) => member?.id)
}

async function readPushTokensForMembers(members) {
  const tokens = new Map()
  await Promise.all(members.map(async (member) => {
    const tokenSnaps = await db.collection(`users/${member.id}/pushTokens`).get()
    tokenSnaps.forEach((tokenSnap) => {
      const token = String(tokenSnap.data()?.token || '').trim()
      if (!token) return
      tokens.set(token, {
        token,
        ref: tokenSnap.ref,
        userId: member.id,
      })
    })
  }))
  return Array.from(tokens.values())
}

async function deleteInvalidTokens(tokens, batchResponses) {
  const deletes = []
  batchResponses.forEach((response, index) => {
    const code = response?.error?.code || ''
    if (!response.success && INVALID_TOKEN_CODES.has(code) && tokens[index]?.ref) {
      deletes.push(tokens[index].ref.delete())
    }
  })
  await Promise.all(deletes)
  return deletes.length
}

async function sendReminderPush(reminderSnap, options = {}) {
  const reminder = { id: reminderSnap.id, ...reminderSnap.data() }
  const householdRef = reminderSnap.ref.parent.parent
  const householdId = householdRef?.id || options.householdId || ''
  if (!householdId) return { reminderId: reminder.id, status: 'missing-household' }

  const [householdSnap, task] = await Promise.all([
    householdRef.get(),
    readTask(householdId, reminder.taskId),
  ])
  if (!householdSnap.exists) return { reminderId: reminder.id, householdId, status: 'missing-household' }

  const household = { id: householdSnap.id, ...householdSnap.data() }
  const targetMembers = resolveTargetMembers(household, task)
  const pushTokens = await readPushTokensForMembers(targetMembers)
  const notification = renderNotification(reminder)

  if (!pushTokens.length) {
    await reminderSnap.ref.set({
      lastPushAttemptAt: FieldValue.serverTimestamp(),
      lastPushStatus: 'no-tokens',
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true })
    return { reminderId: reminder.id, householdId, status: 'no-tokens', targetMemberCount: targetMembers.length }
  }

  if (options.dryRun) {
    return {
      reminderId: reminder.id,
      householdId,
      status: 'dry-run',
      targetMemberCount: targetMembers.length,
      tokenCount: pushTokens.length,
      title: notification.title,
      body: notification.body,
    }
  }

  let successCount = 0
  let failureCount = 0
  let deletedTokenCount = 0

  for (const tokenChunk of chunk(pushTokens, MAX_MULTICAST_TOKENS)) {
    const response = await messaging.sendEachForMulticast({
      tokens: tokenChunk.map((entry) => entry.token),
      notification,
      data: {
        type: 'reminder',
        householdId,
        reminderId: reminder.id,
        taskId: String(reminder.taskId || ''),
        dueAt: String(reminder.dueAt || ''),
      },
      android: {
        notification: {
          channelId: 'maison-reminders',
          priority: 'high',
          defaultSound: true,
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
    })
    successCount += response.successCount
    failureCount += response.failureCount
    deletedTokenCount += await deleteInvalidTokens(tokenChunk, response.responses)
  }

  const status = successCount > 0 ? 'sent' : 'failed'
  await reminderSnap.ref.set({
    ...(successCount > 0 ? { sent: true, sentAt: new Date().toISOString(), sentChannel: 'push' } : {}),
    lastPushAttemptAt: FieldValue.serverTimestamp(),
    lastPushStatus: status,
    pushSuccessCount: successCount,
    pushFailureCount: failureCount,
    pushDeletedTokenCount: deletedTokenCount,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true })

  await householdRef.set({
    lastReminderRunAt: new Date().toISOString(),
    lastReminderChannel: 'push',
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true })

  return {
    reminderId: reminder.id,
    householdId,
    status,
    targetMemberCount: targetMembers.length,
    tokenCount: pushTokens.length,
    successCount,
    failureCount,
    deletedTokenCount,
  }
}

async function readDueReminderSnaps(options = {}) {
  const today = options.today || todayISO()
  let query = db.collectionGroup('reminders').where('sent', '==', false)
  const allUnsent = await query.get()
  return allUnsent.docs.filter((snap) => {
    const householdId = snap.ref.parent.parent?.id || ''
    if (options.householdId && householdId !== options.householdId) return false
    return reminderIsDue(snap.data(), today)
  })
}

async function sendDueReminderPushes(options = {}) {
  const dueSnaps = await readDueReminderSnaps(options)
  const results = []
  for (const snap of dueSnaps) {
    results.push(await sendReminderPush(snap, options))
  }
  return {
    ok: true,
    dryRun: Boolean(options.dryRun),
    today: options.today || todayISO(),
    dueCount: dueSnaps.length,
    results,
  }
}

async function assertOwner(uid, householdId) {
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in before triggering reminders.')
  if (!householdId) throw new HttpsError('invalid-argument', 'householdId is required.')
  const membershipSnap = await db.doc(`users/${uid}/meta/membership`).get()
  const membership = membershipSnap.exists ? membershipSnap.data() : null
  if (membership?.householdId !== householdId || membership?.role !== 'owner') {
    throw new HttpsError('permission-denied', 'Only a household owner can trigger reminder pushes.')
  }
}

export const sendDueReminderPushesScheduled = onSchedule({
  schedule: 'every day 08:00',
  timeZone: TIME_ZONE,
}, async () => {
  const result = await sendDueReminderPushes()
  logger.info('Scheduled Maison reminder push run complete', result)
  return result
})

export const sendDueReminderPushesNow = onCall(async (request) => {
  const householdId = String(request.data?.householdId || '').trim()
  await assertOwner(request.auth?.uid, householdId)
  const result = await sendDueReminderPushes({
    householdId,
    dryRun: Boolean(request.data?.dryRun),
    today: request.data?.today || undefined,
  })
  logger.info('Manual Maison reminder push run complete', { householdId, ...result })
  return result
})
