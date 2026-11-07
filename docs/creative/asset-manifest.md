# Jimmy & Wax asset manifest — initial

## Raw source assets

All raw photography remains in `products demo/`; it must not be moved into the public runtime directory.

| Asset | Dimensions | Intended reuse |
| --- | ---: | --- |
| `Dsc06170.jpg` | 1536 × 1024 | family fallback poster |
| `DSC06202.jpg` | 7008 × 4672 | bottle / kit card source |
| `DSC06211.jpg` | 6886 × 4591 | gift-kit PDP source |
| `DSC06276.jpg` | 6846 × 4564 | refill PDP source |
| `DSC06309.jpg` | 6973 × 4649 | black leather campaign source |
| `DSC06311.jpg` | 7008 × 4280 | accessory composition source |
| `DSC06320.jpg` | 7008 × 4672 | retail story source |
| `DSC06360.jpg` | 7008 × 4672 | brown-leather hero source |
| `DSC06458.jpg` | 7008 × 4672 | refill ritual source |
| `DSC06504.jpg` | 7008 × 4672 | bottle ritual source |

## Planned derived asset families

- verified commerce stills: bottle, refill pouch, care kit, accessories
- campaign stills: brown-leather shine, ritual macro, family / collection
- desktop cinematic: native 16:9 posters and an Architecture-A test chain
- mobile cinematic: separately generated native 9:16 posters and chain, never a silent centre crop
- safe fallbacks: high-quality stills for every cinematic section

## Current generated assets

| Asset | Runtime path | Status / use |
| --- | --- | --- |
| Campaign anchor still | `public/media/generated/stills/hero-style-anchor-v1.png` | Approved editorial hero fallback; not used to communicate commerce copy. |
| Hero master delivery | `public/media/generated/video/desktop/hero-hypermotion-v1.mp4` | Completed Flow final delivery only, watermark removal verified. Source for web encoding. |
| Hero web delivery | `public/media/generated/video/desktop/hero-hypermotion-web-v1.mp4` | Silent H.264 / 1280×720 / 24 fps / 4 s hero video, autoplaying inline with the anchor still behind it. |
| Hero 1080p desktop delivery | `public/media/generated/video/desktop/hero-hypermotion-1080p-v1.mp4` | Silent H.264 / 1920×1080 / 24 fps / 4 s, high-quality upscale of the approved 720p Flow final for desktop Scroll World playback; not a native-1080 Flow claim. |
| Smooth hero motion | `public/media/generated/video/desktop/hero-hypermotion-smooth-v1.mp4` and `hero-hypermotion-smooth-mobile-v1.mp4` | Current hero route: silent six-second source-anchored 30-fps motion plates. 1920×1080 desktop and 1280×720 mobile variants preserve the approved product/still composition exactly. |
| Flow qualification clip | `public/media/generated/video/desktop/flow-qualification-v1.mp4` | Retained as a rejected Architecture-A continuity test; not presented in the site. |
| Scroll World campaign worlds | `public/media/generated/stills/scroll-world/*-world-v1.png` | Three ImageGen campaign posters based on supplied product photographs; each carries the Jimmy & Wax brass engraving / W motif. |
| Scroll World Omni chapters | `public/media/generated/video/desktop/scroll-world/*-world-web-v1.mp4` | Three silent, watermark-removed Google Omni web encodes for scrubbed pinned chapters. |
| Scroll World 1080p desktop chapters | `public/media/generated/video/desktop/scroll-world/*-world-1080p-v1.mp4` | Three silent H.264 / 1920×1080 / 24 fps desktop upscales of the approved 720p Google Omni finals. The parallel 720p web encodes remain the mobile route. |
| Source-conditioned product portraits | `public/media/generated/products/*-catalog-v1.png` | Three single-product catalog portraits made from the supplied Jimmy & Wax product photos and used by the commerce cards and PDPs. |
| Product motion plates | `public/media/generated/video/commerce/*.mp4` | Three silent H.264 / 1920×1080 / 24 fps / 4 s motion treatments authored directly from the approved catalog portraits; small GOP and `faststart` retain product silhouette and packaging truth. |
