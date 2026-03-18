import { useState } from 'react'
import EventIcon from './EventIcon.jsx'

function IconButton({ label, onClick, children }) {
  return (
    <button type="button" className="toolbar-icon-button" aria-label={label} onClick={onClick}>
      {children}
    </button>
  )
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  )
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  )
}

function handleDayCardKeyDown(event, onActivate) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    onActivate()
  }
}

export default function CalendarPanel({
  sessionEmail,
  budget,
  calendar,
  todayIso,
  selectedDayIso,
  closingBalanceDisplay,
  onDaySelect,
  onDayAdd,
  onDayEventSelect,
  onShiftMonth,
  onJumpToToday,
  onOpenMenu,
  formatCurrency,
  formatLongDate,
  formatShortDate,
  formatSignedCurrency,
  WEEKDAY_LABELS,
}) {
  const [hoveredDayIso, setHoveredDayIso] = useState('')
  const heading =
    calendar.summary.closingBalance === null
      ? 'Budlendar'
      : `Budlendar (${closingBalanceDisplay})`

  return (
    <section className="panel calendar-panel">
      <header className="calendar-toolbar">
        <button
          type="button"
          className="menu-toggle"
          aria-label="Open workspace menu"
          onClick={onOpenMenu}
        >
          <MenuIcon />
        </button>

        <div className="calendar-brand">
          <p className="calendar-brand-kicker">Local budget calendar</p>
          <h1>{heading}</h1>
          <p className="calendar-brand-subtitle">{sessionEmail}</p>
        </div>

        <div className="calendar-toolbar-actions">
          <div className="toolbar-chip-row">
            <span className="toolbar-chip">
              {calendar.summary.scheduledItems} scheduled{' '}
              {calendar.summary.scheduledItems === 1 ? 'item' : 'items'}
            </span>
            <span
              className={`toolbar-chip ${
                calendar.summary.net > 0
                  ? 'is-positive'
                  : calendar.summary.net < 0
                    ? 'is-negative'
                    : ''
              }`}
            >
              Net {formatSignedCurrency(calendar.summary.net)}
            </span>
          </div>

          <div className="month-controls">
            <IconButton label="Previous month" onClick={() => onShiftMonth(-1)}>
              <ChevronLeftIcon />
            </IconButton>

            <h2 className="month-label">{calendar.monthLabel}</h2>

            <IconButton label="Next month" onClick={() => onShiftMonth(1)}>
              <ChevronRightIcon />
            </IconButton>

            <button type="button" className="secondary-button today-button" onClick={onJumpToToday}>
              Today
            </button>
          </div>
        </div>
      </header>

      <div className="calendar-grid-shell">
        <div className="weekday-row" aria-hidden="true">
          {WEEKDAY_LABELS.map((label) => (
            <span key={label} className="weekday-pill">
              {label}
            </span>
          ))}
        </div>

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
              <article
                key={day.iso}
                className={classNames.join(' ')}
                aria-pressed={day.iso === selectedDayIso}
                onMouseEnter={() => setHoveredDayIso(day.iso)}
                onMouseLeave={() => setHoveredDayIso('')}
              >
                <div
                  className="day-card-surface"
                  role="button"
                  tabIndex={0}
                  title={formatLongDate(day.iso)}
                  aria-label={`Select ${formatLongDate(day.iso)}`}
                  onClick={() => onDaySelect(day)}
                  onKeyDown={(event) => handleDayCardKeyDown(event, () => onDaySelect(day))}
                >
                  <div className="day-card-top">
                    <span className="day-number">{day.dayNumber}</span>
                    <div className="day-card-actions">
                      <span className="day-balance">
                        {day.balance === null
                          ? `Starts ${formatShortDate(budget.openingDate)}`
                          : formatCurrency(day.balance)}
                      </span>
                      {hoveredDayIso === day.iso ? (
                        <button
                          type="button"
                          className="day-add-button"
                          aria-label={`Add event on ${formatLongDate(day.iso)}`}
                          title={`Add event on ${formatLongDate(day.iso)}`}
                          onClick={(event) => {
                            event.stopPropagation()
                            onDayAdd(day)
                          }}
                        >
                          <PlusIcon />
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="day-events">
                  {day.events.slice(0, 3).map((occurrence) => (
                    <button
                      key={`${day.iso}-${occurrence.id}`}
                      type="button"
                      className={`day-event-row day-event-button ${
                        occurrence.amount > 0 ? 'is-positive' : 'is-negative'
                      }`}
                      title={`Edit ${occurrence.title}`}
                      onClick={() => onDayEventSelect(day, occurrence)}
                    >
                      <span className="day-event-main">
                        <EventIcon icon={occurrence.icon} className="day-event-icon" />
                        <span className="day-event-title">{occurrence.title}</span>
                      </span>
                      <span className="day-event-amount">
                        {formatSignedCurrency(occurrence.amount)}
                      </span>
                    </button>
                  ))}

                  {day.events.length === 0 ? (
                    <span className="day-empty-copy">No scheduled events</span>
                  ) : null}

                  {day.events.length > 3 ? (
                    <button
                      type="button"
                      className="more-events more-events-button"
                      onClick={() => onDaySelect(day)}
                    >
                      +{day.events.length - 3} more
                    </button>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
