process.env.APP_ORIGIN ??= 'http://127.0.0.1:8787'
process.env.API_PORT ??= '8788'

await import('./index.js')
