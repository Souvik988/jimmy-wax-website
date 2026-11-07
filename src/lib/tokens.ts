import type { Bundle } from './types'
import { resolveMedia } from './media'

/**
 * Design tokens (bundle.tokens = design system + this channel's overrides, already merged by the server) →
 * CSS custom properties on :root. Built-in values live in styles/tokens.css and stay the defaults: with no bundle
 * (or a failed one) nothing here runs and the page is unchanged. Every value is validated before it reaches CSS,
 * so a bad document can never inject anything but a colour, number or font name.
 */
type Rec = Record<string, unknown>
const isRec = (v: unknown): v is Rec => v !== null && typeof v === 'object' && !Array.isArray(v)
const HEX = /^#(?:[0-9a-f]{6}|[0-9a-f]{8})$/i
const NAME = /^[A-Za-z0-9 _.'-]{1,60}$/
const STACK = /^[A-Za-z0-9 _.,'"-]{1,140}$/
const SLUGKEY = /^[A-Za-z0-9_-]{1,40}$/

const num = (v: unknown, min: number, max: number): number | null => (typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : null)
const hex = (v: unknown): string | null => (typeof v === 'string' && HEX.test(v) ? v : null)
const roleVar = (role: string) => `--jw-${role.replace(/\./g, '-')}`

/** role → legacy variable names the existing stylesheets already use. */
const LEGACY: Record<string, string[]> = {
  'bg.base': ['--ink'],
  'bg.raised': ['--ink-2'],
  'bg.elevated': ['--espresso'],
  'bg.overlay': ['--scrim'],
  'text.primary': ['--ivory'],
  'text.secondary': ['--ivory-dim'],
  'text.muted': ['--mist'],
  'text.onAccent': ['--on-accent'],
  'border.subtle': ['--line'],
  'border.strong': ['--line-strong'],
  'accent.primary': ['--gold-soft'],
  'accent.hover': ['--accent-hover'],
  'accent.pressed': ['--gold'],
  'accent.soft': ['--accent-soft'],
  'focus.ring': ['--gold-bright'],
}
const PALETTE_LEGACY: Record<string, string> = { walnut: '--walnut', leather: '--leather', navy: '--navy', kraft: '--kraft', silver: '--silver' }

const px = (n: number) => `${Math.round(n * 100) / 100}px`
const rem = (n: number) => `${Math.round((n / 16) * 1000) / 1000}rem`
/** Fluid size that reaches exactly `size` px at a 1440 px viewport and never drops below 55% of it. */
const fluid = (size: number) => `clamp(${px(size * 0.55)}, ${Math.round((size / 14.4) * 100) / 100}vw, ${px(size)})`
const shadow = (s: unknown): string | null => {
  if (!isRec(s)) return null
  const x = num(s.x, -40, 40), y = num(s.y, -40, 40), b = num(s.blur, 0, 120), sp = num(s.spread, -40, 40), c = hex(s.color)
  return x === null || y === null || b === null || sp === null || !c ? null : `${px(x)} ${px(y)} ${px(b)} ${px(sp)} ${c}`
}
const bezier = (v: unknown): string | null => {
  if (!Array.isArray(v) || v.length !== 4) return null
  const n = v.map((x) => num(x, -2, 2))
  return n.some((x) => x === null) ? null : `cubic-bezier(${n.join(', ')})`
}
const family = (f: unknown): string | null => {
  if (!isRec(f) || typeof f.family !== 'string' || !NAME.test(f.family)) return null
  const fb = typeof f.fallback === 'string' && STACK.test(f.fallback) ? f.fallback : 'sans-serif'
  return `"${f.family}", ${fb}`
}

export interface TokenOutput { vars: Record<string, string>; motion?: string }

export function tokensToCss(tokens: unknown): TokenOutput {
  const vars: Record<string, string> = {}
  if (!isRec(tokens)) return { vars }
  const set = (k: string, v: string | null) => { if (v !== null) vars[k] = v }

  // ---- colour
  const color = isRec(tokens.color) ? tokens.color : {}
  const roles = isRec(color.roles) ? color.roles : {}
  for (const [role, v] of Object.entries(roles)) {
    const c = hex(v)
    if (!c || !/^[a-z]+\.[A-Za-z]+$/.test(role)) continue
    vars[roleVar(role)] = c
    for (const legacy of LEGACY[role] ?? []) vars[legacy] = c
  }
  const palette = isRec(color.palette) ? color.palette : {}
  for (const [name, v] of Object.entries(palette)) {
    const c = hex(v)
    if (!c || !SLUGKEY.test(name)) continue
    vars[`--jw-palette-${name}`] = c
    if (PALETTE_LEGACY[name]) vars[PALETTE_LEGACY[name]!] = c
  }
  const gradients = isRec(color.gradients) ? color.gradients : {}
  for (const [name, g] of Object.entries(gradients)) {
    if (!SLUGKEY.test(name) || !isRec(g) || !Array.isArray(g.stops)) continue
    const angle = num(g.angle, 0, 360) ?? 180
    const stops = g.stops.flatMap((s) => {
      const at = isRec(s) ? num(s.at, 0, 1) : null
      const c = isRec(s) ? hex(s.color) : null
      return at !== null && c ? [`${c} ${Math.round(at * 1000) / 10}%`] : []
    })
    if (stops.length >= 2) vars[`--jw-gradient-${name}`] = `linear-gradient(${angle}deg, ${stops.join(', ')})`
  }

  // ---- type
  const type = isRec(tokens.type) ? tokens.type : {}
  const fams = isRec(type.families) ? type.families : {}
  set('--font-display', family(fams.display))
  set('--font-body', family(fams.body))
  set('--font-mono', family(fams.mono))
  const scale = isRec(type.scale) ? type.scale : {}
  const sizeOf = (k: string) => (isRec(scale[k]) ? num((scale[k] as Rec).size, 8, 200) : null)
  for (const k of ['hero', 'h1', 'h2', 'h3'] as const) { const s = sizeOf(k); if (s !== null) vars[`--fs-${k}`] = fluid(s) }
  for (const k of ['body', 'small', 'label'] as const) { const s = sizeOf(k); if (s !== null) vars[`--fs-${k}`] = rem(s) }
  for (const k of ['hero', 'h1', 'h2', 'h3', 'body', 'small', 'label']) {
    const e = scale[k]
    if (!isRec(e)) continue
    const w = num(e.weight, 100, 900), lh = num(e.lineHeight, 0.8, 2.5), tr = num(e.tracking, -0.2, 0.5)
    if (w !== null) vars[`--jw-fw-${k}`] = String(Math.round(w))
    if (lh !== null) vars[`--jw-lh-${k}`] = String(lh)
    if (tr !== null) vars[`--jw-tr-${k}`] = `${tr}em`
  }
  const heroTr = isRec(scale.hero) ? num((scale.hero as Rec).tracking, -0.2, 0.5) : null
  if (heroTr !== null) vars['--track-display'] = `${heroTr}em`
  const labelTr = isRec(scale.label) ? num((scale.label as Rec).tracking, -0.2, 0.5) : null
  if (labelTr !== null) vars['--track-label'] = `${labelTr}em`

  // ---- radius / elevation
  const radius = isRec(tokens.radius) ? tokens.radius : {}
  for (const [k, v] of Object.entries({ frame: '--r-frame', card: '--r-card', pill: '--r-pill', control: '--r-control', large: '--r-large', hero: '--r-hero' })) {
    const n = num(radius[k], 0, 999); if (n !== null) vars[v] = px(n)
  }
  const elevation = isRec(tokens.elevation) ? tokens.elevation : {}
  set('--shadow-lift', shadow(elevation.raised))
  set('--shadow-overlay', shadow(elevation.overlay))

  // ---- motion
  const motion = isRec(tokens.motion) ? tokens.motion : {}
  const dur = isRec(motion.durations) ? motion.durations : {}
  for (const [k, v] of Object.entries({ fast: '--t-fast', medium: '--t-med', slow: '--t-slow' })) { const n = num(dur[k], 0, 3000); if (n !== null) vars[v] = `${Math.round(n)}ms` }
  const eas = isRec(motion.easings) ? motion.easings : {}
  set('--ease-soft', bezier(eas.standard))
  set('--ease-expo', bezier(eas.emphasis))
  set('--ease-curtain', bezier(eas.curtain))

  // ---- surfaces
  const surfaces = isRec(tokens.surfaces) ? tokens.surfaces : {}
  const grain = isRec(surfaces.grain) ? surfaces.grain : {}
  const go = num(grain.opacity, 0, 0.5); if (go !== null) vars['--grain-opacity'] = String(go)
  const backdrop = isRec(surfaces.backdrop) ? surfaces.backdrop : {}
  const tint = hex(backdrop.tint), ta = num(backdrop.tintOpacity, 0, 1)
  if (tint && ta !== null) vars['--jw-backdrop-tint'] = tint + Math.round(ta * 255).toString(16).padStart(2, '0')

  // ---- components
  const comp = isRec(tokens.components) ? tokens.components : {}
  const button = isRec(comp.button) ? comp.button : {}
  if (button.shape === 'pill') vars['--btn-radius'] = '999px'
  else if (button.shape === 'rounded') vars['--btn-radius'] = '12px'
  const bh = num(button.minHeight, 24, 80); if (bh !== null) vars['--btn-min-h'] = px(bh)
  const variants = isRec(button.variants) ? button.variants : {}
  const roleRef = (r: unknown) => (typeof r === 'string' && /^[a-z]+\.[A-Za-z]+$/.test(r) ? `var(${roleVar(r)})` : null)
  for (const [name, key] of [['primary', 'solid'], ['ghost', 'ghost']] as const) {
    const v = variants[name]
    if (!isRec(v)) continue
    set(`--btn-${key}-bg`, roleRef(v.background))
    set(`--btn-${key}-fg`, roleRef(v.foreground))
    set(`--btn-${key}-border`, roleRef(v.border))
  }
  const card = isRec(comp.card) ? comp.card : {}
  if (card.radius === 'large') vars['--card-radius'] = 'var(--r-large)'
  else if (card.radius === 'card') vars['--card-radius'] = 'var(--r-card)'
  const input = isRec(comp.input) ? comp.input : {}
  const ih = num(input.minHeight, 24, 80); if (ih !== null) vars['--input-min-h'] = px(ih)
  const header = isRec(comp.header) ? comp.header : {}
  if (typeof header.background === 'string') {
    const hb = roleRef(header.background) ?? (hex(header.background) ?? (header.background === 'transparent' ? 'transparent' : null))
    if (hb) vars['--header-bg'] = hb
  }
  if (typeof header.blurOnScroll === 'boolean') vars['--header-blur'] = header.blurOnScroll ? 'blur(14px)' : 'none'

  return { vars, motion: motion.intensity === 'calm' || motion.intensity === 'standard' || motion.intensity === 'cinematic' ? motion.intensity : undefined }
}

let applied = new Set<string>()
export function applyTokens(tokens: unknown): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const { vars, motion } = tokensToCss(tokens)
  for (const k of applied) if (!(k in vars)) root.style.removeProperty(k)
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v)
  applied = new Set(Object.keys(vars))
  if (motion) root.dataset.motion = motion; else delete root.dataset.motion
}

/** Registers uploaded fonts (families[x].mediaId) with the FontFace API — no <style>, so a strict CSP is fine. */
const loadedFonts = new Set<string>()
export function loadFonts(bundle: Pick<Bundle, 'tokens' | 'media'>): void {
  if (typeof document === 'undefined' || typeof FontFace === 'undefined') return
  const type = isRec(bundle.tokens) && isRec(bundle.tokens.type) ? bundle.tokens.type : {}
  const fams = isRec(type.families) ? type.families : {}
  for (const f of Object.values(fams)) {
    if (!isRec(f) || typeof f.mediaId !== 'string' || typeof f.family !== 'string' || !NAME.test(f.family)) continue
    const m = resolveMedia(bundle as Pick<Bundle, 'media'>, { mediaId: f.mediaId })
    if (!m || m.kind !== 'font') continue
    const key = `${f.family}|${m.url}`
    if (loadedFonts.has(key)) continue
    loadedFonts.add(key)
    const face = new FontFace(f.family, `url("${m.url.replace(/["\\\s]/g, encodeURIComponent)}")`, { display: 'swap' })
    face.load().then(() => document.fonts.add(face)).catch(() => loadedFonts.delete(key))
  }
}
