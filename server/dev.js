process.env.APP_ENV ??= 'development'
process.env.NODE_ENV ??= 'development'

await import('./index.js')
