import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { priceFor } from '../utils/price.js'


// Jumlah meja sebelum menu termuat; nilai sebenarnya dari GET /api/menu (tableCount = TABLE_COUNT backend).
export const DEFAULT_TABLE_COUNT = 10
// Batas format nomor meja sebelum jumlah meja dari server diketahui (sama dengan batas TABLE_COUNT backend).
const MAX_TABLE_NUMBER = 99

// Sama dengan backend: trim, hanya angka, nol di depan dibuang ("09" -> "9"), 1–tableCount. Tidak valid -> null.
export function normalizeTableNumber(value, tableCount = MAX_TABLE_NUMBER) {
  const text = String(value ?? '').trim()
  if (!/^\d{1,4}$/.test(text)) return null
  const number = Number(text)
  return number >= 1 && number <= tableCount ? String(number) : null
}

export const keyOf = (item, o = {}) => [item.id, o.level ?? '', (o.toppings ?? []).slice().sort().join('+'), o.variant ?? '', o.note?.trim() ?? ''].join('|')

// Pilihan baris masih sah untuk item di menu terbaru? Aturannya sama dengan createOrder di backend.
function optionsStillValid(item, o = {}, activeToppingIds) {
  if (o.level != null && !(item.levels ?? []).includes(Number(o.level))) return false
  if (o.variant != null && !(item.options ?? []).includes(o.variant)) return false
  return (o.toppings ?? []).every((id) => (item.toppings ?? []).includes(id) && activeToppingIds.has(id))
}

export const useCartStore = create(
  persist(
    (set, get) => ({
      tableNumber: null,
      tableCount: DEFAULT_TABLE_COUNT,
      lines: [], 
      fee: 0, // diisi dari menu (syncWithMenu)
      // Meja dari QR bisa diset sebelum menu termuat; syncWithMenu() lalu menerapkan batas tableCount.
      setTable: (n) => set({ tableNumber: normalizeTableNumber(n) }),
      add: (item, opts = {}, unitPrice = item.price, qty = 1) =>
        set((s) => {
          const key = keyOf(item, opts)
          const found = s.lines.find((l) => l.key === key)
          return {
            lines: found
              ? s.lines.map((l) => (l.key === key ? { ...l, qty: l.qty + qty, opts } : l))
              : [...s.lines, { key, item, opts, unitPrice, qty }],
          }
        }),
      replace: (oldKey, item, opts, unitPrice) =>
        set((s) => {
          const qty = s.lines.find((l) => l.key === oldKey)?.qty ?? 1
          const rest = s.lines.filter((l) => l.key !== oldKey)
          const key = keyOf(item, opts)
          const dup = rest.find((l) => l.key === key)
          return {
            lines: dup
              ? rest.map((l) => (l.key === key ? { ...l, qty: l.qty + qty, opts } : l))
              : [...rest, { key, item, opts, unitPrice, qty }],
          }
        }),
      setQty: (key, qty) =>
        set((s) => ({
          lines: qty <= 0 ? s.lines.filter((l) => l.key !== key) : s.lines.map((l) => (l.key === key ? { ...l, qty } : l)),
        })),
      clear: () => set({ lines: [] }),
      // Samakan keranjang dengan menu dari GET /api/menu: harga dihitung ulang, baris yang menunya
      // habis atau pilihannya tidak lagi tersedia dibuang. Mengembalikan nama item yang berubah.
      syncWithMenu: (menu) => {
        const items = new Map(menu.categories.flatMap((category) => category.items.map((item) => [item.id, item])))
        const activeToppingIds = new Set(menu.toppings.map((topping) => topping.id))
        const removed = []
        const repriced = []
        const lines = []
        for (const line of get().lines) {
          const item = items.get(line.item.id)
          if (!item || !optionsStillValid(item, line.opts, activeToppingIds)) {
            removed.push(line.item.name)
            continue
          }
          const unitPrice = priceFor(item, line.opts, menu.toppings, menu.levelPriceStep)
          if (unitPrice !== line.unitPrice) repriced.push(item.name)
          lines.push({ ...line, item: { ...line.item, ...item }, unitPrice })
        }
        const tableCount = Number(menu.tableCount) || DEFAULT_TABLE_COUNT
        set({ lines, fee: Number(menu.fee) || 0, tableCount, tableNumber: normalizeTableNumber(get().tableNumber, tableCount) })
        return { removed, repriced }
      },
      count: () => get().lines.reduce((n, l) => n + l.qty, 0),
      total: () => get().lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0), // subtotal
      grandTotal: () => (get().lines.length ? get().total() + get().fee : 0),
    }),
    {
      name: 'mie-bara-cart',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({ tableNumber: s.tableNumber, tableCount: s.tableCount, lines: s.lines, fee: s.fee }),
    }
  )
)
