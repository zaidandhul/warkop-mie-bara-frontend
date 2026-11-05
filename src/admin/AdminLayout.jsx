import { useCallback, useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { getMe, logout } from './api.js'
import { isSoundReady, unlockSound } from './sound.js'

const navClass = ({ isActive }) =>
  `rounded-lg px-4 py-2.5 text-sm font-semibold ${isActive ? 'bg-bara-cyan text-black' : 'text-white/70 hover:bg-white/10'}`

export default function AdminLayout() {
  const navigate = useNavigate()
  const [staff, setStaff] = useState(null)
  const [soundReady, setSoundReady] = useState(isSoundReady)

  useEffect(() => {
    getMe()
      .then(setStaff)
      .catch(() => navigate('/admin/login', { replace: true }))
    // Suara yang dibuka saat klik login baru "running" setelah resume() selesai.
    const timer = setTimeout(() => setSoundReady(isSoundReady()), 300)
    return () => clearTimeout(timer)
  }, [navigate])

  // Dipanggil halaman anak saat API membalas 401 (sesi habis atau akun dinonaktifkan).
  const onSessionExpired = useCallback(() => navigate('/admin/login', { replace: true }), [navigate])

  const enableSound = () => {
    unlockSound()
    // resume() bersifat async; cek ulang sebentar kemudian.
    setTimeout(() => setSoundReady(isSoundReady()), 200)
  }

  const handleLogout = async () => {
    try { await logout() } catch { /* Cookie tetap kedaluwarsa sendiri. */ }
    navigate('/admin/login', { replace: true })
  }

  if (!staff) {
    return <div className="flex min-h-screen items-center justify-center text-white/60">Memeriksa sesi…</div>
  }

  return (
    <div className="flex h-screen flex-col print:h-auto print:bg-white">
      <header className="flex shrink-0 items-center gap-4 border-b border-bara-line bg-bara-panel px-5 py-3 print:hidden">
        <p className="text-lg font-bold">Mie Bara <span className="font-normal text-white/50">· Staf</span></p>
        <nav className="flex gap-2">
          <NavLink to="/admin" end className={navClass}>Pesanan</NavLink>
          <NavLink to="/admin/pesanan-baru" className={navClass}>Input Pesanan</NavLink>
          <NavLink to="/admin/menu" className={navClass}>Menu</NavLink>
          <NavLink to="/admin/laporan" className={navClass}>Laporan</NavLink>
          <NavLink to="/admin/qr" className={navClass}>QR Meja</NavLink>
          {staff.isAdmin && <NavLink to="/admin/staf" className={navClass}>Staf</NavLink>}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          {soundReady ? (
            <span className="text-sm text-emerald-300" data-testid="sound-status">🔔 Suara aktif</span>
          ) : (
            <button onClick={enableSound} className="rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-black">
              🔕 Aktifkan suara
            </button>
          )}
          <NavLink to="/admin/akun" title="Akun saya: ganti password" className="text-sm text-white/70 hover:text-white" data-testid="staff-label">
            {staff.username} · <span className="font-semibold text-white">{staff.isAdmin ? 'Admin' : 'Staf'}</span>
          </NavLink>
          <button data-testid="logout" onClick={handleLogout} className="rounded-lg border border-bara-line px-4 py-2.5 text-sm hover:bg-white/10">
            Keluar
          </button>
        </div>
      </header>
      <main className="min-h-0 flex-1 print:min-h-fit">
        <Outlet context={{ staff, onSessionExpired }} />
      </main>
    </div>
  )
}
