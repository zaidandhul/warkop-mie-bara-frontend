import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// /api diteruskan ke backend, jadi frontend dan API satu origin: tidak perlu CORS dan cookie
// login staf tetap jalan saat dibuka dari tablet lewat IP LAN (host: true).
// VITE_PROXY_TARGET bisa diatur lewat environment atau file .env.[mode] (mis. .env.test untuk E2E).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: true,
      proxy: {
        '/api': process.env.VITE_PROXY_TARGET || env.VITE_PROXY_TARGET || 'http://localhost:3000',
      },
    },
  }
})
