import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function getBasePath() {
  if (process.env.VITE_BASE_PATH) {
    return process.env.VITE_BASE_PATH
  }

  if (process.env.GITHUB_ACTIONS && process.env.GITHUB_REPOSITORY) {
    const repositoryName = process.env.GITHUB_REPOSITORY.split('/')[1]

    return `/${repositoryName}/`
  }

  return '/'
}

// https://vite.dev/config/
export default defineConfig({
  base: getBasePath(),
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
  },
})
