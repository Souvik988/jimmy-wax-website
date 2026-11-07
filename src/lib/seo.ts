import { useEffect } from 'react'
import { isPreview, stripPreview } from './preview'

/**
 * Per-page head management for a client-rendered SPA: <title>, description, canonical, robots, Open Graph, Twitter
 * and JSON-LD. Tags are upserted (never duplicated) and removed again when a page stops asking for them.
 * Preview pages are always noindex.
 */
export interface HeadSpec {
  title: string
  description?: string
  canonicalPath?: string
  noindex?: boolean
  image?: string
  ogType?: 'website' | 'product' | 'article'
  jsonLd?: Array<Record<string, unknown>>
}

const MANAGED = 'data-jw-head'

function upsertMeta(attr: 'name' | 'property', key: string, content: string | undefined) {
  const sel = `meta[${attr}="${key}"]`
  let el = document.head.querySelector<HTMLMetaElement>(sel)
  if (content === undefined || content === '') { if (el?.hasAttribute(MANAGED)) el.remove(); return }
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); el.setAttribute(MANAGED, ''); document.head.appendChild(el) }
  el.setAttribute('content', content)
}

function upsertLink(rel: string, href: string | undefined) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!href) { if (el?.hasAttribute(MANAGED)) el.remove(); return }
  if (!el) { el = document.createElement('link'); el.rel = rel; el.setAttribute(MANAGED, ''); document.head.appendChild(el) }
  el.href = href
}

export function absoluteUrl(path: string): string {
  return new URL(path, window.location.origin).href
}

/** Applies a head spec; returns a cleanup that removes JSON-LD (other tags are overwritten by the next page). */
export function applyHead(spec: HeadSpec): () => void {
  document.title = spec.title
  const robots = spec.noindex || isPreview() ? 'noindex, nofollow' : undefined
  const canonical = absoluteUrl(`${spec.canonicalPath ?? window.location.pathname}${spec.canonicalPath ? '' : stripPreview(window.location.search)}`)
  upsertMeta('name', 'description', spec.description)
  upsertMeta('name', 'robots', robots)
  upsertLink('canonical', robots ? undefined : canonical)
  upsertMeta('property', 'og:title', spec.title)
  upsertMeta('property', 'og:description', spec.description)
  upsertMeta('property', 'og:type', spec.ogType ?? 'website')
  upsertMeta('property', 'og:url', canonical)
  upsertMeta('property', 'og:image', spec.image ? absoluteUrl(spec.image) : undefined)
  upsertMeta('name', 'twitter:card', spec.image ? 'summary_large_image' : 'summary')
  upsertMeta('name', 'twitter:title', spec.title)
  upsertMeta('name', 'twitter:description', spec.description)
  upsertMeta('name', 'twitter:image', spec.image ? absoluteUrl(spec.image) : undefined)
  const scripts: HTMLScriptElement[] = (spec.jsonLd ?? []).map((obj) => {
    const s = document.createElement('script')
    s.type = 'application/ld+json'
    s.setAttribute(MANAGED, '')
    // "<" is escaped so a string value can never close the script element
    s.textContent = JSON.stringify(obj).replace(/</g, '\\u003c')
    document.head.appendChild(s)
    return s
  })
  return () => scripts.forEach((s) => s.remove())
}

/** `titleTemplate` is e.g. "%s · Jimmy & Wax". */
export function applyTitleTemplate(template: string | undefined, title: string): string {
  const t = (template && template.includes('%s') ? template : '%s · Jimmy & Wax')
  return t.replace('%s', title)
}

export function useHead(spec: HeadSpec | null, deps: unknown[]) {
  useEffect(() => (spec ? applyHead(spec) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps)
}
