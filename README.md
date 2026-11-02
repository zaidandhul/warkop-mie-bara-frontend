# Warkop Mie Bara — Frontend

    npm install
    npm run dev

Salin `.env.example` ke `.env`. `VITE_API_URL=/api` diteruskan oleh Vite ke backend
(`http://localhost:3000`, bisa diganti lewat `VITE_PROXY_TARGET`). Dev server juga bisa dibuka dari
perangkat lain di jaringan yang sama lewat `http://<IP-laptop>:5173`.

## Pelanggan

Buka `/?tableNumber=5` untuk mensimulasikan QR meja 5. Pelanggan tidak perlu login.
Harga di keranjang disamakan dengan menu terbaru setiap kali menu dimuat. Pembayaran selalu di kasir.

## Dashboard staf

- `/admin/login`: login staf. Akun dibuat dari backend dengan `npm run staff:create`.
- `/admin`: kanban pesanan hari ini.
  - Alur status Menunggu → Diproses → Siap → Selesai; pesanan bisa dibatalkan saat Menunggu/Diproses,
    selama belum lunas.
  - Diperbarui otomatis tiap 10 detik dan berbunyi saat ada pesanan baru. Tekan "Aktifkan suara"
    sekali setelah halaman dibuka ulang.
  - Tombol "Lunas · Tunai" / "Lunas · QRIS" mencatat pembayaran di kasir; salah pencet bisa
    dibatalkan lewat "Batalkan lunas".
- `/admin/pesanan-baru`: kasir menginput pesanan pelanggan yang memesan langsung di kasir (bisa
  langsung ditandai lunas).
- `/admin/menu`: tandai menu tersedia/habis dan ubah harga.
- `/admin/laporan`: laporan penjualan per rentang tanggal: omzet, lunas/belum, menu terlaris, per meja,
  per jam/hari, dan daftar pesanan. Bisa diekspor ke Excel (.xlsx).
- `/admin/qr`: QR untuk setiap meja (jumlahnya mengikuti `TABLE_COUNT` di backend), siap dicetak.
  Isi alamat yang bisa dibuka dari HP pelanggan (default `VITE_PUBLIC_URL` atau alamat yang sedang dibuka).

Hanya ada satu jenis akun staf (Admin) yang bisa melakukan semua hal di atas.
Tampilan dioptimalkan untuk tablet landscape.
