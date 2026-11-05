import assert from 'node:assert/strict'
import { adminLogin, adminMenuItem, adminOrders, api, createOrder, patchMenu, setPayment, setStatus } from '../support/api.js'
import {
  By, DASHBOARD_WAIT, buildDriver, byTestId, click, loginUi, orderCard, quitDriver, textOf, waitText, waitVisible,
} from '../support/browser.js'
import { config, runId } from '../support/config.js'

const MILO = [{ itemId: 'milo', qty: 1 }]
const PRICE_ITEM = 'teh-tarik'
const auditLog = async (cookie) => (await api('/admin/audit-log?limit=20', { cookie })).json.entries

describe('L. Audit log staf', function () {
  let cookie
  let driver
  let originalMenu

  before(async function () {
    cookie = await adminLogin()
    originalMenu = await adminMenuItem(cookie, PRICE_ITEM)
  })

  after(async function () {
    await patchMenu(cookie, PRICE_ITEM, { price: originalMenu.price, isActive: originalMenu.isActive })
    await quitDriver(driver)
  })

  it('perubahan status dan pembayaran tercatat dengan nama staf; pesanan kasir mencatat pembuatnya', async function () {
    const order = await createOrder({ name: `E2E Audit ${runId}`, items: MILO })
    assert.equal((await setStatus(cookie, order.id, 'diproses')).status, 200)
    assert.equal((await setPayment(cookie, order.id, 'tunai')).status, 200)
    assert.equal((await setPayment(cookie, order.id, null)).status, 200)

    const stored = (await adminOrders(cookie)).find((o) => o.id === order.id)
    assert.deepEqual(
      stored.history.map((entry) => [entry.action, entry.oldValue, entry.newValue, entry.staff]),
      [
        ['order_status', 'menunggu', 'diproses', config.adminUser],
        ['order_payment', null, 'tunai', config.adminUser],
        ['order_payment', 'tunai', null, config.adminUser],
      ]
    )
    assert.equal(stored.createdBy, null, 'pesanan pelanggan tidak punya pembuat staf')

    const kasir = await api('/admin/orders', {
      method: 'POST', cookie, headers: { 'Idempotency-Key': crypto.randomUUID() },
      body: { tableNumber: '4', customer: { name: `E2E Audit kasir ${runId}` }, paidMethod: 'qris_manual', items: MILO },
    })
    const kasirOrder = (await adminOrders(cookie)).find((o) => o.id === kasir.json.id)
    assert.equal(kasirOrder.createdBy, config.adminUser)
    assert.equal(kasirOrder.paidBy, config.adminUser)
  })

  it('perubahan harga dan ketersediaan menu tercatat; menyimpan nilai yang sama tidak dicatat', async function () {
    const newPrice = originalMenu.price + 500
    await patchMenu(cookie, PRICE_ITEM, { price: newPrice })
    await patchMenu(cookie, PRICE_ITEM, { price: newPrice }) // sama: tidak dicatat
    await patchMenu(cookie, PRICE_ITEM, { isActive: !originalMenu.isActive })

    const entries = (await auditLog(cookie)).filter((entry) => entry.entityId === PRICE_ITEM).slice(0, 3)
    assert.deepEqual(entries.slice(0, 2).map((entry) => [entry.action, entry.oldValue, entry.newValue, entry.staff]), [
      ['menu_availability', originalMenu.isActive ? 'tersedia' : 'habis', originalMenu.isActive ? 'habis' : 'tersedia', config.adminUser],
      ['menu_price', String(originalMenu.price), String(newPrice), config.adminUser],
    ])
    assert.notEqual(entries[2]?.newValue, String(newPrice), 'Simpan harga yang sama ikut tercatat')
    assert.equal((await api('/admin/audit-log')).status, 401)
  })

  it('kanban: setelah klik "Proses", kartu menampilkan "Diubah oleh <staf>" dan riwayatnya', async function () {
    const order = await createOrder({ name: `E2E Audit UI ${runId}`, table: '3', items: MILO })
    driver = await buildDriver()
    await loginUi(driver)
    const card = await waitVisible(driver, orderCard(order.id), DASHBOARD_WAIT)
    assert.equal((await card.findElements(byTestId('order-changed-by'))).length, 0, 'Pesanan baru belum punya riwayat')
    await click(driver, await card.findElement(byTestId('action-diproses')))

    const changedBy = By.css(`[data-order-id="${order.id}"] [data-testid="order-changed-by"]`)
    const text = await waitText(driver, changedBy, (value) => value.startsWith(`Diubah oleh ${config.adminUser}`))
    assert.match(text, /\(Diproses\)$/)
    const refreshed = await waitVisible(driver, orderCard(order.id))
    assert.match(await textOf(await refreshed.findElement(byTestId('order-history'))), /Diproses · /)
  })
})
