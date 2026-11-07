import { useRef, useState } from 'react'
import { motion, useInView, useReducedMotion } from 'motion/react'

/**
 * Media that arrives with intention: a hard clip-path wipe (bottom-up) while
 * the image settles from a slight overshoot scale. Kills the "pasted photo"
 * feel. Falls back silently to `fallback` if the source is missing. Reduced
 * motion: static image. Driven by useInView (deterministic) rather than
 * whileInView, which stalled inside nested wrappers.
 */
export function RevealImage({ src, fallback, alt, ratio = '4 / 3', className, eager = false }: {
  src: string
  fallback?: string
  alt: string
  ratio?: string
  className?: string
  eager?: boolean
}) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-8% 0px' })
  const [current, setCurrent] = useState(src)
  const shown = reduce || inView
  return (
    <motion.div
      ref={ref}
      className={`reveal-img${className ? ` ${className}` : ''}`}
      style={{ aspectRatio: ratio }}
      initial={reduce ? { clipPath: 'inset(0 0 0% 0)' } : { clipPath: 'inset(0 0 100% 0)' }}
      animate={shown ? { clipPath: 'inset(0 0 0% 0)' } : { clipPath: 'inset(0 0 100% 0)' }}
      transition={{ duration: .85, ease: [.76, 0, .24, 1] }}
    >
      <motion.img
        src={current}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => { if (fallback && current !== fallback) setCurrent(fallback) }}
        initial={reduce ? { scale: 1 } : { scale: 1.16 }}
        animate={shown ? { scale: 1 } : { scale: 1.16 }}
        transition={{ duration: 1.25, ease: [.16, 1, .3, 1] }}
      />
    </motion.div>
  )
}
