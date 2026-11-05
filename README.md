# Warkop Mie Bara — Frontend

Aplikasi web pemesanan lewat QR meja (pelanggan) dan dashboard staf untuk Warkop Mie Bara.
Backend dan dokumentasi lengkap (API, runbook, setup laptop baru) ada di repo
[warkop-mie-bara-backend](https://github.com/zaidandhul/warkop-mie-bara-backend), folder `docs/`.

Stack: React 18, Vite 8, Tailwind CSS v4, Zustand, axios, React Router 7. Node.js **>= 22**.

## Menjalankan

```bash
npm install
cp .env.example .env
npm run dev          # http://localhost:5173 (juga bisa dibuka dari perangkat lain di LAN)
```

`VITE_API_URL=/api` diteruskan Vite ke backend (`http://localhost:3000`, bisa diganti lewat `VITE_PROXY_TARGET`),
sehingga HP/tablet memakai satu alamat dan cookie login staf berfungsi tanpa CORS. Backend harus berjalan
(`npm run dev` di repo backend).

| Variabel `.env` | Fungsi |
|---|---|
| `VITE_API_URL` | Alamat API (default dan disarankan `/api`) |
| `VITE_PUBLIC_URL` | Opsional: alamat publik aplikasi pelanggan yang dicetak di QR meja |
| `VITE_PROXY_TARGET` | Opsional: tujuan proxy `/api` saat `npm run dev` |

## Script

| Script | Fungsi |
|---|---|
| `dev` / `build` / `preview` | Dev server, build produksi ke `dist/`, pratinjau build |
| `lint` | ESLint |
| `test` | Unit test (`node:test`, `test/unit`) |
| `dev:e2e` / `test:e2e` | Server uji dan test end-to-end Selenium (lihat [e2e/README.md](e2e/README.md)) |

## Pelanggan

- Buka `/?tableNumber=5` untuk mensimulasikan QR meja 5. Pelanggan tidak perlu login.
- Menu bisa dicari (nama/deskripsi), difilter per kategori, dan diurutkan (termurah, termahal, terlaris).
- Harga di keranjang disamakan dengan menu terbaru setiap kali menu dimuat. Pembayaran selalu di kasir (tunai atau QRIS).
- Setelah memesan, kode pesanan tersimpan di **Riwayat Pesanan** perangkat itu selama 24 jam. Status pesanan diperbarui otomatis sampai Selesai atau Dibatalkan.
- Maksimal 5 pesanan yang belum selesai per meja; pesanan berikutnya bisa lewat kasir.

## Dashboard staf

Login di `/admin/login`. Akun admin pertama dibuat dari backend dengan `npm run staff:create`; akun berikutnya
lewat halaman Staf. Tampilan dioptimalkan untuk tablet landscape.

| Halaman | Isi |
|---|---|
| `/admin` | Kanban pesanan hari ini (paling lama di atas). Status Menunggu → Diproses → Siap → Selesai; batal saat Menunggu/Diproses selama belum lunas. Tombol "Lunas · Tunai/QRIS" dan "Batalkan lunas". "Diubah oleh …" menunjukkan staf yang terakhir mengubah. Diperbarui tiap 10 detik dan berbunyi saat ada pesanan baru (tekan "Aktifkan suara" setelah membuka ulang halaman) |
| `/admin/pesanan-baru` | Kasir menginput pesanan pelanggan yang memesan langsung di kasir (bisa langsung lunas) |
| `/admin/menu` | Tandai menu tersedia/habis dan ubah harga |
| `/admin/laporan` | Laporan penjualan per rentang tanggal dan ekspor Excel (.xlsx) |
| `/admin/qr` | QR untuk setiap meja (jumlah mengikuti `TABLE_COUNT` di backend), siap dicetak |
| `/admin/staf` | Khusus admin: tambah staf, aktif/nonaktif, jadikan admin/staf, reset password |
| `/admin/akun` | Ganti password sendiri (klik nama di header) |

Peran: **Admin** bisa semua hal; **Staf** bisa semua hal kecuali mengelola akun staf.
