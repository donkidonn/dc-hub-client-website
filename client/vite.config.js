import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/auth/discord': 'http://localhost:3000',
      '/auth/me': 'http://localhost:3000',
    },
  },

})