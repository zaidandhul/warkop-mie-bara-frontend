import { randomUUID } from 'node:crypto'
import { config } from './config.js'

// Panggilan HTTP langsung ke backend uji (tanpa browser).
export async function api(path, { method = 'GET', body, cookie, headers = {} } = {}) {
  const response = await fetch(`${config.apiUrl}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const text = await response.text()
  let json = null
  try { json = text ? JSON.parse(text) : null } catch { /* bukan JSON */ }
  return { status: response.status, json, text, headers: response.headers }
}

export async function adminLogin() {
  const result = await api('/auth/login', { method: 'POST', body: { username: config.adminUser, password: config.adminPass } })
  if (result.status !== 200) throw new Error(`Login admin uji gagal (${result.status}): ${result.text}`)
  const cookie = result.headers.getSetCookie().find((c) => c.startsWith('mb_staff='))
  return cookie.split(';')[0]
}

// Meja default 1: meja 5 sudah dipakai alur pelanggan di spec B, dan tiap meja maksimal 5 pesanan aktif.
export async function createOrder({ name, table = '1', phone = '', items }) {
  const result = await api('/orders', {
    method: 'POST',
    headers: { 'Idempotency-Key': randomUUID() },
    body: { tableNumber: table, customer: { name, phone }, paymentMethod: 'cashier', items },
  })
  if (result.status !== 201) throw new Error(`Gagal membuat pesanan uji (${result.status}): ${result.text}`)
  return result.json
}

export async function adminOrders(cookie, query = '') {
  const result = await api(`/admin/orders${query}`, { cookie })
  if (result.status !== 200) throw new Error(`GET /admin/orders gagal (${result.status}): ${result.text}`)
  return result.json.orders
}

export async function ordersByName(cookie, name) {
  return (await adminOrders(cookie)).filter((order) => order.customerName === name)
}

export const setStatus = (cookie, code, status) =>
  api(`/admin/orders/${encodeURIComponent(code)}/status`, { method: 'PATCH', cookie, body: { status } })

export const setPayment = (cookie, code, method) =>
  api(`/admin/orders/${encodeURIComponent(code)}/payment`, { method: 'PATCH', cookie, body: { method } })

// Tutup pesanan hari ini yang belum selesai/dibatalkan (opsional hanya untuk satu meja): yang lunas
// diselesaikan, sisanya dibatalkan. Dipakai supaya batas pesanan aktif per meja tidak tercapai oleh
// data uji dari run sebelumnya.
export async function closeActiveOrders(cookie, table) {
  const NEXT = { menunggu: 'diproses', diproses: 'siap', siap: 'selesai' }
  const active = (await adminOrders(cookie))
    .filter((order) => !['selesai', 'dibatalkan'].includes(order.status) && (!table || order.tableNumber === table))
  for (const order of active) {
    if (!order.paidAt) {
      await setStatus(cookie, order.id, 'dibatalkan')
      continue
    }
    for (let status = order.status; NEXT[status]; status = NEXT[status]) await setStatus(cookie, order.id, NEXT[status])
  }
  return active.length
}

export async function adminMenuItem(cookie, id) {
  const result = await api('/admin/menu', { cookie })
  return result.json.items.find((item) => item.id === id)
}

export async function patchMenu(cookie, id, changes) {
  const result = await api(`/admin/menu/${encodeURIComponent(id)}`, { method: 'PATCH', cookie, body: changes })
  if (result.status !== 200) throw new Error(`PATCH /admin/menu/${id} gagal (${result.status}): ${result.text}`)
  return result.json
}

export async function publicMenu() {
  return (await api('/menu')).json
}
