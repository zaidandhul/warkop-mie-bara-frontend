import assert from 'node:assert/strict'
import { adminLogin, api, createOrder, ordersByName, setPayment, setStatus } from '../support/api.js'
import {
  By, DASHBOARD_WAIT, buildDriver, byTestId, click, loginUi, orderCard, quitDriver, waitText, waitVisible,
} from '../support/browser.js'
import { runId } from '../support/config.js'

const MILO = [{ itemId: 'milo', qty: 1 }]

describe('F. Status pembayaran', function () {
  let cookie
  let driver

  before(async function () {
    cookie = await adminLogin()
  })

  after(async function () {
    await quitDriver(driver)
  })

  it('API: tandai lunas tunai, tolak lunas dua kali, tolak batal saat lunas, lalu batalkan lunas', async function () {
    const order = await createOrder({ name: `E2E Lunas ${runId}`, items: MILO })
    assert.equal((await api(`/orders/${order.id}`)).json.paid, false)

    const paid = await setPayment(cookie, order.id, 'tunai')
    assert.equal(paid.status, 200, paid.text)
    assert.equal(paid.json.paidMethod, 'tunai')
    assert.ok(paid.json.paidAt)
    assert.equal((await api(`/orders/${order.id}`)).json.paid, true, 'Respons publik belum lunas')
    const [stored] = await ordersByName(cookie, `E2E Lunas ${runId}`)
    assert.equal(stored.paidMethod, 'tunai')

    assert.equal((await setPayment(cookie, order.id, 'qris_manual')).status, 409, 'Lunas dua kali tidak ditolak')
    assert.equal((await setStatus(cookie, order.id, 'dibatalkan')).status, 400, 'Pesanan lunas bisa dibatalkan')

    const undone = await setPayment(cookie, order.id, null)
    assert.equal(undone.status, 200, undone.text)
    assert.equal(undone.json.paidAt, null)
    assert.equal((await setPayment(cookie, order.id, null)).status, 409, 'Batal lunas dua kali tidak ditolak')
  })

  it('API: metode tidak dikenal 400, pesanan dibatalkan tidak bisa lunas, tanpa login 401', async function () {
    const order = await createOrder({ name: `E2E Lunas Batal ${runId}`, items: MILO })
    assert.equal((await setPayment(cookie, order.id, 'online')).status, 400)
    assert.equal((await api(`/admin/orders/${order.id}/payment`, { method: 'PATCH', cookie, body: {} })).status, 400)
    assert.equal((await setPayment('', order.id, 'tunai')).status, 401)
    assert.equal((await setStatus(cookie, order.id, 'dibatalkan')).status, 200)
    assert.equal((await setPayment(cookie, order.id, 'tunai')).status, 400, 'Pesanan dibatalkan bisa ditandai lunas')
  })

  it('kanban: tombol "Lunas · QRIS" mengubah label menjadi Lunas dan menyembunyikan tombol Batalkan', async function () {
    const order = await createOrder({ name: `E2E Lunas UI ${runId}`, table: '3', items: MILO })
    driver = await buildDriver()
    await loginUi(driver)
    const card = await waitVisible(driver, orderCard(order.id), DASHBOARD_WAIT)
    assert.equal(await (await card.findElement(byTestId('payment-status'))).getText(), 'Belum bayar')
    assert.equal((await card.findElements(byTestId('action-dibatalkan'))).length, 1)

    await click(driver, await card.findElement(byTestId('pay-qris_manual')))
    const status = By.css(`[data-testid="order-card"][data-order-id="${order.id}"] [data-testid="payment-status"]`)
    await waitText(driver, status, (text) => text.startsWith('✓ Lunas · QRIS'))
    assert.equal((await card.findElements(byTestId('action-dibatalkan'))).length, 0, 'Tombol Batalkan masih tampil')
    assert.equal((await card.findElements(byTestId('pay-tunai'))).length, 0, 'Tombol lunas masih tampil')

    const [stored] = await ordersByName(cookie, `E2E Lunas UI ${runId}`)
    assert.equal(stored.paidMethod, 'qris_manual')
  })
})
