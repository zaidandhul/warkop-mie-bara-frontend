import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getOrder } from '../api/orders.js'

const STEPS = [
  { status: 'menunggu', label: 'Menunggu' },
  { status: 'diproses', label: 'Diproses' },
  { status: 'siap', label: 'Siap' },
  { status: 'selesai', label: 'Selesai' },
]
// Status yang tidak akan berubah lagi: polling berhenti.
const FINAL_STATUSES = ['selesai', 'dibatalkan']
const POLL_MS = 5000

const TITLES = {
  selesai: 'Pesanan selesai',
  dibatalkan: 'Pesanan dibatalkan',
}

export default function StatusPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const isFinal = FINAL_STATUSES.includes(order?.status)

  useEffect(() => {
    let mounted = true
    let timer = null
    const refresh = () => getOrder(id).then((result) => {
      if (!mounted) return
      setOrder(result)
      setError('')
      if (FINAL_STATUSES.includes(result.status)) window.clearInterval(timer)
    }).catch((requestError) => {
      if (mounted) setError(requestError.response?.data?.error || 'Status pesanan gagal dimuat.')
    })
    refresh()
    timer = window.setInterval(refresh, POLL_MS)
    return () => { mounted = false; window.clearInterval(timer) }
  }, [id])

  const active = STEPS.findIndex((step) => step.status === order?.status)

  return (
    <div className="mx-auto max-w-md px-4 py-10 text-center" data-testid="status-page" data-polling={order && !isFinal ? 'true' : 'false'}>
      <h1 className={`text-xl font-extrabold ${order?.status === 'dibatalkan' ? 'text-bara-chili' : 'text-bara-cyan'}`} data-testid="status-title">
        {TITLES[order?.status] ?? 'Status Pesanan'}
      </h1>
      <p className="mt-2 text-sm text-white/70">Nomor pesanan {id} · Meja {order?.tableNumber ?? '…'}</p>
      {error && <p role="alert" className="mt-3 text-sm text-bara-chili">{error}</p>}

      {order?.status === 'dibatalkan' ? (
        <div data-testid="status-cancelled" className="mt-8 rounded-xl border border-bara-chili/60 bg-bara-chili/10 px-4 py-4 text-left text-sm">
          <p className="font-semibold text-bara-chili">Pesanan ini dibatalkan dan tidak akan dibuat.</p>
          <p className="mt-1 text-white/70">
            Ada pertanyaan? Silakan hubungi kasir, atau pesan ulang lewat tombol di bawah.
          </p>
        </div>
      ) : (
        <ol className="mt-8 flex justify-between" data-testid="status-steps">
          {STEPS.map((step, index) => (
            <li
              key={step.status}
              data-testid={`status-step-${step.status}`}
              aria-current={index === active ? 'step' : undefined}
              className={`flex-1 border-t-4 pt-2 text-sm ${index <= active ? 'border-bara-cyan font-semibold text-bara-cyan' : 'border-bara-line text-white/50'}`}
            >
              {step.label}
            </li>
          ))}
        </ol>
      )}
      {order?.status === 'selesai' && <p className="mt-4 text-sm text-white/70">Terima kasih, selamat menikmati!</p>}

      {order && (
        <p className="mt-5 text-sm text-white/60">
          Total: Rp{Number(order.total).toLocaleString('id-ID')} · {isFinal ? 'status akhir' : 'diperbarui otomatis'}
        </p>
      )}
      <Link to="/" className="mt-10 inline-block rounded-xl border border-bara-cyan px-5 py-3 font-semibold text-bara-cyan">Pesan lagi</Link>
    </div>
  )
}
