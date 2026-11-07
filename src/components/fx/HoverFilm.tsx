import { useState } from 'react'
import { useReducedMotion } from 'motion/react'

/**
 * Product-true motion plate that fades in over the card imagery while the
 * card is hovered (desktop, fine pointer). Renders nothing for reduced-motion
 * visitors, on touch, or if the film fails — the stills carry the card.
 */
export function HoverFilm({ src, active, className }: { src?: string; active: boolean; className?: string }) {
  const reduce = useReducedMotion()
  const [failed, setFailed] = useState(false)
  const [playing, setPlaying] = useState(false)
  if (!src || reduce || failed || !active) return null
  return (
    <video
      className={className}
      src={src}
      muted
      loop
      playsInline
      autoPlay
      preload="auto"
      aria-hidden="true"
      onError={() => setFailed(true)}
      onPlaying={() => setPlaying(true)}
      style={{ opacity: playing ? 1 : 0, transition: 'opacity .45s ease' }}
    />
  )
}
