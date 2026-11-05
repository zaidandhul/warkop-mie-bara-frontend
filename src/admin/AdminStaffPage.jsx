import { useCallback, useEffect, useState } from 'react'
import { Navigate, useOutletContext } from 'react-router-dom'
import { errorMessage } from '../api/orders.js'
import { createStaff, getStaff, isUnauthorized, resetStaffPassword, updateStaff } from './api.js'
import { formatDateTimeWib } from './constants.js'

const input = 'min-h-11 rounded-lg border border-bara-line bg-bara-black px-3 outline-none focus:border-bara-cyan'
const button = 'min-h-10 rounded-lg border border-bara-line px-3 text-sm hover:bg-white/10 disabled:opacity-50'

function ResetPassword({ member, busy, onReset }) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  if (!open) return <button data-testid={`staff-reset-${member.username}`} disabled={busy} onClick={() => setOpen(true)} className={button}>Reset password</button>
  return (
    <form className="flex gap-2" onSubmit={async (e) => {
      e.preventDefault()
      if (await onReset(member, password)) { setOpen(false); setPassword('') }
    }}>
      <input data-testid="staff-reset-input" type="password" autoComplete="new-password" required minLength={8} placeholder="Password baru" value={password} onChange={(e) => setPassword(e.target.value)} className={`${input} w-40`} />
      <button type="submit" data-testid="staff-reset-save" disabled={busy} className={`${button} border-bara-cyan text-bara-cyan`}>Simpan</button>
      <button type="button" onClick={() => setOpen(false)} className={button}>Batal</button>
    </form>
  )
}

// Kelola akun staf (khusus admin): tambah, aktif/nonaktif, admin/staf, reset password.
export default function AdminStaffPage() {
  const { staff: me, onSessionExpired } = useOutletContext()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [notice, setNotice] = useState(null) // { ok, text }
  const [form, setForm] = useState({ username: '', password: '', isAdmin: false })

  const handleError = useCallback((error, fallback) => {
    if (isUnauthorized(error)) return onSessionExpired()
    setNotice({ ok: false, text: errorMessage(error, fallback) })
  }, [onSessionExpired])

  useEffect(() => {
    if (!me.isAdmin) return
    getStaff().then(setMembers).catch((error) => handleError(error, 'Daftar staf gagal dimuat.')).finally(() => setLoading(false))
  }, [me.isAdmin, handleError])

  if (!me.isAdmin) return <Navigate to="/admin" replace />

  const run = async (id, action, success) => {
    setBusyId(id)
    setNotice(null)
    try {
      await action()
      if (success) setNotice({ ok: true, text: success })
      return true
    } catch (error) {
      handleError(error, 'Perubahan gagal disimpan.')
      return false
    } finally {
      setBusyId(null)
    }
  }

  const add = (e) => {
    e.preventDefault()
    run('baru', async () => {
      const created = await createStaff(form)
      setMembers((current) => [...current, created].sort((a, b) => a.username.localeCompare(b.username)))
      setForm({ username: '', password: '', isAdmin: false })
    }, `Akun "${form.username}" dibuat.`)
  }
  const change = (member, changes, success) => run(member.id, async () => {
    const updated = await updateStaff(member.id, changes)
    setMembers((current) => current.map((m) => (m.id === member.id ? updated : m)))
  }, success)
  const reset = (member, password) => run(member.id, () => resetStaffPassword(member.id, password),
    `Password ${member.username} diganti. Sesi lamanya sudah berakhir.`)

  return (
    <div className="h-full overflow-y-auto px-5 py-4">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-xl font-bold">Staf</h1>
        <p className="mt-1 text-sm text-white/60">Admin bisa mengelola akun staf. Staf biasa bisa memakai semua fitur lain dan mengganti password sendiri.</p>

        <form onSubmit={add} className="mt-4 flex flex-wrap items-end gap-2 rounded-xl border border-bara-line bg-bara-panel p-3">
          <label className="text-sm">Username
            <input data-testid="staff-new-username" required pattern="[a-zA-Z0-9._\-]{3,50}" value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} className={`${input} mt-1 block w-48`} />
          </label>
          <label className="text-sm">Password awal
            <input data-testid="staff-new-password" type="password" autoComplete="new-password" required minLength={8} value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className={`${input} mt-1 block w-48`} />
          </label>
          <label className="text-sm">Peran
            <select data-testid="staff-new-role" value={form.isAdmin ? 'admin' : 'staf'}
              onChange={(e) => setForm((f) => ({ ...f, isAdmin: e.target.value === 'admin' }))} className={`${input} mt-1 block`}>
              <option value="staf">Staf</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <button type="submit" data-testid="staff-add" disabled={busyId === 'baru'} className="min-h-11 rounded-lg bg-bara-cyan px-5 font-bold text-black disabled:opacity-50">Tambah staf</button>
        </form>

        {notice && (
          <p role={notice.ok ? 'status' : 'alert'} data-testid="staff-notice"
            className={`mt-3 rounded-lg border px-3 py-2 text-sm ${notice.ok ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-200' : 'border-bara-chili/50 bg-bara-chili/10 text-bara-chili'}`}>
            {notice.text}
          </p>
        )}

        {loading ? <p className="mt-6 text-white/60">Memuat…</p> : (
          <ul className="mt-4 space-y-2">
            {members.map((member) => (
              <li key={member.id} data-testid={`staff-row-${member.username}`}
                className={`flex flex-wrap items-center gap-3 rounded-xl border border-bara-line bg-bara-panel px-3 py-2 ${member.isActive ? '' : 'opacity-60'}`}>
                <div className="min-w-48 flex-1">
                  <p className="font-semibold">{member.username}{member.id === me.id && <span className="ml-2 text-xs text-white/50">(Anda)</span>}</p>
                  <p className="text-xs text-white/50">
                    {member.isAdmin ? 'Admin' : 'Staf'} · {member.isActive ? 'Aktif' : 'Nonaktif'}
                    {member.lastLoginAt ? ` · login terakhir ${formatDateTimeWib(member.lastLoginAt)}` : ' · belum pernah login'}
                  </p>
                </div>
                {member.id !== me.id && (
                  <>
                    <button data-testid={`staff-role-${member.username}`} disabled={busyId === member.id} className={button}
                      onClick={() => change(member, { isAdmin: !member.isAdmin }, `${member.username} sekarang ${member.isAdmin ? 'staf' : 'admin'}.`)}>
                      {member.isAdmin ? 'Jadikan staf' : 'Jadikan admin'}
                    </button>
                    <button data-testid={`staff-active-${member.username}`} disabled={busyId === member.id}
                      className={`${button} ${member.isActive ? 'border-bara-chili/60 text-bara-chili' : 'border-emerald-400/60 text-emerald-300'}`}
                      onClick={() => change(member, { isActive: !member.isActive }, `${member.username} ${member.isActive ? 'dinonaktifkan' : 'diaktifkan'}.`)}>
                      {member.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    <ResetPassword member={member} busy={busyId === member.id} onReset={reset} />
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
