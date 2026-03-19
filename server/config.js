import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import './env.js'

const serverDirectory = dirname(fileURLToPath(import.meta.url))
const defaultHost = '127.0.0.1'

function parsePositiveNumber(value, fallback) {
  const parsedValue = Number(value)
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback
}

function parseBoolean(value, fallback) {
  if (typeof value !== 'string') {
    return fallback
  }

  switch (value.trim().toLowerCase()) {
    case '1':
    case 'true':
    case 'yes':
    case 'on':
      return true
    case '0':
    case 'false':
    case 'no':
    case 'off':
      return false
    default:
      return fallback
  }
}

function resolveAppEnvironment(value) {
  return typeof value === 'string' && value.trim().toLowerCase() === 'development'
    ? 'development'
    : 'production'
}

export const APP_ENV = resolveAppEnvironment(process.env.APP_ENV ?? process.env.NODE_ENV)
export const APP_ORIGIN =
  process.env.APP_ORIGIN ??
  `http://${defaultHost}:${APP_ENV === 'development' ? 8785 : 8787}`
export const API_HOST = process.env.API_HOST ?? defaultHost
export const API_PORT = parsePositiveNumber(
  process.env.API_PORT,
  APP_ENV === 'development' ? 8786 : 8787,
)
export const DATABASE_FILE =
  process.env.DATABASE_FILE ??
  join(
    serverDirectory,
    'data',
    APP_ENV === 'development' ? 'budlendar.dev.sqlite' : 'budlendar.prod.sqlite',
  )
export const SERVE_STATIC_CLIENT = parseBoolean(
  process.env.SERVE_STATIC_CLIENT,
  APP_ENV === 'production',
)
export const SESSION_COOKIE_NAME = 'budlendar_session'
export const SESSION_TTL_DAYS = parsePositiveNumber(process.env.SESSION_TTL_DAYS, 30)
export const VERIFICATION_TOKEN_TTL_HOURS = parsePositiveNumber(
  process.env.VERIFICATION_TOKEN_TTL_HOURS,
  24,
)
export const RESET_TOKEN_TTL_HOURS = parsePositiveNumber(process.env.RESET_TOKEN_TTL_HOURS, 1)
