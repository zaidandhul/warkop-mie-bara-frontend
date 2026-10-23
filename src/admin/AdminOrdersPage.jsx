import { useCallback, useEffect, useRef, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { errorMessage } from '../api/orders.js'
import { getAdminOrders, isUnauthorized, setOrderStatus } from './api.js'
import { COLUMNS, todayWib } from './constants.js'
import { playNewOrderChime } from './sound.js'
import OrderCard from './OrderCard.jsx'

const REFRESH_MS = 10_000
const NEW_HIGHLIGHT_MS = 60_000

export default function AdminOrdersPage() {
  const { onSessionExpired } = useOutletContext()
  const [date, setDate] = useState(todayWib)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)
  const [busyIds, setBusyIds] = useState(() => new Set())
  const [newIds, setNewIds] = useState(() => new Map()) // id -> waktu terlihat pertama
  const [showCancelled, setShowCancelled] = useState(false)
  const seenIds = useRef(null) // null = belum ada pemuatan pertama untuk tanggal ini
  const inFlight = useRef(null) // tanggal yang sedang dimuat
  const isToday = date === todayWib()

  const currentDate = useRef(date)
  currentDate.current = date

  const load = useCallback(async () => {
    if (inFlight.current === date) return
    inFlight.current = date
    try {
      const result = await getAdminOrders(date)
      if (currentDate.current !== date) return // Tanggal sudah diganti selama request berjalan.
      const fresh = result.orders.filter((order) => seenIds.current && !seenIds.current.has(order.id))
      if (seenIds.current && fresh.length && isToday) {
        playNewOrderChime()
        setNewIds((current) => {
          const next = new Map(current)
          fresh.forEach((order) => next.set(order.id, Date.now()))
          return next
        })
      }
      seenIds.current = new Set(result.orders.map((order) => order.id))
      setOrders(result.orders)
      setLastUpdated(new Date())
      setLoadError('')
    } catch (error) {
      if (isUnauthorized(error)) return onSessionExpired()
      setLoadError(errorMessage(error, 'Gagal memuat pesanan.'))
    } finally {
      if (inFlight.current === date) inFlight.current = null
      if (currentDate.current === date) setLoading(false)
    }
  }, [date, isToday, onSessionExpired])

  // Ganti tanggal: mulai ulang deteksi pesanan baru supaya tidak berbunyi untuk semua pesanan lama.
  useEffect(() => {
    seenIds.current = null
    setNewIds(new Map())
    setLoading(true)
  }, [date])

  // Muat sekarang, lalu tiap 10 detik selama tab terlihat; muat ulang segera saat tab kembali terlihat.
  useEffect(() => {
    load()
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') load()
    }, REFRESH_MS)
    const onVisible = () => document.visibilityState === 'visible' && load()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [load])

  // Sorotan "BARU" hilang sendiri setelah 1 menit.
  useEffect(() => {
    if (!newIds.size) return undefined
    const timer = setTimeout(() => {
      setNewIds((current) => new Map([...current].filter(([, seenAt]) => Date.now() - seenAt < NEW_HIGHLIGHT_MS)))
    }, 5_000)
    return () => clearTimeout(timer)
  }, [newIds])

  useEffect(() => {
    if (!actionError) return undefined
    const timer = setTimeout(() => setActionError(''), 6_000)
    return () => clearTimeout(timer)
  }, [actionError])

  const changeStatus = async (order, status) => {
    setBusyIds((current) => new Set(current).add(order.id))
    try {
      await setOrderStatus(order.id, status)
      setOrders((current) => current.map((o) => (o.id === order.id ? { ...o, status } : o)))
      setNewIds((current) => {
        const next = new Map(current)
        next.delete(order.id)
        return next
      })
    } catch (error) {
      if (isUnauthorized(error)) return onSessionExpired()
      setActionError(errorMessage(error, 'Gagal mengubah status pesanan.'))
      load()
    } finally {
      setBusyIds((current) => {
        const next = new Set(current)
        next.delete(order.id)
        return next
      })
    }
  }

  const now = lastUpdated?.getTime() ?? Date.now()
  const cancelled = orders.filter((order) => order.status === 'dibatalkan')
  const cardProps = (order) => ({
    order,
    now,
    isNew: newIds.has(order.id),
    busy: busyIds.has(order.id),
    onChangeStatus: changeStatus,
  })

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-3 px-5 py-3">
        <input
          type="date"
          value={date}
          max={todayWib()}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          className="rounded-lg border border-bara-line bg-bara-panel px-3 py-2 text-white [color-scheme:dark]"
        />
        {!isToday && (
          <button onClick={() => setDate(todayWib())} className="rounded-lg bg-bara-cyan px-4 py-2 font-semibold text-black">
            Hari ini
          </button>
        )}
        <button
          onClick={() => setShowCancelled((value) => !value)}
          className="rounded-lg border border-bara-line px-4 py-2 text-sm text-white/70"
        >
          Dibatalkan ({cancelled.length}) {showCancelled ? '▲' : '▼'}
        </button>
        <p className="ml-auto text-sm text-white/50">
          {loadError
            ? <span className="text-bara-chili">⚠ {loadError}</span>
            : lastUpdated && `Diperbarui ${lastUpdated.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' })} · otomatis tiap 10 detik`}
        </p>
      </div>

      {actionError && (
        <p role="alert" className="mx-5 mb-2 rounded-lg border border-bara-chili/50 bg-bara-chili/10 px-3 py-2 text-sm text-bara-chili">
          {actionError}
        </p>
      )}

      {showCancelled && (
        <div className="mx-5 mb-3 flex max-h-72 gap-3 overflow-x-auto rounded-xl border border-bara-line p-3">
          {cancelled.length
            ? cancelled.map((order) => <div key={order.id} className="w-72 shrink-0 opacity-70"><OrderCard {...cardProps(order)} /></div>)
            : <p className="text-sm text-white/50">Tidak ada pesanan dibatalkan.</p>}
        </div>
      )}

      {loading ? (
        <p className="px-5 text-white/60">Memuat pesanan…</p>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto px-5 pb-5 md:grid-cols-4 md:grid-rows-1 md:overflow-visible">
          {COLUMNS.map((column) => {
            const columnOrders = orders.filter((order) => order.status === column.status)
            // Selesai: terbaru di atas; kolom lain: terlama di atas (antrean).
            if (column.status === 'selesai') columnOrders.reverse()
            return (
              <section key={column.status} className="flex min-h-0 flex-col rounded-xl bg-white/[0.03]">
                <h2 className={`flex items-center justify-between border-b-2 px-3 py-2 text-base font-bold ${column.accent}`}>
                  {column.label}
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-sm text-white">{columnOrders.length}</span>
                </h2>
                <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-2">
                  {columnOrders.length
                    ? columnOrders.map((order) => <OrderCard key={order.id} {...cardProps(order)} />)
                    : <p className="py-6 text-center text-sm text-white/30">Kosong</p>}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
