/**
 * Shapes of the published experience bundle for the website channel
 * (see jimmy&wax_dashboard/docs/backend-contract/{openapi.yaml,blocks.schema.json,doc-schemas.json}).
 * Everything is optional-ish on purpose: the bundle is DATA from a server, so every reader must tolerate gaps.
 */
export type Action = { type: string; [k: string]: unknown }

/** A MediaRef as authored in the Studio; `local` is only used by the built-in defaults (a path under /media). */
export interface MediaRef {
  mediaId?: string
  alt?: string
  decorative?: boolean
  focal?: { x: number; y: number }
  fit?: 'cover' | 'contain'
  local?: string
  localPoster?: string
}

export interface MediaVariant { url: string; width: number }
export interface MediaItem {
  id: string
  kind: 'image' | 'video' | 'font'
  url: string
  alt?: string
  width?: number | null
  height?: number | null
  poster?: { url: string; width?: number; height?: number } | null
  variants?: MediaVariant[]
  decorative?: boolean
  bundledKey?: string | null
}

export interface BlockRules { auth?: 'any' | 'signed_out' | 'signed_in'; storePaused?: 'any' | 'only_when_paused' | 'hide_when_paused' }
export interface BlockStyle {
  background?: { token: string } | { palette: string } | { hex: string }
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  width?: 'contained' | 'full'
  align?: 'start' | 'center'
  radius?: 'none' | 'frame' | 'card' | 'large'
  divider?: boolean
  anchorId?: string
}
export interface Block {
  id: string
  type: string
  visible?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: Record<string, any>
  rules?: BlockRules
  style?: BlockStyle
  resolved?: { productIds?: string[]; reviews?: unknown[] }
}

export interface Seo {
  title?: string
  description?: string
  canonical?: string
  noindex?: boolean
  ogImage?: MediaRef
  structuredData?: { organization?: boolean; product?: boolean; breadcrumb?: boolean }
}
export interface PageDoc {
  title?: string
  seo?: Seo
  nativeSections?: Array<{ key: string; visible: boolean }>
  blocks: Block[]
}

export interface NavLink { id: string; label: string; action: Action }
export interface Navigation {
  links?: NavLink[]
  footerColumns?: Array<{ id: string; title: string; links: NavLink[] }>
  cart?: { label?: string }
}
export interface Chrome {
  brand?: { wordmark?: string; mark?: string }
  veil?: { enabled?: boolean; mark?: string; name?: string; subline?: string; durationMs?: number }
  effects?: { grain?: boolean; cursor?: boolean; smoothScroll?: { enabled?: boolean; speedCap?: number } }
  seoDefaults?: { titleTemplate?: string; description?: string }
  footer?: { tagline?: string; bottomLeft?: string; bottomRight?: string }
  slots?: Record<string, MediaRef>
}

export interface Content {
  careGuides?: Record<string, CareGuide>
  faqGroups?: Record<string, FaqGroup>
  stories?: Record<string, Story>
  journal?: Record<string, JournalNote>
  testimonials?: Record<string, Testimonial>
  announcements?: Announcement[]
}
export interface CareGuide { id?: string; title?: string; intro?: string; steps?: Array<{ label: string; title: string; body: string; image: MediaRef }>; cta?: Action | null }
export interface FaqGroup { id?: string; title?: string; items?: Array<{ q: string; aMd: string }> }
export interface Story { id?: string; title?: string; line?: string; videoMediaId?: string; posterMediaId?: string; alt?: string; productId?: string | null; position?: number; videoSrc?: string; posterSrc?: string }
export interface JournalNote {
  id?: string; kicker?: string; readMinutes?: number; title?: string; excerpt?: string
  imageMediaId?: string | null; alt?: string; bodyMd?: string; productId?: string | null; publishedAt?: string | null
  imageSrc?: string
}
export interface Testimonial {
  id?: string; name?: string; city?: string | null; avatarMediaId?: string | null; quote?: string; rating?: number
  source?: string; videoMediaId?: string | null; posterMediaId?: string | null; position?: number
}
export interface Announcement { id: string; text: string; tone?: string; channels?: string[]; action?: Action | null }

export interface Bundle {
  schemaVersion: number
  channel: string
  enabled: boolean
  release?: { id?: string; number?: number; label?: string; publishedAt?: string | null } | null
  tokens?: Record<string, unknown>
  navigation?: Navigation
  chrome?: Chrome
  pages: Record<string, PageDoc>
  media: Record<string, MediaItem>
  content?: Content
  variables?: Record<string, string>
  generatedAt?: string
}
