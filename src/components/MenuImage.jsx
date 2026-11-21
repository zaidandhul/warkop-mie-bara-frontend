import { useState } from 'react'
import { menuImage } from '../utils/menuImages.js'

export default function MenuImage({ item, className = '', fallbackClassName = '', eager = false }) {
  const [failed, setFailed] = useState(false)
  const src = menuImage(item.id)

  if (!src || failed) {
    return (
      <div
        aria-hidden="true"
        className={`flex items-center justify-center bg-bara-panel text-3xl ${fallbackClassName || className}`}
      >
        🍜
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={item.name}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
    />
  )
}
