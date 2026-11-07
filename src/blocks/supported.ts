/**
 * Every website block type this build can draw. Sent to the server in the `caps=` part of `x-jw-client` so it holds
 * back anything newer. A unit test asserts that the block registry implements EXACTLY this list.
 */
export const SUPPORTED_BLOCKS = [
  'web.hero_film', 'web.marquee', 'web.chapter_mark', 'web.collection_grid', 'web.ritual_steps', 'web.scrub_film',
  'web.media_split', 'web.standards_grid', 'web.evidence_rail', 'web.atelier_film', 'web.reels_rail', 'web.journal_stack',
  'web.promo_film', 'web.closing_cta', 'web.testimonials', 'web.rich_text', 'web.image', 'web.product_grid', 'web.faq',
  'web.announcement_bar', 'web.spacer',
] as const
export type BlockType = (typeof SUPPORTED_BLOCKS)[number]
