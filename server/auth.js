import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_KEY_LENGTH = 64

export function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

export function isValidEmail(email) {
  return EMAIL_PATTERN.test(email)
}

export function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 8
}

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = scryptSync(password, salt, PASSWORD_KEY_LENGTH)
  return `scrypt:${salt}:${derivedKey.toString('hex')}`
}

export function verifyPassword(password, storedHash) {
  if (typeof storedHash !== 'string') {
    return false
  }

  const [algorithm, salt, expectedHash] = storedHash.split(':')

  if (algorithm !== 'scrypt' || !salt || !expectedHash) {
    return false
  }

  const expectedBuffer = Buffer.from(expectedHash, 'hex')
  const actualBuffer = scryptSync(password, salt, expectedBuffer.length)

  return timingSafeEqual(actualBuffer, expectedBuffer)
}

export function createOpaqueToken() {
  return randomBytes(32).toString('hex')
}

export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}
