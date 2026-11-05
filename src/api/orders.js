import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
})
// Riwayat pesanan pelanggan (tanpa login): kode pesanan disimpan di localStorage selama 24 jam, jadi
// tetap ada walau tab ditutup atau dibuka di tab lain. Format: [{ id, at }] (at = epoch ms).
const ORDER_HISTORY_KEY = 'mie-bara-order-history'
const ORDER_HISTORY_TTL_MS = 24 * 60 * 60 * 1000
const MAX_HISTORY = 30

function safeParse(text) {
  try {
    const value = JSON.parse(text || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function readHistory(now = Date.now()) {
  let entries = []
  try {
    entries = safeParse(localStorage.getItem(ORDER_HISTORY_KEY))
    // Versi lama menyimpan daftar kode di sessionStorage; pindahkan sekali.
    const legacy = safeParse(sessionStorage.getItem(ORDER_HISTORY_KEY)).filter((id) => typeof id === 'string')
    if (legacy.length) {
      entries = [...entries, ...legacy.map((id) => ({ id, at: now }))]
      sessionStorage.removeItem(ORDER_HISTORY_KEY)
    }
  } catch { /* storage diblokir: riwayat kosong */ }
  const seen = new Set()
  return entries
    .filter((entry) => entry && typeof entry.id === 'string' && Number.isFinite(entry.at) && now - entry.at < ORDER_HISTORY_TTL_MS)
    .filter((entry) => !seen.has(entry.id) && seen.add(entry.id))
    .slice(0, MAX_HISTORY)
}

function writeHistory(entries) {
  try { localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(entries)) } catch { /* Order sudah tersimpan di backend. */ }
}

function readOrderIds() {
  const entries = readHistory()
  writeHistory(entries) // buang entri kedaluwarsa
  return entries.map((entry) => entry.id)
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
  writeHistory([{ id, at: Date.now() }, ...readHistory().filter((entry) => entry.id !== id)].slice(0, MAX_HISTORY))
}

export async function getOrderHistory() {
  const orders = await Promise.all(readOrderIds().map((id) => getOrder(id).catch(() => null)))
  return orders.filter(Boolean).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}
