import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'motion/react'

/**
 * Subtle perspective tilt for media cards (±`max` degrees). The wrapped card
 * should carry `transform-style: preserve-3d`; inner layers may use translateZ.
 */
export function TiltCard({ children, className, max = 4 }: { children: React.ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const rxRaw = useMotionValue(0)
  const ryRaw = useMotionValue(0)
  const rx = useSpring(rxRaw, { stiffness: 160, damping: 20, mass: .4 })
  const ry = useSpring(ryRaw, { stiffness: 160, damping: 20, mass: .4 })

  if (reduce) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      ref={ref}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 1100, transformStyle: 'preserve-3d' }}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect()
        if (!r) return
        const px = (e.clientX - r.left) / r.width - .5
        const py = (e.clientY - r.top) / r.height - .5
        ryRaw.set(px * max)
        rxRaw.set(-py * max)
      }}
      onMouseLeave={() => { rxRaw.set(0); ryRaw.set(0) }}
    >{children}</motion.div>
  )
}
