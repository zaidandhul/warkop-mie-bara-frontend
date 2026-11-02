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

// Sama dengan PAID_METHODS di backend/src/services/admin.js.
export const PAID_METHODS = [
  { method: 'tunai', label: 'Tunai' },
  { method: 'qris_manual', label: 'QRIS' },
]
export const PAID_METHOD_LABELS = Object.fromEntries(PAID_METHODS.map(({ method, label }) => [method, label]))

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000

export function todayWib() {
  return new Date(Date.now() + WIB_OFFSET_MS).toISOString().slice(0, 10)
}

const timeFormat = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' })

export function formatTimeWib(value) {
  return timeFormat.format(new Date(value)).replace('.', ':')
}

const dateTimeFormat = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
})

// 'YYYY-MM-DD HH:MM' dalam WIB (dipakai laporan dan ekspor Excel).
export function formatDateTimeWib(value) {
  return dateTimeFormat.format(new Date(value))
}

// Tanggal WIB 'YYYY-MM-DD' digeser n hari.
export function shiftDate(date, days) {
  const shifted = new Date(`${date}T00:00:00Z`)
  shifted.setUTCDate(shifted.getUTCDate() + days)
  return shifted.toISOString().slice(0, 10)
}
