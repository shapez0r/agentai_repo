function getModeCopy(mode) {
  switch (mode) {
    case 'sign-up':
      return {
        title: 'Create your account',
        body: 'Your account will be stored in the local SQLite database. We will send a verification link to the local mailbox on this machine.',
        action: 'Create account',
      }
    case 'forgot-password':
      return {
        title: 'Reset your password',
        body: 'We will place a password reset link in the local mailbox so you can finish the flow without leaving Budlendar on this machine.',
        action: 'Send reset link',
      }
    case 'update-password':
      return {
        title: 'Choose a new password',
        body: 'Your reset link is active. Set a new password to finish the local recovery flow.',
        action: 'Update password',
      }
    default:
      return {
        title: 'Sign in to Budlendar',
        body: 'This build runs against a local API and SQLite database. Sign in to load your saved budget data.',
        action: 'Sign in',
      }
  }
}

function AuthTab({ active, label, onClick }) {
  return (
    <button
      type="button"
      className={`auth-tab ${active ? 'is-active' : ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

export default function AuthScreen({
  authMode,
  authForm,
  authBusy,
  authError,
  authMessage,
  mailboxUrl,
  onFieldChange,
  onModeChange,
  onSubmit,
}) {
  const copy = getModeCopy(authMode)
  const showEmailField = authMode !== 'update-password'
  const showPasswordField = authMode !== 'forgot-password'
  const showConfirmPassword = authMode === 'sign-up' || authMode === 'update-password'

  return (
    <main className="auth-shell">
      {import.meta.env.DEV && <div className="dev-badge">Development</div>}
      <section className="panel auth-card">
        <div className="auth-copy">
          <p className="eyebrow">Local auth</p>
          <h1>{copy.title}</h1>
          <p className="auth-text">{copy.body}</p>
        </div>

        <div className="auth-tabs" aria-label="Authentication options">
          <AuthTab
            active={authMode === 'sign-in'}
            label="Sign in"
            onClick={() => onModeChange('sign-in')}
          />
          <AuthTab
            active={authMode === 'sign-up'}
            label="Create account"
            onClick={() => onModeChange('sign-up')}
          />
          <AuthTab
            active={authMode === 'forgot-password'}
            label="Reset password"
            onClick={() => onModeChange('forgot-password')}
          />
        </div>

        <form className="auth-form" onSubmit={onSubmit}>
          {showEmailField ? (
            <label className="field">
              <span className="field-label">Email</span>
              <input
                type="email"
                autoComplete="email"
                value={authForm.email}
                onChange={(event) => onFieldChange('email', event.target.value)}
              />
            </label>
          ) : null}

          {showPasswordField ? (
            <label className="field">
              <span className="field-label">Password</span>
              <input
                type="password"
                autoComplete={authMode === 'sign-in' ? 'current-password' : 'new-password'}
                value={authForm.password}
                onChange={(event) => onFieldChange('password', event.target.value)}
              />
            </label>
          ) : null}

          {showConfirmPassword ? (
            <label className="field">
              <span className="field-label">Confirm password</span>
              <input
                type="password"
                autoComplete="new-password"
                value={authForm.confirmPassword}
                onChange={(event) => onFieldChange('confirmPassword', event.target.value)}
              />
            </label>
          ) : null}

          {authError ? <p className="status-banner status-banner-error">{authError}</p> : null}
          {authMessage ? (
            <p className="status-banner status-banner-success">{authMessage}</p>
          ) : null}

          <div className="auth-submit-row">
            <button type="submit" className="primary-button" disabled={authBusy}>
              {authBusy ? 'Working...' : copy.action}
            </button>

            <a
              href={mailboxUrl}
              className="ghost-button button-link"
              target="_blank"
              rel="noreferrer"
            >
              Open local mailbox
            </a>

            {authMode === 'update-password' ? (
              <button
                type="button"
                className="ghost-button"
                onClick={() => onModeChange('sign-in')}
              >
                Back to sign in
              </button>
            ) : null}
          </div>
        </form>

        <p className="auth-footnote">
          Verification and password reset emails are captured locally. Use the mailbox to open
          links instead of waiting for a real email provider.
        </p>
      </section>
    </main>
  )
}
