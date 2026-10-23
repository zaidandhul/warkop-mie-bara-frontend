import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getOrder } from '../api/orders.js'

const STEPS = ['Menunggu', 'Diproses', 'Siap']

export default function StatusPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    const refresh = () => getOrder(id).then((result) => {
      if (mounted) { setOrder(result); setError('') }
    }).catch((requestError) => {
      if (mounted) setError(requestError.response?.data?.error || 'Status pesanan gagal dimuat.')
    })
    refresh()
    const timer = window.setInterval(refresh, 5000)
    return () => { mounted = false; window.clearInterval(timer) }
  }, [id])

  const active = order?.status === 'siap' || order?.status === 'selesai' ? 2 : order?.status === 'diproses' ? 1 : 0

  return (
    <div className="mx-auto max-w-md px-4 py-10 text-center">
      <h1 className="text-xl font-extrabold text-bara-cyan">{order?.status === 'dibatalkan' ? 'Pesanan dibatalkan' : 'Status Pesanan'}</h1>
      <p className="mt-2 text-sm text-white/70">Nomor pesanan {id} · Meja {order?.tableNumber ?? '…'}</p>
      {error && <p role="alert" className="mt-3 text-sm text-bara-chili">{error}</p>}
      <ol className="mt-8 flex justify-between">
        {STEPS.map((s, i) => (
          <li key={s} className={`flex-1 border-t-4 pt-2 text-sm ${i <= active ? 'border-bara-cyan font-semibold text-bara-cyan' : 'border-bara-line text-white/50'}`}>
            {s}
          </li>
        ))}
      </ol>
      {order && <p className="mt-5 text-sm text-white/60">Total: Rp{Number(order.total).toLocaleString('id-ID')} · diperbarui otomatis</p>}
      <Link to="/" className="mt-10 inline-block rounded-xl border border-bara-cyan px-5 py-3 font-semibold text-bara-cyan">Pesan lagi</Link>
    </div>
  )
}
