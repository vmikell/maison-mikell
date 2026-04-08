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
    assignedTo: input.assignedTo || null,
    claimedBy: input.claimedBy || null,
    claimedAt: input.claimedAt || null,
  }
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
