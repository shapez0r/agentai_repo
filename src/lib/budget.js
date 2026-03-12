const DAY_MS = 24 * 60 * 60 * 1000

const EURO_FORMATTER = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const MONTH_FORMATTER = new Intl.DateTimeFormat('en-IE', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

const LONG_DATE_FORMATTER = new Intl.DateTimeFormat('en-IE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat('en-IE', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const FREQUENCY_OPTIONS = [
  { value: 'once', label: 'One time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

function createUtcDate(year, monthIndex, day) {
  return new Date(Date.UTC(year, monthIndex, day))
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function getDaysInMonth(year, monthIndex) {
  return createUtcDate(year, monthIndex + 1, 0).getUTCDate()
}

function clampDayForMonth(day, year, monthIndex) {
  return Math.min(day, getDaysInMonth(year, monthIndex))
}

function addDays(date, days) {
  return new Date(date.getTime() + days * DAY_MS)
}

function endOfMonth(date) {
  return createUtcDate(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)
}

function startOfWeek(date) {
  const dayOffset = (date.getUTCDay() + 6) % 7
  return addDays(date, -dayOffset)
}

function endOfWeek(date) {
  return addDays(startOfWeek(date), 6)
}

function differenceInDays(start, end) {
  return Math.round((end.getTime() - start.getTime()) / DAY_MS)
}

function monthsBetween(start, end) {
  return (
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (end.getUTCMonth() - start.getUTCMonth())
  )
}

function normalizeEvent(event) {
  if (!event || typeof event !== 'object') {
    return null
  }

  const title = typeof event.title === 'string' ? event.title.trim() : ''
  const amount = Number(event.amount)
  const frequency = FREQUENCY_OPTIONS.some((option) => option.value === event.frequency)
    ? event.frequency
    : 'monthly'
  const startDate = typeof event.startDate === 'string' ? event.startDate : ''
  const endDate = typeof event.endDate === 'string' ? event.endDate : ''

  if (!title || !Number.isFinite(amount) || !parseISODate(startDate)) {
    return null
  }

  if (endDate && (!parseISODate(endDate) || endDate < startDate)) {
    return null
  }

  return {
    id: typeof event.id === 'string' && event.id ? event.id : createId(),
    title,
    amount,
    frequency,
    startDate,
    endDate,
  }
}

function eventOccursOnDate(event, date) {
  const start = parseISODate(event.startDate)

  if (!start || date < start) {
    return false
  }

  const end = event.endDate ? parseISODate(event.endDate) : null

  if (end && date > end) {
    return false
  }

  switch (event.frequency) {
    case 'once':
      return toISODate(date) === event.startDate
    case 'daily':
      return true
    case 'weekly':
      return differenceInDays(start, date) % 7 === 0
    case 'biweekly':
      return differenceInDays(start, date) % 14 === 0
    case 'monthly': {
      const monthOffset = monthsBetween(start, date)

      if (monthOffset < 0) {
        return false
      }

      const dueDay = clampDayForMonth(
        start.getUTCDate(),
        date.getUTCFullYear(),
        date.getUTCMonth(),
      )

      return date.getUTCDate() === dueDay
    }
    case 'yearly': {
      if (date.getUTCMonth() !== start.getUTCMonth()) {
        return false
      }

      const dueDay = clampDayForMonth(
        start.getUTCDate(),
        date.getUTCFullYear(),
        date.getUTCMonth(),
      )

      return date.getUTCDate() === dueDay
    }
    default:
      return false
  }
}

export function parseISODate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null
  }

  const [year, month, day] = value.split('-').map(Number)
  const date = createUtcDate(year, month - 1, day)

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }

  return date
}

export function toISODate(date) {
  return date.toISOString().slice(0, 10)
}

export function startOfToday() {
  const now = new Date()
  return createUtcDate(now.getFullYear(), now.getMonth(), now.getDate())
}

export function startOfMonth(date) {
  return createUtcDate(date.getUTCFullYear(), date.getUTCMonth(), 1)
}

export function addMonths(date, count) {
  const shiftedMonth = createUtcDate(date.getUTCFullYear(), date.getUTCMonth() + count, 1)
  const targetDay = clampDayForMonth(
    date.getUTCDate(),
    shiftedMonth.getUTCFullYear(),
    shiftedMonth.getUTCMonth(),
  )

  return createUtcDate(shiftedMonth.getUTCFullYear(), shiftedMonth.getUTCMonth(), targetDay)
}

export function formatCurrency(value) {
  return EURO_FORMATTER.format(Number.isFinite(value) ? value : 0)
}

export function formatSignedCurrency(value) {
  if (!Number.isFinite(value)) {
    return EURO_FORMATTER.format(0)
  }

  const amount = EURO_FORMATTER.format(Math.abs(value))

  if (value > 0) {
    return `+${amount}`
  }

  if (value < 0) {
    return `-${amount}`
  }

  return amount
}

export function formatMonthLabel(value) {
  const date = value instanceof Date ? value : parseISODate(value)
  return date ? MONTH_FORMATTER.format(date) : ''
}

export function formatLongDate(value) {
  const date = value instanceof Date ? value : parseISODate(value)
  return date ? LONG_DATE_FORMATTER.format(date) : ''
}

export function formatShortDate(value) {
  const date = value instanceof Date ? value : parseISODate(value)
  return date ? SHORT_DATE_FORMATTER.format(date) : ''
}

export function describeFrequency(event) {
  switch (event.frequency) {
    case 'once':
      return 'One time'
    case 'daily':
      return 'Every day'
    case 'weekly':
      return 'Every week'
    case 'biweekly':
      return 'Every 2 weeks'
    case 'monthly':
      return 'Every month'
    case 'yearly':
      return 'Every year'
    default:
      return 'Scheduled'
  }
}

export function createDefaultBudgetState() {
  const today = startOfToday()
  const currentMonthStart = startOfMonth(today)

  return {
    openingBalance: 0,
    openingDate: toISODate(currentMonthStart),
    events: [],
  }
}

export function createDemoBudgetState() {
  const monthStart = startOfMonth(startOfToday())
  const year = monthStart.getUTCFullYear()
  const monthIndex = monthStart.getUTCMonth()
  const makeDate = (day) =>
    toISODate(createUtcDate(year, monthIndex, clampDayForMonth(day, year, monthIndex)))

  return {
    openingBalance: 420,
    openingDate: toISODate(monthStart),
    events: [
      {
        id: createId(),
        title: 'Salary',
        amount: 2000,
        frequency: 'monthly',
        startDate: makeDate(1),
        endDate: '',
      },
      {
        id: createId(),
        title: 'Rent',
        amount: -875,
        frequency: 'monthly',
        startDate: makeDate(3),
        endDate: '',
      },
      {
        id: createId(),
        title: 'Internal bill',
        amount: -45,
        frequency: 'monthly',
        startDate: makeDate(12),
        endDate: '',
      },
      {
        id: createId(),
        title: 'Groceries',
        amount: -80,
        frequency: 'weekly',
        startDate: makeDate(5),
        endDate: '',
      },
      {
        id: createId(),
        title: 'Freelance shift',
        amount: 250,
        frequency: 'biweekly',
        startDate: makeDate(7),
        endDate: '',
      },
    ],
  }
}

export function coerceBudgetState(raw) {
  const fallback = createDefaultBudgetState()

  if (!raw || typeof raw !== 'object') {
    return fallback
  }

  const openingBalance = Number(raw.openingBalance)
  const openingDate =
    typeof raw.openingDate === 'string' && parseISODate(raw.openingDate)
      ? raw.openingDate
      : fallback.openingDate
  const events = Array.isArray(raw.events)
    ? raw.events.map(normalizeEvent).filter(Boolean)
    : fallback.events

  return {
    openingBalance: Number.isFinite(openingBalance) ? openingBalance : fallback.openingBalance,
    openingDate,
    events,
  }
}

export function getNextOccurrence(event, fromDate = toISODate(startOfToday())) {
  const normalizedEvent = normalizeEvent(event)

  if (!normalizedEvent) {
    return null
  }

  const startingPoint = parseISODate(fromDate)
  const firstPossible = parseISODate(normalizedEvent.startDate)

  if (!startingPoint || !firstPossible) {
    return null
  }

  let cursor = firstPossible > startingPoint ? firstPossible : startingPoint
  const hardStop = addMonths(cursor, 120)

  while (cursor <= hardStop) {
    if (eventOccursOnDate(normalizedEvent, cursor)) {
      return toISODate(cursor)
    }

    cursor = addDays(cursor, 1)
  }

  return null
}

export function buildCalendarModel(viewMonth, budget) {
  const monthStart = startOfMonth(viewMonth)
  const monthEnd = endOfMonth(monthStart)
  const gridStart = startOfWeek(monthStart)
  const gridEnd = endOfWeek(monthEnd)
  const todayIso = toISODate(startOfToday())
  const openingDate = parseISODate(budget.openingDate)
  const events = Array.isArray(budget.events) ? budget.events.map(normalizeEvent).filter(Boolean) : []
  const days = []
  const dayIndex = new Map()

  for (let cursor = gridStart; cursor <= gridEnd; cursor = addDays(cursor, 1)) {
    const iso = toISODate(cursor)
    const inCurrentMonth =
      cursor.getUTCMonth() === monthStart.getUTCMonth() &&
      cursor.getUTCFullYear() === monthStart.getUTCFullYear()

    const day = {
      iso,
      dayNumber: cursor.getUTCDate(),
      inCurrentMonth,
      isToday: iso === todayIso,
      balance: null,
      dayChange: 0,
      events: [],
    }

    days.push(day)
    dayIndex.set(iso, day)
  }

  if (openingDate && openingDate <= gridEnd) {
    let runningBalance = Number.isFinite(Number(budget.openingBalance))
      ? Number(budget.openingBalance)
      : 0

    for (let cursor = openingDate; cursor <= gridEnd; cursor = addDays(cursor, 1)) {
      const occurrences = events
        .filter((event) => eventOccursOnDate(event, cursor))
        .map((event) => ({
          id: event.id,
          title: event.title,
          amount: event.amount,
          frequency: event.frequency,
        }))
        .sort((left, right) => left.amount - right.amount || left.title.localeCompare(right.title))

      const dayChange = occurrences.reduce((total, occurrence) => total + occurrence.amount, 0)
      runningBalance += dayChange
      const visibleDay = dayIndex.get(toISODate(cursor))

      if (visibleDay) {
        visibleDay.events = occurrences
        visibleDay.dayChange = dayChange
        visibleDay.balance = runningBalance
      }
    }
  }

  const currentMonthDays = days.filter((day) => day.inCurrentMonth)
  let income = 0
  let expenses = 0
  let net = 0
  let closingBalance = null
  let openingBalanceForMonth = null
  let scheduledItems = 0

  for (const day of currentMonthDays) {
    if (day.balance === null) {
      continue
    }

    if (openingBalanceForMonth === null) {
      openingBalanceForMonth = day.balance - day.dayChange
    }

    if (day.dayChange > 0) {
      income += day.dayChange
    }

    if (day.dayChange < 0) {
      expenses += day.dayChange
    }

    net += day.dayChange
    scheduledItems += day.events.length
    closingBalance = day.balance
  }

  return {
    monthLabel: formatMonthLabel(monthStart),
    days,
    summary: {
      income,
      expenses,
      net,
      closingBalance,
      openingBalanceForMonth,
      scheduledItems,
      hasActiveDays: currentMonthDays.some((day) => day.balance !== null),
    },
  }
}
