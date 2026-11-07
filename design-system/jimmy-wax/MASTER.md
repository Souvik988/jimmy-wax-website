# Jimmy & Wax design system

Status: initial system, grounded in the supplied product photography and informed by UI UX Pro Max research on 2026-09-21.

## Visual principles

1. **Tactile before decorative.** Leather grain, microfiber pile, silver foil, kraft fibres, and brush bristles are the visual drama.
2. **Quiet cinematic framing.** Use darkness and negative space to direct attention, not gradients or persistent effects.
3. **Commerce stays obvious.** One clearly identified primary action per view; product, price, availability, and checkout data must be factual.
4. **Brand truth wins.** The original product label is an identity anchor; generative material never replaces it where legibility matters.

## Palette

Photograph-derived approximations, to be implemented as semantic tokens rather than scattered literals.

| Role | Token | Value |
| --- | --- | --- |
| deepest ground | `--jw-ink` | `#130B08` |
| walnut surface | `--jw-walnut` | `#2A1711` |
| leather brown | `--jw-leather` | `#6E301D` |
| refined brass | `--jw-gold` | `#C99534` |
| label navy | `--jw-navy` | `#10234B` |
| kraft | `--jw-kraft` | `#B77A36` |
| soft ivory | `--jw-ivory` | `#F4E9D5` |
| cloth gray | `--jw-mist` | `#B2AAA2` |
| foil | `--jw-silver` | `#C5C9C8` |
| focus / interactive gold | `--jw-focus` | `#F3C45B` |

Semantic roles: `surface` is walnut or near-black, `surface-raised` is a gently lifted espresso panel, `text-primary` is ivory, `text-secondary` is `#D3C4B4`, and `border-subtle` is an ivory tint at 18% opacity. Validate text contrast at implementation time.

## Typography

- Display: `Playfair Display`, 500–600. Use for concise editorial statements only.
- UI/body: `Manrope`, 400–700, 16px minimum on small screens.
- Display scale: 40 / 56 / 72px (mobile/tablet/desktop hero); product headings 32 / 40px; body 16–18px at 1.55–1.7 line height.
- Use tabular figures for price only after factual price data exists.

## Layout, spacing, and elevation

- 4px base unit; component spacing: 8, 12, 16, 24, 32; section spacing: 56, 80, 120, 160.
- Content max width: 1280px, with 20px mobile gutters and 48–64px desktop gutters.
- Product grids: 1 column under 620px, 2 to 960px, 3 above 960px.
- Radii: 4px for product-image frames, 10px for cards/drawers, full pill only for compact status badges.
- Elevation uses a restrained black shadow and a 1px translucent ivory border; no glassmorphism, chromatic effects, or bulky drop shadows.

## Components and states

- **Navigation:** compact wordmark, Shop and Care links, cart control with an accessible count; mobile navigation becomes an accessible drawer.
- **Buttons:** 44px minimum target. Primary = brass on ink; secondary = transparent with ivory border; visible hover, pressed, disabled, and 2–3px focus states.
- **Product cards:** truthful product image, name, supported descriptor, price only when supplied, and direct Add to Cart. Hover must never be the sole way to access an action.
- **PDP:** gallery left / purchasable information right on desktop; gallery then sticky purchase panel on mobile. Include shipping, variants, and care facts only when sourced.
- **Cart and drawer:** never delay cart state for animation; escape closes drawer, focus moves into it and returns to trigger, keyboard quantity controls are labelled.
- **Forms:** persistent labels, precise local errors, at least 44px inputs and buttons.

## Motion

- Motion must explain material, hierarchy, or a completed action. Micro-interactions: 160–240ms; panels: 240–360ms; cinematic sequence is scroll-scrubbed with no UI blocking.
- Implement Architecture A: each video leg starts on the preceding accepted rendered final frame and ends in a calm forward drift. No synthetic connector pulls for the grounded leather treatment.
- Respect `prefers-reduced-motion`: still-image story, no video loading, no decorative particles, instant/non-spatial state transitions.

## Responsive and accessible behaviour

- Validate at 375px, 768px, 1024px, and 1440px; no horizontal overflow.
- Native 9:16 source media is required for the mobile cinematic after opt-in; do not crop the desktop story silently.
- Keyboard order follows the visual order; include a skip link; maintain sequential headings; labels and image alternatives describe useful content.
- Meet WCAG AA contrast for normal text, retain visible focus, avoid colour-only status, and preserve semantic buttons/links.

## Photography and prohibited patterns

- Preserve the supplied warm key light, dark wood, and material contrast. Favour close shots of leather sheen and the ritual of dispensing, applying, and buffing.
- Never use generic blue SaaS colours, purple gradients, glassmorphism, neon cyberpunk, stock leather imagery, emoji controls, fake ratings, invented reviews, or unsupported performance/certification claims.
