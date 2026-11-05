import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { getMenu } from '../api/orders.js'
import { useCartStore } from '../store/cartStore.js'
import ItemSheet from '../components/ItemSheet.jsx'
import CartSyncNotice, { mergeCartChanges } from '../components/CartSyncNotice.jsx'
import { SORTS, filterMenu, useMenuViewStore } from '../store/menuViewStore.js'
import logo from '../logo.png'

const rupiah = (n) => 'Rp' + n.toLocaleString('id-ID')
const CONFIGURABLE_FOOD_CATEGORIES = ['varian-mie', 'special', 'bara-nusantara']
const NOTE_ONLY_CATEGORIES = ['camilan', 'signature-drink', 'all-variant-drink']

// wide: kartu mengisi kolom grid (hasil yang diurutkan); selain itu lebar tetap untuk baris geser.
function MenuCard({ item, onAdd, categoryId, wide = false }) {
  return (
    <div className={wide ? 'min-w-0' : 'w-36 shrink-0'} data-testid={`menu-card-${item.id}`}>
      <div className={`flex h-28 items-center justify-center rounded-lg bg-bara-panel text-3xl ${wide ? 'w-full' : 'w-36'}`}>🍜</div>
      <p className="mt-2 text-sm font-semibold leading-tight">{item.name}</p>
      <p className="mt-1 text-sm text-white/70" data-testid={`menu-price-${item.id}`}>{rupiah(item.price)}</p>
      <button
        data-testid={`menu-add-${item.id}`}
        onClick={() => onAdd(item, categoryId)}
        className="mt-2 w-full rounded-lg border border-bara-cyan py-1.5 text-sm font-semibold text-bara-cyan active:bg-bara-cyan active:text-black"
      >
        Tambah
      </button>
    </div>
  )
}

export default function MenuPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { tableNumber, tableCount, setTable, add, count, total, syncWithMenu } = useCartStore()
  const tableNumbers = Array.from({ length: tableCount }, (_, index) => String(index + 1))
  const [catalog, setCatalog] = useState({ categories: [], toppings: [], fee: 0, levelPriceStep: 0 })
  const [loadingMenu, setLoadingMenu] = useState(true)
  const [menuError, setMenuError] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)
  const { categoryId, query, sort, setCategory, setQuery, setSort, reset } = useMenuViewStore()
  const [cartChanges, setCartChanges] = useState(null)
  const initialTableHandled = useRef(false)

  const openItemOptions = (item, categoryId) => {
    const resolvedCategoryId = categoryId ?? item.categoryId
    // Pilihan level/topping mengikuti database; backend menolak pilihan yang tidak terdaftar di item.
    setSelectedItem({ ...item, categoryId: resolvedCategoryId })
  }

  const loadMenu = useCallback(async () => {
    setLoadingMenu(true)
    setMenuError('')
    try {
      const result = await getMenu()
      setCatalog(result)
      setCartChanges((previous) => mergeCartChanges(previous, syncWithMenu(result)))
    } catch (error) {
      setMenuError(error.response?.data?.error || 'Menu gagal dimuat. Pastikan backend dan MySQL sedang berjalan.')
    } finally {
      setLoadingMenu(false)
    }
  }, [syncWithMenu])

  useEffect(() => { loadMenu() }, [loadMenu])

  useEffect(() => {
    if (initialTableHandled.current) return
    initialTableHandled.current = true
    const requestedTable = params.get('tableNumber') ?? tableNumber
    if (requestedTable == null) return
    if (String(requestedTable) !== tableNumber) setTable(requestedTable)
  }, [params, setTable, tableNumber])

  // Kategori tersimpan yang sudah tidak ada (semua menunya habis) diperlakukan sebagai "Semua".
  const activeCategory = catalog.categories.some((category) => category.id === categoryId) ? categoryId : ''
  const view = useMemo(
    () => filterMenu(catalog.categories, { categoryId: activeCategory, query, sort }),
    [catalog.categories, activeCategory, query, sort]
  )
  const filtered = Boolean(activeCategory || query.trim())

  return (
    <div className="mx-auto max-w-md pb-24">
      {/* Hero */}
      <div className="relative flex h-44 items-center justify-center bg-gradient-to-b from-bara-panel to-bara-black">
        <img src={logo} alt="Warkop Mie Bara" className="h-32 w-32 object-contain" />
        <div className="absolute right-3 top-3 flex gap-2">
          <button
            onClick={() => navigate('/profile')}
            aria-label="Buka menu profil"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Info toko */}
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between rounded-xl border border-bara-line bg-bara-panel px-4 py-3">
          <div>
            <p className="font-bold">Warkop Mie Bara</p>
            <p className="text-xs text-white/60">Buka hari ini, 10:00–23:00</p>
          </div>
          <span className="text-white/40">›</span>
        </div>

        <label className="mt-3 block rounded-lg border border-bara-cyan/40 bg-bara-cyan/10 px-4 py-3 text-sm">
          <span className="mb-2 block font-semibold text-bara-cyan">Pilih nomor meja</span>
          <select
            data-testid="table-select"
            value={tableNumber ?? ''}
            onChange={(event) => setTable(event.target.value || null)}
            className="w-full rounded-lg border border-bara-line bg-bara-panel px-3 py-2 text-white outline-none focus:border-bara-cyan"
          >
            <option value="">Pilih meja 1–{tableCount}</option>
            {tableNumbers.map((number) => <option key={number} value={number}>Meja {number}</option>)}
          </select>
        </label>

        {cartChanges && <div className="mt-3"><CartSyncNotice changes={cartChanges} /></div>}

        <div className="mt-3 flex gap-2">
          <input
            type="search"
            data-testid="menu-search"
            aria-label="Cari menu"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🔍 Cari menu…"
            className="min-w-0 flex-1 rounded-lg border border-bara-line bg-bara-panel px-3 py-2 text-sm outline-none focus:border-bara-cyan"
          />
          <select
            data-testid="menu-sort"
            aria-label="Urutkan menu"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="shrink-0 rounded-lg border border-bara-line bg-bara-panel px-2 py-2 text-sm outline-none focus:border-bara-cyan"
          >
            {SORTS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
          </select>
        </div>
      </div>

      {/* Filter kategori */}
      <div className="sticky top-0 z-10 mt-4 overflow-x-auto no-scrollbar border-b border-bara-line bg-bara-black/95 px-4 backdrop-blur">
        <div className="flex gap-2 whitespace-nowrap py-3 text-sm">
          {[{ id: '', name: 'Semua' }, ...catalog.categories].map((c) => (
            <button
              key={c.id || 'semua'}
              data-testid={`category-filter-${c.id || 'semua'}`}
              aria-pressed={activeCategory === c.id}
              onClick={() => setCategory(c.id)}
              className={`rounded-full border px-3 py-1.5 font-medium transition-colors duration-200 ${
                activeCategory === c.id ? 'border-bara-cyan bg-bara-cyan text-black' : 'border-bara-line text-white/70'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {loadingMenu && <p className="px-4 py-8 text-center text-sm text-white/60">Memuat menu…</p>}
      {!loadingMenu && menuError && (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-bara-chili">{menuError}</p>
          <button onClick={loadMenu} className="mt-3 rounded-lg border border-bara-cyan px-4 py-2 text-sm text-bara-cyan">Coba lagi</button>
        </div>
      )}

      {!loadingMenu && !menuError && view.count === 0 && (
        <div data-testid="menu-empty" className="px-6 py-12 text-center">
          <p className="text-3xl">🍜</p>
          <p className="mt-3 font-semibold">Menu tidak ditemukan</p>
          <p className="mt-1 text-sm text-white/60">
            {query.trim() ? `Tidak ada menu yang cocok dengan "${query.trim()}"` : 'Tidak ada menu di kategori ini'}
            {activeCategory && query.trim() ? ` di kategori ${catalog.categories.find((c) => c.id === activeCategory)?.name}` : ''}.
          </p>
          <button
            data-testid="clear-filters"
            onClick={reset}
            className="mt-4 rounded-lg border border-bara-cyan px-4 py-2 text-sm font-semibold text-bara-cyan"
          >
            Hapus filter
          </button>
        </div>
      )}

      {/* Urutan default: per kategori (baris geser). Urutan lain: satu daftar lintas kategori. */}
      {view.grouped ? view.sections.map((c) => (
        <section key={c.id} data-category-id={c.id} className="px-4 pt-6">
          <h2 className="mb-3 text-base font-bold">{c.name}</h2>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {c.items.map((i) => (
              <MenuCard key={i.id} item={i} categoryId={c.id} onAdd={openItemOptions} />
            ))}
          </div>
        </section>
      )) : view.count > 0 && (
        <section className="px-4 pt-6">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-base font-bold">{SORTS.find((option) => option.id === sort)?.label}</h2>
            <span className="text-xs text-white/50">{view.count} menu</span>
          </div>
          <div data-testid="menu-results" className="grid grid-cols-2 gap-3">
            {view.items.map((i) => (
              <MenuCard key={i.id} item={i} categoryId={i.categoryId} onAdd={openItemOptions} wide />
            ))}
          </div>
        </section>
      )}
      {filtered && view.count > 0 && (
        <div className="px-4 pt-4 text-center">
          <button data-testid="clear-filters-inline" onClick={reset} className="text-sm text-white/50 underline">Hapus filter</button>
        </div>
      )}

      {count() > 0 && createPortal(
        <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md p-4">
          <button
            data-testid="cart-button"
            onClick={() => navigate('/view-order')}
            className="flex w-full items-center justify-between rounded-xl bg-bara-cyan px-4 py-3 font-bold text-black shadow-lg"
          >
            <span>{count()} item</span>
            <span>Lihat Keranjang · {rupiah(total())}</span>
          </button>
        </div>,
        document.body
      )}

      {selectedItem && (
        <ItemSheet
          key={selectedItem.id}
          item={selectedItem}
          toppingsCatalog={catalog.toppings}
          levelPriceStep={catalog.levelPriceStep}
          noteOnly={NOTE_ONLY_CATEGORIES.includes(selectedItem.categoryId)}
          useScreenPortal={CONFIGURABLE_FOOD_CATEGORIES.includes(selectedItem.categoryId) || NOTE_ONLY_CATEGORIES.includes(selectedItem.categoryId)}
          onClose={() => setSelectedItem(null)}
          onSave={(options, unitPrice) => {
            add(selectedItem, options, unitPrice)
            setSelectedItem(null)
          }}
        />
      )}
    </div>
  )
}
