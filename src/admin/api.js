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

// Pesanan yang diinput kasir. paidMethod: null (belum bayar), 'tunai', atau 'qris_manual'.
export async function createAdminOrder(payload, idempotencyKey) {
  return (await api.post('/admin/orders', payload, { headers: { 'Idempotency-Key': idempotencyKey } })).data
}

export async function setOrderStatus(id, status) {
  return (await api.patch(`/admin/orders/${encodeURIComponent(id)}/status`, { status })).data
}

// method: 'tunai' | 'qris_manual' untuk menandai lunas, null untuk membatalkan tanda lunas.
export async function setOrderPayment(id, method) {
  return (await api.patch(`/admin/orders/${encodeURIComponent(id)}/payment`, { method })).data
}

export async function getAdminMenu() {
  return (await api.get('/admin/menu')).data.items
}

export async function updateMenuItem(id, changes) {
  return (await api.patch(`/admin/menu/${encodeURIComponent(id)}`, changes)).data
}

export async function getSalesReport(from, to) {
  return (await api.get('/admin/reports/sales', { params: { from, to } })).data
}

// Kelola akun staf (khusus admin) dan ganti password sendiri.
export async function getStaff() {
  return (await api.get('/admin/staff')).data.staff
}

export async function createStaff(staff) {
  return (await api.post('/admin/staff', staff)).data
}

export async function updateStaff(id, changes) {
  return (await api.patch(`/admin/staff/${id}`, changes)).data
}

export async function resetStaffPassword(id, password) {
  await api.post(`/admin/staff/${id}/password`, { password })
}

export async function changeOwnPassword(currentPassword, newPassword) {
  await api.post('/admin/me/password', { currentPassword, newPassword })
}

export const isUnauthorized = (error) => error?.response?.status === 401
