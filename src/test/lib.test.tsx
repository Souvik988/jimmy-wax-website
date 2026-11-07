import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { resolveAction } from '../lib/actions'
import { resolveMedia, mediaUrl } from '../lib/media'
import { tokensToCss } from '../lib/tokens'
import { Markdown, safeHref } from '../lib/markdown'
import { normalizeBundle } from '../lib/bundleLoader'
import { __setPreviewToken, withPreview } from '../lib/preview'
import { ruleAllows } from '../blocks/registry'
import { FIXTURE_BUNDLE } from './fixtures'

describe('actions', () => {
  it('maps to real routes', () => {
    expect(resolveAction({ type: 'product', productId: 'my-polish' })).toEqual({ kind: 'internal', path: '/shop/my-polish' })
    expect(resolveAction({ type: 'page', pageKey: 'custom:care-tips' })).toEqual({ kind: 'internal', path: '/custom/care-tips' })
    expect(resolveAction({ type: 'page', pageKey: 'product:my-polish' })).toEqual({ kind: 'internal', path: '/shop/my-polish' })
    expect(resolveAction({ type: 'route', path: '/ritual' })).toEqual({ kind: 'internal', path: '/ritual' })
    expect(resolveAction({ type: 'screen', screen: 'cart' })).toEqual({ kind: 'cart' })
    expect(resolveAction({ type: 'anchor', id: 'collection' })).toEqual({ kind: 'anchor', id: 'collection' })
    expect(resolveAction({ type: 'collection', slug: 'kits' })).toEqual({ kind: 'internal', path: '/shop?collection=kits' })
    expect(resolveAction({ type: 'category', categoryId: 'polish' })).toEqual({kind:'internal',path:'/shop?category=polish'})
  })
  it('never yields javascript:/data: URLs or open redirects', () => {
    for (const url of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'data:text/html,<script>', '//evil.example', '/\\evil.example', 'http://insecure.example', 'https://user:pw@evil.example', ' https://evil.example', 'https://evil.example/\u0000']) {
      expect(resolveAction({ type: 'url', url }), url).toEqual({ kind: 'none' })
    }
    expect(resolveAction({ type: 'url', url: 'https://example.com/a?b=1', newTab: true })).toEqual({ kind: 'external', href: 'https://example.com/a?b=1', newTab: true })
    expect(resolveAction({ type: 'route', path: '/evil' })).toEqual({ kind: 'none' })
    expect(resolveAction({ type: 'product', productId: '../x' })).toEqual({ kind: 'none' })
    expect(resolveAction({ type: 'mystery' })).toEqual({ kind: 'none' })
    expect(resolveAction(null)).toEqual({ kind: 'none' })
  })
  it('tel / mailto / whatsapp are validated', () => {
    expect(resolveAction({ type: 'tel', value: '+91 98000 00001' })).toEqual({ kind: 'link', href: 'tel:+919800000001' })
    expect(resolveAction({ type: 'mailto', value: 'a@b.co?subject=x' })).toEqual({ kind: 'none' })
    expect(resolveAction({ type: 'whatsapp', value: '+919800000001' })).toMatchObject({ kind: 'external', href: 'https://wa.me/919800000001' })
  })
})

describe('media', () => {
  const m = FIXTURE_BUNDLE.media
  it('resolves ids through bundle.media with srcset, alt override and focal point', () => {
    const r = resolveMedia({ media: m }, { mediaId: '11111111-1111-4111-8111-111111111111', alt: 'Override', focal: { x: 0.5, y: 0.2 } })!
    expect(r.alt).toBe('Override')
    expect(r.objectPosition).toBe('50% 20%')
    expect(r.srcSet).toMatch(/640w.*1080w.*1600w/)
    expect(r.url).toMatch(/^http.*\/v1\/media\/aa\/orig\.webp$/)
  })
  it('rejects foreign origins and protocol-relative URLs', () => {
    expect(mediaUrl('https://evil.example/x.png')).toBeNull()
    expect(mediaUrl('//evil.example/x.png')).toBeNull()
    expect(mediaUrl('javascript:alert(1)')).toBeNull()
    expect(resolveMedia({ media: { x: { id: 'x', kind: 'image', url: 'https://evil.example/a.png' } } }, { mediaId: 'x' })).toBeNull()
  })
})

describe('tokens', () => {
  it('maps roles/palette/type/radius to CSS variables, keeping legacy names', () => {
    const { vars } = tokensToCss(FIXTURE_BUNDLE.tokens)
    expect(vars['--jw-accent-primary']).toBe('#22CC88')
    expect(vars['--gold-soft']).toBe('#22CC88')
    expect(vars['--ink']).toBe('#0A0B0C')
    expect(vars['--jw-palette-brandy']).toBe('#AA3300')
    expect(vars['--font-display']).toBe('"Fixture Display", Georgia, serif')
    expect(vars['--r-card']).toBe('14px')
    expect(vars['--fs-hero']).toMatch(/^clamp\(.*80px\)$/)
  })
  it('refuses anything that is not a colour / number / font name', () => {
    const { vars } = tokensToCss({ color: { roles: { 'bg.base': 'red;}body{display:none', 'bg.deep': 'url(x)' } }, type: { families: { display: { family: 'A";}x{', fallback: 'serif' } } }, radius: { card: 'NaN' } })
    expect(Object.values(vars).join('|')).not.toMatch(/display|url|"A/)
    expect(tokensToCss(null).vars).toEqual({})
  })
})

describe('markdown XSS corpus', () => {
  const html = (s: string) => render(<Markdown source={s} />).container.innerHTML
  it.each([
    '<script>alert(1)</script>', '<img src=x onerror=alert(1)>', '[x](javascript:alert(1))', '[x](data:text/html;base64,AAAA)', '[x](//evil.example)', '**<b onclick=x>**', '<svg onload=alert(1)>',
  ])('%s never produces executable markup', (src) => {
    const out = render(<Markdown source={src} />).container
    expect(out.querySelector('script, img, svg, iframe, [onerror], [onclick], [onload]')).toBeNull()
    for (const a of out.querySelectorAll('a')) expect(a.getAttribute('href')).toMatch(/^(https:|mailto:|tel:|\/(?!\/))/)
  })
  it('renders the allow-list', () => {
    expect(html('# T\n\n> q\n\n1. a\n2. b\n\n---')).toMatch(/<h2>T<\/h2><blockquote>.*<ol>.*<hr>/)
    expect(safeHref('https://ok.example/x')).toBe('https://ok.example/x')
    expect(safeHref('JAVASCRIPT:alert(1)')).toBeNull()
  })
})

describe('bundle normalisation', () => {
  it('drops malformed blocks and pages, keeps the rest', () => {
    const b = normalizeBundle({ schemaVersion: 1, channel: 'web', enabled: true, pages: { home: { blocks: [{ id: 'a', type: 'x', props: {} }, { type: 'no-id', props: {} }, null, { id: 'b', type: 'y', props: 5 }] }, 'BAD KEY': { blocks: [] } } })
    expect(b).not.toBe('off')
    expect((b as { pages: Record<string, { blocks: unknown[] }> }).pages.home!.blocks).toHaveLength(1)
    expect(Object.keys((b as { pages: object }).pages)).toEqual(['home'])
  })
  it('kill switch and garbage', () => {
    expect(normalizeBundle({ schemaVersion: 1, channel: 'web', enabled: false, pages: {} })).toBe('off')
    expect(normalizeBundle('nope')).toBeNull()
    expect(normalizeBundle({ schemaVersion: 1, channel: 'app', enabled: true })).toBeNull()
  })
})

describe('preview token + rules', () => {
  it('is carried onto internal links only', () => {
    __setPreviewToken('abcdefgh12345678')
    expect(withPreview('/shop?x=1#top')).toBe('/shop?x=1&jw_preview=abcdefgh12345678#top')
    expect(withPreview('https://x.example')).toBe('https://x.example')
    expect(withPreview('//x.example')).toBe('//x.example')
    __setPreviewToken(null)
    expect(withPreview('/shop')).toBe('/shop')
  })
  it('ruleAllows', () => {
    expect(ruleAllows({ auth: 'signed_in' }, false, false)).toBe(false)
    expect(ruleAllows({ storePaused: 'hide_when_paused' }, false, true)).toBe(false)
    expect(ruleAllows(undefined, false, false)).toBe(true)
  })
})
