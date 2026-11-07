import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

/**
 * Signature arrival — ONE complete film, scroll-scrubbed smoothly (the pin
 * holds ~2.6 viewports, scroll drives currentTime with lerped, coalesced
 * seeks on a GOP-4 encode), then the page releases into free scroll.
 * The brand is carried by the typographic layer over the film.
 * Reduced motion: a still frame, no pinning.
 */
export function ScrubHero({ src, poster, children, label, scrubScroll = 2.6 }: {
  src: string
  poster: string
  children: ReactNode
  label: string
  scrubScroll?: number
}) {
  const reduce = useReducedMotion()
  const hostRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (reduce || failed) return
    let raf = 0
    let cur = 0
    let disposed = false
    const urls: string[] = []

    fetch(src).then((r) => r.ok ? r.blob() : Promise.reject(new Error('404')))
      .then((blob) => {
        if (disposed) return
        const objectUrl = URL.createObjectURL(blob)
        urls.push(objectUrl)
        const v = videoRef.current
        if (!v) return
        v.src = objectUrl
        v.load()
      })
      .catch(() => setFailed(true))

    const tick = () => {
      raf = requestAnimationFrame(tick)
      const host = hostRef.current
      const v = videoRef.current
      if (!host || !v || !v.duration || !Number.isFinite(v.duration)) return
      const rect = host.getBoundingClientRect()
      const scrollable = rect.height - window.innerHeight
      if (scrollable <= 0) return
      const progress = Math.min(1, Math.max(0, -rect.top / scrollable))
      if (v.seeking) return
      cur += (progress - cur) * 0.3
      const t = Math.min(0.999, Math.max(0, cur)) * v.duration
      if (Math.abs(v.currentTime - t) > 0.02) { try { v.currentTime = t } catch { /* decoder busy */ } }
    }
    raf = requestAnimationFrame(tick)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      urls.forEach((u) => { try { URL.revokeObjectURL(u) } catch { /* gone */ } })
    }
  }, [reduce, failed, src])

  if (reduce || failed) {
    return (
      <section className="scrub-hero" id="top" aria-label={label}>
        <div className="scrub-hero__frame"><img src={poster} alt="" /></div>
        <div className="scrub-hero__copy">{children}</div>
      </section>
    )
  }
  return (
    <section className="scrub-hero" id="top" ref={hostRef} style={{ height: `${scrubScroll * 100}vh` }} aria-label={label}>
      <div className="scrub-hero__sticky">
        <div className="scrub-hero__frame">
          <video
            ref={videoRef}
            poster={poster}
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
            onLoadedData={() => setReady(true)}
            style={{ opacity: ready ? 1 : 0, transition: 'opacity .5s ease' }}
          />
          <div className="scrub-hero__scrim" aria-hidden="true" />
          <div className="scrub-hero__copy">{children}</div>
        </div>
      </div>
    </section>
  )
}
