import { useEffect, useState, type CSSProperties } from 'react'
import { Magnetic } from '../components/fx/Magnetic'
import { Marquee } from '../components/fx/Marquee'
import { Reveal } from '../components/fx/Reveal'
import { SplitText } from '../components/fx/SplitText'
import { ChapterMark } from '../components/ChapterMark'
import { ScrubHero } from '../components/ScrubHero'
import { PromoBlock } from '../components/PromoBlock'
import { ProductCard } from '../components/ProductCard'
import { Markdown } from '../lib/markdown'
import { Lines } from '../lib/experience'
import { ActionLink } from '../lib/nav'
import { resolveAction } from '../lib/actions'
import { useCatalog } from '../lib/catalog'
import type { Action, Block } from '../lib/types'
import { DEFAULT_HERO } from './defaults'
import { arr, inStockOrAll, Img, obj, str, useEntity, useMedia, useMediaById, useProductList } from './util'

export interface BlockProps { block: Block; anchor?: string }

const useIsMobile = () => {
  const q = '(max-width: 720px)'
  const [m, setM] = useState(() => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(q).matches : false))
  useEffect(() => {
    if (!window.matchMedia) return
    const mq = window.matchMedia(q)
    const on = () => setM(mq.matches)
    mq.addEventListener?.('change', on)
    return () => mq.removeEventListener?.('change', on)
  }, [])
  return m
}

interface Cta { id?: string; label: string; action: Action; variant?: string }
const ctaList = (v: unknown): Cta[] => arr<Cta>(v).filter((c) => typeof c.label === 'string' && c.action && typeof c.action === 'object')

/** Up to two call-to-action buttons; the arrow follows what the action does. */
export function Ctas({ ctas, className }: { ctas: Cta[]; className: string }) {
  if (!ctas.length) return null
  return (
    <div className={className}>
      {ctas.map((c, i) => {
        const r = resolveAction(c.action)
        const arrow = r.kind === 'anchor' ? (r.id === 'top' ? '↑' : '↓') : '↗'
        return (
          <Magnetic key={c.id ?? i} strength={i === 0 ? .24 : .2}>
            <ActionLink action={c.action} className={`btn btn--${c.variant === 'ghost' ? 'ghost' : 'solid'}`}>{c.label} <span className="arr" aria-hidden="true">{arrow}</span></ActionLink>
          </Magnetic>
        )
      })}
    </div>
  )
}

export function HeroFilmBlock({ block }: BlockProps) {
  const p = block.props
  const film = obj(p.film)
  const isMobile = useIsMobile()
  const desktop = useMedia(film.desktop as never)
  const mobile = useMedia(film.mobile as never)
  const poster = useMedia(film.poster as never)
  const dflt = DEFAULT_HERO.props.film
  const fallbackFilm = useMedia(dflt.desktop)
  const fallbackPoster = useMedia(dflt.poster)
  const src = (isMobile ? mobile?.url : undefined) ?? desktop?.url ?? fallbackFilm?.url ?? ''
  const posterUrl = poster?.url ?? desktop?.poster ?? fallbackPoster?.url ?? ''
  const label = poster?.alt || str(p.headline).replace(/\n/g, ' ') || 'Jimmy and Wax'
  return (
    <ScrubHero src={src} poster={posterUrl} label={label} scrubScroll={typeof p.scrubScroll === 'number' ? p.scrubScroll : 2.6}>
      {p.kicker && <p className="kicker">{str(p.kicker)}</p>}
      <h1><Lines text={str(p.headline)} /></h1>
      {p.subhead && <p>{str(p.subhead)}</p>}
      <Ctas ctas={ctaList(p.ctas)} className="hero-ctas" />
    </ScrubHero>
  )
}

export function MarqueeBlock({ block }: BlockProps) {
  const items = arr<string>(block.props.items).filter((s) => typeof s === 'string')
  if (!items.length) return null
  return <section className="proof-band" aria-label="Jimmy and Wax standards"><Marquee items={items} /></section>
}

export function ChapterMarkBlock({ block }: BlockProps) {
  return <ChapterMark index={str(block.props.index)} title={str(block.props.title)} />
}

export function CollectionGridBlock({ block, anchor }: BlockProps) {
  const p = block.props
  const { status, reload, products } = useCatalog()
  const list = useProductList(block.resolved?.productIds)
  const limit = typeof p.limit === 'number' ? p.limit : undefined
  const shown = limit ? list.slice(0, limit) : list
  return (
    <div>
      <div className="section-head" id={anchor}>
        <Reveal>
          {p.kicker && <p className="kicker">{str(p.kicker)}</p>}
          <h2><Lines text={str(p.headline)} /></h2>
          {p.subhead && <p className="section-head-sub">{str(p.subhead)}</p>}
        </Reveal>
      </div>
      <section className="collection" aria-label={str(p.kicker) || 'The collection'}>
        {status === 'error' && products.length === 0 && (
          <p className="shop-state">The collection could not be loaded. <button className="link-button" type="button" onClick={reload}>Try again</button></p>
        )}
        {status === 'loading' && <p className="shop-state" role="status">Loading the collection…</p>}
        <div className="product-grid">
          {shown.map((product, index) => (
            <Reveal key={product.id} delay={index * .08} y={44}>
              <ProductCard product={product} index={index} plain={p.cardStyle === 'plain'} hoverFilm={p.hoverFilm !== false} />
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  )
}

export function ProductGridBlock({ block }: BlockProps) {
  const p = block.props
  const { status, reload, products } = useCatalog()
  const list = inStockOrAll(useProductList(block.resolved?.productIds))
  const limit = typeof p.limit === 'number' ? p.limit : 9
  const cols = Math.min(4, Math.max(2, typeof p.columns === 'number' ? Math.round(p.columns) : 3))
  const shown = list.slice(0, limit)
  return (
    <section className="jw-product-grid" aria-label={str(p.title) || 'Products'}>
      {p.title && <Reveal><h2 className="jw-product-grid__title">{str(p.title)}</h2></Reveal>}
      {status === 'error' && products.length === 0 && (
        <p className="shop-state">The collection could not be loaded. <button className="link-button" type="button" onClick={reload}>Try again</button></p>
      )}
      <div className="product-grid jw-product-grid__grid" style={{ '--jw-cols': cols } as CSSProperties}>
        {shown.map((product, index) => (
          <Reveal key={product.id} delay={index * .06} y={36}>
            <ProductCard product={product} index={index} />
          </Reveal>
        ))}
      </div>
    </section>
  )
}

export function PromoFilmBlock({ block }: BlockProps) {
  const p = block.props
  const video = useMedia(p.video)
  const poster = useMedia(p.poster)
  if (!video) return null
  return <PromoBlock kicker={p.kicker ? str(p.kicker) : undefined} lines={arr<string>(p.headlineLines).filter((s) => typeof s === 'string')} video={video.url} poster={poster?.url ?? video.poster} caption={p.caption ? str(p.caption) : undefined} />
}

export function ClosingCtaBlock({ block }: BlockProps) {
  const p = block.props
  const media = useMedia(p.media)
  const lines = arr<string>(p.headlineLines).filter((s) => typeof s === 'string')
  return (
    <section className="closing-note">
      <div className="closing-grid">
        <div className="closing-copy">
          {p.kicker && <p className="kicker">{str(p.kicker)}</p>}
          <SplitText as="h2" lines={lines} />
          <Ctas ctas={ctaList(p.ctas)} className="closing-actions" />
          {p.footnote && <p className="closing-note-foot">{str(p.footnote)}</p>}
        </div>
        {media && (
          <Reveal className="closing-media" delay={.2}>
            <div className="closing-media-still"><Img media={media} sizes="(min-width: 1024px) 45vw, 100vw" /></div>
            {p.caption && <span className="closing-media-cap">{str(p.caption)}</span>}
          </Reveal>
        )}
      </div>
    </section>
  )
}

export function AnnouncementBarBlock({ block }: BlockProps) {
  const p = block.props
  const key = `jw-dismissed-${block.id}`
  const [gone, setGone] = useState(() => { try { return sessionStorage.getItem(key) === '1' } catch { return false } })
  if (gone) return null
  const tone = p.tone === 'promo' || p.tone === 'warning' ? p.tone : 'info'
  const body = <span>{str(p.text)}</span>
  return (
    <div className={`store-banner store-banner--${tone}`} role="status">
      {p.action && resolveAction(p.action as Action).kind !== 'none' ? <ActionLink action={p.action as Action} className="store-banner__link">{body}</ActionLink> : body}
      {p.dismissible !== false && (
        <button type="button" className="store-banner__close" aria-label="Dismiss announcement" onClick={() => { setGone(true); try { sessionStorage.setItem(key, '1') } catch { /* private mode */ } }}>×</button>
      )}
    </div>
  )
}

export function SpacerBlock({ block }: BlockProps) {
  const h = typeof block.props.height === 'number' ? Math.min(160, Math.max(8, block.props.height)) : 40
  return <div className="jw-spacer" style={{ height: h }} aria-hidden="true" />
}

export function RichTextBlock({ block }: BlockProps) {
  return <section className="jw-rich"><Markdown source={str(block.props.markdown)} /></section>
}

export function ImageBlock({ block }: BlockProps) {
  const p = block.props
  const media = useMedia(p.image)
  if (!media) return null
  const img = <Img media={media} sizes="(min-width: 1024px) 80vw, 100vw" />
  const hasAction = p.action && resolveAction(p.action as Action).kind !== 'none'
  return (
    <Reveal>
      <figure className="jw-image">
        {hasAction ? <ActionLink action={p.action as Action} className="jw-image__link">{img}</ActionLink> : img}
        {p.caption && <figcaption>{str(p.caption)}</figcaption>}
      </figure>
    </Reveal>
  )
}

export function FaqBlock({ block }: BlockProps) {
  const group = useEntity('faqGroups', str(block.props.groupId))
  const items = arr<{ q: string; aMd: string }>(group?.items).filter((i) => typeof i.q === 'string' && typeof i.aMd === 'string')
  if (!items.length) return null
  return (
    <section className="jw-faq" aria-label={group?.title || 'Frequently asked questions'}>
      {group?.title && <h2 className="jw-faq__title">{group.title}</h2>}
      <div className="jw-faq__list">
        {items.map((it, i) => (
          <details key={i} className="jw-faq__item">
            <summary>{it.q}</summary>
            <Markdown source={it.aMd} />
          </details>
        ))}
      </div>
    </section>
  )
}

function TestimonialCard({ id }: { id: string }) {
  const t = useEntity('testimonials', id)
  const avatar = useMediaById(t?.avatarMediaId ?? undefined)
  const video = useMediaById(t?.videoMediaId ?? undefined)
  const poster = useMediaById(t?.posterMediaId ?? undefined)
  if (!t?.quote) return null
  const rating = Math.min(5, Math.max(0, Math.round(t.rating ?? 0)))
  return (
    <figure className="jw-testimonial">
      {video && <video className="jw-testimonial__video" src={video.url} poster={poster?.url ?? video.poster} controls preload="none" playsInline />}
      {rating > 0 && <p className="jw-testimonial__stars" role="img" aria-label={`${rating} out of 5`}>{'★'.repeat(rating)}<span aria-hidden="true">{'☆'.repeat(5 - rating)}</span></p>}
      <blockquote><p>{t.quote}</p></blockquote>
      <figcaption>
        {avatar && <Img media={{ ...avatar, decorative: true, alt: '' }} sizes="48px" className="jw-testimonial__avatar" />}
        <span><strong>{t.name}</strong>{t.city ? <small>{t.city}</small> : null}</span>
      </figcaption>
    </figure>
  )
}

export function TestimonialsBlock({ block }: BlockProps) {
  const ids = arr<string>(block.props.testimonialIds).filter((s) => typeof s === 'string')
  const carousel = block.props.layout === 'carousel'
  if (!ids.length) return null
  return (
    <section className={`jw-testimonials jw-testimonials--${carousel ? 'carousel' : 'grid'}`} aria-label="What customers say">
      {ids.map((id) => <TestimonialCard key={id} id={id} />)}
    </section>
  )
}
