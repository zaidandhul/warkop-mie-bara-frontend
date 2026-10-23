import { Link } from 'react-router-dom'

const SECTIONS = [
  {
    title: 'Data yang kami kumpulkan',
    body: 'Saat memesan, kami hanya meminta nama dan nomor HP Anda, beserta nomor meja dan isi pesanan.',
  },
  {
    title: 'Untuk apa data dipakai',
    body: 'Nama dan nomor HP hanya dipakai untuk memproses pesanan: memanggil Anda saat pesanan siap dan menghubungi Anda bila ada kendala dengan pesanan.',
  },
  {
    title: 'Yang tidak kami lakukan',
    body: 'Data Anda tidak dijual, tidak dibagikan ke pihak lain, dan tidak dipakai untuk promosi.',
  },
  {
    title: 'Pertanyaan',
    body: 'Jika ingin bertanya atau meminta data Anda dihapus, silakan sampaikan ke kasir.',
  },
]

export default function PrivacyPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col">
      <header className="flex items-center gap-3 border-b border-bara-line px-4 py-4">
        <Link to="/profile" aria-label="Kembali" className="text-xl">←</Link>
        <h1 className="flex-1 text-center text-base font-bold">Kebijakan Privasi</h1>
        <span className="w-5" />
      </header>

      <div className="space-y-3 px-4 py-6">
        {SECTIONS.map((s) => (
          <section key={s.title} className="rounded-xl border border-bara-line bg-bara-panel px-4 py-3">
            <h2 className="text-sm font-bold">{s.title}</h2>
            <p className="mt-1 text-sm text-white/70">{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  )
}
