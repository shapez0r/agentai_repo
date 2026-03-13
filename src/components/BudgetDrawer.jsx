import {
  FREQUENCY_OPTIONS,
  describeFrequency,
  formatCurrency,
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

export default function BudgetDrawer({
  isOpen,
  cloudMode,
  sessionEmail,
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
  formError,
  eventMutationId,
  onUpdateEventForm,
  onAddEvent,
  selectedDay,
  recurringEvents,
  todayIso,
  onDeleteEvent,
  securityState,
  verifiedTotpFactors,
  mfaPending,
  mfaBusy,
  mfaEnrollment,
  onMfaEnrollmentCodeChange,
  onEnrollTotp,
  onVerifyEnrollment,
  mfaChallengeCode,
  onMfaChallengeCodeChange,
  onVerifyExistingFactor,
  onRemoveTotp,
  openingBalanceDisplay,
  closingBalanceDisplay,
  calendarSummary,
}) {
  return (
    <div className={`menu-shell ${isOpen ? 'is-open' : ''}`} aria-hidden={!isOpen}>
      <button
        type="button"
        className="menu-backdrop"
        aria-label="Close budget menu"
        tabIndex={isOpen ? 0 : -1}
        onClick={onClose}
      />

      <aside className="menu-drawer" role="dialog" aria-modal="true" aria-label="Budget menu">
        <div className="menu-header">
          <div>
            <p className="section-kicker">Budget menu</p>
            <h2>{cloudMode ? 'Account, security, and data' : 'Controls and details'}</h2>
          </div>

          <button type="button" className="ghost-button ghost-button-small" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="menu-body">
          {cloudMode ? (
            <section className="drawer-card">
              <div className="panel-heading panel-heading-compact">
                <div>
                  <p className="section-kicker">Account</p>
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
                  <span className="detail-label">Current assurance</span>
                  <p className="detail-value">{securityState.currentLevel ?? 'none'}</p>
                </article>

                <article className="detail-stat">
                  <span className="detail-label">Next assurance</span>
                  <p className="detail-value">{securityState.nextLevel ?? 'none'}</p>
                </article>
              </div>

              {securityState.error ? (
                <p className="status-banner status-banner-error">{securityState.error}</p>
              ) : null}
              {securityState.message ? (
                <p className="status-banner status-banner-success">{securityState.message}</p>
              ) : null}

              <div className="security-stack">
                <div className="security-row">
                  <div>
                    <p className="detail-item-title">Authenticator app 2FA</p>
                    <p className="detail-item-meta">
                      Verified factors: {verifiedTotpFactors.length}. Session status:{' '}
                      {securityState.currentLevel === 'aal2'
                        ? '2FA complete'
                        : 'primary sign-in only'}
                      .
                    </p>
                  </div>

                  <button
                    type="button"
                    className="primary-button"
                    disabled={mfaBusy || securityState.loading || verifiedTotpFactors.length > 0}
                    onClick={onEnrollTotp}
                  >
                    {verifiedTotpFactors.length > 0 ? '2FA enabled' : 'Set up 2FA'}
                  </button>
                </div>

                {mfaEnrollment.factorId ? (
                  <div className="mfa-enrollment-card">
                    <div className="mfa-qr-block">
                      <img
                        src={mfaEnrollment.qrCode}
                        alt="TOTP QR code"
                        className="mfa-qr-image"
                      />
                    </div>
                    <div className="mfa-copy">
                      <p className="detail-item-title">Finish authenticator setup</p>
                      <p className="detail-item-meta">
                        Scan the QR code, or enter this secret manually in your authenticator app.
                      </p>
                      <code className="secret-code">{mfaEnrollment.secret}</code>
                      <label className="field">
                        <span className="field-label">Authenticator code</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={mfaEnrollment.code}
                          onChange={(event) => onMfaEnrollmentCodeChange(event.target.value)}
                        />
                      </label>
                      <button
                        type="button"
                        className="primary-button"
                        disabled={mfaBusy}
                        onClick={onVerifyEnrollment}
                      >
                        {mfaBusy ? 'Verifying...' : 'Verify and enable 2FA'}
                      </button>
                    </div>
                  </div>
                ) : null}

                {mfaPending ? (
                  <div className="security-verify-card">
                    <p className="detail-item-title">Complete the 2FA challenge for this session</p>
                    <p className="detail-item-meta">
                      Your password sign-in succeeded, but this session still needs the current
                      authenticator code.
                    </p>
                    <div className="security-verify-row">
                      <label className="field security-inline-field">
                        <span className="field-label">Authenticator code</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={mfaChallengeCode}
                          onChange={(event) => onMfaChallengeCodeChange(event.target.value)}
                        />
                      </label>
                      <button
                        type="button"
                        className="primary-button"
                        disabled={mfaBusy}
                        onClick={onVerifyExistingFactor}
                      >
                        {mfaBusy ? 'Checking...' : 'Verify session'}
                      </button>
                    </div>
                  </div>
                ) : null}

                {verifiedTotpFactors.length > 0 ? (
                  <div className="event-list">
                    {verifiedTotpFactors.map((factor) => (
                      <article key={factor.id} className="event-row">
                        <div className="event-row-main">
                          <div className="event-row-top">
                            <p className="event-title">
                              {factor.friendly_name || 'Authenticator app'}
                            </p>
                            <span className="more-events">{factor.status}</span>
                          </div>
                          <p className="event-meta">
                            Added {new Date(factor.created_at).toLocaleDateString('en-IE')}
                          </p>
                        </div>

                        <button
                          type="button"
                          className="ghost-button ghost-button-small"
                          disabled={mfaBusy || securityState.currentLevel !== 'aal2'}
                          onClick={() => onRemoveTotp(factor.id)}
                        >
                          Remove
                        </button>
                      </article>
                    ))}
                  </div>
                ) : null}
              </div>
            </section>
          ) : (
            <section className="drawer-card">
              <div className="panel-heading panel-heading-compact">
                <div>
                  <p className="section-kicker">Cloud upgrade</p>
                  <h3>Local browser storage is active</h3>
                </div>
              </div>

              <p className="helper-copy">
                This build still works locally, but registration, database sync, and 2FA only
                appear after Supabase environment variables are provided to the app.
              </p>
            </section>
          )}

          {budgetError ? <p className="status-banner status-banner-error">{budgetError}</p> : null}
          {budgetMessage ? <p className="status-banner status-banner-success">{budgetMessage}</p> : null}

          <div className="drawer-summary" aria-label="Month summary">
            <SummaryCard
              label="Opening balance"
              value={openingBalanceDisplay}
              detail="Balance before this month's scheduled transactions."
            />
            <SummaryCard
              label="Inflow this month"
              value={formatSignedCurrency(calendarSummary.income)}
              detail="Recurring income scheduled inside the visible month."
              tone="positive"
            />
            <SummaryCard
              label="Outflow this month"
              value={formatSignedCurrency(calendarSummary.expenses)}
              detail="Recurring costs scheduled inside the visible month."
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

          <div className="menu-quick-actions">
            <button
              type="button"
              className="primary-button"
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
              {cloudMode ? 'Reset cloud budget' : 'Reset local budget'}
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

            <p className="helper-copy">
              {cloudMode
                ? 'Opening settings update the calendar instantly in the browser, and the Save button writes them back to Supabase.'
                : 'Opening settings update the calendar instantly and are stored in this browser automatically.'}
            </p>

            {cloudMode ? (
              <div className="section-actions">
                <button
                  type="button"
                  className="primary-button"
                  disabled={budgetBusy || !openingSettingsDirty}
                  onClick={onSaveOpeningSettings}
                >
                  {budgetBusy ? 'Saving...' : 'Save opening settings'}
                </button>
                {openingSettingsDirty ? (
                  <span className="detail-item-meta">Unsaved opening settings</span>
                ) : (
                  <span className="detail-item-meta">Opening settings are synced</span>
                )}
              </div>
            ) : (
              <p className="detail-item-meta">Opening settings are already saved locally.</p>
            )}
          </section>

          <section className="drawer-card">
            <div className="panel-heading panel-heading-compact">
              <div>
                <p className="section-kicker">Add recurring event</p>
                <h3>Schedule cash flow</h3>
              </div>
            </div>

            <form className="event-form" onSubmit={onAddEvent}>
              <label className="field">
                <span className="field-label">Label</span>
                <input
                  type="text"
                  value={eventForm.title}
                  placeholder="Salary, rent, internal bill..."
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

              <div className="field-grid">
                <label className="field">
                  <span className="field-label">Repeat</span>
                  <select
                    value={eventForm.frequency}
                    onChange={(event) => onUpdateEventForm('frequency', event.target.value)}
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
                    onChange={(event) => onUpdateEventForm('startDate', event.target.value)}
                  />
                </label>
              </div>

              <label className="field">
                <span className="field-label">End date (optional)</span>
                <input
                  type="date"
                  value={eventForm.endDate}
                  disabled={eventForm.frequency === 'once'}
                  onChange={(event) => onUpdateEventForm('endDate', event.target.value)}
                />
              </label>

              {formError ? <p className="status-banner status-banner-error">{formError}</p> : null}

              <button type="submit" className="primary-button" disabled={eventMutationId === 'create'}>
                {eventMutationId === 'create' ? 'Saving...' : 'Add to calendar'}
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
                        disabled={eventMutationId === event.id}
                        onClick={() => onDeleteEvent(event.id)}
                      >
                        {eventMutationId === event.id ? 'Deleting...' : 'Delete'}
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
  )
}
