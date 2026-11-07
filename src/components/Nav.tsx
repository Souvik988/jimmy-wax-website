import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ActionLink } from '../lib/nav'
import { resolveAction } from '../lib/actions'
import { useBrand, useNavLinks } from '../lib/chrome'
import { Img } from '../blocks/util'

/** Header for every page except the one-page home. Links, cart label and brand come from the published bundle. */
export function Nav({ route, cartCount, onNavigate, onOpenCart, onAccount, signedIn }: {
  route: string
  cartCount: number
  onNavigate: (path: string) => void
  onOpenCart: () => void
  onAccount: () => void
  signedIn: boolean
}) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const { links, cartLabel } = useNavLinks('page')
  const brand = useBrand()
  const path = route.split('?')[0]
  const isActive = (a: (typeof links)[number]['action']) => {
    const r = resolveAction(a)
    return r.kind === 'internal' && r.path !== '/' && (path === r.path || path.startsWith(`${r.path}/`))
  }
  return (
    <header className={`commerce-nav${scrolled ? ' is-scrolled' : ''}`}>
      <button className="commerce-brand" type="button" aria-label={`${brand.wordmark} — home`} onClick={() => onNavigate('/')}>
        {brand.markImage ? <Img media={{ ...brand.markImage, decorative: true, alt: '' }} eager className="brand-mark-img" /> : <span>{brand.mark}</span>}
        {brand.wordmarkImage ? <Img media={brand.wordmarkImage} eager className="brand-wordmark-img" /> : ` ${brand.wordmark}`}
      </button>
      <nav aria-label="Main navigation">
        {links.map((l) => (
          <ActionLink key={l.id} action={l.action} className={`nav-link${isActive(l.action) ? ' is-active' : ''}`} aria-current={isActive(l.action) ? 'page' : undefined}>{l.label}</ActionLink>
        ))}
      </nav>
      <button className="nav-link nav-account" type="button" onClick={onAccount}>{signedIn ? 'Orders' : 'Sign in'}</button>
      <button className="commerce-cart" type="button" onClick={onOpenCart} aria-label={`${cartLabel}, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}>
        {cartLabel}
        <span aria-hidden="true">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={cartCount}
              initial={{ y: -14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 14, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 520, damping: 32 }}
              style={{ display: 'block' }}
            >{cartCount}</motion.span>
          </AnimatePresence>
        </span>
      </button>
    </header>
  )
}
