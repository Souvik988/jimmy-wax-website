import { API_ORIGIN } from './api'
import { SUPPORTED_BLOCKS } from '../blocks/supported'
import type { Block, Bundle, PageDoc } from './types'

/** Client identity sent with every bundle request: the server holds back block types missing from `caps`. */
export const CLIENT_VERSION = '1.0.0'
export const clientHeader = () => `web/${CLIENT_VERSION}; platform=web; caps=${SUPPORTED_BLOCKS.join(',')}`

export type LoadResult =
  | { kind: 'unchanged' }
  | { kind: 'bundle'; bundle: Bundle; etag: string | null }
  | { kind: 'off' }
  | { kind: 'error'; status: number; retryAfterMs?: number }

const isRec = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v)

/**
 * Defensive parse of a server payload. Returns null when the payload is not a usable bundle at all; drops
 * individual malformed blocks/pages instead of failing the whole document.
 */
export function normalizeBundle(raw: unknown): Bundle | 'off' | null {
  if (!isRec(raw) || typeof raw.schemaVersion !== 'number' || (raw.channel !== undefined && raw.channel !== 'web')) return null
  if (raw.enabled === false) return 'off'
  const pages: Record<string, PageDoc> = {}
  if (isRec(raw.pages)) {
    for (const [key, p] of Object.entries(raw.pages)) {
      if (!isRec(p) || !/^[a-z0-9:_-]{1,80}$/.test(key)) continue
      const blocks = (Array.isArray(p.blocks) ? p.blocks : []).filter(
        (b): b is Block => isRec(b) && typeof b.id === 'string' && typeof b.type === 'string' && b.type.length <= 60 && isRec(b.props),
      )
      pages[key] = { ...(p as Partial<PageDoc>), blocks }
    }
  }
  return {
    ...(raw as unknown as Bundle),
    pages,
    media: isRec(raw.media) ? (raw.media as Bundle['media']) : {},
  }
}

export async function loadBundle(opts: { previewToken: string | null; etag: string | null; signal?: AbortSignal }): Promise<LoadResult> {
  const preview = !!opts.previewToken
  const url = preview
    ? `${API_ORIGIN}/v1/experience/web/preview?token=${encodeURIComponent(opts.previewToken!)}`
    : `${API_ORIGIN}/v1/experience/web`
  let res: Response
  try {
    res = await fetch(url, {
      method: 'GET',
      signal: opts.signal,
      // a draft preview is never cached or revalidated; the published bundle is always revalidated (cheap 304)
      cache: preview ? 'no-store' : 'no-cache',
      headers: {
        'x-jw-client': clientHeader(),
        ...(!preview && opts.etag ? { 'if-none-match': opts.etag } : {}),
      },
    })
  } catch {
    return { kind: 'error', status: 0 }
  }
  if (res.status === 304 && !preview) return { kind: 'unchanged' }
  if (!res.ok) {
    const ra = Number(res.headers.get('retry-after'))
    return { kind: 'error', status: res.status, retryAfterMs: Number.isFinite(ra) && ra > 0 ? Math.min(ra, 600) * 1000 : undefined }
  }
  let json: unknown
  try { json = await res.json() } catch { return { kind: 'error', status: res.status } }
  const parsed = normalizeBundle(json)
  if (parsed === 'off') return { kind: 'off' }
  if (!parsed) return { kind: 'error', status: res.status }
  return { kind: 'bundle', bundle: parsed, etag: preview ? null : res.headers.get('etag') }
}

// ---- last-known-good cache (published bundle only; a preview is never stored)
const CACHE_KEY = 'jw-exp-web-v2'
export function readCache(): { bundle: Bundle; etag: string | null } | null {
  try {
    const v = JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? 'null') as { bundle?: unknown; etag?: string | null } | null
    const b = v ? normalizeBundle(v.bundle) : null
    return b && b !== 'off' ? { bundle: b, etag: v?.etag ?? null } : null
  } catch { return null }
}
export function writeCache(bundle: Bundle | null, etag: string | null) {
  try {
    if (!bundle) sessionStorage.removeItem(CACHE_KEY)
    else sessionStorage.setItem(CACHE_KEY, JSON.stringify({ bundle, etag }))
  } catch { /* quota / private mode: in-memory copy still works */ }
}
