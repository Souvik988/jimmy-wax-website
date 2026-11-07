import { useCatalog } from '../lib/catalog'
import { useExperience } from '../lib/experience'
import { useBrand } from '../lib/chrome'
import { ActionLink } from '../lib/nav'

const DEFAULT_TAGLINE = 'Designed around the finishing touch — leather care staged as a quiet ritual, not a chore.'

/** Footer: tagline, columns (published `navigation.footerColumns`, else the built-in two) and the bottom line. */
export function Footer({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { products, settings } = useCatalog()
  const { chrome, navigation } = useExperience()
  const brand = useBrand()
  const columns = (navigation?.footerColumns ?? []).filter((c) => c && Array.isArray(c.links) && c.links.length > 0)
  const bottomLeft = chrome?.footer?.bottomLeft ?? 'Jimmy & Wax — the finishing touch'
  const contact = [settings?.supportEmail, settings?.supportPhone].filter(Boolean).join(' · ')
  const bottomRight = chrome?.footer?.bottomRight ?? [settings?.taxInclusive ? 'Prices include GST' : '', contact].filter(Boolean).join(' · ')
  return (
    <footer className="commerce-footer">
      <div className="footer-grid">
        <div>
          <p className="footer-word">{brand.wordmark}</p>
          <p className="footer-tag">{chrome?.footer?.tagline ?? DEFAULT_TAGLINE}</p>
        </div>
        {columns.length > 0 ? columns.map((c) => (
          <div className="footer-col" key={c.id}>
            <h3>{c.title}</h3>
            <ul>{c.links.map((l) => <li key={l.id}><ActionLink action={l.action}>{l.label}</ActionLink></li>)}</ul>
          </div>
        )) : (
          <>
            <div className="footer-col">
              <h3>Explore</h3>
              <ul>
                <li><button type="button" onClick={() => onNavigate('/shop')}>Shop the objects</button></li>
                <li><button type="button" onClick={() => onNavigate('/ritual')}>The ritual</button></li>
                <li><button type="button" onClick={() => onNavigate('/story')}>Our standard</button></li>
                <li><button type="button" onClick={() => onNavigate('/')}>The cinematic story</button></li>
                <li><button type="button" onClick={() => onNavigate('/orders')}>Your orders</button></li>
              </ul>
            </div>
            <div className="footer-col">
              <h3>The objects</h3>
              <ul>
                {products.map((p) => <li key={p.id}><button type="button" onClick={() => onNavigate(`/shop/${p.id}`)}>{p.name}</button></li>)}
              </ul>
            </div>
          </>
        )}
      </div>
      <div className="footer-bottom">
        <nav aria-label="Policies and support">{['terms','privacy','shipping','returns'].map(slug=><a key={slug} href={'/policies/'+slug}>{slug} </a>)}<a href="/support">Help & support</a></nav>
        <span>{bottomLeft}</span>
        <span>{bottomRight}</span>
      </div>
    </footer>
  )
}
