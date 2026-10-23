import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { getMenu } from '../api/orders.js'
import { MAX_TABLE_NUMBER, normalizeTableNumber, useCartStore } from '../store/cartStore.js'
import ItemSheet from '../components/ItemSheet.jsx'
import { TOPPINGS } from '../data/menu.js'
import logo from '../logo.png'

const rupiah = (n) => 'Rp' + n.toLocaleString('id-ID')
const TABLE_NUMBERS = Array.from({ length: MAX_TABLE_NUMBER }, (_, index) => String(index + 1))
const CONFIGURABLE_FOOD_CATEGORIES = ['varian-mie', 'special', 'bara-nusantara']
const NOTE_ONLY_CATEGORIES = ['camilan', 'signature-drink', 'all-variant-drink']

function MenuCard({ item, onAdd, categoryId }) {
  return (
    <div className="w-36 shrink-0">
      <div className="flex h-28 w-36 items-center justify-center rounded-lg bg-bara-panel text-3xl">🍜</div>
      <p className="mt-2 text-sm font-semibold leading-tight">{item.name}</p>
      <p className="mt-1 text-sm text-white/70">{rupiah(item.price)}</p>
      <button
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
  const { tableNumber, setTable, add, count, total, setFee } = useCartStore()
  const [catalog, setCatalog] = useState({ categories: [], toppings: [], fee: 0, levelPriceStep: 0 })
  const [loadingMenu, setLoadingMenu] = useState(true)
  const [menuError, setMenuError] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)
  const [query, setQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [activeTab, setActiveTab] = useState('')
  const sectionRefs = useRef({})
  const tabRefs = useRef({})
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
      setFee(result.fee)
      setActiveTab((current) => result.categories.some((category) => category.id === current)
        ? current
        : (result.categories[0]?.id ?? ''))
    } catch (error) {
      setMenuError(error.response?.data?.error || 'Menu gagal dimuat. Pastikan backend dan MySQL sedang berjalan.')
    } finally {
      setLoadingMenu(false)
    }
  }, [setFee])

  useEffect(() => { loadMenu() }, [loadMenu])

  useEffect(() => {
    if (initialTableHandled.current) return
    initialTableHandled.current = true
    const requestedTable = params.get('tableNumber') ?? tableNumber
    if (requestedTable == null) return
    const normalizedTable = normalizeTableNumber(requestedTable)
    if (normalizedTable !== tableNumber) setTable(normalizedTable)
  }, [params, setTable, tableNumber])

  const categories = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return catalog.categories
    return catalog.categories.map((c) => ({ ...c, items: c.items.filter((i) => i.name.toLowerCase().includes(q)) })).filter((c) => c.items.length)
  }, [catalog.categories, query])

  const scrollToSection = (id) => {
    setActiveTab(id)
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    if (!categories.length) return undefined
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length > 0) {
          const topMost = visible.reduce((a, b) =>
            a.boundingClientRect.top < b.boundingClientRect.top ? a : b
          )
          setActiveTab(topMost.target.dataset.categoryId)
        }
      },
      { rootMargin: '-120px 0px -70% 0px', threshold: 0 }
    )

    const refs = Object.values(sectionRefs.current).filter(Boolean)
    refs.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [categories])

  useEffect(() => {
    tabRefs.current[activeTab]?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    })
  }, [activeTab])

  return (
    <div className="mx-auto max-w-md pb-24">
      {/* Hero */}
      <div className="relative flex h-44 items-center justify-center bg-gradient-to-b from-bara-panel to-bara-black">
        <img src={logo} alt="Warkop Mie Bara" className="h-32 w-32 object-contain" />
        <div className="absolute right-3 top-3 flex gap-2">
          <button
            onClick={() => setShowSearch((s) => !s)}
            aria-label="Cari menu"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white"
          >
            🔍
          </button>
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
            value={tableNumber ?? ''}
            onChange={(event) => setTable(event.target.value || null)}
            className="w-full rounded-lg border border-bara-line bg-bara-panel px-3 py-2 text-white outline-none focus:border-bara-cyan"
          >
            <option value="">Pilih meja 1–{MAX_TABLE_NUMBER}</option>
            {TABLE_NUMBERS.map((number) => <option key={number} value={number}>Meja {number}</option>)}
          </select>
        </label>

        {showSearch && (
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Mau makan atau minum apa?"
            className="mt-3 w-full rounded-lg border border-bara-line bg-bara-panel px-3 py-2 text-sm outline-none focus:border-bara-cyan"
          />
        )}
      </div>

      {/* Tab kategori */}
      <div className="sticky top-0 z-10 mt-4 overflow-x-auto no-scrollbar border-b border-bara-line bg-bara-black/95 px-4 backdrop-blur">
        <div className="flex gap-5 whitespace-nowrap py-3 text-sm">
          {catalog.categories.map((c) => (
            <button
              key={c.id}
              ref={(el) => (tabRefs.current[c.id] = el)}
              onClick={() => scrollToSection(c.id)}
              className={`relative pb-2 font-medium transition-colors duration-200 ${
                activeTab === c.id ? 'text-bara-cyan' : 'text-white/60'
              }`}
            >
              {c.name}
              <span
                aria-hidden="true"
                className={`absolute inset-x-0 bottom-0 h-0.5 origin-left rounded-full bg-bara-cyan transition-transform duration-300 ${activeTab === c.id ? 'scale-x-100' : 'scale-x-0'}`}
              />
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

      {/* Section per kategori */}
      {categories.map((c) => (
        <section
          key={c.id}
          ref={(el) => (sectionRefs.current[c.id] = el)}
          data-category-id={c.id}
          className={`category-section-enter scroll-mt-16 px-4 pt-6 ${activeTab === c.id ? 'is-active' : ''}`}
        >
          <h2 className="mb-3 text-base font-bold">{c.name}</h2>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {c.items.map((i) => (
              <MenuCard
                key={i.id}
                item={i}
                categoryId={c.id}
                onAdd={openItemOptions}
              />
            ))}
          </div>
        </section>
      ))}

      {count() > 0 && createPortal(
        <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md p-4">
          <button
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
          toppingsCatalog={CONFIGURABLE_FOOD_CATEGORIES.includes(selectedItem.categoryId) && catalog.toppings.length === 0 ? TOPPINGS : catalog.toppings}
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
