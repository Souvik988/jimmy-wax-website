import { Component, type ComponentType, type CSSProperties, type ErrorInfo, type ReactNode, useSyncExternalStore } from 'react'
import type { Block, BlockStyle } from '../lib/types'
import { session } from '../lib/api'
import { useCatalog } from '../lib/catalog'
import { SUPPORTED_BLOCKS, type BlockType } from './supported'
import {
  AnnouncementBarBlock, ChapterMarkBlock, ClosingCtaBlock, CollectionGridBlock, FaqBlock, HeroFilmBlock, ImageBlock, MarqueeBlock,
  ProductGridBlock, PromoFilmBlock, RichTextBlock, SpacerBlock, TestimonialsBlock, type BlockProps,
} from './core'
import {
  AtelierFilmBlock, EvidenceRailBlock, JournalStackBlock, MediaSplitBlock, ReelsRailBlock, RitualStepsBlock, ScrubFilmBlock, StandardsGridBlock,
} from './story'

/** The one place a block type becomes a component. A test pins this to SUPPORTED_BLOCKS. */
export const REGISTRY: Record<BlockType, ComponentType<BlockProps>> = {
  'web.hero_film': HeroFilmBlock,
  'web.marquee': MarqueeBlock,
  'web.chapter_mark': ChapterMarkBlock,
  'web.collection_grid': CollectionGridBlock,
  'web.ritual_steps': RitualStepsBlock,
  'web.scrub_film': ScrubFilmBlock,
  'web.media_split': MediaSplitBlock,
  'web.standards_grid': StandardsGridBlock,
  'web.evidence_rail': EvidenceRailBlock,
  'web.atelier_film': AtelierFilmBlock,
  'web.reels_rail': ReelsRailBlock,
  'web.journal_stack': JournalStackBlock,
  'web.promo_film': PromoFilmBlock,
  'web.closing_cta': ClosingCtaBlock,
  'web.testimonials': TestimonialsBlock,
  'web.rich_text': RichTextBlock,
  'web.image': ImageBlock,
  'web.product_grid': ProductGridBlock,
  'web.faq': FaqBlock,
  'web.announcement_bar': AnnouncementBarBlock,
  'web.spacer': SpacerBlock,
}
export const isKnownBlock = (type: string): type is BlockType => Object.prototype.hasOwnProperty.call(REGISTRY, type)

/** Default in-page anchor for the first block of a type (so built-in "jump to" links keep working). */
const DEFAULT_ANCHORS: Partial<Record<BlockType, string>> = {
  'web.collection_grid': 'collection', 'web.ritual_steps': 'ritual', 'web.standards_grid': 'standard', 'web.reels_rail': 'stories', 'web.journal_stack': 'journal',
}

/** One broken block must never take the page down. */
class BlockBoundary extends Component<{ block: Block; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn(`[experience] block ${this.props.block.type} (${this.props.block.id}) failed to render and was skipped`, error.message, info.componentStack?.split('\n')[1]?.trim())
  }
  render() { return this.state.failed ? null : this.props.children }
}

const PADDING: Record<NonNullable<BlockStyle['padding']>, string> = { none: '0', sm: 'clamp(16px, 2vw, 28px)', md: 'clamp(32px, 4vw, 56px)', lg: 'clamp(56px, 7vw, 104px)', xl: 'clamp(88px, 11vw, 160px)' }
const RADIUS: Record<NonNullable<BlockStyle['radius']>, string> = { none: '0', frame: 'var(--r-frame)', card: 'var(--r-card)', large: 'var(--r-large, 20px)' }

/** Maps a BlockStyle to inline CSS. Colours only ever come from a role token, a palette key or a validated hex. */
export function styleFor(style: BlockStyle | undefined): CSSProperties | null {
  if (!style || typeof style !== 'object') return null
  const css: CSSProperties = {}
  const bg = style.background as Record<string, unknown> | undefined
  if (bg) {
    if (typeof bg.token === 'string' && /^[a-z]+\.[A-Za-z]+$/.test(bg.token)) css.background = `var(--jw-${bg.token.replace(/\./g, '-')})`
    else if (typeof bg.palette === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(bg.palette)) css.background = `var(--jw-palette-${bg.palette})`
    else if (typeof bg.hex === 'string' && /^#(?:[0-9a-f]{6}|[0-9a-f]{8})$/i.test(bg.hex)) css.background = bg.hex
  }
  if (style.padding && PADDING[style.padding]) { css.paddingBlock = PADDING[style.padding] }
  if (style.align === 'center') css.textAlign = 'center'
  if (style.radius && RADIUS[style.radius]) { css.borderRadius = RADIUS[style.radius]; css.overflow = 'hidden' }
  if (style.divider) css.borderTop = '1px solid var(--line)'
  if (style.width === 'contained') { css.maxWidth = 'min(1280px, 100%)'; css.marginInline = 'auto' }
  return Object.keys(css).length || style.anchorId ? css : null
}

/** Client-side visibility rules that the server cannot know (signed-in state, store paused). */
export function ruleAllows(rules: Block['rules'], signedIn: boolean, paused: boolean): boolean {
  if (!rules) return true
  if (rules.auth === 'signed_in' && !signedIn) return false
  if (rules.auth === 'signed_out' && signedIn) return false
  if (rules.storePaused === 'only_when_paused' && !paused) return false
  if (rules.storePaused === 'hide_when_paused' && paused) return false
  return true
}

/** Renders blocks in the order given. Unknown types, hidden blocks and rule failures are skipped. */
export function BlockList({ blocks }: { blocks: Block[] }) {
  const signedIn = useSyncExternalStore(session.subscribe, session.isSignedIn)
  const { settings } = useCatalog()
  const paused = !!settings?.ordersPaused
  const claimed = new Set<string>()
  return (
    <>
      {blocks.map((block) => {
        if (!block || typeof block.type !== 'string' || !isKnownBlock(block.type)) return null
        if (block.visible === false || !ruleAllows(block.rules, signedIn, paused)) return null
        const Comp = REGISTRY[block.type]
        const def = DEFAULT_ANCHORS[block.type]
        const anchor = def && !claimed.has(def) ? def : undefined
        if (anchor) claimed.add(anchor)
        const css = styleFor(block.style)
        return (
          <div
            key={block.id}
            className={css ? 'jw-block jw-block--styled' : 'jw-block'}
            data-jw-block={block.id}
            data-jw-type={block.type}
            id={block.style?.anchorId}
            style={css ?? undefined}
          >
            <BlockBoundary block={block}><Comp block={block} anchor={anchor} /></BlockBoundary>
          </div>
        )
      })}
    </>
  )
}

export { SUPPORTED_BLOCKS }
