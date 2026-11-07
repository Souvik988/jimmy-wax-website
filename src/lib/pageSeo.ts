import { useMemo } from 'react'
import { useExperience } from './experience'
import { useBrand } from './chrome'
import { applyTitleTemplate, useHead, absoluteUrl, type HeadSpec } from './seo'
import type { Product } from '../data/products'

export interface PageSeoInput {
  /** Bundle page key (`home`, `shop`, `ritual`, `story`, `product`, `custom:<slug>` …). */
  key: string
  /** Optional page key whose SEO overrides `key` (a per-product template). */
  overrideKey?: string
  /** Built-in title for this page (brand-less; the title template is applied). */
  title: string
  /** Use the title verbatim (home) instead of the template. */
  verbatimTitle?: boolean
  description?: string
  path: string
  product?: Product
  isHome?: boolean
  noindex?: boolean
  ready?: boolean
}

const DEFAULT_OG = '/media/products/collection-still-v5.jpg'

/** Resolves page SEO = page `seo` → chrome `seoDefaults` → built-in text, and writes the document head. */
export function usePageSeo(i: PageSeoInput) {
  const exp = useExperience()
  const brand = useBrand()
  const page = (i.overrideKey && exp.pageDoc(i.overrideKey)) || exp.pageDoc(i.key)
  const seo = (i.overrideKey && exp.pageDoc(i.overrideKey)?.seo) || page?.seo
  const defaults = exp.chrome?.seoDefaults
  const og = seo?.ogImage ? exp.media(seo.ogImage) : exp.media(exp.chrome?.slots?.['og.default'])
  const logo = exp.media(exp.chrome?.slots?.['logo.mark']) ?? exp.media(exp.chrome?.slots?.['favicon'])

  const spec = useMemo<HeadSpec | null>(() => {
    if (i.ready === false) return null
    // A page-level title is the operator's exact words; otherwise build one from the template.
    const title = seo?.title?.trim() || (i.verbatimTitle ? i.title : applyTitleTemplate(defaults?.titleTemplate, i.title))
    const description = seo?.description?.trim() || i.description || defaults?.description
    const canonicalPath = seo?.canonical && /^\/[^/\\]/.test(seo.canonical) ? seo.canonical : undefined
    const image = og?.url ?? DEFAULT_OG
    const jsonLd: Array<Record<string, unknown>> = []
    const origin = window.location.origin
    if (i.isHome && seo?.structuredData?.organization !== false) {
      jsonLd.push({
        '@context': 'https://schema.org', '@type': 'Organization', name: brand.wordmark === 'JIMMY & WAX' ? 'Jimmy & Wax' : brand.wordmark, url: origin,
        ...(logo ? { logo: logo.url } : {}), ...(description ? { description } : {}),
      })
    }
    if (i.product) {
      const p = i.product
      jsonLd.push({
        '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.description, image: [absoluteUrl(p.image)], sku: p.variantId,
        brand: { '@type': 'Brand', name: 'Jimmy & Wax' },
        offers: {
          '@type': 'Offer', url: `${origin}/shop/${p.id}`, priceCurrency: 'INR', price: (p.pricePaise / 100).toFixed(2),
          availability: p.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        },
      })
    }
    if (seo?.structuredData?.breadcrumb) {
      const crumbs = [{ name: 'Home', path: '/' }, ...(i.path !== '/' ? [{ name: i.title, path: i.path }] : [])]
      jsonLd.push({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, n) => ({ '@type': 'ListItem', position: n + 1, name: c.name, item: `${origin}${c.path}` })) })
    }
    return { title, description, canonicalPath, noindex: !!seo?.noindex || !!i.noindex, image, ogType: i.product ? 'product' : 'website', jsonLd }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i.key, i.overrideKey, i.title, i.description, i.path, i.product?.id, i.product?.pricePaise, i.product?.available, i.isHome, i.noindex, i.ready, seo, defaults, og?.url, logo?.url, brand.wordmark])
  useHead(spec, [spec])
}
