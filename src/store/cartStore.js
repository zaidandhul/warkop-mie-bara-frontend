import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { OTHER_FEE } from '../data/menu.js'


const keyOf = (item, o = {}) => [item.id, o.level ?? '', (o.toppings ?? []).slice().sort().join('+'), o.variant ?? '', o.note?.trim() ?? ''].join('|')

export const useCartStore = create(
  persist(
    (set, get) => ({
      tableNumber: null,
      lines: [], 
      fee: OTHER_FEE,
      setTable: (n) => set({ tableNumber: n }),
      setFee: (fee) => set({ fee: Number(fee) || 0 }),
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
      count: () => get().lines.reduce((n, l) => n + l.qty, 0),
      total: () => get().lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0), // subtotal
      grandTotal: () => (get().lines.length ? get().total() + get().fee : 0),
    }),
    {
      name: 'mie-bara-cart',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({ tableNumber: s.tableNumber, lines: s.lines, fee: s.fee }),
    }
  )
)
