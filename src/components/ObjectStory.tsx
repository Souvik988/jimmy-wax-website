import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Reveal } from './fx/Reveal'
import type { Product } from '../data/products'

/**
 * Scroll-driven product story: the media frame stays pinned while each step
 * scrolls into view, crossfading to that step's macro crop. Steps carry their
 * own image on mobile (the sticky column is desktop-only). Crops come from the
 * supplied product photography, so every detail is product-true.
 */
export function ObjectStory({ product }: { product: Product }) {
  const reduce = useReducedMotion()
  const [active, setActive] = useState(0)
  return (
    <section className="object-story" aria-label={`${product.name} in use`}>
      <Reveal>
        <p className="kicker">The object, in use</p>
        <h2 className="object-story-title">From tin to toe,<br />one gesture.</h2>
      </Reveal>
      <div className="object-story-grid">
        <div className="object-story-media" aria-hidden="true">
          <AnimatePresence mode="sync" initial={false}>
            <motion.img
              key={active}
              src={product.story[active].image}
              alt=""
              initial={{ opacity: 0, scale: reduce ? 1 : 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : .55, ease: [.16, 1, .3, 1] }}
            />
          </AnimatePresence>
          <span className="object-story-index">{String(active + 1).padStart(2, '0')} / {String(product.story.length).padStart(2, '0')}</span>
        </div>
        <div className="object-story-steps">
          {product.story.map((block, i) => (
            <motion.div
              className="object-story-step"
              key={block.title}
              onViewportEnter={() => setActive(i)}
              viewport={{ margin: '-45% 0px -45% 0px' }}
            >
              <img className="object-story-step-media" src={block.image} alt="" loading="lazy" decoding="async" />
              <span>{String(i + 1).padStart(2, '0')}</span>
              <h3>{block.title}</h3>
              <p>{block.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
