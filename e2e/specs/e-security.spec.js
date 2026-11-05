import assert from 'node:assert/strict'
import { adminLogin, api, createOrder, ordersByName, setStatus } from '../support/api.js'
import { runId } from '../support/config.js'

// Tanpa browser: langsung lewat HTTP ke backend uji.
describe('E. Keamanan API', function () {
  let cookie

  before(async function () {
    cookie = await adminLogin()
  })

  it('header keamanan terpasang dan X-Powered-By tidak dikirim', async function () {
    for (const path of ['/health', '/menu', '/admin/orders']) {
      const { headers } = await api(path)
      assert.equal(headers.get('x-powered-by'), null, `${path}: X-Powered-By masih ada`)
      assert.equal(headers.get('x-content-type-options'), 'nosniff', path)
      assert.equal(headers.get('x-frame-options'), 'DENY', path)
      assert.equal(headers.get('referrer-policy'), 'no-referrer', path)
      assert.match(headers.get('content-security-policy') ?? '', /frame-ancestors 'none'/, path)
    }
  })

  it('login: 5 kali gagal untuk username yang sama → percobaan ke-6 dibalas 429', async function () {
    // Username unik per run, jadi akun e2e-admin tidak ikut terkunci.
    const body = { username: `bukan-admin-${runId}`, password: 'salah-sekali' }
    for (let i = 1; i <= 5; i += 1) {
      assert.equal((await api('/auth/login', { method: 'POST', body })).status, 401, `percobaan ${i}`)
    }
    const locked = await api('/auth/login', { method: 'POST', body })
    assert.equal(locked.status, 429)
    assert.match(locked.json.error, /Terlalu banyak percobaan login/)
  })

  it('GET /api/admin/orders tanpa login dibalas 401', async function () {
    const result = await api('/admin/orders')
    assert.equal(result.status, 401)
  })

  it('PATCH status menunggu→selesai dibalas 400; selesai→dibatalkan dibalas 400', async function () {
    const order = await createOrder({ name: `E2E Transisi ${runId}`, items: [{ itemId: 'milo', qty: 1 }] })
    assert.equal((await setStatus(cookie, order.id, 'selesai')).status, 400, 'menunggu→selesai tidak ditolak')
    for (const status of ['diproses', 'siap', 'selesai']) {
      assert.equal((await setStatus(cookie, order.id, status)).status, 200, `→${status} gagal`)
    }
    assert.equal((await setStatus(cookie, order.id, 'dibatalkan')).status, 400, 'selesai→dibatalkan tidak ditolak')
  })

  it('pesanan bisa diambil dengan order_code, tetapi tidak dengan id numerik', async function () {
    const order = await createOrder({ name: `E2E Kode ${runId}`, items: [{ itemId: 'milo', qty: 1 }] })
    const byCode = await api(`/orders/${order.id}`)
    assert.equal(byCode.status, 200)
    assert.equal(byCode.json.id, order.id)
    // Database uji selalu punya pesanan ber-id 1..3 (dibuat oleh spec ini dan sebelumnya).
    for (const numericId of [1, 2, 3]) {
      assert.equal((await api(`/orders/${numericId}`)).status, 404, `/orders/${numericId} bisa diambil`)
    }
  })

  it('paymentMethod "online" ditolak 400 (tanpa payment gateway)', async function () {
    const result = await api('/orders', {
      method: 'POST',
      headers: { 'Idempotency-Key': crypto.randomUUID() },
      body: { tableNumber: '5', customer: { name: `E2E Online ${runId}` }, paymentMethod: 'online', items: [{ itemId: 'milo', qty: 1 }] },
    })
    assert.equal(result.status, 400)
    assert.match(result.json.error, /online belum tersedia/)
    assert.equal((await ordersByName(cookie, `E2E Online ${runId}`)).length, 0, 'Pesanan online tetap tersimpan')
  })

  it('nomor HP tidak terbuka di respons publik', async function () {
    const phone = '081298765432'
    const name = `E2E Privasi ${runId}`
    const created = await api('/orders', {
      method: 'POST',
      headers: { 'Idempotency-Key': crypto.randomUUID() },
      body: { tableNumber: '5', customer: { name, phone }, paymentMethod: 'cashier', items: [{ itemId: 'milo', qty: 1 }] },
    })
    assert.equal(created.status, 201)
    const fetched = await api(`/orders/${created.json.id}`)

    // Pastikan nomornya memang tersimpan (terlihat oleh admin), supaya pemeriksaan di bawah bermakna.
    const [stored] = await ordersByName(cookie, name)
    assert.equal(stored.customerPhone, phone)

    for (const [label, response] of [['POST /orders', created], ['GET /orders/:id', fetched]]) {
      assert.ok(!/phone/i.test(response.text), `${label} memuat field nomor HP`)
      assert.ok(!response.text.includes(phone.slice(1)), `${label} memuat nomor HP utuh`)
      assert.ok(!response.text.includes(phone.slice(-6)), `${label} memuat sebagian nomor HP`)
    }
  })
})
