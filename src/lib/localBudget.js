import { coerceBudgetState, createDefaultBudgetState } from './budget.js'

const STORAGE_KEY = 'budlendar-budget-v1'
const LEGACY_STORAGE_KEY = 'ledger-garden-budget-v1'

export function loadStoredBudget() {
  if (typeof window === 'undefined') {
    return createDefaultBudgetState()
  }

  try {
    const storedState =
      window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY)
    return storedState ? coerceBudgetState(JSON.parse(storedState)) : createDefaultBudgetState()
  } catch {
    return createDefaultBudgetState()
  }
}

export function saveStoredBudget(budget) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(coerceBudgetState(budget)))
    window.localStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    // Ignore storage errors so the calendar remains usable.
  }
}
