import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { getMenu } from '../api/orders.js'
import { DEFAULT_TABLE_COUNT } from '../store/cartStore.js'

const BASE_URL_KEY = 'mb-qr-base-url'

function initialBaseUrl() {
  try {
    const saved = localStorage.getItem(BASE_URL_KEY)
    if (saved) return saved
  } catch { /* localStorage diblokir: pakai default */ }
  return import.meta.env.VITE_PUBLIC_URL || window.location.origin
}

// 'http(s)://host[:port][/path]' tanpa garis miring di akhir, atau null jika tidak valid.
function cleanBaseUrl(value) {
  try {
    const parsed = new URL(value.trim())
    if (!['http:', 'https:'].includes(parsed.protocol)) return null
    return `${parsed.origin}${parsed.pathname.replace(/\/+$/, '')}`
  } catch {
    return null
  }
}

const isLocalOnly = (base) => /^https?:\/\/(localhost|127\.|\[::1\])/.test(base)

export default function AdminQrPage() {
  const [tableCount, setTableCount] = useState(DEFAULT_TABLE_COUNT)
  const [baseUrl, setBaseUrl] = useState(initialBaseUrl)
  const base = cleanBaseUrl(baseUrl)

  useEffect(() => {
    getMenu().then((menu) => setTableCount(Number(menu.tableCount) || DEFAULT_TABLE_COUNT)).catch(() => {})
  }, [])

  const changeBaseUrl = (value) => {
    setBaseUrl(value)
    try { localStorage.setItem(BASE_URL_KEY, value) } catch { /* tidak disimpan */ }
  }

  const tables = Array.from({ length: tableCount }, (_, index) => index + 1)

  return (
    <div className="h-full overflow-y-auto px-5 py-4 print:h-auto print:overflow-visible print:p-0">
      <div className="mx-auto max-w-5xl print:max-w-none">
        <div className="flex flex-wrap items-end gap-3 print:hidden">
          <label className="min-w-72 flex-1 text-sm">
            Alamat aplikasi pelanggan (yang bisa dibuka dari HP pelanggan)
            <input
              data-testid="qr-base-url"
              value={baseUrl}
              onChange={(e) => changeBaseUrl(e.target.value)}
              placeholder="https://miebara.example.com"
              className="mt-1 min-h-12 w-full rounded-lg border border-bara-line bg-bara-panel px-3 outline-none focus:border-bara-cyan"
            />
          </label>
          <button
            data-testid="qr-print"
            disabled={!base}
            onClick={() => window.print()}
            className="min-h-12 rounded-lg bg-bara-cyan px-6 font-bold text-black disabled:opacity-50"
          >
            Cetak {tableCount} QR
          </button>
        </div>
        {!base && <p role="alert" className="mt-2 text-sm text-bara-chili print:hidden">Alamat harus diawali http:// atau https://.</p>}
        {base && isLocalOnly(base) && (
          <p role="alert" className="mt-2 rounded-lg border border-amber-400/50 bg-amber-400/10 px-3 py-2 text-sm text-amber-200 print:hidden">
            Alamat {base} hanya bisa dibuka dari perangkat ini. Ganti dengan alamat IP/domain yang bisa diakses HP pelanggan sebelum mencetak.
          </p>
        )}

        {base && (
          <ul className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 print:mt-0 print:grid-cols-2 print:gap-6">
            {tables.map((table) => {
              const link = `${base}/?tableNumber=${table}`
              return (
                <li
                  key={table}
                  data-testid="qr-card"
                  data-table={table}
                  data-url={link}
                  className="flex break-inside-avoid flex-col items-center rounded-xl bg-white p-4 text-center text-black print:border print:border-black"
                >
                  <p className="text-sm font-semibold uppercase tracking-wide">Warkop Mie Bara</p>
                  <p className="text-3xl font-extrabold">Meja {table}</p>
                  <QRCodeSVG value={link} size={176} level="M" marginSize={2} className="mt-2 h-auto w-full max-w-44" />
                  <p className="mt-2 text-sm font-semibold">Scan untuk pesan</p>
                  <p className="mt-1 break-all text-[10px] text-black/60">{link}</p>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
