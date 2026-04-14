import { useMemo, useState } from 'react'
import './App.css'
import { formatDate, addDays } from './lib/model'
import { usePlannerState } from './hooks/usePlannerState'
import { deleteSignedInAuthUser, signInWithGoogle, signInWithGoogleRedirect, signOutUser, useAuthState } from './lib/auth'

const emptyTaskForm = {
  id: '', title: '', area: '', category: 'Cleaning', room: '', system: '', assetName: '', vendor: '', supplyNote: '', frequency: 'Monthly', cadenceDays: 30, reminderLeadDays: 7, effort: '20 min', season: 'All year', priority: 'Routine', notes: '', lastDone: '2026-04-02', major: false,
}
const emptyShoppingForm = { id: '', name: '', qty: '1', aisleHint: 'Household', url: '', checked: false }

function App() {
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
  const [setupForm, setSetupForm] = useState({ name: '', homeType: '', sizeSqFt: '', levels: '', bedrooms: '', bathrooms: '', hvacSystem: '', hvacHeads: '' })

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
  const { user, authLoading, authError, authErrorCode, setAuthError, setAuthErrorCode } = useAuthState()
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
    setInviteChoice,
    setShowInvitePanel,
  } = usePlannerState(user)

  const categories = useMemo(() => ['All', ...new Set(enrichedTasks.map((task) => task.category))], [enrichedTasks])
  const filteredTasks = enrichedTasks.filter((task) => {
    const categoryMatch = selectedCategory === 'All' || task.category === selectedCategory
    const statusMatch = selectedStatus === 'All' || task.status === selectedStatus
    return categoryMatch && statusMatch
  })
  const dueSoonTasks = enrichedTasks.filter((task) => task.daysUntilDue >= 0 && task.daysUntilDue <= 14).slice(0, 4)
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
  const showDeletedAccountView = !user && Boolean(deletedAccountSummary)

  function openTaskModal(task) { setSelectedTask(task) }
  function closeTaskModal() { setSelectedTask(null) }
  function startEditTask(task) {
    setEditingTaskId(task.id)
    setTaskForm({ id: task.id, title: task.title, area: task.area, category: task.category, room: task.room || '', system: task.system || '', assetName: task.assetName || '', vendor: task.vendor || '', supplyNote: task.supplyNote || '', frequency: task.frequency, cadenceDays: task.cadenceDays, reminderLeadDays: task.reminderLeadDays, effort: task.effort, season: task.season, priority: task.priority, notes: task.notes, lastDone: task.lastDone, major: task.major })
    setTaskEditorOpen(true)
    setSelectedTask(task)
  }
  function resetTaskForm() { setEditingTaskId(null); setTaskForm(emptyTaskForm); setTaskEditorOpen(false) }
  async function submitTaskForm(event) { event.preventDefault(); const saved = await handleSaveTask(taskForm); if (saved) { setSelectedTask(saved); resetTaskForm() } }
  async function completeFromModal(taskId, actor = 'Victor') { await handleComplete(taskId, actor); setSelectedTask(null) }
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

  const normalizedResolvedActor = (resolvedActorName || '').trim().toLowerCase()
  const visibleClaimMembers = householdMembers.filter((member) => {
    const memberName = (member.name || '').trim().toLowerCase()
    return memberName && memberName !== normalizedResolvedActor
  })

  if (!user) {
    return (
      <div className="shell auth-shell">
        <section className="hero-card auth-landing-card onboarding-card goodbye-card">
          <div>
            <p className="eyebrow">Maison Mikell</p>
            <h1>{showDeletedAccountView ? 'Goodbye for now.' : 'Welcome home.'}</h1>
            {showDeletedAccountView ? (
              <>
                <p className="hero-copy">{deletedAccountSummary.message}</p>
                <p className="hero-copy">Your Maison session has been closed cleanly, so you should not see a blank screen here anymore.</p>
                {deletedAccountSummary.deletedHousehold
                  ? <p className="hero-copy">That home is fully gone. If you come back later, you’ll be starting fresh.</p>
                  : <p className="hero-copy">If you ever come back, you can sign in again and either join a household with an invite code or create a new one.</p>}
              </>
            ) : (
              <>
                <p className="hero-copy">A calmer way to run your home, with maintenance, shopping, reminders, and shared household coordination in one place.</p>
                <p className="hero-copy">If the Google popup gets blocked or seems to do nothing, use the full-page sign-in button instead.</p>
                <p className="hero-copy">If your session has expired, just sign in again and you’ll land back in the household flow.</p>
              </>
            )}
            {authMessage ? <p className="auth-help error">{authMessage}</p> : null}
            {!authMessage && authError ? <p className="auth-help error">{authError}</p> : null}
          </div>
          <div className="auth-landing-actions onboarding-actions">
            {showDeletedAccountView ? <div className="auth-landing-note onboarding-note-card goodbye-note"><strong>Signed out cleanly</strong><span>{deletedAccountSummary.email || 'This account'} has been removed, and Maison is now back at a safe resting state.</span></div> : null}
            <button className="primary-button" onClick={async () => {
              setInviteChoice(false)
              const result = await signInWithGoogle()
              if (result?.error) {
                setAuthMessage(result.error)
                setAuthError(result.error)
                setAuthErrorCode(result.rawCode || '')
              } else {
                setAuthMessage('')
                setAuthError('')
                setAuthErrorCode('')
              }
            }}>{showDeletedAccountView ? 'Sign in again with Google' : 'Sign in or sign up with Google'}</button>
            <button className="secondary-button" onClick={() => setInviteChoice(true)}>I already have an invite code</button>
            <button className="secondary-button" onClick={async () => {
              setAuthMessage('Redirecting you to Google sign-in…')
              setAuthError('')
              setAuthErrorCode('')
              await signInWithGoogleRedirect()
            }}>Use full-page sign-in</button>
            {!showDeletedAccountView ? <div className="auth-landing-note onboarding-note-card">
              <strong>Private household access</strong>
              <span>After sign-in, non-members can either create their own household or join one with a valid invite code from an owner.</span>
            </div> : null}
          </div>
        </section>
      </div>
    )
  }

  if (isResolvingSignedInState) {
    return (
      <div className="shell auth-shell">
        <StatusBanner hasFirebaseConfig={hasFirebaseConfig} isRemoteLoaded={isRemoteLoaded} isRemoteLoading={isRemoteLoading} remoteError={remoteError} />
        <SignedInPill user={user} membership={membership} />
        <section className="hero-card auth-landing-card">
          <div>
            <p className="eyebrow">Maison Mikell</p>
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
        <StatusBanner hasFirebaseConfig={hasFirebaseConfig} isRemoteLoaded={isRemoteLoaded} isRemoteLoading={isRemoteLoading} remoteError={remoteError} />
        <SignedInPill user={user} membership={membership} />
        <section className="hero-card auth-landing-card onboarding-card">
          <div>
            <p className="eyebrow">Maison Mikell</p>
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
            <button className="primary-button" type="submit" disabled={isCreatingHousehold}>{isCreatingHousehold ? 'Creating…' : 'Create household'}</button>
            <button className="secondary-button" type="button" onClick={() => setInviteChoice(true)}>{createHouseholdError === 'This household already exists. Use an invite code to join it instead.' ? 'Enter invite code' : 'I already have an invite code'}</button>
            <button className="secondary-button" type="button" onClick={() => signOutUser()}>Use a different Google account</button>
          </form>
        </section>
      </div>
    )
  }

  if (user && membership && membership.role === 'owner' && houseProfile.setupCompleted === false) {
    return (
      <div className="shell auth-shell">
        <StatusBanner hasFirebaseConfig={hasFirebaseConfig} isRemoteLoaded={isRemoteLoaded} isRemoteLoading={isRemoteLoading} remoteError={remoteError} />
        <SignedInPill user={user} membership={membership} />
        <section className="hero-card auth-landing-card onboarding-card">
          <div>
            <p className="eyebrow">Maison Mikell</p>
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
        <StatusBanner hasFirebaseConfig={hasFirebaseConfig} isRemoteLoaded={isRemoteLoaded} isRemoteLoading={isRemoteLoading} remoteError={remoteError} />
        <SignedInPill user={user} membership={membership} />
        <section className="hero-card auth-landing-card onboarding-card">
          <div>
            <p className="eyebrow">Maison Mikell</p>
            <h1>Join your household</h1>
            <p className="hero-copy">Use the code your partner shared, and Maison will drop you straight into the shared home.</p>
            <div className="onboarding-bullet-list"><span>Invite codes are case-insensitive</span><span>Switch accounts anytime if you picked the wrong Google login</span><span>You’ll land directly inside the household</span></div>
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
            <button className="secondary-button" type="button" onClick={() => signOutUser()}>Use a different Google account</button>
          </form>
        </section>
      </div>
    )
  }

  return (
    <div className="shell">
      <div className="top-bar-row">
        <SignedInPill user={user} membership={membership} />
        {activeTab === 'planner' ? <button className="menu-button" onClick={() => setFiltersOpen((open) => !open)} aria-label="Open filters">☰</button> : null}
      </div>
      <StatusBanner hasFirebaseConfig={hasFirebaseConfig} isRemoteLoaded={isRemoteLoaded} isRemoteLoading={isRemoteLoading} remoteError={remoteError} />
      {showRemoteWarning ? <section className="panel remote-warning-panel"><p className="panel-label">Live sync issue</p><h2>Some household data may be stale</h2><p className="hero-copy">Maison Mikell had trouble reaching the live household data just now. You can keep browsing, but if something looks off, refresh or sign out and back in before making decisions.</p></section> : null}
      {deleteAccountError ? <section className="panel remote-warning-panel"><p className="panel-label">Account deletion</p><h2>Could not delete account</h2><p className="hero-copy">{deleteAccountError}</p></section> : null}
      {deleteAccountSuccess ? <section className="panel remote-warning-panel"><p className="panel-label">Account deletion</p><h2>Account removed</h2><p className="hero-copy">{deleteAccountSuccess}</p></section> : null}
      <nav className="top-tabs">
        <div className="top-tabs-left">
          <button className={`top-tab ${activeTab === 'planner' ? 'active' : ''}`} onClick={() => { setActiveTab('planner'); setFiltersOpen(false) }}>Planner</button>
          <button className={`top-tab ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => { setActiveTab('calendar'); setFiltersOpen(false); setSelectedTask(null) }}>Calendar</button>
          <button className={`top-tab ${activeTab === 'shopping' ? 'active' : ''}`} onClick={() => { setActiveTab('shopping'); setFiltersOpen(false); setSelectedTask(null) }}>Shopping</button>
        </div>
        <div className="top-tabs-right">
          {membership?.role === 'owner'
            ? <button className={`top-tab ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => { setActiveTab('admin'); setFiltersOpen(false); setSelectedTask(null) }}>Admin</button>
            : <button className="top-tab" onClick={() => signOutUser()}>Sign out</button>}
        </div>
      </nav>

      {activeTab === 'planner' ? (
        <>
          {filtersOpen ? <button className="drawer-backdrop" onClick={() => setFiltersOpen(false)} aria-label="Close filters" /> : null}
          <aside className={`filter-drawer ${filtersOpen ? 'open' : ''}`}>
            <div className="drawer-head">
              <div>
                <p className="panel-label">Planner filters</p>
                <h2>Refine the view</h2>
              </div>
              <button className="secondary-button" onClick={() => setFiltersOpen(false)}>Close</button>
            </div>
            <div className="drawer-section">
              <p className="panel-label">Filter by category</p>
              <div className="chip-row">
                {categories.map((category) => (
                  <button key={category} className={`chip ${selectedCategory === category ? 'active' : ''}`} onClick={() => setSelectedCategory(category)}>{category}</button>
                ))}
              </div>
            </div>
            <div className="drawer-section">
              <p className="panel-label">Filter by status</p>
              <div className="chip-row">
                {['All', 'overdue', 'remind', 'upcoming'].map((status) => (
                  <button key={status} className={`chip ${selectedStatus === status ? 'active' : ''}`} onClick={() => setSelectedStatus(status)}>{status}</button>
                ))}
              </div>
            </div>
          </aside>
        </>
      ) : null}

      {selectedTask ? <button className="modal-backdrop" onClick={closeTaskModal} aria-label="Close task details" /> : null}
      {selectedTask ? (
        <section className="task-modal" role="dialog" aria-modal="true" aria-label="Task details">
          <div className="task-modal-head">
            <div>
              <p className="task-meta">{selectedTask.area} · {selectedTask.category}</p>
              <h2>{selectedTask.title}</h2>
              <p className="timing-copy">{selectedTask.status === 'overdue' ? `Overdue by ${Math.abs(selectedTask.daysUntilDue)} day${Math.abs(selectedTask.daysUntilDue) === 1 ? '' : 's'}` : selectedTask.daysUntilDue === 0 ? 'Due today' : `Due in ${selectedTask.daysUntilDue} day${selectedTask.daysUntilDue === 1 ? '' : 's'}`}</p>
            </div>
            <button className="secondary-button" onClick={closeTaskModal}>Close</button>
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
                <button className="primary-button" onClick={() => completeFromModal(selectedTask.id, selectedTask.claimedBy || resolvedActorName || 'Victor')}>Mark done today</button>
                <button className="secondary-button" onClick={() => startEditTask(selectedTask)}>Edit</button>
                <button className="danger-button" onClick={() => deleteFromModal(selectedTask.id)}>Delete</button>
                {selectedTask.major ? <span className="major-flag">Large maintenance</span> : null}
              </div>
            </>
          )}
        </section>
      ) : null}

      {showInvitePanel && freshInviteCode && membership?.role === 'owner' ? <section className="panel remote-warning-panel"><div className="section-head"><div><p className="panel-label">Invite your partner</p><h2>Your household is ready</h2><p className="hero-copy">Share this invite code with your partner so they can join the household, then continue into the planner once you’re ready.</p></div><div className="planner-actions"><button className="secondary-button" onClick={() => navigator?.clipboard?.writeText(freshInviteCode)}>Copy code</button><button className="secondary-button" onClick={() => setShowInvitePanel(false)}>Continue to app</button></div></div><div className="invite-code-panel"><p className="hero-copy"><strong>{freshInviteCode}</strong></p><div className="onboarding-bullet-list compact"><span>Partner signs in with Google</span><span>They tap “I already have an invite code”</span><span>They enter this code and land in your shared home</span></div></div></section> : null}
      <header className="hero-card">
        <div><p className="eyebrow">Maison Mikell</p><h1>{activeTab === 'shopping' ? 'Maison Restock' : activeTab === 'calendar' ? 'Maison Calendar' : 'Maison Reset'}</h1><p className="hero-copy">Mobile-first maintenance and shopping planning for a stylish household routine, tuned to your two-level home and 4-head mini split setup.</p></div>
        <div className="hero-note"><strong>{activeTab === 'shopping' ? `${openShoppingItems.length} open item${openShoppingItems.length === 1 ? '' : 's'} across ${lists.length} list${lists.length === 1 ? '' : 's'}` : activeTab === 'calendar' ? `${calendarSections.length} day${calendarSections.length === 1 ? '' : 's'} with scheduled care in the next month` : `${houseProfile.reminderRules.majorLeadDays} days for large maintenance · ${houseProfile.reminderRules.standardLeadDays} days for everything else`}</strong><span>{activeTab === 'shopping' ? `${checkedShoppingItems.length} checked off · ${shoppingCompletion}% complete on this list` : houseProfile.lastReminderRunAt ? `Last reminder run: ${new Date(houseProfile.lastReminderRunAt).toLocaleString()}${houseProfile.lastReminderChannel ? ` via ${houseProfile.lastReminderChannel}` : ''}` : 'Last reminder run: not recorded yet'}</span></div>
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
          <section className="panel planner-overview-panel">
            <div className="section-head planner-overview-head">
              <div>
                <p className="panel-label">Planner overview</p>
                <h2>{plannerHeadline}</h2>
                <p className="hero-copy">{plannerSubcopy}</p>
              </div>
              <div className="planner-actions">
                {statusCardFilterActive ? <button className="secondary-button" onClick={() => { setSelectedCategory('All'); setSelectedStatus('All') }}>Clear filters</button> : null}
                <button className="secondary-button" onClick={() => setTaskEditorOpen((open) => !open)}>{taskEditorOpen ? 'Hide task editor' : 'Add or edit tasks'}</button>
              </div>
            </div>
            {plannerMessage ? <p className={`auth-help ${plannerMessageClass}`}>{plannerMessage}</p> : null}
            {statusCardFilterActive ? <div className="active-filter-row"><span className="count-pill">Category: {selectedCategory}</span><span className="count-pill">Status: {selectedStatus}</span></div> : null}
            {statusCardFilterActive ? (filteredTasks.length ? <div className="compact-task-list">{filteredTasks.map((task) => (<button key={task.id} className="compact-task-card" onClick={() => openTaskModal(task)}><span className="compact-task-title">{task.title}</span><span className={`status-pill ${task.status}`}>{task.status}</span></button>))}</div> : <p className="empty-copy">Nothing matches those filters right now. Clear them to get the full maintenance plan back.</p>) : null}
          </section>

          <section className="spotlight-grid">
            <section className="panel spotlight-panel overdue-panel"><p className="panel-label">Needs attention first</p><h2>{overdueTasks.length ? 'Overdue tasks' : 'Nothing overdue right now'}</h2><div className="spotlight-list">{overdueTasks.length ? overdueTasks.map((task) => (<button key={task.id} className="spotlight-item" onClick={() => openTaskModal(task)}><strong>{task.title}</strong><span>{task.area} · overdue by {Math.abs(task.daysUntilDue)} day{Math.abs(task.daysUntilDue) === 1 ? '' : 's'}</span></button>)) : <p className="empty-copy">The house is in decent shape here — nothing has slipped past due.</p>}</div></section>
            <section className="panel spotlight-panel due-soon-panel"><p className="panel-label">Coming up next</p><h2>Due within 2 weeks</h2><div className="spotlight-list">{dueSoonTasks.length ? dueSoonTasks.map((task) => (<button key={task.id} className="spotlight-item" onClick={() => openTaskModal(task)}><strong>{task.title}</strong><span>{task.daysUntilDue === 0 ? 'Due today' : `Due in ${task.daysUntilDue} days`} · {task.area}</span></button>)) : <p className="empty-copy">No near-term crunch right now. The next two weeks are relatively light.</p>}</div></section>
          </section>

          <section className="panel completion-panel">
            <div className="section-head"><div><p className="panel-label">Completed bucket</p><h2>Recently completed tasks</h2></div></div>
            <div className="completion-list">
              {recentCompletions.length ? recentCompletions.map((item) => (
                <article key={item.id} className="completion-item">
                  <strong>{item.title}</strong>
                  <span>{item.area} · {item.category}</span>
                  <span>Completed {new Date(item.completedAt).toLocaleString()} by {item.completedBy}</span>
                </article>
              )) : <p className="empty-copy">Nothing has been completed yet. Once tasks are marked done, they’ll stay visible here with who completed them.</p>}
            </div>
          </section>

          <section className="panel task-form-panel"><button className="editor-toggle" onClick={() => setTaskEditorOpen((open) => !open)}><div><p className="panel-label">Maintenance task editor</p><h2>{editingTaskId ? 'Edit task' : 'Add new maintenance task'}</h2></div><span>{taskEditorOpen ? 'Hide' : 'Open'}</span></button>{taskEditorOpen ? <form className="task-form-grid" onSubmit={submitTaskForm}><label><span>Title</span><input value={taskForm.title} onChange={(e) => setTaskForm((current) => ({ ...current, title: e.target.value }))} required /></label><label><span>Area</span><input value={taskForm.area} onChange={(e) => setTaskForm((current) => ({ ...current, area: e.target.value }))} required /></label><label><span>Category</span><input value={taskForm.category} onChange={(e) => setTaskForm((current) => ({ ...current, category: e.target.value }))} required /></label><label><span>Frequency</span><input value={taskForm.frequency} onChange={(e) => setTaskForm((current) => ({ ...current, frequency: e.target.value }))} required /></label><label><span>Cadence days</span><input type="number" min="1" value={taskForm.cadenceDays} onChange={(e) => setTaskForm((current) => ({ ...current, cadenceDays: Number(e.target.value) }))} required /></label><label><span>Reminder lead days</span><input type="number" min="1" value={taskForm.reminderLeadDays} onChange={(e) => setTaskForm((current) => ({ ...current, reminderLeadDays: Number(e.target.value), major: Number(e.target.value) >= 30 || current.major }))} required /></label><label><span>Effort</span><input value={taskForm.effort} onChange={(e) => setTaskForm((current) => ({ ...current, effort: e.target.value }))} /></label><label><span>Season</span><input value={taskForm.season} onChange={(e) => setTaskForm((current) => ({ ...current, season: e.target.value }))} /></label><label><span>Priority</span><input value={taskForm.priority} onChange={(e) => setTaskForm((current) => ({ ...current, priority: e.target.value }))} /></label><label><span>Last done</span><input type="date" value={taskForm.lastDone} onChange={(e) => setTaskForm((current) => ({ ...current, lastDone: e.target.value }))} required /></label><label className="checkbox-field"><input type="checkbox" checked={taskForm.major} onChange={(e) => setTaskForm((current) => ({ ...current, major: e.target.checked }))} /><span>Large maintenance item</span></label><label className="full-span"><span>Notes</span><textarea rows="3" value={taskForm.notes} onChange={(e) => setTaskForm((current) => ({ ...current, notes: e.target.value }))} /></label><div className="form-actions full-span"><button className="primary-button" type="submit">{editingTaskId ? 'Save changes' : 'Add task'}</button><button className="secondary-button" type="button" onClick={resetTaskForm}>{editingTaskId ? 'Cancel edit' : 'Close'}</button></div></form> : null}</section>

          {!statusCardFilterActive ? <section className="panel"><div className="section-head"><div><p className="panel-label">Maintenance schedule</p><h2>{filteredTasks.length} tasks in view</h2></div></div><div className="compact-task-list">{filteredTasks.map((task) => (<button key={task.id} className="compact-task-card" onClick={() => openTaskModal(task)}><span className="compact-task-title">{task.title}</span><span className={`status-pill ${task.status}`}>{task.status}</span></button>))}</div></section> : null}
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
              <p className="hero-copy">Invite code: {houseProfile.inviteCode || 'Not generated yet'}</p>
              <p className="hero-copy">Share this code with a household member after they sign in, then they can join from the invite screen.</p>
              {settingsMessage ? <p className={`auth-help ${settingsMessageClass}`}>{settingsMessage}</p> : null}
              <p className="hero-copy">Signed in as: {user?.email || 'unknown'} {membership?.role ? `· role: ${membership.role}` : ''}</p>
            </div>
            <div className="auth-actions">
              {membership?.role === 'owner' ? <button className="secondary-button" onClick={() => handleGenerateInviteCode()}>Refresh invite code</button> : null}
              <button className="secondary-button" onClick={() => signOutUser()}>Sign out</button>
            </div>
          </section>

          {membership?.role === 'owner' ? <section className="panel"><div className="section-head"><div><p className="panel-label">Owner controls</p><h2>Household admin</h2>{settingsMessage ? <p className={`auth-help ${settingsMessageClass}`}>{settingsMessage}</p> : null}</div></div><div className="completion-list">{householdMembers.length ? householdMembers.map((member) => <article key={member.id} className="completion-item"><strong>{member.name}</strong><span>{member.email || 'No email on file'} · {member.role}</span>{member.role !== 'owner' ? <div className="form-actions"><button className="secondary-button" onClick={() => handlePromoteMember(member.id)}>Promote to owner</button></div> : null}</article>) : <p className="empty-copy">No household members are listed yet.</p>}</div><div className="form-actions" style={{ marginTop: 16 }}><button className="danger-button" onClick={async () => { const confirmed = window.confirm('Delete your Maison account? This cannot be undone.'); if (!confirmed) return; const ok = await handleDeleteCurrentAccount(); if (!ok) return; const authResult = await deleteSignedInAuthUser(); if (!authResult.ok) { window.alert(authResult.error); return; } await signOutUser(); }} disabled={isDeletingAccount}>{isDeletingAccount ? 'Deleting account…' : 'Delete my account'}</button></div></section> : <section className="panel"><p className="empty-copy">Only owners can manage household roles and invite codes.</p></section>}

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

function StatusBanner({ hasFirebaseConfig, remoteError }) {
  if (!hasFirebaseConfig) return <div className="status-banner local">Maison Mikell cannot reach Firebase right now, so it is using fallback local data.</div>
  if (remoteError) return <div className="status-banner error">Maison Mikell had trouble reaching the live household data, so some information may be outdated right now.</div>
  return null
}
function SignedInPill({ user, membership }) {
  if (!user) return null
  const label = membership?.role === 'owner' ? `Signed in as ${user.displayName || user.email} (owner)` : `Signed in as ${user.displayName || user.email}`
  return <div className="status-pill-bar">{label}</div>
}
function StatCard({ label, value, tone, active = false, onClick }) { return <button className={`stat-card ${tone} ${active ? 'active' : ''}`} onClick={onClick}><p>{label}</p><strong>{value}</strong></button> }
function TaskDatum({ label, value }) { return <div className="task-datum"><span>{label}</span><strong>{value}</strong></div> }
export default App
