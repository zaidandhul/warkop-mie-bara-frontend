# Warkop Mie Bara — Frontend

    npm install
    npm run dev

Salin `.env.example` ke `.env`. `VITE_API_URL=/api` diteruskan oleh Vite ke backend
(`http://localhost:3000`, bisa diganti lewat `VITE_PROXY_TARGET`). Dev server juga bisa dibuka dari
perangkat lain di jaringan yang sama lewat `http://<IP-laptop>:5173`.

## Pelanggan

Buka `/?tableNumber=5` untuk mensimulasikan QR meja 5. Pelanggan tidak perlu login.

## Dashboard staf

- `/admin/login`: login staf. Akun dibuat dari backend dengan `npm run staff:create`.
- `/admin`: kanban pesanan hari ini (Menunggu → Diproses → Siap → Selesai, bisa dibatalkan
  saat Menunggu/Diproses). Diperbarui otomatis tiap 10 detik dan berbunyi saat ada pesanan baru.
  Tekan "Aktifkan suara" sekali setelah halaman dibuka ulang.
- `/admin/menu`: tandai menu tersedia/habis dan ubah harga.

Hanya ada satu jenis akun staf (Admin) yang bisa melakukan semua hal di atas.
Tampilan dioptimalkan untuk tablet landscape.
