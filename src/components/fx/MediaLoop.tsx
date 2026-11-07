import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'

/**
 * Silent looping film over a still poster.
 * playOn:
 *  - 'view'  (default): arms near the viewport and plays while visible — for
 *            ambient backdrop films.
 *  - 'hover': NEVER autoplays. Arms + plays only while the cursor (or focus)
 *             rests on the card; tap toggles on touch. The poster stands in
 *             until then — reels stay quiet until invited.
 */
export function MediaLoop({ src, poster, alt, className, playOn = 'view' }: {
  src: string
  poster: string
  alt: string
  className?: string
  playOn?: 'view' | 'hover'
}) {
  const reduce = useReducedMotion()
  const wrapRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [armed, setArmed] = useState(playOn === 'view')
  const [failed, setFailed] = useState(false)
  const [playing, setPlaying] = useState(false)
  const hoverRef = useRef(false)

  useEffect(() => {
    if (reduce || playOn !== 'view') return
    const node = wrapRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (!armed) setArmed(true)
            else videoRef.current?.play().catch(() => undefined)
          } else {
            videoRef.current?.pause()
            setPlaying(false)
          }
        }
      },
      { rootMargin: '120px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [reduce, armed, playOn])

  // hover mode: cursor rests on the card → play; leaves → pause
  useEffect(() => {
    if (reduce || playOn !== 'hover') return
    const node = wrapRef.current
    if (!node) return
    const enter = () => {
      hoverRef.current = true
      setArmed(true)
      videoRef.current?.play().catch(() => undefined)
    }
    const leave = () => {
      hoverRef.current = false
      videoRef.current?.pause()
      setPlaying(false)
    }
    node.addEventListener('pointerenter', enter)
    node.addEventListener('pointerleave', leave)
    const focusIn = () => { if (node.matches(':focus-visible, :has(:focus-visible)')) enter() }
    node.addEventListener('focusin', focusIn)
    node.addEventListener('focusout', leave)
    return () => {
      node.removeEventListener('pointerenter', enter)
      node.removeEventListener('pointerleave', leave)
      node.removeEventListener('focusin', focusIn)
      node.removeEventListener('focusout', leave)
    }
  }, [reduce, playOn])

  const toggleTap = () => {
    // touch: no hover exists — tap toggles playback
    if (!armed) { setArmed(true); return }
    const v = videoRef.current
    if (!v) return
    if (v.paused) v.play().catch(() => undefined)
    else { v.pause(); setPlaying(false) }
  }

  return (
    <div
      ref={wrapRef}
      className={className ? `media-loop ${className}` : 'media-loop'}
      onClick={playOn === 'hover' ? toggleTap : undefined}
      data-playing={playing ? 'true' : undefined}
    >
      <img src={poster} alt={alt} loading="lazy" decoding="async" />
      {!reduce && !failed && (
        <video
          ref={videoRef}
          src={armed ? src : undefined}
          muted
          loop
          playsInline
          preload={armed ? 'auto' : 'none'}
          aria-hidden="true"
          onError={() => setFailed(true)}
          onLoadedData={() => { if (playOn === 'hover' ? hoverRef.current : true) videoRef.current?.play().catch(() => undefined) }}
          onPlaying={() => setPlaying(true)}
          style={{ opacity: playing ? 1 : 0, transition: 'opacity .6s ease' }}
        />
      )}
      {playOn === 'hover' && !reduce && !failed && !playing && (
        <span className="media-loop__playhint" aria-hidden="true">▶</span>
      )}
    </div>
  )
}
