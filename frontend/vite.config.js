// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { // Requests from frontend starting with /api
        target: 'http://localhost:3001', // Your backend server
        changeOrigin: true, // Recommended
        // If your backend routes DON'T start with /api (e.g., just /ask-gemini),
        // you might need to rewrite the path:
        // rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})