import { Link } from 'react-router-dom'

// Pelanggan tidak punya akun (pesan lewat QR meja), jadi profil hanya berisi tautan.
// Pilihan bahasa dan login pelanggan sengaja tidak ada: di luar scope proposal.
const LINKS = [
  { icon: '📄', label: 'Riwayat Pesanan', to: '/history' },
  { icon: '🛡️', label: 'Kebijakan Privasi', to: '/privacy' },
]

export default function ProfilePage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col">
      <header className="flex items-center gap-3 border-b border-bara-line px-4 py-4">
        <Link to="/order" aria-label="Kembali" className="text-xl">←</Link>
        <h1 className="flex-1 text-center text-base font-bold">Profil</h1>
        <span className="w-5" />
      </header>

      <div className="px-4 pt-6">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-bara-panel text-2xl">👤</div>
          <div>
            <p className="font-bold">Tamu</p>
            <p className="text-xs text-white/60">Pesan tanpa akun lewat QR meja.</p>
          </div>
        </div>

        <nav className="mt-6 space-y-3" data-testid="profile-links">
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center justify-between rounded-xl border border-bara-line bg-bara-panel px-4 py-3"
            >
              <span className="flex items-center gap-3">
                <span>{link.icon}</span>
                <span className="text-sm font-medium">{link.label}</span>
              </span>
              <span className="text-white/40">›</span>
            </Link>
          ))}
        </nav>
      </div>

      <p className="mt-auto py-6 text-center text-xs text-white/40">Warkop Mie Bara</p>
    </div>
  )
}
