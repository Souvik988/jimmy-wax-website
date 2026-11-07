import type { Action } from './types'
import { withPreview } from './preview'

/**
 * Turns a Studio `Action` into something the storefront may safely do. Never produces `javascript:` / `data:` URLs
 * and never navigates to an arbitrary destination except an explicit absolute https URL (opened with noopener).
 * Unknown or malformed actions resolve to `none`.
 */
export type ResolvedAction =
  | { kind: 'none' }
  | { kind: 'internal'; path: string }
  | { kind: 'anchor'; id: string }
  | { kind: 'cart' }
  | { kind: 'external'; href: string; newTab: boolean }
  | { kind: 'link'; href: string }

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/
const ANCHOR = /^[a-z0-9-]{1,60}$/
const PAGE_KEY = /^[a-z0-9:_-]{1,80}$/
const ROUTES = new Set(['/', '/shop', '/ritual', '/story'])
const NONE: ResolvedAction = { kind: 'none' }

const SCREEN_ROUTES: Record<string, ResolvedAction> = {
  home: { kind: 'internal', path: '/' },
  categories: { kind: 'internal', path: '/shop' },
  search: { kind: 'internal', path: '/shop' },
  cart: { kind: 'cart' },
  orders: { kind: 'internal', path: '/orders' },
  profile: { kind: 'internal', path: '/account' },
  addresses: { kind: 'internal', path: '/account/addresses' },
  care_guide: { kind: 'internal', path: '/ritual' },
  help: { kind: 'internal', path: '/support' },
  about: { kind: 'internal', path: '/story' },
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '')

export function resolveAction(action: Action | null | undefined): ResolvedAction {
  if (!action || typeof action !== 'object') return NONE
  switch (action.type) {
    case 'product': {
      const id = str(action.productId)
      return SLUG.test(id) ? { kind: 'internal', path: `/shop/${id}` } : NONE
    }
    case 'collection': return SLUG.test(str(action.slug)) ? { kind: 'internal', path: '/shop?collection='+encodeURIComponent(str(action.slug)) } : NONE
    case 'category': return SLUG.test(str(action.categoryId)) ? { kind: 'internal', path: '/shop?category='+encodeURIComponent(str(action.categoryId)) } : NONE
    case 'page': {
      const key = str(action.pageKey)
      if (!PAGE_KEY.test(key)) return NONE
      if (key === 'home') return { kind: 'internal', path: '/' }
      if (key === 'shop' || key === 'product') return { kind: 'internal', path: '/shop' }
      if (key === 'ritual' || key === 'story') return { kind: 'internal', path: `/${key}` }
      const m = /^(custom|product):([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(key)
      if (m) return { kind: 'internal', path: m[1] === 'custom' ? `/custom/${m[2]}` : `/shop/${m[2]}` }
      return NONE
    }
    case 'screen': return SCREEN_ROUTES[str(action.screen)] ?? NONE
    case 'route': return ROUTES.has(str(action.path)) ? { kind: 'internal', path: str(action.path) } : NONE
    case 'anchor': return ANCHOR.test(str(action.id)) ? { kind: 'anchor', id: str(action.id) } : NONE
    case 'url': return resolveUrl(str(action.url), action.newTab === true)
    case 'tel': {
      const v = str(action.value)
      return /^\+?[0-9 ()-]{7,20}$/.test(v) ? { kind: 'link', href: `tel:${v.replace(/[^\d+]/g, '')}` } : NONE
    }
    case 'mailto': {
      const v = str(action.value)
      return v.length <= 200 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) && !/[?&<>"'\\]/.test(v) ? { kind: 'link', href: `mailto:${v}` } : NONE
    }
    case 'whatsapp': {
      const v = str(action.value)
      return /^\+?[0-9]{8,15}$/.test(v) ? { kind: 'external', href: `https://wa.me/${v.replace('+', '')}`, newTab: true } : NONE
    }
    default: return NONE
  }
}

/** Only absolute https URLs without credentials. A same-site https URL to one of our routes becomes internal. */
function resolveUrl(raw: string, newTab: boolean): ResolvedAction {
  if (!raw || raw.length > 500 || /[\u0000-\u001f\s\\]/.test(raw)) return NONE
  let u: URL
  try { u = new URL(raw) } catch { return NONE }
  if (u.protocol !== 'https:' || u.username || u.password || !u.hostname) return NONE
  if (typeof window !== 'undefined' && u.origin === window.location.origin && /^\/(shop|ritual|story|custom)(\/|$)|^\/$/.test(u.pathname)) {
    return { kind: 'internal', path: u.pathname + u.search + u.hash }
  }
  return { kind: 'external', href: u.href, newTab }
}

/** The href to render for a resolved action (the preview token is carried on internal paths). */
export function hrefOf(r: ResolvedAction): string | undefined {
  switch (r.kind) {
    case 'internal': return withPreview(r.path)
    case 'anchor': return `#${r.id}`
    case 'external':
    case 'link': return r.href
    default: return undefined
  }
}
