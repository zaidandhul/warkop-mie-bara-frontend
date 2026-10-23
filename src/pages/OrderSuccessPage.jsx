import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { getOrder } from '../api/orders.js'
import { useCartStore } from '../store/cartStore.js'

export default function OrderSuccessPage() {
  const { tableNumber } = useCartStore()
  const { id } = useParams()
  const { state } = useLocation()
  const [order, setOrder] = useState(state?.order ?? null)
  const [error, setError] = useState('')
  const orderId = order?.id ?? id

  useEffect(() => {
    if (order || !id) return
    getOrder(id).then(setOrder).catch(() => setError('Rincian pesanan tidak dapat dimuat.'))
  }, [id, order])

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-bara-cyan text-3xl text-bara-cyan">
        ✓
      </div>
      <h1 className="mt-5 text-xl font-extrabold">Pesanan Diterima</h1>
      <p className="mt-2 text-sm text-white/70">
        Pesanan kamu untuk Meja {order?.tableNumber ?? tableNumber ?? '-'} sudah tersimpan dan menunggu diproses dapur. Silakan lakukan pembayaran di kasir.
      </p>

      <div className="mt-6 w-full rounded-lg border border-bara-line bg-bara-panel px-4 py-3 text-sm">
        <div className="flex justify-between text-white/60">
          <span>No. Pesanan</span>
          <span className="font-mono text-white">{orderId ?? 'Tidak tersedia'}</span>
        </div>
        <div className="mt-1 flex justify-between text-white/60">
          <span>Status</span>
          <span className="font-semibold text-bara-cyan">{order?.status ?? 'Menunggu'}</span>
        </div>
        {order && <div className="mt-1 flex justify-between text-white/60"><span>Total</span><span className="font-semibold text-white">Rp{Number(order.total).toLocaleString('id-ID')}</span></div>}
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-bara-chili">{error}</p>}

      {orderId && <Link to={`/status/${encodeURIComponent(orderId)}`} className="mt-4 w-full rounded-xl bg-bara-cyan px-6 py-3 text-center font-bold text-black">Lihat Status Pesanan</Link>}

      <Link
        to="/order"
        className="mt-3 w-full rounded-xl border border-bara-cyan px-6 py-3 text-center font-bold text-bara-cyan"
      >
        Pesan Lagi
      </Link>
    </div>
  )
}
