import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 8787,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8788',
      },
    },
  },
  preview: {
    host: '127.0.0.1',
    port: 8787,
    strictPort: true,
  },
})
