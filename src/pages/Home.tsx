import { useEffect, useState } from 'react'
import { motion, useScroll, useSpring } from 'motion/react'
import { Footer } from '../components/Footer'
import { BlockList } from '../blocks/registry'
import { DEFAULT_HOME } from '../blocks/defaults'
import { Img } from '../blocks/util'
import { ActionLink, useNav } from '../lib/nav'
import { useBrand, useNavLinks } from '../lib/chrome'
import { useExperience } from '../lib/experience'
import { usePageSeo } from '../lib/pageSeo'

function HomeNav({ cartCount, onOpenCart, onAccount, signedIn }: { cartCount: number; onOpenCart: () => void; onAccount: () => void; signedIn: boolean }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  const { links, cartLabel } = useNavLinks('home')
  const brand = useBrand()
  return (
    <header className={`home-nav${scrolled ? ' is-scrolled' : ''}`}>
      <a className="home-nav__brand" href="#top" aria-label={`${brand.wordmark} — back to top`} onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
        {brand.markImage ? <Img media={{ ...brand.markImage, decorative: true, alt: '' }} eager className="brand-mark-img" /> : <span>{brand.mark}</span>}
        {brand.wordmarkImage ? <Img media={brand.wordmarkImage} eager className="brand-wordmark-img" /> : <> {brand.wordmark}</>}
      </a>
      <nav aria-label="Page sections">
        {links.map((l) => <ActionLink key={l.id} action={l.action} className="nav-link">{l.label}</ActionLink>)}
      </nav>
      <button className="nav-link nav-account" type="button" onClick={onAccount}>{signedIn ? 'Orders' : 'Sign in'}</button>
      <button className="commerce-cart" type="button" onClick={onOpenCart} aria-label={`${cartLabel}, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}>{cartLabel} <span aria-hidden="true">{cartCount}</span></button>
    </header>
  )
}

/** The whole experience on one infinite scroll. The published `home` page decides the blocks; the built-in list is the fallback. */
export function Home({ onNavigate, onOpenCart, count, onAccount, signedIn }: { onNavigate: (path: string) => void; onOpenCart: () => void; count: number; onAccount: () => void; signedIn: boolean }) {
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 110, damping: 30, restDelta: 0.001 })
  const exp = useExperience()
  const nav = useNav()
  const published = exp.page('home')
  const blocks = published && published.length ? published : DEFAULT_HOME
  usePageSeo({ key: 'home', title: 'Jimmy & Wax — Twinkle Shine', verbatimTitle: true, description: 'Considered care for leather’s finishing touch.', path: '/', isHome: true })

  return (
    <motion.div className="route-veil-fade" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .4 }}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <motion.div className="app-progress" style={{ scaleX: progress }} aria-hidden="true" />
      <HomeNav cartCount={count} onOpenCart={onOpenCart} onAccount={onAccount} signedIn={signedIn} />
      <main id="main-content" tabIndex={-1}>
        <BlockList blocks={blocks} />
      </main>
      <Footer onNavigate={(path) => {
        const sections: Record<string, string> = { '/shop': 'collection', '/ritual': 'ritual', '/story': 'standard' }
        if (path === '/') window.scrollTo({ top: 0, behavior: 'smooth' })
        else if (sections[path] && document.getElementById(sections[path]!)) nav.scrollToAnchor(sections[path]!)
        else onNavigate(path)
      }} />
    </motion.div>
  )
}
