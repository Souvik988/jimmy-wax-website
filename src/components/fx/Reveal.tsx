import { motion, useReducedMotion } from 'motion/react'

/** Standard scroll-into-view reveal. Opacity + small rise, expo ease. */
export function Reveal({
  children, className, delay = 0, y = 30, once = true,
}: { children: React.ReactNode; className?: string; delay?: number; y?: number; once?: boolean }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-10%' }}
      transition={{ duration: reduce ? 0 : .8, delay, ease: [.16, 1, .3, 1] }}
    >{children}</motion.div>
  )
}
