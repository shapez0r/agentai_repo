async function request(path, options = {}) {
  const headers = new Headers(options.headers ?? {})

  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(path, {
    ...options,
    credentials: 'include',
    headers,
  })

  if (response.status === 204) {
    return null
  }

  const isJsonResponse = response.headers.get('content-type')?.includes('application/json')
  const payload = isJsonResponse ? await response.json() : null

  if (!response.ok) {
    throw new Error(payload?.error || 'The local API request failed.')
  }

  return payload
}

export async function fetchSession() {
  return request('/api/auth/session')
}

export async function registerUser(credentials) {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export async function signInWithPassword(credentials) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export async function signOut() {
  return request('/api/auth/logout', {
    method: 'POST',
  })
}

export async function requestPasswordReset(email) {
  return request('/api/auth/request-password-reset', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function resetPassword({ token, password }) {
  return request('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  })
}

export async function fetchBudgetState() {
  const payload = await request('/api/budget')
  return payload.budget
}

export async function saveOpeningSettings(settings) {
  const payload = await request('/api/budget/opening', {
    method: 'PUT',
    body: JSON.stringify(settings),
  })

  return payload.settings
}

export async function createRecurringEvent(event) {
  const payload = await request('/api/budget/events', {
    method: 'POST',
    body: JSON.stringify(event),
  })

  return payload.event
}

export async function deleteRecurringEvent(eventId) {
  await request(`/api/budget/events/${encodeURIComponent(eventId)}`, {
    method: 'DELETE',
  })
}

export async function replaceBudgetState(budget) {
  const payload = await request('/api/budget/replace', {
    method: 'PUT',
    body: JSON.stringify(budget),
  })

  return payload.budget
}

export function getLocalMailboxUrl(email = '') {
  const baseUrl =
    typeof window === 'undefined' ? 'http://localhost:3000' : window.location.origin
  const mailboxUrl = new URL('/api/dev/mailbox', baseUrl)
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''

  if (normalizedEmail) {
    mailboxUrl.searchParams.set('email', normalizedEmail)
  }

  return mailboxUrl.toString()
}
