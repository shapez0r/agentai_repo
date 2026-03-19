process.env.APP_ENV ??= 'production'
process.env.NODE_ENV ??= 'production'
process.env.APP_ORIGIN ??= 'http://127.0.0.1:8787'
process.env.API_PORT ??= '8788'
process.env.SERVE_STATIC_CLIENT ??= 'false'

await import('./index.js')
