import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// /api diteruskan ke backend, jadi frontend dan API satu origin: tidak perlu CORS dan cookie
// login staf tetap jalan saat dibuka dari tablet lewat IP LAN (host: true).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    proxy: {
      '/api': process.env.VITE_PROXY_TARGET || 'http://localhost:3000',
    },
  },
})
