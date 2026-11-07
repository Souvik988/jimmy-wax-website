/**
 * Studio draft preview. The operator's dashboard frames `https://<site>/<path>?jw_preview=<short-lived token>`.
 * The token lives in memory only (never sessionStorage/localStorage, never cached) and is carried onto every internal
 * link so it survives client-side navigation. It is never sent anywhere except the experience preview endpoint.
 */
export const PREVIEW_PARAM = 'jw_preview'

let token: string | null = null
try {
  const t = new URLSearchParams(window.location.search).get(PREVIEW_PARAM)
  token = t && /^[\w.~-]{8,512}$/.test(t) ? t : null
} catch { token = null }

export const getPreviewToken = () => token
export const isPreview = () => token !== null

/** Test hook. */
export const __setPreviewToken = (t: string | null) => { token = t }

/** Adds the preview token to an internal path (`/shop?x=1#top`), leaving external or token-less cases untouched. */
export function withPreview(path: string): string {
  if (!token || !path.startsWith('/') || path.startsWith('//')) return path
  const hashAt = path.indexOf('#')
  const hash = hashAt >= 0 ? path.slice(hashAt) : ''
  const rest = hashAt >= 0 ? path.slice(0, hashAt) : path
  const qAt = rest.indexOf('?')
  const base = qAt >= 0 ? rest.slice(0, qAt) : rest
  const params = new URLSearchParams(qAt >= 0 ? rest.slice(qAt + 1) : '')
  params.set(PREVIEW_PARAM, token)
  return `${base}?${params.toString()}${hash}`
}

/** The query string without the preview token, for canonical links. */
export function stripPreview(search: string): string {
  const p = new URLSearchParams(search)
  p.delete(PREVIEW_PARAM)
  const s = p.toString()
  return s ? `?${s}` : ''
}
