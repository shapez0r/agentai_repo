import {
  formatCurrency,
  formatLongDate,
  formatSignedCurrency,
  describeFrequency,
} from '../lib/budget.js'
import EventIcon from './EventIcon.jsx'

function AmountBadge({ amount }) {
  const tone = amount > 0 ? 'positive' : amount < 0 ? 'negative' : 'neutral'

  return <span className={`amount-badge amount-badge-${tone}`}>{formatSignedCurrency(amount)}</span>
}

export default function DayDetails({
  selectedDay,
  budget,
  onEditEvent,
}) {
  if (!selectedDay) {
    return (
      <section className="panel day-details-panel">
        <p className="empty-copy empty-copy-block">Select a day to inspect it.</p>
      </section>
    )
  }

  return (
    <section className="panel day-details-panel">
      <div className="panel-heading panel-heading-compact">
        <div>
          <p className="section-kicker">Selected day</p>
          <h3>{formatLongDate(selectedDay.iso)}</h3>
        </div>
        <AmountBadge amount={selectedDay.dayChange} />
      </div>

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
    </section>
  )
}
