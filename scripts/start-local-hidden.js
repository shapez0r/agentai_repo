import { createWriteStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const viteBin = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js')

const logFiles = {
  apiOut: path.join(projectRoot, 'prod-api.hidden.out.log'),
  apiErr: path.join(projectRoot, 'prod-api.hidden.err.log'),
  clientOut: path.join(projectRoot, 'prod-client.hidden.out.log'),
  clientErr: path.join(projectRoot, 'prod-client.hidden.err.log'),
}

await mkdir(projectRoot, { recursive: true })

const streams = {
  apiOut: createWriteStream(logFiles.apiOut, { flags: 'a' }),
  apiErr: createWriteStream(logFiles.apiErr, { flags: 'a' }),
  clientOut: createWriteStream(logFiles.clientOut, { flags: 'a' }),
  clientErr: createWriteStream(logFiles.clientErr, { flags: 'a' }),
}

const children = []
let shuttingDown = false

function spawnHidden(command, args, extraEnv = {}) {
  const child = spawn(command, args, {
    cwd: projectRoot,
    env: {
      ...process.env,
      ...extraEnv,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })

  children.push(child)
  return child
}

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return
  }

  shuttingDown = true

  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGTERM')
    }
  }

  setTimeout(() => {
    for (const child of children) {
      if (!child.killed) {
        child.kill('SIGKILL')
      }
    }

    for (const stream of Object.values(streams)) {
      stream.end()
    }

    process.exit(exitCode)
  }, 500)
}

function wireLogs(child, stdoutStream, stderrStream, name) {
  child.stdout.pipe(stdoutStream)
  child.stderr.pipe(stderrStream)

  child.on('exit', (code, signal) => {
    if (shuttingDown) {
      return
    }

    const reason = signal ? `signal ${signal}` : `code ${code ?? 0}`
    process.stderr.write(`[start:local] ${name} exited with ${reason}\n`)
    shutdown(code ?? 1)
  })

  child.on('error', (error) => {
    if (shuttingDown) {
      return
    }

    process.stderr.write(`[start:local] Failed to start ${name}: ${error.message}\n`)
    shutdown(1)
  })
}

const api = spawnHidden(process.execPath, ['server/preview.js'], {
  APP_ENV: 'production',
  NODE_ENV: 'production',
  APP_ORIGIN: 'http://127.0.0.1:8787',
  API_PORT: '8788',
  SERVE_STATIC_CLIENT: 'false',
})

const client = spawnHidden(process.execPath, [
  viteBin,
  'preview',
  '--host',
  '127.0.0.1',
  '--port',
  '8787',
  '--strictPort',
], {
  NODE_ENV: 'production',
})

wireLogs(api, streams.apiOut, streams.apiErr, 'preview API')
wireLogs(client, streams.clientOut, streams.clientErr, 'preview client')

process.stdout.write('[start:local] Hidden production-style services running on http://127.0.0.1:8787 and http://127.0.0.1:8788\n')

for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(signal, () => shutdown(0))
}
