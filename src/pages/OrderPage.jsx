import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../store/cartStore.js'
import { describeOpts, priceFor, rupiah, TOPPINGS } from '../data/menu.js'
import { getMenu } from '../api/orders.js'
import ItemSheet from '../components/ItemSheet.jsx'

export default function OrderPage() {
  const navigate = useNavigate()
  const { lines, setQty, replace, total, grandTotal } = useCartStore()
  const [editing, setEditing] = useState(null)
  const [catalog, setCatalog] = useState({ toppings: TOPPINGS, levelPriceStep: 0 })

  useEffect(() => {
    getMenu().then(setCatalog).catch(() => {})
  }, [])

  return (
    <div className="mx-auto min-h-screen max-w-md pb-32">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-bara-line bg-bara-black/95 px-4 py-3">
        <button onClick={() => navigate(-1)} aria-label="Kembali" className="text-2xl leading-none">←</button>
        <h1 className="flex-1 text-center text-lg font-bold">Pesanan</h1>
        <span className="w-6" />
      </header>

      <div className="px-4 pt-4">
        <div className="flex items-center justify-between rounded-lg border border-bara-cyan px-3 py-2 text-sm">
          <span className="text-white/70">Tipe pesanan</span>
          <span className="font-semibold">Makan di tempat</span>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <h2 className="font-bold">Item dipesan ({lines.length})</h2>
          <button onClick={() => navigate('/')} className="rounded-lg border border-bara-cyan px-3 py-1 text-sm font-semibold text-bara-cyan">
            + Tambah item
          </button>
        </div>

        {lines.length === 0 && <p className="py-10 text-center text-sm text-white/60">Keranjang masih kosong. Pilih menu dulu, ya.</p>}

        <ul className="divide-y divide-bara-line">
          {lines.map((l) => (
            <li key={l.key} className="py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{l.item.name}</p>
                  {describeOpts(l.opts) && <p className="mt-0.5 text-xs text-white/60">{describeOpts(l.opts)}</p>}
                  <p className="mt-0.5 text-xs italic text-white/50">{l.opts.note || 'Belum ada catatan'}</p>
                </div>
                <button onClick={() => setEditing(l)} className="rounded-lg border border-bara-line px-3 py-1 text-sm">Ubah</button>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm font-semibold">{rupiah(l.unitPrice * l.qty)}</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQty(l.key, l.qty - 1)} aria-label="Kurangi" className="h-8 w-8 rounded-full border border-white/60">−</button>
                  <span className="w-4 text-center">{l.qty}</span>
                  <button onClick={() => setQty(l.key, l.qty + 1)} aria-label="Tambah" className="h-8 w-8 rounded-full border border-white/60">+</button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {lines.length > 0 && (
          <section className="mt-4 rounded-xl border border-bara-line bg-bara-panel p-4 text-sm">
            <h2 className="mb-3 text-center font-bold">Rincian pembayaran</h2>
            <div className="flex justify-between border-b border-dashed border-bara-line pb-2">
              <span>Subtotal <span className="text-white/50">({lines.length} menu)</span></span>
              <span>{rupiah(total())}</span>
            </div>
            {OTHER_FEE > 0 && (
              <div className="flex justify-between border-b border-dashed border-bara-line py-2">
                <span>Biaya lain</span>
                <span>{rupiah(OTHER_FEE)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 font-bold">
              <span>Total</span>
              <span className="text-bara-cyan">{rupiah(grandTotal())}</span>
            </div>
          </section>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-bara-line bg-bara-black">
        <div className="mx-auto flex max-w-md items-center justify-between gap-4 p-4">
          <div>
            <p className="text-xs text-white/60">Total pembayaran</p>
            <p className="text-xl font-extrabold">{rupiah(grandTotal())}</p>
          </div>
          <button
            disabled={lines.length === 0}
            onClick={() => navigate('/payment')}
            className="rounded-xl bg-bara-cyan px-5 py-3 font-bold text-black disabled:opacity-40"
          >
            Lanjut ke pembayaran
          </button>
        </div>
      </div>

      {editing && (
        <ItemSheet
          key={editing.key}
          item={editing.item}
          initial={editing.opts}
          toppingsCatalog={catalog.toppings}
          levelPriceStep={catalog.levelPriceStep}
          noteOnly={['camilan', 'signature-drink', 'all-variant-drink'].includes(editing.item.categoryId)}
          onClose={() => setEditing(null)}
          onSave={(opts, unitPrice) => {
            replace(editing.key, editing.item, opts, unitPrice)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}
