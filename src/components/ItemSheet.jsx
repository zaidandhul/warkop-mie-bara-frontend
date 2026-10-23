import { useState } from 'react'
import { createPortal } from 'react-dom'
import { LEVEL_PRICE_STEP, TOPPINGS, priceFor, rupiah } from '../data/menu.js'

const chip = (on) =>
  `rounded-lg border px-3 py-1.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-bara-cyan ${
    on ? 'border-bara-cyan bg-bara-cyan text-black' : 'border-bara-line text-white'
  }`

export default function ItemSheet({ item, initial = {}, onClose, onSave, toppingsCatalog = TOPPINGS, levelPriceStep = LEVEL_PRICE_STEP, noteOnly = false, saveLabel = 'Simpan', useScreenPortal = false }) {
  const [level, setLevel] = useState(initial.level ?? (item.levels ? item.levels[0] : undefined))
  const [toppings, setToppings] = useState(initial.toppings ?? [])
  const [variant, setVariant] = useState(initial.variant ?? item.options?.[0])
  const [note, setNote] = useState(initial.note ?? '')
  const opts = noteOnly
    ? { note: note.trim() }
    : { level, toppings, variant, note: note.trim() }
  const toggle = (id) => setToppings((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]))

  const sheet = (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={item.name}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-2xl border-t border-bara-line bg-bara-panel p-4"
      >
        <h3 className="text-lg font-bold">{item.name}</h3>
        {item.desc && <p className="mt-1 text-xs text-white/60">{item.desc}</p>}

        {!noteOnly && item.levels?.length > 0 && (
          <fieldset className="mt-4" data-testid="level-options">
            <legend className="mb-2 text-sm font-semibold text-bara-cyan">Pilih level pedas</legend>
            <div className="flex gap-2">
              {item.levels.map((l) => (
                <button key={l} type="button" onClick={() => setLevel(l)} aria-pressed={level === l} className={chip(level === l)}>
                  Level {l}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {!noteOnly && item.options?.length > 0 && (
          <fieldset className="mt-4">
            <legend className="mb-2 text-sm font-semibold text-bara-cyan">Pilihan</legend>
            <div className="flex gap-2">
              {item.options.map((o) => (
                <button key={o} type="button" onClick={() => setVariant(o)} aria-pressed={variant === o} className={chip(variant === o)}>
                  {o}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {!noteOnly && item.toppings?.length > 0 && (
          <fieldset className="mt-4" data-testid="topping-options">
            <legend className="mb-2 text-sm font-semibold text-bara-cyan">Tambahan topping</legend>
            <div className="flex flex-wrap gap-2">
              {toppingsCatalog.filter((t) => item.toppings.includes(t.id)).map((t) => (
                <button key={t.id} type="button" onClick={() => toggle(t.id)} aria-pressed={toppings.includes(t.id)} className={chip(toppings.includes(t.id))}>
                  {t.name} +{rupiah(t.price)}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <label className="mt-4 block text-sm font-semibold text-bara-cyan" htmlFor="note">Catatan</label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Contoh: tanpa sayur"
          className="mt-1 w-full rounded-lg border border-bara-line bg-bara-black px-3 py-2 text-sm outline-none focus:border-bara-cyan"
        />

        <button
          data-testid="item-save"
          onClick={() => onSave(opts, priceFor(item, opts, toppingsCatalog, levelPriceStep))}
          className="mt-4 flex w-full items-center justify-between rounded-xl bg-bara-cyan px-4 py-3 font-bold text-black"
        >
          <span>{saveLabel}</span>
          <span>{rupiah(priceFor(item, opts, toppingsCatalog, levelPriceStep))}</span>
        </button>
      </div>
    </div>
  )

  return useScreenPortal ? createPortal(sheet, document.body) : sheet
}
