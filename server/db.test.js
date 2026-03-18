import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

async function loadDbModule() {
  const tempDirectory = mkdtempSync(join(tmpdir(), 'budlendar-db-'))
  const databasePath = join(tempDirectory, 'budlendar.sqlite')

  process.env.DATABASE_FILE = databasePath

  const moduleUrl = new URL(`./db.js?test=${Date.now()}-${Math.random()}`, import.meta.url)
  const dbModule = await import(moduleUrl)

  return {
    ...dbModule,
    tempDirectory,
  }
}

test('recurring events can be created and updated with schedule metadata', async (t) => {
  const dbModule = await loadDbModule()

  t.after(() => {
    dbModule.db.close()
    rmSync(dbModule.tempDirectory, { recursive: true, force: true })
    delete process.env.DATABASE_FILE
  })

  const user = dbModule.createUser({
    email: 'budget@example.com',
    passwordHash: 'not-a-real-hash',
  })

  const createdEvent = dbModule.createRecurringEvent(user.id, {
    title: 'Groceries',
    amount: -80,
    frequency: 'weekly',
    scheduleType: 'weekday',
    weekday: 'friday',
    weekdayOrdinal: 'first',
    icon: 'shopping',
    startDate: '2026-03-18',
    endDate: '',
  })

  assert.equal(createdEvent.scheduleType, 'weekday')
  assert.equal(createdEvent.weekday, 'friday')
  assert.equal(createdEvent.icon, 'shopping')

  const updatedEvent = dbModule.updateRecurringEvent(user.id, createdEvent.id, {
    title: 'Mortgage',
    amount: -1200,
    frequency: 'monthly',
    scheduleType: 'weekday',
    weekday: 'monday',
    weekdayOrdinal: 'first',
    icon: 'home',
    startDate: '2026-03-01',
    endDate: '2026-12-31',
  })

  assert.equal(updatedEvent.title, 'Mortgage')
  assert.equal(updatedEvent.frequency, 'monthly')
  assert.equal(updatedEvent.weekday, 'monday')
  assert.equal(updatedEvent.weekdayOrdinal, 'first')
  assert.equal(updatedEvent.icon, 'home')

  const budget = dbModule.fetchBudgetState(user.id)

  assert.equal(budget.events.length, 1)
  assert.equal(budget.events[0].title, 'Mortgage')
  assert.equal(budget.events[0].scheduleType, 'weekday')
  assert.equal(budget.events[0].weekday, 'monday')
  assert.equal(budget.events[0].weekdayOrdinal, 'first')
  assert.equal(budget.events[0].icon, 'home')
})
