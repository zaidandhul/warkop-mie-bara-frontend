// Pemberitahuan hasil syncWithMenu() di cartStore: harga berubah atau item dikeluarkan dari keranjang.

// Gabungkan hasil sinkron berikutnya ke yang sudah tampil, supaya sinkron ulang tanpa perubahan
// tidak menghapus pemberitahuan sebelumnya. Pakai: setChanges((prev) => mergeCartChanges(prev, next)).
export function mergeCartChanges(previous, next) {
  if (!previous) return next
  const unique = (a, b) => [...new Set([...a, ...b])]
  return { removed: unique(previous.removed, next.removed), repriced: unique(previous.repriced, next.repriced) }
}

export default function CartSyncNotice({ changes }) {
  if (!changes || (!changes.removed.length && !changes.repriced.length)) return null
  return (
    <div role="status" data-testid="cart-sync-notice" className="rounded-lg border border-amber-400/50 bg-amber-400/10 px-3 py-2 text-sm text-amber-200">
      {changes.repriced.length > 0 && <p>Harga diperbarui sesuai menu terbaru: {changes.repriced.join(', ')}.</p>}
      {changes.removed.length > 0 && <p>Dikeluarkan dari keranjang karena habis atau pilihannya berubah: {changes.removed.join(', ')}.</p>}
    </div>
  )
}
