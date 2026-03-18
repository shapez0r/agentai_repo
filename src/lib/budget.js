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

const MONTH_NAME_FORMATTER = new Intl.DateTimeFormat('en-IE', {
  month: 'long',
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

export const WEEKDAY_OPTIONS = [
  { value: 'monday', label: 'Monday', shortLabel: 'Mon', dayIndex: 1 },
  { value: 'tuesday', label: 'Tuesday', shortLabel: 'Tue', dayIndex: 2 },
  { value: 'wednesday', label: 'Wednesday', shortLabel: 'Wed', dayIndex: 3 },
  { value: 'thursday', label: 'Thursday', shortLabel: 'Thu', dayIndex: 4 },
  { value: 'friday', label: 'Friday', shortLabel: 'Fri', dayIndex: 5 },
  { value: 'saturday', label: 'Saturday', shortLabel: 'Sat', dayIndex: 6 },
  { value: 'sunday', label: 'Sunday', shortLabel: 'Sun', dayIndex: 0 },
]

export const WEEKDAY_LABELS = WEEKDAY_OPTIONS.map((option) => option.label)

export const WEEKDAY_ORDINAL_OPTIONS = [
  { value: 'first', label: 'First' },
  { value: 'second', label: 'Second' },
  { value: 'third', label: 'Third' },
  { value: 'fourth', label: 'Fourth' },
  { value: 'last', label: 'Last' },
]

export const EVENT_SCHEDULE_TYPE_OPTIONS = [
  { value: 'date', label: 'Calendar date' },
  { value: 'weekday', label: 'Weekday pattern' },
]

export const EVENT_ICON_OPTIONS = [
  { value: 'calendar', label: 'General', glyph: '🗓' },
  { value: 'work', label: 'Work', glyph: '💼' },
  { value: 'home', label: 'Home', glyph: '🏠' },
  { value: 'shopping', label: 'Shopping', glyph: '🛒' },
  { value: 'utilities', label: 'Utilities', glyph: '⚡' },
  { value: 'travel', label: 'Travel', glyph: '🚗' },
  { value: 'health', label: 'Health', glyph: '❤' },
  { value: 'gift', label: 'Gift', glyph: '🎁' },
  { value: 'savings', label: 'Savings', glyph: '🌱' },
]

export const FREQUENCY_OPTIONS = [
  { value: 'once', label: 'One time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

export const DEFAULT_EVENT_ICON = EVENT_ICON_OPTIONS[0].value

const allowedFrequencies = new Set(FREQUENCY_OPTIONS.map((option) => option.value))
const allowedWeekdays = new Set(WEEKDAY_OPTIONS.map((option) => option.value))
const allowedWeekdayOrdinals = new Set(WEEKDAY_ORDINAL_OPTIONS.map((option) => option.value))
const allowedScheduleTypes = new Set(EVENT_SCHEDULE_TYPE_OPTIONS.map((option) => option.value))
const allowedEventIcons = new Set(EVENT_ICON_OPTIONS.map((option) => option.value))
const weekdayIndexByValue = new Map(
  WEEKDAY_OPTIONS.map((option) => [option.value, option.dayIndex]),
)
const weekdayLabelByValue = new Map(WEEKDAY_OPTIONS.map((option) => [option.value, option.label]))
const weekdayShortLabelByValue = new Map(
  WEEKDAY_OPTIONS.map((option) => [option.value, option.shortLabel]),
)
const weekdayValueByIndex = new Map(WEEKDAY_OPTIONS.map((option) => [option.dayIndex, option.value]))
const weekdayOrdinalIndexByValue = new Map(
  WEEKDAY_ORDINAL_OPTIONS.map((option, index) => [option.value, index]),
)
const weekdayOrdinalLabelByValue = new Map(
  WEEKDAY_ORDINAL_OPTIONS.map((option) => [option.value, option.label]),
)

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

function formatDayOfMonth(day) {
  const remainder = day % 10
  const lastTwoDigits = day % 100
  let suffix = 'th'

  if (lastTwoDigits < 11 || lastTwoDigits > 13) {
    if (remainder === 1) {
      suffix = 'st'
    } else if (remainder === 2) {
      suffix = 'nd'
    } else if (remainder === 3) {
      suffix = 'rd'
    }
  }

  return `${day}${suffix}`
}

function resolveScheduleType(frequency, value) {
  if (frequency === 'weekly' || frequency === 'biweekly') {
    return 'weekday'
  }

  if (frequency === 'once' || frequency === 'daily') {
    return 'date'
  }

  return allowedScheduleTypes.has(value) ? value : 'date'
}

function getWeekdayValueForDateValue(value) {
  const date = value instanceof Date ? value : parseISODate(value)

  if (!date) {
    return ''
  }

  return weekdayValueByIndex.get(date.getUTCDay()) ?? ''
}

function getWeekdayOrdinalForDateValue(value) {
  const date = value instanceof Date ? value : parseISODate(value)

  if (!date) {
    return ''
  }

  const occurrenceIndex = Math.floor((date.getUTCDate() - 1) / 7)
  const nextOccurrenceDay = date.getUTCDate() + 7
  const isLast = nextOccurrenceDay > getDaysInMonth(date.getUTCFullYear(), date.getUTCMonth())

  if (isLast) {
    return 'last'
  }

  return WEEKDAY_ORDINAL_OPTIONS[occurrenceIndex]?.value ?? 'first'
}

function getWeekdayIndex(value) {
  return weekdayIndexByValue.get(value) ?? null
}

function getWeekdayDateForMonth(year, monthIndex, weekdayValue, ordinalValue) {
  const weekdayIndex = getWeekdayIndex(weekdayValue)

  if (weekdayIndex === null || !allowedWeekdayOrdinals.has(ordinalValue)) {
    return null
  }

  const matchingDays = []

  for (let day = 1; day <= getDaysInMonth(year, monthIndex); day += 1) {
    const candidate = createUtcDate(year, monthIndex, day)

    if (candidate.getUTCDay() === weekdayIndex) {
      matchingDays.push(day)
    }
  }

  if (matchingDays.length === 0) {
    return null
  }

  const day =
    ordinalValue === 'last'
      ? matchingDays[matchingDays.length - 1]
      : matchingDays[weekdayOrdinalIndexByValue.get(ordinalValue) ?? 0]

  return Number.isFinite(day) ? createUtcDate(year, monthIndex, day) : null
}

function getFirstWeekdayOnOrAfter(startDate, weekdayValue) {
  const weekdayIndex = getWeekdayIndex(weekdayValue)

  if (weekdayIndex === null) {
    return null
  }

  const dayOffset = (weekdayIndex - startDate.getUTCDay() + 7) % 7
  return addDays(startDate, dayOffset)
}

function normalizeEvent(event) {
  if (!event || typeof event !== 'object') {
    return null
  }

  const title = typeof event.title === 'string' ? event.title.trim() : ''
  const amount = Number(event.amount)
  const frequency = allowedFrequencies.has(event.frequency) ? event.frequency : 'monthly'
  const startDate = typeof event.startDate === 'string' ? event.startDate : ''
  const endDate = typeof event.endDate === 'string' ? event.endDate : ''

  if (!title || !Number.isFinite(amount) || !parseISODate(startDate)) {
    return null
  }

  if (endDate && (!parseISODate(endDate) || endDate < startDate)) {
    return null
  }

  const scheduleType = resolveScheduleType(frequency, event.scheduleType)
  const weekday =
    typeof event.weekday === 'string' && allowedWeekdays.has(event.weekday)
      ? event.weekday
      : getWeekdayValueForDateValue(startDate)
  const weekdayOrdinal =
    typeof event.weekdayOrdinal === 'string' && allowedWeekdayOrdinals.has(event.weekdayOrdinal)
      ? event.weekdayOrdinal
      : getWeekdayOrdinalForDateValue(startDate)
  const icon =
    typeof event.icon === 'string' && allowedEventIcons.has(event.icon)
      ? event.icon
      : DEFAULT_EVENT_ICON

  if ((frequency === 'weekly' || frequency === 'biweekly' || scheduleType === 'weekday') && !weekday) {
    return null
  }

  if ((frequency === 'monthly' || frequency === 'yearly') && scheduleType === 'weekday' && !weekdayOrdinal) {
    return null
  }

  return {
    id: typeof event.id === 'string' && event.id ? event.id : createId(),
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
    case 'weekly': {
      const firstOccurrence = getFirstWeekdayOnOrAfter(start, event.weekday)

      if (!firstOccurrence || date < firstOccurrence || date.getUTCDay() !== firstOccurrence.getUTCDay()) {
        return false
      }

      return differenceInDays(firstOccurrence, date) % 7 === 0
    }
    case 'biweekly': {
      const firstOccurrence = getFirstWeekdayOnOrAfter(start, event.weekday)

      if (!firstOccurrence || date < firstOccurrence || date.getUTCDay() !== firstOccurrence.getUTCDay()) {
        return false
      }

      return differenceInDays(firstOccurrence, date) % 14 === 0
    }
    case 'monthly': {
      if (event.scheduleType === 'weekday') {
        const occurrence = getWeekdayDateForMonth(
          date.getUTCFullYear(),
          date.getUTCMonth(),
          event.weekday,
          event.weekdayOrdinal,
        )

        return occurrence ? toISODate(occurrence) === toISODate(date) : false
      }

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

      if (event.scheduleType === 'weekday') {
        const occurrence = getWeekdayDateForMonth(
          date.getUTCFullYear(),
          date.getUTCMonth(),
          event.weekday,
          event.weekdayOrdinal,
        )

        return occurrence ? toISODate(occurrence) === toISODate(date) : false
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

export function getWeekdayValueForDate(value) {
  return getWeekdayValueForDateValue(value)
}

export function getWeekdayLabel(value, format = 'long') {
  if (format === 'short') {
    return weekdayShortLabelByValue.get(value) ?? ''
  }

  return weekdayLabelByValue.get(value) ?? ''
}

export function getWeekdayOrdinalForDate(value) {
  return getWeekdayOrdinalForDateValue(value)
}

export function getWeekdayOrdinalLabel(value) {
  return weekdayOrdinalLabelByValue.get(value) ?? ''
}

export function getDefaultScheduleType(frequency) {
  return resolveScheduleType(frequency, 'date')
}

export function describeFrequency(event) {
  const normalizedEvent = normalizeEvent(event)

  if (!normalizedEvent) {
    return 'Scheduled'
  }

  const startDate = parseISODate(normalizedEvent.startDate)

  switch (normalizedEvent.frequency) {
    case 'once':
      return 'One time'
    case 'daily':
      return 'Every day'
    case 'weekly':
      return `Every ${getWeekdayLabel(normalizedEvent.weekday)}`
    case 'biweekly':
      return `Every ${getWeekdayLabel(normalizedEvent.weekday)}, every 2 weeks`
    case 'monthly':
      if (normalizedEvent.scheduleType === 'weekday') {
        return `Every month on the ${getWeekdayOrdinalLabel(normalizedEvent.weekdayOrdinal).toLowerCase()} ${getWeekdayLabel(normalizedEvent.weekday)}`
      }

      return `Monthly on the ${formatDayOfMonth(startDate?.getUTCDate() ?? 1)}`
    case 'yearly':
      if (normalizedEvent.scheduleType === 'weekday') {
        return `Every year on the ${getWeekdayOrdinalLabel(normalizedEvent.weekdayOrdinal).toLowerCase()} ${getWeekdayLabel(normalizedEvent.weekday)} of ${MONTH_NAME_FORMATTER.format(startDate ?? startOfToday())}`
      }

      return `Every year on ${formatShortDate(normalizedEvent.startDate)}`
    default:
      return 'Scheduled'
  }
}

export function doesEventOccurOnDate(event, value) {
  const normalizedEvent = normalizeEvent(event)
  const date = value instanceof Date ? value : parseISODate(value)

  if (!normalizedEvent || !date) {
    return false
  }

  return eventOccursOnDate(normalizedEvent, date)
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
        scheduleType: 'date',
        startDate: makeDate(1),
        endDate: '',
        weekday: getWeekdayValueForDateValue(makeDate(1)),
        weekdayOrdinal: getWeekdayOrdinalForDateValue(makeDate(1)),
        icon: 'work',
      },
      {
        id: createId(),
        title: 'Rent',
        amount: -875,
        frequency: 'monthly',
        scheduleType: 'date',
        startDate: makeDate(3),
        endDate: '',
        weekday: getWeekdayValueForDateValue(makeDate(3)),
        weekdayOrdinal: getWeekdayOrdinalForDateValue(makeDate(3)),
        icon: 'home',
      },
      {
        id: createId(),
        title: 'Internal bill',
        amount: -45,
        frequency: 'monthly',
        scheduleType: 'date',
        startDate: makeDate(12),
        endDate: '',
        weekday: getWeekdayValueForDateValue(makeDate(12)),
        weekdayOrdinal: getWeekdayOrdinalForDateValue(makeDate(12)),
        icon: 'utilities',
      },
      {
        id: createId(),
        title: 'Groceries',
        amount: -80,
        frequency: 'weekly',
        scheduleType: 'weekday',
        startDate: makeDate(5),
        endDate: '',
        weekday: getWeekdayValueForDateValue(makeDate(5)),
        weekdayOrdinal: getWeekdayOrdinalForDateValue(makeDate(5)),
        icon: 'shopping',
      },
      {
        id: createId(),
        title: 'Freelance shift',
        amount: 250,
        frequency: 'biweekly',
        scheduleType: 'weekday',
        startDate: makeDate(7),
        endDate: '',
        weekday: getWeekdayValueForDateValue(makeDate(7)),
        weekdayOrdinal: getWeekdayOrdinalForDateValue(makeDate(7)),
        icon: 'work',
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
          startDate: event.startDate,
          endDate: event.endDate,
          scheduleType: event.scheduleType,
          weekday: event.weekday,
          weekdayOrdinal: event.weekdayOrdinal,
          icon: event.icon,
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
