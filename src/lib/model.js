import { TODAY } from './data'

export function addDays(dateString, days) {
  const date = new Date(`${dateString}T12:00:00`)
  date.setDate(date.getDate() + days)
  return date
}

export function formatISO(date) {
  return date.toISOString().slice(0, 10)
}

export function daysBetween(from, to) {
  const ms = addDays(to, 0) - addDays(from, 0)
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

export function formatDate(date) {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function enrichTask(task) {
  const nextDue = addDays(task.lastDone, task.cadenceDays)
  const daysUntilDue = daysBetween(TODAY, formatISO(nextDue))
  const reminderDate = addDays(formatISO(nextDue), -task.reminderLeadDays)
  const daysUntilReminder = daysBetween(TODAY, formatISO(reminderDate))

  let status = 'upcoming'
  if (daysUntilDue < 0) status = 'overdue'
  else if (daysUntilReminder <= 0) status = 'remind'

  return { ...task, nextDue, reminderDate, daysUntilDue, daysUntilReminder, status }
}

export function buildReminderRecord(task) {
  const enriched = enrichTask(task)
  return {
    id: `${task.id}:${formatISO(enriched.reminderDate)}`,
    taskId: task.id,
    title: task.title,
    dueAt: formatISO(enriched.nextDue),
    remindAt: formatISO(enriched.reminderDate),
    leadDays: task.reminderLeadDays,
    channelTargets: ['email', 'push'],
    sent: false,
    status: enriched.status,
  }
}

export function buildCompletionRecord(task, actor = 'Victor', completedAt = new Date().toISOString()) {
  return {
    id: `${task.id}:${completedAt}`,
    taskId: task.id,
    title: task.title,
    area: task.area,
    category: task.category,
    completedAt,
    completedBy: actor,
  }
}

export function completeTask(task, doneDate = TODAY, actor = 'Victor') {
  return {
    ...task,
    lastDone: doneDate,
    lastCompletedAt: new Date().toISOString(),
    lastCompletedBy: actor,
    claimedBy: null,
    claimedAt: null,
  }
}

export function claimTask(task, actor) {
  return {
    ...task,
    claimedBy: actor,
    claimedAt: new Date().toISOString(),
  }
}

export function clearTaskClaim(task) {
  return {
    ...task,
    claimedBy: null,
    claimedAt: null,
  }
}

export function createTaskId(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || `task-${Date.now()}`
}

export function normalizeTaskInput(input) {
  const cadenceDays = Number(input.cadenceDays || 7)
  const reminderLeadDays = Number(input.reminderLeadDays || 7)

  return {
    id: input.id || createTaskId(input.title),
    title: input.title?.trim() || 'Untitled task',
    area: input.area?.trim() || 'Home',
    category: input.category?.trim() || 'General',
    room: input.room?.trim() || '',
    system: input.system?.trim() || '',
    assetName: input.assetName?.trim() || '',
    vendor: input.vendor?.trim() || '',
    supplyNote: input.supplyNote?.trim() || '',
    frequency: input.frequency?.trim() || 'Monthly',
    cadenceDays,
    reminderLeadDays,
    effort: input.effort?.trim() || '15 min',
    season: input.season?.trim() || 'All year',
    priority: input.priority?.trim() || 'Routine',
    notes: input.notes?.trim() || '',
    lastDone: input.lastDone || TODAY,
    major: Boolean(input.major || reminderLeadDays >= 30 || cadenceDays >= 90),
    lastCompletedAt: input.lastCompletedAt || null,
    lastCompletedBy: input.lastCompletedBy || null,
    claimedBy: input.claimedBy || null,
    claimedAt: input.claimedAt || null,
  }
}

export function buildTasksFromSetup(setupInput = {}) {
  const levels = Number(setupInput.levels || 0)
  const bathrooms = Number(setupInput.bathrooms || 0)
  const bedrooms = Number(setupInput.bedrooms || 0)
  const homeType = (setupInput.homeType || '').trim().toLowerCase()
  const hvacSystem = (setupInput.hvac?.system || '').trim()
  const hvacHeads = Number(setupInput.hvac?.heads || 0)
  const hasMiniSplit = /mini\s*split/i.test(hvacSystem)
  const hasMultipleBathrooms = bathrooms >= 2
  const hasHalfBath = bathrooms > 0 && bathrooms % 1 !== 0
  const hasMultipleBedrooms = bedrooms >= 2
  const hasMultipleLevels = levels >= 2
  const isStandaloneHome = /(house|single-family|single family|townhouse)/i.test(homeType)

  const templates = [
    { title: 'Clean primary bathroom', area: 'Bathroom', category: 'Cleaning', room: 'Main bathroom', system: 'Bathroom surfaces', assetName: 'Tub + vanity + toilet', supplyNote: 'Bathroom cleaner, microfiber cloths, toilet cleaner', frequency: 'Weekly', cadenceDays: 7, reminderLeadDays: 7, effort: '30 min', priority: 'Routine', notes: 'Toilet, sink, mirror, shower/tub, counters, and floor.' },
    ...(hasMultipleBathrooms || hasHalfBath ? [{ title: hasHalfBath ? 'Clean half bath / powder room' : 'Clean second bathroom', area: hasHalfBath ? 'Half bath' : 'Bathroom', category: 'Cleaning', room: hasHalfBath ? 'Powder room' : 'Second bathroom', frequency: 'Weekly', cadenceDays: 7, reminderLeadDays: 7, effort: '15 min', priority: 'Routine', notes: 'Sink, mirror, counters, toilet, and floor.' }] : []),
    ...(hasMultipleBedrooms ? [{ title: 'Wash bedding and remake beds', area: 'Bedrooms', category: 'Laundry', frequency: 'Weekly', cadenceDays: 7, reminderLeadDays: 7, effort: '45 min', priority: 'Routine', notes: 'Sheets, pillowcases, and duvet/comforter touch-up as needed.' }] : []),
    { title: hasMultipleLevels ? 'Vacuum and spot mop both levels' : 'Vacuum and spot mop floors', area: 'Whole home', category: 'Cleaning', frequency: 'Weekly', cadenceDays: 7, reminderLeadDays: 7, effort: hasMultipleLevels ? '55 min' : '40 min', priority: 'Routine', notes: hasMultipleLevels ? 'Hit high-traffic zones on both levels and stairs if needed.' : 'Cover the main rooms and any high-traffic areas first.' },
    { title: 'Deep clean kitchen surfaces and appliance fronts', area: 'Kitchen', category: 'Cleaning', frequency: 'Weekly', cadenceDays: 7, reminderLeadDays: 7, effort: '40 min', priority: 'Routine', notes: 'Counters, sink, backsplash, stovetop, microwave interior, fridge handles, and cabinet fronts.' },
    { title: 'Refresh sink and shower drains', area: 'Kitchen + baths', category: 'Plumbing', frequency: 'Monthly', cadenceDays: 30, reminderLeadDays: 7, effort: '20 min', priority: 'Routine', notes: 'Clear hair/debris and flush drains; avoid harsh chemicals when possible.' },
    { title: 'Test smoke / CO detectors', area: 'Safety', category: 'Safety', frequency: 'Monthly', cadenceDays: 30, reminderLeadDays: 7, effort: '10 min', priority: 'Critical', notes: 'Test alarms and note any battery warnings.' },
    { title: 'Clean out fridge and check for expired food', area: 'Kitchen', category: 'Cleaning', frequency: 'Monthly', cadenceDays: 30, reminderLeadDays: 7, effort: '25 min', priority: 'Routine', notes: 'Wipe shelves and drawers while checking condiments and produce.' },
    { title: 'Inspect under sinks for leaks or moisture', area: 'Kitchen + baths', category: 'Plumbing', frequency: 'Quarterly', cadenceDays: 90, reminderLeadDays: 30, effort: '15 min', priority: 'Important', notes: 'Check shutoffs, traps, and cabinet floors.', major: true },
    { title: 'Review water shutoff locations and emergency supplies', area: 'Safety', category: 'Safety', frequency: 'Annual', cadenceDays: 365, reminderLeadDays: 30, effort: '20 min', priority: 'Important', notes: 'Make sure both of you know where shutoffs, flashlight, and basic supplies are.', major: true },
    ...(isStandaloneHome ? [{ title: 'Inspect exterior doors, thresholds, and weather seals', area: 'Exterior', category: 'Preventive', frequency: 'Quarterly', cadenceDays: 90, reminderLeadDays: 30, effort: '20 min', priority: 'Important', notes: 'Check for drafts, moisture, and worn seals.', major: true }] : []),
    ...(hasMiniSplit ? [
      { title: `Clean mini split filters${hvacHeads ? ` on all ${hvacHeads} head${hvacHeads === 1 ? '' : 's'}` : ''}`, area: 'HVAC', category: 'Systems', room: 'Whole home', system: 'HVAC', assetName: hvacHeads ? `${hvacHeads}-head mini split heat pump` : 'Mini split heat pump', supplyNote: 'Filter cleaning spray, towels', frequency: 'Monthly', cadenceDays: 30, reminderLeadDays: 7, effort: hvacHeads >= 4 ? '35 min' : '25 min', priority: 'Important', notes: 'Open covers, wash filters gently, fully dry, reinstall.' },
      { title: 'Wipe mini split covers and check for dust or mildew', area: 'HVAC', category: 'Systems', system: 'HVAC', frequency: 'Monthly', cadenceDays: 30, reminderLeadDays: 7, effort: '20 min', priority: 'Important', notes: 'Check louvers and nearby wall or ceiling for condensation issues.' },
      { title: 'Schedule professional mini split service', area: 'HVAC', category: 'Systems', room: 'Whole home', system: 'HVAC', assetName: hvacHeads ? `${hvacHeads}-head mini split heat pump` : 'Mini split heat pump', frequency: 'Annual', cadenceDays: 365, reminderLeadDays: 30, effort: 'Schedule vendor', season: 'Spring', priority: 'Critical', notes: 'Book coil cleaning and a seasonal tune-up before peak cooling season.', major: true },
    ] : hvacSystem ? [{ title: `Inspect ${hvacSystem} filters and routine service needs`, area: 'HVAC', category: 'Systems', system: hvacSystem, frequency: 'Monthly', cadenceDays: 30, reminderLeadDays: 7, effort: '20 min', priority: 'Important', notes: 'Check filters, airflow, and any routine maintenance guidance for this system.' }] : []),
  ]

  return templates.map((task, index) => normalizeTaskInput({
    ...task,
    id: task.id || createTaskId(`${task.title}-${index + 1}`),
  }))
}

export function upsertTask(tasks, input) {
  const task = normalizeTaskInput(input)
  const exists = tasks.some((entry) => entry.id === task.id)
  if (!exists) return [task, ...tasks]
  return tasks.map((entry) => (entry.id === task.id ? { ...entry, ...task } : entry))
}

export function removeTask(tasks, taskId) {
  return tasks.filter((task) => task.id !== taskId)
}

export function createShoppingItemId(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || `item-${Date.now()}`
}

export function normalizeShoppingItemInput(input) {
  return {
    id: input.id || createShoppingItemId(input.name),
    name: input.name?.trim() || 'Untitled item',
    qty: input.qty?.trim() || '1',
    aisleHint: input.aisleHint?.trim() || 'Household',
    url: input.url?.trim() || '',
    checked: Boolean(input.checked),
  }
}

export function upsertShoppingItem(lists, listId, input) {
  const item = normalizeShoppingItemInput(input)
  return lists.map((list) => {
    if (list.id !== listId) return list
    const exists = list.items.some((entry) => entry.id === item.id)
    return {
      ...list,
      items: exists
        ? list.items.map((entry) => (entry.id === item.id ? { ...entry, ...item } : entry))
        : [item, ...list.items],
    }
  })
}

export function removeShoppingItem(lists, listId, itemId) {
  return lists.map((list) => {
    if (list.id !== listId) return list
    return {
      ...list,
      items: list.items.filter((item) => item.id !== itemId),
    }
  })
}

export function removeCheckedShoppingItems(lists, listId) {
  return lists.map((list) => {
    if (list.id !== listId) return list
    return {
      ...list,
      items: list.items.filter((item) => !item.checked),
    }
  })
}

export function collectionPlan() {
  return {
    household: 'households/{householdId}',
    maintenanceTasks: 'households/{householdId}/maintenanceTasks/{taskId}',
    shoppingLists: 'households/{householdId}/shoppingLists/{listId}',
    shoppingItems: 'households/{householdId}/shoppingLists/{listId}/items/{itemId}',
    activity: 'households/{householdId}/activity/{entryId}',
    reminders: 'households/{householdId}/reminders/{reminderId}',
    completions: 'households/{householdId}/completions/{completionId}',
  }
}

export function updateShoppingListMeta(lists, listId, patch) {
  return lists.map((list) => list.id === listId ? { ...list, ...patch } : list)
}
