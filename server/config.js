import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import './env.js'

const serverDirectory = dirname(fileURLToPath(import.meta.url))

function parsePositiveNumber(value, fallback) {
  const parsedValue = Number(value)
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback
}

export const APP_ORIGIN = process.env.APP_ORIGIN ?? 'http://localhost:3000'
export const API_HOST = process.env.API_HOST ?? '127.0.0.1'
export const API_PORT = parsePositiveNumber(process.env.API_PORT, 8787)
export const DATABASE_FILE =
  process.env.DATABASE_FILE ?? join(serverDirectory, 'data', 'ledger-garden.sqlite')
export const SESSION_COOKIE_NAME = 'ledger_garden_session'
export const SESSION_TTL_DAYS = parsePositiveNumber(process.env.SESSION_TTL_DAYS, 30)
export const VERIFICATION_TOKEN_TTL_HOURS = parsePositiveNumber(
  process.env.VERIFICATION_TOKEN_TTL_HOURS,
  24,
)
export const RESET_TOKEN_TTL_HOURS = parsePositiveNumber(process.env.RESET_TOKEN_TTL_HOURS, 1)
