// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { // Only needed if you run backend and want to test API calls
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // Your backend server
        changeOrigin: true,
      }
    }
  }
})