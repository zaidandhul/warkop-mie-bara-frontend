import { useState } from 'react'
import { Link } from 'react-router-dom'

const LANGUAGES = [
  { code: 'id', label: 'Indonesia', flag: '🇮🇩' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
]

function LanguageModal({ current, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-2xl bg-bara-panel p-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Bahasa</h2>
          <button onClick={onClose} aria-label="Tutup" className="text-xl text-white/60">✕</button>
        </div>
        <ul className="mt-4 divide-y divide-bara-line">
          {LANGUAGES.map((l) => (
            <li key={l.code}>
              <button
                onClick={() => onSelect(l.code)}
                className="flex w-full items-center justify-between py-3 text-left"
              >
                <span className="flex items-center gap-3">
                  <span>{l.flag}</span>
                  <span className="text-sm font-medium">{l.label}</span>
                </span>
                {current === l.code && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-bara-cyan text-xs text-black">✓</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

const MENU_ITEMS = [
  { icon: '📄', label: 'Riwayat Pesanan', to: '/history' },
  { icon: '🛡️', label: 'Kebijakan Privasi', to: '/privacy' },
]

export default function ProfilePage() {
  const [showLanguage, setShowLanguage] = useState(false)
  const [language, setLanguage] = useState('id')

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col">
      <header className="flex items-center gap-3 border-b border-bara-line px-4 py-4">
        <Link to="/order" aria-label="Kembali" className="text-xl">←</Link>
        <h1 className="flex-1 text-center text-base font-bold">Profil</h1>
        <span className="w-5" />
      </header>

      <div className="px-4 pt-6">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-bara-panel text-2xl">
            👤
          </div>
          <div>
            <p className="font-bold">Masuk sebagai Tamu</p>
            <button className="mt-1 rounded-lg bg-bara-cyan px-4 py-1.5 text-sm font-bold text-black">
              Masuk
            </button>
          </div>
        </div>

        <nav className="mt-6 space-y-3">
          <Link
            to="/history"
            className="flex items-center justify-between rounded-xl border border-bara-line bg-bara-panel px-4 py-3"
          >
            <span className="flex items-center gap-3">
              <span>📄</span>
              <span className="text-sm font-medium">Riwayat Pesanan</span>
            </span>
          </Link>

          <button
            onClick={() => setShowLanguage(true)}
            className="flex w-full items-center justify-between rounded-xl border border-bara-line bg-bara-panel px-4 py-3"
          >
            <span className="flex items-center gap-3">
              <span>🌐</span>
              <span className="text-sm font-medium">Bahasa</span>
            </span>
            <span className="text-white/40">›</span>
          </button>

          <Link
            to="/privacy"
            className="flex items-center justify-between rounded-xl border border-bara-line bg-bara-panel px-4 py-3"
          >
            <span className="flex items-center gap-3">
              <span>🛡️</span>
              <span className="text-sm font-medium">Kebijakan Privasi</span>
            </span>
          </Link>
        </nav>
      </div>

      <p className="mt-auto py-6 text-center text-xs text-white/40">
        Warkop Mie Bara
      </p>

      {showLanguage && (
        <LanguageModal
          current={language}
          onSelect={(code) => {
            setLanguage(code)
            setShowLanguage(false)
          }}
          onClose={() => setShowLanguage(false)}
        />
      )}
    </div>
  )
}