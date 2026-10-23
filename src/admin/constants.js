export const COLUMNS = [
  { status: 'menunggu', label: 'Menunggu', accent: 'border-amber-400 text-amber-300' },
  { status: 'diproses', label: 'Diproses', accent: 'border-bara-cyan text-bara-cyan' },
  { status: 'siap', label: 'Siap Diantar', accent: 'border-emerald-400 text-emerald-300' },
  { status: 'selesai', label: 'Selesai', accent: 'border-white/30 text-white/60' },
]

// Sama dengan TRANSITIONS di backend/src/services/admin.js (backend tetap yang menentukan).
export const ACTIONS = {
  menunggu: [
    { to: 'diproses', label: 'Proses' },
    { to: 'dibatalkan', label: 'Batalkan', danger: true },
  ],
  diproses: [
    { to: 'siap', label: 'Siap' },
    { to: 'dibatalkan', label: 'Batalkan', danger: true },
  ],
  siap: [{ to: 'selesai', label: 'Selesai' }],
  selesai: [],
  dibatalkan: [],
}

export const PAYMENT_LABELS = { cashier: 'Bayar di kasir', online: 'Online' }

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000

export function todayWib() {
  return new Date(Date.now() + WIB_OFFSET_MS).toISOString().slice(0, 10)
}

const timeFormat = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' })

export function formatTimeWib(value) {
  return timeFormat.format(new Date(value)).replace('.', ':')
}
