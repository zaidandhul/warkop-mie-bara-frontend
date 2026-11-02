import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { errorMessage, getMenu, newIdempotencyKey, rememberOrder, submitOrder } from '../api/orders.js'
import { useCartStore } from '../store/cartStore.js'
import CartSyncNotice, { mergeCartChanges } from '../components/CartSyncNotice.jsx'

const rupiah = (n) => 'Rp' + n.toLocaleString('id-ID')

export default function PaymentPage() {
  const { tableNumber, lines, total, fee, clear, syncWithMenu } = useCartStore()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  // Satu key per kunjungan halaman: kirim ulang (klik dobel, retry setelah timeout) tidak membuat pesanan baru.
  const [idempotencyKey] = useState(newIdempotencyKey)
  const inFlight = useRef(false)
  const [cartChanges, setCartChanges] = useState(null)
  const grandTotal = total() + (lines.length ? fee : 0)

  // Total yang tampil harus sama dengan yang dihitung server, jadi harga keranjang disamakan dengan
  // menu terbaru. Gagal memuat menu tidak menghalangi pesanan: server tetap menghitung ulang harga.
  const syncCart = useCallback(
    () => getMenu().then((menu) => setCartChanges((previous) => mergeCartChanges(previous, syncWithMenu(menu)))).catch(() => {}),
    [syncWithMenu]
  )
  useEffect(() => { syncCart() }, [syncCart])

  const handlePay = async (e) => {
    e.preventDefault()
    if (inFlight.current || !tableNumber || !name.trim() || !lines.length) return
    inFlight.current = true
    setSubmitting(true)
    setError('')
    try {
      const order = await submitOrder({
        tableNumber: String(tableNumber),
        customer: { name: name.trim(), phone: phone.trim() },
        paymentMethod: 'cashier',
        items: lines.map((line) => ({
          itemId: line.item.id,
          qty: line.qty,
          options: {
            level: line.opts?.level,
            variant: line.opts?.variant,
            toppings: line.opts?.toppings ?? [],
            note: line.opts?.note ?? '',
          },
        })),
      }, idempotencyKey)
      rememberOrder(order.id)
      clear()
      navigate('/history', { state: { newOrderId: order.id } })
    } catch (submitError) {
      setError(errorMessage(submitError, 'Pesanan gagal dikirim. Coba lagi.'))
      // Ditolak validasi (mis. menu baru saja habis atau harga berubah): perbarui keranjang.
      if (submitError?.response?.status === 400) syncCart()
    } finally {
      inFlight.current = false
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md pb-28">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-bara-line bg-bara-black/95 px-4 py-3 backdrop-blur">
        <Link to="/view-order" aria-label="Kembali" className="text-xl">←</Link>
        <h1 className="text-base font-bold">Pembayaran</h1>
      </header>

      <form onSubmit={handlePay} className="px-4 pt-4">
        <div className="rounded-lg border border-bara-cyan/50 bg-bara-panel px-3 py-3 text-sm">
          Dine In · Meja <span className="font-bold text-bara-cyan">{tableNumber ?? 'belum dipilih'}</span>
          {!tableNumber && <Link to="/order" className="ml-2 font-semibold text-bara-cyan underline">Pilih di halaman menu</Link>}
        </div>
        {cartChanges && <div className="mt-3"><CartSyncNotice changes={cartChanges} /></div>}

        <section className="pt-6">
          <h2 className="mb-3 text-sm font-bold text-bara-cyan">Data Pemesan</h2>
          <label className="mb-3 block text-sm">
            Nama Lengkap <span className="text-bara-chili">*</span>
            <input
              data-testid="customer-name"
              required
              minLength={2}
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama Lengkap"
              className="mt-1 w-full rounded-lg border border-bara-line bg-bara-panel px-3 py-2 outline-none focus:border-bara-cyan"
            />
          </label>
          <label className="mb-3 block text-sm">
            No. HP (opsional)
            <input
              data-testid="customer-phone"
              type="tel"
              inputMode="tel"
              maxLength={20}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08xxxxxxxxxx"
              className="mt-1 w-full rounded-lg border border-bara-line bg-bara-panel px-3 py-2 outline-none focus:border-bara-cyan"
            />
          </label>
        </section>

        <section className="pt-4">
          <h2 className="mb-3 text-sm font-bold text-bara-cyan">Metode Pembayaran</h2>
          <div className="rounded-lg border border-bara-cyan bg-bara-panel px-3 py-3 text-sm font-medium text-bara-cyan">
            <p>Bayar di Kasir</p>
            <p className="mt-1 text-xs font-normal text-white/60">Bayar setelah pesanan dibuat, tunai atau QRIS di kasir.</p>
          </div>
        </section>

        {error && <p role="alert" data-testid="payment-error" className="mt-4 rounded-lg border border-bara-chili/50 bg-bara-chili/10 px-3 py-2 text-sm text-bara-chili">{error}</p>}

        <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md border-t border-bara-line bg-bara-black p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/60">Total Pembayaran</p>
              <p className="text-lg font-bold" data-testid="payment-total">{rupiah(grandTotal)}</p>
            </div>
            <button type="submit" data-testid="submit-order" disabled={submitting || !lines.length || !tableNumber} className="rounded-xl bg-bara-cyan px-6 py-3 font-bold text-black disabled:opacity-50">
              {submitting ? 'Mengirim…' : 'Buat Pesanan'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
