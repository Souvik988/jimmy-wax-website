import type { Block, Content, Story } from '../lib/types'

/**
 * The built-in design, expressed in the SAME block vocabulary the Studio publishes. With no bundle (loading, kill
 * switch, offline) the storefront renders exactly these, so the fallback and a published page go through one code
 * path. Media here uses `local` refs (files shipped under /media); a published bundle uses `mediaId` refs.
 */
const S = '/media/products/story'
const V = '/media/generated/video/desktop'
const local = (src: string, alt = '', extra: Record<string, unknown> = {}) => ({ local: src, alt, ...extra })
const anchor = (id: string) => ({ type: 'anchor', id })

export const DEFAULT_HERO: Block = {
  id: 'dflt-hero', type: 'web.hero_film', visible: true,
  props: {
    kicker: 'Jimmy & Wax · Leather care',
    headline: 'Every finish has\na final gesture.',
    subhead: 'The complete ritual — polish, kits and care sets — staged where the light lands. Scroll to walk the table.',
    film: {
      desktop: local(`${V}/hero-collection-film-v5-1080p.mp4`),
      mobile: local(`${V}/hero-collection-film-v5-mobile.mp4`),
      poster: local('/media/products/collection-still-v5.jpg', 'The Jimmy and Wax collection, in one continuous film'),
    },
    scrubScroll: 2.6,
    ctas: [
      { id: 'dflt-cta-shop', label: 'Shop the objects', action: anchor('collection'), variant: 'solid' },
      { id: 'dflt-cta-ritual', label: 'Learn the ritual', action: anchor('ritual'), variant: 'ghost' },
    ],
  },
}

export const DEFAULT_RITUAL: Block[] = [
  {
    id: 'dflt-ritual-steps', type: 'web.ritual_steps', visible: true,
    props: {
      chapterLabel: 'Chapter 02 — The Ritual',
      kicker: 'The ritual · three minutes',
      headline: 'Brush. Apply.\nReveal.',
      subhead: 'The Jimmy & Wax care ritual is intentionally short: clean the surface, build a light coat, and buff until the leather catches light.',
      steps: [
        { id: 'dflt-step-1', n: '01', title: 'Clear the surface', body: 'A horsehair brush takes the dust the eye cannot see, so polish meets leather — not grit.', image: local(`${S}/step-clear-v1.jpg`, 'Horsehair brush clearing dust from the polished oxford toe, Twinkle Shine standing by') },
        { id: 'dflt-step-2', n: '02', title: 'Build the finish', body: 'Apply a little Twinkle Shine with an even, unhurried hand.', image: local(`${S}/twinkle-shine-bottle-2.jpg`, 'Twinkle Shine dispensed onto a soft cloth') },
        { id: 'dflt-step-3', n: '03', title: 'Let light return', body: 'Buff in long strokes until the cap-toe glows back at the room.', image: local(`${S}/step-reveal-v1.jpg`, 'Buffed leather toe glowing with specular sheen under warm light') },
      ],
    },
  },
  {
    id: 'dflt-ritual-scrub', type: 'web.scrub_film', visible: true,
    props: {
      film: local(`${V}/ritual-film-scrub-v4-1080p.mp4`),
      poster: local('/media/products/collection-still-v4.jpg'),
      label: 'The ritual, scrubbed by your scroll',
      beats: [
        { id: 'dflt-beat-1', title: 'Brush', body: 'Slow arcs lift the dust the eye cannot see.' },
        { id: 'dflt-beat-2', title: 'Apply', body: 'A little polish, worked in with a soft cloth in small circles.' },
        { id: 'dflt-beat-3', title: 'Reveal', body: 'Long buffing strokes — the leather starts returning the light.' },
      ],
    },
  },
  {
    id: 'dflt-ritual-after', type: 'web.media_split', visible: true,
    props: {
      mediaKind: 'video',
      media: local('/media/generated/video/commerce/twinkle-shine-bottle-motion-v2.mp4'),
      poster: local('/media/generated/products/twinkle-shine-catalog-v1.webp', 'The Twinkle Shine bottle turning under studio light'),
      kicker: 'The rhythm of care',
      headline: 'Made to be used,\nnot displayed.',
      body: 'The finish is not a trophy cabinet moment. It is a short, repeatable gesture — three minutes, done well, whenever the leather asks for it.',
      cta: { label: 'Choose your object', action: { type: 'product', productId: 'twinkle-shine-leather-polish' } },
      mediaSide: 'left',
      caption: 'Twinkle Shine · in light',
    },
  },
]

export const DEFAULT_STORY: Block[] = [
  {
    id: 'dflt-standards', type: 'web.standards_grid', visible: true,
    props: {
      chapterLabel: 'Chapter 03 — The Standard',
      kicker: 'Our standard',
      headline: 'Make the final\ngesture count.',
      subhead: 'Jimmy & Wax exists for the moment after a shoe is already good: the quiet care that makes it feel considered again.',
      items: [
        { id: 'dflt-std-1', n: '01', title: 'Material first', body: 'Wood, cloth, leather and lacquer are treated as tactile evidence—not decoration.', image: local(`${S}/std-material-v3.jpg`, 'Jimmy & Wax amber horsehair brush resting on a polished brown oxford toe — leather care materials under warm studio light') },
        { id: 'dflt-std-2', n: '02', title: 'Product truth', body: 'Objects shown in the shop start from supplied product photography. No invented packaging is presented as product fact.', image: local(`${S}/std-truth-v3.jpg`, 'Twinkle Shine leather polish lineup — kraft carton, silver refill pouch and retail display with the original mascot label') },
        { id: 'dflt-std-3', n: '03', title: 'Light, not noise', body: 'Motion is used to reveal surface, proportion and ritual. It never exists just to fill a page.', image: local(`${S}/std-light-v3.jpg`, 'The full Jimmy & Wax collection — polish bottle, refill pouch, care kit, brush and oxford shoes — staged under a single warm key light') },
      ],
    },
  },
  {
    id: 'dflt-evidence', type: 'web.evidence_rail', visible: true,
    props: {
      kicker: 'Evidence of the standard',
      headline: 'Details that\ncarry the room.',
      items: [
        { id: 'dflt-ev-1', image: local(`${S}/ev-toe-v1.jpg`, 'Grain fed, light returned'), caption: 'Grain fed, light returned' },
        { id: 'dflt-ev-2', image: local(`${S}/ev-cloth-v1.jpg`, 'Cloth, brush, and the mark'), caption: 'Cloth, brush, and the mark' },
        { id: 'dflt-ev-3', image: local(`${S}/twinkle-shine-refill-1.jpg`, 'Kraft and silver foil'), caption: 'Kraft and silver foil' },
        { id: 'dflt-ev-4', image: local(`${S}/twinkle-shine-care-kit-1.jpg`, 'The keeper box'), caption: 'The keeper box' },
        { id: 'dflt-ev-5', image: local(`${S}/twinkle-shine-refill-2.jpg`, 'The pour, unhurried'), caption: 'The pour, unhurried' },
        { id: 'dflt-ev-6', image: local(`${S}/ev-family-v1.jpg`, 'The family, shelf-ready'), caption: 'The family, shelf-ready' },
      ],
    },
  },
  {
    id: 'dflt-atelier', type: 'web.atelier_film', visible: true,
    props: {
      film: local(`${V}/atelier-branded-v2-1080p.mp4`),
      poster: local('/media/products/collection-still.jpg', 'Night drift across the full Jimmy and Wax collection under the brass lamp'),
      label: 'Night drift across the full Jimmy and Wax collection under the brass lamp',
      kicker: 'Inside the atelier',
      headlineLines: ['One table.', 'One light.', 'One finish at a time.'],
    },
  },
]

export const DEFAULT_REELS: Block = {
  id: 'dflt-reels', type: 'web.reels_rail', visible: true,
  props: { chapterLabel: 'Chapter 04 — Stories', title: 'Seven mornings,\none ritual.', storyIds: ['reel-unbox-office', 'reel-wardrobe', 'reel-school-run', 'reel-sunday-balcony', 'reel-interview', 'reel-wedding', 'reel-client-visit'] },
}
export const DEFAULT_JOURNAL: Block = {
  id: 'dflt-journal', type: 'web.journal_stack', visible: true,
  props: {
    chapterLabel: 'Chapter 05 — The Journal',
    headline: 'Notes that\nsell the ritual.',
    subhead: 'Field notes from the table — each one shops the product it speaks about. Scroll, and the deck flies.',
    noteIds: ['two-minute-rule', 'sunday-night', 'what-shine-says'],
    finale: {
      kicker: 'The shelf',
      title: 'Build the full ritual',
      excerpt: 'Polish, cloth and care essentials together — the shelf that keeps every finish deliberate.',
      image: local('/media/products/collection-still-v5.jpg', 'The complete Jimmy and Wax collection under the brass lamp'),
      productId: 'complete-care-kit',
    },
  },
}

export const DEFAULT_HOME: Block[] = [
  DEFAULT_HERO,
  { id: 'dflt-marquee', type: 'web.marquee', visible: true, props: { items: ['The finishing touch', 'Leather', 'Ritual', 'Light', 'The finishing touch', 'Leather', 'Ritual', 'Light'] } },
  { id: 'dflt-chapter', type: 'web.chapter_mark', visible: true, props: { index: '01', title: 'The Collection' } },
  {
    id: 'dflt-collection', type: 'web.collection_grid', visible: true,
    props: {
      kicker: 'The tangible ritual · the collection',
      headline: 'Objects for the\nlast look.',
      subhead: 'A few objects, one finishing gesture — open any object for its full story.',
      source: { kind: 'bestsellers' },
      cardStyle: 'tilt', hoverFilm: true,
    },
  },
  ...DEFAULT_RITUAL,
  ...DEFAULT_STORY,
  DEFAULT_REELS,
  DEFAULT_JOURNAL,
  {
    id: 'dflt-promo', type: 'web.promo_film', visible: true,
    props: {
      kicker: 'The film',
      headlineLines: ['Twenty seconds,', 'one final gesture.'],
      video: local(`${V}/promo-twinkle-shine-v2.mp4`),
      poster: local(`${S}/promo-poster-v2.jpg`),
      caption: 'Sound on — narrated. Cleans · Nourishes · Long-lasting shine · Premium care.',
    },
  },
  {
    id: 'dflt-closing', type: 'web.closing_cta', visible: true,
    props: {
      kicker: 'Built for the pieces you keep',
      headlineLines: ['Care is not', 'a shortcut.', 'It is the final', 'gesture.'],
      ctas: [
        { id: 'dflt-close-1', label: 'Shop the objects', action: anchor('collection'), variant: 'solid' },
        { id: 'dflt-close-2', label: 'Back to the beginning', action: anchor('top'), variant: 'ghost' },
      ],
      media: local('/media/products/collection-still-v5.jpg', 'The Jimmy and Wax collection staged under the studio key light'),
      caption: 'The collection · staged',
      footnote: 'Jimmy & Wax · Twinkle Shine',
    },
  },
]

const reel = (id: string, n: string, title: string, line: string, alt: string): [string, Story] =>
  [id, { id, title, line, alt, videoSrc: `${V}/${id}.mp4`, posterSrc: `${S}/${id}-poster.jpg`, position: Number(n) }]

export const DEFAULT_CONTENT: Content = {
  stories: Object.fromEntries([
    reel('reel-unbox-office', '1', 'The unboxing', 'A first kit, opened on a study desk — worn to the office by nine.', 'A young man unboxes the Jimmy and Wax kit at his desk, then buffs his oxford before leaving for the office'),
    reel('reel-wardrobe', '2', 'The wardrobe', 'One quiet minute with the cloth before the day starts.', 'A man in a white shirt polishing his shoe on an ottoman inside a warm-lit wardrobe'),
    reel('reel-school-run', '3', 'The school run', 'Polished, laced and worn — ready before the bell.', 'A father applies Twinkle Shine to his son’s black school shoes and helps him wear them'),
    reel('reel-sunday-balcony', '4', 'The Sunday balcony', 'Chai, newspaper, and a slow shine before the week begins.', 'An uncle in a kurta polishing his tan leather shoes on a sunlit balcony with the Twinkle Shine bottle beside his chai'),
    reel('reel-interview', '5', 'The interview', 'Black heels, mirror-bright for the room she is about to walk into.', 'A woman in a navy blazer polishing her black formal heels at her dressing table'),
    reel('reel-wedding', '6', 'The wedding', 'The night before, the shoes get their own ceremony.', 'A groom in a cream sherwani polishing his formal shoes while his cousin laughs'),
    reel('reel-client-visit', '7', 'The client visit', 'Two minutes at the wheel, then into the tower.', 'A sales manager polishing his oxford inside his parked car before a client meeting'),
  ]),
  journal: {
    'two-minute-rule': {
      id: 'two-minute-rule', kicker: 'Field note 01', readMinutes: 2, title: 'The two-minute rule',
      excerpt: 'A shine is not a weekend project. It is two quiet minutes, more often.',
      imageSrc: `${S}/journal-apply.jpg`, alt: 'Hands working Twinkle Shine polish into an oxford with the gray cloth, the navy-label bottle beside the shoe',
      productId: 'twinkle-shine-leather-polish',
      bodyMd: [
        'Most leather is not neglected — it is postponed. The full ritual looks heavy from across the room, so it waits for a free Sunday that never comes. The fix is smaller: two minutes, more often.',
        'Brush away the dust the eye skips. A coin-sized dab of Twinkle Shine on the gray cloth, worked in small circles along the toe and seams. One long buffing stroke to finish. That is the whole gesture.',
        'Little and often keeps the leather fed so it never needs rescuing — and the cloth in the kit is washable, so the habit costs you nothing but the two minutes.',
      ].join('\n\n'),
    },
    'sunday-night': {
      id: 'sunday-night', kicker: 'Field note 02', readMinutes: 2, title: 'School shoes, Sunday night',
      excerpt: 'Ten minutes on the couch on Sunday saves the whole week’s morning rush.',
      imageSrc: `${S}/journal-school.jpg`, alt: 'A father tying the laces of his son’s polished black school shoe while the boy waits in gray socks',
      productId: 'polish-cloth-kit',
      bodyMd: [
        'Black school shoes take the hardest week of any leather in the house — corridors, rain, football at break. They respond to the same ritual as formal oxfords, and they respond fast.',
        'Sunday night, one shoe on the knee: small circles of polish with the cloth, seam to seam. Then the second shoe while the first one settles. A father can talk a boy through it — or hand the cloth over by the second pair.',
        'The polish-and-cloth kit exists for exactly this rhythm: everything in one place, by the door. School shoes never wait for a weekend.',
      ].join('\n\n'),
    },
    'what-shine-says': {
      id: 'what-shine-says', kicker: 'Field note 03', readMinutes: 2, title: 'What the shine says',
      excerpt: 'Before you speak in a room, your shoes already said something. Make it deliberate.',
      imageSrc: `${S}/journal-family.jpg`, alt: 'The full Jimmy and Wax collection — care kit, bottle, refill pouch, brush and cloth — under the brass lamp',
      productId: 'complete-care-kit',
      bodyMd: [
        'An interview, a client meeting, a wedding: the shoes arrive before the handshake. A mirror finish is not vanity — it is the one detail of a first impression you fully control.',
        'The final buff is where it happens. After the polish has dried to a haze, long fast strokes with the clean side of the cloth pull the shine up out of the leather.',
        'Keep the kit by the door, not buried in a cupboard. The final gesture should be the easiest one to reach.',
      ].join('\n\n'),
    },
  },
}
