import { SplitText } from '../components/fx/SplitText'
import { Reveal } from '../components/fx/Reveal'
import { BlockList } from '../blocks/registry'
import { DEFAULT_RITUAL } from '../blocks/defaults'
import { usePageSeo } from '../lib/pageSeo'
import { usePublishedBlocks } from './Pages'

export function Ritual() {
  const published = usePublishedBlocks('ritual')
  usePageSeo({ key: 'ritual', title: 'The ritual', description: 'A three-minute reset: brush, apply, reveal. The Jimmy & Wax care ritual for leather.', path: '/ritual' })
  if (published) return <div className="jw-custom-page"><BlockList blocks={published} /></div>
  return (
    <>
      <section className="commerce-hero ritual-hero">
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="kicker">A three-minute reset</p>
            <SplitText as="h1" immediate delay={.1} lines={['Brush.', 'Apply.', 'Reveal.']} />
            <Reveal delay={.4}>
              <p>The Jimmy &amp; Wax care ritual is intentionally short: clean the surface, build a light coat, and buff until the leather catches light.</p>
            </Reveal>
          </div>
          <Reveal className="hero-visual" delay={.25}>
            <img src="/media/products/story/twinkle-shine-refill-2.jpg" alt="Refill polish poured onto an application sponge" loading="lazy" decoding="async" />
            <span>The pour · supplied photography</span>
          </Reveal>
        </div>
      </section>
      <BlockList blocks={DEFAULT_RITUAL} />
    </>
  )
}
