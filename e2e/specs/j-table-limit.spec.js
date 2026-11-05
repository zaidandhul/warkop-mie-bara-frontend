import assert from 'node:assert/strict'
import { adminLogin, api, closeActiveOrders, createOrder, setStatus } from '../support/api.js'
import { runId } from '../support/config.js'

// Default backend MAX_ACTIVE_ORDERS_PER_TABLE = 5. Meja 2 tidak dipakai spec lain.
const TABLE = '2'
const LIMIT = 5
const MILO = [{ itemId: 'milo', qty: 1 }]

const customerOrder = (name) => api('/orders', {
  method: 'POST',
  headers: { 'Idempotency-Key': crypto.randomUUID() },
  body: { tableNumber: TABLE, customer: { name }, paymentMethod: 'cashier', items: MILO },
})

describe('J. Batas pesanan aktif per meja', function () {
  let cookie
  const codes = []

  before(async function () {
    cookie = await adminLogin()
    await closeActiveOrders(cookie, TABLE)
  })

  after(async function () {
    await closeActiveOrders(cookie, TABLE)
  })

  it(`pelanggan: ${LIMIT} pesanan aktif diterima, pesanan ke-${LIMIT + 1} ditolak 409`, async function () {
    for (let index = 1; index <= LIMIT; index += 1) {
      codes.push((await createOrder({ name: `E2E Meja2 ${index} ${runId}`, table: TABLE, items: MILO })).id)
    }
    const rejected = await customerOrder(`E2E Meja2 lebih ${runId}`)
    assert.equal(rejected.status, 409, rejected.text)
    assert.match(rejected.json.error, /Meja 2 sudah punya 5 pesanan yang belum selesai/)
  })

  it('kasir tetap bisa menambah pesanan untuk meja yang sudah penuh', async function () {
    const result = await api('/admin/orders', {
      method: 'POST', cookie, headers: { 'Idempotency-Key': crypto.randomUUID() },
      body: { tableNumber: TABLE, customer: { name: `E2E Meja2 kasir ${runId}` }, items: MILO },
    })
    assert.equal(result.status, 201, result.text)
  })

  it('setelah satu pesanan selesai (atau dibatalkan), pelanggan bisa memesan lagi', async function () {
    for (const status of ['diproses', 'siap', 'selesai']) {
      assert.equal((await setStatus(cookie, codes[0], status)).status, 200)
    }
    assert.equal((await customerOrder(`E2E Meja2 lagi ${runId}`)).status, 201)
    assert.equal((await customerOrder(`E2E Meja2 penuh lagi ${runId}`)).status, 409)

    assert.equal((await setStatus(cookie, codes[1], 'dibatalkan')).status, 200)
    assert.equal((await customerOrder(`E2E Meja2 setelah batal ${runId}`)).status, 201)
  })

  it('pesanan bersamaan tidak bisa melewati batas: sisa kuota 1, tiga request serentak → tepat satu 201', async function () {
    await closeActiveOrders(cookie, TABLE)
    for (let index = 1; index < LIMIT; index += 1) {
      await createOrder({ name: `E2E Meja2 serentak ${index} ${runId}`, table: TABLE, items: MILO })
    }
    const results = await Promise.all([1, 2, 3].map((index) => customerOrder(`E2E Meja2 balapan ${index} ${runId}`)))
    const statuses = results.map((result) => result.status).sort()
    assert.deepEqual(statuses, [201, 409, 409], `Status: ${statuses.join(', ')}`)
  })
})
