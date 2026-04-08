import { useEffect, useMemo, useState } from 'react'
import { houseProfile as seedHouseProfile, maintenanceTasks as seedTasks, shoppingLists as seedLists, TODAY } from '../lib/data'
import { hasFirebaseConfig } from '../lib/firebase'
import {
  deleteShoppingItem,
  deleteTask,
  markReminderSent,
  markTaskCompleted,
  readPlannerState,
  saveShoppingItem,
  saveShoppingListMeta,
  saveTask,
  setTaskClaim,
  subscribePlannerState,
  toggleShoppingItemChecked,
} from '../lib/firestorePlanner'
import {
  buildCompletionRecord,
  buildReminderRecord,
  claimTask,
  clearTaskClaim,
  completeTask,
  enrichTask,
  normalizeTaskInput,
  removeTask,
  upsertShoppingItem,
  upsertTask,
  removeShoppingItem,
  updateShoppingListMeta,
} from '../lib/model'

export function usePlannerState() {
  const [houseProfile, setHouseProfile] = useState(seedHouseProfile)
  const [taskState, setTaskState] = useState(seedTasks)
  const [lists, setLists] = useState(seedLists)
  const [reminders, setReminders] = useState(seedTasks.map(buildReminderRecord))
  const [completions, setCompletions] = useState([])
  const [isRemoteLoaded, setIsRemoteLoaded] = useState(false)
  const [isRemoteLoading, setIsRemoteLoading] = useState(hasFirebaseConfig)
  const [remoteError, setRemoteError] = useState(null)

  useEffect(() => {
    let cancelled = false
    let unsubscribe = () => {}
    async function loadRemote() {
      if (!hasFirebaseConfig) {
        setIsRemoteLoading(false)
        return
      }
      setIsRemoteLoading(true)
      setRemoteError(null)
      try {
        const state = await readPlannerState()
        if (!cancelled && state) {
          setHouseProfile(state.houseProfile)
          setTaskState(state.maintenanceTasks)
          setLists(state.shoppingLists)
          setReminders(state.reminders)
          setCompletions(state.completions)
          setIsRemoteLoaded(true)
        }
        unsubscribe = await subscribePlannerState((nextState) => {
          if (cancelled || !nextState) return
          setHouseProfile(nextState.houseProfile)
          setTaskState(nextState.maintenanceTasks)
          setLists(nextState.shoppingLists)
          setReminders(nextState.reminders)
          setCompletions(nextState.completions)
          setIsRemoteLoaded(true)
          setIsRemoteLoading(false)
          setRemoteError(null)
        })
      } catch (error) {
        if (!cancelled) setRemoteError(error instanceof Error ? error.message : 'Failed to load planner state.')
      } finally {
        if (!cancelled) setIsRemoteLoading(false)
      }
    }
    loadRemote()
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  const enrichedTasks = useMemo(() => taskState.map(enrichTask).sort((a, b) => a.daysUntilDue - b.daysUntilDue), [taskState])

  async function handleComplete(taskId, actor = 'Victor') {
    const currentTask = taskState.find((task) => task.id === taskId)
    if (!currentTask) return
    if (hasFirebaseConfig) {
      const ok = await markTaskCompleted(taskId, TODAY, actor)
      if (ok) return
    }
    const completedTask = completeTask(currentTask, TODAY, actor)
    const completion = buildCompletionRecord(completedTask, actor, new Date().toISOString())
    setTaskState((current) => current.map((task) => (task.id === taskId ? completedTask : task)))
    setCompletions((current) => [completion, ...current].slice(0, 50))
    setReminders((current) => current.map((item) => item.taskId === taskId ? { ...item, sent: false } : item))
  }

  async function handleSaveTask(input) {
    const normalized = normalizeTaskInput(input)
    if (hasFirebaseConfig) {
      const ok = await saveTask(normalized)
      if (ok) return normalized
    }
    setTaskState((current) => upsertTask(current, normalized))
    setReminders((current) => {
      const reminder = buildReminderRecord(normalized)
      const exists = current.some((entry) => entry.id === reminder.id)
      return exists ? current.map((entry) => entry.id === reminder.id ? reminder : entry) : [reminder, ...current]
    })
    return normalized
  }

  async function handleDeleteTask(taskId) {
    if (hasFirebaseConfig) {
      const ok = await deleteTask(taskId)
      if (ok) return
    }
    setTaskState((current) => removeTask(current, taskId))
    setReminders((current) => current.filter((item) => item.taskId !== taskId))
    setCompletions((current) => current.filter((item) => item.taskId !== taskId))
  }

  async function handleSaveShoppingItem(listId, input) {
    if (hasFirebaseConfig) {
      const ok = await saveShoppingItem(listId, input)
      if (ok) return
    }
    setLists((current) => upsertShoppingItem(current, listId, input))
  }


  async function handleSaveShoppingListMeta(listId, patch) {
    if (hasFirebaseConfig) {
      const ok = await saveShoppingListMeta(listId, patch)
      if (ok) return
    }
    setLists((current) => updateShoppingListMeta(current, listId, patch))
  }

  async function handleDeleteShoppingItem(listId, itemId) {
    if (hasFirebaseConfig) {
      const ok = await deleteShoppingItem(listId, itemId)
      if (ok) return
    }
    setLists((current) => removeShoppingItem(current, listId, itemId))
  }

  async function handleToggleShoppingItem(listId, itemId) {
    const list = lists.find((entry) => entry.id === listId)
    const item = list?.items.find((entry) => entry.id === itemId)
    if (!list || !item) return
    if (hasFirebaseConfig) {
      const ok = await toggleShoppingItemChecked(listId, itemId, !item.checked)
      if (ok) return
    }
    setLists((current) => current.map((entry) => entry.id !== listId ? entry : {
      ...entry,
      items: entry.items.map((listItem) => (listItem.id === itemId ? { ...listItem, checked: !listItem.checked } : listItem)),
    }))
  }


  async function handleClaimTask(taskId, actor = null) {
    const currentTask = taskState.find((task) => task.id === taskId)
    if (!currentTask) return
    if (hasFirebaseConfig) {
      const ok = await setTaskClaim(taskId, actor)
      if (ok) return
    }
    setTaskState((current) => current.map((task) => {
      if (task.id !== taskId) return task
      return actor ? claimTask(task, actor) : clearTaskClaim(task)
    }))
  }

  async function handleMarkReminderSent(reminderId) {
    if (hasFirebaseConfig) {
      const ok = await markReminderSent(reminderId, 'email')
      if (ok) return
    }
    setReminders((current) => current.map((item) => item.id === reminderId ? { ...item, sent: true, sentAt: new Date().toISOString(), sentChannel: 'email' } : item))
  }

  return {
    houseProfile,
    taskState,
    lists,
    reminders,
    completions,
    enrichedTasks,
    hasFirebaseConfig,
    isRemoteLoaded,
    isRemoteLoading,
    remoteError,
    handleComplete,
    handleSaveTask,
    handleClaimTask,
    handleDeleteTask,
    handleSaveShoppingItem,
    handleSaveShoppingListMeta,
    handleDeleteShoppingItem,
    handleToggleShoppingItem,
    handleMarkReminderSent,
  }
}
