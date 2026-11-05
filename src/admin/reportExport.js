import { PAID_METHOD_LABELS, STATUS_LABELS, formatDateTimeWib } from './constants.js'

const SOURCE_LABELS = { pelanggan: 'QR pelanggan', kasir: 'Kasir' }
const RUPIAH = '#,##0'

const header = (labels) => labels.map((value) => ({ value, fontWeight: 'bold', backgroundColor: '#DDEBF7' }))
const money = (value) => ({ value, type: Number, format: RUPIAH })
const sheet = (name, rows, widths) => ({ sheet: name, data: rows, columns: widths.map((width) => ({ width })), stickyRowsCount: 1 })

// Laporan dari GET /api/admin/reports/sales -> file .xlsx (beberapa sheet) yang langsung diunduh.
export async function downloadSalesReport(report) {
  const { default: writeExcelFile } = await import('write-excel-file/browser')
  const { summary } = report
  const period = report.from === report.to ? report.from : `${report.from} s/d ${report.to}`

  const summaryRows = [
    header(['Laporan Penjualan Warkop Mie Bara', '']),
    ['Periode (WIB)', period],
    ['Jumlah pesanan (tanpa dibatalkan)', { value: summary.orders, type: Number }],
    ['Omzet', money(summary.revenue)],
    ['Sudah lunas', money(summary.paidRevenue)],
    ['  Tunai', money(summary.byPaidMethod.tunai)],
    ['  QRIS', money(summary.byPaidMethod.qris_manual)],
    ['Belum bayar', money(summary.unpaidRevenue)],
    ['Rata-rata per pesanan', money(summary.averageOrder)],
    ['Item terjual', { value: summary.itemsSold, type: Number }],
    ['Pesanan dibatalkan', { value: summary.cancelledOrders, type: Number }],
  ]

  const orderRows = [
    header(['Waktu (WIB)', 'Kode', 'Meja', 'Nama', 'Asal', 'Status', 'Pembayaran', 'Item', 'Subtotal', 'Biaya lain', 'Total']),
    ...report.orders.map((order) => [
      formatDateTimeWib(order.createdAt),
      order.id,
      { value: String(order.tableNumber), format: '@' },
      order.customerName,
      SOURCE_LABELS[order.source] ?? order.source,
      STATUS_LABELS[order.status] ?? order.status,
      order.paidAt ? `Lunas · ${PAID_METHOD_LABELS[order.paidMethod] ?? order.paidMethod}` : 'Belum bayar',
      order.items.map((item) => `${item.qty}× ${item.name}`).join(', '),
      money(order.subtotal),
      money(order.fee),
      money(order.total),
    ]),
  ]

  const groupRows = (label, rows, keyOf) => [
    header([label, 'Pesanan', 'Omzet']),
    ...rows.map((row) => [keyOf(row), { value: row.orders, type: Number }, money(row.revenue)]),
  ]

  await writeExcelFile([
    sheet('Ringkasan', summaryRows, [36, 22]),
    sheet('Pesanan', orderRows, [18, 26, 7, 22, 14, 12, 16, 50, 12, 11, 12]),
    sheet('Per Meja', groupRows('Meja', report.byTable, (row) => `Meja ${row.table}`), [12, 10, 14]),
    sheet('Per Jam', groupRows('Jam (WIB)', report.byHour, (row) => `${String(row.hour).padStart(2, '0')}:00–${String(row.hour).padStart(2, '0')}:59`), [16, 10, 14]),
    sheet('Per Hari', groupRows('Tanggal', report.byDay, (row) => row.date), [14, 10, 14]),
    sheet('Menu Terlaris', [
      header(['Menu', 'Terjual', 'Omzet']),
      ...report.topItems.map((item) => [item.name, { value: item.qty, type: Number }, money(item.revenue)]),
    ], [32, 10, 14]),
  ]).toFile(`laporan-penjualan_${report.from}_${report.to}.xlsx`)
}
