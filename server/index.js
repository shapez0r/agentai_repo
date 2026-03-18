import express from 'express'
import { isValidEmail, isValidPassword, normalizeEmail, hashPassword, verifyPassword } from './auth.js'
import {
  createEmailVerificationToken,
  createPasswordResetToken,
  createRecurringEvent,
  createSession,
  createUser,
  databaseFilePath,
  deleteRecurringEvent,
  deleteSessionByToken,
  fetchBudgetState,
  getSessionByToken,
  getUserByEmail,
  replaceBudgetState,
  saveOpeningSettings,
  setUserPassword,
  storeDevEmail,
  consumeEmailVerificationToken,
  consumePasswordResetToken,
  listDevEmails,
} from './db.js'
import {
  API_HOST,
  API_PORT,
  APP_ORIGIN,
  RESET_TOKEN_TTL_HOURS,
  SESSION_COOKIE_NAME,
  SESSION_TTL_DAYS,
  VERIFICATION_TOKEN_TTL_HOURS,
} from './config.js'
import { renderMailboxPage } from './mailboxPage.js'

const app = express()

function readCookies(request) {
  const cookieHeader = request.headers.cookie

  if (!cookieHeader) {
    return {}
  }

  return cookieHeader.split(';').reduce((cookies, entry) => {
    const [rawName, ...rawValueParts] = entry.trim().split('=')
    cookies[rawName] = decodeURIComponent(rawValueParts.join('='))
    return cookies
  }, {})
}

function serializeCookie(name, value, options = {}) {
  const segments = [`${name}=${encodeURIComponent(value)}`]

  if (options.maxAge !== undefined) {
    segments.push(`Max-Age=${options.maxAge}`)
  }

  segments.push(`Path=${options.path ?? '/'}`)
  segments.push(`SameSite=${options.sameSite ?? 'Lax'}`)

  if (options.httpOnly !== false) {
    segments.push('HttpOnly')
  }

  if (options.secure) {
    segments.push('Secure')
  }

  return segments.join('; ')
}

function setSessionCookie(response, token) {
  response.setHeader(
    'Set-Cookie',
    serializeCookie(SESSION_COOKIE_NAME, token, {
      maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
      httpOnly: true,
      path: '/',
      sameSite: 'Lax',
    }),
  )
}

function clearSessionCookie(response) {
  response.setHeader(
    'Set-Cookie',
    serializeCookie(SESSION_COOKIE_NAME, '', {
      maxAge: 0,
      httpOnly: true,
      path: '/',
      sameSite: 'Lax',
    }),
  )
}

function createAuthRedirect(query = {}) {
  const redirectUrl = new URL('/', APP_ORIGIN)

  for (const [key, value] of Object.entries(query)) {
    if (value) {
      redirectUrl.searchParams.set(key, value)
    }
  }

  return redirectUrl.toString()
}

function sessionPayload(session) {
  return {
    session: session
      ? {
          user: session.user,
        }
      : null,
  }
}

function requireAuth(request, response, next) {
  const cookies = readCookies(request)
  const sessionToken = cookies[SESSION_COOKIE_NAME]

  if (!sessionToken) {
    response.status(401).json({ error: 'You need to sign in first.' })
    return
  }

  const session = getSessionByToken(sessionToken)

  if (!session) {
    clearSessionCookie(response)
    response.status(401).json({ error: 'Your session expired. Sign in again.' })
    return
  }

  request.session = session
  request.sessionToken = sessionToken
  next()
}

function sendDevEmail({ toEmail, subject, textBody, actionUrl }) {
  storeDevEmail({
    toEmail,
    subject,
    textBody,
    actionUrl,
  })

  console.log(`[mailbox] ${subject} -> ${toEmail}`)
  console.log(textBody)
}

app.use(express.json())

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
    appOrigin: APP_ORIGIN,
    databaseFilePath,
  })
})

app.get('/api/auth/session', (request, response) => {
  const sessionToken = readCookies(request)[SESSION_COOKIE_NAME]
  const session = sessionToken ? getSessionByToken(sessionToken) : null

  if (sessionToken && !session) {
    clearSessionCookie(response)
  }

  response.json(sessionPayload(session))
})

app.post('/api/auth/register', (request, response) => {
  const email = normalizeEmail(request.body?.email)
  const password = request.body?.password

  if (!isValidEmail(email)) {
    response.status(400).json({ error: 'Enter a valid email address.' })
    return
  }

  if (!isValidPassword(password)) {
    response.status(400).json({ error: 'Use at least 8 characters for the password.' })
    return
  }

  if (getUserByEmail(email)) {
    response.status(409).json({ error: 'An account with that email already exists.' })
    return
  }

  const user = createUser({
    email,
    passwordHash: hashPassword(password),
  })
  const verificationToken = createEmailVerificationToken(user.id, VERIFICATION_TOKEN_TTL_HOURS)
  const verificationUrl = `${APP_ORIGIN}/api/auth/verify-email?token=${verificationToken}`

  sendDevEmail({
    toEmail: user.email,
    subject: 'Verify your Ledger Garden account',
    actionUrl: verificationUrl,
    textBody: [
      'Welcome to Ledger Garden.',
      '',
      'Use the link below to verify your email and activate sign-in:',
      verificationUrl,
      '',
      'This email is stored locally in the development mailbox.',
    ].join('\n'),
  })

  response.status(201).json({
    message: 'Account created. Open the local mailbox to verify your email.',
  })
})

app.get('/api/auth/verify-email', (request, response) => {
  const token = typeof request.query.token === 'string' ? request.query.token : ''
  const user = token ? consumeEmailVerificationToken(token) : null

  if (!user) {
    response.redirect(
      302,
      createAuthRedirect({
        auth: 'error',
        message: 'That verification link is invalid or has expired.',
      }),
    )
    return
  }

  response.redirect(
    302,
    createAuthRedirect({
      auth: 'verified',
      message: 'Email verified. You can sign in now.',
    }),
  )
})

app.post('/api/auth/login', (request, response) => {
  const email = normalizeEmail(request.body?.email)
  const password = request.body?.password
  const userRecord = getUserByEmail(email)

  if (!userRecord || !verifyPassword(password, userRecord.password_hash)) {
    response.status(401).json({ error: 'Invalid email or password.' })
    return
  }

  if (!userRecord.email_verified_at) {
    response.status(403).json({
      error: 'Verify your email before signing in. Open the local mailbox to finish setup.',
    })
    return
  }

  const session = createSession(userRecord.id, SESSION_TTL_DAYS)

  setSessionCookie(response, session.token)
  response.json(
    sessionPayload({
      user: {
        id: userRecord.id,
        email: userRecord.email,
        emailVerifiedAt: userRecord.email_verified_at,
      },
    }),
  )
})

app.post('/api/auth/logout', (request, response) => {
  const sessionToken = readCookies(request)[SESSION_COOKIE_NAME]

  if (sessionToken) {
    deleteSessionByToken(sessionToken)
  }

  clearSessionCookie(response)
  response.status(204).end()
})

app.post('/api/auth/request-password-reset', (request, response) => {
  const email = normalizeEmail(request.body?.email)
  const user = isValidEmail(email) ? getUserByEmail(email) : null

  if (user) {
    const resetToken = createPasswordResetToken(user.id, RESET_TOKEN_TTL_HOURS)
    const resetUrl = `${APP_ORIGIN}/?mode=reset-password&token=${resetToken}`

    sendDevEmail({
      toEmail: user.email,
      subject: 'Reset your Ledger Garden password',
      actionUrl: resetUrl,
      textBody: [
        'A password reset was requested for your Ledger Garden account.',
        '',
        'Open the link below and choose a new password:',
        resetUrl,
        '',
        'If you did not request this, you can ignore this email.',
      ].join('\n'),
    })
  }

  response.json({
    message: 'If that email exists, a password reset link is waiting in the local mailbox.',
  })
})

app.post('/api/auth/reset-password', (request, response) => {
  const token = typeof request.body?.token === 'string' ? request.body.token : ''
  const password = request.body?.password

  if (!isValidPassword(password)) {
    response.status(400).json({ error: 'Use at least 8 characters for the new password.' })
    return
  }

  const userId = token ? consumePasswordResetToken(token) : null

  if (!userId) {
    response.status(400).json({ error: 'That reset link is invalid or has expired.' })
    return
  }

  setUserPassword(userId, hashPassword(password))
  response.json({ message: 'Password updated. You can sign in with your new password.' })
})

app.get('/api/dev/mailbox', (request, response) => {
  const filterEmail = normalizeEmail(request.query.email)
  const emails = listDevEmails(filterEmail)

  response.type('html').send(
    renderMailboxPage({
      emails,
      filterEmail,
    }),
  )
})

app.get('/api/budget', requireAuth, (request, response) => {
  response.json({
    budget: fetchBudgetState(request.session.user.id),
  })
})

app.put('/api/budget/opening', requireAuth, (request, response) => {
  const settings = saveOpeningSettings(request.session.user.id, request.body ?? {})

  response.json({
    settings,
  })
})

app.post('/api/budget/events', requireAuth, (request, response) => {
  const event = createRecurringEvent(request.session.user.id, request.body ?? {})

  response.status(201).json({ event })
})

app.delete('/api/budget/events/:eventId', requireAuth, (request, response) => {
  deleteRecurringEvent(request.session.user.id, request.params.eventId)
  response.status(204).end()
})

app.put('/api/budget/replace', requireAuth, (request, response) => {
  response.json({
    budget: replaceBudgetState(request.session.user.id, request.body ?? {}),
  })
})

app.use((error, _request, response) => {
  console.error(error)
  response.status(500).json({
    error: error instanceof Error ? error.message : 'Something went wrong on the local server.',
  })
})

app.listen(API_PORT, API_HOST, () => {
  console.log(`Ledger Garden API running at http://${API_HOST}:${API_PORT}`)
  console.log(`App origin for email links: ${APP_ORIGIN}`)
  console.log(`SQLite database file: ${databaseFilePath}`)
})
