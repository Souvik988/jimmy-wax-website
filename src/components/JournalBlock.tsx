import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionTemplate, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react'
import { Reveal } from './fx/Reveal'
import type { Product } from '../data/products'
import { useProducts } from '../lib/catalog'
import { lockPageScroll } from '../lib/smoothScroll'
import { inr } from '../lib/api'
import { useNav } from '../lib/nav'
import { Markdown } from '../lib/markdown'
import { Lines } from '../lib/experience'

/**
 * Chapter 05 — The Journal, rebuilt as a scroll-driven 3D card stack
 * (mechanic adapted from the animated-cards-stack pattern to Motion v13 +
 * this design system): cards sit in a perspective deck; each one flies up,
 * settling its tilt, as the user scrolls — then the next is revealed.
 * E-commerce first: every card carries its featured product with price and a
 * working add-to-care-list action. Images are frames from the brand films;
 * copy is honest care guidance.
 */
export interface JournalCard { id: string; kicker: string; read: string; title: string; excerpt: string; img: string; imgAlt: string; productId?: string; body: string }
export interface JournalFinale { kicker?: string; title: string; excerpt: string; img: string; imgAlt: string; productId?: string }

type StackCard = {
  card: React.ReactNode
  tilt: number
}

function StackCard({ i, n, tilt, smooth, children, onOpen }: {
  i: number
  n: number
  tilt: number
  smooth: MotionValue<number>
  children: React.ReactNode
  onOpen?: () => void
}) {
  // front card flies first; exiting cards dissolve — the behind card is the
  // only thing left on stage, so the order always reads clearly
  const start = (i + 1) / (n + 1)
  const end = Math.min(start + 0.34, 0.97)
  const ease = (t: number) => 1 - Math.pow(1 - t, 3) // organic lift-off, not a linear slide (v13 easing fn)
  const y = useTransform(smooth, [start, end], ['0%', '-215%'], { ease })
  // the card lifts toward the camera as it leaves (scale up, like being picked)
  const scale = useTransform(smooth, [start, end], [1, 1.08], { ease })
  // a flick: the exit rotates further than the enter tilt, like a dealt card
  const rotate = useTransform(smooth, [start, end], [tilt, tilt - 13], { ease })
  // soft dissolve only in the last stretch — never a cheap mid-air fade
  const opacity = useTransform(smooth, [end - 0.05, end], [1, 0])
  const transform = useMotionTemplate`translateZ(${(i + 1) * 16}px) translateY(${y}) rotate(${rotate}deg) scale(${scale})`
  return (
    <motion.div
      className="journal-stack__card"
      style={{ top: i * 12, zIndex: (n - i) * 14, transform, opacity, backfaceVisibility: 'hidden' as const }}
      onClick={onOpen}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onKeyDown={onOpen ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen() } } : undefined}
    >
      {children}
    </motion.div>
  )
}

function CommerceRow({ product, onAdd, dark = true }: { product?: Product; onAdd: (p: Product) => void; dark?: boolean }) {
  if (!product) return null
  return (
    <div className={`journal-commerce${dark ? '' : ' journal-commerce--light'}`}>
      <img className="journal-commerce__thumb" src={product.image} alt="" width="96" height="120" loading="lazy" decoding="async" />
      <div className="journal-commerce__meta">
        <span className="journal-commerce__name">{product.name}</span>
        <span className="journal-commerce__price">{inr(product.pricePaise)} <small>{product.size} · {product.note}</small></span>
      </div>
      <button
        className="journal-commerce__add"
        type="button"
        disabled={!product.available}
        onClick={(e) => { e.stopPropagation(); onAdd(product) }}
      >
        {product.available ? '+ Care list' : 'Unavailable'}
      </button>
    </div>
  )
}

export function JournalBlock({ notes, finale, headline, subhead, chapterLabel, anchor }: {
  notes: JournalCard[]
  finale?: JournalFinale
  headline?: string
  subhead?: string
  chapterLabel?: string
  anchor?: string
}) {
  const reduce = useReducedMotion()
  const products = useProducts()
  const onAdd = useNav().addToCart
  const find = (id?: string) => (id ? products.find((p) => p.id === id) : undefined)
  const closeRef = useRef<HTMLButtonElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const runwayRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState<JournalCard | null>(null)
  const { scrollYProgress } = useScroll({
    target: reduce ? undefined : runwayRef, // reduced motion renders no runway; a dangling ref target would throw
    offset: ['start center', 'end end'],
  })
  // one shared spring: however fast the visitor scrolls, the deck moves at a
  // constant readable pace and settles exactly (scroll normalization)
  const smooth = useSpring(scrollYProgress, { stiffness: 110, damping: 26, restDelta: 0.001 })

  useEffect(() => {
    if (!open) return
    openerRef.current = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(null) }
    window.addEventListener('keydown', onKey)
    lockPageScroll(true)
    return () => {
      window.removeEventListener('keydown', onKey)
      lockPageScroll(false)
      openerRef.current?.focus?.()
    }
  }, [open])

  const cardBody = (a: JournalCard) => (
    <>
      <div className="journal-stack__media"><img src={a.img} alt={a.imgAlt} width="1200" height="800" loading="lazy" decoding="async" /></div>
      <div className="journal-stack__body">
        <span className="journal-card__kicker">{a.kicker} · {a.read}</span>
        <h3>{a.title}</h3>
        <p>{a.excerpt}</p>
      </div>
      <CommerceRow product={find(a.productId)} onAdd={onAdd} />
    </>
  )

  return (
    <div className="chapter-rail">
      {chapterLabel && <span className="chapter-rail__label" aria-hidden="true">{chapterLabel}</span>}
      <div className="chapter-rail__body">
        <div className="section-head" id={anchor}>
          <Reveal>
            <p className="kicker">The Journal</p>
            <h2>{headline ? <Lines text={headline} /> : 'From the journal'}</h2>
            {subhead && <p className="section-head-sub">{subhead}</p>}
          </Reveal>
        </div>

        {reduce ? (
          <section className="journal-grid" aria-label="Journal articles">
            {notes.map((a) => (
              <Reveal key={a.id}>
                <article className="journal-card" onClick={() => setOpen(a)}>
                  <div className="journal-card__media"><img src={a.img} alt={a.imgAlt} width="1200" height="800" loading="lazy" decoding="async" /></div>
                  <div className="journal-card__body">
                    <span className="journal-card__kicker">{a.kicker} · {a.read}</span>
                    <h3>{a.title}</h3>
                    <p>{a.excerpt}</p>
                  </div>
                  <CommerceRow product={find(a.productId)} onAdd={onAdd} dark={false} />
                </article>
              </Reveal>
            ))}
          </section>
        ) : (
          <div className="journal-runway" ref={runwayRef}>
            <div className="journal-sticky">
              <p className="journal-stack__hint" aria-hidden="true">Scroll — the deck flies</p>
              <div className="journal-stage">
                {notes.map((a, i) => (
                  <StackCard key={a.id} i={i} n={notes.length + 1} tilt={16 - i * 4} smooth={smooth} onOpen={() => setOpen(a)}>
                    {cardBody(a)}
                  </StackCard>
                ))}
                {finale && <StackCard i={notes.length} n={notes.length + 1} tilt={4} smooth={smooth}>
                  <div className="journal-stack__media"><img src={finale.img} alt={finale.imgAlt} width="1200" height="800" loading="lazy" decoding="async" /></div>
                  <div className="journal-stack__body">
                    <span className="journal-card__kicker">{finale.kicker}</span>
                    <h3>{finale.title}</h3>
                    <p>{finale.excerpt}</p>
                  </div>
                  <CommerceRow product={find(finale.productId)} onAdd={onAdd} />
                </StackCard>}
              </div>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div className="journal-reader" role="dialog" aria-modal="true" aria-label={open.title}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .25 }}>
            <button className="journal-reader__scrim" type="button" aria-label="Close article" onClick={() => setOpen(null)} />
            <motion.article className="journal-reader__panel"
              initial={{ opacity: 0, y: 34, scale: .985 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: .99 }} transition={{ duration: .32, ease: [.22, 1, .36, 1] }}>
              <button ref={closeRef} className="journal-reader__close" type="button" onClick={() => setOpen(null)} aria-label="Close">×</button>
              <span className="journal-card__kicker">{open.kicker} · {open.read}</span>
              <h3>{open.title}</h3>
              <div className="journal-reader__media"><img src={open.img} alt={open.imgAlt} width="1200" height="800" /></div>
              <Markdown source={open.body} />
              <CommerceRow product={find(open.productId)} onAdd={onAdd} />
              <p className="journal-reader__sign">— Jimmy &amp; Wax · Twinkle Shine</p>
            </motion.article>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
