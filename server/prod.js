process.env.APP_ENV ??= 'production'
process.env.NODE_ENV ??= 'production'
process.env.SERVE_STATIC_CLIENT ??= 'true'

await import('./index.js')
