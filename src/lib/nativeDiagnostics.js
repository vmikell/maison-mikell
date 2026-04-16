import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'
import { appendDiagnosticsEvent, clearDiagnosticsEvents, readDiagnosticsEvents, subscribeDiagnosticsEvents } from './diagnosticsStore'

const MAX_VISIBLE_EVENTS = 8
const DEBUG_QUERY_KEYS = ['nativeDebug', 'nativeDiagnostics']
const TRUTHY_QUERY_VALUES = new Set(['1', 'true', 'yes', 'on'])

function getCurrentUrl() {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}${window.location.pathname}${window.location.search}${window.location.hash}`
}

function getDocumentAppState() {
  if (typeof document === 'undefined') return 'unknown'
  return document.hidden ? 'background' : 'active'
}

function readDebugFlagFromUrl() {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  return DEBUG_QUERY_KEYS.some((key) => TRUTHY_QUERY_VALUES.has((params.get(key) || '').toLowerCase()))
}

export function useNativeDiagnostics() {
  const platform = Capacitor.getPlatform()
  const isNativeShell = platform === 'ios' || platform === 'android'

  const [currentUrl, setCurrentUrl] = useState(() => getCurrentUrl())
  const [appState, setAppState] = useState(() => getDocumentAppState())
  const [debugEnabled] = useState(() => readDebugFlagFromUrl())
  const lastRecordedUrl = useRef(getCurrentUrl())

  const shouldShowDiagnostics = isNativeShell || debugEnabled
  const [events, setEvents] = useState(() => shouldShowDiagnostics ? readDiagnosticsEvents() : [])
  const [copyMessage, setCopyMessage] = useState('')

  const pushEvent = useCallback((type, detail) => {
    if (!shouldShowDiagnostics) return
    const nextEvents = appendDiagnosticsEvent(type, detail)
    setEvents(nextEvents)
  }, [shouldShowDiagnostics])

  const clearEvents = useCallback(() => {
    clearDiagnosticsEvents()
    setEvents([])
    setCopyMessage('Cleared diagnostics history.')
  }, [])

  useEffect(() => {
    if (!shouldShowDiagnostics) return undefined
    return subscribeDiagnosticsEvents((nextEvents) => setEvents(nextEvents))
  }, [shouldShowDiagnostics])

  useEffect(() => {
    if (!shouldShowDiagnostics || typeof window === 'undefined' || typeof document === 'undefined') return undefined
    lastRecordedUrl.current = getCurrentUrl()

    const initialUrlTimer = window.setTimeout(() => {
      pushEvent('webview_url', getCurrentUrl())
    }, 0)

    function handleLocationChange() {
      const nextUrl = getCurrentUrl()
      setCurrentUrl(nextUrl)
      if (nextUrl === lastRecordedUrl.current) return
      lastRecordedUrl.current = nextUrl
      pushEvent('webview_url', nextUrl)
    }

    function handleVisibilityChange() {
      const nextState = getDocumentAppState()
      setAppState(nextState)
      pushEvent('visibility_change', nextState)
    }

    handleLocationChange()

    window.addEventListener('hashchange', handleLocationChange)
    window.addEventListener('popstate', handleLocationChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.clearTimeout(initialUrlTimer)
      window.removeEventListener('hashchange', handleLocationChange)
      window.removeEventListener('popstate', handleLocationChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [pushEvent, shouldShowDiagnostics])

  useEffect(() => {
    if (!isNativeShell || !shouldShowDiagnostics) return undefined

    let isActive = true
    const listenerHandles = []

    async function registerNativeListeners() {
      try {
        const launchResult = await CapacitorApp.getLaunchUrl()
        if (isActive && launchResult?.url) pushEvent('launch_url', launchResult.url)
      } catch {
        // Ignore launch URL fetch failures so diagnostics stay passive.
      }

      try {
        const stateResult = await CapacitorApp.getState()
        if (!isActive) return
        const nextState = stateResult?.isActive ? 'active' : 'background'
        setAppState(nextState)
        pushEvent('app_state_snapshot', stateResult)
      } catch {
        // Ignore state snapshot failures so diagnostics stay passive.
      }

      try {
        listenerHandles.push(await CapacitorApp.addListener('appStateChange', (state) => {
          const nextState = state?.isActive ? 'active' : 'background'
          setAppState(nextState)
          pushEvent('app_state_change', state)
        }))
        listenerHandles.push(await CapacitorApp.addListener('appUrlOpen', (event) => {
          setCurrentUrl(getCurrentUrl())
          pushEvent('app_url_open', event?.url || '(empty url)')
        }))
        listenerHandles.push(await CapacitorApp.addListener('pause', () => {
          setAppState('background')
          pushEvent('pause', 'App paused')
        }))
        listenerHandles.push(await CapacitorApp.addListener('resume', () => {
          setAppState('active')
          setCurrentUrl(getCurrentUrl())
          pushEvent('resume', getCurrentUrl())
        }))
      } catch (error) {
        if (isActive) pushEvent('listener_error', error?.message || 'Failed to attach a native listener.')
      }
    }

    registerNativeListeners()

    return () => {
      isActive = false
      for (const handle of listenerHandles) handle.remove()
    }
  }, [isNativeShell, pushEvent, shouldShowDiagnostics])

  const snapshot = useMemo(() => ({
    runtime: isNativeShell ? 'native-shell' : 'web',
    platform,
    appState,
    currentUrl,
    eventCount: events.length,
    latestEvent: events[0]
      ? {
          type: events[0].type,
          detail: events[0].detail,
          timestamp: events[0].timestamp,
        }
      : null,
  }), [appState, currentUrl, events, isNativeShell, platform])

  const copySnapshot = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      setCopyMessage('Clipboard is unavailable on this device.')
      return { ok: false }
    }

    try {
      await navigator.clipboard.writeText(JSON.stringify({ snapshot, events }, null, 2))
      setCopyMessage('Copied diagnostics snapshot.')
      return { ok: true }
    } catch {
      setCopyMessage('Could not copy diagnostics from this device.')
      return { ok: false }
    }
  }, [events, snapshot])

  useEffect(() => {
    if (!copyMessage || typeof window === 'undefined') return undefined
    const timer = window.setTimeout(() => setCopyMessage(''), 2400)
    return () => window.clearTimeout(timer)
  }, [copyMessage])

  const visibleEvents = useMemo(() => events.slice(0, MAX_VISIBLE_EVENTS), [events])

  return {
    appState,
    clearEvents,
    copyMessage,
    copySnapshot,
    currentUrl,
    debugEnabled,
    events: visibleEvents,
    isNativeShell,
    platform,
    shouldShowDiagnostics,
    snapshot,
    totalEventCount: events.length,
  }
}
