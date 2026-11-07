import { BlockList } from '../blocks/registry'
import { useExperience } from '../lib/experience'
import { usePageSeo } from '../lib/pageSeo'
import { ActionLink } from '../lib/nav'

/** A bundle page is used only when it actually has blocks; an empty or missing one means "use the built-in page". */
export function usePublishedBlocks(key: string) {
  const blocks = useExperience().page(key)
  return blocks && blocks.length ? blocks : null
}

export function NotFound({ path }: { path: string }) {
  usePageSeo({ key: '404', title: 'Page not found', path, noindex: true })
  return (
    <section className="commerce-hero jw-not-found" aria-labelledby="nf-title">
      <div className="hero-copy">
        <p className="kicker">404</p>
        <h1 id="nf-title">This page is not here.</h1>
        <p>The link may be old, or the page may have been taken down.</p>
        <ActionLink action={{ type: 'route', path: '/' }} className="btn btn--solid">Back to the beginning <span className="arr" aria-hidden="true">↗</span></ActionLink>
      </div>
    </section>
  )
}

/** `/custom/<slug>` — served from the published bundle's `custom:<slug>` page; unknown slugs are a 404. */
export function CustomPage({ slug }: { slug: string }) {
  const exp = useExperience()
  const doc = exp.pageDoc(`custom:${slug}`)
  const path = `/custom/${slug}`
  usePageSeo({ key: `custom:${slug}`, title: doc?.title || slug.replace(/-/g, ' '), path, ready: !!doc })
  if (doc && doc.blocks.length) return <div className="jw-custom-page"><BlockList blocks={doc.blocks} /></div>
  // Until the bundle has answered we cannot know the page is missing: show a quiet loading state, not a 404.
  if (exp.status === 'loading') return <p className="shop-state" role="status">Loading…</p>
  return <NotFound path={path} />
}
