import { useEffect, useRef } from 'react'
import EventIcon from './EventIcon.jsx'
import {
  EVENT_ICON_OPTIONS,
  WEEKDAY_OPTIONS,
  describeFrequency,
  formatShortDate,
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

export default function EventEditor({
  isOpen,
  onClose,
  eventForm,
  editingEventId,
  formError,
  eventMutationId,
  eventFormFocusKey,
  onUpdateEventForm,
  onSubmitEvent,
  onCancelEventEdit,
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
        aria-label="Close event editor"
        tabIndex={isOpen ? 0 : -1}
        onClick={onClose}
      />

      <aside className="menu-drawer" role="dialog" aria-modal="true" aria-label="Event editor">
        <div className="menu-body">
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
        </div>
      </aside>
    </div>
  )
}
