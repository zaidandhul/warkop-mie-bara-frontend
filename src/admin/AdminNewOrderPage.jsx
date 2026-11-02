import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { errorMessage, getMenu, newIdempotencyKey } from '../api/orders.js'
import ItemSheet from '../components/ItemSheet.jsx'
import { rupiah } from '../data/menu.js'
import { DEFAULT_TABLE_COUNT, keyOf } from '../store/cartStore.js'
import { createAdminOrder, isUnauthorized } from './api.js'
import { PAID_METHODS } from './constants.js'

const PAYMENT_CHOICES = [{ method: null, label: 'Belum bayar' }, ...PAID_METHODS.map(({ method, label }) => ({ method, label: `Lunas · ${label}` }))]

function describeLine(line, toppings) {
  return [
    line.opts.level && `Level ${line.opts.level}`,
    line.opts.variant,
    ...(line.opts.toppings ?? []).map((id) => `+ ${toppings.find((topping) => topping.id === id)?.name ?? id}`),
    line.opts.note && `📝 ${line.opts.note}`,
  ].filter(Boolean).join(' · ')
}

// Kasir menginput pesanan dari dashboard (pelanggan yang memesan langsung di kasir). Harga di layar
// hanya perkiraan; server menghitung ulang dan total dari respons yang ditampilkan.
export default function AdminNewOrderPage() {
  const { onSessionExpired } = useOutletContext()
  const [menu, setMenu] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [query, setQuery] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)
  const [lines, setLines] = useState([])
  const [tableNumber, setTableNumber] = useState('')
  const [name, setName] = useState('')
  const [paidMethod, setPaidMethod] = useState(null)
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState(null)

  const loadMenu = () => {
    setLoadError('')
    getMenu().then(setMenu).catch((menuError) => setLoadError(errorMessage(menuError, 'Menu gagal dimuat.')))
  }
  useEffect(loadMenu, [])

  const items = useMemo(() => {
    if (!menu) return []
    const q = query.trim().toLowerCase()
    return menu.categories
      .filter((category) => !categoryId || category.id === categoryId)
      .flatMap((category) => category.items)
      .filter((item) => !q || item.name.toLowerCase().includes(q))
  }, [menu, query, categoryId])

  const tableCount = menu?.tableCount ?? DEFAULT_TABLE_COUNT
  const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.qty, 0)
  const fee = lines.length ? (menu?.fee ?? 0) : 0

  const addLine = (item, opts, unitPrice) => {
    const key = keyOf(item, opts)
    setLines((current) => current.some((line) => line.key === key)
      ? current.map((line) => (line.key === key ? { ...line, qty: line.qty + 1 } : line))
      : [...current, { key, item, opts, unitPrice, qty: 1 }])
    setCreated(null)
  }
  const setQty = (key, qty) => setLines((current) => qty <= 0
    ? current.filter((line) => line.key !== key)
    : current.map((line) => (line.key === key ? { ...line, qty: Math.min(qty, 50) } : line)))

  const submit = async (e) => {
    e.preventDefault()
    if (submitting || !lines.length || !tableNumber) return
    setSubmitting(true)
    setError('')
    try {
      const order = await createAdminOrder({
        tableNumber,
        customer: { name: name.trim() },
        paidMethod,
        items: lines.map((line) => ({
          itemId: line.item.id,
          qty: line.qty,
          options: { level: line.opts.level, variant: line.opts.variant, toppings: line.opts.toppings ?? [], note: line.opts.note ?? '' },
        })),
      }, idempotencyKey)
      setCreated(order)
      setLines([])
      setName('')
      setPaidMethod(null)
      setIdempotencyKey(newIdempotencyKey())
    } catch (submitError) {
      if (isUnauthorized(submitError)) return onSessionExpired()
      setError(errorMessage(submitError, 'Pesanan gagal dibuat. Coba lagi.'))
      if (submitError?.response?.status === 400) loadMenu() // mis. menu baru saja habis
    } finally {
      setSubmitting(false)
    }
  }

  if (loadError) {
    return (
      <div className="p-5">
        <p role="alert" className="text-bara-chili">{loadError}</p>
        <button onClick={loadMenu} className="mt-3 rounded-lg border border-bara-cyan px-4 py-2 text-bara-cyan">Coba lagi</button>
      </div>
    )
  }
  if (!menu) return <p className="p-5 text-white/60">Memuat menu…</p>

  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-4 overflow-y-auto p-5 md:grid-cols-[1fr_24rem] md:overflow-hidden">
      <section className="flex min-h-0 flex-col">
        <input
          data-testid="manual-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari menu…"
          className="min-h-12 rounded-lg border border-bara-line bg-bara-panel px-3 outline-none focus:border-bara-cyan"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {[{ id: '', name: 'Semua' }, ...menu.categories].map((category) => (
            <button
              key={category.id || 'semua'}
              onClick={() => setCategoryId(category.id)}
              aria-pressed={categoryId === category.id}
              className={`min-h-10 rounded-full border px-4 text-sm font-semibold ${categoryId === category.id ? 'border-bara-cyan bg-bara-cyan text-black' : 'border-bara-line text-white/70'}`}
            >
              {category.name}
            </button>
          ))}
        </div>
        <ul className="mt-3 grid min-h-0 flex-1 grid-cols-2 content-start gap-2 overflow-y-auto lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.id}>
              <button
                data-testid={`manual-item-${item.id}`}
                onClick={() => setSelectedItem(item)}
                className="flex min-h-16 w-full flex-col items-start justify-center rounded-xl border border-bara-line bg-bara-panel px-3 py-2 text-left hover:border-bara-cyan"
              >
                <span className="font-semibold leading-tight">{item.name}</span>
                <span className="text-sm text-white/60">{rupiah(item.price)}</span>
              </button>
            </li>
          ))}
          {!items.length && <li className="col-span-full py-6 text-center text-white/50">Tidak ada menu yang cocok.</li>}
        </ul>
      </section>

      <form onSubmit={submit} className="flex min-h-0 flex-col rounded-xl border border-bara-line bg-bara-panel p-4">
        <h2 className="text-lg font-bold">Pesanan Kasir</h2>
        {created && (
          <p role="status" data-testid="manual-created" className="mt-2 rounded-lg border border-emerald-400/50 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
            Pesanan <span className="font-mono">{created.id}</span> dibuat · Meja {created.tableNumber} · {rupiah(created.total)}
            {created.paid ? ' · Lunas' : ' · Belum bayar'}
          </p>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="text-sm">
            Meja <span className="text-bara-chili">*</span>
            <select
              data-testid="manual-table"
              required
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="mt-1 min-h-11 w-full rounded-lg border border-bara-line bg-bara-black px-2"
            >
              <option value="">Pilih</option>
              {Array.from({ length: tableCount }, (_, index) => <option key={index} value={index + 1}>Meja {index + 1}</option>)}
            </select>
          </label>
          <label className="text-sm">
            Nama (opsional)
            <input
              data-testid="manual-name"
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={tableNumber ? `Meja ${tableNumber}` : 'Nama pelanggan'}
              className="mt-1 min-h-11 w-full rounded-lg border border-bara-line bg-bara-black px-2"
            />
          </label>
        </div>

        <ul className="mt-3 min-h-24 flex-1 divide-y divide-bara-line overflow-y-auto border-y border-bara-line">
          {lines.length === 0 && <li className="py-6 text-center text-sm text-white/40">Pilih menu di sebelah kiri.</li>}
          {lines.map((line) => (
            <li key={line.key} data-testid="manual-line" className="py-2">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold leading-tight">{line.item.name}</p>
                <span className="shrink-0 text-sm">{rupiah(line.unitPrice * line.qty)}</span>
              </div>
              {describeLine(line, menu.toppings) && <p className="text-xs text-white/60">{describeLine(line, menu.toppings)}</p>}
              <div className="mt-1 flex items-center gap-2">
                <button type="button" aria-label={`Kurangi ${line.item.name}`} onClick={() => setQty(line.key, line.qty - 1)} className="h-9 w-9 rounded-full border border-bara-line">−</button>
                <span className="w-6 text-center">{line.qty}</span>
                <button type="button" aria-label={`Tambah ${line.item.name}`} onClick={() => setQty(line.key, line.qty + 1)} className="h-9 w-9 rounded-full border border-bara-line">+</button>
              </div>
            </li>
          ))}
        </ul>

        <fieldset className="mt-3">
          <legend className="mb-1 text-sm text-white/70">Pembayaran</legend>
          <div className="flex gap-2">
            {PAYMENT_CHOICES.map(({ method, label }) => (
              <button
                type="button"
                key={method ?? 'belum'}
                data-testid={`manual-pay-${method ?? 'belum'}`}
                aria-pressed={paidMethod === method}
                onClick={() => setPaidMethod(method)}
                className={`min-h-11 flex-1 rounded-lg border px-2 text-sm font-semibold ${paidMethod === method ? 'border-bara-cyan bg-bara-cyan text-black' : 'border-bara-line text-white/70'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        {fee > 0 && <p className="mt-3 flex justify-between text-sm text-white/70"><span>Biaya lain</span><span>{rupiah(fee)}</span></p>}
        <p className="mt-2 flex justify-between text-lg font-bold"><span>Total</span><span data-testid="manual-total">{rupiah(subtotal + fee)}</span></p>
        {error && <p role="alert" className="mt-2 rounded-lg border border-bara-chili/50 bg-bara-chili/10 px-3 py-2 text-sm text-bara-chili">{error}</p>}
        <button
          type="submit"
          data-testid="manual-submit"
          disabled={submitting || !lines.length || !tableNumber}
          className="mt-3 min-h-12 rounded-xl bg-bara-cyan font-bold text-black disabled:opacity-50"
        >
          {submitting ? 'Menyimpan…' : 'Buat Pesanan'}
        </button>
      </form>

      {selectedItem && (
        <ItemSheet
          key={selectedItem.id}
          item={selectedItem}
          toppingsCatalog={menu.toppings}
          levelPriceStep={menu.levelPriceStep}
          noteOnly={!selectedItem.levels.length && !selectedItem.options.length && !selectedItem.toppings.length}
          saveLabel="Tambah"
          useScreenPortal
          onClose={() => setSelectedItem(null)}
          onSave={(opts, unitPrice) => {
            addLine(selectedItem, opts, unitPrice)
            setSelectedItem(null)
          }}
        />
      )}
    </div>
  )
}
