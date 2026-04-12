import { useEffect, useMemo, useState } from 'react'
import { houseProfile as seedHouseProfile, maintenanceTasks as seedTasks, shoppingLists as seedLists, TODAY } from '../lib/data'
import { hasFirebaseConfig } from '../lib/firebase'
import {
  deleteShoppingItem,
  deleteTask,
  ensureHouseholdMembership,
  createHouseholdForCurrentUser,
  joinHouseholdWithInviteCode,
  markReminderSent,
  markTaskCompleted,
  readPlannerState,
  saveShoppingItem,
  saveShoppingListMeta,
  saveTask,
  setTaskClaim,
  subscribePlannerState,
  toggleShoppingItemChecked,
  updateHouseholdMembership,
  completeHouseholdSetup,
  deleteCurrentUserData,
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

export function usePlannerState(currentUser = null) {
  const [houseProfile, setHouseProfile] = useState(seedHouseProfile)
  const [taskState, setTaskState] = useState(seedTasks)
  const [lists, setLists] = useState(seedLists)
  const [reminders, setReminders] = useState(seedTasks.map(buildReminderRecord))
  const [completions, setCompletions] = useState([])
  const [isRemoteLoaded, setIsRemoteLoaded] = useState(false)
  const [isRemoteLoading, setIsRemoteLoading] = useState(hasFirebaseConfig)
  const [remoteError, setRemoteError] = useState(null)
  const [membership, setMembership] = useState(null)
  const [joinError, setJoinError] = useState('')
  const [joinSuccess, setJoinSuccess] = useState('')
  const [inviteChoice, setInviteChoice] = useState(false)
  const [isCreatingHousehold, setIsCreatingHousehold] = useState(false)
  const [createHouseholdError, setCreateHouseholdError] = useState('')
  const [createHouseholdSuccess, setCreateHouseholdSuccess] = useState('')
  const [freshInviteCode, setFreshInviteCode] = useState('')
  const [showInvitePanel, setShowInvitePanel] = useState(false)
  const [settingsMessage, setSettingsMessage] = useState('')
  const [settingsTone, setSettingsTone] = useState('success')
  const [shoppingMessage, setShoppingMessage] = useState('')
  const [shoppingTone, setShoppingTone] = useState('success')
  const [plannerMessage, setPlannerMessage] = useState('')
  const [plannerTone, setPlannerTone] = useState('success')
  const [isJoiningHousehold, setIsJoiningHousehold] = useState(false)
  const [isCompletingSetup, setIsCompletingSetup] = useState(false)
  const [setupError, setSetupError] = useState('')
  const [setupSuccess, setSetupSuccess] = useState('')
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [deleteAccountError, setDeleteAccountError] = useState('')
  const [deleteAccountSuccess, setDeleteAccountSuccess] = useState('')

  useEffect(() => {
    let cancelled = false
    let unsubscribe = () => {}

    if (!hasFirebaseConfig) {
      setIsRemoteLoading(false)
      setMembership(null)
      return () => {}
    }

    if (!currentUser) {
      setMembership(null)
      setJoinError('')
      setJoinSuccess('')
      setInviteChoice(false)
      setCreateHouseholdError('')
      setCreateHouseholdSuccess('')
      setFreshInviteCode('')
      setShowInvitePanel(false)
      setSetupError('')
      setSetupSuccess('')
      setDeleteAccountError('')
      setDeleteAccountSuccess('')
      setIsRemoteLoaded(false)
      setIsRemoteLoading(false)
      setRemoteError(null)
      return () => {}
    }

    setMembership(null)

    async function loadRemote() {
      setIsRemoteLoading(true)
      setRemoteError(null)
      try {
        const nextMembership = await ensureHouseholdMembership(currentUser)
        if (cancelled) return
        setMembership(nextMembership)

        if (!nextMembership?.householdId) {
          setHouseProfile(seedHouseProfile)
          setTaskState(seedTasks)
          setLists(seedLists)
          setReminders(seedTasks.map(buildReminderRecord))
          setCompletions([])
          setIsRemoteLoaded(false)
          return
        }

        const state = await readPlannerState(nextMembership.householdId)
        if (!cancelled && state) {
          setHouseProfile(state.houseProfile)
          setTaskState(state.maintenanceTasks)
          setLists(state.shoppingLists)
          setReminders(state.reminders)
          setCompletions(state.completions)
          setIsRemoteLoaded(true)
        }

        unsubscribe = await subscribePlannerState(nextMembership.householdId, (nextState) => {
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
  }, [currentUser])

  const enrichedTasks = useMemo(() => taskState.map(enrichTask).sort((a, b) => a.daysUntilDue - b.daysUntilDue), [taskState])
  const sentReminderHistory = useMemo(() => reminders
    .filter((item) => item.sent)
    .sort((a, b) => (b.sentAt || '').localeCompare(a.sentAt || '')),
  [reminders])
  const pendingReminderQueue = useMemo(() => reminders
    .filter((item) => !item.sent)
    .sort((a, b) => (a.dueAt || '').localeCompare(b.dueAt || '')),
  [reminders])

  async function handleComplete(taskId, actor = 'Victor') {
    const currentTask = taskState.find((task) => task.id === taskId)
    if (!currentTask) return
    setPlannerMessage('')
    if (hasFirebaseConfig) {
      const ok = await markTaskCompleted(membership?.householdId, taskId, TODAY, actor)
      if (ok) {
        setPlannerTone('success')
        setPlannerMessage('Task marked complete.')
        return
      }
      setPlannerTone('error')
      setPlannerMessage('Could not mark that task complete right now.')
      return
    }
    const completedTask = completeTask(currentTask, TODAY, actor)
    const completion = buildCompletionRecord(completedTask, actor, new Date().toISOString())
    setTaskState((current) => current.map((task) => (task.id === taskId ? completedTask : task)))
    setCompletions((current) => [completion, ...current].slice(0, 50))
    setReminders((current) => current.map((item) => item.taskId === taskId ? { ...item, sent: false } : item))
    setPlannerTone('success')
    setPlannerMessage('Task marked complete locally.')
  }

  async function handleSaveTask(input) {
    const normalized = normalizeTaskInput(input)
    setPlannerMessage('')
    if (hasFirebaseConfig) {
      const ok = await saveTask(membership?.householdId, normalized)
      if (ok) {
        setPlannerTone('success')
        setPlannerMessage('Task saved.')
        return normalized
      }
      setPlannerTone('error')
      setPlannerMessage('Could not save that task right now.')
      return null
    }
    setTaskState((current) => upsertTask(current, normalized))
    setReminders((current) => {
      const reminder = buildReminderRecord(normalized)
      const exists = current.some((entry) => entry.id === reminder.id)
      return exists ? current.map((entry) => entry.id === reminder.id ? reminder : entry) : [reminder, ...current]
    })
    setPlannerTone('success')
    setPlannerMessage('Task saved locally.')
    return normalized
  }

  async function handleDeleteTask(taskId) {
    setPlannerMessage('')
    if (hasFirebaseConfig) {
      const ok = await deleteTask(membership?.householdId, taskId)
      if (ok) {
        setPlannerTone('success')
        setPlannerMessage('Task deleted.')
        return
      }
      setPlannerTone('error')
      setPlannerMessage('Could not delete that task right now.')
      return
    }
    setTaskState((current) => removeTask(current, taskId))
    setReminders((current) => current.filter((item) => item.taskId !== taskId))
    setCompletions((current) => current.filter((item) => item.taskId !== taskId))
    setPlannerTone('success')
    setPlannerMessage('Task deleted locally.')
  }

  async function handleSaveShoppingItem(listId, input) {
    setShoppingMessage('')
    const normalizedInput = { ...input, id: input.id || '' }
    const optimisticItem = normalizeShoppingItemInput(normalizedInput)
    const revertSnapshot = lists

    setLists((current) => upsertShoppingItem(current, listId, optimisticItem))

    if (hasFirebaseConfig) {
      const result = await saveShoppingItem(membership?.householdId, listId, normalizedInput)
      if (result?.ok) {
        setShoppingTone('success')
        setShoppingMessage('Shopping item saved.')
        return result.item
      }
      setLists(revertSnapshot)
      setShoppingTone('error')
      setShoppingMessage(result?.error || 'Could not save that shopping item right now.')
      return null
    }

    setShoppingTone('success')
    setShoppingMessage('Shopping item saved locally.')
    return optimisticItem
  }


  async function handleSaveShoppingListMeta(listId, patch) {
    setShoppingMessage('')
    const revertSnapshot = lists
    setLists((current) => updateShoppingListMeta(current, listId, patch))
    if (hasFirebaseConfig) {
      const ok = await saveShoppingListMeta(membership?.householdId, listId, patch)
      if (ok) {
        setShoppingTone('success')
        setShoppingMessage('Shopping list updated.')
        return
      }
      setLists(revertSnapshot)
      setShoppingTone('error')
      setShoppingMessage('Could not update that shopping list right now.')
      return
    }
    setShoppingTone('success')
    setShoppingMessage('Shopping list updated locally.')
  }

  async function handleDeleteShoppingItem(listId, itemId) {
    setShoppingMessage('')
    const revertSnapshot = lists
    setLists((current) => removeShoppingItem(current, listId, itemId))
    if (hasFirebaseConfig) {
      const ok = await deleteShoppingItem(membership?.householdId, listId, itemId)
      if (ok) {
        setShoppingTone('success')
        setShoppingMessage('Shopping item deleted.')
        return true
      }
      setLists(revertSnapshot)
      setShoppingTone('error')
      setShoppingMessage('Could not delete that shopping item right now.')
      return false
    }
    setShoppingTone('success')
    setShoppingMessage('Shopping item deleted locally.')
    return true
  }

  async function handleToggleShoppingItem(listId, itemId) {
    setShoppingMessage('')
    const list = lists.find((entry) => entry.id === listId)
    const item = list?.items.find((entry) => entry.id === itemId)
    if (!list || !item) return false
    const nextChecked = !item.checked
    const revertSnapshot = lists
    setLists((current) => current.map((entry) => entry.id !== listId ? entry : {
      ...entry,
      items: entry.items.map((listItem) => (listItem.id === itemId ? { ...listItem, checked: nextChecked } : listItem)),
    }))
    if (hasFirebaseConfig) {
      const ok = await toggleShoppingItemChecked(membership?.householdId, listId, itemId, nextChecked)
      if (ok) {
        setShoppingTone('success')
        setShoppingMessage(nextChecked ? 'Shopping item checked off.' : 'Shopping item moved back to open.')
        return true
      }
      setLists(revertSnapshot)
      setShoppingTone('error')
      setShoppingMessage('Could not update that shopping item right now.')
      return false
    }
    setShoppingTone('success')
    setShoppingMessage(nextChecked ? 'Shopping item checked off locally.' : 'Shopping item moved back to open locally.')
    return true
  }


  async function handleClaimTask(taskId, actor = null) {
    setPlannerMessage('')
    const currentTask = taskState.find((task) => task.id === taskId)
    if (!currentTask) return
    if (hasFirebaseConfig) {
      const ok = await setTaskClaim(membership?.householdId, taskId, actor)
      if (ok) {
        setPlannerTone('success')
        setPlannerMessage(actor ? `Task claimed for ${actor}.` : 'Task claim cleared.')
        return
      }
      setPlannerTone('error')
      setPlannerMessage('Could not update that task claim right now.')
      return
    }
    setTaskState((current) => current.map((task) => {
      if (task.id !== taskId) return task
      return actor ? claimTask(task, actor) : clearTaskClaim(task)
    }))
    setPlannerTone('success')
    setPlannerMessage(actor ? `Task claimed for ${actor} locally.` : 'Task claim cleared locally.')
  }

  async function handleMarkReminderSent(reminderId) {
    setSettingsMessage('')
    if (hasFirebaseConfig) {
      const ok = await markReminderSent(membership?.householdId, reminderId, 'email')
      if (ok) {
        setSettingsTone('success')
        setSettingsMessage('Reminder marked delivered.')
        return
      }
      setSettingsTone('error')
      setSettingsMessage('Could not update reminder delivery right now.')
      return
    }
    setReminders((current) => current.map((item) => item.id === reminderId ? { ...item, sent: true, sentAt: new Date().toISOString(), sentChannel: 'email' } : item))
    setSettingsTone('success')
    setSettingsMessage('Reminder marked delivered locally.')
  }

  const householdMembers = houseProfile.members ?? [
    { id: 'victor', name: 'Victor', role: 'owner' },
    { id: 'riah', name: 'Riah', role: 'member' },
  ]

  const resolvedActorName = currentUser?.displayName || currentUser?.email || null

  async function handleGenerateInviteCode() {
    const nextCode = Math.random().toString(36).slice(2, 8).toUpperCase()
    setSettingsMessage('')
    if (hasFirebaseConfig) {
      const result = await updateHouseholdMembership(membership?.householdId, { inviteCode: nextCode })
      if (result?.ok) {
        setHouseProfile((current) => ({ ...current, inviteCode: nextCode }))
        setSettingsTone('success')
        setSettingsMessage('Invite code refreshed.')
        return nextCode
      }
      setSettingsTone('error')
      setSettingsMessage('Could not refresh the invite code right now.')
      return null
    }
    setHouseProfile((current) => ({ ...current, inviteCode: nextCode }))
    setSettingsTone('success')
    setSettingsMessage('Invite code refreshed locally.')
    return nextCode
  }

  async function handlePromoteMember(memberId) {
    setSettingsMessage('')
    const nextMembers = householdMembers.map((member) => member.id === memberId ? { ...member, role: 'owner' } : member)
    if (hasFirebaseConfig) {
      const result = await updateHouseholdMembership(membership?.householdId, { members: nextMembers })
      if (result?.ok) {
        setHouseProfile((current) => ({ ...current, members: nextMembers }))
        setSettingsTone('success')
        setSettingsMessage('Member promoted to owner.')
        return
      }
      setSettingsTone('error')
      setSettingsMessage('Could not update household roles right now.')
      return
    }
    setHouseProfile((current) => ({ ...current, members: nextMembers }))
    setSettingsTone('success')
    setSettingsMessage('Member promoted locally.')
  }

  async function handleCreateHousehold(options = {}) {
    if (!currentUser) {
      setCreateHouseholdError('Sign in first, then create your household.')
      setCreateHouseholdSuccess('')
      return false
    }
    if (!hasFirebaseConfig) {
      setCreateHouseholdError('Household creation needs live Firebase data. The app is in local fallback mode right now.')
      setCreateHouseholdSuccess('')
      return false
    }
    setIsCreatingHousehold(true)
    setCreateHouseholdError('')
    setCreateHouseholdSuccess('')
    try {
      const result = await createHouseholdForCurrentUser(currentUser, options)
      if (!result.ok) {
        const nextError = result.error || 'Could not create the household right now.'
        setCreateHouseholdError(nextError)
        if (nextError === 'This household already exists. Use an invite code to join it instead.') {
          setInviteChoice(true)
        }
        return false
      }
      setMembership(result.membership)
      setInviteChoice(false)
      setFreshInviteCode(result.inviteCode || '')
      setShowInvitePanel(false)
      setCreateHouseholdSuccess(result.created ? 'Your household is ready. Set up your home next.' : 'Your household is already ready.')
      setSetupError('')
      setSetupSuccess('')
      return true
    } catch (error) {
      setCreateHouseholdError(error instanceof Error ? error.message : 'Could not create the household right now.')
      return false
    } finally {
      setIsCreatingHousehold(false)
    }
  }

  async function handleCompleteSetup(setupInput) {
    if (!membership?.householdId) {
      setSetupError('Create or join a household first.')
      setSetupSuccess('')
      return false
    }
    if (!hasFirebaseConfig) {
      setSetupError('Household setup needs live Firebase data. The app is in local fallback mode right now.')
      setSetupSuccess('')
      return false
    }
    setIsCompletingSetup(true)
    setSetupError('')
    setSetupSuccess('')
    try {
      const result = await completeHouseholdSetup(membership.householdId, setupInput)
      if (!result.ok) {
        setSetupError(result.error || 'Could not save your home setup right now.')
        return false
      }
      setHouseProfile((current) => ({
        ...current,
        ...setupInput,
        hvac: {
          system: setupInput.hvac?.system || '',
          heads: setupInput.hvac?.heads || '',
        },
        setupCompleted: true,
      }))
      setSetupSuccess('Your home setup is saved.')
      setShowInvitePanel(true)
      return true
    } catch (error) {
      setSetupError(error instanceof Error ? error.message : 'Could not save your home setup right now.')
      return false
    } finally {
      setIsCompletingSetup(false)
    }
  }

  async function handleDeleteCurrentAccount() {
    if (!currentUser || !membership) {
      setDeleteAccountError('Sign in first before deleting your account.')
      setDeleteAccountSuccess('')
      return false
    }
    if (!hasFirebaseConfig) {
      setDeleteAccountError('Account deletion needs live Firebase data. The app is in local fallback mode right now.')
      setDeleteAccountSuccess('')
      return false
    }
    setIsDeletingAccount(true)
    setDeleteAccountError('')
    setDeleteAccountSuccess('')
    try {
      const result = await deleteCurrentUserData(currentUser, membership)
      if (!result.ok) {
        setDeleteAccountError(result.error || 'Could not delete this account right now.')
        return false
      }
      setDeleteAccountSuccess(result.deletedHousehold ? 'Your account and household were deleted.' : 'Your account was removed from the household.')
      return true
    } catch (error) {
      setDeleteAccountError(error instanceof Error ? error.message : 'Could not delete this account right now.')
      return false
    } finally {
      setIsDeletingAccount(false)
    }
  }

  async function handleJoinHousehold(inviteCode) {
    if (!currentUser) {
      setJoinError('Sign in first, then enter the household invite code.')
      setJoinSuccess('')
      return false
    }
    if (!hasFirebaseConfig) {
      setJoinError('Invite-code joining needs live Firebase data. The app is in local fallback mode right now.')
      setJoinSuccess('')
      return false
    }
    setIsJoiningHousehold(true)
    setJoinError('')
    setJoinSuccess('')
    try {
      const result = await joinHouseholdWithInviteCode(currentUser, inviteCode)
      if (!result.ok) {
        setJoinError(result.error || 'Could not join the household with that invite code.')
        return false
      }
      setMembership(result.membership)
      setInviteChoice(false)
      setShowInvitePanel(false)
      setJoinSuccess('You joined the household successfully.')
      return true
    } catch (error) {
      setJoinError(error instanceof Error ? error.message : 'Could not join the household right now.')
      return false
    } finally {
      setIsJoiningHousehold(false)
    }
  }

  return {
    houseProfile,
    householdMembers,
    membership,
    joinError,
    joinSuccess,
    inviteChoice,
    isCreatingHousehold,
    createHouseholdError,
    createHouseholdSuccess,
    freshInviteCode,
    showInvitePanel,
    isCompletingSetup,
    setupError,
    setupSuccess,
    isDeletingAccount,
    deleteAccountError,
    deleteAccountSuccess,
    settingsMessage,
    settingsTone,
    shoppingMessage,
    shoppingTone,
    plannerMessage,
    plannerTone,
    isJoiningHousehold,
    resolvedActorName,
    taskState,
    lists,
    reminders,
    sentReminderHistory,
    pendingReminderQueue,
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
    handleGenerateInviteCode,
    handlePromoteMember,
    handleCreateHousehold,
    handleJoinHousehold,
    handleCompleteSetup,
    handleDeleteCurrentAccount,
    setInviteChoice,
    setShowInvitePanel,
  }
}
