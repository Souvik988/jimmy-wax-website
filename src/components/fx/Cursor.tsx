import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'motion/react'

type CursorMode = 'default' | 'link' | 'media'

/**
 * Additive desktop cursor: a trailing brass ring + precise dot.
 * The native pointer is never hidden (usability first); the ring
 * adds affordance — it grows on controls and shows a label over media.
 */
export function Cursor() {
  const [enabled, setEnabled] = useState(false)
  const [mode, setMode] = useState<CursorMode>('default')
  const [label, setLabel] = useState('')
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const rx = useSpring(x, { stiffness: 320, damping: 30, mass: .55 })
  const ry = useSpring(y, { stiffness: 320, damping: 30, mass: .55 })

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine || reduce) return
    setEnabled(true)
    const move = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY) }
    const over = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null
      if (!t || !(t instanceof Element)) return
      const media = t.closest('[data-cursor]') as HTMLElement | null
      if (media) { setMode('media'); setLabel(media.dataset.cursor || 'View'); return }
      if (t.closest('a, button, [role="button"], input, select, textarea, label')) { setMode('link'); return }
      setMode('default')
      setLabel('')
    }
    window.addEventListener('mousemove', move, { passive: true })
    window.addEventListener('mouseover', over, { passive: true })
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseover', over)
    }
  }, [x, y])

  if (!enabled) return null
  return (
    <div className="cursor-layer" aria-hidden="true">
      <motion.div className="cursor-dot" style={{ x, y }} />
      <motion.div className="cursor-ring-float" style={{ x: rx, y: ry }}>
        <div className="cursor-ring" data-mode={mode}><span>{label}</span></div>
      </motion.div>
    </div>
  )
}
