import { createContext, useCallback, useContext, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type MouseEvent, type ReactNode } from 'react'
import type { Action } from './types'
import type { Product } from '../data/products'
import { hrefOf, resolveAction, type ResolvedAction } from './actions'

/** Everything a block needs from the shell: routing, the cart drawer, adding to the cart, signed-in state. */
export interface NavApi {
  navigate: (path: string) => void
  openCart: () => void
  scrollToAnchor: (id: string) => void
  addToCart: (product: Product) => void
  openAuth: (reason?: string) => void
  signedIn: boolean
}
const noop = () => {}
const Nav = createContext<NavApi>({ navigate: noop, openCart: noop, scrollToAnchor: noop, addToCart: noop, openAuth: noop, signedIn: false })
export const NavProvider = Nav.Provider
export const useNav = () => useContext(Nav)

/** Runs a resolved action (button-style CTAs). */
export function useRunAction() {
  const nav = useNav()
  return useCallback((r: ResolvedAction) => {
    switch (r.kind) {
      case 'internal': nav.navigate(r.path); break
      case 'anchor': nav.scrollToAnchor(r.id); break
      case 'cart': nav.openCart(); break
      case 'external': window.open(r.href, r.newTab ? '_blank' : '_self', 'noopener,noreferrer'); break
      case 'link': window.location.href = r.href; break
      default: break
    }
  }, [nav])
}

const plainClick = (e: MouseEvent) => !e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey

type CommonProps = { action?: Action | null; children: ReactNode; className?: string; onActivate?: () => void }
/**
 * A real link whenever the action has a destination (so middle-click, copy-link and screen readers work), a button for
 * "open cart", and plain text when the action does nothing. Internal links navigate client-side.
 */
export function ActionLink({ action, children, className, onActivate, ...rest }: CommonProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement> & ButtonHTMLAttributes<HTMLButtonElement>, 'children'>) {
  const run = useRunAction()
  const r = resolveAction(action)
  if (r.kind === 'none') return <span className={className}>{children}</span>
  if (r.kind === 'cart') {
    return <button type="button" className={className} onClick={() => { onActivate?.(); run(r) }} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>{children}</button>
  }
  const href = hrefOf(r)
  const external = r.kind === 'external'
  return (
    <a
      className={className}
      href={href}
      {...(external ? { target: r.newTab ? '_blank' : undefined, rel: 'noopener noreferrer' } : {})}
      onClick={(e) => {
        onActivate?.()
        if (r.kind === 'internal' || r.kind === 'anchor') { if (plainClick(e)) { e.preventDefault(); run(r) } }
      }}
      {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}
    >{children}</a>
  )
}
