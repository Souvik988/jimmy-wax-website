import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import type { ReactNode } from 'react'
import schema from './blocks.schema.json'
import { FIXTURE_BLOCKS, FIXTURE_BUNDLE } from './fixtures'
import { BlockList, REGISTRY } from '../blocks/registry'
import { SUPPORTED_BLOCKS } from '../blocks/supported'
import { StaticExperience } from '../lib/experience'
import { CatalogContext, type CatalogState } from '../lib/catalog'
import type { Block } from '../lib/types'
import type { Product } from '../data/products'

const product = (id: string, name: string, available = true): Product => ({
  id, variantId: `${id}-v`, name, format: 'Bottle', sequence: 'Begin', image: '/p.jpg', imageAlt: '/p2.jpg', description: `${name} description`, note: 'In stock',
  price: 299, pricePaise: 29900, comparePaise: 39900, size: '100 ml', ritual: 'Use it', story: [], available, availableQuantity: 5,
})
const catalog: CatalogState = {
  products: [product('fixture-polish', 'Fixture Polish'), product('fixture-kit', 'Fixture Kit', false)],
  settings: null, status: 'ready', error: null, reload: () => {},
}
const Wrap = ({ children }: { children: ReactNode }) => (
  <CatalogContext.Provider value={catalog}><StaticExperience bundle={FIXTURE_BUNDLE}>{children}</StaticExperience></CatalogContext.Provider>
)
const draw = (...blocks: Block[]) => render(<Wrap><BlockList blocks={blocks} /></Wrap>)
const one = (type: string) => draw(FIXTURE_BLOCKS[type]!)

describe('contract', () => {
  const ajv = addFormats(new Ajv({ strict: false, allErrors: true }))
  const webTypes = Object.keys(schema.blocks).filter((k) => k.startsWith('web.'))

  it('the registry, the caps list and the schema agree on the 21 website blocks', () => {
    expect(webTypes).toHaveLength(21)
    expect([...SUPPORTED_BLOCKS].sort()).toEqual([...webTypes].sort())
    expect(Object.keys(REGISTRY).sort()).toEqual([...webTypes].sort())
  })
  it.each(webTypes)('fixture for %s is valid against blocks.schema.json', (type) => {
    const props = (schema.blocks as Record<string, { props: object }>)[type]!.props
    const validate = ajv.compile(props)
    const ok = validate(FIXTURE_BLOCKS[type]!.props)
    expect(validate.errors ?? []).toEqual([])
    expect(ok).toBe(true)
  })
})

describe('one fixture per block renders its props', () => {
  it('web.hero_film', () => {
    one('web.hero_film')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Fixture hero')
    expect(screen.getByRole('link', { name: /Go shop/ })).toHaveAttribute('href', '#collection')
    expect(screen.getByRole('link', { name: /Our ritual/ })).toHaveAttribute('href', '/ritual')
  })
  it('web.marquee', () => { one('web.marquee'); expect(screen.getByLabelText('One, Two, Three, Four')).toBeInTheDocument() })
  it('web.chapter_mark', () => { one('web.chapter_mark'); expect(screen.getByText('Fixture Chapter')).toBeInTheDocument() })
  it('web.collection_grid (resolved ids, live catalogue, paise formatting)', () => {
    one('web.collection_grid')
    expect(screen.getByText('Coll headline')).toBeInTheDocument()
    expect(screen.getByText('Fixture Polish')).toBeInTheDocument()
    expect(screen.queryByText('Fixture Kit')).not.toBeInTheDocument() // not in resolved.productIds
    expect(screen.getByText('₹299')).toBeInTheDocument()
  })
  it('web.ritual_steps', () => { one('web.ritual_steps'); expect(screen.getByText('Step title 2')).toBeInTheDocument(); expect(screen.getByText('Ritual headline')).toBeInTheDocument() })
  it('web.scrub_film (reduced motion: static poster)', () => { one('web.scrub_film'); expect(screen.getByLabelText('Scrub label')).toBeInTheDocument() })
  it('web.media_split', () => {
    one('web.media_split')
    expect(screen.getByText('Split headline')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Split image' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Split CTA/ })).toHaveAttribute('href', '/shop/fixture-polish')
  })
  it('web.standards_grid', () => { one('web.standards_grid'); expect(screen.getByText('Std title 3')).toBeInTheDocument() })
  it('web.evidence_rail', () => { one('web.evidence_rail'); expect(screen.getByText('Caption 4')).toBeInTheDocument() })
  it('web.atelier_film', () => { one('web.atelier_film'); expect(screen.getByLabelText('Atelier label')).toBeInTheDocument(); expect(screen.getByLabelText(/Atelier line one/)).toBeInTheDocument() })
  it('web.reels_rail', () => { one('web.reels_rail'); expect(screen.getByText('Story 2')).toBeInTheDocument(); expect(screen.getByText('Reels title')).toBeInTheDocument() })
  it('web.journal_stack', () => { one('web.journal_stack'); expect(screen.getAllByText('Fixture note title').length).toBeGreaterThan(0) })
  it('web.promo_film', () => { one('web.promo_film'); expect(screen.getByText('Promo caption')).toBeInTheDocument() })
  it('web.closing_cta', () => {
    one('web.closing_cta')
    expect(screen.getByText('Closing footnote')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Closing go/ })).toHaveAttribute('href', '/shop')
    expect(screen.getByRole('img', { name: 'Closing image' })).toBeInTheDocument()
  })
  it('web.testimonials', () => { one('web.testimonials'); expect(screen.getByText('Fixture quote number one is here.')).toBeInTheDocument(); expect(screen.getByRole('img', { name: '5 out of 5' })).toBeInTheDocument() })
  it('web.rich_text (safe markdown)', () => {
    one('web.rich_text')
    expect(screen.getByRole('heading', { name: 'Rich heading' })).toBeInTheDocument()
    const a = screen.getByRole('link', { name: 'link' })
    expect(a).toHaveAttribute('href', 'https://example.com/')
    expect(a).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })
  it('web.image (alt, link, srcset from variants)', () => {
    one('web.image')
    const img = screen.getByRole('img', { name: 'Standalone image' })
    expect(img.getAttribute('srcset')).toContain('640w')
    expect(img.closest('a')).toHaveAttribute('href', '/story')
    expect(screen.getByText('Image caption')).toBeInTheDocument()
  })
  it('web.product_grid hides sold-out items', () => {
    one('web.product_grid')
    expect(screen.getByText('Grid title')).toBeInTheDocument()
    expect(screen.getByText('Fixture Polish')).toBeInTheDocument()
    expect(screen.queryByText('Fixture Kit')).not.toBeInTheDocument()
  })
  it('web.faq', () => { one('web.faq'); expect(screen.getByText('Is this a question?')).toBeInTheDocument(); expect(screen.getByText('really').tagName).toBe('STRONG') })
  it('web.announcement_bar', () => { one('web.announcement_bar'); expect(screen.getByRole('link', { name: 'Announcement text' })).toHaveAttribute('href', '/shop') })
  it('web.spacer', () => { const { container } = one('web.spacer'); expect(container.querySelector('.jw-spacer')).toHaveStyle({ height: '48px' }) })
})

describe('block list rules', () => {
  const marquee = FIXTURE_BLOCKS['web.marquee']!
  it('skips unknown types and keeps order', () => {
    draw({ id: 'blk-unkn-0001', type: 'web.from_the_future', visible: true, props: {} }, marquee, FIXTURE_BLOCKS['web.chapter_mark']!)
    const kinds = [...document.querySelectorAll('[data-jw-type]')].map((e) => e.getAttribute('data-jw-type'))
    expect(kinds).toEqual(['web.marquee', 'web.chapter_mark'])
  })
  it('honours visible:false and auth / store-paused rules', () => {
    draw({ ...marquee, id: 'blk-hidd-0001', visible: false }, { ...marquee, id: 'blk-auth-0001', rules: { auth: 'signed_in' } }, { ...marquee, id: 'blk-paus-0001', rules: { storePaused: 'only_when_paused' } }, { ...marquee, id: 'blk-ok00-0001', rules: { auth: 'signed_out', storePaused: 'hide_when_paused' } })
    expect([...document.querySelectorAll('[data-jw-block]')].map((e) => e.getAttribute('data-jw-block'))).toEqual(['blk-ok00-0001'])
  })
  it('one broken block does not break the page', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    const broken = { id: 'blk-brok-0001', type: 'web.marquee', visible: true, props: new Proxy({}, { get() { throw new Error('boom') } }) } as unknown as Block
    draw(broken, FIXTURE_BLOCKS['web.chapter_mark']!)
    expect(screen.getByText('Fixture Chapter')).toBeInTheDocument()
    warn.mockRestore(); err.mockRestore()
  })
  it('BlockStyle: token/palette/hex backgrounds, anchor id, never raw strings', () => {
    draw({ ...marquee, id: 'blk-styl-0001', style: { background: { palette: 'brandy' }, padding: 'lg', anchorId: 'my-anchor', align: 'center', divider: true } })
    const el = document.getElementById('my-anchor')!
    expect(el.style.background).toContain('var(--jw-palette-brandy)')
    expect(el.style.textAlign).toBe('center')
    const { container } = render(<Wrap><BlockList blocks={[{ ...marquee, id: 'blk-evil-0001', style: { background: { hex: 'red;}body{display:none' } } as never }]} /></Wrap>)
    expect(container.querySelector('[data-jw-block="blk-evil-0001"]')?.getAttribute('style') ?? '').not.toContain('display')
  })
  it('media refs: decorative images get empty alt; focal point becomes object-position', () => {
    const b = { ...FIXTURE_BLOCKS['web.image']!, props: { image: { mediaId: '11111111-1111-4111-8111-111111111111', decorative: true, focal: { x: 0.25, y: 0.75 } } } }
    const { container } = draw(b)
    const img = container.querySelector('img')!
    expect(img.getAttribute('alt')).toBe('')
    expect(img.style.objectPosition).toBe('25% 75%')
  })
  it('a media ref that is not in the bundle draws nothing', () => {
    const { container } = draw({ ...FIXTURE_BLOCKS['web.image']!, props: { image: { mediaId: '99999999-9999-4999-8999-999999999999' } } })
    expect(container.querySelector('img')).toBeNull()
    expect(within(container).queryByRole('figure')).toBeNull()
  })
})
