import assert from 'node:assert/strict'
import test from 'node:test'

const CONFIG_ENV_KEYS = [
  'APP_ENV',
  'NODE_ENV',
  'APP_ORIGIN',
  'API_HOST',
  'API_PORT',
  'DATABASE_FILE',
  'SERVE_STATIC_CLIENT',
]

function withConfigEnvironment(overrides) {
  const previousValues = new Map(
    CONFIG_ENV_KEYS.map((key) => [key, Object.hasOwn(process.env, key) ? process.env[key] : undefined]),
  )

  for (const key of CONFIG_ENV_KEYS) {
    delete process.env[key]
  }

  for (const [key, value] of Object.entries(overrides)) {
    if (value !== undefined) {
      process.env[key] = value
    }
  }

  return async () => {
    for (const key of CONFIG_ENV_KEYS) {
      delete process.env[key]
    }

    for (const [key, value] of previousValues.entries()) {
      if (value !== undefined) {
        process.env[key] = value
      }
    }
  }
}

async function loadConfig(overrides = {}) {
  const restoreEnvironment = withConfigEnvironment(overrides)

  try {
    const moduleUrl = new URL(`./config.js?test=${Date.now()}-${Math.random()}`, import.meta.url)
    return await import(moduleUrl)
  } finally {
    await restoreEnvironment()
  }
}

test('development app environment uses the development database by default', async () => {
  const config = await loadConfig({
    APP_ENV: 'development',
    NODE_ENV: 'production',
  })

  assert.equal(config.APP_ENV, 'development')
  assert.equal(config.APP_ORIGIN, 'http://127.0.0.1:8785')
  assert.equal(config.API_PORT, 8786)
  assert.match(config.DATABASE_FILE, /budlendar\.dev\.sqlite$/)
  assert.equal(config.SERVE_STATIC_CLIENT, false)
})

test('production defaults use the production database and static client serving', async () => {
  const config = await loadConfig()

  assert.equal(config.APP_ENV, 'production')
  assert.equal(config.APP_ORIGIN, 'http://127.0.0.1:8787')
  assert.equal(config.API_PORT, 8787)
  assert.match(config.DATABASE_FILE, /budlendar\.prod\.sqlite$/)
  assert.equal(config.SERVE_STATIC_CLIENT, true)
})

test('explicit static serving overrides are respected', async () => {
  const config = await loadConfig({
    APP_ENV: 'production',
    SERVE_STATIC_CLIENT: 'false',
  })

  assert.equal(config.SERVE_STATIC_CLIENT, false)
})
