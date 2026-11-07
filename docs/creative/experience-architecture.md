# Jimmy & Wax experience architecture

## Core position

Jimmy & Wax is a tactile editorial commerce experience, not a video gate. The first usable paint must show the product story and the Shop path before any cinematic asset is available.

## Current implemented route

`/` is a single high-conversion landing and collection route:

1. **Hero:** dark, low-key product launch frame; concise value proposition; direct collection CTA.
2. **Brand statement:** material-led transition that establishes restraint and ritual.
3. **Care ritual:** prepare, apply, buff, grounded in the packaging’s observed application language.
4. **Collection:** verified bottle, refill pouch, and kit cards sourced from supplied photography.
5. **Care list:** persisted selection drawer with keyboard-safe close, controls, and no fabricated checkout.
6. **Closing CTA:** product-led final frame returning to Shop.

## Cinematic enhancement contract

When a video provider passes first-frame and end-frame continuity qualification, the hero and story chapters may be enhanced with Scroll World Architecture A:

- a still poster is visible immediately;
- each leg begins with the accepted last rendered frame of the preceding leg;
- each leg finishes in a slow forward drift;
- native 16:9 and native 9:16 chains are separate productions;
- Scroll World’s blob loading, seek coalescing, iOS priming, reduced-motion route, and seam crossfade are retained;
- a failed video always falls back to the static visual story without blocking browsing or cart actions.

The current Flow qualification does **not** meet that contract, so no Scroll World chain is wired yet.

## Commercial integrity

- Product names and formats are visible from supplied material.
- Price, volume, contents, variants, stock, shipping, returns, payments, and the checkout destination are not supplied. The site labels these as pending and disables checkout rather than inventing commerce facts.
- A working cart state exists so the later commerce adapter can attach without redesigning the experience.
