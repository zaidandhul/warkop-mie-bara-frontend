import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { errorMessage } from '../api/orders.js'
import { rupiah } from '../data/menu.js'
import { getSalesReport, isUnauthorized } from './api.js'
import { PAID_METHOD_LABELS, formatDateTimeWib, shiftDate, todayWib } from './constants.js'
import { downloadSalesReport } from './reportExport.js'

const STATUS_LABELS = { menunggu: 'Menunggu', diproses: 'Diproses', siap: 'Siap', selesai: 'Selesai', dibatalkan: 'Dibatalkan' }
const pad = (hour) => String(hour).padStart(2, '0')

function Stat({ label, value, testId, tone = 'text-white' }) {
  return (
    <div className="rounded-xl border border-bara-line bg-bara-panel px-4 py-3">
      <p className="text-xs text-white/60">{label}</p>
      <p data-testid={testId} className={`mt-1 text-xl font-bold ${tone}`}>{value}</p>
    </div>
  )
}

function Table({ title, head, rows, testId, empty = 'Belum ada data.' }) {
  return (
    <section className="rounded-xl border border-bara-line bg-bara-panel p-3">
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-bara-cyan">{title}</h2>
      {rows.length === 0 ? <p className="py-3 text-sm text-white/40">{empty}</p> : (
        <div className="max-h-80 overflow-auto">
          <table data-testid={testId} className="w-full text-sm">
            <thead className="sticky top-0 bg-bara-panel text-left text-white/50">
              <tr>{head.map((label, index) => <th key={label} className={`py-1 pr-3 font-medium ${index ? 'text-right' : ''}`}>{label}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-bara-line">
              {rows.map((cells, rowIndex) => (
                <tr key={rowIndex}>{cells.map((cell, index) => <td key={index} className={`py-1.5 pr-3 ${index ? 'text-right' : ''}`}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default function AdminReportsPage() {
  const { onSessionExpired } = useOutletContext()
  const today = todayWib()
  const [range, setRange] = useState({ from: today, to: today })
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setReport(await getSalesReport(range.from, range.to))
    } catch (loadError) {
      if (isUnauthorized(loadError)) return onSessionExpired()
      setError(errorMessage(loadError, 'Laporan gagal dimuat.'))
    } finally {
      setLoading(false)
    }
  }, [range, onSessionExpired])

  useEffect(() => { load() }, [load])

  const exportExcel = async () => {
    setExporting(true)
    try {
      await downloadSalesReport(report)
    } catch {
      setError('File Excel gagal dibuat. Coba lagi.')
    } finally {
      setExporting(false)
    }
  }

  const presets = [
    { label: 'Hari ini', from: today, to: today },
    { label: 'Kemarin', from: shiftDate(today, -1), to: shiftDate(today, -1) },
    { label: '7 hari', from: shiftDate(today, -6), to: today },
    { label: 'Bulan ini', from: `${today.slice(0, 8)}01`, to: today },
  ]
  const summary = report?.summary

  return (
    <div className="h-full overflow-y-auto px-5 py-4">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-white/70">
            Dari{' '}
            <input data-testid="report-from" type="date" value={range.from} max={range.to}
              onChange={(e) => e.target.value && setRange((current) => ({ ...current, from: e.target.value }))}
              className="rounded-lg border border-bara-line bg-bara-panel px-3 py-2 text-white [color-scheme:dark]" />
          </label>
          <label className="text-sm text-white/70">
            sampai{' '}
            <input data-testid="report-to" type="date" value={range.to} min={range.from} max={today}
              onChange={(e) => e.target.value && setRange((current) => ({ ...current, to: e.target.value }))}
              className="rounded-lg border border-bara-line bg-bara-panel px-3 py-2 text-white [color-scheme:dark]" />
          </label>
          {presets.map((preset) => {
            const active = preset.from === range.from && preset.to === range.to
            return (
              <button key={preset.label} onClick={() => setRange({ from: preset.from, to: preset.to })} aria-pressed={active}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold ${active ? 'border-bara-cyan bg-bara-cyan text-black' : 'border-bara-line text-white/70'}`}>
                {preset.label}
              </button>
            )
          })}
          <button data-testid="report-export" onClick={exportExcel} disabled={!report || loading || exporting}
            className="ml-auto min-h-11 rounded-lg bg-emerald-500 px-5 font-bold text-black disabled:opacity-50">
            {exporting ? 'Membuat file…' : 'Ekspor Excel'}
          </button>
        </div>

        {error && <p role="alert" className="mt-3 rounded-lg border border-bara-chili/50 bg-bara-chili/10 px-3 py-2 text-sm text-bara-chili">{error}</p>}
        {loading && !report && <p className="mt-6 text-white/60">Memuat laporan…</p>}

        {summary && (
          <div className={loading ? 'opacity-60' : ''}>
            <p className="mt-3 text-xs text-white/50">Omzet = total pesanan yang tidak dibatalkan (lunas maupun belum). Semua waktu dalam WIB.</p>
            <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="Omzet" value={rupiah(summary.revenue)} testId="report-revenue" tone="text-bara-cyan" />
              <Stat label="Pesanan" value={summary.orders} testId="report-orders" />
              <Stat label="Rata-rata per pesanan" value={rupiah(summary.averageOrder)} />
              <Stat label="Item terjual" value={summary.itemsSold} />
              <Stat label="Sudah lunas" value={rupiah(summary.paidRevenue)} testId="report-paid" tone="text-emerald-300" />
              <Stat label="Tunai · QRIS" value={`${rupiah(summary.byPaidMethod.tunai)} · ${rupiah(summary.byPaidMethod.qris_manual)}`} />
              <Stat label="Belum bayar" value={rupiah(summary.unpaidRevenue)} testId="report-unpaid" tone="text-amber-300" />
              <Stat label="Dibatalkan" value={summary.cancelledOrders} />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
              <Table title="Menu terlaris" testId="report-top-items" head={['Menu', 'Terjual', 'Omzet']}
                rows={report.topItems.slice(0, 15).map((item) => [item.name, item.qty, rupiah(item.revenue)])} />
              <Table title="Per meja" testId="report-by-table" head={['Meja', 'Pesanan', 'Omzet']}
                rows={report.byTable.map((row) => [`Meja ${row.table}`, row.orders, rupiah(row.revenue)])} />
              <Table title={report.from === report.to ? 'Per jam' : 'Per hari'}
                head={[report.from === report.to ? 'Jam' : 'Tanggal', 'Pesanan', 'Omzet']}
                rows={report.from === report.to
                  ? report.byHour.map((row) => [`${pad(row.hour)}:00–${pad(row.hour)}:59`, row.orders, rupiah(row.revenue)])
                  : report.byDay.map((row) => [row.date, row.orders, rupiah(row.revenue)])} />
            </div>

            <div className="mt-3">
              <Table title={`Daftar pesanan (${report.orders.length})`} testId="report-orders-table"
                head={['Waktu', 'Meja', 'Nama', 'Status', 'Pembayaran', 'Total']}
                rows={report.orders.map((order) => [
                  `${formatDateTimeWib(order.createdAt)} · ${order.id}`,
                  order.tableNumber,
                  order.customerName,
                  STATUS_LABELS[order.status] ?? order.status,
                  order.paidAt ? `Lunas · ${PAID_METHOD_LABELS[order.paidMethod] ?? order.paidMethod}` : 'Belum bayar',
                  rupiah(order.total),
                ])} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
