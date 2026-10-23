import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { errorMessage } from '../api/orders.js'
import { getMe, login } from './api.js'
import { unlockSound } from './sound.js'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Sudah login: langsung ke dashboard.
  useEffect(() => {
    getMe().then(() => navigate('/admin', { replace: true })).catch(() => {})
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    unlockSound() // Klik login dihitung sebagai interaksi, jadi suara notifikasi langsung aktif.
    setSubmitting(true)
    setError('')
    try {
      await login(username.trim(), password)
      navigate('/admin', { replace: true })
    } catch (loginError) {
      setError(errorMessage(loginError, 'Login gagal. Coba lagi.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl border border-bara-line bg-bara-panel p-6">
        <h1 className="text-xl font-bold">Masuk Staf</h1>
        <p className="mt-1 text-sm text-white/60">Dashboard pesanan Warkop Mie Bara</p>

        <label className="mt-6 block text-sm">
          Username
          <input
            required
            autoFocus
            autoComplete="username"
            autoCapitalize="none"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 w-full rounded-lg border border-bara-line bg-bara-black px-3 py-3 outline-none focus:border-bara-cyan"
          />
        </label>
        <label className="mt-4 block text-sm">
          Password
          <input
            required
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-bara-line bg-bara-black px-3 py-3 outline-none focus:border-bara-cyan"
          />
        </label>

        {error && <p role="alert" className="mt-4 rounded-lg border border-bara-chili/50 bg-bara-chili/10 px-3 py-2 text-sm text-bara-chili">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-xl bg-bara-cyan py-3 font-bold text-black disabled:opacity-50"
        >
          {submitting ? 'Memeriksa…' : 'Masuk'}
        </button>
      </form>
    </div>
  )
}
