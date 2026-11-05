import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const SORTS = [
  { id: 'default', label: 'Urutan menu' },
  { id: 'termurah', label: 'Termurah' },
  { id: 'termahal', label: 'Termahal' },
  { id: 'terlaris', label: 'Terlaris' },
]

const INITIAL = { categoryId: '', query: '', sort: 'default' }

// Filter kategori, pencarian, dan urutan di halaman menu pelanggan. Disimpan di sessionStorage supaya
// tetap sama saat pelanggan kembali dari keranjang atau halaman lain.
export const useMenuViewStore = create(
  persist(
    (set) => ({
      ...INITIAL,
      setCategory: (categoryId) => set({ categoryId }),
      setQuery: (query) => set({ query }),
      setSort: (sort) => set({ sort: SORTS.some((option) => option.id === sort) ? sort : 'default' }),
      reset: () => set(INITIAL),
    }),
    { name: 'mie-bara-menu-view', storage: createJSONStorage(() => sessionStorage) }
  )
)

const normalize = (text) => (text ?? '').toLocaleLowerCase('id-ID')

// Item yang sesuai filter. Urutan default = urutan dari GET /api/menu (kategori lalu item).
// - sort 'default': { grouped: true, sections: [{ id, name, items }] } (per kategori)
// - sort lain: { grouped: false, items } satu daftar lintas kategori.
// Terlaris: bestSellerRank kecil dulu; menu tanpa data penjualan di belakang, urutan default.
export function filterMenu(categories, { categoryId, query, sort }) {
  const q = normalize(query.trim())
  const matches = (item) => !q || normalize(item.name).includes(q) || normalize(item.desc).includes(q)
  const sections = categories
    .filter((category) => !categoryId || category.id === categoryId)
    .map((category) => ({ ...category, items: category.items.filter(matches) }))
    .filter((category) => category.items.length)
  if (sort === 'default') return { grouped: true, sections, count: sections.reduce((n, c) => n + c.items.length, 0) }

  const items = sections.flatMap((category) => category.items.map((item) => ({ ...item, categoryId: category.id })))
  const indexed = items.map((item, index) => ({ item, index }))
  const compare = {
    termurah: (a, b) => a.item.price - b.item.price,
    termahal: (a, b) => b.item.price - a.item.price,
    terlaris: (a, b) => (a.item.bestSellerRank ?? Infinity) - (b.item.bestSellerRank ?? Infinity),
  }[sort]
  const sorted = indexed.sort((a, b) => compare(a, b) || a.index - b.index).map(({ item }) => item)
  return { grouped: false, items: sorted, count: sorted.length }
}
