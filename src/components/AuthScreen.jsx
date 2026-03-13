function getModeCopy(mode) {
  switch (mode) {
    case 'sign-up':
      return {
        title: 'Create your account',
        body: 'We will use Supabase Auth for registration, email verification, password resets, and TOTP-based 2FA.',
        action: 'Create account',
      }
    case 'forgot-password':
      return {
        title: 'Reset your password',
        body: 'We will send a reset link to your email. The link should point back to this app.',
        action: 'Send reset link',
      }
    case 'update-password':
      return {
        title: 'Choose a new password',
        body: 'You came in through a recovery link. Set a new password to finish the recovery flow.',
        action: 'Update password',
      }
    default:
      return {
        title: 'Sign in to Ledger Garden',
        body: 'Your budget data will load from Supabase after authentication, and 2FA can be completed from the security panel.',
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
      <section className="panel auth-card">
        <div className="auth-copy">
          <p className="eyebrow">Supabase auth</p>
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
                autoComplete={
                  authMode === 'sign-in' ? 'current-password' : 'new-password'
                }
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
          After sign-in, the app will load your server-backed budget profile and recurring
          events. TOTP 2FA enrollment and verification live inside the budget menu.
        </p>
      </section>
    </main>
  )
}
