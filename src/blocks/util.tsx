import type { CSSProperties, ImgHTMLAttributes } from 'react'
import { useExperience } from '../lib/experience'
import type { ResolvedMedia } from '../lib/media'
import type { Content, MediaRef } from '../lib/types'
import { DEFAULT_CONTENT } from './defaults'
import { useCatalog } from '../lib/catalog'
import type { Product } from '../data/products'

export const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback)
export const arr = <T = Record<string, unknown>>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]).filter((x) => x !== null && x !== undefined) : [])
export const obj = (v: unknown): Record<string, unknown> => (v !== null && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {})
export const pad2 = (n: number) => String(n).padStart(2, '0')

/** Looks an entity up in the published content, then in the built-in defaults (never the other way round). */
type EntityKind = 'careGuides' | 'faqGroups' | 'stories' | 'journal' | 'testimonials'
export function useEntity<K extends EntityKind>(kind: K, id: string | undefined): NonNullable<Content[K]>[string] | undefined {
  const { content } = useExperience()
  if (!id) return undefined
  const live = (content[kind] as Record<string, unknown> | undefined)?.[id]
  return (live ?? (DEFAULT_CONTENT[kind] as Record<string, unknown> | undefined)?.[id]) as NonNullable<Content[K]>[string] | undefined
}

/** Resolves a Studio media id (or a built-in local file) into a drawable media object. */
export function useMedia(ref: MediaRef | null | undefined): ResolvedMedia | null {
  return useExperience().media(ref)
}
export function useMediaById(mediaId: string | null | undefined, local?: string, alt?: string): ResolvedMedia | null {
  const { media } = useExperience()
  return media(mediaId ? { mediaId, alt } : local ? { local, alt } : null)
}

export function mediaImgProps(m: ResolvedMedia, sizes?: string): ImgHTMLAttributes<HTMLImageElement> & { style?: CSSProperties } {
  return {
    src: m.url,
    srcSet: m.srcSet,
    sizes: m.srcSet ? sizes ?? '(min-width: 1024px) 50vw, 100vw' : undefined,
    alt: m.decorative ? '' : m.alt,
    width: m.width,
    height: m.height,
    style: { objectFit: m.fit, ...(m.objectPosition ? { objectPosition: m.objectPosition } : {}) },
    decoding: 'async',
  }
}

/** Plain `<img>` for a resolved media object (focal point, srcset, alt/decorative honoured). */
export function Img({ media, sizes, className, eager }: { media: ResolvedMedia; sizes?: string; className?: string; eager?: boolean }) {
  return <img className={className} loading={eager ? 'eager' : 'lazy'} {...mediaImgProps(media, sizes)} aria-hidden={media.decorative || undefined} />
}

/** Catalogue products for an ordered id list (unknown ids dropped), or everything when the server gave no list. */
export function useProductList(ids: string[] | undefined): Product[] {
  const { products } = useCatalog()
  if (!ids) return products
  return ids.map((id) => products.find((p) => p.id === id)).filter((p): p is Product => !!p)
}

/** Hide sold-out products, unless that would leave nothing to show. */
export const inStockOrAll = (list: Product[]): Product[] => {
  const available = list.filter((p) => p.available)
  return available.length ? available : list
}
