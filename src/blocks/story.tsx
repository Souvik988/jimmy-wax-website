import { useEffect, useRef } from 'react'
import { Magnetic } from '../components/fx/Magnetic'
import { MediaLoop } from '../components/fx/MediaLoop'
import { Reveal } from '../components/fx/Reveal'
import { RevealImage } from '../components/fx/RevealImage'
import { SplitText } from '../components/fx/SplitText'
import { ScrubFilm } from '../components/ScrubFilm'
import { StoriesBlock, type Reel } from '../components/StoriesBlock'
import { JournalBlock, type JournalCard } from '../components/JournalBlock'
import { Lines, useExperience } from '../lib/experience'
import { ActionLink } from '../lib/nav'
import { resolveAction } from '../lib/actions'
import { bindScrollSlide } from '../lib/scrollSlide'
import { paragraphs } from '../lib/markdown'
import type { Action, MediaRef, Story, JournalNote } from '../lib/types'
import type { ResolvedMedia } from '../lib/media'
import { DEFAULT_CONTENT } from './defaults'
import { arr, Img, obj, pad2, str, useEntity, useMedia } from './util'
import type { BlockProps } from './core'

/** A rail wrapper shared by the "chapter" blocks (the sticky vertical label is decorative and optional). */
function Chapter({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="chapter-rail">
      {label && <span className="chapter-rail__label" aria-hidden="true">{label}</span>}
      <div className="chapter-rail__body">{children}</div>
    </div>
  )
}

function Head({ kicker, headline, subhead, id }: { kicker?: unknown; headline?: unknown; subhead?: unknown; id?: string }) {
  return (
    <div className="section-head" id={id}>
      <Reveal>
        {kicker ? <p className="kicker">{str(kicker)}</p> : null}
        <h2><Lines text={str(headline)} /></h2>
        {subhead ? <p className="section-head-sub">{str(subhead)}</p> : null}
      </Reveal>
    </div>
  )
}

/** A tile image: resolved media drawn through RevealImage (clip-path wipe), keeping alt/decorative rules. */
function Tile({ media, ratio, eager }: { media: ResolvedMedia | null; ratio: string; eager?: boolean }) {
  if (!media) return null
  return <RevealImage src={media.url} alt={media.decorative ? '' : media.alt} ratio={ratio} eager={eager} />
}

function StepImage({ image }: { image: MediaRef | undefined }) {
  return <Tile media={useMedia(image)} ratio="4 / 3" />
}
function StdImage({ image }: { image: MediaRef | undefined }) {
  return <Tile media={useMedia(image)} ratio="3 / 2" eager />
}

export function RitualStepsBlock({ block, anchor }: BlockProps) {
  const p = block.props
  const guide = useEntity('careGuides', str(p.guideId) || undefined)
  const steps = guide?.steps?.length
    ? guide.steps.map((s, i) => ({ id: `${guide.id ?? 'g'}-${i}`, n: s.label || pad2(i + 1), title: s.title, body: s.body, image: s.image }))
    : arr<{ id: string; n: string; title: string; body: string; image: MediaRef }>(p.steps)
  if (!steps.length) return null
  return (
    <Chapter label={p.chapterLabel ? str(p.chapterLabel) : undefined}>
      <Head kicker={p.kicker} headline={p.headline ?? guide?.title} subhead={p.subhead ?? guide?.intro} id={anchor} />
      <section className="ritual-steps" aria-label={`The ${steps.length} steps`}>
        {steps.map((s, i) => (
          <Reveal key={s.id ?? i} delay={i * .1}>
            <article>
              <StepImage image={s.image} />
              <span>{str(s.n)}</span>
              <h3>{str(s.title)}</h3>
              <p>{str(s.body)}</p>
            </article>
          </Reveal>
        ))}
      </section>
    </Chapter>
  )
}

export function ScrubFilmBlock({ block }: BlockProps) {
  const p = block.props
  const film = useMedia(p.film)
  const poster = useMedia(p.poster)
  const beats = arr<{ title: string; body: string }>(p.beats).filter((b) => typeof b.title === 'string')
  if (!film || beats.length < 1) return null
  return <ScrubFilm src={film.url} poster={poster?.url ?? film.poster ?? ''} label={str(p.label)} beats={beats.map((b) => ({ title: b.title, body: str(b.body) }))} />
}

export function MediaSplitBlock({ block }: BlockProps) {
  const p = block.props
  const media = useMedia(p.media)
  const poster = useMedia(p.poster)
  if (!media) return null
  const right = p.mediaSide === 'right'
  const cta = obj(p.cta) as { label?: string; action?: Action }
  return (
    <section className={`ritual-after${right ? ' ritual-after--right' : ''}`}>
      <div className="ritual-after-grid">
        <Reveal className="ritual-after-media">
          {media.kind === 'video'
            ? <MediaLoop src={media.url} poster={poster?.url ?? media.poster ?? ''} alt={poster?.alt || media.alt} />
            : <Img media={media} sizes="(min-width: 1024px) 50vw, 100vw" />}
          {p.caption ? <span>{str(p.caption)}</span> : null}
        </Reveal>
        <Reveal className="ritual-after-copy" delay={.15}>
          {p.kicker ? <p className="kicker">{str(p.kicker)}</p> : null}
          <h2><Lines text={str(p.headline)} /></h2>
          <p>{str(p.body)}</p>
          {cta.label && cta.action && resolveAction(cta.action).kind !== 'none' && (
            <Magnetic strength={.2}>
              <ActionLink action={cta.action} className="btn btn--ghost">{cta.label} <span className="arr" aria-hidden="true">↗</span></ActionLink>
            </Magnetic>
          )}
        </Reveal>
      </div>
    </section>
  )
}

export function StandardsGridBlock({ block, anchor }: BlockProps) {
  const p = block.props
  const items = arr<{ id: string; n: string; title: string; body: string; image: MediaRef }>(p.items)
  if (!items.length) return null
  return (
    <Chapter label={p.chapterLabel ? str(p.chapterLabel) : undefined}>
      <Head kicker={p.kicker} headline={p.headline} subhead={p.subhead} id={anchor} />
      <section className="standard-grid" aria-label={`Our ${items.length} standards`}>
        {items.map((s, i) => (
          <Reveal key={s.id ?? i} delay={i * .1}>
            <article>
              <StdImage image={s.image} />
              <span>{str(s.n)}</span>
              <h3>{str(s.title)}</h3>
              <p>{str(s.body)}</p>
            </article>
          </Reveal>
        ))}
      </section>
    </Chapter>
  )
}

function EvidenceItem({ item, i }: { item: { id: string; image: MediaRef; caption: string }; i: number }) {
  const m = useMedia(item.image)
  if (!m) return null
  return (
    <Reveal className="evidence-item" delay={i * .05}>
      <figure>
        <RevealImage src={m.url} alt={m.decorative ? '' : m.alt || item.caption} ratio="4 / 5" />
        <figcaption>{str(item.caption)}</figcaption>
      </figure>
    </Reveal>
  )
}

export function EvidenceRailBlock({ block }: BlockProps) {
  const p = block.props
  const railRef = useRef<HTMLElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const items = arr<{ id: string; image: MediaRef; caption: string }>(p.items)
  useEffect(() => {
    const rail = railRef.current
    const inner = innerRef.current
    if (!rail || !inner) return
    return bindScrollSlide(rail, inner)
  }, [items.length])
  if (!items.length) return null
  return (
    <section className="evidence-rail" ref={railRef} aria-label={str(p.kicker) || 'Evidence of the standard'}>
      <div className="evidence-sticky">
        <Reveal className="evidence-head">
          {p.kicker ? <p className="kicker">{str(p.kicker)}</p> : null}
          <h2><Lines text={str(p.headline)} /></h2>
        </Reveal>
        <div className="evidence-track">
          <div className="evidence-track__inner" ref={innerRef}>
            {items.map((item, i) => <EvidenceItem key={item.id ?? i} item={item} i={i} />)}
          </div>
        </div>
      </div>
    </section>
  )
}

export function AtelierFilmBlock({ block }: BlockProps) {
  const p = block.props
  const film = useMedia(p.film)
  const poster = useMedia(p.poster)
  if (!film) return null
  return (
    <section className="story-film" aria-label={str(p.label) || 'The atelier'}>
      <MediaLoop src={film.url} poster={poster?.url ?? film.poster ?? ''} alt={str(p.label) || poster?.alt || ''} />
      <div className="story-film-copy">
        <Reveal>
          {p.kicker ? <p className="kicker">{str(p.kicker)}</p> : null}
          <SplitText as="h2" lines={arr<string>(p.headlineLines).filter((s) => typeof s === 'string')} />
        </Reveal>
      </div>
    </section>
  )
}

export function ReelsRailBlock({ block, anchor }: BlockProps) {
  const p = block.props
  const { content, media } = useExperience()
  const ids = arr<string>(p.storyIds).filter((s) => typeof s === 'string')
  const reels: Reel[] = ids.flatMap((id, i) => {
    const s: Story | undefined = content.stories?.[id] ?? DEFAULT_CONTENT.stories?.[id]
    if (!s) return []
    const video = s.videoMediaId ? media({ mediaId: s.videoMediaId }) : s.videoSrc ? media({ local: s.videoSrc }) : null
    const poster = s.posterMediaId ? media({ mediaId: s.posterMediaId }) : s.posterSrc ? media({ local: s.posterSrc }) : null
    if (!video) return []
    return [{ src: video.url, poster: poster?.url ?? video.poster ?? '', n: pad2(i + 1), title: str(s.title), line: str(s.line), alt: str(s.alt) }]
  })
  if (!reels.length) return null
  return <StoriesBlock reels={reels} title={p.title ? str(p.title) : undefined} chapterLabel={p.chapterLabel ? str(p.chapterLabel) : undefined} anchor={anchor} />
}

export function JournalStackBlock({ block, anchor }: BlockProps) {
  const p = block.props
  const { content, media } = useExperience()
  const ids = arr<string>(p.noteIds).filter((s) => typeof s === 'string')
  const notes: JournalCard[] = ids.flatMap((id, i) => {
    const n: JournalNote | undefined = content.journal?.[id] ?? DEFAULT_CONTENT.journal?.[id]
    if (!n?.title) return []
    const img = n.imageMediaId ? media({ mediaId: n.imageMediaId }) : n.imageSrc ? media({ local: n.imageSrc }) : null
    if (!img) return []
    return [{
      id, kicker: n.kicker || `Field note ${pad2(i + 1)}`, read: `${n.readMinutes ?? 2} min read`, title: n.title, excerpt: str(n.excerpt),
      img: img.url, imgAlt: n.alt || img.alt, productId: n.productId ?? undefined,
      body: n.bodyMd?.trim() ? n.bodyMd : str(n.excerpt),
    }]
  })
  const fin = obj(p.finale) as { kicker?: string; title?: string; excerpt?: string; image?: MediaRef; productId?: string }
  const finImg = useMedia(fin.image)
  if (!notes.length) return null
  return (
    <JournalBlock
      notes={notes}
      finale={fin.title && finImg ? { kicker: fin.kicker, title: fin.title, excerpt: str(fin.excerpt), img: finImg.url, imgAlt: finImg.alt, productId: fin.productId } : undefined}
      headline={p.headline ? str(p.headline) : undefined}
      subhead={p.subhead ? str(p.subhead) : undefined}
      chapterLabel={p.chapterLabel ? str(p.chapterLabel) : undefined}
      anchor={anchor}
    />
  )
}
