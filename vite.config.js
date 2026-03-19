import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  define: {
    __DEV__: JSON.stringify(true),
  },
  server: {
    host: '127.0.0.1',
    port: 8785,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8786',
      },
    },
  },
  preview: {
    host: '127.0.0.1',
    port: 8787,
    strictPort: false,
  },
})
