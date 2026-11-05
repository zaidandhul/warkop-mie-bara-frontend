# Test End-to-End (Selenium + Mocha)

Test ini menjalankan aplikasi sungguhan di Chrome: alur pelanggan, login admin, dashboard pesanan,
kelola menu, keamanan API, status pembayaran, QR meja, pesanan kasir, dan laporan + ekspor Excel
(spec A–I). Semua test berjalan terhadap database terpisah
**`kopi_miebara_test`**, tidak pernah terhadap `kopi_miebara`.

## Prasyarat

- Node.js 22 atau lebih baru dan Google Chrome. Selenium Manager mengunduh chromedriver yang cocok
  secara otomatis saat pertama kali dijalankan (butuh internet sekali).
- MySQL/MariaDB berjalan (kredensial diambil dari `backend/.env`).
- `npm install` di `backend/` dan `frontend/`.

## 1. Siapkan database uji (sekali, atau kapan pun ingin mulai bersih)

Di folder `backend/`:

```
copy .env.test.example .env.test        (macOS/Linux: cp)
npm run db:test:setup
```

`db:test:setup` menghapus lalu membuat ulang `kopi_miebara_test`. Langkahnya:

- Menjalankan `src/database/schema.sql`. File ini sudah memuat hasil migrasi 001–006, jadi file
  migrasi tidak dijalankan lagi.
- Mengisi menu dari `src/data/menu.json`.
- Mengosongkan opsi kategori minuman dan camilan, sama seperti di database utama.
- Memeriksa strukturnya.

Skrip ini **menolak jalan** jika nama database tidak berakhiran `_test`.

`.env.test` juga harus berisi `ORDER_RATE_LIMIT=0` (lihat `.env.test.example`). Test membuat banyak
pesanan dari satu IP, dan batas default 30 per 10 menit akan membuatnya gagal.

## 2. Buat akun admin uji

Masih di `backend/`:

```
npm run staff:create:test
```

Masukkan username dan password. Lalu di `frontend/`, salin `e2e/.env.e2e.example` ke `e2e/.env.e2e`
dan isi:

| Variabel | Isi |
|---|---|
| `E2E_ADMIN_USER` / `E2E_ADMIN_PASS` | akun yang baru dibuat |
| `E2E_BASE_URL` | `http://localhost:5174` (frontend uji) |
| `E2E_API_URL` | `http://localhost:3001/api` (backend uji) |
| `E2E_HEADLESS` | `true` agar Chrome berjalan tanpa jendela |

`e2e/.env.e2e` tidak ikut di-commit.

## 3. Jalankan

Tiga terminal:

```
backend/   npm run dev:test     # API di :3001 dengan database kopi_miebara_test (.env.test)
frontend/  npm run dev:e2e      # Vite di :5174, /api diteruskan ke :3001 (.env.test)
frontend/  npm run test:e2e
```

Sebelum test dimulai, `GET /api/health` harus melaporkan `testMode: true`, yang hanya terjadi jika
database backend berakhiran `_test`. Jika tidak, seluruh test dibatalkan.

## Catatan

- Saat test gagal, screenshot setiap browser yang terbuka disimpan di `e2e/screenshots/`
  (tidak ikut di-commit).
- Test bisa dijalankan berulang:
  - Data yang diubah (status Milo, harga Vanilla Latte) dikembalikan di hook `after`.
  - Pesanan uji memakai nama unik per run (`E2E … <runId>`) dan dibiarkan di database uji.
- Dashboard memuat ulang tiap 10 detik, jadi test menunggu kartu pesanan baru sampai 20 detik.
- Spec I mengunduh file Excel ke folder sementara (lewat Chrome DevTools) lalu memeriksa isinya.
- Saat sebuah halaman pertama kali memakai dependency baru, Vite bisa me-reload halaman di tengah test
  ("optimized dependencies changed"). Jalankan ulang test jika itu terjadi.
- Ganti nilai di `.env.e2e` lewat variabel lingkungan bila perlu, misalnya
  `E2E_HEADLESS=false npm run test:e2e` (Git Bash) untuk melihat browsernya.
- Elemen dipilih lewat atribut `data-testid` di komponen. Jangan hapus atribut itu saat mengubah UI.
