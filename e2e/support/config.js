import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Nilai dari e2e/.env.e2e; variabel lingkungan yang sudah ada tidak ditimpa.
const envFile = fileURLToPath(new URL('../.env.e2e', import.meta.url))
if (existsSync(envFile)) process.loadEnvFile(envFile)

const required = ['E2E_ADMIN_USER', 'E2E_ADMIN_PASS', 'E2E_BASE_URL', 'E2E_API_URL']
const missing = required.filter((key) => !process.env[key])
if (missing.length) {
  throw new Error(`Variabel E2E belum diisi: ${missing.join(', ')}. Salin e2e/.env.e2e.example ke e2e/.env.e2e.`)
}

export const config = {
  adminUser: process.env.E2E_ADMIN_USER,
  adminPass: process.env.E2E_ADMIN_PASS,
  baseUrl: process.env.E2E_BASE_URL.replace(/\/+$/, ''),
  apiUrl: process.env.E2E_API_URL.replace(/\/+$/, ''),
  headless: process.env.E2E_HEADLESS === 'true',
}

export const url = (path) => `${config.baseUrl}${path}`

// Sama dengan rupiah() di src/utils/price.js.
export const rupiah = (n) => 'Rp' + n.toLocaleString('id-ID')

// Penanda unik per run supaya data uji dari run sebelumnya tidak tercampur.
export const runId = Date.now().toString(36).toUpperCase()
