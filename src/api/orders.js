import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
})
const ORDER_HISTORY_KEY = 'mie-bara-order-history'

function readOrderIds() {
  try {
    const ids = JSON.parse(sessionStorage.getItem(ORDER_HISTORY_KEY) || '[]')
    return Array.isArray(ids) ? ids.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

export async function getMenu() {
  return (await api.get('/menu')).data
}

// crypto.randomUUID hanya ada di konteks aman (https/localhost); saat dibuka dari HP lewat IP LAN
// pakai getRandomValues yang tersedia di mana saja.
export function newIdempotencyKey() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export async function submitOrder(payload, idempotencyKey) {
  return (await api.post('/orders', payload, { headers: { 'Idempotency-Key': idempotencyKey } })).data
}

// Pesan error dari backend ({error}) bila ada, selain itu pesan umum sesuai jenis kegagalan.
export function errorMessage(error, fallback) {
  const message = error?.response?.data?.error
  if (typeof message === 'string' && message) return message
  if (error?.code === 'ECONNABORTED') return 'Server terlalu lama merespons. Coba lagi.'
  if (error?.request && !error.response) return 'Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.'
  return fallback
}

export async function getOrder(id) {
  return (await api.get(`/orders/${encodeURIComponent(id)}`)).data
}

export function rememberOrder(id) {
  if (typeof id !== 'string' || !id) return
  const ids = [id, ...readOrderIds().filter((knownId) => knownId !== id)].slice(0, 30)
  try { sessionStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(ids)) } catch { /* Order sudah tersimpan di backend. */ }
}

export async function getOrderHistory() {
  const orders = await Promise.all(readOrderIds().map((id) => getOrder(id).catch(() => null)))
  return orders.filter(Boolean).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}
