process.env.APP_ORIGIN ??= 'http://127.0.0.1:8785'
process.env.API_PORT ??= '8786'

await import('./index.js')
