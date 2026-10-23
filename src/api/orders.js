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

export async function submitOrder(payload) {
  return (await api.post('/orders', payload)).data
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
