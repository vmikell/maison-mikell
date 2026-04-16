import { Capacitor } from '@capacitor/core'

const STORAGE_KEY = 'maison:diagnostics-events'
const UPDATE_EVENT = 'maison:diagnostics-updated'
const MAX_STORED_EVENTS = 24
const DEDUPE_WINDOW_MS = 1500
const DEBUG_QUERY_KEYS = ['nativeDebug', 'nativeDiagnostics']
const TRUTHY_QUERY_VALUES = new Set(['1', 'true', 'yes', 'on'])

let memoryEvents = []

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readDebugFlagFromUrl() {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  return DEBUG_QUERY_KEYS.some((key) => TRUTHY_QUERY_VALUES.has((params.get(key) || '').toLowerCase()))
}

export function shouldCaptureDiagnostics() {
  const platform = Capacitor.getPlatform()
  return platform === 'ios' || platform === 'android' || readDebugFlagFromUrl()
}

function normalizeEvents(value) {
  if (!Array.isArray(value)) return []
  return value.filter((event) => event && typeof event.type === 'string' && typeof event.timestamp === 'string')
}

function readEventsFromStorage() {
  if (!canUseStorage()) return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return normalizeEvents(JSON.parse(raw))
  } catch {
    return null
  }
}

function writeEvents(events) {
  memoryEvents = events

  if (canUseStorage()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
    } catch {
      // Fall back to in-memory storage when localStorage is unavailable.
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: { events } }))
  }
}

function stringifyDetail(detail) {
  if (typeof detail === 'string') return detail
  try {
    return JSON.stringify(detail)
  } catch {
    return String(detail)
  }
}

function shouldDeduplicate(previousEvent, nextType, nextDetail) {
  if (!previousEvent || previousEvent.type !== nextType) return false
  const previousTime = Number(new Date(previousEvent.timestamp))
  if (!previousTime || Date.now() - previousTime > DEDUPE_WINDOW_MS) return false
  return stringifyDetail(previousEvent.detail) === stringifyDetail(nextDetail)
}

export function buildDiagnosticsEvent(type, detail) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    detail,
    timestamp: new Date().toISOString(),
  }
}

export function readDiagnosticsEvents() {
  const storedEvents = readEventsFromStorage()
  if (storedEvents) {
    memoryEvents = storedEvents
    return storedEvents
  }
  return memoryEvents
}

export function appendDiagnosticsEvent(type, detail) {
  const currentEvents = readDiagnosticsEvents()
  if (!shouldCaptureDiagnostics()) return currentEvents
  if (shouldDeduplicate(currentEvents[0], type, detail)) return currentEvents

  const nextEvents = [buildDiagnosticsEvent(type, detail), ...currentEvents].slice(0, MAX_STORED_EVENTS)
  writeEvents(nextEvents)
  return nextEvents
}

export function clearDiagnosticsEvents() {
  writeEvents([])
  return []
}

export function subscribeDiagnosticsEvents(callback) {
  if (typeof window === 'undefined') return () => {}

  function handleUpdate(event) {
    callback(event?.detail?.events || readDiagnosticsEvents())
  }

  window.addEventListener(UPDATE_EVENT, handleUpdate)
  return () => window.removeEventListener(UPDATE_EVENT, handleUpdate)
}
