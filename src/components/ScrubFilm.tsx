import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'

type Beat = { title: string; body: string }

/**
 * Pinned, scroll-scrubbed film — the ritual page's own scroll-world moment.
 * The section is `scrubScroll` viewport-heights tall; the frame sticks while
 * scroll progress drives `video.currentTime` (lerped, seeks coalesced, clip
 * fetched as a blob so scrubbing never depends on byte-range support).
 * Beats overlay in sync with the film's directed thirds.
 * Reduced motion: the section keeps its natural height with a still frame.
 */
export function ScrubFilm({ src, poster, beats, scrubScroll = 2.6, label }: {
  src: string
  poster: string
  beats: Beat[]
  scrubScroll?: number
  label: string
}) {
  const reduce = useReducedMotion()
  const hostRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const target = useRef(0)
  const [failed, setFailed] = useState(false)
  const [beat, setBeat] = useState(0)
  const beatCount = beats.length

  useEffect(() => {
    if (reduce || failed) return
    let raf = 0
    let cur = 0
    let disposed = false
    const url: string[] = []

    fetch(src).then((r) => r.ok ? r.blob() : Promise.reject(new Error('404')))
      .then((blob) => {
        if (disposed) return
        const objectUrl = URL.createObjectURL(blob)
        url.push(objectUrl)
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
      target.current = progress
      if (v.seeking) return
      cur += (progress - cur) * 0.3
      const t = Math.min(0.999, Math.max(0, cur)) * v.duration
      if (Math.abs(v.currentTime - t) > 0.02) { try { v.currentTime = t } catch { /* decoder busy */ } }
    }
    raf = requestAnimationFrame(tick)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      url.forEach((u) => { try { URL.revokeObjectURL(u) } catch { /* already gone */ } })
    }
  }, [reduce, failed, src])

  useEffect(() => {
    if (reduce || failed) return
    const onScroll = () => {
      const host = hostRef.current
      if (!host) return
      const rect = host.getBoundingClientRect()
      const scrollable = rect.height - window.innerHeight
      if (scrollable <= 0) return
      const progress = Math.min(1, Math.max(0, -rect.top / scrollable))
      setBeat(Math.min(beatCount - 1, Math.floor(progress * beatCount)))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [reduce, failed, beatCount])

  if (reduce || failed) {
    return (
      <section className="scrub-film scrub-film--static" aria-label={label}>
        <div className="scrub-frame"><img src={poster} alt="" loading="lazy" decoding="async" /></div>
      </section>
    )
  }
  return (
    <section className="scrub-film" ref={hostRef} style={{ height: `${scrubScroll * 100}vh` }} aria-label={label}>
      <div className="scrub-sticky">
        <div className="scrub-frame">
          <video ref={videoRef} muted playsInline preload="auto" poster={poster} aria-hidden="true" />
          <div className="scrub-gradient" aria-hidden="true" />
          <div className="scrub-beats" aria-live="off">
            {beats.map((b, i) => (
              <motion.div
                key={b.title}
                className={`scrub-beat${i === beat ? ' is-active' : ''}`}
                initial={false}
                animate={{ opacity: i === beat ? 1 : 0, y: i === beat ? 0 : 14 }}
                transition={{ duration: .45, ease: [.16, 1, .3, 1] }}
              >
                <span>{String(i + 1).padStart(2, '0')} / {String(beats.length).padStart(2, '0')}</span>
                <h3>{b.title}</h3>
                <p>{b.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
