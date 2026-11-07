import { useRef, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'motion/react'

/** Wraps a control so it leans toward the pointer, springing back on leave. */
export function Magnetic({ children, strength = .32, className }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 190, damping: 15, mass: .35 })
  const sy = useSpring(y, { stiffness: 190, damping: 15, mass: .35 })

  if (reduce) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      ref={ref}
      style={{ x: sx, y: sy, display: 'inline-block' }}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect()
        if (!r) return
        x.set((e.clientX - r.left - r.width / 2) * strength)
        y.set((e.clientY - r.top - r.height / 2) * strength)
      }}
      onMouseLeave={() => { x.set(0); y.set(0) }}
    >{children}</motion.div>
  )
}
