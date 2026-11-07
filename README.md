# Jimmy & Wax website

A React storefront for Jimmy & Wax leather care, with scroll-driven films, product pages, a shopping bag, checkout, customer accounts, and content published through Experience Studio.

![Jimmy & Wax homepage](docs/preview/homepage.png)

The preview shows the built-in homepage with the experience API disabled. Product availability, prices, checkout, accounts, and published content require the separate Jimmy & Wax backend. This repository hosts the website source; a live storefront has not been configured here.

## Local development

Requires Node.js 22 or newer and npm.

```sh
npm ci
```

Copy `.env.example` to `.env.development` and set `VITE_API_ORIGIN` to your backend origin (typically `http://localhost:8080` for local development). Then run:

```sh
npm run dev
```

Vite prints the local URL. The built-in home, ritual, and story pages render when Experience Studio is unavailable. Google Fonts requires network access; the styles include fallback fonts. The backend serves commerce data and may serve additional images and videos.

## Checks and preview build

```sh
npm run verify
npx playwright install chromium
npm run test:e2e
npm run preview
```

`verify` checks the pinned API contract, production configuration validation, unit tests, TypeScript, and the preview build. Browser tests use a mocked API against the built site at `http://127.0.0.1:4173`; no backend is required. The preview build deliberately permits missing production origins.

## Production hosting

Create `.env.production` from `.env.example` with real public HTTPS origins for `VITE_API_ORIGIN` and `SITE_ORIGIN`. Configure `VITE_MEDIA_ORIGIN` if media uses a separate origin, and `DASHBOARD_PUBLIC_ORIGIN` for Studio previews. These frontend configuration values are public; never put server credentials in `VITE_*` variables.

```sh
npm run build
```

The release build validates origins and writes `dist/`, `robots.txt`, and a sitemap. Sitemap generation needs a healthy catalogue API. Serve `dist/` through a host that supports SPA route fallback and the security headers in `deploy/Caddyfile.example`. Preview routes need the documented framing and cache rules. GitHub Pages is not configured: the storefront uses root-relative routes and requires host-level response headers.

## Structure

- `src/`: pages, commerce/API clients, content blocks, motion, styles, and unit tests.
- `public/media/`: website images and video encodes.
- `contracts/` and `contract.lock.json`: pinned shared API and experience schemas.
- `e2e/`: Playwright integration checks.
- `scripts/`: contract validation, release preflight, and sitemap generation.
- `deploy/`: hosting configuration example.
- `docs/`: architecture, creative provenance, and integration notes.

See [Experience Studio integration](docs/WEBSITE_EXPERIENCE.md), [API integration](docs/DASHBOARD_INTEGRATION_PROMPT.md), and [asset provenance](docs/creative/asset-manifest.md) for details. Raw creative inputs, local environment files, dependencies, and build output are excluded from Git. Brand and media assets remain subject to their owners' rights; no open-source reuse license is granted by this repository.
