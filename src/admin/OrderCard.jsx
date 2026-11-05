import { useState } from 'react'
import { rupiah } from '../utils/price.js'
import { ACTIONS, PAID_METHOD_LABELS, PAID_METHODS, STATUS_LABELS, formatTimeWib } from './constants.js'

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

function historyLabel(entry) {
  if (entry.action === 'order_status') return STATUS_LABELS[entry.newValue] ?? entry.newValue
  return entry.newValue ? `Lunas · ${PAID_METHOD_LABELS[entry.newValue] ?? entry.newValue}` : 'Batal lunas'
}

// "Diubah oleh" (perubahan terakhir) dan riwayat lengkap: siapa mengubah status/pembayaran dan kapan.
function OrderHistory({ order }) {
  const entries = [
    ...(order.createdBy ? [{ label: 'Dibuat di kasir', staff: order.createdBy, at: order.createdAt }] : []),
    ...(order.history ?? []).map((entry) => ({ label: historyLabel(entry), staff: entry.staff, at: entry.at })),
  ]
  if (!entries.length) return null
  const last = entries[entries.length - 1]
  return (
    <details className="mt-1 text-xs text-white/50">
      <summary data-testid="order-changed-by" className="cursor-pointer">
        Diubah oleh {last.staff ?? 'staf terhapus'} · {formatTimeWib(last.at)} ({last.label})
      </summary>
      <ol data-testid="order-history" className="mt-1 space-y-0.5 pl-3">
        {entries.map((entry, index) => (
          <li key={index}>{formatTimeWib(entry.at)} · {entry.label} · {entry.staff ?? 'staf terhapus'}</li>
        ))}
      </ol>
    </details>
  )
}

function PaymentActions({ order, busy, onChangePayment }) {
  const [confirmUnpay, setConfirmUnpay] = useState(false)
  if (order.paidAt) {
    return confirmUnpay ? (
      <div className="mt-2 flex items-center gap-2 text-sm">
        <span className="flex-1 text-white/70">Batalkan tanda lunas?</span>
        <button data-testid="confirm-unpay" disabled={busy} onClick={() => onChangePayment(order, null)} className="min-h-10 rounded-lg bg-bara-chili px-3 font-semibold disabled:opacity-50">Ya</button>
        <button disabled={busy} onClick={() => setConfirmUnpay(false)} className="min-h-10 rounded-lg border border-bara-line px-3">Tidak</button>
      </div>
    ) : (
      <button data-testid="unpay" disabled={busy} onClick={() => setConfirmUnpay(true)} className="mt-2 text-xs text-white/40 underline disabled:opacity-50">
        Batalkan lunas
      </button>
    )
  }
  if (order.status === 'dibatalkan') return null
  return (
    <div className="mt-2 flex gap-2">
      {PAID_METHODS.map(({ method, label }) => (
        <button
          key={method}
          data-testid={`pay-${method}`}
          disabled={busy}
          onClick={() => onChangePayment(order, method)}
          className="min-h-12 flex-1 rounded-lg border border-emerald-400/70 font-semibold text-emerald-300 disabled:opacity-50"
        >
          Lunas · {label}
        </button>
      ))}
    </div>
  )
}

export default function OrderCard({ order, now, isNew, busy, onChangeStatus, onChangePayment }) {
  const [confirmCancel, setConfirmCancel] = useState(false)
  const actions = ACTIONS[order.status] ?? []
  const primary = actions.find((action) => !action.danger)
  // Pesanan yang sudah lunas tidak bisa dibatalkan (backend juga menolak).
  const cancel = order.paidAt ? null : actions.find((action) => action.danger)

  return (
    <article
      data-testid="order-card"
      data-order-id={order.id}
      className={`rounded-xl border bg-bara-panel p-3 ${isNew ? 'border-amber-400 ring-2 ring-amber-400/60' : 'border-bara-line'}`}
    >
      <header className="flex items-start justify-between gap-2">
        <div>
          <p className="text-2xl font-extrabold leading-none">
            Meja {order.tableNumber}
            {isNew && <span data-testid="badge-new" className="ml-2 animate-pulse rounded bg-amber-400 px-1.5 py-0.5 align-middle text-xs font-bold text-black">BARU</span>}
          </p>
          <p className="mt-1 font-medium">
            {order.customerName}
            {order.source === 'kasir' && <span data-testid="badge-kasir" className="ml-2 rounded bg-white/10 px-1.5 py-0.5 align-middle text-xs text-white/70">Kasir</span>}
          </p>
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
        <span
          data-testid="payment-status"
          className={`rounded-full border px-2 py-0.5 ${order.paidAt ? 'border-emerald-400/60 text-emerald-300' : 'border-amber-400/60 text-amber-300'}`}
        >
          {order.paidAt
            ? `✓ Lunas · ${PAID_METHOD_LABELS[order.paidMethod] ?? order.paidMethod} · ${formatTimeWib(order.paidAt)}`
            : 'Belum bayar'}
        </span>
        <span className="text-base font-bold">{rupiah(order.total)}</span>
      </div>
      <p className="mt-1 text-xs text-white/40">{order.id}</p>
      <OrderHistory order={order} />

      {(primary || cancel) && (
        <div className="mt-3 flex gap-2">
          {confirmCancel ? (
            <>
              <button
                data-testid="confirm-cancel"
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
                  data-testid={`action-${primary.to}`}
                  disabled={busy}
                  onClick={() => onChangeStatus(order, primary.to)}
                  className="min-h-12 flex-1 rounded-lg bg-bara-cyan text-lg font-bold text-black disabled:opacity-50"
                >
                  {busy ? 'Menyimpan…' : primary.label}
                </button>
              )}
              {cancel && (
                <button
                  data-testid="action-dibatalkan"
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
      <PaymentActions order={order} busy={busy} onChangePayment={onChangePayment} />
    </article>
  )
}
