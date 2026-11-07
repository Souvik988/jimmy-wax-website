/**
 * Scroll-linked horizontal slide with velocity normalization.
 *
 * The rail's runway is a tall section; a sticky viewport holds the strip.
 * The strip's translateX maps to scroll progress through a lerp — so however
 * fast the visitor scrolls, the slide moves at a constant, readable pace and
 * settles exactly on the target (never overshoots, never skips frames past).
 *
 * The rAF loop runs only while the rail is near the viewport (IO-gated).
 * Reduced motion: no-op (callers keep a manual-scroll fallback).
 */
export function bindScrollSlide(rail: HTMLElement, inner: HTMLElement, lerp = 0.12): () => void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => undefined
  let raf = 0
  let current = 0
  let active = false

  const maxOffset = () => Math.max(0, inner.scrollWidth - window.innerWidth)

  const tick = () => {
    raf = requestAnimationFrame(tick)
    if (!active) return
    const rect = rail.getBoundingClientRect()
    const runway = rail.offsetHeight - window.innerHeight
    if (runway <= 0) return
    const progress = Math.min(1, Math.max(0, -rect.top / runway))
    const target = progress * maxOffset()
    current += (target - current) * lerp
    if (Math.abs(target - current) < 0.4) current = target
    inner.style.transform = `translate3d(${-current}px, 0, 0)`
  }

  const io = new IntersectionObserver(
    (entries) => { active = entries.some((e) => e.isIntersecting) },
    { rootMargin: '25% 0px' },
  )
  io.observe(rail)
  raf = requestAnimationFrame(tick)

  return () => {
    cancelAnimationFrame(raf)
    io.disconnect()
  }
}
