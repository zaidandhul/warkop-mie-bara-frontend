import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { errorMessage } from '../api/orders.js'
import { rupiah } from '../data/menu.js'
import { getAdminMenu, isUnauthorized, updateMenuItem } from './api.js'

function AvailabilitySwitch({ item, busy, onToggle }) {
  return (
    <button
      role="switch"
      data-testid={`menu-switch-${item.id}`}
      aria-checked={item.isActive}
      aria-label={`${item.name}: ${item.isActive ? 'tersedia' : 'habis'}`}
      disabled={busy}
      onClick={() => onToggle(item)}
      className={`flex min-h-12 w-36 shrink-0 items-center justify-between rounded-full px-1.5 text-sm font-bold transition-colors disabled:opacity-50 ${
        item.isActive ? 'bg-emerald-500 text-black' : 'bg-bara-chili/80 text-white'
      }`}
    >
      {item.isActive ? (
        <>
          <span className="pl-3">Tersedia</span>
          <span className="h-9 w-9 rounded-full bg-white" />
        </>
      ) : (
        <>
          <span className="h-9 w-9 rounded-full bg-white" />
          <span className="pr-4">Habis</span>
        </>
      )}
    </button>
  )
}

function PriceEditor({ item, busy, onSave }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(String(item.price))

  if (!editing) {
    return (
      <button
        data-testid={`price-edit-${item.id}`}
        onClick={() => { setValue(String(item.price)); setEditing(true) }}
        className="min-h-12 rounded-lg border border-bara-line px-3 text-sm hover:bg-white/10"
      >
        {rupiah(item.price)} ✎
      </button>
    )
  }
  const submit = async (e) => {
    e.preventDefault()
    if (await onSave(item, value)) setEditing(false)
  }
  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <input
        data-testid="price-input"
        autoFocus
        type="number"
        inputMode="numeric"
        min={0}
        max={10000000}
        step={500}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="min-h-12 w-32 rounded-lg border border-bara-cyan bg-bara-black px-3 text-right"
      />
      <button type="submit" data-testid="price-save" disabled={busy} className="min-h-12 rounded-lg bg-bara-cyan px-4 font-bold text-black disabled:opacity-50">Simpan</button>
      <button type="button" onClick={() => setEditing(false)} className="min-h-12 rounded-lg border border-bara-line px-3">Batal</button>
    </form>
  )
}

export default function AdminMenuPage() {
  const { onSessionExpired } = useOutletContext()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [onlySoldOut, setOnlySoldOut] = useState(false)
  const [busyIds, setBusyIds] = useState(() => new Set())

  useEffect(() => {
    getAdminMenu()
      .then(setItems)
      .catch((loadError) => {
        if (isUnauthorized(loadError)) return onSessionExpired()
        setError(errorMessage(loadError, 'Gagal memuat menu.'))
      })
      .finally(() => setLoading(false))
  }, [onSessionExpired])

  const setBusy = (id, busy) => setBusyIds((current) => {
    const next = new Set(current)
    if (busy) next.add(id)
    else next.delete(id)
    return next
  })

  // Perubahan langsung tampil; kalau server menolak, dikembalikan ke nilai lama.
  const save = async (item, changes) => {
    setBusy(item.id, true)
    setError('')
    setItems((current) => current.map((i) => (i.id === item.id ? { ...i, ...changes } : i)))
    try {
      const saved = await updateMenuItem(item.id, changes)
      setItems((current) => current.map((i) => (i.id === item.id ? { ...i, ...saved } : i)))
      return true
    } catch (saveError) {
      setItems((current) => current.map((i) => (i.id === item.id ? item : i)))
      if (isUnauthorized(saveError)) onSessionExpired()
      else setError(`Gagal menyimpan ${item.name}: ${errorMessage(saveError, 'coba lagi.')}`)
      return false
    } finally {
      setBusy(item.id, false)
    }
  }

  const savePrice = (item, text) => {
    const raw = String(text).trim()
    if (!/^\d{1,8}$/.test(raw)) {
      setError('Harga harus bilangan bulat Rupiah, tanpa titik atau koma.')
      return false
    }
    const price = Number(raw)
    return price === item.price ? true : save(item, { price })
  }

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = items.filter((item) => (!q || item.name.toLowerCase().includes(q)) && (!onlySoldOut || !item.isActive))
    const byCategory = new Map()
    filtered.forEach((item) => {
      if (!byCategory.has(item.categoryName)) byCategory.set(item.categoryName, [])
      byCategory.get(item.categoryName).push(item)
    })
    return [...byCategory]
  }, [items, query, onlySoldOut])

  const soldOutCount = items.filter((item) => !item.isActive).length

  return (
    <div className="h-full overflow-y-auto px-5 py-4">
      {/* Fixed di bawah layar: tetap terlihat walau staf sedang menggulir jauh dari atas halaman. */}
      {error && (
        <div
          role="alert"
          data-testid="menu-error"
          className="fixed inset-x-0 bottom-4 z-50 mx-auto flex w-fit max-w-[90vw] items-center gap-3 rounded-xl border border-bara-chili bg-[#2a0f0e] px-4 py-3 text-sm text-white shadow-lg"
        >
          <span>{error}</span>
          <button onClick={() => setError('')} aria-label="Tutup pesan" className="min-h-10 px-2 text-white/70">✕</button>
        </div>
      )}
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari menu…"
            className="min-h-12 flex-1 rounded-lg border border-bara-line bg-bara-panel px-3 outline-none focus:border-bara-cyan"
          />
          <button
            onClick={() => setOnlySoldOut((value) => !value)}
            aria-pressed={onlySoldOut}
            className={`min-h-12 rounded-lg border px-4 text-sm font-semibold ${onlySoldOut ? 'border-bara-chili bg-bara-chili/20 text-white' : 'border-bara-line text-white/70'}`}
          >
            Hanya yang habis ({soldOutCount})
          </button>
        </div>

        {loading ? (
          <p className="mt-6 text-white/60">Memuat menu…</p>
        ) : groups.length === 0 ? (
          <p className="mt-6 text-white/60">Tidak ada menu yang cocok.</p>
        ) : (
          groups.map(([categoryName, categoryItems]) => (
            <section key={categoryName} className="mt-6">
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-bara-cyan">{categoryName}</h2>
              <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                {categoryItems.map((item) => (
                  <li
                    key={item.id}
                    className={`flex items-center gap-3 rounded-xl border border-bara-line bg-bara-panel px-3 py-2 ${item.isActive ? '' : 'opacity-70'}`}
                  >
                    <p className="min-w-0 flex-1 font-medium">{item.name}</p>
                    <PriceEditor item={item} busy={busyIds.has(item.id)} onSave={savePrice} />
                    <AvailabilitySwitch
                      item={item}
                      busy={busyIds.has(item.id)}
                      onToggle={(target) => save(target, { isActive: !target.isActive })}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  )
}
