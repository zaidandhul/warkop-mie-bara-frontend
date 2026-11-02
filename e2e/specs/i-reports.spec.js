import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { strFromU8, unzipSync } from 'fflate'
import { adminLogin, adminOrders, api, createOrder, setPayment } from '../support/api.js'
import { buildDriver, byTestId, clickTestId, loginUi, quitDriver, waitText } from '../support/browser.js'
import { rupiah, runId, url } from '../support/config.js'

const report = (cookie, query = '') => api(`/admin/reports/sales${query}`, { cookie })

describe('I. Laporan penjualan', function () {
  let cookie
  let driver
  let downloadDir
  let paidCode

  before(async function () {
    cookie = await adminLogin()
    // Pesanan yang pasti ada di laporan hari ini: satu lunas tunai (meja 9), satu belum bayar.
    paidCode = (await createOrder({ name: `E2E Laporan ${runId}`, table: '9', items: [{ itemId: 'milo', qty: 3 }] })).id
    await setPayment(cookie, paidCode, 'tunai')
    await createOrder({ name: `E2E Laporan Belum ${runId}`, table: '9', items: [{ itemId: 'milo', qty: 1 }] })
  })

  after(async function () {
    await quitDriver(driver)
    if (downloadDir) rmSync(downloadDir, { recursive: true, force: true })
  })

  it('API: angka laporan hari ini cocok dengan daftar pesanan dashboard', async function () {
    const result = await report(cookie)
    assert.equal(result.status, 200, result.text)
    const { summary, byTable, byHour, topItems } = result.json
    const active = (await adminOrders(cookie)).filter((order) => order.status !== 'dibatalkan')

    assert.equal(summary.orders, active.length)
    assert.equal(summary.revenue, active.reduce((sum, order) => sum + order.total, 0))
    assert.equal(summary.paidRevenue + summary.unpaidRevenue, summary.revenue)
    assert.equal(summary.byPaidMethod.tunai + summary.byPaidMethod.qris_manual, summary.paidRevenue)
    assert.equal(byTable.reduce((sum, row) => sum + row.revenue, 0), summary.revenue)
    assert.equal(byHour.reduce((sum, row) => sum + row.orders, 0), summary.orders)
    assert.ok(byTable.some((row) => row.table === '9' && row.orders >= 2), 'Meja 9 tidak ada di laporan')
    assert.equal(topItems[0].itemId, 'milo', 'Milo bukan menu terlaris')
  })

  it('API: tanggal tidak valid / terbalik / lebih dari 92 hari dibalas 400; tanpa login 401', async function () {
    for (const query of ['?from=2026-02-30', '?from=2026-11-05&to=2026-11-01', '?from=2026-01-01&to=2026-12-31']) {
      assert.equal((await report(cookie, query)).status, 400, query)
    }
    assert.equal((await report('')).status, 401)
  })

  it('UI: omzet tampil sesuai API, dan "Ekspor Excel" mengunduh .xlsx berisi 6 sheet dan pesanan uji', async function () {
    const { summary } = (await report(cookie)).json
    downloadDir = mkdtempSync(join(tmpdir(), 'mb-e2e-xlsx-'))
    driver = await buildDriver()
    await driver.sendDevToolsCommand('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloadDir })
    await loginUi(driver)
    await driver.get(url('/admin/laporan'))
    await waitText(driver, byTestId('report-revenue'), (text) => text === rupiah(summary.revenue))

    await clickTestId(driver, 'report-export')
    let file
    await driver.wait(() => {
      file = readdirSync(downloadDir).find((name) => name.endsWith('.xlsx'))
      return Boolean(file)
    }, 15000, 'File .xlsx tidak terunduh')
    assert.match(file, /^laporan-penjualan_\d{4}-\d{2}-\d{2}_\d{4}-\d{2}-\d{2}\.xlsx$/)

    const zip = unzipSync(readFileSync(join(downloadDir, file)))
    const workbook = strFromU8(zip['xl/workbook.xml'])
    for (const name of ['Ringkasan', 'Pesanan', 'Per Meja', 'Per Jam', 'Per Hari', 'Menu Terlaris']) {
      assert.ok(workbook.includes(`name="${name}"`), `Sheet "${name}" tidak ada`)
    }
    const allXml = Object.entries(zip).filter(([path]) => path.endsWith('.xml')).map(([, data]) => strFromU8(data)).join('')
    assert.ok(allXml.includes(paidCode), 'Kode pesanan uji tidak ada di file Excel')
    assert.ok(existsSync(join(downloadDir, file)))
  })
})
