import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { FirebaseMessaging } from '@capacitor-firebase/messaging'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { firestore, hasFirebaseConfig } from './firebase'
import { appendDiagnosticsEvent } from './diagnosticsStore'

const PUSH_CHANNEL_ID = 'maison-reminders'

function recordPushDiagnostic(type, detail = {}) {
  try {
    appendDiagnosticsEvent(type, detail)
  } catch {
    // Diagnostics are best-effort only.
  }
}

function getTokenDocumentId(token = '') {
  const value = String(token)
  if (typeof btoa === 'function') {
    return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
  }
  return encodeURIComponent(value)
}

async function savePushToken({ token, userId, householdId }) {
  if (!firestore || !userId || !token) return

  await setDoc(doc(firestore, 'users', userId, 'pushTokens', getTokenDocumentId(token)), {
    token,
    platform: Capacitor.getPlatform(),
    householdId: householdId || null,
    updatedAt: serverTimestamp(),
  }, { merge: true })
}

async function createAndroidReminderChannel() {
  if (Capacitor.getPlatform() !== 'android') return

  await FirebaseMessaging.createChannel({
    id: PUSH_CHANNEL_ID,
    name: 'Maison reminders',
    description: 'Household reminders and upkeep nudges from Maison.',
    importance: 4,
    visibility: 1,
    lights: true,
    vibration: true,
  })
}

export function usePushNotifications(user, membership) {
  const [pushState, setPushState] = useState({
    enabled: false,
    permission: 'unknown',
    token: '',
    error: '',
  })
  const userId = user?.uid || ''
  const householdId = membership?.householdId || null

  useEffect(() => {
    let isActive = true
    const listenerHandles = []

    async function registerForPush() {
      if (!hasFirebaseConfig || !firestore || !userId || !Capacitor.isNativePlatform()) return

      try {
        await createAndroidReminderChannel()

        async function handleToken(token) {
          if (!isActive || !token) return
          try {
            await savePushToken({ token, userId, householdId })
            recordPushDiagnostic('push_registration_success', {
              platform: Capacitor.getPlatform(),
              userId,
              householdId,
            })
            if (isActive) setPushState({ enabled: true, permission: 'granted', token, error: '' })
          } catch (error) {
            const message = error?.message || 'Push token was received but could not be saved.'
            recordPushDiagnostic('push_token_save_error', { message })
            if (isActive) setPushState((current) => ({ ...current, error: message }))
          }
        }

        listenerHandles.push(await FirebaseMessaging.addListener('tokenReceived', ({ token }) => {
          handleToken(token)
        }))

        listenerHandles.push(await FirebaseMessaging.addListener('notificationReceived', (notification) => {
          recordPushDiagnostic('push_received_foreground', {
            id: notification?.id || '',
            title: notification?.title || '',
          })
        }))

        listenerHandles.push(await FirebaseMessaging.addListener('notificationActionPerformed', (event) => {
          recordPushDiagnostic('push_action_performed', {
            actionId: event?.actionId || '',
            notificationId: event?.notification?.id || '',
          })
        }))

        const support = await FirebaseMessaging.isSupported()
        if (!support.isSupported) {
          recordPushDiagnostic('push_not_supported', { platform: Capacitor.getPlatform() })
          return
        }

        let permissionStatus = await FirebaseMessaging.checkPermissions()
        if (permissionStatus.receive === 'prompt') {
          permissionStatus = await FirebaseMessaging.requestPermissions()
        }

        if (!isActive) return
        setPushState((current) => ({ ...current, permission: permissionStatus.receive || 'unknown' }))

        if (permissionStatus.receive !== 'granted') {
          recordPushDiagnostic('push_permission_not_granted', {
            permission: permissionStatus.receive || 'unknown',
            platform: Capacitor.getPlatform(),
          })
          return
        }

        const tokenResult = await FirebaseMessaging.getToken()
        await handleToken(tokenResult.token)
      } catch (error) {
        const message = error?.message || 'Push notifications could not be enabled.'
        recordPushDiagnostic('push_setup_error', { message, platform: Capacitor.getPlatform() })
        if (isActive) setPushState({ enabled: false, permission: 'unknown', token: '', error: message })
      }
    }

    registerForPush()

    return () => {
      isActive = false
      listenerHandles.forEach((handle) => {
        try {
          handle.remove()
        } catch {
          // Listener cleanup should not affect app teardown.
        }
      })
    }
  }, [householdId, userId])

  return pushState
}
