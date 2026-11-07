import { Magnetic } from '../components/fx/Magnetic'
import { Reveal } from '../components/fx/Reveal'
import { SplitText } from '../components/fx/SplitText'
import { BlockList } from '../blocks/registry'
import { DEFAULT_STORY } from '../blocks/defaults'
import { usePageSeo } from '../lib/pageSeo'
import { usePublishedBlocks } from './Pages'

export function Story({ onNavigate }: { onNavigate: (path: string) => void }) {
  const published = usePublishedBlocks('story')
  usePageSeo({ key: 'story', title: 'Our standard', description: 'Why Jimmy & Wax exists: the quiet care that makes a good shoe feel considered again.', path: '/story' })
  if (published) return <div className="jw-custom-page"><BlockList blocks={published} /></div>
  return (
    <>
      <section className="commerce-hero story-hero">
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="kicker">The Jimmy &amp; Wax standard</p>
            <SplitText as="h1" immediate delay={.1} lines={['Make the final', 'gesture count.']} />
            <Reveal delay={.4}>
              <p>Jimmy &amp; Wax exists for the moment after a shoe is already good: the quiet care that makes it feel considered again.</p>
            </Reveal>
          </div>
          <Reveal className="hero-visual" delay={.25}>
            <img src="/media/products/story/twinkle-shine-care-kit-2.jpg" alt="The complete care spread photographed from above" loading="lazy" decoding="async" />
            <span>The spread · supplied photography</span>
          </Reveal>
        </div>
      </section>
      <BlockList blocks={DEFAULT_STORY} />
      <section className="story-close">
        <Reveal>
          <p className="kicker">The future of the finish</p>
          <h2>Keep what lasts.<br />Make it luminous.</h2>
          <Magnetic strength={.2}>
            <button type="button" onClick={() => onNavigate('/shop')}>Enter the collection <span aria-hidden="true">↗</span></button>
          </Magnetic>
        </Reveal>
      </section>
    </>
  )
}
