import Lenis from 'lenis'

/**
 * Site-wide smooth scroll (Lenis): wheel input is eased toward the target with
 * a slow, luxurious lerp — a fast scroll glides instead of jumping, so every
 * scroll-driven animation stays visible. Touch stays native (mobile already
 * scrolls at finger speed). Reduced motion: Lenis never starts.
 *
 * The instance is exposed on window for anchor jumps (nav/footer) and for
 * stop()/start() when overlays (cart drawer, reader) lock the page.
 */
let lenis: Lenis | null = null

export function initSmoothScroll(speedCap = 1): () => void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => undefined
  lenis = new Lenis({
    lerp: 0.07, // the slower the lerp, the more deliberate the glide
    wheelMultiplier: 0.9 * Math.min(3, Math.max(0.2, speedCap)), // chrome.effects.smoothScroll.speedCap (1 = built-in)
    touchMultiplier: 1,
  })
  ;(window as unknown as { __lenis?: Lenis }).__lenis = lenis
  let raf = 0
  const loop = (time: number) => {
    lenis?.raf(time)
    raf = requestAnimationFrame(loop)
  }
  raf = requestAnimationFrame(loop)
  return () => {
    cancelAnimationFrame(raf)
    lenis?.destroy()
    lenis = null
    delete (window as unknown as { __lenis?: Lenis }).__lenis
  }
}

export function smoothScrollTo(target: string | number, offset = -64): void {
  const l = (window as unknown as { __lenis?: Lenis }).__lenis
  if (l) {
    l.scrollTo(target as never, { offset, duration: 1.6, easing: (t: number) => 1 - Math.pow(1 - t, 3) })
    return
  }
  if (typeof target === 'number') window.scrollTo({ top: target, behavior: 'smooth' })
  else document.querySelector(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function lockPageScroll(locked: boolean): void {
  document.body.style.overflow = locked ? 'hidden' : ''
  const l = (window as unknown as { __lenis?: Lenis }).__lenis
  if (!l) return
  if (locked) l.stop()
  else l.start()
}
