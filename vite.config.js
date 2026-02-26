import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    process: JSON.stringify({
      env: {
        NODE_ENV: 'development'
      }
    })
  },
  server: {
    port: 3000,
    open: false
  }
})
