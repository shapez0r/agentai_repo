import { useEffect, useState } from 'react'
import AuthScreen from './components/AuthScreen.jsx'
import BudgetDrawer from './components/BudgetDrawer.jsx'
import CalendarPanel from './components/CalendarPanel.jsx'
import EventEditor from './components/EventEditor.jsx'
import DayDetails from './components/DayDetails.jsx'
import {
  DEFAULT_EVENT_ICON,
  addMonths,
  buildCalendarModel,
  createDefaultBudgetState,
  createDemoBudgetState,
  formatCurrency,
  formatLongDate,
  formatShortDate,
  formatSignedCurrency,
  getDefaultScheduleType,
  getNextOccurrence,
  getWeekdayOrdinalForDate,
  getWeekdayValueForDate,
  parseISODate,
  startOfMonth,
  startOfToday,
  toISODate,
  WEEKDAY_LABELS,
} from './lib/budget.js'
import {
  createRecurringEvent,
  deleteRecurringEvent,
  fetchBudgetState,
  fetchSession,
  getLocalMailboxUrl,
  registerUser,
  replaceBudgetState,
  requestPasswordReset,
  resetPassword,
  saveOpeningSettings,
  signInWithPassword,
  signOut,
  updateRecurringEvent,
} from './lib/localApi.js'

const DEFAULT_AUTH_FORM = {
  email: '',
  password: '',
  confirmPassword: '',
}

function createDefaultEventForm() {
  const todayIso = toISODate(startOfToday())

  return {
    title: '',
    amount: '',
    direction: 'expense',
    frequency: 'monthly',
    intervalWeeks: '1',
    scheduleType: getDefaultScheduleType('monthly'),
    weekday: getWeekdayValueForDate(todayIso),
    weekdayOrdinal: getWeekdayOrdinalForDate(todayIso),
    icon: DEFAULT_EVENT_ICON,
    startDate: todayIso,
    endDate: '',
  }
}

function createDayEventForm(dateIso) {
  return {
    ...createDefaultEventForm(),
    frequency: 'once',
    scheduleType: getDefaultScheduleType('once'),
    weekday: getWeekdayValueForDate(dateIso),
    weekdayOrdinal: getWeekdayOrdinalForDate(dateIso),
    startDate: dateIso,
  }
}

function resolveEventScheduleType(frequency, currentScheduleType = 'date') {
  if (frequency === 'monthly' || frequency === 'yearly') {
    return currentScheduleType === 'weekday' ? 'weekday' : 'date'
  }

  return getDefaultScheduleType(frequency)
}

function createEventFormFromEvent(event) {
  const frequency = event.frequency === 'biweekly' ? 'weekly' : event.frequency

  return {
    title: event.title,
    amount: Math.abs(Number(event.amount)).toString(),
    direction: Number(event.amount) < 0 ? 'expense' : 'income',
    frequency,
    intervalWeeks: event.frequency === 'biweekly' ? '2' : '1',
    scheduleType: resolveEventScheduleType(frequency, event.scheduleType),
    weekday: event.weekday || getWeekdayValueForDate(event.startDate),
    weekdayOrdinal: event.weekdayOrdinal || getWeekdayOrdinalForDate(event.startDate),
    icon: event.icon || DEFAULT_EVENT_ICON,
    startDate: event.startDate,
    endDate: event.endDate || '',
  }
}

function getOpeningSettings(budget) {
  return {
    openingBalance: budget.openingBalance,
    openingDate: budget.openingDate,
  }
}

function readAuthStateFromUrl() {
  if (typeof window === 'undefined') {
    return null
  }

  const url = new URL(window.location.href)
  const auth = url.searchParams.get('auth')
  const message = url.searchParams.get('message')
  const mode = url.searchParams.get('mode')
  const token = url.searchParams.get('token')

  if (!auth && !mode) {
    return null
  }

  window.history.replaceState({}, document.title, window.location.pathname)

  return {
    auth,
    message,
    mode,
    token,
  }
}

function LoadingScreen({ title, body }) {
  return (
    <main className="auth-shell">
      <section className="panel auth-card">
        <div className="auth-copy">
          <p className="eyebrow">Loading</p>
          <h1>{title}</h1>
          <p className="auth-text">{body}</p>
        </div>
      </section>
    </main>
  )
}

function App() {
  const today = startOfToday()
  const todayIso = toISODate(today)

  const [authReady, setAuthReady] = useState(false)
  const [session, setSession] = useState(null)
  const [authMode, setAuthMode] = useState('sign-in')
  const [authForm, setAuthForm] = useState(DEFAULT_AUTH_FORM)
  const [authBusy, setAuthBusy] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [passwordResetToken, setPasswordResetToken] = useState('')

  const [budget, setBudget] = useState(createDefaultBudgetState)
  const [budgetStatus, setBudgetStatus] = useState('idle')
  const [budgetBusy, setBudgetBusy] = useState(false)
  const [budgetError, setBudgetError] = useState('')
  const [budgetMessage, setBudgetMessage] = useState('')
  const [savedOpeningSettings, setSavedOpeningSettings] = useState(() =>
    getOpeningSettings(createDefaultBudgetState()),
  )

  const [viewMonth, setViewMonth] = useState(() => startOfMonth(today))
  const [selectedDate, setSelectedDate] = useState(todayIso)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isEventEditorOpen, setIsEventEditorOpen] = useState(false)

  const [eventForm, setEventForm] = useState(createDefaultEventForm)
  const [editingEventId, setEditingEventId] = useState('')
  const [formError, setFormError] = useState('')
  const [eventMutationId, setEventMutationId] = useState('')
  const [eventFormFocusKey, setEventFormFocusKey] = useState(0)

  useEffect(() => {
    const pendingAuthState = readAuthStateFromUrl()

    if (pendingAuthState) {
      if (pendingAuthState.auth === 'verified') {
        setAuthMode('sign-in')
        setAuthMessage(pendingAuthState.message || 'Email verified. You can sign in now.')
        setAuthError('')
      }

      if (pendingAuthState.auth === 'error') {
        setAuthMode('sign-in')
        setAuthError(pendingAuthState.message || 'That link is invalid or has expired.')
        setAuthMessage('')
      }

      if (pendingAuthState.mode === 'reset-password' && pendingAuthState.token) {
        setAuthMode('update-password')
        setPasswordResetToken(pendingAuthState.token)
        setAuthMessage('Recovery link accepted. Choose a new password.')
        setAuthError('')
      }
    }

    let ignore = false

    const initializeSession = async () => {
      try {
        const data = await fetchSession()

        if (!ignore) {
          setSession(data.session ?? null)
        }
      } catch (error) {
        if (!ignore) {
          setAuthError(error.message)
        }
      } finally {
        if (!ignore) {
          setAuthReady(true)
        }
      }
    }

    initializeSession()

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    if (!session?.user?.id) {
      return undefined
    }

    let ignore = false

    const loadBudget = async () => {
      setBudgetStatus('loading')
      setBudgetError('')

      try {
        const loadedBudget = await fetchBudgetState()

        if (ignore) {
          return
        }

        setBudget(loadedBudget)
        setSavedOpeningSettings(getOpeningSettings(loadedBudget))
        setViewMonth(startOfMonth(parseISODate(loadedBudget.openingDate) ?? parseISODate(todayIso) ?? startOfToday()))
        setSelectedDate(todayIso)
        setEditingEventId('')
        setEventForm(createDefaultEventForm())
        setBudgetStatus('ready')
      } catch (error) {
        if (ignore) {
          return
        }

        setBudgetStatus('error')
        setBudgetError(error.message)
      }
    }

    loadBudget()

    return () => {
      ignore = true
    }
  }, [session?.user?.id, todayIso])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined
    }

    const previousOverflow = document.body.style.overflow

    if (isMenuOpen || isEventEditorOpen) {
      document.body.style.overflow = 'scroll'
    }

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isMenuOpen, isEventEditorOpen])

  useEffect(() => {
    if (!isMenuOpen || typeof window === 'undefined') {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMenuOpen])

  const calendar = buildCalendarModel(viewMonth, budget)
  const selectedDayIso =
    calendar.days.find((day) => day.iso === selectedDate)?.iso ??
    calendar.days.find((day) => day.iso === todayIso && day.inCurrentMonth)?.iso ??
    calendar.days.find((day) => day.inCurrentMonth)?.iso ??
    calendar.days[0]?.iso ??
    ''
  const selectedDay = calendar.days.find((day) => day.iso === selectedDayIso) ?? null
  const openingBalanceDisplay =
    calendar.summary.openingBalanceForMonth === null
      ? `Starts ${formatShortDate(budget.openingDate)}`
      : formatCurrency(calendar.summary.openingBalanceForMonth)
  const closingBalanceDisplay =
    calendar.summary.closingBalance === null
      ? 'Budget not active'
      : formatCurrency(calendar.summary.closingBalance)
  const openingSettingsDirty =
    budget.openingBalance !== savedOpeningSettings.openingBalance ||
    budget.openingDate !== savedOpeningSettings.openingDate
  const recurringEvents = [...budget.events].sort((left, right) => {
    const leftNext = getNextOccurrence(left, todayIso)
    const rightNext = getNextOccurrence(right, todayIso)

    if (leftNext && rightNext && leftNext !== rightNext) {
      return leftNext.localeCompare(rightNext)
    }

    if (leftNext && !rightNext) {
      return -1
    }

    if (!leftNext && rightNext) {
      return 1
    }

    return left.title.localeCompare(right.title)
  })
  const authMailboxUrl = getLocalMailboxUrl(authForm.email)
  const accountMailboxUrl = getLocalMailboxUrl(session?.user?.email ?? '')

  const updateAuthForm = (field, value) => {
    setAuthError('')
    setAuthMessage('')
    setAuthForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const setSignedOutMode = (mode) => {
    setAuthMode(mode)
    setAuthError('')
    setAuthMessage('')

    if (mode !== 'update-password') {
      setPasswordResetToken('')
    }
  }

  const resetSignedInState = () => {
    const freshBudget = createDefaultBudgetState()

    setSession(null)
    setBudget(freshBudget)
    setBudgetStatus('idle')
    setBudgetBusy(false)
    setBudgetError('')
    setBudgetMessage('')
    setSavedOpeningSettings(getOpeningSettings(freshBudget))
    setEventForm(createDefaultEventForm())
    setEditingEventId('')
    setFormError('')
    setEventMutationId('')
    setIsMenuOpen(false)
    setViewMonth(startOfMonth(today))
    setSelectedDate(todayIso)
    setAuthMode('sign-in')
  }

  const updateBudgetValue = (field, value) => {
    setBudgetError('')
    setBudgetMessage('')
    setBudget((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const updateEventForm = (field, value) => {
    setFormError('')
    setBudgetMessage('')
    setEventForm((current) => ({
      ...current,
      ...(field === 'frequency'
        ? {
            frequency: value,
            intervalWeeks: value === 'weekly' ? current.intervalWeeks : '1',
            scheduleType:
              value === 'monthly' || value === 'yearly'
                ? current.frequency === value
                  ? resolveEventScheduleType(value, current.scheduleType)
                  : 'date'
                : getDefaultScheduleType(value),
            weekday: current.weekday || getWeekdayValueForDate(current.startDate),
            weekdayOrdinal: current.weekdayOrdinal || getWeekdayOrdinalForDate(current.startDate),
            endDate: value === 'once' ? '' : current.endDate,
          }
        : field === 'startDate'
          ? {
              startDate: value,
              weekday: getWeekdayValueForDate(value),
              weekdayOrdinal: getWeekdayOrdinalForDate(value),
            }
        : field === 'scheduleType'
          ? {
              scheduleType: resolveEventScheduleType(current.frequency, value),
              weekday: current.weekday || getWeekdayValueForDate(current.startDate),
              weekdayOrdinal: current.weekdayOrdinal || getWeekdayOrdinalForDate(current.startDate),
            }
          : {
              [field]: value,
            }),
    }))
  }

  const handleAuthSubmit = async (event) => {
    event.preventDefault()

    const email = authForm.email.trim().toLowerCase()

    setAuthBusy(true)
    setAuthError('')
    setAuthMessage('')

    try {
      if (authMode === 'sign-up') {
        if (authForm.password.length < 8) {
          throw new Error('Use at least 8 characters for the password.')
        }

        if (authForm.password !== authForm.confirmPassword) {
          throw new Error('Password confirmation does not match.')
        }

        const response = await registerUser({
          email,
          password: authForm.password,
        })

        setAuthForm(DEFAULT_AUTH_FORM)
        setAuthMode('sign-in')
        setAuthMessage(response.message)
      } else if (authMode === 'sign-in') {
        const response = await signInWithPassword({
          email,
          password: authForm.password,
        })

        setSession(response.session)
        setAuthForm(DEFAULT_AUTH_FORM)
        setAuthError('')
        setAuthMessage('')
      } else if (authMode === 'forgot-password') {
        const response = await requestPasswordReset(email)
        setAuthMessage(response.message)
      } else if (authMode === 'update-password') {
        if (!passwordResetToken) {
          throw new Error('That reset link is no longer active. Request a new one.')
        }

        if (authForm.password.length < 8) {
          throw new Error('Use at least 8 characters for the new password.')
        }

        if (authForm.password !== authForm.confirmPassword) {
          throw new Error('Password confirmation does not match.')
        }

        const response = await resetPassword({
          token: passwordResetToken,
          password: authForm.password,
        })

        setPasswordResetToken('')
        setAuthForm(DEFAULT_AUTH_FORM)
        setAuthMode('sign-in')
        setAuthMessage(response.message)
      }
    } catch (error) {
      setAuthError(error.message)
    } finally {
      setAuthBusy(false)
    }
  }

  const handleSaveOpeningSettings = async () => {
    if (!session?.user?.id) {
      return
    }

    setBudgetBusy(true)
    setBudgetError('')
    setBudgetMessage('')

    try {
      const savedSettings = await saveOpeningSettings({
        openingBalance: budget.openingBalance,
        openingDate: budget.openingDate,
      })

      setSavedOpeningSettings(savedSettings)
      setBudgetMessage('Opening settings saved to the local database.')
    } catch (error) {
      setBudgetError(error.message)
    } finally {
      setBudgetBusy(false)
    }
  }

  const handleSubmitEvent = async (event) => {
    event.preventDefault()

    const title = eventForm.title.trim()
    const unsignedAmount = Number(eventForm.amount)

    if (!title) {
      setFormError('Add a short label for the recurring event.')
      return
    }

    if (!Number.isFinite(unsignedAmount) || unsignedAmount <= 0) {
      setFormError('Enter a positive euro amount.')
      return
    }

    if (eventForm.endDate && eventForm.endDate < eventForm.startDate) {
      setFormError('The end date must be on or after the start date.')
      return
    }

    if (
      (eventForm.frequency === 'weekly' ||
        eventForm.frequency === 'biweekly' ||
        (eventForm.scheduleType === 'weekday' &&
          (eventForm.frequency === 'monthly' || eventForm.frequency === 'yearly'))) &&
      !eventForm.weekday
    ) {
      setFormError('Choose which day of the week the event should land on.')
      return
    }

    if (
      (eventForm.frequency === 'monthly' || eventForm.frequency === 'yearly') &&
      eventForm.scheduleType === 'weekday' &&
      !eventForm.weekdayOrdinal
    ) {
      setFormError('Choose which week of the month the event should land on.')
      return
    }

    const amount =
      eventForm.direction === 'expense' ? -Math.abs(unsignedAmount) : Math.abs(unsignedAmount)
    const eventFrequency =
      eventForm.frequency === 'weekly' && eventForm.intervalWeeks === '2'
        ? 'biweekly'
        : eventForm.frequency
    const scheduleType = resolveEventScheduleType(eventFrequency, eventForm.scheduleType)
    const payload = {
      title,
      amount,
      frequency: eventFrequency,
      scheduleType,
      weekday: eventForm.weekday || getWeekdayValueForDate(eventForm.startDate),
      weekdayOrdinal: eventForm.weekdayOrdinal || getWeekdayOrdinalForDate(eventForm.startDate),
      icon: eventForm.icon,
      startDate: eventForm.startDate,
      endDate: eventForm.frequency === 'once' ? '' : eventForm.endDate,
    }
    const mutationId = editingEventId || 'create'

    setEventMutationId(mutationId)

    try {
      const savedEvent = editingEventId
        ? await updateRecurringEvent(editingEventId, payload)
        : await createRecurringEvent(payload)

      setBudget((current) => ({
        ...current,
        events: editingEventId
          ? current.events.map((item) => (item.id === editingEventId ? savedEvent : item))
          : [...current.events, savedEvent],
      }))
      setEventForm(createDefaultEventForm())
      setEditingEventId('')
      setBudgetMessage(
        editingEventId
          ? 'Recurring event updated in the local database.'
          : 'Recurring event saved to the local database.',
      )
      setIsEventEditorOpen(false)
    } catch (error) {
      setFormError(error.message)
    } finally {
      setEventMutationId('')
    }
  }

  const handleEditEvent = (event) => {
    setFormError('')
    setBudgetMessage('')
    setIsEventEditorOpen(true)
    setEditingEventId(event.id)
    setEventForm(createEventFormFromEvent(event))
    setEventFormFocusKey((current) => current + 1)
  }

  const handleCancelEventEdit = () => {
    setEditingEventId('')
    setFormError('')
    setEventForm(createDefaultEventForm())
  }

  const handleCloseEventEditor = () => {
    setIsEventEditorOpen(false)
    handleCancelEventEdit()
  }

  const handleDeleteEvent = async (eventId) => {
    setEventMutationId(eventId)

    try {
      await deleteRecurringEvent(eventId)
      setBudget((current) => ({
        ...current,
        events: current.events.filter((event) => event.id !== eventId),
      }))
      if (editingEventId === eventId) {
        setEditingEventId('')
        setEventForm(createDefaultEventForm())
        setFormError('')
      }
      setBudgetMessage('Recurring event deleted.')
    } catch (error) {
      setBudgetError(error.message)
    } finally {
      setEventMutationId('')
    }
  }

  const handleSelectDay = (day) => {
    setSelectedDate(day.iso)

    if (!day.inCurrentMonth) {
      const dayDate = parseISODate(day.iso)

      if (dayDate) {
        setViewMonth(startOfMonth(dayDate))
      }
    }
  }

  const handleAddEventForDay = (day) => {
    handleSelectDay(day)
    setIsEventEditorOpen(true)
    setEditingEventId('')
    setFormError('')
    setBudgetMessage('')
    setEventForm(createDayEventForm(day.iso))
    setEventFormFocusKey((current) => current + 1)
  }

  const handleEditDayEvent = (day, event) => {
    handleSelectDay(day)
    handleEditEvent(event)
  }

  const handleReplaceBudget = async (nextBudget, successMessage) => {
    setBudgetBusy(true)
    setBudgetError('')
    setBudgetMessage('')

    try {
      const savedBudget = await replaceBudgetState(nextBudget)
      const openingDate = parseISODate(savedBudget.openingDate) ?? today

      setBudget(savedBudget)
      setSavedOpeningSettings(getOpeningSettings(savedBudget))
      setViewMonth(startOfMonth(openingDate))
      setSelectedDate(toISODate(openingDate))
      setBudgetMessage(successMessage)
      setEventForm(createDefaultEventForm())
      setEditingEventId('')
      setFormError('')
    } catch (error) {
      setBudgetError(error.message)
    } finally {
      setBudgetBusy(false)
    }
  }

  const handleLoadDemoBudget = async () => {
    if (
      budget.events.length > 0 &&
      typeof window !== 'undefined' &&
      !window.confirm('Replace the current saved budget with the demo budget?')
    ) {
      return
    }

    await handleReplaceBudget(createDemoBudgetState(), 'Demo budget loaded into your account.')
  }

  const handleResetBudget = async () => {
    if (
      typeof window !== 'undefined' &&
      !window.confirm('Clear all recurring events and reset the saved budget?')
    ) {
      return
    }

    await handleReplaceBudget(createDefaultBudgetState(), 'Saved budget reset.')
  }

  const handleSignOut = async () => {
    setBudgetBusy(true)

    try {
      await signOut()
      resetSignedInState()
    } catch (error) {
      setBudgetError(error.message)
    } finally {
      setBudgetBusy(false)
    }
  }

  if (!authReady) {
    return <LoadingScreen title="Connecting to local services" body="Checking for an existing session." />
  }

  if (!session || authMode === 'update-password') {
    return (
      <AuthScreen
        authMode={authMode}
        authForm={authForm}
        authBusy={authBusy}
        authError={authError}
        authMessage={authMessage}
        mailboxUrl={authMailboxUrl}
        onFieldChange={updateAuthForm}
        onModeChange={setSignedOutMode}
        onSubmit={handleAuthSubmit}
      />
    )
  }

  if (budgetStatus === 'loading') {
    return <LoadingScreen title="Loading your budget" body="Pulling your data from the local database." />
  }

  if (budgetStatus === 'error') {
    return (
      <LoadingScreen
        title="Local sync failed"
        body={budgetError || 'Check that the local API server is running and the SQLite database is writable.'}
      />
    )
  }

  return (
    <main className="app-shell">
      <CalendarPanel
        sessionEmail={session.user.email}
        budget={budget}
        calendar={calendar}
        todayIso={todayIso}
        selectedDayIso={selectedDayIso}
        closingBalanceDisplay={closingBalanceDisplay}
        onDaySelect={handleSelectDay}
        onDayAdd={handleAddEventForDay}
        onDayEventSelect={handleEditDayEvent}
        onShiftMonth={(direction) =>
          setViewMonth((current) => startOfMonth(addMonths(current, direction)))
        }
        onJumpToToday={() => {
          setViewMonth(startOfMonth(today))
          setSelectedDate(todayIso)
        }}
        onOpenMenu={() => setIsMenuOpen(true)}
        formatCurrency={formatCurrency}
        formatLongDate={formatLongDate}
        formatShortDate={formatShortDate}
        formatSignedCurrency={formatSignedCurrency}
        WEEKDAY_LABELS={WEEKDAY_LABELS}
      />

      <BudgetDrawer
        isOpen={isMenuOpen}
        sessionEmail={session.user.email}
        sessionVerifiedAt={session.user.emailVerifiedAt}
        mailboxUrl={accountMailboxUrl}
        budget={budget}
        budgetBusy={budgetBusy}
        budgetError={budgetError}
        budgetMessage={budgetMessage}
        openingSettingsDirty={openingSettingsDirty}
        onClose={() => setIsMenuOpen(false)}
        onSignOut={handleSignOut}
        onLoadDemoBudget={handleLoadDemoBudget}
        onResetBudget={handleResetBudget}
        onUpdateBudgetValue={updateBudgetValue}
        onSaveOpeningSettings={handleSaveOpeningSettings}
        editingEventId={editingEventId}
        eventMutationId={eventMutationId}
        onEditEvent={handleEditEvent}
        recurringEvents={recurringEvents}
        todayIso={todayIso}
        onDeleteEvent={handleDeleteEvent}
        openingBalanceDisplay={openingBalanceDisplay}
        closingBalanceDisplay={closingBalanceDisplay}
        calendarSummary={calendar.summary}
      />

      <EventEditor
        isOpen={isEventEditorOpen}
        onClose={handleCloseEventEditor}
        eventForm={eventForm}
        editingEventId={editingEventId}
        formError={formError}
        eventMutationId={eventMutationId}
        eventFormFocusKey={eventFormFocusKey}
        onUpdateEventForm={updateEventForm}
        onSubmitEvent={handleSubmitEvent}
        onCancelEventEdit={handleCancelEventEdit}
      />
    </main>
  )
}

export default App
