import { useEffect, useRef, useState } from 'react'
import { MediaLoop } from './fx/MediaLoop'
import { Reveal } from './fx/Reveal'
import { bindScrollSlide } from '../lib/scrollSlide'
import { Lines } from '../lib/experience'

/**
 * Chapter 04 — Stories: seven vertical reels in a scroll-driven horizontal
 * queue. The rail slides with the scroll (lerp-normalized: fast or slow, the
 * cards pass at a readable pace) and each reel plays ONLY while the cursor
 * rests on it — never autoplay. Reduced motion: static grid, click-to-play.
 */
export interface Reel { src: string; poster: string; n: string; title: string; line: string; alt: string }

function ReelCard({ reel }: { reel: Reel }) {
  return (
    <figure className="reel-card">
      <MediaLoop src={reel.src} poster={reel.poster} alt={reel.alt} className="reel-card__media" playOn="hover" />
      <figcaption>
        <span className="reel-card__n">{reel.n}</span>
        <span className="reel-card__title">{reel.title}</span>
        <span className="reel-card__line">{reel.line}</span>
      </figcaption>
    </figure>
  )
}

export function StoriesBlock({ reels, title, chapterLabel, anchor }: { reels: Reel[]; title?: string; chapterLabel?: string; anchor?: string }) {
  const reduce = useReducedMotionFlag()
  const railRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const rail = railRef.current
    const inner = innerRef.current
    if (!rail || !inner) return
    return bindScrollSlide(rail, inner)
  }, [])

  return (
    <div className="chapter-rail">
      {chapterLabel && <span className="chapter-rail__label" aria-hidden="true">{chapterLabel}</span>}
      <div className="chapter-rail__body">
        {reduce ? (
          <>
            <div className="section-head" id={anchor}>
              <Reveal>
                <p className="kicker">Stories</p>
                <h2><Lines text={title ?? 'Stories'} /></h2>
              </Reveal>
            </div>
            <section className="reel-track" aria-label="Story reels">
              {reels.map((reel) => (
                <Reveal key={reel.n}>
                  <ReelCard reel={reel} />
                </Reveal>
              ))}
            </section>
          </>
        ) : (
          <div className="stories-runway" ref={railRef} id={anchor}>
            <div className="stories-sticky">
              <div className="stories-sticky__head">
                <p className="kicker">Chapter 04 · Stories</p>
                <h2><Lines text={title ?? 'Stories'} /></h2>
                <p className="stories-sticky__hint" aria-hidden="true">Scroll — the reels pass by · hover to play</p>
              </div>
              <div className="stories-track" aria-label="Story reels">
                <div className="stories-track__inner" ref={innerRef}>
                  {reels.map((reel, i) => (
                    <div className="stories-track__item" key={reel.n}>
                      <ReelCard reel={reel} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function useReducedMotionFlag(): boolean {
  const [reduce, setReduce] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduce(mq.matches)
    mq.addEventListener?.('change', on)
    return () => mq.removeEventListener?.('change', on)
  }, [])
  return reduce
}
