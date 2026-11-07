import { expect, test, type Page, type Route } from '@playwright/test'
import { FIXTURE_BUNDLE } from '../src/test/fixtures'

const API = 'http://localhost:8080'
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64')
const PRODUCTS = {
  items: [
    { id: 'fixture-polish', categoryId: 'c', name: 'Fixture Polish', subtitle: 'Bottle', description: 'A fixture polish.', variant: { id: 'v1', title: '100 ml', pricePaise: 29900, comparePaise: 39900, available: true, availableQuantity: 9 } },
    { id: 'fixture-kit', categoryId: 'c', name: 'Fixture Kit', subtitle: 'Kit', description: 'A fixture kit.', variant: { id: 'v2', title: 'Set', pricePaise: 79900, comparePaise: null, available: false, availableQuantity: 0 } },
  ],
}
const SETTINGS = { shippingFeePaise: 4900, freeShippingThresholdPaise: 99900, codEnabled: true, codFeePaise: 0, gstRateBps: 1800, taxInclusive: true, checkoutOpen: true, ordersPaused: false, pauseMessage: '', brandName: 'JIMMY WAX', supportEmail: null, supportPhone: null, deliveryEstimate: '3-5 days' }

interface Mock { bundle?: unknown; status?: number; seen: Array<{ url: string; headers: Record<string, string> }> }
async function mockApi(page: Page, m: Mock) {
  await page.route(`${API}/**`, async (route: Route) => {
    const req = route.request()
    const url = new URL(req.url())
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-expose-headers': 'etag' }
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors })
    if (url.pathname.startsWith('/v1/experience/web')) {
      m.seen.push({ url: req.url(), headers: req.headers() })
      if (m.status && m.status !== 200) return route.fulfill({ status: m.status, headers: cors, body: '{}' })
      if (req.headers()['if-none-match'] === '"etag-1"') return route.fulfill({ status: 304, headers: cors })
      return route.fulfill({ status: 200, headers: { ...cors, etag: '"etag-1"', 'content-type': 'application/json' }, body: JSON.stringify(m.bundle) })
    }
    if (url.pathname === '/v1/products') return route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify(PRODUCTS) })
    if (url.pathname === '/v1/store-settings') return route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify(SETTINGS) })
    if (url.pathname.startsWith('/v1/media/')) return route.fulfill({ status: 200, headers: { ...cors, 'cross-origin-resource-policy': 'cross-origin', 'content-type': url.pathname.endsWith('.mp4') ? 'video/mp4' : 'image/png' }, body: PNG })
    return route.fulfill({ status: 404, headers: cors, body: '{}' })
  })
}

const errorsOf = (page: Page) => {
  const errs: string[] = []
  page.on('console', (msg) => { if (msg.type() === 'error' && !/Failed to load resource|Media|net::ERR/i.test(msg.text())) errs.push(msg.text()) })
  page.on('pageerror', (e) => errs.push(e.message))
  return errs
}
const publish = (b: object) => ({ ...FIXTURE_BUNDLE, ...b })

test('a published bundle drives tokens, navigation, chrome, SEO and all 21 blocks', async ({ page }) => {
  const m: Mock = { bundle: FIXTURE_BUNDLE, seen: [] }
  const errs = errorsOf(page)
  await mockApi(page, m)
  await page.goto('/')
  // tokens → :root, navigation + chrome from the bundle
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--jw-accent-primary').trim())).toBe('#22CC88')
  await expect(page.getByRole('link', { name: 'Fixture Shop' }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: /Fixture bag/ })).toBeVisible()
  // caps header lists exactly the supported blocks
  const caps = m.seen[0]!.headers['x-jw-client']!.split('caps=')[1]!.split(',')
  expect(caps).toHaveLength(21)
  // SEO
  await expect(page).toHaveTitle('Fixture home title')
  await expect(page.locator('meta[name=description]')).toHaveAttribute('content', 'Fixture home description')
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', /\/$/)
  expect(await page.locator('script[type="application/ld+json"]').first().textContent()).toContain('"Organization"')
  // blocks, in order
  const types = await page.locator('[data-jw-type]').evaluateAll((els) => els.map((e) => e.getAttribute('data-jw-type')))
  expect(types).toEqual(Object.values(FIXTURE_BUNDLE.pages.home!.blocks).map((b) => b.type))
  for (const text of ['Fixture hero', 'Fixture Chapter', 'Coll headline', 'Ritual headline', 'Step title 2', 'Split headline', 'Std title 3', 'Evidence headline', 'Atelier line one', 'Promo caption', 'Closing footnote', 'Rich heading', 'Grid title', 'Is this a question?', 'Announcement text']) {
    await expect(page.getByText(text).first(), text).toBeAttached()
  }
  expect(errs).toEqual([])
})

test('kill switch and server errors fall back to the built-in design', async ({ page }) => {
  const m: Mock = { bundle: { ...FIXTURE_BUNDLE, enabled: false }, seen: [] }
  await mockApi(page, m)
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Every finish has')
  await expect(page.getByRole('link', { name: 'Fixture Shop' })).toHaveCount(0)
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--jw-accent-primary'))).toBe('')

  const page2 = await page.context().newPage()
  await mockApi(page2, { status: 503, seen: [] })
  await page2.goto('/')
  await expect(page2.getByRole('heading', { level: 1 })).toContainText('Every finish has')
})

test('malformed block is skipped, the rest of the page renders', async ({ page }) => {
  const b = publish({ pages: { home: { blocks: [{ id: 'blk-bad0-0001', type: 'web.hero_film', visible: true, props: 'oops' }, { id: 'blk-marq-0001', type: 'web.marquee', visible: true, props: { items: ['A', 'B', 'C', 'D'] } }, { id: 'blk-futu-0001', type: 'web.not_yet', visible: true, props: {} }] } } })
  await mockApi(page, { bundle: b, seen: [] })
  await page.goto('/')
  await expect(page.getByLabel('A, B, C, D')).toBeAttached()
})

test('custom pages: served at /custom/<slug>, unknown slugs are a 404 view', async ({ page }) => {
  await mockApi(page, { bundle: FIXTURE_BUNDLE, seen: [] })
  await page.goto('/custom/fixture-page')
  await expect(page.getByRole('heading', { name: 'Rich heading' })).toBeVisible()
  await expect(page).toHaveTitle('Fixture custom page')
  await page.goto('/custom/does-not-exist')
  await expect(page.getByRole('heading', { name: 'This page is not here.' })).toBeVisible()
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', /noindex/)
})

test('product pages: unique JSON-LD Product, per-product template hides native sections', async ({ page }) => {
  await mockApi(page, { bundle: FIXTURE_BUNDLE, seen: [] })
  await page.goto('/shop/fixture-polish')
  await expect(page.getByRole('heading', { name: 'Fixture Polish' }).first()).toBeVisible()
  await expect(page).toHaveTitle('Fixture Polish | Fixture')
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').first().textContent())!)
  expect(ld['@type']).toBe('Product')
  expect(ld.offers.price).toBe('299.00')
  await expect(page.getByLabel('Complete the ritual')).toBeAttached()
  await page.goto('/shop/fixture-kit') // product:fixture-kit hides "pairings"
  await expect(page.getByRole('heading', { name: 'Fixture Kit' }).first()).toBeVisible()
  await expect(page.getByLabel('Complete the ritual')).toHaveCount(0)
  await page.goto('/shop/not-a-product')
  await expect(page.getByRole('heading', { name: 'This page is not here.' })).toBeVisible()
})

test('draft preview: token → preview endpoint, ribbon, noindex, token survives navigation, never cached', async ({ page }) => {
  const m: Mock = { bundle: FIXTURE_BUNDLE, seen: [] }
  await mockApi(page, m)
  const res = await page.goto('/?jw_preview=preview-token-1234')
  expect(res!.headers()['content-security-policy']).toContain('frame-ancestors http://localhost:3200')
  expect(res!.headers()['cache-control']).toBe('no-store')
  await expect(page.getByTestId('preview-ribbon')).toContainText('Draft preview')
  await expect.poll(() => m.seen.length).toBeGreaterThan(0)
  expect(m.seen[0]!.url).toContain('/v1/experience/web/preview?token=preview-token-1234')
  expect(m.seen[0]!.headers['if-none-match']).toBeUndefined()
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', /noindex/)
  await page.getByRole('link', { name: 'Fixture Shop' }).first().click()
  await expect(page).toHaveURL(/\/shop\?jw_preview=preview-token-1234/)
  await expect(page.getByTestId('preview-ribbon')).toBeVisible()
  expect(await page.evaluate(() => JSON.stringify([sessionStorage, localStorage]).includes('preview-token-1234'))).toBe(false)
  // normal responses cannot be framed by anyone
  const normal = await page.goto('/')
  expect(normal!.headers()['content-security-policy']).toContain("frame-ancestors 'none'")
  await expect(page.getByTestId('preview-ribbon')).toHaveCount(0)
})

test('published bundle is revalidated with If-None-Match and a 304 keeps the page', async ({ page }) => {
  const m: Mock = { bundle: FIXTURE_BUNDLE, seen: [] }
  await mockApi(page, m)
  await page.goto('/')
  await expect(page.getByText('Fixture hero').first()).toBeAttached()
  await page.reload()
  await expect(page.getByText('Fixture hero').first()).toBeAttached()
  expect(m.seen.some((s) => s.headers['if-none-match'] === '"etag-1"')).toBe(true)
})

test('normal pages have no CSP violations', async ({ page }) => {
  const violations: string[] = []
  page.on('console', (msg) => { if (/Content Security Policy|Refused to/i.test(msg.text())) violations.push(msg.text()) })
  await mockApi(page, { bundle: FIXTURE_BUNDLE, seen: [] })
  for (const p of ['/', '/shop', '/ritual', '/story', '/shop/fixture-polish']) { await page.goto(p); await page.waitForTimeout(600) }
  expect(violations).toEqual([])
})
