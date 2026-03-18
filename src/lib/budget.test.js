import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildCalendarModel,
  doesEventOccurOnDate,
  getNextOccurrence,
  parseISODate,
} from './budget.js'

test('weekly events can start later than their chosen weekday anchor', () => {
  const event = {
    id: 'weekly-monday',
    title: 'Standup',
    amount: -25,
    frequency: 'weekly',
    scheduleType: 'weekday',
    weekday: 'monday',
    weekdayOrdinal: 'third',
    icon: 'work',
    startDate: '2026-03-18',
    endDate: '',
  }

  assert.equal(getNextOccurrence(event, '2026-03-18'), '2026-03-23')
  assert.equal(doesEventOccurOnDate(event, '2026-03-23'), true)
  assert.equal(doesEventOccurOnDate(event, '2026-03-30'), true)
  assert.equal(doesEventOccurOnDate(event, '2026-03-24'), false)
})

test('monthly weekday patterns land on the requested week and weekday', () => {
  const event = {
    id: 'monthly-first-monday',
    title: 'Leadership review',
    amount: 300,
    frequency: 'monthly',
    scheduleType: 'weekday',
    weekday: 'monday',
    weekdayOrdinal: 'first',
    icon: 'calendar',
    startDate: '2026-03-01',
    endDate: '',
  }

  assert.equal(doesEventOccurOnDate(event, '2026-03-02'), true)
  assert.equal(doesEventOccurOnDate(event, '2026-04-06'), true)
  assert.equal(doesEventOccurOnDate(event, '2026-03-09'), false)
  assert.equal(getNextOccurrence(event, '2026-03-03'), '2026-04-06')
})

test('calendar models keep icon metadata on projected occurrences', () => {
  const viewMonth = parseISODate('2026-03-01')
  const calendar = buildCalendarModel(viewMonth, {
    openingBalance: 1000,
    openingDate: '2026-03-01',
    events: [
      {
        id: 'rent',
        title: 'Rent',
        amount: -800,
        frequency: 'monthly',
        scheduleType: 'date',
        weekday: 'tuesday',
        weekdayOrdinal: 'first',
        icon: 'home',
        startDate: '2026-03-03',
        endDate: '',
      },
    ],
  })

  const rentDay = calendar.days.find((day) => day.iso === '2026-03-03')

  assert.ok(rentDay)
  assert.equal(rentDay.dayChange, -800)
  assert.equal(rentDay.events[0].icon, 'home')
  assert.equal(rentDay.events[0].title, 'Rent')
})
