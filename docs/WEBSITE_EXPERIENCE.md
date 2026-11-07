# Storefront ↔ Experience Studio

How the website renders what operators publish, what falls back, what to configure, and what is still open.

## How it works
- `src/lib/experience.tsx` + `bundleLoader.ts`: `GET /v1/experience/web` with `x-jw-client: web/1.0.0; platform=web; caps=<21 block types>`, `If-None-Match`, refresh on focus/visibility and at most every 60 s, `Retry-After` honoured on 429/503. The last good bundle is kept in memory and `sessionStorage` (`jw-exp-web-v2`). First paint never waits for it.
- **Fallback**: `enabled:false` (kill switch), network/5xx errors with nothing cached, and any missing page/field render the built-in design. The built-in home/ritual/story are the same block vocabulary in `src/blocks/defaults.ts` (one code path).
- **Blocks**: `src/blocks/{core,story}.tsx`, registry + per-block error boundary + `BlockStyle`/rules in `registry.tsx`. A test pins registry == `SUPPORTED_BLOCKS` == the schema's 21 `web.*` types.
- **Tokens/chrome/navigation**: `tokens.ts` writes validated CSS variables on `:root` (legacy names `--ink`, `--gold-soft`, … are aliased from colour roles); `chrome` drives brand, veil, grain/cursor/smooth-scroll, footer copy, SEO defaults; `navigation` drives header/footer links and the cart label.
- **Pages**: `home|shop|ritual|story` use published blocks when the page has any, else the built-in page. `/custom/<slug>` ← `custom:<slug>`; `/shop/<id>` uses `product:<id>` over `product` (native sections `gallery, description, delivery_estimate, pairings/related` toggle; others have no native data on the site yet). Unknown custom slugs and product ids show a 404 view (`noindex`).
- **Actions** (`actions.ts`): only the schema vocabulary; `url` must be absolute https without credentials; never `javascript:`/`data:`/protocol-relative.
- **SEO** (`pageSeo.ts`): per-page title (verbatim) → `titleTemplate`, description, canonical, OG/Twitter, robots, JSON-LD (`Organization` on home, `Product` on product pages, optional breadcrumb).

## Preview (`?jw_preview=<token>`)
Works on every page, is carried on internal links, is memory-only, fetches `/v1/experience/web/preview?token=` with `no-store`, shows a "Draft preview" ribbon and `noindex`. Framing is a **host** concern: `deploy/Caddyfile.example` sends `frame-ancestors <DASHBOARD_PUBLIC_ORIGIN>` + `no-store` + `X-Robots-Tag` for preview requests and `frame-ancestors 'none'` otherwise (`vite.config.ts` mirrors this for dev/`vite preview`). There is no service worker.

## Configuration names (values are the owner's; none are committed)
| Name | Where | Meaning |
|---|---|---|
| `VITE_API_ORIGIN` | build | public API origin (https in production) |
| `VITE_MEDIA_ORIGIN` | build, optional | extra allowed media/CDN origin |
| `SITE_ORIGIN` | build (`postbuild`) | public storefront origin for `sitemap.xml`/`robots.txt` |
| `DASHBOARD_PUBLIC_ORIGIN` | host (Caddy) / dev server | the only origin allowed to frame preview pages |
| `<API_ORIGIN>`, `<MEDIA_ORIGIN>`, `<STOREFRONT_DOMAIN>` | `deploy/Caddyfile.example` | placeholders to fill |

## Commands
`npm run build` (tsc + vite + sitemap/robots) · `npm test` (68 unit/contract tests) · `npm run test:e2e` (Playwright vs `vite preview`, mocked API; run `npm run build` first; set `PW_CHROMIUM_PATH` to use an installed Chromium).

## Decisions and open items (see the session report)
- Grain: `chrome.effects.grain` is the on/off switch; `tokens.surfaces.grain.opacity` is strength (0.1 ≡ built-in).
- Sold-out products are hidden in `web.product_grid` (unless all are sold out); `web.collection_grid` keeps showing them as "Unavailable".
- Type scale sizes are applied fluidly (the px value is reached at 1440 px); weights/line-heights are exposed as `--jw-fw-*`/`--jw-lh-*` but most legacy CSS does not consume them yet.
- SPA limits: crawlers without JS see only `index.html` metadata; true HTTP 404 for unknown `/custom/*` needs prerender/edge support (not adopted).
- Lighthouse (mobile ≥ 90/100/100/100) was **not** measured in this session.
