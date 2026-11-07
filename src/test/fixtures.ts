import type { Block, Bundle } from '../lib/types'

/**
 * One contract-valid fixture per website block type (validated against blocks.schema.json in blocks.test.tsx),
 * plus a full bundle that uses all of them. Also reused by the Playwright specs.
 */
const IMG = '11111111-1111-4111-8111-111111111111'
const IMG2 = '22222222-2222-4222-8222-222222222222'
const VID = '33333333-3333-4333-8333-333333333333'
const POSTER = '44444444-4444-4444-8444-444444444444'
const S1 = '55555555-5555-4555-8555-555555555551'
const S2 = '55555555-5555-4555-8555-555555555552'
const S3 = '55555555-5555-4555-8555-555555555553'
const T1 = '66666666-6666-4666-8666-666666666661'
const T2 = '66666666-6666-4666-8666-666666666662'

const img = (mediaId = IMG, alt = 'A fixture image') => ({ mediaId, alt })
const cta = (id: string, label: string, action: Record<string, unknown>, variant = 'solid') => ({ id, label, action, variant })

export const FIXTURE_BLOCKS: Record<string, Block> = {
  'web.hero_film': { id: 'blk-hero-0001', type: 'web.hero_film', visible: true, props: { kicker: 'Fixture kicker', headline: 'Fixture hero\nheadline', subhead: 'Fixture subhead', film: { desktop: { mediaId: VID }, mobile: { mediaId: VID }, poster: img(POSTER, 'Hero poster') }, scrubScroll: 2, ctas: [cta('cta-aaaa-01', 'Go shop', { type: 'anchor', id: 'collection' }), cta('cta-bbbb-02', 'Our ritual', { type: 'route', path: '/ritual' }, 'ghost')] } },
  'web.marquee': { id: 'blk-marq-0001', type: 'web.marquee', visible: true, props: { items: ['One', 'Two', 'Three', 'Four'] } },
  'web.chapter_mark': { id: 'blk-chap-0001', type: 'web.chapter_mark', visible: true, props: { index: '07', title: 'Fixture Chapter' } },
  'web.collection_grid': { id: 'blk-coll-0001', type: 'web.collection_grid', visible: true, props: { kicker: 'Coll kicker', headline: 'Coll headline', subhead: 'Coll subhead', source: { kind: 'newest' }, cardStyle: 'plain', hoverFilm: false, limit: 6 }, resolved: { productIds: ['fixture-polish'] } },
  'web.ritual_steps': { id: 'blk-ritu-0001', type: 'web.ritual_steps', visible: true, props: { kicker: 'Ritual kicker', headline: 'Ritual headline', subhead: 'Ritual subhead', steps: [1, 2, 3].map((n) => ({ id: `step-000${n}`, n: `0${n}`, title: `Step title ${n}`, body: `Step body ${n}`, image: img() })) } },
  'web.scrub_film': { id: 'blk-scru-0001', type: 'web.scrub_film', visible: true, props: { film: { mediaId: VID }, poster: img(POSTER, 'Scrub poster'), label: 'Scrub label', beats: [{ id: 'beat-0001', title: 'Beat one', body: 'Body one' }, { id: 'beat-0002', title: 'Beat two', body: 'Body two' }] } },
  'web.media_split': { id: 'blk-spli-0001', type: 'web.media_split', visible: true, props: { mediaKind: 'image', media: img(IMG2, 'Split image'), kicker: 'Split kicker', headline: 'Split headline', body: 'Split body copy', cta: { label: 'Split CTA', action: { type: 'product', productId: 'fixture-polish' } }, mediaSide: 'right' } },
  'web.standards_grid': { id: 'blk-stan-0001', type: 'web.standards_grid', visible: true, props: { kicker: 'Std kicker', headline: 'Std headline', subhead: 'Std subhead', items: [1, 2, 3].map((n) => ({ id: `std-000${n}`, n: `0${n}`, title: `Std title ${n}`, body: `Std body ${n}`, image: img() })) } },
  'web.evidence_rail': { id: 'blk-evid-0001', type: 'web.evidence_rail', visible: true, props: { kicker: 'Evidence kicker', headline: 'Evidence headline', items: [1, 2, 3, 4].map((n) => ({ id: `evid-000${n}`, image: img(), caption: `Caption ${n}` })) } },
  'web.atelier_film': { id: 'blk-atel-0001', type: 'web.atelier_film', visible: true, props: { film: { mediaId: VID }, poster: img(POSTER, 'Atelier poster'), label: 'Atelier label', kicker: 'Atelier kicker', headlineLines: ['Atelier line one', 'Atelier line two'] } },
  'web.reels_rail': { id: 'blk-reel-0001', type: 'web.reels_rail', visible: true, props: { title: 'Reels title', storyIds: [S1, S2, S3] } },
  'web.journal_stack': { id: 'blk-jour-0001', type: 'web.journal_stack', visible: true, props: { noteIds: ['fixture-note'], finale: { kicker: 'Finale kicker', title: 'Finale title', excerpt: 'Finale excerpt', image: img() } } },
  'web.promo_film': { id: 'blk-prom-0001', type: 'web.promo_film', visible: true, props: { kicker: 'Promo kicker', headlineLines: ['Promo line one', 'Promo line two'], video: { mediaId: VID }, poster: img(POSTER, 'Promo poster'), caption: 'Promo caption' } },
  'web.closing_cta': { id: 'blk-clos-0001', type: 'web.closing_cta', visible: true, props: { kicker: 'Closing kicker', headlineLines: ['Closing one', 'Closing two'], ctas: [cta('cta-cccc-03', 'Closing go', { type: 'route', path: '/shop' })], media: img(IMG2, 'Closing image'), caption: 'Closing caption', footnote: 'Closing footnote' } },
  'web.testimonials': { id: 'blk-test-0001', type: 'web.testimonials', visible: true, props: { testimonialIds: [T1, T2], layout: 'grid' } },
  'web.rich_text': { id: 'blk-rich-0001', type: 'web.rich_text', visible: true, props: { markdown: '## Rich heading\n\nParagraph with **bold** and a [link](https://example.com).\n\n- item a\n- item b' } },
  'web.image': { id: 'blk-imag-0001', type: 'web.image', visible: true, props: { image: img(IMG, 'Standalone image'), action: { type: 'route', path: '/story' }, caption: 'Image caption' } },
  'web.product_grid': { id: 'blk-prod-0001', type: 'web.product_grid', visible: true, props: { title: 'Grid title', source: { kind: 'manual', productIds: ['fixture-polish', 'fixture-kit'] }, columns: 2, limit: 4 }, resolved: { productIds: ['fixture-polish', 'fixture-kit'] } },
  'web.faq': { id: 'blk-faq0-0001', type: 'web.faq', visible: true, props: { groupId: 'fixture-faq' } },
  'web.announcement_bar': { id: 'blk-anno-0001', type: 'web.announcement_bar', visible: true, props: { text: 'Announcement text', action: { type: 'route', path: '/shop' }, tone: 'promo', dismissible: true } },
  'web.spacer': { id: 'blk-spac-0001', type: 'web.spacer', visible: true, props: { height: 48 } },
}

export const FIXTURE_BUNDLE: Bundle = {
  schemaVersion: 1, channel: 'web', enabled: true,
  release: { id: '77777777-7777-4777-8777-777777777777', number: 99, label: 'fixture', publishedAt: '2026-10-10T00:00:00.000Z' },
  tokens: {
    color: { roles: { 'bg.base': '#0A0B0C', 'accent.primary': '#22CC88', 'text.primary': '#FAFAFA' }, palette: { brandy: '#AA3300' }, gradients: {} },
    type: { families: { display: { family: 'Fixture Display', fallback: 'Georgia, serif' }, body: { family: 'Fixture Body', fallback: 'system-ui, sans-serif' } }, scale: { hero: { size: 80, lineHeight: 1, weight: 600, tracking: -0.04 } } },
    radius: { card: 14 },
  },
  navigation: { links: [{ id: 'nav-fix-1', label: 'Fixture Shop', action: { type: 'route', path: '/shop' } }, { id: 'nav-fix-2', label: 'Fixture Story', action: { type: 'route', path: '/story' } }], footerColumns: [{ id: 'col-fix-1', title: 'Fixture column', links: [{ id: 'lnk-fix-1', label: 'Fixture link', action: { type: 'route', path: '/ritual' } }] }], cart: { label: 'Fixture bag' } },
  chrome: { brand: { wordmark: 'FIXTURE & CO', mark: 'F' }, veil: { enabled: false }, effects: { grain: false, cursor: false, smoothScroll: { enabled: false, speedCap: 1 } }, seoDefaults: { titleTemplate: '%s | Fixture', description: 'Fixture default description' }, footer: { tagline: 'Fixture tagline', bottomLeft: 'Fixture left', bottomRight: 'Fixture right' } },
  pages: {
    home: { seo: { title: 'Fixture home title', description: 'Fixture home description', structuredData: { organization: true, product: false, breadcrumb: false } }, blocks: Object.values(FIXTURE_BLOCKS) },
    ritual: { seo: { title: 'Fixture ritual title', description: 'Fixture ritual description' }, blocks: [FIXTURE_BLOCKS['web.rich_text']!] },
    'custom:fixture-page': { title: 'Fixture custom', seo: { title: 'Fixture custom page', description: 'Custom page description' }, blocks: [FIXTURE_BLOCKS['web.rich_text']!, FIXTURE_BLOCKS['web.faq']!] },
    'product:fixture-kit': { nativeSections: [{ key: 'pairings', visible: false }], blocks: [FIXTURE_BLOCKS['web.spacer']!] },
  },
  media: {
    [IMG]: { id: IMG, kind: 'image', url: '/v1/media/aa/orig.webp', alt: 'Library alt', width: 1600, height: 900, variants: [{ url: '/v1/media/aa/w640.webp', width: 640 }, { url: '/v1/media/aa/w1080.webp', width: 1080 }] },
    [IMG2]: { id: IMG2, kind: 'image', url: '/v1/media/bb/orig.webp', alt: 'Second library alt', width: 1200, height: 800 },
    [VID]: { id: VID, kind: 'video', url: '/v1/media/cc/video.mp4', alt: 'Film', poster: { url: '/v1/media/dd/orig.webp' } },
    [POSTER]: { id: POSTER, kind: 'image', url: '/v1/media/dd/orig.webp', alt: 'Poster alt' },
  },
  content: {
    stories: Object.fromEntries([S1, S2, S3].map((id, i) => [id, { id, title: `Story ${i + 1}`, line: `Story line ${i + 1}`, videoMediaId: VID, posterMediaId: POSTER, alt: `Story alt ${i + 1}` }])),
    journal: { 'fixture-note': { id: 'fixture-note', kicker: 'Note kicker', readMinutes: 3, title: 'Fixture note title', excerpt: 'Fixture note excerpt', imageMediaId: IMG, alt: 'Note image', bodyMd: 'Note body paragraph.', productId: 'fixture-polish' } },
    testimonials: {
      [T1]: { id: T1, name: 'Asha K', city: 'Pune', quote: 'Fixture quote number one is here.', rating: 5, source: 'owner_supplied' },
      [T2]: { id: T2, name: 'Ravi M', quote: 'Fixture quote number two is here.', rating: 4, source: 'owner_supplied' },
    },
    faqGroups: { 'fixture-faq': { id: 'fixture-faq', title: 'Fixture FAQ', items: [{ q: 'Is this a question?', aMd: 'Yes, **really**.' }] } },
    careGuides: {},
    announcements: [],
  },
}
