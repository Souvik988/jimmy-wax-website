// Writes dist/robots.txt and dist/sitemap.xml after `vite build`.
// Production preflight requires SITE_ORIGIN. Local preview builds may omit it and skip the sitemap.
// Product and custom-page URLs come from the live API; catalogue failures stop publication of an incomplete sitemap.
// Draft previews are never listed (they are noindex'd and live behind ?jw_preview=), and private screens are disallowed.
import { mkdir, writeFile } from 'node:fs/promises'
import { loadEnv } from 'vite'

const env = { ...loadEnv('production', process.cwd(), ''), ...process.env }
const site = (env.SITE_ORIGIN || '').replace(/\/$/, '')
const api = (env.VITE_API_ORIGIN || '').replace(/\/$/, '')
await mkdir('dist', { recursive: true })

const robots = ['User-agent: *', 'Disallow: /checkout', 'Disallow: /orders', 'Disallow: /account', 'Disallow: /*jw_preview=', 'Allow: /', ...(site ? [`Sitemap: ${site}/sitemap.xml`] : [])].join('\n') + '\n'
await writeFile('dist/robots.txt', robots)

if (!site) { console.warn('[postbuild] SITE_ORIGIN not set: sitemap.xml skipped'); process.exit(0) }

const get = async (path, headers = {}) => {
  try { const r = await fetch(api + path, { headers, signal: AbortSignal.timeout(8000) }); return r.ok ? await r.json() : null } catch { return null }
}
const paths = new Set(['/', '/shop', '/ritual', '/story'])
let cursor = null
const seenCursors = new Set()
if (api) do {
  const products = await get('/v1/products?limit=50' + (cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''))
  if (!products) throw new Error('Sitemap catalogue read failed; retry the build when the API is healthy.')
  for (const p of products.items ?? []) if (/^[a-z0-9-]+$/.test(p.id)) paths.add(`/shop/${p.id}`)
  cursor = products.nextCursor ?? null
  if (cursor && (seenCursors.has(cursor) || seenCursors.size >= 1000)) throw new Error('Invalid sitemap catalogue cursor')
  if (cursor) seenCursors.add(cursor)
} while (cursor)
const bundle = api ? await get('/v1/experience/web', { 'x-jw-client': 'web/1.0.0; platform=web' }) : null
if (bundle?.enabled) {
  for (const [key, page] of Object.entries(bundle.pages ?? {})) {
    const m = /^custom:([a-z0-9-]+)$/.exec(key)
    if (m && !page?.seo?.noindex) paths.add(`/custom/${m[1]}`)
  }
}
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...paths].map((p) => `  <url><loc>${site}${p}</loc></url>`).join('\n')}\n</urlset>\n`
await writeFile('dist/sitemap.xml', xml)
console.log(`[postbuild] robots.txt + sitemap.xml (${paths.size} urls)`)
