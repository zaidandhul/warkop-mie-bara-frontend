import assert from 'node:assert/strict'
import { api, publicMenu } from '../support/api.js'
import { By, buildDriver, byTestId, loginUi, quitDriver, typeInto, waitVisible } from '../support/browser.js'
import { runId, url } from '../support/config.js'

const order = (table) => api('/orders', {
  method: 'POST',
  headers: { 'Idempotency-Key': crypto.randomUUID() },
  body: { tableNumber: table, customer: { name: `E2E Meja ${runId}` }, paymentMethod: 'cashier', items: [{ itemId: 'milo', qty: 1 }] },
})

describe('G. QR meja', function () {
  let driver
  let tableCount

  before(async function () {
    tableCount = (await publicMenu()).tableCount
    driver = await buildDriver()
    await loginUi(driver)
  })

  after(async function () {
    await quitDriver(driver)
  })

  it('GET /api/menu mengirim tableCount = 10; meja 10 diterima, meja 11 ditolak', async function () {
    assert.equal(tableCount, 10)
    assert.equal((await order(String(tableCount))).status, 201)
    const rejected = await order(String(tableCount + 1))
    assert.equal(rejected.status, 400)
    assert.match(rejected.json.error, /1 sampai 10/)
  })

  it('/admin/qr menampilkan satu QR per meja dengan tautan ?tableNumber=N dari alamat yang diisi', async function () {
    await driver.get(url('/admin/qr'))
    await waitVisible(driver, byTestId('qr-card'))
    await typeInto(await driver.findElement(byTestId('qr-base-url')), 'http://192.168.1.10:5173/')

    const cards = await driver.findElements(byTestId('qr-card'))
    assert.equal(cards.length, tableCount)
    for (const [index, card] of cards.entries()) {
      assert.equal(await card.getAttribute('data-url'), `http://192.168.1.10:5173/?tableNumber=${index + 1}`)
      assert.equal((await card.findElements(By.css('svg'))).length, 1, `QR meja ${index + 1} tidak ter-render`)
    }
    assert.equal(await (await driver.findElement(byTestId('qr-print'))).isEnabled(), true)
  })

  it('pelanggan: pilihan meja hanya 1–10 dan meja di luar jangkauan dari tautan dikosongkan', async function () {
    await driver.get(url('/?tableNumber=12'))
    const select = await waitVisible(driver, byTestId('table-select'))
    await driver.wait(async () => (await select.findElements(By.css('option'))).length === tableCount + 1, 10000)
    assert.equal(await select.getAttribute('value'), '', 'Meja 12 tidak dikosongkan')
  })
})
