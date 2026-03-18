import { randomUUID } from 'node:crypto'
import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import {
  DEFAULT_EVENT_ICON,
  EVENT_ICON_OPTIONS,
  EVENT_SCHEDULE_TYPE_OPTIONS,
  FREQUENCY_OPTIONS,
  WEEKDAY_OPTIONS,
  WEEKDAY_ORDINAL_OPTIONS,
  coerceBudgetState,
  createDefaultBudgetState,
  getDefaultScheduleType,
  getWeekdayOrdinalForDate,
  getWeekdayValueForDate,
  parseISODate,
} from '../src/lib/budget.js'
import { createOpaqueToken, hashToken } from './auth.js'
import { DATABASE_FILE } from './config.js'

const serverDirectory = dirname(fileURLToPath(import.meta.url))
const schemaFilePath = join(serverDirectory, 'schema.sql')
const allowedFrequencies = new Set(FREQUENCY_OPTIONS.map((option) => option.value))
const allowedEventIcons = new Set(EVENT_ICON_OPTIONS.map((option) => option.value))
const allowedScheduleTypes = new Set(EVENT_SCHEDULE_TYPE_OPTIONS.map((option) => option.value))
const allowedWeekdays = new Set(WEEKDAY_OPTIONS.map((option) => option.value))
const allowedWeekdayOrdinals = new Set(WEEKDAY_ORDINAL_OPTIONS.map((option) => option.value))

mkdirSync(dirname(DATABASE_FILE), { recursive: true })

export const databaseFilePath = DATABASE_FILE
export const db = new DatabaseSync(DATABASE_FILE)

db.exec(readFileSync(schemaFilePath, 'utf8'))
runMigrations()

function runMigrations() {
  const recurringEventColumns = new Set(
    db.prepare("PRAGMA table_info('recurring_events')").all().map((column) => column.name),
  )

  if (!recurringEventColumns.has('schedule_type')) {
    db.exec("ALTER TABLE recurring_events ADD COLUMN schedule_type TEXT NOT NULL DEFAULT 'date'")
  }

  if (!recurringEventColumns.has('weekday')) {
    db.exec('ALTER TABLE recurring_events ADD COLUMN weekday TEXT')
  }

  if (!recurringEventColumns.has('weekday_ordinal')) {
    db.exec('ALTER TABLE recurring_events ADD COLUMN weekday_ordinal TEXT')
  }

  if (!recurringEventColumns.has('icon')) {
    db.exec(`ALTER TABLE recurring_events ADD COLUMN icon TEXT NOT NULL DEFAULT '${DEFAULT_EVENT_ICON}'`)
  }
}

function createTimestamp(offsetMs = 0) {
  return new Date(Date.now() + offsetMs).toISOString()
}

function serializeUser(row) {
  if (!row) {
    return null
  }

  return {
    id: row.id,
    email: row.email,
    emailVerifiedAt: row.email_verified_at,
  }
}

function createDefaultOpeningSettings() {
  const budget = createDefaultBudgetState()

  return {
    openingBalance: budget.openingBalance,
    openingDate: budget.openingDate,
  }
}

function normalizeOpeningSettings(settings = {}) {
  const defaults = createDefaultOpeningSettings()
  const openingBalance = Number(settings.openingBalance)
  const openingDate =
    typeof settings.openingDate === 'string' && parseISODate(settings.openingDate)
      ? settings.openingDate
      : defaults.openingDate

  if (!Number.isFinite(openingBalance)) {
    throw new Error('Opening balance must be a valid number.')
  }

  return {
    openingBalance,
    openingDate,
  }
}

function normalizeEvent(event = {}) {
  const title = typeof event.title === 'string' ? event.title.trim() : ''
  const amount = Number(event.amount)
  const frequency = typeof event.frequency === 'string' ? event.frequency : ''
  const startDate = typeof event.startDate === 'string' ? event.startDate : ''
  const endDate = typeof event.endDate === 'string' ? event.endDate : ''
  const rawScheduleType = typeof event.scheduleType === 'string' ? event.scheduleType : ''
  const rawWeekday = typeof event.weekday === 'string' ? event.weekday : ''
  const rawWeekdayOrdinal =
    typeof event.weekdayOrdinal === 'string' ? event.weekdayOrdinal : ''
  const rawIcon = typeof event.icon === 'string' ? event.icon : ''

  if (!title) {
    throw new Error('Add a short label for the recurring event.')
  }

  if (!Number.isFinite(amount) || amount === 0) {
    throw new Error('Recurring events need a non-zero amount.')
  }

  if (!allowedFrequencies.has(frequency)) {
    throw new Error('Choose a valid repeat option.')
  }

  if (!parseISODate(startDate)) {
    throw new Error('Choose a valid start date.')
  }

  if (endDate && !parseISODate(endDate)) {
    throw new Error('Choose a valid end date.')
  }

  if (endDate && endDate < startDate) {
    throw new Error('The end date must be on or after the start date.')
  }

  if (rawScheduleType && !allowedScheduleTypes.has(rawScheduleType)) {
    throw new Error('Choose a valid schedule type.')
  }

  const scheduleType =
    frequency === 'monthly' || frequency === 'yearly'
      ? rawScheduleType || getDefaultScheduleType(frequency)
      : getDefaultScheduleType(frequency)
  const weekday = rawWeekday || getWeekdayValueForDate(startDate)
  const weekdayOrdinal = rawWeekdayOrdinal || getWeekdayOrdinalForDate(startDate)
  const icon = rawIcon || DEFAULT_EVENT_ICON

  if ((frequency === 'weekly' || frequency === 'biweekly' || scheduleType === 'weekday') && !allowedWeekdays.has(weekday)) {
    throw new Error('Choose which day of the week the event should land on.')
  }

  if ((frequency === 'monthly' || frequency === 'yearly') && scheduleType === 'weekday' && !allowedWeekdayOrdinals.has(weekdayOrdinal)) {
    throw new Error('Choose which week of the month the event should land on.')
  }

  if (!allowedEventIcons.has(icon)) {
    throw new Error('Choose a valid event icon.')
  }

  return {
    id: typeof event.id === 'string' && event.id ? event.id : randomUUID(),
    title,
    amount,
    frequency,
    startDate,
    endDate,
    scheduleType,
    weekday,
    weekdayOrdinal,
    icon,
  }
}

function mapEventFromRow(row) {
  return {
    id: row.id,
    title: row.title,
    amount: Number(row.amount),
    frequency: row.frequency,
    startDate: row.start_date,
    endDate: row.end_date ?? '',
    scheduleType:
      typeof row.schedule_type === 'string' && row.schedule_type
        ? row.schedule_type
        : getDefaultScheduleType(row.frequency),
    weekday:
      typeof row.weekday === 'string' && row.weekday
        ? row.weekday
        : getWeekdayValueForDate(row.start_date),
    weekdayOrdinal:
      typeof row.weekday_ordinal === 'string' && row.weekday_ordinal
        ? row.weekday_ordinal
        : getWeekdayOrdinalForDate(row.start_date),
    icon:
      typeof row.icon === 'string' && row.icon
        ? row.icon
        : DEFAULT_EVENT_ICON,
  }
}

function withTransaction(work) {
  db.exec('BEGIN')

  try {
    const result = work()
    db.exec('COMMIT')
    return result
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}

export function getUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email)
}

export function getUserById(userId) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
}

export function createUser({ email, passwordHash }) {
  const userId = randomUUID()
  const timestamp = createTimestamp()

  db.prepare(
    `
      INSERT INTO users (id, email, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `,
  ).run(userId, email, passwordHash, timestamp, timestamp)

  ensureBudgetProfile(userId)

  return serializeUser(getUserById(userId))
}

export function setUserPassword(userId, passwordHash) {
  db.prepare(
    `
      UPDATE users
      SET password_hash = ?, updated_at = ?
      WHERE id = ?
    `,
  ).run(passwordHash, createTimestamp(), userId)
}

export function markUserEmailVerified(userId) {
  const timestamp = createTimestamp()

  db.prepare(
    `
      UPDATE users
      SET email_verified_at = COALESCE(email_verified_at, ?), updated_at = ?
      WHERE id = ?
    `,
  ).run(timestamp, timestamp, userId)

  return serializeUser(getUserById(userId))
}

export function ensureBudgetProfile(userId) {
  const defaults = createDefaultOpeningSettings()
  const timestamp = createTimestamp()

  db.prepare(
    `
      INSERT INTO budget_profiles (user_id, opening_balance, opening_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO NOTHING
    `,
  ).run(userId, defaults.openingBalance, defaults.openingDate, timestamp, timestamp)
}

export function createEmailVerificationToken(userId, ttlHours) {
  const token = createOpaqueToken()

  db.prepare(
    `
      INSERT INTO email_verification_tokens (id, user_id, token_hash, expires_at)
      VALUES (?, ?, ?, ?)
    `,
  ).run(randomUUID(), userId, hashToken(token), createTimestamp(ttlHours * 60 * 60 * 1000))

  return token
}

export function consumeEmailVerificationToken(token) {
  const row = db
    .prepare(
      `
        SELECT id, user_id, expires_at, used_at
        FROM email_verification_tokens
        WHERE token_hash = ?
      `,
    )
    .get(hashToken(token))

  if (!row || row.used_at) {
    return null
  }

  if (new Date(row.expires_at).getTime() < Date.now()) {
    return null
  }

  db.prepare(
    `
      UPDATE email_verification_tokens
      SET used_at = ?
      WHERE id = ?
    `,
  ).run(createTimestamp(), row.id)

  return markUserEmailVerified(row.user_id)
}

export function createPasswordResetToken(userId, ttlHours) {
  const token = createOpaqueToken()

  db.prepare(
    `
      INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at)
      VALUES (?, ?, ?, ?)
    `,
  ).run(randomUUID(), userId, hashToken(token), createTimestamp(ttlHours * 60 * 60 * 1000))

  return token
}

export function consumePasswordResetToken(token) {
  const row = db
    .prepare(
      `
        SELECT id, user_id, expires_at, used_at
        FROM password_reset_tokens
        WHERE token_hash = ?
      `,
    )
    .get(hashToken(token))

  if (!row || row.used_at) {
    return null
  }

  if (new Date(row.expires_at).getTime() < Date.now()) {
    return null
  }

  db.prepare(
    `
      UPDATE password_reset_tokens
      SET used_at = ?
      WHERE id = ?
    `,
  ).run(createTimestamp(), row.id)

  return row.user_id
}

export function createSession(userId, ttlDays) {
  const token = createOpaqueToken()
  const sessionId = randomUUID()

  db.prepare(
    `
      INSERT INTO sessions (id, user_id, token_hash, expires_at)
      VALUES (?, ?, ?, ?)
    `,
  ).run(sessionId, userId, hashToken(token), createTimestamp(ttlDays * 24 * 60 * 60 * 1000))

  return {
    token,
    sessionId,
  }
}

export function getSessionByToken(token) {
  const session = db
    .prepare(
      `
        SELECT sessions.id, sessions.expires_at, users.id AS user_id, users.email, users.email_verified_at
        FROM sessions
        JOIN users ON users.id = sessions.user_id
        WHERE sessions.token_hash = ?
      `,
    )
    .get(hashToken(token))

  if (!session) {
    return null
  }

  if (new Date(session.expires_at).getTime() < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(session.id)
    return null
  }

  return {
    id: session.id,
    expiresAt: session.expires_at,
    user: serializeUser({
      id: session.user_id,
      email: session.email,
      email_verified_at: session.email_verified_at,
    }),
  }
}

export function deleteSessionByToken(token) {
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token))
}

export function storeDevEmail({ toEmail, subject, textBody, actionUrl = null }) {
  db.prepare(
    `
      INSERT INTO dev_emails (id, to_email, subject, text_body, action_url)
      VALUES (?, ?, ?, ?, ?)
    `,
  ).run(randomUUID(), toEmail, subject, textBody, actionUrl)
}

export function listDevEmails(email = '') {
  if (email) {
    return db
      .prepare(
        `
          SELECT id, to_email, subject, text_body, action_url, created_at
          FROM dev_emails
          WHERE to_email = ?
          ORDER BY created_at DESC
          LIMIT 25
        `,
      )
      .all(email)
  }

  return db
    .prepare(
      `
        SELECT id, to_email, subject, text_body, action_url, created_at
        FROM dev_emails
        ORDER BY created_at DESC
        LIMIT 25
      `,
    )
    .all()
}

export function fetchBudgetState(userId) {
  ensureBudgetProfile(userId)

  const defaults = createDefaultBudgetState()
  const profile =
    db.prepare('SELECT opening_balance, opening_date FROM budget_profiles WHERE user_id = ?').get(userId) ??
    null
  const events = db
    .prepare(
      `
        SELECT id, title, amount, frequency, start_date, end_date, schedule_type, weekday, weekday_ordinal, icon
        FROM recurring_events
        WHERE user_id = ?
        ORDER BY start_date ASC, created_at ASC
      `,
    )
    .all(userId)

  return coerceBudgetState({
    openingBalance: Number(profile?.opening_balance ?? defaults.openingBalance),
    openingDate: profile?.opening_date ?? defaults.openingDate,
    events: events.map(mapEventFromRow),
  })
}

export function saveOpeningSettings(userId, settings) {
  ensureBudgetProfile(userId)

  const normalizedSettings = normalizeOpeningSettings(settings)
  const timestamp = createTimestamp()

  db.prepare(
    `
      INSERT INTO budget_profiles (user_id, opening_balance, opening_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        opening_balance = excluded.opening_balance,
        opening_date = excluded.opening_date,
        updated_at = excluded.updated_at
    `,
  ).run(
    userId,
    normalizedSettings.openingBalance,
    normalizedSettings.openingDate,
    timestamp,
    timestamp,
  )

  return normalizedSettings
}

export function createRecurringEvent(userId, event) {
  const normalizedEvent = normalizeEvent(event)
  const timestamp = createTimestamp()

  db.prepare(
    `
      INSERT INTO recurring_events (
        id,
        user_id,
        title,
        amount,
        frequency,
        start_date,
        end_date,
        schedule_type,
        weekday,
        weekday_ordinal,
        icon,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
  ).run(
    normalizedEvent.id,
    userId,
    normalizedEvent.title,
    normalizedEvent.amount,
    normalizedEvent.frequency,
    normalizedEvent.startDate,
    normalizedEvent.endDate || null,
    normalizedEvent.scheduleType,
    normalizedEvent.weekday,
    normalizedEvent.weekdayOrdinal,
    normalizedEvent.icon,
    timestamp,
    timestamp,
  )

  return normalizedEvent
}

export function updateRecurringEvent(userId, eventId, event) {
  const normalizedEvent = normalizeEvent({
    ...event,
    id: eventId,
  })
  const timestamp = createTimestamp()
  const result = db.prepare(
    `
      UPDATE recurring_events
      SET
        title = ?,
        amount = ?,
        frequency = ?,
        start_date = ?,
        end_date = ?,
        schedule_type = ?,
        weekday = ?,
        weekday_ordinal = ?,
        icon = ?,
        updated_at = ?
      WHERE id = ? AND user_id = ?
    `,
  ).run(
    normalizedEvent.title,
    normalizedEvent.amount,
    normalizedEvent.frequency,
    normalizedEvent.startDate,
    normalizedEvent.endDate || null,
    normalizedEvent.scheduleType,
    normalizedEvent.weekday,
    normalizedEvent.weekdayOrdinal,
    normalizedEvent.icon,
    timestamp,
    eventId,
    userId,
  )

  if (result.changes === 0) {
    throw new Error('That event could not be found.')
  }

  return normalizedEvent
}

export function deleteRecurringEvent(userId, eventId) {
  db.prepare('DELETE FROM recurring_events WHERE id = ? AND user_id = ?').run(eventId, userId)
}

export function replaceBudgetState(userId, budget) {
  const normalizedBudget = coerceBudgetState(budget)

  withTransaction(() => {
    saveOpeningSettings(userId, normalizedBudget)
    db.prepare('DELETE FROM recurring_events WHERE user_id = ?').run(userId)

    for (const event of normalizedBudget.events.map(normalizeEvent)) {
      createRecurringEvent(userId, event)
    }
  })

  return fetchBudgetState(userId)
}
