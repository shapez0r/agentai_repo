export default function CalendarPanel({
  budget,
  calendar,
  todayIso,
  selectedDayIso,
  onDaySelect,
  onShiftMonth,
  onJumpToToday,
  onOpenMenu,
  formatCurrency,
  formatLongDate,
  formatShortDate,
  formatSignedCurrency,
  WEEKDAY_LABELS,
}) {
  return (
    <section className="panel calendar-panel">
      <div className="panel-heading">
        <div>
          <p className="section-kicker">Monthly view</p>
          <h2>{calendar.monthLabel}</h2>
        </div>

        <div className="calendar-actions">
          <button type="button" className="secondary-button" onClick={() => onShiftMonth(-1)}>
            Previous
          </button>
          <button type="button" className="secondary-button" onClick={onJumpToToday}>
            Today
          </button>
          <button type="button" className="secondary-button" onClick={() => onShiftMonth(1)}>
            Next
          </button>
          <button type="button" className="primary-button" onClick={onOpenMenu}>
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
                onClick={() => onDaySelect(day)}
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
  )
}
