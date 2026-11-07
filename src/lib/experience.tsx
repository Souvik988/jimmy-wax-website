import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Announcement, Block, Bundle, Chrome, Content, MediaRef, Navigation, PageDoc, Seo } from './types'
import { resolveMedia, type ResolvedMedia } from './media'
import { applyTokens, loadFonts } from './tokens'
import { getPreviewToken } from './preview'
import { loadBundle, readCache, writeCache } from './bundleLoader'

export { SUPPORTED_BLOCKS } from '../blocks/supported'
export type { Action, Block } from './types'

/**
 * The published "experience bundle" for the website (Experience Studio, channel "web"). It supplies tokens, navigation,
 * chrome, pages (typed blocks), media and content. The built-in design is the fallback for EVERYTHING: while the bundle
 * is loading, when the channel kill switch is on (`enabled:false`), on any network/server error, and for any page,
 * block or field the bundle does not provide. First paint never waits for it.
 */
const REFRESH_MS = 60_000

export type ExperienceStatus = 'loading' | 'live' | 'builtin'

interface Ctx {
  bundle: Bundle | null
  /** 'loading' until the first answer (or cache); 'builtin' = kill switch / unreachable and nothing cached. */
  status: ExperienceStatus
  preview: { active: boolean; failed: boolean }
  page: (key: string) => Block[] | null
  pageDoc: (key: string) => PageDoc | null
  seo: (key: string) => Seo | null
  media: (ref?: MediaRef | null) => ResolvedMedia | null
  content: Content
  navigation: Navigation | null
  chrome: Chrome | null
  announcement: Announcement | null
}
const EMPTY_CONTENT: Content = {}
const Experience = createContext<Ctx>({
  bundle: null, status: 'builtin', preview: { active: false, failed: false },
  page: () => null, pageDoc: () => null, seo: () => null, media: () => null,
  content: EMPTY_CONTENT, navigation: null, chrome: null, announcement: null,
})

/** Applies the last good bundle's tokens synchronously, before React renders (no flash on repeat visits). */
export function bootFromCache(): void {
  if (getPreviewToken()) return
  const cached = readCache()
  if (cached) applyTokens(cached.bundle.tokens)
}

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const previewToken = getPreviewToken()
  const [initial] = useState(() => (previewToken ? null : readCache()))
  const [bundle, setBundle] = useState<Bundle | null>(initial?.bundle ?? null)
  const [status, setStatus] = useState<ExperienceStatus>(initial ? 'live' : 'loading')
  const [previewFailed, setPreviewFailed] = useState(false)
  const etag = useRef<string | null>(initial?.etag ?? null)
  const lastTry = useRef(0)
  const holdUntil = useRef(0)
  const inFlight = useRef(false)

  const refresh = useCallback(async (force = false) => {
    const now = Date.now()
    if (inFlight.current || now < holdUntil.current || (!force && now - lastTry.current < REFRESH_MS - 1000)) return
    inFlight.current = true
    lastTry.current = now
    try {
      const r = await loadBundle({ previewToken, etag: etag.current })
      if (r.kind === 'unchanged') { setStatus('live'); return }
      if (r.kind === 'bundle') {
        etag.current = r.etag
        setBundle(r.bundle)
        setStatus('live')
        setPreviewFailed(false)
        if (!previewToken) writeCache(r.bundle, r.etag)
        return
      }
      if (r.kind === 'off') {
        // kill switch: back to the built-in design, forget everything cached
        etag.current = null
        setBundle(null)
        setStatus('builtin')
        writeCache(null, null)
        return
      }
      // error: keep the last good bundle when we have one; honour Retry-After on 429/503
      if (r.retryAfterMs) holdUntil.current = Date.now() + r.retryAfterMs
      if (previewToken) setPreviewFailed(true)
      setStatus((s) => (s === 'live' ? 'live' : 'builtin'))
    } finally { inFlight.current = false }
  }, [previewToken])

  useEffect(() => {
    void refresh(true)
    const onVisible = () => { if (document.visibilityState === 'visible') void refresh() }
    const onFocus = () => { void refresh() }
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void refresh() }, REFRESH_MS)
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onFocus)
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); window.removeEventListener('focus', onFocus) }
  }, [refresh])

  useEffect(() => {
    applyTokens(bundle?.tokens)
    if (bundle) loadFonts(bundle)
  }, [bundle])

  const value = useMemo<Ctx>(() => {
    const pages = bundle?.pages ?? {}
    return {
      bundle,
      status,
      preview: { active: previewToken !== null, failed: previewFailed },
      page: (key) => pages[key]?.blocks ?? null,
      pageDoc: (key) => pages[key] ?? null,
      seo: (key) => pages[key]?.seo ?? null,
      media: (ref) => resolveMedia(bundle, ref),
      content: bundle?.content ?? EMPTY_CONTENT,
      navigation: bundle?.navigation ?? null,
      chrome: bundle?.chrome ?? null,
      announcement: bundle?.content?.announcements?.find((a) => !a.channels || a.channels.includes('web')) ?? null,
    }
  }, [bundle, status, previewToken, previewFailed])
  return <Experience.Provider value={value}>{children}</Experience.Provider>
}

export const useExperience = () => useContext(Experience)
/** Test seam: render blocks against a fixed bundle without the network. */
export function StaticExperience({ bundle, children }: { bundle: Bundle | null; children: ReactNode }) {
  const value = useMemo<Ctx>(() => {
    const pages = bundle?.pages ?? {}
    return {
      bundle, status: bundle ? 'live' : 'builtin', preview: { active: false, failed: false },
      page: (k) => pages[k]?.blocks ?? null, pageDoc: (k) => pages[k] ?? null, seo: (k) => pages[k]?.seo ?? null,
      media: (ref) => resolveMedia(bundle, ref), content: bundle?.content ?? EMPTY_CONTENT,
      navigation: bundle?.navigation ?? null, chrome: bundle?.chrome ?? null, announcement: null,
    }
  }, [bundle])
  return <Experience.Provider value={value}>{children}</Experience.Provider>
}

/** "Line one\nline two" → line one<br/>line two (headlines keep today's deliberate line breaks). */
export function Lines({ text }: { text: string }) {
  const parts = text.split('\n')
  return <>{parts.map((p, i) => <span key={i}>{p}{i < parts.length - 1 ? <br /> : null}</span>)}</>
}
