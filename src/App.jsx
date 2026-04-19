import { useEffect, useMemo, useState } from 'react'
import { addDoc, collection } from 'firebase/firestore'
import './App.css'
import { formatDate, addDays } from './lib/model'
import { starterHouseProfile } from './lib/data'
import { sendWelcomeEmail } from './lib/welcomeEmail'
import { usePlannerState } from './hooks/usePlannerState'
import { createEmailPasswordAccount, deleteSignedInAuthUser, ensureRecentLogin, sendPasswordReset, signInWithEmailPassword, signInWithGoogle, signOutUser, useAuthState } from './lib/auth'
import { useNativeDiagnostics } from './lib/nativeDiagnostics'
import { firestore } from './lib/firebase'
import heroImage from './assets/hero.png'

const emptyTaskForm = {
  id: '', title: '', area: '', category: 'Cleaning', room: '', system: '', assetName: '', vendor: '', supplyNote: '', frequency: 'Monthly', cadenceDays: 30, reminderLeadDays: 7, effort: '20 min', season: 'All year', priority: 'Routine', notes: '', lastDone: '2026-04-02', major: false,
}
const emptyShoppingForm = { id: '', name: '', qty: '1', aisleHint: 'Household', url: '', checked: false }

function App() {
  const nativeDiagnostics = useNativeDiagnostics()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const host = window.location.hostname || ''
    const path = `${window.location.pathname}${window.location.search}${window.location.hash}`

    if (host.endsWith('--maison-mikell.netlify.app')) {
      window.location.replace(`https://maison-mikell.netlify.app${path}`)
      return
    }

    if (host === 'maison-mikell.netlify.app') {
      window.location.replace(`https://maison-reset.firebaseapp.com${path}`)
      return
    }

    if (host === 'maison-reset.web.app') {
      window.location.replace(`https://maison-reset.firebaseapp.com${path}`)
    }
  }, [])

  const [activeTab, setActiveTab] = useState('planner')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  function applyStatusCardFilter(kind) {
    if (kind === 'overdue') {
      setSelectedCategory('All')
      setSelectedStatus((current) => current === 'overdue' ? 'All' : 'overdue')
      return
    }
    if (kind === 'remind') {
      setSelectedCategory('All')
      setSelectedStatus((current) => current === 'remind' ? 'All' : 'remind')
      return
    }
    if (kind === 'weekly') {
      setSelectedCategory('All')
      setSelectedStatus((current) => current === 'upcoming' ? 'All' : 'upcoming')
      return
    }
    if (kind === 'major') {
      setSelectedStatus('All')
      setSelectedCategory((current) => current === 'Systems' ? 'All' : 'Systems')
    }
  }

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [plannerPanelsOpen, setPlannerPanelsOpen] = useState(() => ({
    overview: true,
    overdue: true,
    dueSoon: true,
    completed: true,
    editor: true,
    schedule: true,
  }))
  const [taskForm, setTaskForm] = useState(emptyTaskForm)
  const [taskEditorOpen, setTaskEditorOpen] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [shoppingForms, setShoppingForms] = useState({})
  const [editingShopping, setEditingShopping] = useState({})
  const [activeShoppingListId, setActiveShoppingListId] = useState('home-depot')
  const [authMessage, setAuthMessage] = useState('')
  const [inviteCodeInput, setInviteCodeInput] = useState('')
  const [householdNameInput, setHouseholdNameInput] = useState('')
  const [isInviteCodeVisible, setIsInviteCodeVisible] = useState(true)
  const [setupForm, setSetupForm] = useState({ name: '', homeType: '', sizeSqFt: '', levels: '', bedrooms: '', bathrooms: '', hvacSystem: '', hvacHeads: '' })
  const [emailAuthMode, setEmailAuthMode] = useState('signin')
  const [isEmailAuthLoading, setIsEmailAuthLoading] = useState(false)
  const [emailAuthForm, setEmailAuthForm] = useState({ name: '', email: '', password: '' })
  const [launchInterestForm, setLaunchInterestForm] = useState({ name: '', email: '', householdType: 'Couple', friction: '' })
  const [isLaunchInterestLoading, setIsLaunchInterestLoading] = useState(false)
  const [launchInterestMessage, setLaunchInterestMessage] = useState('')
  const [launchInterestTone, setLaunchInterestTone] = useState('success')
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('')
  const [deleteAccountConfirmText, setDeleteAccountConfirmText] = useState('')

  async function submitEmailAuth(event) {
    event.preventDefault()
    setIsEmailAuthLoading(true)
    setAuthMessage('')
    setAuthError('')
    setAuthErrorCode('')

    const result = emailAuthMode === 'signup'
      ? await createEmailPasswordAccount(emailAuthForm)
      : await signInWithEmailPassword(emailAuthForm)

    if (result?.error) {
      setAuthMessage(result.error)
      setAuthError(result.error)
      setAuthErrorCode(result.rawCode || '')
      setIsEmailAuthLoading(false)
      return
    }

    setAuthMessage(emailAuthMode === 'signup' ? 'Creating your account…' : 'Signing you in…')
    setEmailAuthForm((current) => ({ ...current, password: '' }))
    setIsEmailAuthLoading(false)
  }

  async function handlePasswordReset() {
    setAuthMessage('')
    setAuthError('')
    setAuthErrorCode('')
    const result = await sendPasswordReset({ email: emailAuthForm.email })
    if (!result?.ok) {
      setAuthMessage(result?.error || 'Could not send a password reset email right now.')
      setAuthError(result?.error || '')
      setAuthErrorCode(result?.rawCode || '')
      return
    }
    setAuthMessage('Password reset email sent. Check your inbox and spam folder, then come back and sign in with the new password.')
    setEmailAuthForm((current) => ({ ...current, password: '' }))
  }

  async function submitLaunchInterest(event) {
    event.preventDefault()
    if (!firestore || !hasFirebaseConfig) {
      setLaunchInterestTone('error')
      setLaunchInterestMessage('Founding-launch capture is not configured yet in this build.')
      return
    }

    setIsLaunchInterestLoading(true)
    setLaunchInterestTone('success')
    setLaunchInterestMessage('')

    try {
      await addDoc(collection(firestore, 'launchInterest'), {
        name: launchInterestForm.name.trim(),
        email: launchInterestForm.email.trim().toLowerCase(),
        householdType: launchInterestForm.householdType.trim(),
        friction: launchInterestForm.friction.trim(),
        source: 'landing-page',
        createdAt: new Date().toISOString(),
      })

      setLaunchInterestMessage('You’re on the founding-launch list. We’ll reach out when the next access wave opens.')
      setLaunchInterestForm({ name: '', email: '', householdType: 'Couple', friction: '' })
    } catch {
      setLaunchInterestTone('error')
      setLaunchInterestMessage('Could not save your founding-launch request right now. Please try again in a minute.')
    } finally {
      setIsLaunchInterestLoading(false)
    }
  }

  function buildSetupPreview(form = setupForm) {
    const levels = Number(form.levels || 0)
    const bedrooms = Number(form.bedrooms || 0)
    const bathrooms = Number(form.bathrooms || 0)
    const hvacHeads = Number(form.hvacHeads || 0)
    const facts = []

    if (form.homeType) facts.push(form.homeType)
    if (levels) facts.push(`${levels}-level`)
    if (bedrooms) facts.push(`${bedrooms} bedroom${bedrooms === 1 ? '' : 's'}`)
    if (bathrooms) facts.push(`${bathrooms} bath${bathrooms === 1 ? '' : 's'}`)

    const summary = facts.length ? facts.join(' · ') : 'Your home summary will show up here as you fill things in.'
    const hvacSummary = form.hvacSystem
      ? `${form.hvacSystem}${hvacHeads ? ` · ${hvacHeads} zone${hvacHeads === 1 ? '' : 's'}` : ''}`
      : 'Add HVAC details if you want Maison tuned around your actual systems.'

    return { summary, hvacSummary }
  }

  const setupPreview = buildSetupPreview()
  const maisonLabel = 'Maison'
  const { user, authLoading, authError, setAuthError, setAuthErrorCode } = useAuthState()
  const {
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
    deletedAccountSummary,
    settingsMessage,
    settingsTone,
    shoppingMessage,
    shoppingTone,
    plannerMessage,
    plannerTone,
    isJoiningHousehold,
    resolvedActorName,
    lists,
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
    handleDeleteCheckedShoppingItems,
    handleMarkReminderSent,
    handleGenerateInviteCode,
    handlePromoteMember,
    handleCreateHousehold,
    handleJoinHousehold,
    handleCompleteSetup,
    handleDeleteCurrentAccount,
    finalizeDeletedAccount,
    setInviteChoice,
    setShowInvitePanel,
  } = usePlannerState(user)

  const reminderRules = houseProfile.reminderRules ?? starterHouseProfile.reminderRules
  const inviteHomeName = setupForm.name?.trim() || householdNameInput.trim() || houseProfile.name || 'our Maison home'
  const deleteAccountNeedsPassword = Boolean(user?.providerData?.some((provider) => provider.providerId === 'password'))
  const inviteMessage = `Hey, I set up our Maison household, ${inviteHomeName}. Use invite code ${freshInviteCode} to join it.`
  const inviteInstructions = 'Open Maison, sign in or create an account, tap “I already have an invite code,” and enter the code.'
  const emailInviteHref = `mailto:?subject=${encodeURIComponent(`Join our Maison household`)}&body=${encodeURIComponent(`${inviteMessage}\n\n${inviteInstructions}`)}`
  const textInviteHref = `sms:?&body=${encodeURIComponent(`${inviteMessage} ${inviteInstructions}`)}`
  const landingFeatures = [
    { title: 'Shared shopping', body: 'Keep one live household shopping list that both people can update, without the usual text-thread drift.' },
    { title: 'Home maintenance', body: 'Track recurring upkeep and the invisible work that keeps a home running well over time.' },
    { title: 'Reminders that matter', body: 'Handle household reminders without relying on memory, repeated conversations, or nagging.' },
    { title: 'Household planning', body: 'See the important shared tasks and dates in one calm place instead of six disconnected ones.' },
    { title: 'Multi-member access', body: 'Built for a shared home from the start, not one person carrying the whole operational load alone.' },
  ]
  const landingAudience = ['Couples living together', 'Busy homeowners', 'Households with recurring home-admin friction', 'People who want one shared source of truth']
  const landingFaqs = [
    { question: 'Is Maison for individuals or households?', answer: 'It is built for shared household coordination, especially couples living together.' },
    { question: 'Is there a free plan?', answer: 'No. Maison is positioned as a paid household product from launch.' },
    { question: 'What does one subscription cover?', answer: 'One household. Final billing language should match the actual product setup.' },
  ]

  const categories = useMemo(() => ['All', ...new Set(enrichedTasks.map((task) => task.category))], [enrichedTasks])
  const inAppBrowserWarning = useMemo(() => {
    if (typeof navigator === 'undefined') return null
    const ua = navigator.userAgent || ''
    if (/Telegram/i.test(ua)) return 'Telegram'
    if (/Instagram/i.test(ua)) return 'Instagram'
    if (/FBAN|FBAV|FB_IAB|FB4A/i.test(ua)) return 'Facebook'
    return null
  }, [])

  useEffect(() => {
    if (!user?.uid || !user?.email || typeof window === 'undefined') return

    const createdAt = Date.parse(user.metadata?.creationTime || '')
    const lastSignInAt = Date.parse(user.metadata?.lastSignInTime || '')
    if (!createdAt || !lastSignInAt || Math.abs(lastSignInAt - createdAt) > 60_000) return

    const markerKey = `maison:welcome-email:${user.uid}:${createdAt}`
    const existingMarker = window.localStorage.getItem(markerKey)
    if (existingMarker === 'sent' || existingMarker === 'pending') return

    window.localStorage.setItem(markerKey, 'pending')

    sendWelcomeEmail({
      email: user.email,
      name: user.displayName || '',
      provider: user.providerData?.map((provider) => provider.providerId).filter(Boolean).join(', ') || 'unknown',
    })
      .then(() => {
        window.localStorage.setItem(markerKey, 'sent')
      })
      .catch(() => {
        window.localStorage.removeItem(markerKey)
      })
  }, [user?.uid, user?.email, user?.displayName, user?.metadata?.creationTime, user?.metadata?.lastSignInTime, user?.providerData])

  const currentInviteCode = houseProfile.inviteCode || freshInviteCode || ''
  const inviteCodeVisibilityKey = membership?.householdId ? `maison:invite-code-visible:${membership.householdId}` : ''

  useEffect(() => {
    if (!inviteCodeVisibilityKey) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsInviteCodeVisible(true)
      return
    }
    try {
      const savedVisibility = window.localStorage.getItem(inviteCodeVisibilityKey)
      setIsInviteCodeVisible(savedVisibility !== 'hidden')
    } catch {
      setIsInviteCodeVisible(true)
    }
  }, [inviteCodeVisibilityKey])

  useEffect(() => {
    if (!inviteCodeVisibilityKey) return
    try {
      window.localStorage.setItem(inviteCodeVisibilityKey, isInviteCodeVisible ? 'visible' : 'hidden')
    } catch {
      // Ignore localStorage failures so invite controls still work.
    }
  }, [inviteCodeVisibilityKey, isInviteCodeVisible])

  async function refreshInviteCode() {
    const nextCode = await handleGenerateInviteCode()
    if (nextCode) setIsInviteCodeVisible(true)
  }
  const filteredTasks = enrichedTasks.filter((task) => {
    const categoryMatch = selectedCategory === 'All' || task.category === selectedCategory
    const statusMatch = selectedStatus === 'All' || task.status === selectedStatus
    return categoryMatch && statusMatch
  })
  const dueSoonTasks = enrichedTasks.filter((task) => task.daysUntilDue >= 0 && task.daysUntilDue <= 14).slice(0, 4)
  const shouldShowJoinSuccessPanel = Boolean(joinSuccess && membership && !showInvitePanel)
  const overdueTasks = enrichedTasks.filter((task) => task.status === 'overdue').slice(0, 3)
  const recentCompletions = completions.slice(0, 12)
  const recentReminderHistory = sentReminderHistory.slice(0, 8)
  const activeShoppingList = lists.find((list) => list.id === activeShoppingListId) ?? lists[0]
  const activeShoppingItems = activeShoppingList?.items ?? []
  const openShoppingItems = activeShoppingItems.filter((item) => !item.checked)
  const checkedShoppingItems = activeShoppingItems.filter((item) => item.checked)
  const shoppingCompletion = activeShoppingItems.length ? Math.round((checkedShoppingItems.length / activeShoppingItems.length) * 100) : 0

  const statusCardFilterActive = selectedStatus !== 'All' || selectedCategory !== 'All'

  const calendarSections = useMemo(() => {
    const buckets = new Map()
    const tasksInRange = enrichedTasks
      .filter((task) => task.daysUntilDue >= -7 && task.daysUntilDue <= 30)
      .sort((a, b) => a.nextDue - b.nextDue)

    for (const task of tasksInRange) {
      const key = task.nextDue.toISOString().slice(0, 10)
      if (!buckets.has(key)) buckets.set(key, { key, date: task.nextDue, tasks: [] })
      buckets.get(key).tasks.push(task)
    }

    return Array.from(buckets.values())
  }, [enrichedTasks])

  const summary = {
    overdue: enrichedTasks.filter((task) => task.status === 'overdue').length,
    remind: enrichedTasks.filter((task) => task.status === 'remind').length,
    major: enrichedTasks.filter((task) => task.major).length,
    weekly: enrichedTasks.filter((task) => task.frequency === 'Weekly').length,
  }

  const plannerHeadline = statusCardFilterActive ? 'Filtered maintenance schedule' : 'Today’s maintenance rhythm'
  const plannerMessageClass = plannerTone === 'error' ? 'error' : 'success'
  const shoppingMessageClass = shoppingTone === 'error' ? 'error' : 'success'
  const settingsMessageClass = settingsTone === 'error' ? 'error' : 'success'
  const showRemoteWarning = Boolean(user) && Boolean(remoteError)
  const plannerSubcopy = statusCardFilterActive
    ? `${filteredTasks.length} task${filteredTasks.length === 1 ? '' : 's'} match your current filters.`
    : `${summary.overdue} overdue, ${summary.remind} in the reminder window, and ${dueSoonTasks.length} due soon.`
  const isResolvingSignedInState = Boolean(user) && (authLoading || isRemoteLoading)
  const isNativeShell = nativeDiagnostics.isNativeShell
  const showDeletedAccountNotice = !user && Boolean(deletedAccountSummary)
  const showDeletedAccountView = showDeletedAccountNotice && !isNativeShell
  const deletedAccountNextSteps = showDeletedAccountNotice ? [
    {
      title: deletedAccountSummary.deletedHousehold ? 'That home is gone' : 'Your old household is untouched',
      body: deletedAccountSummary.deletedHousehold
        ? 'Maison removed the shared household because no members were left in it.'
        : 'Maison removed only this account, so the remaining household data stays where it is.',
    },
    {
      title: 'This device is signed out',
      body: `${deletedAccountSummary.email || 'This account'} is no longer active on this browser session.`,
    },
    {
      title: 'Coming back is simple',
      body: deletedAccountSummary.deletedHousehold
        ? 'If you come back later, sign in again and start a fresh household.'
        : 'If you come back later, sign in again and either join a household or start a new one.',
    },
  ] : []
  const remainingHouseholdMembers = householdMembers.filter((member) => member.id !== user?.uid)
  const fallbackSuccessorOwner = membership?.role === 'owner'
    ? remainingHouseholdMembers.find((member) => member.role === 'owner') || remainingHouseholdMembers[0] || null
    : null
  const deletingLastMember = remainingHouseholdMembers.length === 0
  const deleteAccountImpactLabel = membership?.role === 'owner' && deletingLastMember
    ? 'Delete the entire household and every shared record'
    : membership?.role === 'owner' && fallbackSuccessorOwner
      ? `Pass ownership to ${fallbackSuccessorOwner.name || fallbackSuccessorOwner.email || 'another member'} and remove your account`
      : 'Remove only your account from this household'
  const deleteAccountActionLabel = membership?.role === 'owner' && deletingLastMember
    ? 'Delete household and account'
    : 'Delete my account'

  function togglePlannerPanel(panelKey) {
    setPlannerPanelsOpen((current) => ({ ...current, [panelKey]: !current[panelKey] }))
  }

  function openTaskModal(task) { setSelectedTask(task) }
  function closeTaskModal() { setSelectedTask(null) }
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!filtersOpen && !selectedTask) return

    function handleGlobalEscape(event) {
      if (event.key !== 'Escape') return
      if (selectedTask) {
        setSelectedTask(null)
        return
      }
      if (filtersOpen) setFiltersOpen(false)
    }

    window.addEventListener('keydown', handleGlobalEscape)
    return () => window.removeEventListener('keydown', handleGlobalEscape)
  }, [filtersOpen, selectedTask])

  function startEditTask(task) {
    setEditingTaskId(task.id)
    setTaskForm({ id: task.id, title: task.title, area: task.area, category: task.category, room: task.room || '', system: task.system || '', assetName: task.assetName || '', vendor: task.vendor || '', supplyNote: task.supplyNote || '', frequency: task.frequency, cadenceDays: task.cadenceDays, reminderLeadDays: task.reminderLeadDays, effort: task.effort, season: task.season, priority: task.priority, notes: task.notes, lastDone: task.lastDone, major: task.major })
    setTaskEditorOpen(true)
    setSelectedTask(task)
  }
  function resetTaskForm() { setEditingTaskId(null); setTaskForm(emptyTaskForm); setTaskEditorOpen(false) }
  async function submitTaskForm(event) { event.preventDefault(); const saved = await handleSaveTask(taskForm); if (saved) { setSelectedTask(saved); resetTaskForm() } }
  async function completeFromModal(taskId, actor = 'Household member') { await handleComplete(taskId, actor); setSelectedTask(null) }
  async function deleteFromModal(taskId) { await handleDeleteTask(taskId); setSelectedTask(null) }
  async function claimFromModal(taskId, actor = null) {
    await handleClaimTask(taskId, actor)
    setSelectedTask((current) => current ? { ...current, claimedBy: actor, claimedAt: actor ? new Date().toISOString() : null } : current)
  }
  function getShoppingForm(listId) { return shoppingForms[listId] ?? emptyShoppingForm }
  function setShoppingFormValue(listId, next) { setShoppingForms((current) => ({ ...current, [listId]: next })) }
  function startEditShoppingItem(listId, item) { setEditingShopping((current) => ({ ...current, [listId]: item.id })); setShoppingFormValue(listId, { id: item.id, name: item.name, qty: item.qty, aisleHint: item.aisleHint, url: item.url || '', checked: item.checked }) }
  function resetShoppingForm(listId) { setEditingShopping((current) => ({ ...current, [listId]: null })); setShoppingFormValue(listId, emptyShoppingForm) }
  async function submitShoppingForm(event, listId) {
    event.preventDefault()
    const saved = await handleSaveShoppingItem(listId, getShoppingForm(listId))
    if (saved) resetShoppingForm(listId)
  }

  async function runDeleteAccountFlow() {
    if (deleteAccountConfirmText.trim().toUpperCase() !== 'DELETE') {
      window.alert('Type DELETE to confirm this offboarding step.')
      return
    }

    const recentLogin = await ensureRecentLogin({ email: user?.email || '', password: deleteAccountPassword })
    if (!recentLogin.ok) {
      window.alert(recentLogin.error)
      return
    }

    const result = await handleDeleteCurrentAccount()
    if (!result?.ok) return

    const authResult = await deleteSignedInAuthUser()
    if (!authResult.ok) {
      window.alert(authResult.error)
      return
    }

    setAuthMessage('')
    setAuthError('')
    setAuthErrorCode('')
    finalizeDeletedAccount(result, user?.email || '')
    setDeleteAccountPassword('')
    setDeleteAccountConfirmText('')
    await signOutUser()
  }

  const normalizedResolvedActor = (resolvedActorName || '').trim().toLowerCase()
  const visibleClaimMembers = householdMembers.filter((member) => {
    const memberName = (member.name || '').trim().toLowerCase()
    return memberName && memberName !== normalizedResolvedActor
  })

  if (!user && authLoading) {
    return (
      <div className="shell auth-shell">
        <NativeDiagnosticsPanel diagnostics={nativeDiagnostics} />
        <section className="hero-card auth-landing-card">
          <div>
            <p className="eyebrow">{maisonLabel}</p>
            <h1>Finishing your sign-in</h1>
            <p className="hero-copy">One second, I’m checking whether Google just handed your Maison session back.</p>
            <div className="house-loading-wrap" aria-label="Loading" role="status">
              <div className="house-puzzle-loading premium-house-loading" aria-hidden="true">
                <div className="puzzle-piece piece-roof-left"></div>
                <div className="puzzle-piece piece-roof-right"></div>
                <div className="puzzle-piece piece-wall-left"></div>
                <div className="puzzle-piece piece-wall-right"></div>
                <div className="puzzle-piece piece-bottom-left"></div>
                <div className="puzzle-piece piece-bottom-right"></div>
                <div className="house-outline"></div>
              </div>
              <span className="loading-pulse-label">Checking your sign-in…</span>
            </div>
          </div>
        </section>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="shell auth-shell">
        <NativeDiagnosticsPanel diagnostics={nativeDiagnostics} />
        <section className="hero-card auth-landing-card onboarding-card goodbye-card maison-landing-shell">
          <div className="maison-landing-main">
            {showDeletedAccountNotice && isNativeShell ? (
              <section className="maison-section maison-offboarding-shell">
                <div className="section-head">
                  <p className="panel-label">Maison offboarding</p>
                  <h1>Account removed</h1>
                </div>
                <p className="hero-copy">{deletedAccountSummary.message}</p>
                <p className="hero-copy">Your mobile app session is closed cleanly, and Maison is back at a safe resting state.</p>
                <div className="onboarding-bullet-list maison-check-list compact">
                  <span>{deletedAccountSummary.email || 'This account'} is signed out on this device.</span>
                  <span>{deletedAccountSummary.deletedHousehold ? 'That household is gone, so coming back later means starting fresh.' : 'If you come back later, you can sign in again and either join a household or create a new one.'}</span>
                </div>
              </section>
            ) : (
              <>
                <section className="maison-hero">
                  <div className="maison-hero-copy">
                    <p className="eyebrow">{showDeletedAccountView ? 'Maison goodbye' : 'A calmer way to run your home'}</p>
                    <h1>{showDeletedAccountView ? 'Goodbye for now.' : 'The home operating system for couples'}</h1>
                    {showDeletedAccountView ? (
                      <>
                        <p className="hero-copy">{deletedAccountSummary.message}</p>
                        <p className="hero-copy">Your Maison session has been closed cleanly, so you land here instead of getting dumped into a broken or blank state.</p>
                        {deletedAccountSummary.deletedHousehold
                          ? <p className="hero-copy">That household was fully removed. If you return later, you will be starting fresh.</p>
                          : <p className="hero-copy">If you ever come back, you can sign in again and either join a household with an invite code or create a new one.</p>}
                        <div className="maison-hero-actions">
                          <a className="primary-button invite-link-button" href="#maison-auth">Sign back in</a>
                          <a className="secondary-button invite-link-button" href="#maison-next-steps">See what changed</a>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="hero-copy">Maison brings maintenance, shared shopping, reminders, and household planning into one clean place, so running a home feels lighter instead of chaotic.</p>
                        <p className="hero-copy maison-hero-support">For couples who want their home life to feel calmer, cleaner, and less dependent on memory.</p>
                      </>
                    )}
                    {!showDeletedAccountNotice ? <div className="maison-hero-actions">
                      <a className="primary-button invite-link-button" href="#maison-waitlist">Join the founding launch</a>
                      <a className="secondary-button invite-link-button" href="#how-maison-works">See how it works</a>
                    </div> : null}
                  </div>
                  <div className="maison-hero-visual">
                    <div className="maison-hero-frame">
                      <img src={heroImage} alt="Maison home illustration" className="maison-hero-image" />
                    </div>
                    <div className="maison-hero-statline">
                      <div className="maison-metric-card">
                        <span>Shared home flow</span>
                        <strong>Shopping, upkeep, reminders, planning</strong>
                      </div>
                      <div className="maison-metric-card">
                        <span>Positioning</span>
                        <strong>The home operating system for couples</strong>
                      </div>
                    </div>
                  </div>
                </section>

                {showDeletedAccountView ? (
                  <section className="maison-section maison-goodbye-panel" id="maison-next-steps">
                    <div className="section-head">
                      <p className="panel-label">What just happened</p>
                      <h2>Maison closed the loop cleanly.</h2>
                      <p className="hero-copy">This page is intentionally web-only. It gives a clear ending state, then makes the next step obvious if you want to come back.</p>
                    </div>
                    <div className="maison-goodbye-grid">
                      {deletedAccountNextSteps.map((item) => (
                        <article key={item.title} className="maison-goodbye-card">
                          <h3>{item.title}</h3>
                          <p className="hero-copy">{item.body}</p>
                        </article>
                      ))}
                    </div>
                  </section>
                ) : null}

                {!showDeletedAccountNotice ? (
                  <>
                    <section className="maison-section" id="how-maison-works">
                      <div className="section-head">
                        <p className="panel-label">The problem</p>
                        <h2>Home life gets messy when everything lives in six different places.</h2>
                      </div>
                      <div className="maison-problem-grid">
                        <p className="hero-copy">Most households are stitching things together across texts, notes apps, calendars, mental reminders, and half-finished shopping lists. Nothing feels fully shared, and the same tasks keep slipping through the cracks.</p>
                        <p className="hero-copy">Maison is designed to bring those moving parts together into one calm system you can actually live with.</p>
                      </div>
                    </section>

                    <section className="maison-section">
                      <div className="section-head">
                        <p className="panel-label">Value</p>
                        <h2>Everything your household needs, in one calm flow.</h2>
                      </div>
                      <div className="maison-feature-grid">
                        {landingFeatures.map((feature) => (
                          <article key={feature.title} className="maison-feature-card">
                            <h3>{feature.title}</h3>
                            <p className="hero-copy">{feature.body}</p>
                          </article>
                        ))}
                      </div>
                    </section>

                    <section className="maison-section maison-promise-band">
                      <div className="section-head">
                        <p className="panel-label">Emotional promise</p>
                        <h2>Less coordination friction. More calm.</h2>
                      </div>
                      <p className="hero-copy">Maison is not trying to turn your home into a startup. It is built to reduce the tiny coordination failures that make home life feel heavier than it should.</p>
                      <p className="hero-copy">The goal is simple: fewer dropped balls, fewer repeated conversations, and a smoother shared rhythm at home.</p>
                    </section>

                    <section className="maison-section maison-two-column">
                      <article className="maison-audience-card">
                        <div className="section-head">
                          <p className="panel-label">Who it is for</p>
                          <h2>Built for couples and households who actually share responsibility.</h2>
                        </div>
                        <div className="onboarding-bullet-list maison-check-list">
                          {landingAudience.map((item) => <span key={item}>{item}</span>)}
                        </div>
                      </article>
                      <article className="maison-offer-card">
                        <div className="section-head">
                          <p className="panel-label">Founding launch pricing</p>
                          <h2>Paid from day one, with a short founding window.</h2>
                        </div>
                        <p className="hero-copy">Maison is launching as a paid product from day one.</p>
                        <div className="maison-price-lockup">
                          <span>First 7 days</span>
                          <strong>Lifetime access for $179</strong>
                        </div>
                        <div className="maison-price-grid">
                          <div className="maison-price-card">
                            <span>After the window</span>
                            <strong>$12/month</strong>
                          </div>
                          <div className="maison-price-card">
                            <span>Annual option</span>
                            <strong>$96/year</strong>
                          </div>
                        </div>
                        <p className="hero-copy">The founding offer is for early households helping shape the product, not a discount that stays open forever.</p>
                      </article>
                    </section>

                    <section className="maison-section">
                      <div className="section-head">
                        <p className="panel-label">FAQ preview</p>
                        <h2>What early households usually ask first.</h2>
                      </div>
                      <div className="maison-faq-grid">
                        {landingFaqs.map((faq) => (
                          <article key={faq.question} className="maison-faq-card">
                            <h3>{faq.question}</h3>
                            <p className="hero-copy">{faq.answer}</p>
                          </article>
                        ))}
                      </div>
                    </section>

                    <section className="maison-section maison-final-cta">
                      <div>
                        <p className="panel-label">Final CTA</p>
                        <h2>Bring your home into one calm system.</h2>
                        <p className="hero-copy">Join the founding launch and be one of the first households to use Maison as your shared home operating system.</p>
                      </div>
                      <div className="maison-hero-actions">
                        <a className="primary-button invite-link-button" href="#maison-waitlist">Join the founding launch</a>
                        <a className="secondary-button invite-link-button" href="#maison-auth">Sign in now</a>
                      </div>
                    </section>
                  </>
                ) : null}
              </>
            )}
          </div>

          <aside className="auth-landing-actions onboarding-actions maison-auth-rail" id="maison-auth">
            {!showDeletedAccountNotice ? <div className="maison-auth-card onboarding-section-block maison-waitlist-card" id="maison-waitlist">
              <div>
                <p className="panel-label">Founding launch</p>
                <h3>Request early access</h3>
                <p className="hero-copy">If you want in before the broader launch, drop your info here and tell us what home-admin friction you want Maison to make lighter.</p>
              </div>
              <form className="maison-waitlist-form" onSubmit={submitLaunchInterest}>
                <input className="invite-code-input no-caps-input" type="text" placeholder="Your name" value={launchInterestForm.name} onChange={(event) => setLaunchInterestForm((current) => ({ ...current, name: event.target.value }))} autoComplete="name" required />
                <input className="invite-code-input no-caps-input" type="email" placeholder="Email address" value={launchInterestForm.email} onChange={(event) => setLaunchInterestForm((current) => ({ ...current, email: event.target.value }))} autoComplete="email" required />
                <select className="invite-code-input no-caps-input maison-select-input" value={launchInterestForm.householdType} onChange={(event) => setLaunchInterestForm((current) => ({ ...current, householdType: event.target.value }))}>
                  <option value="Couple">Couple</option>
                  <option value="Household with kids">Household with kids</option>
                  <option value="Roommates">Roommates</option>
                  <option value="Solo homeowner">Solo homeowner</option>
                  <option value="Other">Other</option>
                </select>
                <textarea className="invite-code-input no-caps-input maison-textarea-input" rows="4" placeholder="What’s the biggest coordination or home-admin friction in your house right now?" value={launchInterestForm.friction} onChange={(event) => setLaunchInterestForm((current) => ({ ...current, friction: event.target.value }))} required />
                <button className="primary-button" type="submit" disabled={isLaunchInterestLoading}>{isLaunchInterestLoading ? 'Saving your request…' : 'Request founding access'}</button>
              </form>
              {launchInterestMessage ? <p className={`auth-help ${launchInterestTone}`}>{launchInterestMessage}</p> : null}
            </div> : null}

            <div className="maison-auth-card onboarding-section-block">
              <div>
                <p className="panel-label">Access Maison</p>
                <h3>{showDeletedAccountNotice ? 'Sign back in when you are ready' : 'Sign in or start with your invite'}</h3>
                <p className="hero-copy">{showDeletedAccountNotice ? 'Maison is back at a safe resting state. You can return with Google or email whenever you want.' : 'Choose Google or email below. If a partner already invited you, keep the invite path selected and Maison will take you to code entry right after sign-in.'}</p>
              </div>
              {!hasFirebaseConfig ? <p className="auth-help error">Maison auth is not configured in this live build yet, so sign-in and account creation cannot start until the Firebase build env is fixed.</p> : null}
              {authMessage ? <p className="auth-help error">{authMessage}</p> : null}
              {!authMessage && authError ? <p className="auth-help error">{authError}</p> : null}
              {showDeletedAccountNotice ? <div className="auth-landing-note onboarding-note-card goodbye-note"><strong>Signed out cleanly</strong><span>{deletedAccountSummary.email || 'This account'} has been removed, and Maison is now back at a safe resting state.</span></div> : null}
              <button className="primary-button" onClick={async () => {
                setInviteChoice(false)
                setAuthMessage('Redirecting you to Google sign-in…')
                setAuthError('')
                setAuthErrorCode('')
                const result = await signInWithGoogle()
                if (result?.error) {
                  setAuthMessage(result.error)
                  setAuthError(result.error)
                  setAuthErrorCode(result.rawCode || '')
                }
              }}>{showDeletedAccountNotice ? 'Sign in again with Google' : 'Continue with Google'}</button>
              <button className="secondary-button" onClick={() => setInviteChoice(true)}>{showDeletedAccountNotice ? 'Join with an invite code later' : 'I already have an invite code'}</button>
              {!showDeletedAccountNotice ? <div className="auth-landing-note onboarding-note-card maison-invite-note">
                <strong>Invite code flow</strong>
                <span>Select the invite option before you sign in, and Maison will take you directly to household join after authentication.</span>
              </div> : null}
              <div className="auth-divider"><span>or use email</span></div>
              <form className="auth-email-form onboarding-section-block" onSubmit={submitEmailAuth}>
                <div>
                  <p className="panel-label">Email and password</p>
                  <h3>{emailAuthMode === 'signup' ? 'Create your Maison account' : 'Sign in with email'}</h3>
                  <p className="hero-copy">{emailAuthMode === 'signup' ? 'Use email if you want a direct Maison login alongside Google.' : 'Use the email and password already tied to your Maison account.'}</p>
                </div>
                {emailAuthMode === 'signup' ? <input className="invite-code-input no-caps-input" type="text" placeholder="Your name" value={emailAuthForm.name} onChange={(event) => setEmailAuthForm((current) => ({ ...current, name: event.target.value }))} autoComplete="name" required /> : null}
                <input className="invite-code-input no-caps-input" type="email" placeholder="Email address" value={emailAuthForm.email} onChange={(event) => setEmailAuthForm((current) => ({ ...current, email: event.target.value }))} autoComplete="email" required />
                <input className="invite-code-input no-caps-input" type="password" placeholder="Password" value={emailAuthForm.password} onChange={(event) => setEmailAuthForm((current) => ({ ...current, password: event.target.value }))} autoComplete={emailAuthMode === 'signup' ? 'new-password' : 'current-password'} minLength={6} required />
                {emailAuthMode === 'signin' ? <p className="auth-help auth-inline-help">Forgot your password? Enter your email first, then tap the reset button.</p> : null}
                <div className="form-actions">
                  <button className="primary-button" type="submit" disabled={isEmailAuthLoading}>{isEmailAuthLoading ? (emailAuthMode === 'signup' ? 'Creating…' : 'Signing in…') : (emailAuthMode === 'signup' ? 'Create email account' : 'Sign in with email')}</button>
                  <button className="secondary-button" type="button" onClick={() => {
                    setEmailAuthMode((current) => current === 'signup' ? 'signin' : 'signup')
                    setAuthMessage('')
                    setAuthError('')
                    setAuthErrorCode('')
                    setEmailAuthForm((current) => ({ ...current, password: '' }))
                  }}>{emailAuthMode === 'signup' ? 'I already have an account' : 'Create an email account'}</button>
                  {emailAuthMode === 'signin' ? <button className="secondary-button" type="button" onClick={handlePasswordReset} disabled={isEmailAuthLoading}>Forgot password?</button> : null}
                </div>
              </form>
              {inAppBrowserWarning && !showDeletedAccountNotice ? <div className="auth-landing-note onboarding-note-card">
                <strong>Open in your main browser if Google loops</strong>
                <span>{inAppBrowserWarning}'s in-app browser can break Google sign-in handoff. If login bounces back here, open Maison in Safari or Chrome and try again there.</span>
              </div> : null}
              {!showDeletedAccountNotice ? <div className="auth-landing-note onboarding-note-card">
                <strong>Private household access</strong>
                <span>After sign-in, non-members can either create their own household or join one with a valid invite code from an owner.</span>
              </div> : null}
            </div>
          </aside>
        </section>
      </div>
    )
  }

  if (isResolvingSignedInState) {
    return (
      <div className="shell auth-shell">
        <NativeDiagnosticsPanel diagnostics={nativeDiagnostics} />
        <StatusBanner hasFirebaseConfig={hasFirebaseConfig} isRemoteLoaded={isRemoteLoaded} isRemoteLoading={isRemoteLoading} remoteError={remoteError} />
        <SignedInPill user={user} membership={membership} />
        <section className="hero-card auth-landing-card">
          <div>
            <p className="eyebrow">{maisonLabel}</p>
            <h1>Getting your household ready</h1>
            <p className="hero-copy">One second, I’m checking your household access and loading the latest home data.</p>
            <div className="house-loading-wrap" aria-label="Loading" role="status">
              <div className="house-puzzle-loading premium-house-loading" aria-hidden="true">
                <div className="puzzle-piece piece-roof-left"></div>
                <div className="puzzle-piece piece-roof-right"></div>
                <div className="puzzle-piece piece-wall-left"></div>
                <div className="puzzle-piece piece-wall-right"></div>
                <div className="puzzle-piece piece-bottom-left"></div>
                <div className="puzzle-piece piece-bottom-right"></div>
                <div className="house-outline"></div>
              </div>
              <span className="loading-pulse-label">Loading your home…</span>
            </div>
          </div>
        </section>
      </div>
    )
  }

  if (user && !membership && !inviteChoice) {
    return (
      <div className="shell auth-shell">
        <NativeDiagnosticsPanel diagnostics={nativeDiagnostics} />
        <StatusBanner hasFirebaseConfig={hasFirebaseConfig} isRemoteLoaded={isRemoteLoaded} isRemoteLoading={isRemoteLoading} remoteError={remoteError} />
        <SignedInPill user={user} membership={membership} />
        <section className="hero-card auth-landing-card onboarding-card">
          <div>
            <p className="eyebrow">{maisonLabel}</p>
            <h1>Start your household</h1>
            <p className="hero-copy">Create the household first, then Maison walks you straight into setup and partner invite handoff.</p>
            <div className="onboarding-bullet-list"><span>Create the household in one step</span><span>Finish setup right after, without losing momentum</span><span>Invite your partner as soon as the home is ready</span></div>
            {createHouseholdSuccess ? <p className="auth-help success">{createHouseholdSuccess}</p> : null}
            {createHouseholdError ? <p className="auth-help error">{createHouseholdError}</p> : null}
          </div>
          <form className="auth-landing-actions onboarding-actions" onSubmit={async (event) => {
            event.preventDefault()
            const created = await handleCreateHousehold({ name: householdNameInput })
            if (created) {
              setSetupForm((current) => ({ ...current, name: householdNameInput.trim() }))
            }
          }}>
            <input
              className="invite-code-input no-caps-input"
              placeholder="Household name (optional)"
              value={householdNameInput}
              onChange={(event) => setHouseholdNameInput(event.target.value)}
            />
            <div className="auth-landing-note onboarding-note-card">
              <strong>What happens next</strong>
              <span>Create the household first, then Maison immediately walks you into home setup and gives you an invite code for your partner.</span>
            </div>
            {isCreatingHousehold ? <div className="create-household-progress onboarding-note-card" role="status" aria-live="polite">
              <div className="house-puzzle-loading premium-house-loading" aria-hidden="true">
                <div className="puzzle-piece piece-roof-left"></div>
                <div className="puzzle-piece piece-roof-right"></div>
                <div className="puzzle-piece piece-wall-left"></div>
                <div className="puzzle-piece piece-wall-right"></div>
                <div className="puzzle-piece piece-bottom-left"></div>
                <div className="puzzle-piece piece-bottom-right"></div>
                <div className="house-outline"></div>
              </div>
              <div className="create-household-progress-copy">
                <strong className="create-household-progress-title">Creating your home<span className="loading-dots" aria-hidden="true"></span></strong>
                <span><span className="loading-word-cycle" aria-hidden="true"><span>Creating</span><span>Building</span><span>Preparing</span><span>Opening</span></span> the household shell and getting your setup questions ready.</span>
              </div>
            </div> : null}
            <button className="primary-button" type="submit" disabled={isCreatingHousehold}>{isCreatingHousehold ? <span className="button-loading-label">Creating home<span className="loading-dots" aria-hidden="true"></span></span> : 'Create household'}</button>
            <button className="secondary-button" type="button" disabled={isCreatingHousehold} onClick={() => setInviteChoice(true)}>{createHouseholdError === 'This household already exists. Use an invite code to join it instead.' ? 'Enter invite code' : 'I already have an invite code'}</button>
            <button className="secondary-button" type="button" disabled={isCreatingHousehold} onClick={() => signOutUser()}>Use a different account</button>
          </form>
        </section>
      </div>
    )
  }

  if (user && membership && membership.role === 'owner' && houseProfile.setupCompleted === false) {
    return (
      <div className="shell auth-shell">
        <NativeDiagnosticsPanel diagnostics={nativeDiagnostics} />
        <StatusBanner hasFirebaseConfig={hasFirebaseConfig} isRemoteLoaded={isRemoteLoaded} isRemoteLoading={isRemoteLoading} remoteError={remoteError} />
        <SignedInPill user={user} membership={membership} />
        <section className="hero-card auth-landing-card onboarding-card">
          <div>
            <p className="eyebrow">{maisonLabel}</p>
            <h1>Set up your home</h1>
            <p className="hero-copy">Shape Maison around the real home, so the planner starts feeling useful immediately.</p>
            <div className="onboarding-bullet-list"><span>Home profile first</span><span>Starter planner already waiting behind it</span><span>Invite your partner right after setup</span></div>
            {createHouseholdSuccess ? <p className="auth-help success">{createHouseholdSuccess}</p> : null}
            {setupSuccess ? <p className="auth-help success">{setupSuccess}</p> : null}
            {setupError ? <p className="auth-help error">{setupError}</p> : null}
          </div>
          <form className="auth-landing-actions onboarding-actions setup-form-grid" onSubmit={async (event) => {
            event.preventDefault()
            await handleCompleteSetup({
              name: setupForm.name,
              homeType: setupForm.homeType,
              sizeSqFt: setupForm.sizeSqFt,
              levels: setupForm.levels,
              bedrooms: setupForm.bedrooms,
              bathrooms: setupForm.bathrooms,
              hvac: {
                system: setupForm.hvacSystem,
                heads: setupForm.hvacHeads,
              },
            })
          }}>
            <div className="onboarding-section-block">
              <div>
                <p className="panel-label">Step 1</p>
                <h3>Home basics</h3>
                <p className="hero-copy">Give Maison the shape of the home so the planner feels like yours from day one.</p>
              </div>
              <input className="invite-code-input no-caps-input" placeholder="Home name" value={setupForm.name} onChange={(event) => setSetupForm((current) => ({ ...current, name: event.target.value }))} />
              <input className="invite-code-input no-caps-input" placeholder="Home type (apartment, condo, house)" value={setupForm.homeType} onChange={(event) => setSetupForm((current) => ({ ...current, homeType: event.target.value }))} />
              <input className="invite-code-input no-caps-input" inputMode="numeric" placeholder="Square feet" value={setupForm.sizeSqFt} onChange={(event) => setSetupForm((current) => ({ ...current, sizeSqFt: event.target.value.replace(/[^0-9]/g, '') }))} />
              <div className="setup-form-split"><input className="invite-code-input no-caps-input" inputMode="numeric" placeholder="Levels" value={setupForm.levels} onChange={(event) => setSetupForm((current) => ({ ...current, levels: event.target.value.replace(/[^0-9]/g, '') }))} /><input className="invite-code-input no-caps-input" inputMode="numeric" placeholder="Bedrooms" value={setupForm.bedrooms} onChange={(event) => setSetupForm((current) => ({ ...current, bedrooms: event.target.value.replace(/[^0-9]/g, '') }))} /></div>
              <input className="invite-code-input no-caps-input" inputMode="decimal" placeholder="Bathrooms" value={setupForm.bathrooms} onChange={(event) => setSetupForm((current) => ({ ...current, bathrooms: event.target.value.replace(/[^0-9.]/g, '') }))} />
            </div>
            <div className="onboarding-section-block">
              <div>
                <p className="panel-label">Step 2</p>
                <h3>Systems and routine fit</h3>
                <p className="hero-copy">Optional, but worth it. This helps Maison fit the planner to the systems you actually live with.</p>
              </div>
              <input className="invite-code-input no-caps-input" placeholder="HVAC system" value={setupForm.hvacSystem} onChange={(event) => setSetupForm((current) => ({ ...current, hvacSystem: event.target.value }))} />
              <input className="invite-code-input no-caps-input" inputMode="numeric" placeholder="HVAC heads / zones (optional)" value={setupForm.hvacHeads} onChange={(event) => setSetupForm((current) => ({ ...current, hvacHeads: event.target.value.replace(/[^0-9]/g, '') }))} />
            </div>
            <div className="auth-landing-note onboarding-note-card onboarding-preview-card">
              <strong>{setupForm.name?.trim() || householdNameInput.trim() || 'Your home'}</strong>
              <span>{setupPreview.summary}</span>
              <span>{setupPreview.hvacSummary}</span>
            </div>
            <div className="auth-landing-note onboarding-note-card">
              <strong>What happens after setup</strong>
              <span>Maison saves the home, keeps your starter planner in place, and then gives you the invite code so your partner can join cleanly.</span>
            </div>
            <button className="primary-button" type="submit" disabled={isCompletingSetup}>{isCompletingSetup ? 'Saving…' : 'Save home setup'}</button>
          </form>
        </section>
      </div>
    )
  }

  if (user && !membership && inviteChoice) {
    return (
      <div className="shell auth-shell">
        <NativeDiagnosticsPanel diagnostics={nativeDiagnostics} />
        <StatusBanner hasFirebaseConfig={hasFirebaseConfig} isRemoteLoaded={isRemoteLoaded} isRemoteLoading={isRemoteLoading} remoteError={remoteError} />
        <SignedInPill user={user} membership={membership} />
        <section className="hero-card auth-landing-card onboarding-card">
          <div>
            <p className="eyebrow">{maisonLabel}</p>
            <h1>Join your household</h1>
            <p className="hero-copy">Use the code your partner shared, and Maison will drop you straight into the shared home.</p>
            <div className="onboarding-bullet-list"><span>Invite codes are case-insensitive</span><span>Switch accounts anytime if you picked the wrong login</span><span>You’ll land directly inside the household</span></div>
            {joinSuccess ? <p className="auth-help success">{joinSuccess}</p> : null}
            {joinError ? <p className="auth-help error">{joinError}</p> : null}
          </div>
          <form className="auth-landing-actions onboarding-actions" onSubmit={async (event) => {
            event.preventDefault()
            const joined = await handleJoinHousehold(inviteCodeInput)
            if (joined) setInviteCodeInput('')
          }}>
            <input
              className="invite-code-input"
              placeholder="Enter invite code"
              value={inviteCodeInput}
              onChange={(event) => setInviteCodeInput(event.target.value.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck="false"
            />
            <button className="primary-button" type="submit" disabled={isJoiningHousehold}>{isJoiningHousehold ? 'Joining…' : 'Join household'}</button>
            <button className="secondary-button" type="button" onClick={() => setInviteChoice(false)}>Create household instead</button>
            <button className="secondary-button" type="button" onClick={() => signOutUser()}>Use a different account</button>
          </form>
        </section>
      </div>
    )
  }

  return (
    <div className="shell">
      <div className="top-bar-row">
        <SignedInPill user={user} membership={membership} />
        {activeTab === 'planner' ? <button className="menu-button" type="button" onClick={() => setFiltersOpen((open) => !open)} aria-label={filtersOpen ? 'Close filters' : 'Open filters'} aria-expanded={filtersOpen} aria-controls="planner-filter-drawer">☰</button> : null}
      </div>
      <StatusBanner hasFirebaseConfig={hasFirebaseConfig} isRemoteLoaded={isRemoteLoaded} isRemoteLoading={isRemoteLoading} remoteError={remoteError} maisonLabel={maisonLabel} />
      <NativeDiagnosticsPanel diagnostics={nativeDiagnostics} />
      {showRemoteWarning ? <section className="panel remote-warning-panel"><p className="panel-label">Live sync issue</p><h2>Some household data may be stale</h2><p className="hero-copy">{maisonLabel} had trouble reaching the live household data just now. You can keep browsing, but if something looks off, refresh or sign out and back in before making decisions.</p></section> : null}
      {deleteAccountError ? <section className="panel remote-warning-panel"><p className="panel-label">Account deletion</p><h2>Could not delete account</h2><p className="hero-copy">{deleteAccountError}</p></section> : null}
      {deleteAccountSuccess ? <section className="panel remote-warning-panel"><p className="panel-label">Account deletion</p><h2>Account removed</h2><p className="hero-copy">{deleteAccountSuccess}</p></section> : null}
      <nav className="top-tabs" aria-label="Primary sections">
        <div className="top-tabs-left">
          <button className={`top-tab ${activeTab === 'planner' ? 'active' : ''}`} type="button" aria-pressed={activeTab === 'planner'} onClick={() => { setActiveTab('planner'); setFiltersOpen(false) }}>Planner</button>
          <button className={`top-tab ${activeTab === 'calendar' ? 'active' : ''}`} type="button" aria-pressed={activeTab === 'calendar'} onClick={() => { setActiveTab('calendar'); setFiltersOpen(false); setSelectedTask(null) }}>Calendar</button>
          <button className={`top-tab ${activeTab === 'shopping' ? 'active' : ''}`} type="button" aria-pressed={activeTab === 'shopping'} onClick={() => { setActiveTab('shopping'); setFiltersOpen(false); setSelectedTask(null) }}>Shopping</button>
        </div>
        <div className="top-tabs-right">
          {membership?.role === 'owner'
            ? <button className={`top-tab ${activeTab === 'admin' ? 'active' : ''}`} type="button" aria-pressed={activeTab === 'admin'} onClick={() => { setActiveTab('admin'); setFiltersOpen(false); setSelectedTask(null) }}>Admin</button>
            : <button className="top-tab" type="button" onClick={() => signOutUser()}>Sign out</button>}
        </div>
      </nav>

      {activeTab === 'planner' ? (
        <>
          {filtersOpen ? <button className="drawer-backdrop" type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters" /> : null}
          <aside id="planner-filter-drawer" className={`filter-drawer ${filtersOpen ? 'open' : ''}`} role="dialog" aria-modal="true" aria-labelledby="planner-filter-title" aria-hidden={!filtersOpen}>
            <div className="drawer-head">
              <div>
                <p className="panel-label">Planner filters</p>
                <h2 id="planner-filter-title">Refine the view</h2>
              </div>
              <button className="secondary-button" type="button" onClick={() => setFiltersOpen(false)}>Close</button>
            </div>
            <div className="drawer-section">
              <p className="panel-label">Filter by category</p>
              <div className="chip-row">
                {categories.map((category) => (
                  <button key={category} className={`chip ${selectedCategory === category ? 'active' : ''}`} type="button" aria-pressed={selectedCategory === category} onClick={() => setSelectedCategory(category)}>{category}</button>
                ))}
              </div>
            </div>
            <div className="drawer-section">
              <p className="panel-label">Filter by status</p>
              <div className="chip-row">
                {['All', 'overdue', 'remind', 'upcoming'].map((status) => (
                  <button key={status} className={`chip ${selectedStatus === status ? 'active' : ''}`} type="button" aria-pressed={selectedStatus === status} onClick={() => setSelectedStatus(status)}>{status}</button>
                ))}
              </div>
            </div>
          </aside>
        </>
      ) : null}

      {selectedTask ? <button className="modal-backdrop" type="button" onClick={closeTaskModal} aria-label="Close task details" /> : null}
      {selectedTask ? (
        <section className="task-modal" role="dialog" aria-modal="true" aria-labelledby="task-modal-title">
          <div className="task-modal-head">
            <div>
              <p className="task-meta">{selectedTask.area} · {selectedTask.category}</p>
              <h2 id="task-modal-title">{selectedTask.title}</h2>
              <p className="timing-copy">{selectedTask.status === 'overdue' ? `Overdue by ${Math.abs(selectedTask.daysUntilDue)} day${Math.abs(selectedTask.daysUntilDue) === 1 ? '' : 's'}` : selectedTask.daysUntilDue === 0 ? 'Due today' : `Due in ${selectedTask.daysUntilDue} day${selectedTask.daysUntilDue === 1 ? '' : 's'}`}</p>
            </div>
            <button className="secondary-button" type="button" onClick={closeTaskModal}>Close</button>
          </div>
          {taskEditorOpen && editingTaskId === selectedTask.id ? (
            <form className="task-form-grid modal-task-form" onSubmit={submitTaskForm}>
              <label><span>Title</span><input value={taskForm.title} onChange={(e) => setTaskForm((current) => ({ ...current, title: e.target.value }))} required /></label>
              <label><span>Area</span><input value={taskForm.area} onChange={(e) => setTaskForm((current) => ({ ...current, area: e.target.value }))} required /></label>
              <label><span>Category</span><input value={taskForm.category} onChange={(e) => setTaskForm((current) => ({ ...current, category: e.target.value }))} required /></label>
              <label><span>Frequency</span><input value={taskForm.frequency} onChange={(e) => setTaskForm((current) => ({ ...current, frequency: e.target.value }))} required /></label>
              <label><span>Room / zone</span><input value={taskForm.room} onChange={(e) => setTaskForm((current) => ({ ...current, room: e.target.value }))} /></label>
              <label><span>System</span><input value={taskForm.system} onChange={(e) => setTaskForm((current) => ({ ...current, system: e.target.value }))} /></label>
              <label><span>Asset</span><input value={taskForm.assetName} onChange={(e) => setTaskForm((current) => ({ ...current, assetName: e.target.value }))} /></label>
              <label><span>Vendor</span><input value={taskForm.vendor} onChange={(e) => setTaskForm((current) => ({ ...current, vendor: e.target.value }))} /></label>
              <label><span>Supply note</span><input value={taskForm.supplyNote} onChange={(e) => setTaskForm((current) => ({ ...current, supplyNote: e.target.value }))} /></label>
              <label><span>Cadence days</span><input type="number" min="1" value={taskForm.cadenceDays} onChange={(e) => setTaskForm((current) => ({ ...current, cadenceDays: Number(e.target.value) }))} required /></label>
              <label><span>Reminder lead days</span><input type="number" min="1" value={taskForm.reminderLeadDays} onChange={(e) => setTaskForm((current) => ({ ...current, reminderLeadDays: Number(e.target.value), major: Number(e.target.value) >= 30 || current.major }))} required /></label>
              <label><span>Effort</span><input value={taskForm.effort} onChange={(e) => setTaskForm((current) => ({ ...current, effort: e.target.value }))} /></label>
              <label><span>Season</span><input value={taskForm.season} onChange={(e) => setTaskForm((current) => ({ ...current, season: e.target.value }))} /></label>
              <label><span>Priority</span><input value={taskForm.priority} onChange={(e) => setTaskForm((current) => ({ ...current, priority: e.target.value }))} /></label>
              <label><span>Last done</span><input type="date" value={taskForm.lastDone} onChange={(e) => setTaskForm((current) => ({ ...current, lastDone: e.target.value }))} required /></label>
              <label className="checkbox-field"><input type="checkbox" checked={taskForm.major} onChange={(e) => setTaskForm((current) => ({ ...current, major: e.target.checked }))} /><span>Large maintenance item</span></label>
              <label className="full-span"><span>Notes</span><textarea rows="3" value={taskForm.notes} onChange={(e) => setTaskForm((current) => ({ ...current, notes: e.target.value }))} /></label>
              <div className="form-actions full-span"><button className="primary-button" type="submit">Save changes</button><button className="secondary-button" type="button" onClick={resetTaskForm}>Cancel edit</button></div>
            </form>
          ) : (
            <>
              <div className="task-grid">
                <TaskDatum label="Frequency" value={selectedTask.frequency} />
                <TaskDatum label="Time" value={selectedTask.effort} />
                <TaskDatum label="Season" value={selectedTask.season} />
                <TaskDatum label="Priority" value={selectedTask.priority} />
                <TaskDatum label="Room / zone" value={selectedTask.room || '—'} />
                <TaskDatum label="System" value={selectedTask.system || '—'} />
                <TaskDatum label="Asset" value={selectedTask.assetName || '—'} />
                <TaskDatum label="Vendor" value={selectedTask.vendor || '—'} />
                <TaskDatum label="Last done" value={formatDate(addDays(selectedTask.lastDone, 0))} />
                <TaskDatum label="Next due" value={formatDate(selectedTask.nextDue)} />
                <TaskDatum label="Reminder starts" value={formatDate(selectedTask.reminderDate)} />
                <TaskDatum label="Days to due" value={selectedTask.daysUntilDue.toString()} />
              </div>
              {selectedTask.claimedBy ? <p className="claim-copy">Claimed by {selectedTask.claimedBy}</p> : <p className="claim-copy">Unclaimed</p>}
              <p className="task-notes">{selectedTask.notes}</p>
              {selectedTask.supplyNote ? <p className="task-notes"><strong>Supplies:</strong> {selectedTask.supplyNote}</p> : null}
              <div className="task-actions">
                {resolvedActorName ? <button className="primary-button" onClick={() => claimFromModal(selectedTask.id, resolvedActorName)}>Claim as me</button> : null}
                {visibleClaimMembers.map((member) => <button key={member.id} className="secondary-button" onClick={() => claimFromModal(selectedTask.id, member.name)}>Claim for {member.name}</button>)}
                <button className="secondary-button" onClick={() => claimFromModal(selectedTask.id, null)}>Clear claim</button>
                <button className="primary-button" onClick={() => completeFromModal(selectedTask.id, selectedTask.claimedBy || resolvedActorName || 'Household member')}>Mark done today</button>
                <button className="secondary-button" onClick={() => startEditTask(selectedTask)}>Edit</button>
                <button className="danger-button" onClick={() => deleteFromModal(selectedTask.id)}>Delete</button>
                {selectedTask.major ? <span className="major-flag">Large maintenance</span> : null}
              </div>
            </>
          )}
        </section>
      ) : null}

      {showInvitePanel && freshInviteCode && membership?.role === 'owner' ? <section className="panel remote-warning-panel"><div className="section-head"><div><p className="panel-label">Invite your partner</p><h2>Your household is ready</h2><p className="hero-copy">Share this invite code with your partner so they can join the household, then continue into the planner once you’re ready.</p></div><div className="planner-actions"><button className="secondary-button" onClick={() => navigator?.clipboard?.writeText(freshInviteCode)}>Copy code</button><a className="secondary-button invite-link-button" href={emailInviteHref}>Email invite</a><a className="secondary-button invite-link-button" href={textInviteHref}>Text invite</a><button className="secondary-button" onClick={() => setShowInvitePanel(false)}>Continue to app</button></div></div><div className="invite-code-panel"><p className="hero-copy"><strong>{freshInviteCode}</strong></p><div className="onboarding-bullet-list compact"><span>Partner signs in or creates an account</span><span>They tap “I already have an invite code”</span><span>They enter this code and land in your shared home</span></div></div></section> : null}
      {shouldShowJoinSuccessPanel ? <section className="panel remote-warning-panel"><div className="section-head"><div><p className="panel-label">You’re in</p><h2>Joined successfully</h2><p className="hero-copy">Maison connected you to the household and dropped you into the shared planner. You can start using the home right away.</p></div><div className="planner-actions"><button className="secondary-button" onClick={() => setActiveTab('planner')}>Open planner</button><button className="secondary-button" onClick={() => setActiveTab('shopping')}>Open shopping</button></div></div><div className="onboarding-bullet-list compact"><span>You’re inside the shared home now</span><span>Planner, shopping, and calendar are already connected</span><span>If something looks off, refresh once and it should settle</span></div></section> : null}
      <header className={`hero-card ${activeTab === 'planner' ? 'planner-hero-card' : ''}`}>
        <div><p className="eyebrow">{maisonLabel}</p><h1>{activeTab === 'shopping' ? `${maisonLabel} Restock` : activeTab === 'calendar' ? `${maisonLabel} Calendar` : `${maisonLabel} Reset`}</h1><p className="hero-copy">Mobile-first maintenance and shopping planning for a stylish household routine, tuned to your home profile and systems.</p></div>
        {activeTab !== 'planner' ? <div className="hero-note"><strong>{activeTab === 'shopping' ? `${openShoppingItems.length} open item${openShoppingItems.length === 1 ? '' : 's'} across ${lists.length} list${lists.length === 1 ? '' : 's'}` : `${calendarSections.length} day${calendarSections.length === 1 ? '' : 's'} with scheduled care in the next month`}</strong><span>{activeTab === 'shopping' ? `${checkedShoppingItems.length} checked off · ${shoppingCompletion}% complete on this list` : houseProfile.lastReminderRunAt ? `Last reminder run: ${new Date(houseProfile.lastReminderRunAt).toLocaleString()}${houseProfile.lastReminderChannel ? ` via ${houseProfile.lastReminderChannel}` : ''}` : 'Last reminder run: not recorded yet'}</span></div> : null}
      </header>

      {activeTab === 'planner' ? (
        <section className="stats-grid">
          <StatCard label="Overdue now" value={summary.overdue} tone="rose" active={selectedStatus === 'overdue'} onClick={() => applyStatusCardFilter('overdue')} />
          <StatCard label="In reminder window" value={summary.remind} tone="gold" active={selectedStatus === 'remind'} onClick={() => applyStatusCardFilter('remind')} />
          <StatCard label="Large maintenance" value={summary.major} tone="violet" active={selectedCategory === 'Systems'} onClick={() => applyStatusCardFilter('major')} />
          <StatCard label="Weekly routines" value={summary.weekly} tone="teal" active={selectedStatus === 'upcoming'} onClick={() => applyStatusCardFilter('weekly')} />
        </section>
      ) : null}

      {activeTab === 'planner' ? (
        <>
          <CollapsiblePanel
            className="planner-overview-panel"
            headClassName="planner-overview-head"
            isOpen={plannerPanelsOpen.overview}
            onToggle={() => togglePlannerPanel('overview')}
            header={
              <div>
                <p className="panel-label">Planner overview</p>
                <h2>{plannerHeadline}</h2>
                <p className="hero-copy">{plannerSubcopy}</p>
              </div>
            }
          >
            <div className="planner-actions">
              {statusCardFilterActive ? <button className="secondary-button" type="button" onClick={() => { setSelectedCategory('All'); setSelectedStatus('All') }}>Clear filters</button> : null}
              <button className="secondary-button" type="button" onClick={() => setTaskEditorOpen((open) => !open)}>{taskEditorOpen ? 'Hide task editor' : 'Add or edit tasks'}</button>
            </div>
            {plannerMessage ? <p className={`auth-help ${plannerMessageClass}`}>{plannerMessage}</p> : null}
            {statusCardFilterActive ? <div className="active-filter-row"><span className="count-pill">Category: {selectedCategory}</span><span className="count-pill">Status: {selectedStatus}</span></div> : null}
            {statusCardFilterActive ? (filteredTasks.length ? <div className="compact-task-list">{filteredTasks.map((task) => (<button key={task.id} className="compact-task-card" onClick={() => openTaskModal(task)}><span className="compact-task-title">{task.title}</span><span className={`status-pill ${task.status}`}>{task.status}</span></button>))}</div> : <p className="empty-copy">Nothing matches those filters right now. Clear them to get the full maintenance plan back.</p>) : null}
          </CollapsiblePanel>

          <section className="spotlight-grid">
            <CollapsiblePanel
              className="spotlight-panel overdue-panel"
              isOpen={plannerPanelsOpen.overdue}
              onToggle={() => togglePlannerPanel('overdue')}
              header={<div><p className="panel-label">Needs attention first</p><h2>{overdueTasks.length ? 'Overdue tasks' : 'Nothing overdue right now'}</h2></div>}
            >
              <div className="spotlight-list">{overdueTasks.length ? overdueTasks.map((task) => (<button key={task.id} className="spotlight-item" onClick={() => openTaskModal(task)}><strong>{task.title}</strong><span>{task.area} · overdue by {Math.abs(task.daysUntilDue)} day{Math.abs(task.daysUntilDue) === 1 ? '' : 's'}</span></button>)) : <p className="empty-copy">The house is in decent shape here, nothing has slipped past due.</p>}</div>
            </CollapsiblePanel>
            <CollapsiblePanel
              className="spotlight-panel due-soon-panel"
              isOpen={plannerPanelsOpen.dueSoon}
              onToggle={() => togglePlannerPanel('dueSoon')}
              header={<div><p className="panel-label">Coming up next</p><h2>Due within 2 weeks</h2></div>}
            >
              <div className="spotlight-list">{dueSoonTasks.length ? dueSoonTasks.map((task) => (<button key={task.id} className="spotlight-item" onClick={() => openTaskModal(task)}><strong>{task.title}</strong><span>{task.daysUntilDue === 0 ? 'Due today' : `Due in ${task.daysUntilDue} days`} · {task.area}</span></button>)) : <p className="empty-copy">No near-term crunch right now. The next two weeks are relatively light.</p>}</div>
            </CollapsiblePanel>
          </section>

          <CollapsiblePanel
            className="completion-panel"
            isOpen={plannerPanelsOpen.completed}
            onToggle={() => togglePlannerPanel('completed')}
            header={<div><p className="panel-label">Completed bucket</p><h2>Recently completed tasks</h2></div>}
          >
            <div className="completion-list">
              {recentCompletions.length ? recentCompletions.map((item) => (
                <article key={item.id} className="completion-item">
                  <strong>{item.title}</strong>
                  <span>{item.area} · {item.category}</span>
                  <span>Completed {new Date(item.completedAt).toLocaleString()} by {item.completedBy}</span>
                </article>
              )) : <p className="empty-copy">Nothing has been completed yet. Once tasks are marked done, they’ll stay visible here with who completed them.</p>}
            </div>
          </CollapsiblePanel>

          <section className="panel planner-reminder-panel">
            <p className="panel-label">Reminder windows</p>
            <h2>{reminderRules.majorLeadDays} days for large maintenance · {reminderRules.standardLeadDays} days for everything else</h2>
            <p className="hero-copy">{houseProfile.lastReminderRunAt ? `Last reminder run: ${new Date(houseProfile.lastReminderRunAt).toLocaleString()}${houseProfile.lastReminderChannel ? ` via ${houseProfile.lastReminderChannel}` : ''}` : 'Last reminder run: not recorded yet'}</p>
          </section>

          <CollapsiblePanel
            className="task-form-panel"
            isOpen={plannerPanelsOpen.editor}
            onToggle={() => togglePlannerPanel('editor')}
            header={<div><p className="panel-label">Maintenance task editor</p><h2>{editingTaskId ? 'Edit task' : 'Add new maintenance task'}</h2></div>}
          >
            <button className="editor-toggle" type="button" onClick={() => setTaskEditorOpen((open) => !open)}><span>{taskEditorOpen ? 'Hide task form' : 'Open task form'}</span><span>{taskEditorOpen ? 'Hide' : 'Open'}</span></button>
            {taskEditorOpen ? <form className="task-form-grid" onSubmit={submitTaskForm}><label><span>Title</span><input value={taskForm.title} onChange={(e) => setTaskForm((current) => ({ ...current, title: e.target.value }))} required /></label><label><span>Area</span><input value={taskForm.area} onChange={(e) => setTaskForm((current) => ({ ...current, area: e.target.value }))} required /></label><label><span>Category</span><input value={taskForm.category} onChange={(e) => setTaskForm((current) => ({ ...current, category: e.target.value }))} required /></label><label><span>Frequency</span><input value={taskForm.frequency} onChange={(e) => setTaskForm((current) => ({ ...current, frequency: e.target.value }))} required /></label><label><span>Cadence days</span><input type="number" min="1" value={taskForm.cadenceDays} onChange={(e) => setTaskForm((current) => ({ ...current, cadenceDays: Number(e.target.value) }))} required /></label><label><span>Reminder lead days</span><input type="number" min="1" value={taskForm.reminderLeadDays} onChange={(e) => setTaskForm((current) => ({ ...current, reminderLeadDays: Number(e.target.value), major: Number(e.target.value) >= 30 || current.major }))} required /></label><label><span>Effort</span><input value={taskForm.effort} onChange={(e) => setTaskForm((current) => ({ ...current, effort: e.target.value }))} /></label><label><span>Season</span><input value={taskForm.season} onChange={(e) => setTaskForm((current) => ({ ...current, season: e.target.value }))} /></label><label><span>Priority</span><input value={taskForm.priority} onChange={(e) => setTaskForm((current) => ({ ...current, priority: e.target.value }))} /></label><label><span>Last done</span><input type="date" value={taskForm.lastDone} onChange={(e) => setTaskForm((current) => ({ ...current, lastDone: e.target.value }))} required /></label><label className="checkbox-field"><input type="checkbox" checked={taskForm.major} onChange={(e) => setTaskForm((current) => ({ ...current, major: e.target.checked }))} /><span>Large maintenance item</span></label><label className="full-span"><span>Notes</span><textarea rows="3" value={taskForm.notes} onChange={(e) => setTaskForm((current) => ({ ...current, notes: e.target.value }))} /></label><div className="form-actions full-span"><button className="primary-button" type="submit">{editingTaskId ? 'Save changes' : 'Add task'}</button><button className="secondary-button" type="button" onClick={resetTaskForm}>{editingTaskId ? 'Cancel edit' : 'Close'}</button></div></form> : <p className="empty-copy">Open the task form whenever you want to add a new maintenance item or update an existing one.</p>}
          </CollapsiblePanel>

          {!statusCardFilterActive ? <CollapsiblePanel className="planner-schedule-panel" isOpen={plannerPanelsOpen.schedule} onToggle={() => togglePlannerPanel('schedule')} header={<div><p className="panel-label">Maintenance schedule</p><h2>{filteredTasks.length} tasks in view</h2></div>}><div className="compact-task-list">{filteredTasks.map((task) => (<button key={task.id} className="compact-task-card" onClick={() => openTaskModal(task)}><span className="compact-task-title">{task.title}</span><span className={`status-pill ${task.status}`}>{task.status}</span></button>))}</div></CollapsiblePanel> : null}
        </>
      ) : activeTab === 'calendar' ? (
        <>
          <section className="panel calendar-summary-panel">
            <div className="section-head calendar-summary-head">
              <div>
                <p className="panel-label">Calendar view</p>
                <h2>Next 30 days of home care</h2>
                <p className="hero-copy">A mobile-friendly agenda of what’s due and when, with overdue tasks still visible so nothing quietly vanishes after a missed date.</p>
              </div>
              <div className="calendar-summary-stats">
                <div className="ops-stat"><span>Days scheduled</span><strong>{calendarSections.length}</strong></div>
                <div className="ops-stat"><span>Tasks due</span><strong>{enrichedTasks.filter((task) => task.daysUntilDue >= -7 && task.daysUntilDue <= 30).length}</strong></div>
                <div className="ops-stat"><span>Overdue still visible</span><strong>{summary.overdue}</strong></div>
              </div>
            </div>
          </section>

          <section className="calendar-agenda">
            {showRemoteWarning ? <section className="panel"><p className="empty-copy">This calendar may be showing older household data until live sync recovers.</p></section> : null}
            {calendarSections.length ? calendarSections.map((section) => (
              <article key={section.key} className="panel calendar-day-card">
                <div className="calendar-day-head">
                  <div>
                    <p className="panel-label">{section.date.toLocaleDateString(undefined, { weekday: 'long' })}</p>
                    <h2>{formatDate(section.date)}</h2>
                  </div>
                  <span className="count-pill">{section.tasks.length} task{section.tasks.length === 1 ? '' : 's'}</span>
                </div>
                <div className="calendar-task-list">
                  {section.tasks.map((task) => (
                    <button key={task.id} className="calendar-task-item" onClick={() => openTaskModal(task)}>
                      <div>
                        <strong>{task.title}</strong>
                        <span>{task.area} · {task.category}</span>
                      </div>
                      <div className="calendar-task-meta">
                        <span className={`status-pill ${task.status}`}>{task.status}</span>
                        <span className="calendar-task-days">{task.daysUntilDue < 0 ? `${Math.abs(task.daysUntilDue)} day${Math.abs(task.daysUntilDue) === 1 ? '' : 's'} late` : task.daysUntilDue === 0 ? 'Due today' : `In ${task.daysUntilDue} day${task.daysUntilDue === 1 ? '' : 's'}`}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </article>
            )) : <section className="panel"><p className="empty-copy">No tasks are due in the next 30 days.</p></section>}
          </section>
        </>
      ) : activeTab === 'admin' ? (
        <>
          <section className="panel auth-panel">
            <div>
              <p className="panel-label">Household access</p>
              <h2>Admin controls</h2>
              <p className="hero-copy">Current member: {user ? (user.displayName || user.email) : authLoading ? 'Checking sign-in…' : 'Not signed in yet'}</p>
              <p className="hero-copy">Role: {membership?.role || 'guest'} · Household members: {householdMembers.map((member) => `${member.name} (${member.role})`).join(' · ')}</p>
              <p className="hero-copy">Invite code: {currentInviteCode ? (isInviteCodeVisible ? currentInviteCode : 'Hidden for now') : 'Not generated yet'}</p>
              <p className="hero-copy">{currentInviteCode ? (isInviteCodeVisible ? 'Share this code with a household member after they sign in, then they can join from the invite screen.' : 'The invite code is hidden right now. Reveal it whenever you need to invite someone.') : 'Generate or refresh an invite code whenever you want someone else to join.'}</p>
              {settingsMessage ? <p className={`auth-help ${settingsMessageClass}`}>{settingsMessage}</p> : null}
              <p className="hero-copy">Signed in as: {user?.email || 'unknown'} {membership?.role ? `· role: ${membership.role}` : ''}</p>
            </div>
            <div className="auth-actions">
              {membership?.role === 'owner' && currentInviteCode && isInviteCodeVisible ? <button className="secondary-button" onClick={() => navigator?.clipboard?.writeText(currentInviteCode)}>Copy invite code</button> : null}
              {membership?.role === 'owner' && currentInviteCode ? <button className="secondary-button" onClick={() => setIsInviteCodeVisible((current) => !current)}>{isInviteCodeVisible ? 'Hide invite code' : 'Show invite code'}</button> : null}
              {membership?.role === 'owner' ? <button className="secondary-button" onClick={() => refreshInviteCode()}>Refresh invite code</button> : null}
              <button className="secondary-button" onClick={() => signOutUser()}>Sign out</button>
            </div>
          </section>

          {membership?.role === 'owner' ? <section className="panel"><div className="section-head"><div><p className="panel-label">Owner controls</p><h2>Household admin</h2>{settingsMessage ? <p className={`auth-help ${settingsMessageClass}`}>{settingsMessage}</p> : null}</div></div><div className="completion-list">{householdMembers.length ? householdMembers.map((member) => <article key={member.id} className="completion-item"><strong>{member.name}</strong><span>{member.email || 'No email on file'} · {member.role}</span>{member.role !== 'owner' ? <div className="form-actions"><button className="secondary-button" onClick={() => handlePromoteMember(member.id)}>Promote to owner</button></div> : null}</article>) : <p className="empty-copy">No household members are listed yet.</p>}</div></section> : <section className="panel"><p className="empty-copy">Only owners can manage household roles and invite codes.</p></section>}

          <section className="panel offboarding-panel">
            <div className="section-head">
              <div>
                <p className="panel-label">Offboarding</p>
                <h2>Leave Maison cleanly</h2>
                <p className="hero-copy">This flow removes your account, signs you out everywhere on this device, and makes the outcome explicit before anything destructive happens.</p>
                {deleteAccountError ? <p className="auth-help error">{deleteAccountError}</p> : null}
                {deleteAccountSuccess ? <p className="auth-help success">{deleteAccountSuccess}</p> : null}
              </div>
            </div>
            <div className="offboarding-impact-grid">
              <article className="offboarding-impact-card">
                <span>What happens</span>
                <strong>{deleteAccountImpactLabel}</strong>
              </article>
              <article className="offboarding-impact-card">
                <span>Household result</span>
                <strong>{membership?.role === 'owner' && deletingLastMember ? 'Maison deletes the household because no members remain.' : membership?.role === 'owner' && fallbackSuccessorOwner ? `${fallbackSuccessorOwner.name || fallbackSuccessorOwner.email || 'Another member'} becomes the owner.` : 'The household stays active for everyone else.'}</strong>
              </article>
              <article className="offboarding-impact-card">
                <span>Next time you open Maison</span>
                <strong>{isNativeShell ? 'You land on a clean signed-out state in the app.' : 'You land on a web goodbye page instead of a blank screen.'}</strong>
              </article>
            </div>
            <div className="onboarding-bullet-list maison-check-list compact">
              <span>{membership?.role === 'owner' && deletingLastMember ? 'This removes shared tasks, shopping lists, reminders, and invite access. It cannot be undone.' : 'Shared household data stays available to the remaining members after you leave.'}</span>
              <span>{deleteAccountNeedsPassword ? 'Because you use email and password, Maison needs your current password before deletion can finish.' : 'Google-based accounts still require a fresh recent sign-in if the session is stale.'}</span>
              <span>Type DELETE below to confirm you want Maison to complete this offboarding step.</span>
            </div>
            <div className="offboarding-confirmation-stack">
              {deleteAccountNeedsPassword ? <input className="invite-code-input no-caps-input" type="password" placeholder="Current password to confirm deletion" value={deleteAccountPassword} onChange={(event) => setDeleteAccountPassword(event.target.value)} autoComplete="current-password" /> : null}
              <input className="invite-code-input no-caps-input" type="text" placeholder="Type DELETE to confirm" value={deleteAccountConfirmText} onChange={(event) => setDeleteAccountConfirmText(event.target.value)} autoComplete="off" />
              <div className="form-actions">
                <button className="danger-button" onClick={runDeleteAccountFlow} disabled={isDeletingAccount}>{isDeletingAccount ? 'Deleting account…' : deleteAccountActionLabel}</button>
              </div>
            </div>
          </section>

          {membership?.role === 'owner' ? <section className="panel reminder-panel">
            <div className="section-head"><div><p className="panel-label">Reminder operations</p><h2>Delivery queue and history</h2></div></div>
            <div className="ops-summary-grid">
              <div className="ops-stat"><span>Pending</span><strong>{pendingReminderQueue.length}</strong></div>
              <div className="ops-stat"><span>Sent</span><strong>{sentReminderHistory.length}</strong></div>
              <div className="ops-stat"><span>Last run</span><strong>{houseProfile.lastReminderRunAt ? new Date(houseProfile.lastReminderRunAt).toLocaleDateString() : '—'}</strong></div>
            </div>
            <div className="ops-columns">
              <div>
                <p className="panel-label">Pending reminders</p>
                <div className="reminder-list">{pendingReminderQueue.length ? pendingReminderQueue.slice(0, 8).map((item) => (<article key={item.id} className={`reminder-item ${item.sent ? 'sent' : ''}`}><strong>{item.title}</strong><span>Remind: {item.remindAt} · Due: {item.dueAt}</span><span>{item.channelTargets.join(' + ')} · {item.status}</span><div className="form-actions"><button className="secondary-button" onClick={() => handleMarkReminderSent(item.id)}>Mark delivered</button></div></article>)) : <p className="empty-copy">No pending reminders right now.</p>}</div>
              </div>
              <div>
                <p className="panel-label">Recent delivery history</p>
                <div className="completion-list">{recentReminderHistory.length ? recentReminderHistory.map((item) => (<article key={item.id} className="completion-item"><strong>{item.title}</strong><span>Sent {item.sentAt ? new Date(item.sentAt).toLocaleString() : '—'}</span><span>{item.sentChannel || 'worker'} · Due {item.dueAt}</span></article>)) : <p className="empty-copy">No reminder deliveries recorded yet.</p>}</div>
              </div>
            </div>
          </section> : null}
        </>
      ) : (
        <section className="panel shopping-panel">
          <div className="section-head shopping-section-head"><div><p className="panel-label">Shopping lists</p><h2>Household errands by store</h2><p className="hero-copy">Keep the open items easy to scan, and let checked items fall to a separate bucket instead of cluttering the main list.</p>{shoppingMessage ? <p className={`auth-help ${shoppingMessageClass}`}>{shoppingMessage}</p> : null}</div><div className="shopping-summary"><div className="ops-stat"><span>Open items</span><strong>{openShoppingItems.length}</strong></div><div className="ops-stat"><span>Checked</span><strong>{checkedShoppingItems.length}</strong></div><div className="ops-stat"><span>Progress</span><strong>{shoppingCompletion}%</strong></div></div></div>{lists.length ? <div className="shopping-tabs">{lists.map((list) => (<button key={list.id} className={`shopping-tab ${activeShoppingList?.id === list.id ? 'active' : ''}`} onClick={() => setActiveShoppingListId(list.id)}>{list.title}</button>))}</div> : <p className="empty-copy">No shopping lists are available yet.</p>}{activeShoppingList ? <article className={`shopping-card ${activeShoppingList.tone}`}><div className="shopping-top"><div><p className="task-meta">Store list</p><h3>{activeShoppingList.id === 'other' ? (activeShoppingList.storeName || 'Other') : activeShoppingList.title}</h3><p className="shopping-progress-copy">{activeShoppingItems.length ? `${openShoppingItems.length} to grab, ${checkedShoppingItems.length} already handled.` : 'Start the list by adding your first item.'}</p></div><span className="count-pill">{openShoppingItems.length} open</span></div>{activeShoppingList.id === 'other' ? <label className="shopping-store-field"><span>Store name</span><input placeholder="Store name" value={activeShoppingList.storeName || ''} onChange={(e) => handleSaveShoppingListMeta(activeShoppingList.id, { storeName: e.target.value })} /></label> : null}<form className="shopping-form" onSubmit={(event) => submitShoppingForm(event, activeShoppingList.id)}><input placeholder="Item name" value={getShoppingForm(activeShoppingList.id).name} onChange={(e) => setShoppingFormValue(activeShoppingList.id, { ...getShoppingForm(activeShoppingList.id), name: e.target.value })} required /><input placeholder="Qty" value={getShoppingForm(activeShoppingList.id).qty} onChange={(e) => setShoppingFormValue(activeShoppingList.id, { ...getShoppingForm(activeShoppingList.id), qty: e.target.value })} /><input placeholder="Aisle / note" value={getShoppingForm(activeShoppingList.id).aisleHint} onChange={(e) => setShoppingFormValue(activeShoppingList.id, { ...getShoppingForm(activeShoppingList.id), aisleHint: e.target.value })} /><input placeholder="Product URL" value={getShoppingForm(activeShoppingList.id).url || ''} onChange={(e) => setShoppingFormValue(activeShoppingList.id, { ...getShoppingForm(activeShoppingList.id), url: e.target.value })} /><div className="form-actions"><button className="primary-button" type="submit">{editingShopping[activeShoppingList.id] ? 'Save item' : 'Add item'}</button>{editingShopping[activeShoppingList.id] ? <button className="secondary-button" type="button" onClick={() => resetShoppingForm(activeShoppingList.id)}>Cancel</button> : null}</div></form><div className="shopping-group"><div className="shopping-group-head"><p className="panel-label">To grab now</p><span className="count-pill">{openShoppingItems.length}</span></div><div className="shopping-items">{openShoppingItems.length ? openShoppingItems.map((item) => (<div key={item.id} className="shopping-item"><input type="checkbox" checked={item.checked} onChange={() => handleToggleShoppingItem(activeShoppingList.id, item.id)} /><div><strong>{item.name}</strong><span>{item.qty} · {item.aisleHint}</span>{item.url ? <a className="shopping-link" href={item.url} target="_blank" rel="noreferrer">Open link</a> : null}</div><div className="shopping-item-actions"><button className="inline-action" onClick={() => startEditShoppingItem(activeShoppingList.id, item)}>Edit</button><button className="inline-action danger" onClick={() => handleDeleteShoppingItem(activeShoppingList.id, item.id)}>Delete</button></div></div>)) : <p className="empty-copy">Nothing open on this list right now.</p>}</div></div>{checkedShoppingItems.length ? <div className="shopping-group checked-group"><div className="shopping-group-head"><div><p className="panel-label">Already grabbed</p><span className="checked-group-copy">Checked off items can be cleared once you’re done with the run.</span></div><div className="checked-group-actions"><span className="count-pill">{checkedShoppingItems.length}</span><button className="inline-action danger" type="button" onClick={() => handleDeleteCheckedShoppingItems(activeShoppingList.id)}>Clear checked</button></div></div><div className="shopping-items">{checkedShoppingItems.map((item) => (<div key={item.id} className="shopping-item checked"><input type="checkbox" checked={item.checked} onChange={() => handleToggleShoppingItem(activeShoppingList.id, item.id)} /><div><strong>{item.name}</strong><span>{item.qty} · {item.aisleHint}</span>{item.url ? <a className="shopping-link" href={item.url} target="_blank" rel="noreferrer">Open link</a> : null}</div><div className="shopping-item-actions"><button className="inline-action" onClick={() => startEditShoppingItem(activeShoppingList.id, item)}>Edit</button><button className="inline-action danger" onClick={() => handleDeleteShoppingItem(activeShoppingList.id, item.id)}>Delete</button></div></div>))}</div></div> : null}</article> : <p className="empty-copy">Pick up household shopping by creating or restoring a list first.</p>}</section>
      )}

    </div>
  )
}

function StatusBanner({ hasFirebaseConfig, remoteError, maisonLabel = 'Maison' }) {
  if (!hasFirebaseConfig) return <div className="status-banner local">{maisonLabel} cannot reach Firebase right now, so it is using fallback local data.</div>
  if (remoteError) return <div className="status-banner error">{maisonLabel} had trouble reaching the live household data, so some information may be outdated right now.</div>
  return null
}
function SignedInPill({ user, membership }) {
  if (!user) return null
  const label = membership?.role === 'owner' ? `Signed in as ${user.displayName || user.email} (owner)` : `Signed in as ${user.displayName || user.email}`
  return <div className="status-pill-bar">{label}</div>
}
function formatDiagnosticsDetail(detail) {
  if (detail == null) return '—'
  if (typeof detail === 'string') return detail
  try {
    return JSON.stringify(detail, null, 2)
  } catch {
    return String(detail)
  }
}
function NativeDiagnosticsPanel({ diagnostics }) {
  const [isOpen, setIsOpen] = useState(() => diagnostics.isNativeShell)

  if (!diagnostics.shouldShowDiagnostics) return null

  return (
    <details className="panel native-diagnostics-panel" open={isOpen} onToggle={(event) => setIsOpen(event.currentTarget.open)}>
      <summary className="native-diagnostics-summary">
        <div>
          <p className="panel-label">Native diagnostics</p>
          <h2>{diagnostics.isNativeShell ? 'Capacitor shell detected' : 'Debug diagnostics enabled'}</h2>
          <p className="hero-copy">Current URL, runtime, lifecycle events, and auth redirect traces for device testing.</p>
        </div>
        <span className="count-pill">{diagnostics.snapshot.runtime} · {diagnostics.platform}</span>
      </summary>

      <div className="native-diagnostics-grid">
        <div className="native-diagnostics-stat">
          <span>Runtime</span>
          <strong>{diagnostics.snapshot.runtime}</strong>
        </div>
        <div className="native-diagnostics-stat">
          <span>Platform</span>
          <strong>{diagnostics.platform}</strong>
        </div>
        <div className="native-diagnostics-stat">
          <span>App state</span>
          <strong>{diagnostics.appState}</strong>
        </div>
        <div className="native-diagnostics-stat">
          <span>Stored events</span>
          <strong>{diagnostics.totalEventCount}</strong>
        </div>
      </div>

      <div className="native-diagnostics-url-block">
        <p className="panel-label">Current URL</p>
        <p className="hero-copy native-diagnostics-url">{diagnostics.currentUrl || 'Unavailable'}</p>
        <p className="hero-copy">This history survives auth redirects until you clear it, so failed return flows leave a trail behind.</p>
      </div>

      <div className="form-actions native-diagnostics-actions">
        <button className="secondary-button" type="button" onClick={() => diagnostics.copySnapshot()}>Copy snapshot</button>
        <button className="secondary-button" type="button" onClick={() => diagnostics.clearEvents()}>Clear history</button>
        {diagnostics.debugEnabled && !diagnostics.isNativeShell ? <span className="hero-copy">Remove <code>?nativeDebug=1</code> to hide this on web.</span> : null}
        {diagnostics.copyMessage ? <span className="auth-help success native-diagnostics-copy">{diagnostics.copyMessage}</span> : null}
      </div>

      <div className="native-diagnostics-events">
        <p className="panel-label">Recent events {diagnostics.totalEventCount ? `(${Math.min(diagnostics.events.length, diagnostics.totalEventCount)} shown)` : ''}</p>
        {diagnostics.events.length ? diagnostics.events.map((event) => (
          <article key={event.id} className="native-diagnostics-event">
            <div className="native-diagnostics-event-head">
              <strong>{event.type}</strong>
              <time dateTime={event.timestamp}>{new Date(event.timestamp).toLocaleTimeString()}</time>
            </div>
            <pre>{formatDiagnosticsDetail(event.detail)}</pre>
          </article>
        )) : <p className="empty-copy">No lifecycle or callback events captured yet.</p>}
      </div>
    </details>
  )
}
function CollapsiblePanel({ className = '', headClassName = '', header, isOpen, onToggle, children }) {
  return (
    <section className={`panel collapsible-panel ${isOpen ? 'open' : 'closed'} ${className}`.trim()}>
      <button className={`section-head editor-toggle collapsible-toggle ${headClassName}`.trim()} type="button" onClick={onToggle} aria-expanded={isOpen}>
        <div className="collapsible-head-main">{header}</div>
        <span className="collapsible-toggle-meta"><span>{isOpen ? 'Hide' : 'Open'}</span><span className={`panel-collapse-chevron ${isOpen ? 'open' : ''}`} aria-hidden="true">⌄</span></span>
      </button>
      {isOpen ? <div className="collapsible-body">{children}</div> : null}
    </section>
  )
}
function StatCard({ label, value, tone, active = false, onClick }) { return <button className={`stat-card ${tone} ${active ? 'active' : ''}`} type="button" aria-pressed={active} onClick={onClick}><p>{label}</p><strong>{value}</strong></button> }
function TaskDatum({ label, value }) { return <div className="task-datum"><span>{label}</span><strong>{value}</strong></div> }
export default App
