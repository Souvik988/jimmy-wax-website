import type { Bundle, MediaItem, MediaRef } from './types'

/** Media may only be served from the API origin (or an explicit media/CDN origin); anything else is dropped. */
const API = ((import.meta.env.VITE_API_ORIGIN as string | undefined) ?? 'http://localhost:8080').replace(/\/$/, '')
const MEDIA_ORIGIN = ((import.meta.env.VITE_MEDIA_ORIGIN as string | undefined) ?? '').replace(/\/$/, '')

export interface ResolvedMedia {
  kind: 'image' | 'video' | 'font'
  url: string
  alt: string
  decorative: boolean
  poster?: string
  srcSet?: string
  width?: number
  height?: number
  fit: 'cover' | 'contain'
  objectPosition?: string
}

/** `/v1/media/...` → API origin; absolute URLs must already be on an allowed origin. */
export function mediaUrl(u: string | undefined | null): string | null {
  if (!u || typeof u !== 'string') return null
  if (u.startsWith('//') || /[\u0000-\u001f\\]/.test(u)) return null
  if (u.startsWith('/')) return API + u
  try {
    const parsed = new URL(u)
    const allowed = [API, MEDIA_ORIGIN].filter(Boolean)
    return allowed.includes(parsed.origin) && /^https?:$/.test(parsed.protocol) ? parsed.href : null
  } catch { return null }
}

const pct = (n: number) => `${Math.round(Math.min(1, Math.max(0, n)) * 1000) / 10}%`

export function resolveMedia(bundle: Pick<Bundle, 'media'> | null | undefined, ref: MediaRef | null | undefined): ResolvedMedia | null {
  if (!ref || typeof ref !== 'object') return null
  const fit = ref.fit === 'contain' ? 'contain' : 'cover'
  const objectPosition = ref.focal && Number.isFinite(ref.focal.x) && Number.isFinite(ref.focal.y) ? `${pct(ref.focal.x)} ${pct(ref.focal.y)}` : undefined
  // built-in defaults point at files shipped with the site
  if (ref.local && ref.local.startsWith('/') && !ref.local.startsWith('//')) {
    return { kind: /\.(mp4|webm)$/i.test(ref.local) ? 'video' : 'image', url: ref.local, alt: ref.decorative ? '' : ref.alt ?? '', decorative: !!ref.decorative, poster: ref.localPoster, fit, objectPosition }
  }
  const item: MediaItem | undefined = ref.mediaId ? bundle?.media?.[ref.mediaId] : undefined
  if (!item) return null
  const url = mediaUrl(item.url)
  if (!url) return null
  const decorative = ref.decorative ?? item.decorative ?? false
  const variants = (item.variants ?? []).filter((v) => v && Number.isFinite(v.width) && mediaUrl(v.url))
  const srcSet = item.kind === 'image' && variants.length
    ? [...variants.map((v) => `${mediaUrl(v.url)} ${v.width}w`), ...(item.width ? [`${url} ${item.width}w`] : [])].join(', ')
    : undefined
  return {
    kind: item.kind,
    url,
    alt: decorative ? '' : ref.alt ?? item.alt ?? '',
    decorative,
    poster: item.poster ? mediaUrl(item.poster.url) ?? undefined : undefined,
    srcSet,
    width: item.width ?? undefined,
    height: item.height ?? undefined,
    fit,
    objectPosition,
  }
}
