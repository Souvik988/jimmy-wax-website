import { motion, useReducedMotion, type Variants } from 'motion/react'

type TagName = 'h1' | 'h2' | 'h3' | 'p'

const lineVariants: Variants = {
  hidden: { y: '112%' },
  show: { y: '0%' },
}

/**
 * Masked line-by-line reveal for display headings. Each string in `lines`
 * becomes one masked line; the whole heading keeps a single accessible label.
 */
export function SplitText({
  lines, as = 'h2', className, id, delay = 0, immediate = false, once = true,
}: {
  lines: string[]
  as?: TagName
  className?: string
  id?: string
  delay?: number
  immediate?: boolean
  once?: boolean
}) {
  const reduce = useReducedMotion()
  const Tag = motion[as]
  const groupTransition = { staggerChildren: reduce ? 0 : .085, delayChildren: delay }
  const lineTransition = { duration: reduce ? 0 : .95, ease: [.16, 1, .3, 1] as const }
  return (
    <Tag
      className={className}
      id={id}
      aria-label={lines.join(' ')}
      initial="hidden"
      {...(immediate
        ? { animate: 'show', transition: groupTransition }
        : { whileInView: 'show', viewport: { once, margin: '-10%' }, transition: groupTransition })}
    >
      {lines.map((line, i) => (
        <span className="st-mask" aria-hidden="true" key={i}>
          <motion.span className="st-line" variants={lineVariants} transition={lineTransition}>{line}</motion.span>
        </span>
      ))}
    </Tag>
  )
}
