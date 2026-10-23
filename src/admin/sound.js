// Bunyi notifikasi pesanan baru lewat Web Audio API (tanpa file suara).
// Browser hanya mengizinkan suara setelah ada sentuhan/klik, jadi unlockSound() harus dipanggil
// dari event handler (tombol "Aktifkan suara" atau submit login). AudioContext disimpan di level
// modul supaya tetap hidup saat pindah halaman di dalam SPA.
let context = null

export function unlockSound() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) return false
  context ??= new AudioContextClass()
  if (context.state === 'suspended') context.resume()
  return true
}

export function isSoundReady() {
  return context?.state === 'running'
}

// Dua nada naik, cukup keras untuk dapur yang ramai.
export function playNewOrderChime() {
  if (!isSoundReady()) return
  const start = context.currentTime
  ;[[880, 0], [1320, 0.18], [880, 0.5], [1320, 0.68]].forEach(([frequency, offset]) => {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'triangle'
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(0.0001, start + offset)
    gain.gain.exponentialRampToValueAtTime(0.5, start + offset + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.16)
    oscillator.connect(gain).connect(context.destination)
    oscillator.start(start + offset)
    oscillator.stop(start + offset + 0.18)
  })
}
