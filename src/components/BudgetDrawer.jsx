import { useEffect, useRef } from 'react'
import EventIcon from './EventIcon.jsx'
import {
  EVENT_ICON_OPTIONS,
  WEEKDAY_OPTIONS,
  describeFrequency,
  formatCurrency,
  formatLongDate,
  formatShortDate,
  formatSignedCurrency,
  getNextOccurrence,
  getWeekdayLabel,
} from '../lib/budget.js'

const EVENT_REPEAT_OPTIONS = [
  { value: 'once', label: 'One time' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'daily', label: 'Daily' },
  { value: 'yearly', label: 'Yearly' },
]

const WEEK_INTERVAL_OPTIONS = [
  { value: '1', label: '1 week' },
  { value: '2', label: '2 weeks' },
]

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

function formatVerificationDate(value) {
  if (!value) {
    return 'Pending'
  }

  return new Date(value).toLocaleDateString('en-IE')
}

function getPreviewFrequency(eventForm) {
  return eventForm.frequency === 'weekly' && eventForm.intervalWeeks === '2'
    ? 'biweekly'
    : eventForm.frequency
}

function buildSchedulePreview(eventForm) {
  if (eventForm.frequency === 'monthly' && eventForm.scheduleType !== 'weekday') {
    return 'Monthly at this date'
  }

  if (eventForm.frequency === 'weekly') {
    const weekdayLabel = getWeekdayLabel(eventForm.weekday) || 'this weekday'
    const intervalLabel = eventForm.intervalWeeks === '2' ? 'Every 2 weeks' : 'Every week'

    return `Every ${weekdayLabel} | ${intervalLabel}`
  }

  if (
    (eventForm.frequency === 'monthly' || eventForm.frequency === 'yearly') &&
    eventForm.scheduleType === 'weekday'
  ) {
    return `Legacy rule | ${describeFrequency({
      title: 'Preview',
      amount: 1,
      frequency: getPreviewFrequency(eventForm),
      scheduleType: eventForm.scheduleType,
      weekday: eventForm.weekday,
      weekdayOrdinal: eventForm.weekdayOrdinal,
      icon: eventForm.icon,
      startDate: eventForm.startDate,
      endDate: eventForm.endDate,
    })}`
  }

  return describeFrequency({
    title: 'Preview',
    amount: 1,
    frequency: getPreviewFrequency(eventForm),
    scheduleType: eventForm.scheduleType,
    weekday: eventForm.weekday,
    weekdayOrdinal: eventForm.weekdayOrdinal,
    icon: eventForm.icon,
    startDate: eventForm.startDate,
    endDate: eventForm.endDate,
  })
}

function StaticField({ label, value }) {
  return (
    <div className="field field-static">
      <span className="field-label">{label}</span>
      <div className="field-note">{value}</div>
    </div>
  )
}

function EventRuleFields({ eventForm, onUpdateEventForm }) {
  const isMonthlyOrYearly = eventForm.frequency === 'monthly' || eventForm.frequency === 'yearly'
  const isLegacyWeekdayPattern = isMonthlyOrYearly && eventForm.scheduleType === 'weekday'
  const showEndDate = eventForm.frequency !== 'once'

  return (
    <>
      <div className="field-grid">
        <label className="field">
          <span className="field-label">Repeat</span>
          <select
            value={eventForm.frequency}
            onChange={(event) => onUpdateEventForm('frequency', event.target.value)}
          >
            {EVENT_REPEAT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field-label">Starting date</span>
          <input
            type="date"
            value={eventForm.startDate}
            onChange={(event) => onUpdateEventForm('startDate', event.target.value)}
          />
        </label>
      </div>

      {eventForm.frequency === 'weekly' ? (
        <>
          <div className="field-grid">
            <label className="field">
              <span className="field-label">Every</span>
              <select
                value={eventForm.weekday}
                onChange={(event) => onUpdateEventForm('weekday', event.target.value)}
              >
                {WEEKDAY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="field-label">Week interval</span>
              <select
                value={eventForm.intervalWeeks}
                onChange={(event) => onUpdateEventForm('intervalWeeks', event.target.value)}
              >
                {WEEK_INTERVAL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {showEndDate ? (
            <label className="field">
              <span className="field-label">End date (optional)</span>
              <input
                type="date"
                value={eventForm.endDate}
                onChange={(event) => onUpdateEventForm('endDate', event.target.value)}
              />
            </label>
          ) : null}
        </>
      ) : null}

      {eventForm.frequency === 'monthly' ? (
        <div className="field-grid">
          <StaticField
            label={isLegacyWeekdayPattern ? 'Legacy rule' : 'Rule'}
            value={isLegacyWeekdayPattern ? buildSchedulePreview(eventForm) : 'Monthly at this date'}
          />

          {showEndDate ? (
            <label className="field">
              <span className="field-label">End date (optional)</span>
              <input
                type="date"
                value={eventForm.endDate}
                onChange={(event) => onUpdateEventForm('endDate', event.target.value)}
              />
            </label>
          ) : null}
        </div>
      ) : null}

      {eventForm.frequency === 'daily' ? (
        <div className="field-grid">
          <StaticField label="Rule" value="Every day" />

          {showEndDate ? (
            <label className="field">
              <span className="field-label">End date (optional)</span>
              <input
                type="date"
                value={eventForm.endDate}
                onChange={(event) => onUpdateEventForm('endDate', event.target.value)}
              />
            </label>
          ) : null}
        </div>
      ) : null}

      {eventForm.frequency === 'yearly' ? (
        <div className="field-grid">
          <StaticField
            label={isLegacyWeekdayPattern ? 'Legacy rule' : 'Rule'}
            value={isLegacyWeekdayPattern ? buildSchedulePreview(eventForm) : 'Yearly on this date'}
          />

          {showEndDate ? (
            <label className="field">
              <span className="field-label">End date (optional)</span>
              <input
                type="date"
                value={eventForm.endDate}
                onChange={(event) => onUpdateEventForm('endDate', event.target.value)}
              />
            </label>
          ) : null}
        </div>
      ) : null}
    </>
  )
}

function IconPicker({ value, onChange }) {
  return (
    <div className="field">
      <span className="field-label">Icon</span>
      <div className="icon-grid" role="list" aria-label="Event icon options">
        {EVENT_ICON_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`icon-option ${value === option.value ? 'is-selected' : ''}`}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            <EventIcon icon={option.value} />
            <span className="icon-option-label">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function BudgetDrawer({
  isOpen,
  sessionEmail,
  sessionVerifiedAt,
  mailboxUrl,
  budget,
  budgetBusy,
  budgetError,
  budgetMessage,
  openingSettingsDirty,
  onClose,
  onSignOut,
  onLoadDemoBudget,
  onResetBudget,
  onUpdateBudgetValue,
  onSaveOpeningSettings,
  eventForm,
  editingEventId,
  formError,
  eventMutationId,
  eventFormFocusKey,
  onUpdateEventForm,
  onSubmitEvent,
  onEditEvent,
  onCancelEventEdit,
  selectedDay,
  recurringEvents,
  todayIso,
  onDeleteEvent,
  openingBalanceDisplay,
  closingBalanceDisplay,
  calendarSummary,
}) {
  const isEditingEvent = Boolean(editingEventId)
  const isSavingEvent = eventMutationId === (editingEventId || 'create')
  const schedulePreview = buildSchedulePreview(eventForm)
  const eventCardRef = useRef(null)
  const eventTitleInputRef = useRef(null)
  const scheduleWindow = [
    eventForm.startDate ? `Starts ${formatShortDate(eventForm.startDate)}` : '',
    eventForm.endDate ? `Ends ${formatShortDate(eventForm.endDate)}` : '',
  ]
    .filter(Boolean)
    .join(' | ')

  useEffect(() => {
    if (!isOpen || eventFormFocusKey === 0 || typeof window === 'undefined') {
      return undefined
    }

    const frameId = window.requestAnimationFrame(() => {
      eventCardRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
      eventTitleInputRef.current?.focus()
      eventTitleInputRef.current?.select?.()
    })

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [isOpen, eventFormFocusKey])

  return (
    <div className={`menu-shell ${isOpen ? 'is-open' : ''}`} aria-hidden={!isOpen}>
      <button
        type="button"
        className="menu-backdrop"
        aria-label="Close workspace menu"
        tabIndex={isOpen ? 0 : -1}
        onClick={onClose}
      />

      <aside className="menu-drawer" role="dialog" aria-modal="true" aria-label="Workspace menu">
        <div className="menu-header">
          <div>
            <p className="section-kicker">Workspace</p>
            <h2>Budget controls</h2>
            <p className="menu-subtitle">{sessionEmail}</p>
          </div>

          <button type="button" className="ghost-button ghost-button-small" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="menu-body">
          {budgetError ? <p className="status-banner status-banner-error">{budgetError}</p> : null}
          {budgetMessage ? <p className="status-banner status-banner-success">{budgetMessage}</p> : null}

          <section className="drawer-card">
            <div className="panel-heading panel-heading-compact">
              <div>
                <p className="section-kicker">Month snapshot</p>
                <h3>{calendarSummary.hasActiveDays ? 'Active month' : 'Waiting to start'}</h3>
              </div>
            </div>

            <div className="drawer-summary" aria-label="Month summary">
              <SummaryCard
                label="Opening balance"
                value={openingBalanceDisplay}
                detail="Balance before this month's scheduled transactions."
              />
              <SummaryCard
                label="Inflow"
                value={formatSignedCurrency(calendarSummary.income)}
                detail="Recurring income inside the visible month."
                tone="positive"
              />
              <SummaryCard
                label="Outflow"
                value={formatSignedCurrency(calendarSummary.expenses)}
                detail="Recurring costs inside the visible month."
                tone="negative"
              />
              <SummaryCard
                label="Closing balance"
                value={closingBalanceDisplay}
                detail={
                  calendarSummary.hasActiveDays
                    ? `Net change ${formatSignedCurrency(calendarSummary.net)}`
                    : `Budget starts ${formatShortDate(budget.openingDate)}`
                }
                tone="accent"
              />
            </div>
          </section>

          <section ref={eventCardRef} className="drawer-card">
            <div className="panel-heading panel-heading-compact">
              <div>
                <p className="section-kicker">
                  {isEditingEvent ? 'Edit recurring event' : 'Add recurring event'}
                </p>
                <h3>{isEditingEvent ? 'Update cash flow' : 'Schedule cash flow'}</h3>
              </div>

              {isEditingEvent ? (
                <button
                  type="button"
                  className="ghost-button ghost-button-small"
                  onClick={onCancelEventEdit}
                >
                  Cancel edit
                </button>
              ) : null}
            </div>

            <form className="event-form" onSubmit={onSubmitEvent}>
              <label className="field">
                <span className="field-label">Label</span>
                <input
                  ref={eventTitleInputRef}
                  type="text"
                  value={eventForm.title}
                  placeholder="Salary, rent, subscriptions"
                  onChange={(event) => onUpdateEventForm('title', event.target.value)}
                />
              </label>

              <div className="field-grid">
                <label className="field">
                  <span className="field-label">Type</span>
                  <select
                    value={eventForm.direction}
                    onChange={(event) => onUpdateEventForm('direction', event.target.value)}
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
                    onChange={(event) => onUpdateEventForm('amount', event.target.value)}
                  />
                </label>
              </div>

              <EventRuleFields eventForm={eventForm} onUpdateEventForm={onUpdateEventForm} />

              <IconPicker value={eventForm.icon} onChange={(icon) => onUpdateEventForm('icon', icon)} />

              <p className="helper-copy helper-copy-compact">
                {schedulePreview}
                {scheduleWindow ? ` | ${scheduleWindow}` : ''}
              </p>

              {formError ? <p className="status-banner status-banner-error">{formError}</p> : null}

              <div className="section-actions">
                <button type="submit" className="primary-button" disabled={isSavingEvent}>
                  {isSavingEvent
                    ? 'Saving...'
                    : isEditingEvent
                      ? 'Save changes'
                      : 'Add to calendar'}
                </button>

                <span className="detail-item-meta">
                  {isEditingEvent ? 'Editing the selected rule' : 'New rules save directly to your account'}
                </span>
              </div>
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
                      <li key={`${selectedDay.iso}-${occurrence.id}`}>
                        <button
                          type="button"
                          className="detail-item detail-item-button"
                          onClick={() => onEditEvent(occurrence)}
                        >
                          <div className="event-heading">
                            <EventIcon icon={occurrence.icon} />
                            <div>
                              <p className="detail-item-title">{occurrence.title}</p>
                              <p className="detail-item-meta">{describeFrequency(occurrence)}</p>
                            </div>
                          </div>
                          <AmountBadge amount={occurrence.amount} />
                        </button>
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
                  const isBusy = eventMutationId === event.id

                  return (
                    <article
                      key={event.id}
                      className={`event-row ${editingEventId === event.id ? 'is-editing' : ''}`}
                    >
                      <div className="event-row-main">
                        <div className="event-row-top">
                          <div className="event-heading">
                            <EventIcon icon={event.icon} />
                            <div>
                              <p className="event-title">{event.title}</p>
                              <p className="event-meta">{describeFrequency(event)}</p>
                            </div>
                          </div>
                          <AmountBadge amount={event.amount} />
                        </div>

                        <p className="event-meta">
                          Starts {formatShortDate(event.startDate)}
                          {event.endDate ? ` | Ends ${formatShortDate(event.endDate)}` : ''}
                        </p>
                        <p className="event-meta">
                          {nextOccurrence
                            ? `Next occurrence: ${formatLongDate(nextOccurrence)}`
                            : 'No future occurrence remains.'}
                        </p>
                      </div>

                      <div className="event-row-actions">
                        <button
                          type="button"
                          className="ghost-button ghost-button-small"
                          disabled={isBusy}
                          onClick={() => onEditEvent(event)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="ghost-button ghost-button-small"
                          disabled={isBusy}
                          onClick={() => onDeleteEvent(event.id)}
                        >
                          {isBusy ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>

          <section className="drawer-card">
            <div className="panel-heading panel-heading-compact">
              <div>
                <p className="section-kicker">Opening settings</p>
                <h3>Budget baseline</h3>
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
                    onUpdateBudgetValue(
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
                  onChange={(event) => onUpdateBudgetValue('openingDate', event.target.value)}
                />
              </label>
            </div>

            <div className="section-actions">
              <button
                type="button"
                className="primary-button"
                disabled={budgetBusy || !openingSettingsDirty}
                onClick={onSaveOpeningSettings}
              >
                {budgetBusy ? 'Saving...' : 'Save opening settings'}
              </button>

              <span className="detail-item-meta">
                {openingSettingsDirty ? 'Unsaved changes' : 'Saved'}
              </span>
            </div>
          </section>

          <section className="drawer-card">
            <div className="panel-heading panel-heading-compact">
              <div>
                <p className="section-kicker">Account and tools</p>
                <h3>{sessionEmail}</h3>
              </div>
              <button
                type="button"
                className="ghost-button ghost-button-small"
                disabled={budgetBusy}
                onClick={onSignOut}
              >
                Sign out
              </button>
            </div>

            <div className="detail-balance-row">
              <article className="detail-stat">
                <span className="detail-label">Storage</span>
                <p className="detail-value">SQLite on this machine</p>
              </article>

              <article className="detail-stat">
                <span className="detail-label">Email verified</span>
                <p className="detail-value">{formatVerificationDate(sessionVerifiedAt)}</p>
              </article>
            </div>

            <div className="section-actions">
              <a
                href={mailboxUrl}
                className="ghost-button button-link"
                target="_blank"
                rel="noreferrer"
              >
                Open local mailbox
              </a>
              <button
                type="button"
                className="ghost-button"
                disabled={budgetBusy}
                onClick={onLoadDemoBudget}
              >
                Load demo budget
              </button>
              <button
                type="button"
                className="ghost-button"
                disabled={budgetBusy}
                onClick={onResetBudget}
              >
                Reset saved budget
              </button>
            </div>
          </section>
        </div>
      </aside>
    </div>
  )
}
