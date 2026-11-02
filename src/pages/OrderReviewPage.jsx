import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getMenu } from '../api/orders.js'
import { useCartStore } from '../store/cartStore.js'
import CartSyncNotice, { mergeCartChanges } from '../components/CartSyncNotice.jsx'

const rupiah = (n) => 'Rp' + n.toLocaleString('id-ID')

export default function OrderReviewPage() {
  const { tableNumber, lines, setQty, add, total, fee, syncWithMenu } = useCartStore()
  const navigate = useNavigate()
  const [related, setRelated] = useState([])
  const [cartChanges, setCartChanges] = useState(null)
  const grandTotal = total() + (lines.length ? fee : 0)

  useEffect(() => {
    getMenu().then((menu) => {
      setCartChanges((previous) => mergeCartChanges(previous, syncWithMenu(menu)))
      setRelated(menu.categories.find((category) => category.id === 'camilan')?.items.slice(0, 2) ?? [])
    }).catch(() => setRelated([]))
  }, [syncWithMenu])

  return (
    <div className="mx-auto max-w-md pb-28">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-bara-line bg-bara-black/95 px-4 py-3 backdrop-blur">
        <Link to="/order" aria-label="Kembali" className="text-xl">←</Link>
        <h1 className="text-base font-bold">Pesanan Anda</h1>
      </header>

      <div className="px-4 pt-4">
        <div className="rounded-lg border border-bara-cyan/50 bg-bara-panel px-3 py-2 text-sm">
          Dine In · Meja {tableNumber ?? '-'}
        </div>
        {cartChanges && <div className="mt-3"><CartSyncNotice changes={cartChanges} /></div>}
      </div>

      <section className="px-4 pt-6">
        <h2 className="mb-2 text-sm font-bold text-bara-cyan">Menu Terkait</h2>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {related.map((i) => (
            <button
              key={i.id}
              onClick={() => add(i, {}, i.price)}
              className="flex w-36 shrink-0 flex-col items-start rounded-lg border border-bara-line bg-bara-panel p-2 text-left"
            >
              <span className="text-sm font-medium">{i.name}</span>
              <span className="mt-1 text-xs text-white/60">{rupiah(i.price)}</span>
              <span className="mt-2 self-end rounded border border-bara-cyan px-2 py-0.5 text-xs text-bara-cyan">+ Tambah</span>
            </button>
          ))}
        </div>
      </section>

      <section className="px-4 pt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold text-bara-cyan">Item Dipesan ({lines.length})</h2>
          <Link to="/order" className="rounded-full border border-bara-cyan px-3 py-1 text-xs font-semibold text-bara-cyan">
            + Tambah Item
          </Link>
        </div>

        {lines.length === 0 ? (
          <p className="py-8 text-center text-sm text-white/50">Keranjang masih kosong.</p>
        ) : (
          <ul className="divide-y divide-bara-line">
            {lines.map((l) => (
              <li key={l.key} className="py-3" data-testid="cart-line" data-item-id={l.item.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{l.item.name}</p>
                    {l.opts?.level && <p className="text-xs text-white/60">Level {l.opts.level}</p>}
                    {l.opts?.variant && <p className="text-xs text-white/60">Pilihan: {l.opts.variant}</p>}
                    {l.opts?.toppings?.length > 0 && (
                      <p className="text-xs text-white/60">+ {l.opts.toppings.join(', ')}</p>
                    )}
                    {l.opts?.note && <p className="text-xs italic text-white/50">Catatan: {l.opts.note}</p>}
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm" data-testid="cart-line-price">{rupiah(l.unitPrice)}</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQty(l.key, l.qty - 1)}
                      aria-label={`Kurangi ${l.item.name}`}
                      className="h-7 w-7 rounded-full border border-bara-line"
                    >
                      −
                    </button>
                    <span className="w-4 text-center">{l.qty}</span>
                    <button
                      onClick={() => setQty(l.key, l.qty + 1)}
                      aria-label={`Tambah ${l.item.name}`}
                      className="h-7 w-7 rounded-full border border-bara-line"
                    >
                      +
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {lines.length > 0 && (
        <section className="px-4 pt-6">
          <div className="rounded-xl border border-bara-line bg-bara-panel p-4">
            <h3 className="mb-3 text-center text-sm font-bold text-bara-cyan">Rincian Pembayaran</h3>
            <div className="flex justify-between text-sm text-white/80">
              <span>Subtotal ({lines.length} menu)</span>
              <span>{rupiah(total())}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-bara-line pt-2 text-sm text-white/80">
              <span>Biaya Lain</span>
              <span>{rupiah(fee)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-bara-line pt-2 font-bold">
              <span>Total</span>
              <span className="text-bara-cyan">{rupiah(grandTotal)}</span>
            </div>
          </div>
        </section>
      )}

      {lines.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md border-t border-bara-line bg-bara-black p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/60">Total Pembayaran</p>
              <p className="text-lg font-bold">{rupiah(grandTotal)}</p>
            </div>
            <button
              data-testid="checkout-button"
              onClick={() => navigate('/payment')}
              className="rounded-xl bg-bara-cyan px-6 py-3 font-bold text-black"
            >
              Lanjut ke Pembayaran
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
