import axios from 'axios'

// Klien khusus dashboard staf: cookie login (httpOnly) ikut terkirim.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  withCredentials: true,
})

export async function login(username, password) {
  return (await api.post('/auth/login', { username, password })).data.staff
}

export async function logout() {
  await api.post('/auth/logout')
}

export async function getMe() {
  return (await api.get('/admin/me')).data.staff
}

export async function getAdminOrders(date) {
  return (await api.get('/admin/orders', { params: { date } })).data
}

export async function setOrderStatus(id, status) {
  return (await api.patch(`/admin/orders/${encodeURIComponent(id)}/status`, { status })).data
}

export async function getAdminMenu() {
  return (await api.get('/admin/menu')).data.items
}

export async function updateMenuItem(id, changes) {
  return (await api.patch(`/admin/menu/${encodeURIComponent(id)}`, changes)).data
}

export const isUnauthorized = (error) => error?.response?.status === 401
