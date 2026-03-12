import { useEffect, useState } from 'react'
import {
  FREQUENCY_OPTIONS,
  WEEKDAY_LABELS,
  addMonths,
  buildCalendarModel,
  coerceBudgetState,
  createDefaultBudgetState,
  createDemoBudgetState,
  describeFrequency,
  formatCurrency,
  formatLongDate,
  formatShortDate,
  formatSignedCurrency,
  getNextOccurrence,
  parseISODate,
  startOfMonth,
  startOfToday,
  toISODate,
} from './lib/budget.js'

const STORAGE_KEY = 'ledger-garden-budget-v1'

function loadStoredBudget() {
  if (typeof window === 'undefined') {
    return createDefaultBudgetState()
  }

  try {
    const storedState = window.localStorage.getItem(STORAGE_KEY)
    return storedState ? coerceBudgetState(JSON.parse(storedState)) : createDefaultBudgetState()
  } catch {
    return createDefaultBudgetState()
  }
}

function createEventId() {
  return globalThis.crypto?.randomUUID?.() ?? `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
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

function SummaryCard({ label, value, detail, tone = 'neutral' }) {
  return (
    <article className={`summary-card summary-card-${tone}`}>
      <span className="summary-label">{label}</span>
      <p className="summary-value">{value}</p>
      <p className="summary-detail">{detail}</p>
    </article>
  )
}

function AmountBadge({ amount }) {
  const tone = amount > 0 ? 'positive' : amount < 0 ? 'negative' : 'neutral'

  return <span className={`amount-badge amount-badge-${tone}`}>{formatSignedCurrency(amount)}</span>
}

function App() {
  const today = startOfToday()
  const todayIso = toISODate(today)
  const [budget, setBudget] = useState(loadStoredBudget)
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(today))
  const [selectedDate, setSelectedDate] = useState(todayIso)
  const [eventForm, setEventForm] = useState(createDefaultEventForm)
  const [formError, setFormError] = useState('')
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(budget))
    } catch {
      // Ignore storage errors and keep the app usable.
    }
  }, [budget])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined
    }

    const { body } = document
    const previousOverflow = body.style.overflow

    if (isMenuOpen) {
      body.style.overflow = 'hidden'
    }

    return () => {
      body.style.overflow = previousOverflow
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

  const openMenu = () => {
    setIsMenuOpen(true)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const updateBudgetValue = (field, value) => {
    setBudget((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const updateEventForm = (field, value) => {
    setFormError('')
    setEventForm((current) => {
      const nextState = {
        ...current,
        [field]: value,
      }

      if (field === 'frequency' && value === 'once') {
        nextState.endDate = ''
      }

      return nextState
    })
  }

  const handleDaySelect = (day) => {
    setSelectedDate(day.iso)

    if (!day.inCurrentMonth) {
      const dayDate = parseISODate(day.iso)

      if (dayDate) {
        setViewMonth(startOfMonth(dayDate))
      }
    }
  }

  const handleShiftMonth = (direction) => {
    setViewMonth((current) => startOfMonth(addMonths(current, direction)))
  }

  const handleJumpToToday = () => {
    setViewMonth(startOfMonth(today))
    setSelectedDate(todayIso)
  }

  const handleAddEvent = (submitEvent) => {
    submitEvent.preventDefault()

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

    if (!eventForm.startDate) {
      setFormError('Pick a start date for the schedule.')
      return
    }

    if (eventForm.endDate && eventForm.endDate < eventForm.startDate) {
      setFormError('The end date must be on or after the start date.')
      return
    }

    const amount =
      eventForm.direction === 'expense' ? -Math.abs(unsignedAmount) : Math.abs(unsignedAmount)

    setBudget((current) => ({
      ...current,
      events: [
        ...current.events,
        {
          id: createEventId(),
          title,
          amount,
          frequency: eventForm.frequency,
          startDate: eventForm.startDate,
          endDate: eventForm.frequency === 'once' ? '' : eventForm.endDate,
        },
      ],
    }))

    setEventForm((current) => ({
      ...current,
      title: '',
      amount: '',
    }))
  }

  const handleDeleteEvent = (eventId) => {
    setBudget((current) => ({
      ...current,
      events: current.events.filter((event) => event.id !== eventId),
    }))
  }

  const handleLoadDemoBudget = () => {
    const demoBudget = createDemoBudgetState()
    const demoDate = parseISODate(demoBudget.openingDate) ?? today

    setBudget(demoBudget)
    setViewMonth(startOfMonth(demoDate))
    setSelectedDate(todayIso)
    setEventForm(createDefaultEventForm())
    setFormError('')
    closeMenu()
  }

  const handleResetBudget = () => {
    if (typeof window !== 'undefined') {
      const shouldReset = window.confirm('Clear all recurring events and reset the budget?')

      if (!shouldReset) {
        return
      }
    }

    const freshBudget = createDefaultBudgetState()
    const freshDate = parseISODate(freshBudget.openingDate) ?? today

    setBudget(freshBudget)
    setViewMonth(startOfMonth(freshDate))
    setSelectedDate(freshBudget.openingDate)
    setEventForm(createDefaultEventForm())
    setFormError('')
    closeMenu()
  }

  const openingBalanceDisplay =
    calendar.summary.openingBalanceForMonth === null
      ? `Starts ${formatShortDate(budget.openingDate)}`
      : formatCurrency(calendar.summary.openingBalanceForMonth)
  const closingBalanceDisplay =
    calendar.summary.closingBalance === null
      ? 'Budget not active'
      : formatCurrency(calendar.summary.closingBalance)

  return (
    <main className="app-shell">
      <section className="panel hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Calendar budget planner</p>
          <h1>Ledger Garden</h1>
          <p className="hero-text">
            The calendar now stays full-width. Budget controls, balances, and recurring event
            management live in a separate slide-out menu.
          </p>
        </div>

        <div className="hero-actions">
          <button
            type="button"
            className="primary-button"
            aria-haspopup="dialog"
            aria-expanded={isMenuOpen}
            onClick={openMenu}
          >
            Open budget menu
          </button>
          <p className="hero-helper">
            Opening balance, selected-day detail, and recurring events are all inside the menu.
          </p>
        </div>
      </section>

      <section className="panel calendar-panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Monthly view</p>
            <h2>{calendar.monthLabel}</h2>
          </div>

          <div className="calendar-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => handleShiftMonth(-1)}
            >
              Previous
            </button>
            <button type="button" className="secondary-button" onClick={handleJumpToToday}>
              Today
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => handleShiftMonth(1)}
            >
              Next
            </button>
            <button
              type="button"
              className="primary-button"
              aria-haspopup="dialog"
              aria-expanded={isMenuOpen}
              onClick={openMenu}
            >
              Budget menu
            </button>
          </div>
        </div>

        <div className="weekday-row" aria-hidden="true">
          {WEEKDAY_LABELS.map((label) => (
            <span key={label} className="weekday-pill">
              {label}
            </span>
          ))}
        </div>

        <div className="calendar-scroll">
          <div className="calendar-grid">
            {calendar.days.map((day) => {
              const classNames = ['day-card']

              if (!day.inCurrentMonth) {
                classNames.push('is-outside')
              }

              if (day.iso === selectedDayIso) {
                classNames.push('is-selected')
              }

              if (day.iso === todayIso) {
                classNames.push('is-today')
              }

              if (day.balance === null) {
                classNames.push('is-empty')
              }

              return (
                <button
                  key={day.iso}
                  type="button"
                  className={classNames.join(' ')}
                  aria-pressed={day.iso === selectedDayIso}
                  title={formatLongDate(day.iso)}
                  onClick={() => handleDaySelect(day)}
                >
                  <div className="day-card-top">
                    <span className="day-number">{day.dayNumber}</span>
                    <span className="day-stamp">
                      {day.iso === todayIso
                        ? 'Today'
                        : day.inCurrentMonth
                          ? formatShortDate(day.iso)
                          : 'Carry-over'}
                    </span>
                  </div>

                  <div className="day-balance-group">
                    <span className="day-balance-label">Closing balance</span>
                    <p className="day-balance">
                      {day.balance === null
                        ? `Starts ${formatShortDate(budget.openingDate)}`
                        : formatCurrency(day.balance)}
                    </p>
                  </div>

                  <p
                    className={`day-change ${
                      day.dayChange > 0 ? 'is-positive' : day.dayChange < 0 ? 'is-negative' : ''
                    }`}
                  >
                    {day.balance === null
                      ? 'No balance yet'
                      : day.dayChange === 0
                        ? 'No scheduled change'
                        : formatSignedCurrency(day.dayChange)}
                  </p>

                  <div className="day-events">
                    {day.events.length === 0 ? (
                      <span className="empty-copy">
                        {day.balance === null ? 'Budget not active yet' : 'No recurring items'}
                      </span>
                    ) : (
                      day.events.slice(0, 3).map((occurrence) => (
                        <span
                          key={`${day.iso}-${occurrence.id}`}
                          className={`transaction-chip ${
                            occurrence.amount > 0 ? 'is-positive' : 'is-negative'
                          }`}
                        >
                          <span className="transaction-title">{occurrence.title}</span>
                          <span className="transaction-amount">
                            {formatSignedCurrency(occurrence.amount)}
                          </span>
                        </span>
                      ))
                    )}

                    {day.events.length > 3 ? (
                      <span className="more-events">+{day.events.length - 3} more</span>
                    ) : null}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <div className={`menu-shell ${isMenuOpen ? 'is-open' : ''}`} aria-hidden={!isMenuOpen}>
        <button
          type="button"
          className="menu-backdrop"
          aria-label="Close budget menu"
          tabIndex={isMenuOpen ? 0 : -1}
          onClick={closeMenu}
        />

        <aside className="menu-drawer" role="dialog" aria-modal="true" aria-label="Budget menu">
          <div className="menu-header">
            <div>
              <p className="section-kicker">Budget menu</p>
              <h2>Controls and details</h2>
            </div>

            <button type="button" className="ghost-button ghost-button-small" onClick={closeMenu}>
              Close
            </button>
          </div>

          <div className="menu-body">
            <div className="drawer-summary" aria-label="Month summary">
              <SummaryCard
                label="Opening balance"
                value={openingBalanceDisplay}
                detail="Balance before this month's scheduled transactions."
              />
              <SummaryCard
                label="Inflow this month"
                value={formatSignedCurrency(calendar.summary.income)}
                detail="Recurring income scheduled inside the visible month."
                tone="positive"
              />
              <SummaryCard
                label="Outflow this month"
                value={formatSignedCurrency(calendar.summary.expenses)}
                detail="Recurring costs scheduled inside the visible month."
                tone="negative"
              />
              <SummaryCard
                label="Closing balance"
                value={closingBalanceDisplay}
                detail={
                  calendar.summary.hasActiveDays
                    ? `Net change ${formatSignedCurrency(calendar.summary.net)}`
                    : `Budget starts ${formatShortDate(budget.openingDate)}`
                }
                tone="accent"
              />
            </div>

            <div className="menu-quick-actions">
              <button type="button" className="primary-button" onClick={handleLoadDemoBudget}>
                Load demo budget
              </button>
              <button type="button" className="ghost-button" onClick={handleResetBudget}>
                Reset budget
              </button>
            </div>

            <section className="drawer-card">
              <div className="panel-heading panel-heading-compact">
                <div>
                  <p className="section-kicker">Budget baseline</p>
                  <h3>Opening settings</h3>
                </div>
              </div>

              <div className="field-grid">
                <label className="field">
                  <span className="field-label">Opening balance</span>
                  <input
                    type="number"
                    step="0.01"
                    value={budget.openingBalance}
                    onChange={(event) =>
                      updateBudgetValue(
                        'openingBalance',
                        event.target.value === '' ? 0 : Number(event.target.value),
                      )
                    }
                  />
                </label>

                <label className="field">
                  <span className="field-label">Opening date</span>
                  <input
                    type="date"
                    value={budget.openingDate}
                    onChange={(event) => updateBudgetValue('openingDate', event.target.value)}
                  />
                </label>
              </div>

              <p className="helper-copy">
                Days before the opening date stay empty. Every later day shows the projected
                closing balance after recurring transactions land.
              </p>
            </section>

            <section className="drawer-card">
              <div className="panel-heading panel-heading-compact">
                <div>
                  <p className="section-kicker">Add recurring event</p>
                  <h3>Schedule cash flow</h3>
                </div>
              </div>

              <form className="event-form" onSubmit={handleAddEvent}>
                <label className="field">
                  <span className="field-label">Label</span>
                  <input
                    type="text"
                    value={eventForm.title}
                    placeholder="Salary, rent, internal bill..."
                    onChange={(event) => updateEventForm('title', event.target.value)}
                  />
                </label>

                <div className="field-grid">
                  <label className="field">
                    <span className="field-label">Type</span>
                    <select
                      value={eventForm.direction}
                      onChange={(event) => updateEventForm('direction', event.target.value)}
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </label>

                  <label className="field">
                    <span className="field-label">Amount</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={eventForm.amount}
                      placeholder="45"
                      onChange={(event) => updateEventForm('amount', event.target.value)}
                    />
                  </label>
                </div>

                <div className="field-grid">
                  <label className="field">
                    <span className="field-label">Repeat</span>
                    <select
                      value={eventForm.frequency}
                      onChange={(event) => updateEventForm('frequency', event.target.value)}
                    >
                      {FREQUENCY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="field">
                    <span className="field-label">Start date</span>
                    <input
                      type="date"
                      value={eventForm.startDate}
                      onChange={(event) => updateEventForm('startDate', event.target.value)}
                    />
                  </label>
                </div>

                <label className="field">
                  <span className="field-label">End date (optional)</span>
                  <input
                    type="date"
                    value={eventForm.endDate}
                    disabled={eventForm.frequency === 'once'}
                    onChange={(event) => updateEventForm('endDate', event.target.value)}
                  />
                </label>

                {formError ? (
                  <p className="form-error" role="alert">
                    {formError}
                  </p>
                ) : null}

                <button type="submit" className="primary-button">
                  Add to calendar
                </button>
              </form>
            </section>

            <section className="drawer-card">
              <div className="panel-heading panel-heading-compact">
                <div>
                  <p className="section-kicker">Selected day</p>
                  <h3>{selectedDay ? formatLongDate(selectedDay.iso) : 'Pick a day'}</h3>
                </div>
                {selectedDay ? <AmountBadge amount={selectedDay.dayChange} /> : null}
              </div>

              {selectedDay ? (
                <>
                  <div className="detail-balance-row">
                    <article className="detail-stat">
                      <span className="detail-label">Closing balance</span>
                      <p className="detail-value">
                        {selectedDay.balance === null
                          ? 'Budget not active'
                          : formatCurrency(selectedDay.balance)}
                      </p>
                    </article>

                    <article className="detail-stat">
                      <span className="detail-label">Day change</span>
                      <p className="detail-value">{formatSignedCurrency(selectedDay.dayChange)}</p>
                    </article>
                  </div>

                  {selectedDay.events.length === 0 ? (
                    <p className="empty-copy empty-copy-block">
                      {selectedDay.balance === null
                        ? `Balances start on ${formatLongDate(budget.openingDate)}.`
                        : 'No recurring transactions are scheduled for this day.'}
                    </p>
                  ) : (
                    <ul className="detail-list">
                      {selectedDay.events.map((occurrence) => (
                        <li key={`${selectedDay.iso}-${occurrence.id}`} className="detail-item">
                          <div>
                            <p className="detail-item-title">{occurrence.title}</p>
                            <p className="detail-item-meta">
                              {describeFrequency(occurrence)} - lands on this date
                            </p>
                          </div>
                          <AmountBadge amount={occurrence.amount} />
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <p className="empty-copy empty-copy-block">Select a day to inspect it.</p>
              )}
            </section>

            <section className="drawer-card">
              <div className="panel-heading panel-heading-compact">
                <div>
                  <p className="section-kicker">Recurring events</p>
                  <h3>
                    {budget.events.length} active {budget.events.length === 1 ? 'item' : 'items'}
                  </h3>
                </div>
              </div>

              {recurringEvents.length === 0 ? (
                <p className="empty-copy empty-copy-block">
                  Add a bill, salary, or one-time entry to start projecting the calendar.
                </p>
              ) : (
                <div className="event-list">
                  {recurringEvents.map((event) => {
                    const nextOccurrence = getNextOccurrence(event, todayIso)

                    return (
                      <article key={event.id} className="event-row">
                        <div className="event-row-main">
                          <div className="event-row-top">
                            <p className="event-title">{event.title}</p>
                            <AmountBadge amount={event.amount} />
                          </div>

                          <p className="event-meta">
                            {describeFrequency(event)} - starts {formatShortDate(event.startDate)}
                            {event.endDate ? ` - ends ${formatShortDate(event.endDate)}` : ''}
                          </p>
                          <p className="event-meta">
                            {nextOccurrence
                              ? `Next occurrence: ${formatLongDate(nextOccurrence)}`
                              : 'No future occurrence remains.'}
                          </p>
                        </div>

                        <button
                          type="button"
                          className="ghost-button ghost-button-small"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          Delete
                        </button>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          </div>
        </aside>
      </div>
    </main>
  )
}

export default App
