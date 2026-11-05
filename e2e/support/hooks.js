import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { adminLogin, api, closeActiveOrders } from './api.js'
import { activeDrivers } from './browser.js'
import { config } from './config.js'

const screenshotDir = fileURLToPath(new URL('../screenshots/', import.meta.url))

// Root hooks Mocha untuk semua spec.
export const mochaHooks = {
  // Pengaman: test hanya boleh jalan terhadap backend yang memakai database *_test.
  async beforeAll() {
    let health
    try {
      health = await api('/health')
    } catch (error) {
      throw new Error(`Backend uji tidak bisa dihubungi di ${config.apiUrl} (${error.message}). Jalankan "npm run dev:test" di backend.`)
    }
    if (health.status !== 200 || health.json?.testMode !== true) {
      throw new Error(
        `Dibatalkan: ${config.apiUrl}/health tidak melaporkan testMode=true. ` +
        'Test E2E hanya boleh dijalankan terhadap backend dengan database kopi_miebara_test (npm run dev:test).'
      )
    }
    const page = await fetch(config.baseUrl).catch(() => null)
    if (!page?.ok) throw new Error(`Frontend uji tidak bisa dibuka di ${config.baseUrl}. Jalankan "npm run dev:e2e".`)

    // Pesanan uji dari run sebelumnya (hari ini) ditutup, supaya batas pesanan aktif per meja
    // (MAX_ACTIVE_ORDERS_PER_TABLE) tidak sudah penuh sebelum test dimulai. Aman: hanya database *_test.
    const closed = await closeActiveOrders(await adminLogin())
    if (closed) console.log(`  (${closed} pesanan aktif sisa run sebelumnya ditutup)`)
  },

  async afterEach() {
    if (this.currentTest?.state !== 'failed' || !activeDrivers.size) return
    await mkdir(screenshotDir, { recursive: true })
    const slug = this.currentTest.fullTitle().replace(/[^a-zA-Z0-9]+/g, '-').slice(0, 100)
    let index = 0
    for (const driver of activeDrivers) {
      try {
        const file = `${screenshotDir}${new Date().toISOString().replace(/[:.]/g, '-')}-${slug}-${index++}.png`
        await writeFile(file, await driver.takeScreenshot(), 'base64')
        console.log(`      📸 screenshot: ${file}`)
      } catch (error) {
        console.log(`      (screenshot gagal: ${error.message})`)
      }
    }
  },
}
