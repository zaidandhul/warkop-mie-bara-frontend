import { useState } from 'react'
import { rupiah } from '../data/menu.js'
import { ACTIONS, PAYMENT_LABELS, formatTimeWib } from './constants.js'

function minutesAgo(createdAt, now) {
  const minutes = Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 60000))
  if (minutes < 1) return 'baru saja'
  if (minutes < 60) return `${minutes} mnt lalu`
  return `${Math.floor(minutes / 60)} jam ${minutes % 60} mnt lalu`
}

function ItemLine({ item }) {
  const details = [
    item.options?.level && `Level ${item.options.level}`,
    item.options?.variant,
    ...(item.toppingDetails ?? []).map((topping) => `+ ${topping.name}`),
  ].filter(Boolean)
  return (
    <li className="py-1.5">
      <p className="font-semibold leading-snug">
        <span className="mr-1.5 inline-block min-w-7 rounded bg-white/10 px-1.5 text-center">{item.qty}×</span>
        {item.name}
      </p>
      {details.length > 0 && <p className="ml-9 text-sm text-white/70">{details.join(' · ')}</p>}
      {item.options?.note && (
        <p className="ml-9 mt-0.5 rounded bg-amber-400/15 px-2 py-0.5 text-sm text-amber-200">📝 {item.options.note}</p>
      )}
    </li>
  )
}

export default function OrderCard({ order, now, isNew, busy, onChangeStatus }) {
  const [confirmCancel, setConfirmCancel] = useState(false)
  const actions = ACTIONS[order.status] ?? []
  const primary = actions.find((action) => !action.danger)
  const cancel = actions.find((action) => action.danger)

  return (
    <article
      className={`rounded-xl border bg-bara-panel p-3 ${isNew ? 'border-amber-400 ring-2 ring-amber-400/60' : 'border-bara-line'}`}
    >
      <header className="flex items-start justify-between gap-2">
        <div>
          <p className="text-2xl font-extrabold leading-none">
            Meja {order.tableNumber}
            {isNew && <span className="ml-2 animate-pulse rounded bg-amber-400 px-1.5 py-0.5 align-middle text-xs font-bold text-black">BARU</span>}
          </p>
          <p className="mt-1 font-medium">{order.customerName}</p>
          {order.customerPhone && <p className="text-xs text-white/50">{order.customerPhone}</p>}
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">{formatTimeWib(order.createdAt)}</p>
          <p className="text-xs text-white/60">{minutesAgo(order.createdAt, now)}</p>
        </div>
      </header>

      <ul className="mt-2 divide-y divide-bara-line border-y border-bara-line">
        {order.items.map((item, index) => <ItemLine key={`${item.itemId}-${index}`} item={item} />)}
      </ul>

      <div className="mt-2 flex items-center justify-between text-sm">
        <span className="rounded-full border border-bara-line px-2 py-0.5 text-white/70">
          {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
        </span>
        <span className="text-base font-bold">{rupiah(order.total)}</span>
      </div>
      <p className="mt-1 text-xs text-white/40">{order.id}</p>

      {(primary || cancel) && (
        <div className="mt-3 flex gap-2">
          {confirmCancel ? (
            <>
              <button
                disabled={busy}
                onClick={() => onChangeStatus(order, cancel.to)}
                className="min-h-12 flex-1 rounded-lg bg-bara-chili font-bold disabled:opacity-50"
              >
                Ya, batalkan
              </button>
              <button
                disabled={busy}
                onClick={() => setConfirmCancel(false)}
                className="min-h-12 flex-1 rounded-lg border border-bara-line font-semibold"
              >
                Tidak
              </button>
            </>
          ) : (
            <>
              {primary && (
                <button
                  disabled={busy}
                  onClick={() => onChangeStatus(order, primary.to)}
                  className="min-h-12 flex-1 rounded-lg bg-bara-cyan text-lg font-bold text-black disabled:opacity-50"
                >
                  {busy ? 'Menyimpan…' : primary.label}
                </button>
              )}
              {cancel && (
                <button
                  disabled={busy}
                  onClick={() => setConfirmCancel(true)}
                  className="min-h-12 rounded-lg border border-bara-chili/60 px-4 font-semibold text-bara-chili disabled:opacity-50"
                >
                  {cancel.label}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </article>
  )
}
