import { useEffect, useState } from 'react'
import AuthScreen from './components/AuthScreen.jsx'
import BudgetDrawer from './components/BudgetDrawer.jsx'
import CalendarPanel from './components/CalendarPanel.jsx'
import {
  addMonths,
  buildCalendarModel,
  createDefaultBudgetState,
  createDemoBudgetState,
  formatCurrency,
  formatLongDate,
  formatShortDate,
  formatSignedCurrency,
  getNextOccurrence,
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
  replaceBudgetState,
  saveOpeningSettings,
} from './lib/cloudBudget.js'
import { loadStoredBudget, saveStoredBudget } from './lib/localBudget.js'
import { getAuthRedirectUrl, isSupabaseConfigured, supabase } from './lib/supabase.js'

const DEFAULT_AUTH_FORM = {
  email: '',
  password: '',
  confirmPassword: '',
}

const DEFAULT_SECURITY_STATE = {
  loading: false,
  currentLevel: null,
  nextLevel: null,
  factors: [],
  error: '',
  message: '',
}

const DEFAULT_MFA_ENROLLMENT = {
  factorId: '',
  qrCode: '',
  secret: '',
  code: '',
}

function createDefaultEventForm() {
  return {
    title: '',
    amount: '',
    direction: 'expense',
    frequency: 'monthly',
    startDate: toISODate(startOfToday()),
    endDate: '',
  }
}

function createLocalEventId() {
  return globalThis.crypto?.randomUUID?.() ?? `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function getInitialBudgetState(cloudMode) {
  return cloudMode ? createDefaultBudgetState() : loadStoredBudget()
}

function getOpeningSettings(budget) {
  return {
    openingBalance: budget.openingBalance,
    openingDate: budget.openingDate,
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
  const cloudMode = isSupabaseConfigured && Boolean(supabase)

  const [authReady, setAuthReady] = useState(!cloudMode)
  const [session, setSession] = useState(null)
  const [authMode, setAuthMode] = useState('sign-in')
  const [authForm, setAuthForm] = useState(DEFAULT_AUTH_FORM)
  const [authBusy, setAuthBusy] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authMessage, setAuthMessage] = useState('')

  const [budget, setBudget] = useState(() => getInitialBudgetState(cloudMode))
  const [budgetStatus, setBudgetStatus] = useState(cloudMode ? 'idle' : 'ready')
  const [budgetBusy, setBudgetBusy] = useState(false)
  const [budgetError, setBudgetError] = useState('')
  const [budgetMessage, setBudgetMessage] = useState('')
  const [savedOpeningSettings, setSavedOpeningSettings] = useState(() =>
    getOpeningSettings(getInitialBudgetState(cloudMode)),
  )

  const [viewMonth, setViewMonth] = useState(() => startOfMonth(today))
  const [selectedDate, setSelectedDate] = useState(todayIso)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const [eventForm, setEventForm] = useState(createDefaultEventForm)
  const [formError, setFormError] = useState('')
  const [eventMutationId, setEventMutationId] = useState('')

  const [securityState, setSecurityState] = useState(DEFAULT_SECURITY_STATE)
  const [securityRefreshNonce, setSecurityRefreshNonce] = useState(0)
  const [mfaEnrollment, setMfaEnrollment] = useState(DEFAULT_MFA_ENROLLMENT)
  const [mfaChallengeCode, setMfaChallengeCode] = useState('')
  const [mfaBusy, setMfaBusy] = useState(false)

  useEffect(() => {
    if (cloudMode) {
      return
    }

    saveStoredBudget(budget)
  }, [budget, cloudMode])

  useEffect(() => {
    if (!cloudMode || !supabase) {
      return undefined
    }

    let mounted = true

    const initializeSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (!mounted) {
          return
        }

        if (error) {
          setAuthError(error.message)
        }

        setSession(data.session ?? null)
      } finally {
        if (mounted) {
          setAuthReady(true)
        }
      }
    }

    initializeSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession ?? null)

      if (event === 'PASSWORD_RECOVERY') {
        setAuthMode('update-password')
        setAuthMessage('Recovery link accepted. Choose a new password.')
        setAuthError('')
      }

      if (event === 'SIGNED_IN') {
        setAuthMode('sign-in')
        setAuthError('')
        setAuthMessage('')
      }

      if (event === 'SIGNED_OUT') {
        const freshBudget = createDefaultBudgetState()
        setAuthMode('sign-in')
        setAuthForm(DEFAULT_AUTH_FORM)
        setBudget(freshBudget)
        setBudgetStatus('idle')
        setBudgetBusy(false)
        setBudgetError('')
        setBudgetMessage('')
        setSavedOpeningSettings(getOpeningSettings(freshBudget))
        setSecurityState(DEFAULT_SECURITY_STATE)
        setMfaEnrollment(DEFAULT_MFA_ENROLLMENT)
        setMfaChallengeCode('')
        setIsMenuOpen(false)
      }

      if (event === 'MFA_CHALLENGE_VERIFIED') {
        setSecurityRefreshNonce((current) => current + 1)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [cloudMode])

  useEffect(() => {
    if (!cloudMode || !session?.user?.id || !supabase) {
      return undefined
    }

    let ignore = false

    const loadCloudBudget = async () => {
      setBudgetStatus('loading')
      setBudgetError('')

      try {
        const loadedBudget = await fetchBudgetState(supabase, session.user.id)

        if (ignore) {
          return
        }

        setBudget(loadedBudget)
        setSavedOpeningSettings(getOpeningSettings(loadedBudget))
        setViewMonth(startOfMonth(parseISODate(loadedBudget.openingDate) ?? parseISODate(todayIso) ?? startOfToday()))
        setSelectedDate(todayIso)
        setBudgetStatus('ready')
      } catch (error) {
        if (ignore) {
          return
        }

        setBudgetStatus('error')
        setBudgetError(error.message)
      }
    }

    loadCloudBudget()

    return () => {
      ignore = true
    }
  }, [cloudMode, session?.user?.id, todayIso])

  useEffect(() => {
    if (!cloudMode || !session?.user?.id || !supabase) {
      return undefined
    }

    let ignore = false

    const loadSecurityState = async () => {
      setSecurityState((current) => ({
        ...current,
        loading: true,
        error: '',
      }))

      try {
        const [aalResult, factorsResult] = await Promise.all([
          supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
          supabase.auth.mfa.listFactors(),
        ])

        if (ignore) {
          return
        }

        if (aalResult.error) {
          throw aalResult.error
        }

        if (factorsResult.error) {
          throw factorsResult.error
        }

        setSecurityState((current) => ({
          ...current,
          loading: false,
          currentLevel: aalResult.data.currentLevel,
          nextLevel: aalResult.data.nextLevel,
          factors: factorsResult.data.all,
          error: '',
        }))
      } catch (error) {
        if (ignore) {
          return
        }

        setSecurityState((current) => ({
          ...current,
          loading: false,
          error: error.message,
        }))
      }
    }

    loadSecurityState()

    return () => {
      ignore = true
    }
  }, [cloudMode, session?.user?.id, securityRefreshNonce])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined
    }

    const previousOverflow = document.body.style.overflow

    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isMenuOpen])

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
    cloudMode &&
    (budget.openingBalance !== savedOpeningSettings.openingBalance ||
      budget.openingDate !== savedOpeningSettings.openingDate)
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
  const verifiedTotpFactors = securityState.factors.filter(
    (factor) => factor.factor_type === 'totp' && factor.status === 'verified',
  )
  const mfaPending =
    verifiedTotpFactors.length > 0 &&
    securityState.currentLevel !== 'aal2' &&
    securityState.nextLevel === 'aal2'

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
      [field]: value,
      endDate: field === 'frequency' && value === 'once' ? '' : current.endDate,
    }))
  }

  const handleAuthSubmit = async (event) => {
    event.preventDefault()

    if (!supabase) {
      return
    }

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

        const { data, error } = await supabase.auth.signUp({
          email: authForm.email,
          password: authForm.password,
          options: { emailRedirectTo: getAuthRedirectUrl() },
        })

        if (error) {
          throw error
        }

        setAuthMessage(
          data.session
            ? 'Account created and signed in.'
            : 'Account created. Check your email to confirm it.',
        )
      } else if (authMode === 'sign-in') {
        const { error } = await supabase.auth.signInWithPassword({
          email: authForm.email,
          password: authForm.password,
        })

        if (error) {
          throw error
        }
      } else if (authMode === 'forgot-password') {
        const { error } = await supabase.auth.resetPasswordForEmail(authForm.email, {
          redirectTo: getAuthRedirectUrl(),
        })

        if (error) {
          throw error
        }

        setAuthMessage('Password reset link sent. Check your inbox.')
      } else if (authMode === 'update-password') {
        if (authForm.password.length < 8) {
          throw new Error('Use at least 8 characters for the new password.')
        }

        if (authForm.password !== authForm.confirmPassword) {
          throw new Error('Password confirmation does not match.')
        }

        const { error } = await supabase.auth.updateUser({ password: authForm.password })

        if (error) {
          throw error
        }

        if (typeof window !== 'undefined') {
          window.history.replaceState({}, document.title, window.location.pathname)
        }

        setAuthMode('sign-in')
        setBudgetMessage('Password updated. You are signed in and can continue.')
      }
    } catch (error) {
      setAuthError(error.message)
    } finally {
      setAuthBusy(false)
    }
  }

  const handleSaveOpeningSettings = async () => {
    if (!cloudMode || !supabase || !session?.user?.id) {
      return
    }

    setBudgetBusy(true)
    setBudgetError('')
    setBudgetMessage('')

    try {
      const savedSettings = await saveOpeningSettings(supabase, session.user.id, {
        openingBalance: budget.openingBalance,
        openingDate: budget.openingDate,
      })

      setSavedOpeningSettings(savedSettings)
      setBudgetMessage('Opening settings saved to Supabase.')
    } catch (error) {
      setBudgetError(error.message)
    } finally {
      setBudgetBusy(false)
    }
  }

  const handleAddEvent = async (event) => {
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

    const amount =
      eventForm.direction === 'expense' ? -Math.abs(unsignedAmount) : Math.abs(unsignedAmount)

    if (!cloudMode || !supabase || !session?.user?.id) {
      const localEvent = {
        id: createLocalEventId(),
        title,
        amount,
        frequency: eventForm.frequency,
        startDate: eventForm.startDate,
        endDate: eventForm.frequency === 'once' ? '' : eventForm.endDate,
      }

      setBudget((current) => ({
        ...current,
        events: [...current.events, localEvent],
      }))
      setBudgetMessage('Recurring event saved in this browser.')
      setEventForm((current) => ({
        ...current,
        title: '',
        amount: '',
      }))
      return
    }

    setEventMutationId('create')

    try {
      const createdEvent = await createRecurringEvent(supabase, session.user.id, {
        title,
        amount,
        frequency: eventForm.frequency,
        startDate: eventForm.startDate,
        endDate: eventForm.frequency === 'once' ? '' : eventForm.endDate,
      })

      setBudget((current) => ({
        ...current,
        events: [...current.events, createdEvent],
      }))
      setEventForm((current) => ({
        ...current,
        title: '',
        amount: '',
      }))
      setBudgetMessage('Recurring event saved to Supabase.')
    } catch (error) {
      setFormError(error.message)
    } finally {
      setEventMutationId('')
    }
  }

  const handleDeleteEvent = async (eventId) => {
    if (!cloudMode || !supabase || !session?.user?.id) {
      setBudget((current) => ({
        ...current,
        events: current.events.filter((event) => event.id !== eventId),
      }))
      setBudgetMessage('Recurring event removed from this browser.')
      return
    }

    setEventMutationId(eventId)

    try {
      await deleteRecurringEvent(supabase, session.user.id, eventId)
      setBudget((current) => ({
        ...current,
        events: current.events.filter((event) => event.id !== eventId),
      }))
      setBudgetMessage('Recurring event deleted.')
    } catch (error) {
      setBudgetError(error.message)
    } finally {
      setEventMutationId('')
    }
  }

  const handleReplaceBudget = async (nextBudget, successMessage) => {
    if (!cloudMode || !supabase || !session?.user?.id) {
      const openingDate = parseISODate(nextBudget.openingDate) ?? today

      setBudget(nextBudget)
      setSavedOpeningSettings(getOpeningSettings(nextBudget))
      setBudgetError('')
      setBudgetMessage(successMessage)
      setViewMonth(startOfMonth(openingDate))
      setSelectedDate(toISODate(openingDate))
      setEventForm(createDefaultEventForm())
      setFormError('')
      return
    }

    setBudgetBusy(true)
    setBudgetError('')
    setBudgetMessage('')

    try {
      await replaceBudgetState(supabase, session.user.id, nextBudget)
      const savedBudget = await fetchBudgetState(supabase, session.user.id)
      const openingDate = parseISODate(savedBudget.openingDate) ?? today

      setBudget(savedBudget)
      setSavedOpeningSettings(getOpeningSettings(savedBudget))
      setViewMonth(startOfMonth(openingDate))
      setSelectedDate(toISODate(openingDate))
      setBudgetMessage(successMessage)
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
      !window.confirm(
        cloudMode
          ? 'Replace the current cloud budget with the demo budget?'
          : 'Replace the current local budget with the demo budget?',
      )
    ) {
      return
    }

    await handleReplaceBudget(
      createDemoBudgetState(),
      cloudMode ? 'Demo budget loaded into your account.' : 'Demo budget loaded in this browser.',
    )
  }

  const handleResetBudget = async () => {
    if (
      typeof window !== 'undefined' &&
      !window.confirm(
        cloudMode
          ? 'Clear all recurring events and reset the cloud budget?'
          : 'Clear all recurring events and reset the local budget?',
      )
    ) {
      return
    }

    await handleReplaceBudget(
      createDefaultBudgetState(),
      cloudMode ? 'Cloud budget reset.' : 'Local budget reset.',
    )
  }

  const handleSignOut = async () => {
    if (!supabase) {
      return
    }

    setBudgetBusy(true)
    const { error } = await supabase.auth.signOut()
    setBudgetBusy(false)

    if (error) {
      setBudgetError(error.message)
    }
  }

  const handleEnrollTotp = async () => {
    if (!supabase) {
      return
    }

    setMfaBusy(true)
    setSecurityState((current) => ({ ...current, error: '', message: '' }))

    try {
      for (const factor of securityState.factors.filter(
        (item) => item.factor_type === 'totp' && item.status === 'unverified',
      )) {
        await supabase.auth.mfa.unenroll({ factorId: factor.id })
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Ledger Garden',
        issuer: 'Ledger Garden',
      })

      if (error) {
        throw error
      }

      setMfaEnrollment({
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
        code: '',
      })
      setSecurityState((current) => ({
        ...current,
        message: 'Scan the QR code, then enter the 6-digit code from your authenticator app.',
      }))
      setSecurityRefreshNonce((current) => current + 1)
    } catch (error) {
      setSecurityState((current) => ({ ...current, error: error.message }))
    } finally {
      setMfaBusy(false)
    }
  }

  const handleVerifyEnrollment = async () => {
    if (!supabase || !mfaEnrollment.factorId) {
      return
    }

    setMfaBusy(true)

    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: mfaEnrollment.factorId,
        code: mfaEnrollment.code.trim(),
      })

      if (error) {
        throw error
      }

      setMfaEnrollment(DEFAULT_MFA_ENROLLMENT)
      setSecurityState((current) => ({
        ...current,
        message: '2FA is enabled. This session is now at assurance level AAL2.',
      }))
      setSecurityRefreshNonce((current) => current + 1)
    } catch (error) {
      setSecurityState((current) => ({ ...current, error: error.message }))
    } finally {
      setMfaBusy(false)
    }
  }

  const handleVerifyExistingFactor = async () => {
    if (!supabase || verifiedTotpFactors.length === 0) {
      return
    }

    setMfaBusy(true)

    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: verifiedTotpFactors[0].id,
        code: mfaChallengeCode.trim(),
      })

      if (error) {
        throw error
      }

      setMfaChallengeCode('')
      setSecurityState((current) => ({
        ...current,
        message: '2FA challenge passed for this session.',
      }))
      setSecurityRefreshNonce((current) => current + 1)
    } catch (error) {
      setSecurityState((current) => ({ ...current, error: error.message }))
    } finally {
      setMfaBusy(false)
    }
  }

  const handleRemoveTotp = async (factorId) => {
    if (!supabase) {
      return
    }

    setMfaBusy(true)

    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId })

      if (error) {
        throw error
      }

      setSecurityState((current) => ({ ...current, message: 'Authenticator factor removed.' }))
      setSecurityRefreshNonce((current) => current + 1)
    } catch (error) {
      setSecurityState((current) => ({ ...current, error: error.message }))
    } finally {
      setMfaBusy(false)
    }
  }

  if (cloudMode && !authReady) {
    return <LoadingScreen title="Connecting to Supabase" body="Checking for an existing session." />
  }

  if (cloudMode && (!session || authMode === 'update-password')) {
    return (
      <AuthScreen
        authMode={authMode}
        authForm={authForm}
        authBusy={authBusy}
        authError={authError}
        authMessage={authMessage}
        onFieldChange={updateAuthForm}
        onModeChange={setSignedOutMode}
        onSubmit={handleAuthSubmit}
      />
    )
  }

  if (cloudMode && budgetStatus === 'loading') {
    return <LoadingScreen title="Loading your budget" body="Pulling your data from Supabase." />
  }

  if (cloudMode && budgetStatus === 'error') {
    return (
      <LoadingScreen
        title="Cloud sync failed"
        body={budgetError || 'Check the Supabase schema and policies.'}
      />
    )
  }

  return (
    <main className="app-shell">
      <section className="panel hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">
            {cloudMode ? 'Server-backed budget workspace' : 'Local-first budget workspace'}
          </p>
          <h1>Ledger Garden</h1>
          <p className="hero-text">
            {cloudMode
              ? 'Your calendar is backed by Supabase Auth and Postgres. Registration, password recovery, and TOTP 2FA are wired into this app shell.'
              : 'The calendar remains fully usable in local mode. Add Supabase configuration to turn on registration, database sync, and TOTP 2FA without changing the UI.'}
          </p>
        </div>

        <div className="hero-actions">
          <button type="button" className="primary-button" onClick={() => setIsMenuOpen(true)}>
            Open budget menu
          </button>
          <p className="hero-helper">
            {cloudMode
              ? `Signed in as ${session.user.email}`
              : 'Everything is currently stored in this browser only.'}
          </p>
          <p className="hero-helper">
            {cloudMode
              ? mfaPending
                ? '2FA verification is still required for this session.'
                : 'Cloud sync is ready.'
              : 'Configure Supabase locally or in GitHub Actions to enable accounts and 2FA.'}
          </p>
        </div>
      </section>

      <CalendarPanel
        budget={budget}
        calendar={calendar}
        todayIso={todayIso}
        selectedDayIso={selectedDayIso}
        onDaySelect={(day) => {
          setSelectedDate(day.iso)

          if (!day.inCurrentMonth) {
            const dayDate = parseISODate(day.iso)

            if (dayDate) {
              setViewMonth(startOfMonth(dayDate))
            }
          }
        }}
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
        cloudMode={cloudMode}
        sessionEmail={session?.user?.email ?? ''}
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
        eventForm={eventForm}
        formError={formError}
        eventMutationId={eventMutationId}
        onUpdateEventForm={updateEventForm}
        onAddEvent={handleAddEvent}
        selectedDay={selectedDay}
        recurringEvents={recurringEvents}
        todayIso={todayIso}
        onDeleteEvent={handleDeleteEvent}
        securityState={securityState}
        verifiedTotpFactors={verifiedTotpFactors}
        mfaPending={mfaPending}
        mfaBusy={mfaBusy}
        mfaEnrollment={mfaEnrollment}
        onMfaEnrollmentCodeChange={(value) =>
          setMfaEnrollment((current) => ({ ...current, code: value }))
        }
        onEnrollTotp={handleEnrollTotp}
        onVerifyEnrollment={handleVerifyEnrollment}
        mfaChallengeCode={mfaChallengeCode}
        onMfaChallengeCodeChange={setMfaChallengeCode}
        onVerifyExistingFactor={handleVerifyExistingFactor}
        onRemoveTotp={handleRemoveTotp}
        openingBalanceDisplay={openingBalanceDisplay}
        closingBalanceDisplay={closingBalanceDisplay}
        calendarSummary={calendar.summary}
      />
    </main>
  )
}

export default App
