import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { errorMessage } from '../api/orders.js'
import { changeOwnPassword, isUnauthorized } from './api.js'

const input = 'mt-1 min-h-12 w-full rounded-lg border border-bara-line bg-bara-black px-3 outline-none focus:border-bara-cyan'

// Ganti password sendiri (semua staf). Sesi di perangkat lain berakhir; perangkat ini tetap login.
export default function AdminAccountPage() {
  const { staff, onSessionExpired } = useOutletContext()
  const [form, setForm] = useState({ current: '', next: '', repeat: '' })
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null) // { ok, text }
  const set = (key) => (e) => setForm((current) => ({ ...current, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (form.next !== form.repeat) return setMessage({ ok: false, text: 'Ulangi password baru dengan benar.' })
    setBusy(true)
    setMessage(null)
    try {
      await changeOwnPassword(form.current, form.next)
      setForm({ current: '', next: '', repeat: '' })
      setMessage({ ok: true, text: 'Password berhasil diganti. Sesi di perangkat lain sudah berakhir.' })
    } catch (error) {
      if (isUnauthorized(error)) return onSessionExpired()
      setMessage({ ok: false, text: errorMessage(error, 'Password gagal diganti.') })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto px-5 py-6">
      <form onSubmit={submit} className="mx-auto max-w-md rounded-2xl border border-bara-line bg-bara-panel p-6">
        <h1 className="text-xl font-bold">Akun saya</h1>
        <p className="mt-1 text-sm text-white/60">{staff.username} · {staff.isAdmin ? 'Admin' : 'Staf'}</p>
        <label className="mt-5 block text-sm">Password lama
          <input data-testid="account-current" type="password" autoComplete="current-password" required value={form.current} onChange={set('current')} className={input} />
        </label>
        <label className="mt-3 block text-sm">Password baru (minimal 8 karakter)
          <input data-testid="account-new" type="password" autoComplete="new-password" required minLength={8} value={form.next} onChange={set('next')} className={input} />
        </label>
        <label className="mt-3 block text-sm">Ulangi password baru
          <input data-testid="account-repeat" type="password" autoComplete="new-password" required minLength={8} value={form.repeat} onChange={set('repeat')} className={input} />
        </label>
        {message && (
          <p role={message.ok ? 'status' : 'alert'} data-testid="account-message"
            className={`mt-4 rounded-lg border px-3 py-2 text-sm ${message.ok ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-200' : 'border-bara-chili/50 bg-bara-chili/10 text-bara-chili'}`}>
            {message.text}
          </p>
        )}
        <button type="submit" data-testid="account-submit" disabled={busy} className="mt-5 min-h-12 w-full rounded-xl bg-bara-cyan font-bold text-black disabled:opacity-50">
          {busy ? 'Menyimpan…' : 'Ganti password'}
        </button>
      </form>
    </div>
  )
}
