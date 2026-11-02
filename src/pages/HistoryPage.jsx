import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getOrderHistory } from '../api/orders.js'

const TABS = [
  { id: 'order', label: 'Pesanan' },
  { id: 'reservation', label: 'Reservasi' },
]
const rupiah = (value) => `Rp${Number(value).toLocaleString('id-ID')}`
const dateTime = (value) => new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))

export default function HistoryPage() {
  const [tab, setTab] = useState('order')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { state } = useLocation()
  const newOrderId = state?.newOrderId

  useEffect(() => {
    let active = true
    setLoading(true)
    getOrderHistory()
      .then((result) => { if (active) setOrders(result) })
      .catch(() => { if (active) setError('Riwayat pesanan tidak dapat dimuat.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [newOrderId])

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col">
      <header className="flex items-center gap-3 border-b border-bara-line px-4 py-4">
        <Link to="/profile" aria-label="Kembali" className="text-xl">←</Link>
        <h1 className="flex-1 text-center text-base font-bold">Riwayat</h1>
        <span className="w-5" />
      </header>

      <div className="flex border-b border-bara-line px-4">
        {TABS.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`flex-1 pb-3 pt-4 text-sm font-semibold ${tab === item.id ? 'border-b-2 border-bara-cyan text-bara-cyan' : 'text-white/50'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'order' && (
        <section className="flex-1 space-y-3 px-4 py-5">
          {newOrderId && <p className="rounded-lg bg-bara-cyan/10 px-3 py-2 text-sm text-bara-cyan">Pesanan berhasil disimpan dan masuk ke riwayat.</p>}
          {loading && <p className="py-8 text-center text-sm text-white/60">Memuat riwayat pesanan…</p>}
          {!loading && error && <p role="alert" className="py-8 text-center text-sm text-bara-chili">{error}</p>}
          {!loading && !error && orders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-bara-panel text-3xl">📝</div>
              <p className="mt-4 text-sm text-white/60">Belum ada pesanan di sesi ini.</p>
              <Link to="/order" className="mt-4 rounded-lg border border-bara-cyan px-4 py-2 text-sm font-semibold text-bara-cyan">Lihat Menu</Link>
            </div>
          )}
          {orders.map((order) => (
            <article key={order.id} className={`rounded-xl border bg-bara-panel p-4 ${order.id === newOrderId ? 'border-bara-cyan' : 'border-bara-line'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-sm font-bold" data-testid="history-order-code">{order.id}</p>
                  <p className="mt-1 text-xs text-white/50">{dateTime(order.createdAt)}</p>
                </div>
                <span className="rounded-full bg-bara-cyan/10 px-2.5 py-1 text-xs font-semibold text-bara-cyan">{order.status}</span>
              </div>
              <p className="mt-3 text-sm text-white/70">
                Meja {order.tableNumber} · {order.paid ? <span className="text-emerald-300">Lunas</span> : 'Belum bayar, silakan bayar di kasir'}
              </p>
              <ul className="mt-3 space-y-1 border-t border-bara-line pt-3 text-sm">
                {order.items.map((item, index) => (
                  <li key={`${order.id}-${item.itemId}-${index}`}>
                    <div className="flex justify-between gap-3">
                      <span className="text-white/80">{item.qty}× {item.name}</span>
                      <span className="shrink-0 text-white/60">{rupiah(item.lineTotal)}</span>
                    </div>
                    {(item.options?.level || item.toppingDetails?.length > 0) && (
                      <p className="mt-0.5 text-xs text-white/45">
                        {[item.options?.level && `Level ${item.options.level}`, ...(item.toppingDetails ?? []).map((topping) => topping.name)].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center justify-between border-t border-bara-line pt-3">
                <span className="text-sm font-bold">Total {rupiah(order.total)}</span>
                <Link to={`/status/${encodeURIComponent(order.id)}`} className="text-sm font-semibold text-bara-cyan">Lihat status</Link>
              </div>
            </article>
          ))}
        </section>
      )}

      {tab === 'reservation' && (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-bara-panel text-3xl">📝</div>
          <p className="mt-4 text-sm text-white/60">Belum ada reservasi.</p>
        </div>
      )}
    </div>
  )
}
