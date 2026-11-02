import assert from 'node:assert/strict'
import { adminLogin, adminOrders, api, publicMenu } from '../support/api.js'
import {
  By, DASHBOARD_WAIT, buildDriver, byTestId, click, clickTestId, loginUi, orderCard, quitDriver, typeInto, until,
  waitText, waitVisible,
} from '../support/browser.js'
import { runId, url } from '../support/config.js'

const adminOrder = (cookie, body) => api('/admin/orders', {
  method: 'POST', cookie, headers: { 'Idempotency-Key': crypto.randomUUID() }, body,
})

describe('H. Pesanan manual kasir', function () {
  let cookie
  let driver

  before(async function () {
    cookie = await adminLogin()
  })

  after(async function () {
    await quitDriver(driver)
  })

  it('API: wajib login; tanpa nama dinamai "Meja N", source kasir, bisa langsung lunas', async function () {
    const body = { tableNumber: '4', customer: { name: '' }, paidMethod: 'tunai', items: [{ itemId: 'milo', qty: 2 }] }
    assert.equal((await adminOrder('', body)).status, 401)

    const created = await adminOrder(cookie, body)
    assert.equal(created.status, 201, created.text)
    assert.equal(created.json.paid, true)
    const stored = (await adminOrders(cookie)).find((order) => order.id === created.json.id)
    assert.equal(stored.customerName, 'Meja 4')
    assert.equal(stored.source, 'kasir')
    assert.equal(stored.paidMethod, 'tunai')
    assert.equal(stored.paymentMethod, 'cashier')
  })

  it('API: paidMethod tidak dikenal ditolak; paidMethod dari pelanggan (rute publik) diabaikan', async function () {
    const bad = await adminOrder(cookie, { tableNumber: '4', paidMethod: 'online', items: [{ itemId: 'milo', qty: 1 }] })
    assert.equal(bad.status, 400)

    const name = `E2E Curang ${runId}`
    const publicOrder = await api('/orders', {
      method: 'POST',
      headers: { 'Idempotency-Key': crypto.randomUUID() },
      body: { tableNumber: '4', customer: { name }, paymentMethod: 'cashier', paidMethod: 'tunai', items: [{ itemId: 'milo', qty: 1 }] },
    })
    assert.equal(publicOrder.status, 201)
    assert.equal(publicOrder.json.paid, false)
    const stored = (await adminOrders(cookie)).find((order) => order.customerName === name)
    assert.equal(stored.paidAt, null)
    assert.equal(stored.source, 'pelanggan')
  })

  it('UI: kasir memilih menu + level, meja 6, Lunas · QRIS; pesanan muncul di kanban dengan label Kasir', async function () {
    const menu = await publicMenu()
    const bangladesh = menu.categories.flatMap((category) => category.items).find((item) => item.id === 'mie-bangladesh')
    const name = `E2E Kasir ${runId}`

    driver = await buildDriver()
    await loginUi(driver)
    await driver.get(url('/admin/pesanan-baru'))
    await typeInto(await waitVisible(driver, byTestId('manual-search')), 'bangladesh')
    await clickTestId(driver, 'manual-item-mie-bangladesh')
    const sheet = await waitVisible(driver, By.css('[role="dialog"]'))
    await click(driver, await sheet.findElement(By.xpath('.//button[normalize-space()="Level 2"]')))
    await click(driver, await sheet.findElement(byTestId('item-save')))
    await driver.wait(until.stalenessOf(sheet), 5000)

    const expectedTotal = bangladesh.price + menu.levelPriceStep + menu.fee
    await waitText(driver, byTestId('manual-total'), (text) => text === `Rp${expectedTotal.toLocaleString('id-ID')}`)
    await driver.findElement(byTestId('manual-table')).sendKeys('Meja 6')
    await typeInto(await driver.findElement(byTestId('manual-name')), name)
    await clickTestId(driver, 'manual-pay-qris_manual')
    await clickTestId(driver, 'manual-submit')
    const message = await waitText(driver, byTestId('manual-created'), (text) => text.includes('MB-'))
    assert.match(message, /Meja 6/)
    assert.match(message, /Lunas/)

    const stored = (await adminOrders(cookie)).find((order) => order.customerName === name)
    assert.equal(stored.source, 'kasir')
    assert.equal(stored.paidMethod, 'qris_manual')
    assert.equal(stored.total, expectedTotal)
    assert.equal(stored.items[0].options.level, 2)

    await driver.get(url('/admin'))
    const card = await waitVisible(driver, orderCard(stored.id), DASHBOARD_WAIT)
    assert.equal((await card.findElements(byTestId('badge-kasir'))).length, 1, 'Label Kasir tidak tampil')
  })
})
