/// <reference types="vitest/config" />
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Response headers for the dev and `vite preview` servers, mirroring deploy/Caddyfile.example (the real host).
 *  - normal pages: frame-ancestors 'none' (nobody may frame the storefront)
 *  - Studio draft previews (?jw_preview=…): frame-ancestors <DASHBOARD_PUBLIC_ORIGIN> only, no-store, noindex
 * A strict CSP is sent by `vite preview` only (dev needs HMR's inline client).
 */
function securityHeaders(env: Record<string, string>, strictCsp: boolean): Plugin['configureServer'] {
  const dashboard = env.DASHBOARD_PUBLIC_ORIGIN || 'http://localhost:3200'
  const api = (env.VITE_API_ORIGIN || 'http://localhost:8080').replace(/\/$/, '')
  const media = (env.VITE_MEDIA_ORIGIN || '').replace(/\/$/, '')
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' https://fonts.googleapis.com",
    "style-src-attr 'unsafe-inline'",
    "font-src 'self' https://fonts.gstatic.com " + [api, media].filter(Boolean).join(' '),
    `img-src 'self' data: ${api} ${media}`.trim(),
    `media-src 'self' blob: ${api} ${media}`.trim(),
    `connect-src 'self' ${api}`,
    "object-src 'none'", "base-uri 'self'", "form-action 'self' https://api.razorpay.com",
  ].join('; ')
  return (server) => {
    server.middlewares.use((req, res, next) => {
      const preview = /[?&]jw_preview=/.test(req.url ?? '')
      res.setHeader('X-Content-Type-Options', 'nosniff')
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
      if (preview) {
        res.setHeader('Content-Security-Policy-Report-Only', '')
        // the static handler sets its own Cache-Control later; a draft preview must always win with no-store
        const set = res.setHeader.bind(res)
        res.setHeader = (k: string, val: number | string | readonly string[]) => set(k, k.toLowerCase() === 'cache-control' ? 'no-store' : val)
        res.setHeader('Cache-Control', 'no-store')
        res.setHeader('X-Robots-Tag', 'noindex, nofollow')
      }
      const frame = preview ? `frame-ancestors ${dashboard}` : "frame-ancestors 'none'"
      res.setHeader('Content-Security-Policy', strictCsp ? `${csp}; ${frame}` : frame)
      res.removeHeader('Content-Security-Policy-Report-Only')
      next()
    })
  }
}

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined)) }
  return {
    build: {
      rolldownOptions: {
        output: { codeSplitting: { groups: [{ name: 'vendor', test: /node_modules/ }] } },
      },
    },
    plugins: [
      react(),
      { name: 'jw-dev-headers', configureServer: securityHeaders(env, false), configurePreviewServer: securityHeaders(env, true) } as Plugin,
    ],
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
    },
  }
})
