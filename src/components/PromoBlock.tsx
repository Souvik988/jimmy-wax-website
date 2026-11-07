import { Reveal } from './fx/Reveal'
import { SplitText } from './fx/SplitText'

/**
 * The film: the narrated brand promo, bottom-center of the one-page route.
 * It carries a voiceover, so it ships with real controls and waits for a
 * deliberate play (browser autoplay policies block sound-on autoplay anyway).
 */
export interface PromoProps { kicker?: string; lines: string[]; video: string; poster?: string; caption?: string }
export function PromoBlock({ kicker, lines, video, poster, caption }: PromoProps) {
  return (
    <section className="promo-band" aria-label="The Jimmy and Wax film">
      <div className="promo-band__inner">
        <Reveal>
          {kicker && <p className="kicker">{kicker}</p>}
          <SplitText as="h2" lines={lines} />
        </Reveal>
        <Reveal delay={.12} className="promo-band__stage">
          <video
            className="promo-band__video"
            src={video}
            poster={poster}
            controls
            preload="none"
            playsInline
          />
        </Reveal>
        {caption && (
          <Reveal delay={.2}>
            <p className="promo-band__caption">{caption}</p>
          </Reveal>
        )}
      </div>
    </section>
  )
}
