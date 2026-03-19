import EventIcon from './EventIcon.jsx'
import {
  describeFrequency,
  formatLongDate,
  formatShortDate,
  formatSignedCurrency,
  getNextOccurrence,
} from '../lib/budget.js'

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
  editingEventId,
  eventMutationId,
  onEditEvent,
  recurringEvents,
  todayIso,
  onDeleteEvent,
  openingBalanceDisplay,
  closingBalanceDisplay,
  calendarSummary,
}) {
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
