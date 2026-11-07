import { defineConfig } from '@playwright/test'

// The e2e specs mock the public API with page.route() and a fixture bundle, so they need no backend.
// PW_CHROMIUM_PATH (optional) points at an already-installed Chromium instead of the one Playwright expects.
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  retries: 0,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH || undefined },
  },
  webServer: {
    // builds nothing: run `npm run build` first. `vite preview` sends the strict CSP + frame-ancestors headers.
    command: 'npx vite preview --port 4173 --host 127.0.0.1 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
