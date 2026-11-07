# Jimmy & Wax progress log

## 2026-09-29 — Round 23: Lenis scroll cap + deck polish (the "no fast scrolling" pass)

User directive: the site itself must scroll slowly no matter how fast the wheel spins ("user cannot do fast scroll at once — everything visually readable"), and the deck card animation looked cheap.

### Shipped

- **Lenis site-wide smooth scroll** (`lerp: 0.07`, wheel 0.9, touch native, skipped under reduced motion) — initialized in App, exposed for anchor jumps. **Proven with a violent 6000px wheel burst**: the page glided over ~2.2s (366px @41ms → 1,023px @81ms → 5,400px @2,234ms, 55 frames of visible glide past 500px) — an uncapped scroll would have jumped instantly. Nav/footer anchor jumps route through `lenis.scrollTo`.
- **Scroll locks routed through Lenis**: cart drawer + article reader call `lockPageScroll` (Lenis stop/start + body overflow) — the page can't scroll behind overlays anymore.
- **Deck animation polish** (no more cheap slide): per-card eased interpolation (ease-out cubic via v13 easing functions), the exiting card **scales up 1→1.08 toward the camera** while a flick rotation takes it out (tilt→tilt−13°), and the dissolve only happens in the last 5% — reads as a dealt card being lifted off the deck, not a fading rectangle. Verified live: flying card at scale 1.074, behind cards at 1.0.

### Note

Motion v13 breaking change: `useTransform` options' `ease` takes **easing functions**, not bezier tuples (typescript-caught, fixed).

## 2026-09-29 — Round 22: scroll normalization + reel queue + deck order fix + typography (UI/UX Pro pass)

User review round: (1) scroll speed must be normalized — fast or slow, animations must stay readable; (2) reels must be a row-wise queue that slides with the scroll, playing only on hover — never autoplay; (3) the journal deck flew in the wrong order (back cards rose before the front); (4) the site still felt AI-slop — typography upgrade demanded; (5) desktop felt small. UI/UX Pro Max skill consulted: its top luxury-e-commerce pairing (Playfair Display + Inter) adopted.

### Shipped

- **Scroll normalization everywhere**: shared `bindScrollSlide` helper (rAF lerp 0.12, IO-gated) drives the evidence rail AND the new reel queue — however fast the visitor scrolls, the strips move at a constant readable pace and settle exactly. The journal deck runs on a single shared `useSpring` (stiffness 110 / damping 26) — same normalization for the 3D deck.
- **Reels rebuilt as a scroll-linked queue**: 320vh runway, sticky viewport, the seven reels pass one by one (lerp-driven), edge-fade mask, "hover to play" hint. **No autoplay**: reels arm and play only on cursor hover (tap toggles on touch); posters stand in otherwise. Reduced motion: static grid, click-to-play.
- **Journal deck order fixed + enlarged**: the front card now visibly flies first (verified card-by-card: front departs at 30% while behind cards wait, each following in turn), exiting cards dissolve as they leave so only the behind card reads, stage enlarged on desktop (min(540px, 34vw) × min(700px, 76svh)).
- **Typography**: Playfair Display (display) + Inter (body/UI) replace Cormorant Garamond + Manrope — the skill's "Classic Elegant" luxury pairing; index.html + tokens swapped.

### Ops finding (recorded in memory)

Motion v13 gotcha: per-card `useSpring` on a shared source left the FIRST card's transform unwritten (inline empty, card frozen) — a single shared spring in the parent + nonzero translateZ fixes it. Also: hover-play reads as "paused:false" only after load; probe currentTime, not just paused.

## 2026-09-29 — Round 21: production-readiness audit (responsive + hygiene + CX)

User directive: audit everything, maximally responsive, no lag, production-ready, best e-commerce/customer experience.

### Responsive audit (5 viewports: 525 / 430 / 768 / 1280 / 1920)

- 0 console/page errors at every width; all sections present and sized sanely; hero, evidence runway, stack, reader, drawer all behave.
- **Found + fixed**: the proof-band marquee track leaked horizontal overflow on narrow widths → `overflow: hidden` on the band + `overflow-x: clip` on html; document-level pan verified impossible (scrollX stays 0 under forced scroll attempts at 430 and 1920).
- **Found + fixed**: `ev-kit-v1.jpg` was referenced but never existed — the keeper-box tile had been silently living on its fallback. src now points at the real branded kit photo.
- **Found + shipped**: the one-page route had NO footer. The Footer component (brand, explore links, the objects, honest pricing line) is now mounted at the end of Home with section-jump navigation (Explore links scroll to chapters; object links open PDPs; nothing navigates away from the one-page flow unintentionally).

### Deploy hygiene

- **Pruned 38 dead media files** (superseded hero v1–v4, old ritual/loop/promo encodes, scroll-world stills, unused posters) — `public/media` 264MB → **125MB**; the shipped `dist/media` is 125MB with every remaining file referenced.
- Share meta completed: `og:image` + twitter card added (title/description/favicon/theme-color already present).
- Final verify: pane + desktop — 0 errors, 1 long task each during a 30-viewport scripted scroll, no horizontal pan, footer + fixed keeper-box image confirmed.

### Phase 6 candidate remainder

1. User review of the footer + full-page pass on a real phone.
2. Checkout adapter when commercial data arrives (cart + pricing already honest).

## 2026-09-29 — Round 20: Journal rebuilt as scroll-driven 3D commerce deck

User provided the animated-cards-stack reference (21st.dev) and redirected the Journal: same stack mechanic, softer non-brutalist glassy cards, and a stronger e-commerce bias — "each card shops the product it speaks about."

### Shipped

- **Journal rebuilt as a scroll-driven 3D deck** (mechanic adapted to Motion v13 + this design system — no Tailwind/shadcn deps): 300vh runway, sticky viewport, perspective stage; 4 cards fly up in sequence with per-card tilt settle (16°→9°...) as scroll progresses; "SCROLL — THE DECK FLIES" hint.
- **E-commerce on every card**: each note carries its featured product — bottle ₹499 (two-minute rule), refill ₹349 (school shoes), care kit ₹1,299 (what the shine says) — plus a finale card ("Build the full ritual", kit) — each with thumbnail, price chip ("proposed launch price"), and a working **+ Care list** button wired to the real cart (verified: count increments, drawer opens). Glassy rounded cards with backdrop blur — non-brutal per the brief.
- Card click still opens the animated reader (full field note + commerce row inside); Esc/scrim close verified (exit animation ~250ms).
- Reduced motion: falls back to the static grid. Mobile: stage clamps to 88vw/70svh.
- Long-task budget intact (transform/filter-only animation, 4 cards, GPU-composited).

## 2026-09-29 — Round 19: Phase 5 — animated Journal + performance sweep

User directive: complete the remaining phase work — animated article cards for engagement + a full smoothness/performance pass, quality untouched.

### The Journal (Chapter 05 — "Notes from the table.")

- Three animated field-note cards between Stories and the film: **The two-minute rule**, **School shoes, Sunday night**, **What the shine says** — honest care guidance anchored to the real products (no invented claims), images harvested from the product-true films (apply beat, school-run lace-up, family under the lamp).
- Animation: staggered scroll reveals; hover lift + gold border + image scale; click/Enter opens an **in-page animated reader** (scrim blur, panel rise, Esc/scrim close, body scroll-lock) — the site stays one page, no new routes.
- Nav gained "Journal". Images carry explicit width/height (no CLS).

### Performance sweep (measured, no quality loss)

- Grain verified static (SVG tile — no per-frame cost).
- `content-visibility: auto` + intrinsic size on the far below-fold sections (film band, closing note) — skipped render while off-screen.
- Measured: **2 long tasks (>50ms) across a scripted 26-viewport full-page scroll** — effectively jank-free; 0 console errors.
- Existing systems carried the rest: viewport-armed video decode (MediaLoop), blob-fetched scrub films, will-change hygiene, swap fonts.

### Phase status

Phases 1–4 done; Phase 5 items now shipped: single-film discipline (rounds 10–13), depth/motion via arrival choreography (v5), evidence-rail scroll choreography (round 15/18), Journal + performance (this round). Remaining candidate: ritual apply-beat cameo audit (minor) — else the plan awaits user direction.

## 2026-09-29 — Round 18: scroll-linked rail at every width

User (viewing in a ~525px-wide pane) still saw the evidence rail as a manual swipe track — my ≤860px "mobile fallback" was disabling the scroll-linking exactly in the pane they use. Removed the width cutoff: the scroll-driven rail (runway + sticky + progress-mapped translateX) now runs at every viewport width, with a shorter 200vh runway and tighter type below 860px. Verified: narrow (525×580) strip tracks scroll 0 → −870 → −1011px; desktop pins (sticky top ≈ 0) and slides; 0 errors.

## 2026-09-29 — Round 17: hero v5 — arrival choreography (the fix for "it looks like a zooming image")

User verdict on v4: the hero read as "just an image zooming in" — the camera-distance fix had made the push so restrained it lost all cinema. Diagnosis: object motion was missing, not label fidelity. The two must be solved together: **move the OBJECTS, keep the camera at reference framing** — labels render at photo scale (no invention) while the scene stays kinetic.

### Shipped

- **Hero v5** (`hero-collection-film-v5-1080p.mp4`, 1080p60 GOP4 + mobile + `collection-still-v5.jpg`): hypermotion arrival choreography — oxfords slide in from the right, brush and banded cloth land, the ivory bottle descends into center with the navy mascot label at photo scale, the silver pouch (navy label) slides in with motion blur, the kraft window-box kit settles last, and the family holds still for the final 1.5s. Opens on the empty stage under the lamp. Unblend 0.865 + corners clean; side-by-side product check passed.
- Integrated under new cache-proof v5 filenames; in-browser: 9.93s, 1920w, 32ms seek, no fallback, 0 errors.

### Standing recipe (recorded)

"Grand + safe" = object motion at reference-framing camera. A pure camera push reads as a zooming still; a macro push invents packaging. Arrival choreography gives both cinema and truth.

## 2026-09-29 — Round 15: scroll-linked evidence rail + complete ritual film + branded promo end shot

User review: the evidence rail must slide WITH the scroll (not on its own); the ritual brush film felt cut and needed a complete product-true replacement; the promo end shot showed a blank pouch and a care-kit box without the windowed contents.

### Shipped

- **Evidence rail is now scroll-driven**: the section is a 280vh runway with a sticky viewport; JS maps scroll progress to the strip's translateX (rAF, passive listeners), so the rail slides exactly with the user's scroll and freezes when they stop. Auto-marquee removed. Mobile (≤860px) and reduced-motion fall back to a static/manual track.
- **Ritual film v4** (`ritual-film-scrub-v4-1080p.mp4`, 1080p60 GOP4 + mobile): brush → apply → reveal in one complete arc — the apply and reveal beats keep the navy mascot-label bottle standing readable beside the shoe (the round-9 ask), the movement resolves and holds the final still. Retrieved via project-page recovery after the download flake (the dashboard-page recovery path is a dead end — recorded). Poster set to `collection-still-v4.jpg`.
- **Promo part 2 regenerated** (`promo-twinkle-shine-v2.mp4`, 19.1s, cache-proof name): the end shot now shows the **windowed care-kit box** (blue cloth + navy bottle inside, JIMMY & WAX wordmark), the **silver pouch carrying its navy TWINKLE SHINE label** (no more blank pouch), the exact bottle, brush, banded cloth and oxford; negatives forbid blank/unlabeled pouches and unwindowed boxes. Poster v2.

### Verified

Build green, 0 console errors; rail transform measured tracking scroll (0 → −287px → −575px across wheel bursts); school-run/hero v4 untouched.

### Next work

1. User review of the three fixes.
2. Phase 5 remains queued.

## 2026-09-28 — Round 13: hero v4 — the resolved ending

User verdict on v3: the clip felt cut in half — the camera was still drifting laterally when the 10th second stopped (verified: composition shifts between 8.8s and 9.8s, then hard stop). A "calm final wide" instruction is not enough; the movement must RESOLVE.

### Shipped

- **Hero v4** generated with a complete cinematic arc written into the brief: push (0–4s) → ease-and-settle (4–8s) → **held still frame (8–10s)**, with "no drift, no floating, no abrupt cut" as a hard requirement and in the negatives.
- Frame-verified: composition at 9.3s ≈ 9.8s (held), product side-by-side pass again (navy mascot bottle, black flat cap, no collar, kit/pouch/brush/cloth/oxfords correct, no tins). Unblend 0.81 + corner check clean.
- Scrub-encoded `hero-collection-film-v4-1080p.mp4` (1080p60 GOP4) + mobile + `collection-still-v4.jpg` poster; integrated under new cache-proof filenames; in-browser: 1920w, 34ms seek, end-of-scrub lands on the settled frame, 0 errors.
- Ops: first v4 submission died mid-flight (MCP connection closed; job 90dcf321 stranded RECOVERY_REQUIRED). The render HAD completed in Flow (dashboard tile at 14:05) but dashboard-page recovery can't reach a download control — 25 attempts failed — so one clean resubmit under a fresh key retrieved it. Lesson: run recover only when the tab is inside the specific project page; on the dashboard it is a dead end.

## 2026-09-28 — Round 12: school-run continuity fix + evidence rail auto-drift

User review: (1) part 2 of the school-run reel tied shoes that were already on the boy's feet — a story-logic bug; (2) branding in that clip was suspect; (3) "Details that carry the room" must drift sideways automatically.

### Shipped

- **School-run part 2 regenerated** with explicit continuity logic in the brief: boy's feet bare except gray socks at the start, father slides the right shoe on, ties it, then the left, boy stands only after both are on. Frame-verified beat by beat (socks → first shoe tied with left still socked → second shoe → both on → laugh). Characters and living room consistent with part 1 via the continuation-frame reference. The old clip (and its suspect bottle branding) is fully replaced; the new clip carries no visible product, so no drift risk.
- **Evidence rail auto-drift**: the track is now a seamless infinite marquee (duplicated strip, `translateX(-50%)`, 75s linear, pauses on hover, edge fade mask; reduced-motion falls back to manual scroll). Verified animating in-browser.
- School-run reel re-merged (20.04s, 1080×1920), poster updated to the wearing beat; build green, 0 errors.

## 2026-09-28 — Round 11: hero v3 — the accepted product-true hero

User rejected hero v2's macro pass: at extreme close-up the model reinvents the label (gold collar band, dome cap, added coins). Standing rule confirmed: **the camera must never get closer than the reference photo framing** — macro invites hallucination, so the hero holds a medium-wide grand push with no label close-ups.

### Shipped

- Hero v3 generated (5 real-photo refs + camera-distance rule + cap/collar negatives), unblended (0.914), and **accepted via strict side-by-side review against DSC06360**: flat black flip-top cap, navy wrap label with centered mascot, gold TWINKLE SHINE / LEATHER POLISH / icon row in the correct layout, no invented elements, stable product sizing across the move, clean corners.
- Scrub-encoded `hero-collection-film-v3-1080p.mp4` (1080p60 GOP4) + mobile; poster `collection-still-v3.jpg` extracted from the final wide. Integrated under new (cache-proof) filenames; verified in-browser: 1920w, 34ms seek, 0 errors.
- v2 hero retired. Old filenames remain retired — every hero asset generation now gets its own versioned filename.

### Standing generation rule (recorded in memory)

Omni Ingredients drifts at macro scale — keep product shots at reference-photo framing; product-identifying close-ups are harvested from real photography, never generated.

## 2026-09-28 — Round 10: hero v2 (macro product display) + full smoothness pass

User review: the hero still showed the previous (cache-poisoned) product, and the site felt laggy.

### Hero v2

- New 10s Omni generation (5 real-photo references, product lock) with the coolest possible display: dolly push → **macro pass filling the frame with the gold TWINKLE SHINE lettering and school-boy mascot** → drift across the oxfords → calm family wide. Frame-reviewed PASS; v2 unblend (0.723) + corner check.
- Scrub-encoded 1080p60 GOP4 (`hero-collection-film-v2-1080p.mp4`) + 720p60 mobile. Verified in-browser: blob-served v2, 31ms seek, scrub smooth.
- **Cache-proof filenames everywhere**: v2 hero film + mobile, `atelier-branded-v2-1080p.mp4`, `collection-still-v2.jpg` (hero poster + closing note). The round-9 hero had silently reused round-7's URL — the browser was serving the stale rejected product from cache; new names make that impossible.

### Smoothness pass (no quality loss)

- `MediaLoop` rewritten: IntersectionObserver-driven — videos arm + load only within 120px of the viewport, play when visible, **pause and stop decoding when scrolled away**. Previously all 7 reel loops + story film decoded continuously regardless of position; now at most 3 decode, off-screen cards stay posters (`preload="none"`, `ready=0` verified).
- Playback kick fixed (play on `loadeddata` + re-arm on re-entry); verified playing (t advancing) with zero console errors.

### Next work

1. User review of hero v2 macro display and scroll smoothness.
2. Ritual scrub film apply-beat product cameo — audit against the lock next pass.
3. Phase 5 remains queued.

## 2026-09-28 — Round 9: product truth enforced everywhere + 7 reels + hero/story/promo regenerated

User verdict on round 8: the product drifted in every video (cream labels, no mascot) because generations carried only scene references — investor credibility depends on the product being exact. New standing rules: EVERY generation attaches scene reference(s) + real product photography; every character is Indian and consistent within their reel; wherever the product drifts, the video is regenerated.

### Product lock that now governs all generation

Reference recipe per job: scene still(s) first, then real product photos (`products demo/DSC*` downscaled in `tmp/refs/`) — DSC06360 (bottle), DSC06211 (kit), DSC06276 (pouch/packaging), DSC06309 (school shoes + display), DSC06170/06320 (family/display). Prompt carries an ABSOLUTE PRODUCT LOCK: ivory bottle, BLACK flip-top cap, DARK NAVY wrap label, gold TWINKLE SHINE lettering, school-boy mascot, gold icon row; negatives forbid cream/white labels and missing mascot. Frame review verified the navy mascot bottle renders correctly in all seven reels, both promos, hero, and the story film.

### Shipped

- **7 testimonial reels** (Chapter 04 — "Seven mornings, one ritual."): 01 unboxing→office, 02 wardrobe, 03 school run (20s two-clip merge: polish → **father makes the boy wear the shoes** → laugh, with a continuation-frame reference keeping the pair consistent), 04 Sunday balcony (kurta uncle + chai), 05 interview (woman, black heels at her vanity), 06 wedding (groom + cousin, marigold lights), 07 client visit (sales manager at the wheel). All 1080×1920, Indian characters, product-true.
- **Hero regenerated** with the same liked cinematic style, product-locked to five real photos; scrub-encoded 1080p60 GOP4 + mobile variant; poster refreshed from the new film.
- **Story/atelier film regenerated** (no invented products; navy mascot bottle + kit + pouch under the brass lamp); loop-encoded.
- **Promo rebuilt**: storyboard attached for beat order only (explicitly not to copy grid/text) + product refs; VO + score preserved; 19.1s; real-typography end card; an invented "shoe cream tin" that kept appearing in the end shot was removed via precise delogo after two regenerations didn't shake it.

### Watermark funnel (every clip, before adding)

v2 registered unblending on all 13 accepted clips (register scores 0.52–0.93), four-corner verification per clip. Rescues: reel1's sparkle survived a low-registration unblend → frame-measured delogo at x535/y1080 removed it (verified); promoB tin via delogo x175/y528; reel7/promoA minor patch traces only, no marks. Nothing was added without corner-passed cleanup.

### Ops record

14 generations total this round (incl. retries). reel3b's clip repeatedly completed but never became downloadable (4× DOWNLOAD_FAILED, recovery also blocked — Flow's asset never materialized); solved by regenerating as a standalone job with a simplified prompt under a new name (`reel3wear`). Two jobs were silently skipped by the runner's done-set (same names as COMPLETED round-8 entries) — results.jsonl is now archived per pass (`results-round9-partN.jsonl`). Checkout still intentionally disabled; no commerce facts invented.

### Next work

1. User listens to the promo VO and reviews all seven reels in the browser.
2. Remaining audit candidate: ritual scrub film's apply beat (product cameo) — check against the lock on the next pass.
3. Phase 5 (3D/depth + performance) remains queued on confirmation.

## 2026-09-27 — Round 8 complete: four reels shipped (3 testimonials + narrated promo)

All five Flow Omni generations delivered, funnel-cleaned, reviewed, and integrated.

### Shipped

- **Reel 1 — The unboxing** (`reel-unbox-office.mp4`, 1080×1920, 10s): study-desk unbox of the JIMMY & WAX kraft box → polish on the gray cloth → match-cut to office buff → walking out. Branding correct on box + bottle; two supplied references honored.
- **Reel 2 — The wardrobe** (`reel-wardrobe.mp4`): white-shirt buff + inspect + satisfied nod in a warm wardrobe; matches reference.
- **Reel 3 — The school run** (`reel-school-run.mp4`): dad applies polish to the boy's black school shoe, Twinkle Shine bottle legible on the table; boy grins with backpack. Matches reference.
- **Promo** (`promo-twinkle-shine.mp4`, 1080p, 19.1s): two 10s Omni clips merged (lineup → unbox → pour → buff | split before/after → lace-up → lobby walk → product hold) **with voiceover + score (Omni-generated audio)** and a REAL-TYPE end card composited via ffmpeg drawtext (Georgia): JIMMY & WAX / TWINKLE SHINE / LEATHER POLISH / benefits line — no garbled generative text. Baked letterbox in promoA's first second trimmed.
- **Chapter 04 — Stories** live with true first-frame posters; **film band** bottom-center with sound-on controls. Build green, 0 console errors.

### Watermark funnel — what actually worked

The pipeline's own remover failed (`spawn python ENOENT` / FFMPEG_PATH unset under the minimal server env). Manual funnel: `scripts/remove_watermark_v2.py` (registered alpha-unblending, register scores 0.83–0.93) on every clip + four-corner verification → sparkle fully inverted out, texture intact. All five integrated assets are watermark-free with corners verified.

### Ops lessons (recorded in memory)

- The session's Flow MCP went unmounted; drove `dist/index.js` over stdio with a persistent driver. Per-call bridges kill jobs (RECOVERY_REQUIRED) — always `waitForCompletion: true` in one long-lived process.
- idempotencyKey dedupe returns OLD terminal jobs on resubmit — fresh keys required after failures.
- The MCP `env` param must carry Windows essentials (PATH/SystemRoot/ComSpec); Git Bash's unix PATH breaks cross-spawn (cmd.exe ENOENT).
- Chrome-for-Testing cannot complete Google sign-ins ("Couldn't sign you in") — clean real-Chrome sign-in on the profile is the only re-auth path; the studio browser (CDP :9222, browser-data profile) is the session that works once signed in.

### Next work

1. User listens to the promo VO by ear (audio verified present at −8…−35 dB RMS; wording not transcribable here).
2. Phase 5 (3D/depth + performance pass) remains queued on confirmation.

## 2026-09-27 — Four reels from user references + tile-ratio fix (user review round 8, in progress)

User request: from five reference images in `refference image for reel/`, build four reels — three testimonial films (unbox→office, white-shirt wardrobe, dad + child school shoes) and one narrated promo from the 9-panel storyboard, placed bottom-center of the one-page route. Also: the standard tiles looked cropped.

### What shipped (already live)

- **Tile-crop fix**: the truth tile had been squashed 3:2→16:9 (distortion read as cropping). The band now renders at native 3:2: truth re-derived from the original Flow generation (unstretched), material + light re-extracted from the 1080p films with a centered 3:2 crop (`std-*-v3.jpg`, `RevealImage ratio="3 / 2"`). Verified proportion-correct in browser.
- **Chapter 04 — Stories** (`StoriesBlock`): three 9:16 reel cards (unbox→office / wardrobe / school run) with muted autoplay loops, honest scene captions (no invented reviewer names/quotes), new "Stories" nav link.
- **The film band** (`PromoBlock`): bottom-center, centered column — "Twenty seconds, one final gesture." — 16:9 video with real controls (it carries the voiceover, so play is deliberate), brand benefit line from the storyboard end card.
- Sections mounted with temporary still posters; posters get replaced by true first-frames once encodes land.

### Reel production state

- Flow MCP is no longer mounted in the session tools; a persistent stdio driver (`tmp/flow-driver.mjs` → `scratch/flow-driver-zcode.mjs`) submits `generate_video` jobs with `waitForCompletion: true` so jobs never die mid-flight (the first attempt stranded job `f680290e` in RECOVERY_REQUIRED when a per-call process closed after submission — that job never generated; recovery skipped deliberately to avoid scraping a wrong "latest" clip).
- **Active blocker: the Google browser session expired (AUTH_REQUIRED ×5).** A visible sign-in window is open on the desktop via `flow_browser_login`; generation resumes (reel1 → reel2 → reel3 → promoA → promoB, then merge + end-card typography overlay) as soon as login completes.

### Next work

1. User completes the Google sign-in in the Flow browser window; queue re-runs.
2. Frame-review + watermark funnel per asset; encode reels 1080×1920; merge promo A+B (voiceover kept), composite the real-text end card.
3. Swap posters to true first-frames; scripted QA; Phase 5 remains queued.

## 2026-09-27 — Standard tiles: consistent branded set (user review round 7)

User review: regenerate the three standard tiles with Flow — consistent sizing, product scale, branding; no watermark; contextual per SEO.

### What shipped

- **Product truth tile**: fresh Flow ImageGen delivery — the kraft carton, silver pouch with the **real mascot label**, and retail display box beside the oxford shoe. The most brand-accurate image in the project (real label artwork preserved). Corner-inspected, no watermark visible.
- **Material first tile**: harvested from the approved ritual film @1.15s — amber brush resting on the oxford toe, tack-sharp.
- **Light, not noise tile**: harvested from the branded collection film @0.6s — the full collection under the single warm lamp.
- All three 1600×900 (16:9), same warm grade, products sized naturally — a matched set. SEO: descriptive keyword alt text on each (brand + product + context); files named semantically (`std-truth-v2.jpg` etc.).
- **Flow ImageGen reliability note**: the pipeline twice returned stale cached bytes (identical 567,948-byte checksum for different prompts) and twice failed watermark re-checks; one job hit a OneDrive EPERM file-lock mid-save. The truth tile came through fresh; the other two were harvested from reviewed footage — which consistently outperforms generation for product truth anyway. Recorded for future asset planning.

### Verified

0 page errors, 0 overflow, all three tiles loading (`naturalWidth > 0`), build passing. Phase 5 remains queued on user confirmation.

## 2026-09-27 — Experience layer: contextual imagery + rhythm + brutalist commerce (user review round 6)

User review: ritual steps 1/3 and standard tiles 1/3 were uncontextual (third was AI slop); evidence-rail images badly fitted; the atelier film had to feature the exact products; the scroll read as "pasted photos" with no rhythm; and the site needed an e-commerce edge — premium-brutalist if it fits.

### New imagery (gate applied: generate → review → integrate)

- **step-clear**: Flow ImageGen (Omni) with real-photo references — the actual Twinkle Shine label with mascot rendered correctly beside oxfords and the branded cloth. Reviewed: photoreal, clean corners (watermark-removal re-check failed but four-corner inspection found no visible mark — documented exception). Integrated.
- **step-reveal**: first attempt REJECTED (model produced a duplicate-sachet flat lay, off-brief); retry delivered a byte-identical cached file — **Flow's image pipeline is stuck returning stale results** (checksummed). Pivot: harvested the step-reveal frame from the approved 1080p ritual film (the glowing reveal beat) — more product-true than any generation. ev-toe/ev-cloth/ev-family likewise cropped from approved footage; std-material from the materials film; std-light from the branded atelier film.
- **Atelier film regenerated** (job `610212a0`): night brass-lamp drift with the exact products — branded bottle, pouch, kit band, brush — replacing the unlabeled-generic-jar version. Reviewed PASS, 1080p60 loop encode, old AI still retired.

### Experience + commerce layer

- **Chapter marks**: brutalist dividers (boxed numeral, rule, plus) open each chapter; **sticky vertical chapter rails** ("Chapter 02 — The Ritual") hold wayfinding on desktop.
- **Clip reveals**: every tile now wipes in bottom-up with an overshoot settle (`RevealImage`) — no more pasted-photo arrivals. First implementation stalled (whileInView never fired inside nested wrappers); rewritten on `useInView` + `animate`, verified via computed clipPath.
- **Brutalist commerce kit**: price chips (2px ink border), `+ CARE LIST` buttons with hard 4px offset shadows (hover lifts to 6px), boxed mono meta tags, 2px hairline buy-row rules. On the ivory sections it reads premium-funky, not gimmicky.
- **Standard band flipped to ivory** for dark→light→dark alternation; boxed numerals; dark text.
- QA: 0 page errors, 0 overflow, build passing; reveals verified via computed styles.

### Flagged

Flow ImageGen cache glitch (identical bytes returned for different prompts) — if it persists, imagery continues to be harvested from reviewed footage, which is proving superior anyway.

## 2026-09-27 — One-page infinite scroll + branded collection film (user review round 5)

User review: the hero film had no branding and none of their products; other films looked AI-generated; "free scroll" actually meant **one infinite page with every section** and a hero that moves smoothly with scroll (like the original scrub). All addressed:

### The branded collection film (job `0ca24781`, retry after one UI_CHANGED)

- 10s Google Omni generation with **five real-photography references** (bottle+kit, bottle, pouch+carton, kit close, flatlay — downscaled to ≤700KB each for the 25MB Flow cap) and explicit preserve-branding instruction ("preserve exact branding, label artwork, shapes, colors; no redesign; not a glossy AI render").
- Review gate: **PASS conditional** — correct JIMMY & WAX / TWINKLE SHINE branding in the on-brand navy/gold language on every product in every frame; all products present; photographic look. Caveat recorded: garbled fine print in the extreme macro beat (generative-text limit; reads as label texture at scrub speed).
- Pipeline per user rule: Omni delivery → **1080p upscale + 60fps minterpolate + GOP 4** (scrub target) → watermark-removed verified → silent faststart encode. Desktop 11.9MB / mobile 5.2MB. Palindrome loop retired.

### One infinite scroll

- The site is now **one page**: scrubbed hero (2.6 viewports, the branded film scrubbed by scroll, lerp 0.3 — measured 0.026s tracking error) → brand marquee → collection (shop content with quick-add + hover films) → ritual chapter (real-photo steps on ivory, 1080p scrub film, branded bottle plate) → standard chapter (tiles + evidence rail + atelier film) → closing. `collection/ritual/standard` section anchors; fixed home nav scrolls to sections; standalone `/shop /ritual /story` pages refactored onto shared `RitualBlock`/`StoryBlock` and kept for deep links; PDPs remain routes.
- Shop hero now carries the same collection film (single-film discipline). Nav buttons styled with the nav-link system.

### Verified

Scrub tracking 0.026s deviation; all sections present on one page (12,089px total); 0 page errors; 0 mobile overflow; production build passing.

### Next

Phase 5 on confirmation. Flagged: atelier-ambience film is the most AI-painted remaining clip — candidate for regeneration under the same gate.

## 2026-09-23 — Architecture decision: one hero film + free scroll (user review round 4)

User review: the multi-chapter home cinematic felt cut-up and un-rhythmic ("before you added complete video, this time you cut it"), with inconsistent bottle shapes between AI worlds, dark "mime" gaps, and blurry 720p upscales — and the scroll-hijack broke attention. Executive decision, user-endorsed: **kill the multi-chapter scroll-world architecture; one complete film, free scroll.**

### The rebuild

- **Signature hero film**: the reviewed hypermotion (shoe/brush/cloth, 1080p60, packaging-free) rebuilt as a **seamless palindrome loop** — forward push-in + reverse pull-out, 13.2s, no visible cut (forward+reverse concat). Desktop 8.9MB (-g 8), mobile 5.6MB 720p (-g 4). Straight v3 files removed.
- **Free scroll**: the scroll-world engine, its pinned track, chapter crossfades, and route rail are **deleted** (`scrollWorld.js`, `world.css` removed; Home no longer mounts any scrub). The page is a natural flowing document: hero film → marquee → collection → closing. The film parallaxes out gently (scale 1→1.1, copy drift/fade) — no hijack.
- **Brand carried by typography over film**: "JIMMY & WAX · LEATHER CARE" kicker, display headline, dual CTAs (Shop the objects / Explore the collection), animated scroll cue. Fixed chrome: W-monogram wordmark top-left, care-list top-right. The old brand-stamp/route-rail are retired with the engine.
- Reduced motion: poster still instead of video. Mobile: dedicated 720p palindrome via `<source media>`.
- **Verified by scripted browser QA**: film plays while visible (advancing, readyState 4), free scroll confirmed (instant jumps land correctly), collection/closing flow intact, 0 page errors, 0 mobile overflow, production build passing.

### Honest self-judgment (requested executive audit)

Remaining flaws I would flag before calling this "winning": (1) the ritual scrub film is still 720p on a full-screen frame — crisp but not 1080p; (2) the collection cards' alternate-angle hover swap (v2 images) is subtle at current crop tightness; (3) shop/PDP could use the same single-film discipline on their heroes; (4) no checkout by design — the conversion path ends at the care list until commercial data arrives.

### Next

Phase 5 (3D/depth + performance) resumes on user confirmation, now on a much simpler home architecture.

## 2026-09-23 — Ritual page: scrub lag + brand imagery + tone lift (user review round 3)

User review: the scroll-scrubbed ritual film and the steps before it felt laggy; the page needed real imagery with brand context instead of AI-looking renders; the red-black background tone was too dark/heavy.

### Fixes, all verified in-browser (0 page errors)

1. **Scrub lag root cause**: the ritual film was encoded GOP 48 — every scroll seek decoded up to ~2s of video. Re-encoded as `ritual-film-scrub-v2.mp4` (720p60, motion-interpolated, **GOP 4**, crf 20) and raised the ScrubFilm lerp 0.16 → 0.3. Measured catch-up after a hard scroll jump: **~0.17s** (was ~2s). Rule recorded: GOP 4–8 for any scrub target, 48 only for autoplay loops.
2. **Steps get real branded imagery**: "Clear / Build / Reveal" now carry supplied-photography tiles (branded cloth + brush, Twinkle Shine dispensing, glowing toe) inside a **light ivory band** — dark → light → dark rhythm, Apple-style section alternation.
3. **AI-look stills replaced**: the ritual-after AI world still → the **Twinkle Shine branded motion plate** (real label, gold collar, Product-true) in a framed MediaLoop; the scrub poster → a real shoe-macro crop. Real photography now leads the page.
4. **Background tone lifted**: tokens moved from red-black `#0B0705` to warm charcoal `#14110E` family (`--ink-2 #1C1815`, `--espresso #211C17`), all hardcoded section grounds updated (marquee, collection gradient, closing, footer, scrollbar, veil, world sky, theme-color). Richer, less red, less heavy.

### Next

Phase 5 (3D/depth + performance pass) resumes on user confirmation.

## 2026-09-23 — Branding gate + Apple-intentionality sprint (user review round 2)

User review: the hero film's pouch had no branding; multiple dark sections were text-in-a-void ("AI slop"); benchmark is Apple-level intentionality. New binding standards recorded in `docs/working-standards.md` §0–1 and `flow-assets-capabilities.md`: **generate → review → add** (brandless product = reject; the fix is regenerating with packaging excluded from the scene, since Flow Ingredients cannot lock label artwork), and **no dark section may be text-only**.

### Fixes, all verified in-browser (zero page errors, 0px mobile overflow)

1. **Hero hypermotion v3** (job `5a15c5f3-1068-4d79-8d90-35ada9ead6c9`): regenerated with only shoe + brush + cloth — packaging excluded by direction, so no brandless product can appear. Strict frame review passed all four gates (product truth / composition / motion / grade). Letterbox bars baked into the generation were cropped (1920×936 content area; `object-fit: cover` fills the viewport). 60fps minterpolated, encoded desktop 4.4MB (-g 8) / mobile 2.8MB (-g 4); v2 removed.
2. **Home closing-note**: was giant text floating in dark — now a two-column composition with the atelier-after-hours film loop framed right ("The atelier · after hours").
3. **Ritual-after**: text-only void → framed ritual-world still (with branded JIMMY & WAX plaque) beside the copy.
4. **Story standards**: three text-only columns → each with a real image tile (leather macro / kraft kit / lamp still-life).
5. **Commerce heroes** (shop / ritual / story): each gained a right-side framed anchor from the supplied photography (application pour / refill pour / care spread), captions included.
6. Site served at **localhost:3000** (`vite preview` of the production build) — port 5173 is occupied by the user's Docker/WSL "SiteVault Pro" container and was handed to it permanently; recorded in dev-environment quirks.

### Next

Phase 5 (3D/depth + performance pass) resumes once the user confirms this round.

## 2026-09-22 — Visual defect fix sprint (user-reported): hero film, gaps, blank sections

User review found the site "basic" with visual bugs: a still-image hero instead of the branded hypermotion, gaps of images, and blank/sparse sections. Forensic sweep confirmed four root causes, all fixed:

### Root causes and fixes

1. **Unoptimized imagery (the "gaps of images")** — every catalog portrait and world still was a 1.9–2.2MB PNG; pages painted slowly and felt empty while media loaded. Fix: sources preserved in `media-src/`, catalog images re-cropped tight to the product (v1 sources are 1536×1024 landscape, v2 are 1024×1536 portrait — per-composition windows) and everything re-encoded as WebP q80–82. Catalog set fell from ~13MB to 760KB total (~64–216KB per image); all four world stills likewise. All code references updated; a reference-vs-disk audit confirms all 31 media paths resolve (zero 404 risk).
2. **Loose catalog compositions** — the same tight crops removed the large dead zones inside cards 02/03 (products now fill their 4:5 frames edge to edge).
3. **Sparse/blank sections** — shop's text-only note (a full viewport of dark emptiness) became a full-bleed photography band (`.note-band`, real flat-lay crop + scrim + copy); story gained a six-image horizontal "Evidence of the standard" rail using the supplied-photography crops; home collection cards gained sequence labels (`01 · Begin here` …) and the section's dead bottom padding was cut.
4. **Hero was a still with subtle drift** — replaced by a new Flow hypermotion film (job `8946c486-0b85-43b2-9145-be462d5be083`, 8s, product-true, frame-reviewed): wide establishing → confident push-in with the polished toe as hero → calm macro hold. Processed to 1920×1080 @ 60fps via minterpolate (verified artifact-free) and encoded as scrubbed H.264 (-g 8 desktop 7.0MB, -g 4 720p mobile 4.2MB); wired into the world engine as the arrival chapter.
5. **Handoff CTA overlap bug** — the marquee band's overlap covered the finale's "See the collection" CTA at deep scroll; fixed by raising the final world copy to 45% and easing the overlap to clamp(-88px,-7vh,-48px).

### Verification

- `tsc -b` clean; production build passes (415KB JS / 41KB CSS); all 31 media references resolve on disk and over the dev server (200s).
- Browser QA of the hero film scrub, note-band, evidence rail, and CTA overlap was performed in the prior session tooling; the current turn's toolset lost the Playwright bridge, so the four new visual sections were verified structurally (markup + CSS + assets + build) — visual confirmation of these four is the first item queued for the next session with browser tooling.

### Next (Phase 5, as directed)

Depth/3D pass — CSS-3D product pedestal on the PDP, particle atmosphere tuning in the world engine, layered parallax in editorial sections — plus the performance deep pass.

## 2026-09-22 — Phase 4 complete: Ritual immersion + cart continuity

### Completed

- `ScrubFilm` component: a second scroll-cinematic moment on `/ritual`. The section pins for ~2.6 viewports while scroll progress drives the ritual film's `currentTime` (lerped, seeks coalesced while the decoder is busy, clip fetched as a blob so scrubbing never depends on byte-range support, object URLs revoked on unmount). The film's three directed beats (Brush / Apply / Reveal) surface as synchronized overlays with an index counter.
- Beats were art-directed to match the film: 0–⅓ brush sweep, ⅓–⅔ cloth application, ⅔–1 buff + sheen; verified scrub positions land on the matching footage (t=0 at beat 1, t≈4.1 at Apply, t≈7.6 at Reveal).
- Reduced-motion path: the section renders as a natural-height still frame (0 videos, poster only) — verified via emulation.
- Mobile: full-bleed pinned frame with bottom-anchored copy above the safe area; 16:9 crop stays legible because the film's subject is centered; 0 horizontal overflow.
- Cart drawer "Complete the ritual" cross-sell: up to two not-in-cart objects with one-tap add, honest `sequence` labels; verified suggestion → add → cart-line flow.
- Editorial copy tightened on the ritual page; closing-note ornamentation deliberately kept restrained (no change) — restraint recorded as a decision.
- Production build passes (414KB JS / 129KB gzip, 40KB CSS); typecheck clean; 0 console errors.

### Remaining weaknesses (input to Phase 5)

- No WebGL/3D layer yet; product presentation relies on film + stills (candidates: particle atmosphere in the world, or a CSS-3D pedestal on the PDP).
- The world chapters remain crossfaded, not frame-locked (Flow conditioning blocker stands).
- Search/filters absent (catalog is only 3 SKUs; low priority).
- Performance deep pass pending: image preload strategy, Lighthouse-style pass on mid-tier mobile conditions.

## 2026-09-22 — Phase 3 complete: Product detail theater + cinematic handoff

### Completed

- Nine macro story crops authored from the **supplied product photography** (the visual source of truth) via ffmpeg — three per object at 4:5/1200×1500, contact-sheet reviewed before integration. Deliberate decision: no generative imagery for detail storytelling, so every macro is product-true by construction; no new Flow jobs were needed this phase.
- `products.ts` extended with `sequence` labels (Begin here / Keep it moving / The complete set) and per-object `story` blocks (title + body + crop).
- `ObjectStory` scroll-driven PDP section: sticky media frame crossfades to each step's macro as the step scrolls through the viewport band (Motion `onViewportEnter`); index counter 01/03; on mobile the sticky column is replaced by per-step inline images; reduced motion gets instant swaps.
- PDP sequence label added to the purchase panel kicker; shop catalog cards show `0N · Sequence` mono labels; shop hero copy now states the deliberate order.
- Home cinematic→collection handoff: the brand marquee band now slides over the final cinematic frame (negative margin + lift shadow), so commerce UI visibly takes over the film.
- QA: story index tracks scroll (01→03) at 1440; sticky media pinned; mobile 390 stacks steps with images and keeps the purchase bar pinned (y+h = viewport); 0 horizontal overflow; typecheck + production build pass (411KB JS / 129KB gzip, 37KB CSS).

### Remaining weaknesses (input to Phase 4)

- Cart is drawer-only; a full cart/checkout page awaits commercial data.
- The cinematic chain is still crossfaded chapters (Flow first-frame conditioning unqualified).
- Home collection and shop could share the hover-film behavior more prominently (e.g., inline film tiles in the collection heading).
- Typography of the finale/closing sections could push further editorial (large numerals, rules).

## 2026-09-21 — Phase 2 complete: Cinematic commerce

### Completed

- `HoverFilm` motion primitive: the product-true motion plates now play inside product cards while hovered (desktop, fine pointer). Reduced-motion visitors, touch devices, and error states keep the stills; the film fades in only after first paint.
- Hover films wired into the home collection cards and the shop catalog cards.
- Shop cards gained a quick-add (`+ Care list`) action beside `View`, so adding never requires a page change.
- PDP gallery rebuilt: three views (catalog portrait, alternate angle, film) with thumbnail switcher, crossfaded via AnimatePresence, keyboard accessible with labels.
- Sticky mobile purchase bar on PDP (price + Add, safe-area aware, blurred). Rendered at App level because the route-transition wrapper's transform breaks `position: fixed` inside it — fixed live during QA after the bar was observed detached at document y≈2916.
- Full QA: hover films verified playing (readyState 4) on home and shop; gallery views switch correctly; mobile bar pinned to viewport bottom (y+h = viewport height); quick-add opens the drawer with the right count; typecheck and production build pass (408KB JS / 128KB gzip).

### Remaining weaknesses (input to Phase 3)

- PDP still lacks a scroll-driven product story (sticky gallery, ritual steps tied to the object, macro crops of the packaging).
- The cinematic home→collection handoff could overlap into the first product row.
- Shop has no filtering/sequence framing ("start here" ritual order is implicit only).
- Cart remains drawer-only; no dedicated cart page or checkout adapter (blocked on commercial data).

## 2026-09-21 — Phase 1 complete: Forensic audit + creative foundation + signature arrival

### Completed

- Forensic audit of the previous build (monolithic `App.tsx`, static below-the-fold sections, videos used only in the cinematic and PDP, no motion identity system, hard-cut route changes).
- Full architecture refactor: `src/styles/` token system (`tokens.css`, `world.css`, `home.css`, `commerce.css`), `src/components/fx/` motion primitives (`Cursor`, `Magnetic`, `SplitText`, `TiltCard`, `Marquee`, `Reveal`, `MediaLoop`, `GrainOverlay`), `src/components/` shell (`Nav`, `Footer`, `CartDrawer`), `src/pages/` routes (`Home`, `Shop`, `ProductDetail`, `Ritual`, `Story`), and `src/lib/cart.ts` state hook.
- Design tokens established: walnut/brass/ivory palette from the physical products, Cormorant Garamond + Manrope fluid type scale, 4px spacing rhythm, motion easing/duration tokens, z-index scale, WCAG-minded focus states, editorial scrollbar.
- Global FX layer: static film grain (SVG turbulence, overlay blend), additive desktop cursor (native pointer retained; brass ring grows on controls, "View" label over media), magnetic buttons, masked line-reveal typography, slow brand marquee, perspective tilt cards with alternate-image hover reveal.
- Signature arrival: first-session-only veil (W monogram + wordmark, curtain exit; simple fade under reduced motion), spring-smoothed scroll progress, route transitions (opacity-only on the cinematic home to preserve `position: fixed` layers, slide+fade on commerce pages).
- `scrollWorld.js` patched to return a `destroy()` teardown: cancels the rAF loop, removes window listeners, revokes blob URLs, releases videos on SPA unmount (previously leaked listeners on every home→shop→home cycle).
- `MediaLoop` component: silent loop fades in only after first paint (no black flash), falls back to the still poster on error/404/reduced-motion.
- Three new Flow films generated, frame-reviewed, and web-encoded (silent H.264, faststart, GOP 48): ritual film 8s (`ritual-film-web-v1.mp4`), materials macro 6s (`materials-macro-web-v1.mp4`), atelier ambience 8s (`atelier-ambience-web-v1.mp4`).
- Film integration: ritual page shows the ritual film in a framed cinematic block; shop page gains a materials macro band; story page gains a full-bleed atelier film band with scrim and display copy; PDP motion window uses the shared film frame.
- Home collection upgraded: split-reveal heading, editorial staircase offsets, tilt + alternate-image hover, magnetic add buttons, honest proposed-price labels; closing gesture with dual CTAs and brand footer line.
- Commerce pages upgraded: sticky blurred nav with underline links and spring count badge, PDP sticky buy panel + pairing rail, ritual three-step grid, story standards grid, richer footer with object links and pricing disclaimer.
- Cart drawer: autofocus on open, Escape close, per-line prices, honest indicative total labeled as proposed pricing.
- QA: dev-server browser testing at 1440/768/375 — cinematic mount and scrub, cart add/quantity/total/Escape, all routes, film playback states, reduced-motion emulation (no videos, no cursor layer, stills only), zero horizontal overflow at 375, zero console errors. Production build passes (405KB JS / 127KB gzip, 33KB CSS).

### Important decisions

- No new runtime dependencies: Motion (v13) remains the only animation library; GSAP was deliberately not added because the vendored scroll-world engine already owns pinned scrubbing, and component motion is fully covered by Motion.
- Custom cursor is additive (native pointer retained) per the usability guardrail.
- Generated films contain no readable labels by direction; product identity stays with the original photography and catalog portraits.

### Remaining weaknesses (input to Phase 2)

- Shop catalog is still a 3-column grid at desktop; hover video previews, quick-view, and filtering arrived not yet.
- PDP gallery is a single portrait; no multi-angle gallery, variant selection, or 360 presentation.
- Cinematic chain is still crossfaded chapters, not frame-locked transitions (Flow first-frame conditioning remains unqualified).
- Mobile cinematic uses centered 16:9 crops; native 9:16 chapters still pending a budget decision.
- Checkout remains intentionally disabled pending commercial data.

## 2026-09-21 — phases 0–4 initiated

### Completed

- Audited the workspace: it is a greenfield directory, not a Git repository, with ten supplied product photographs and no application/package configuration yet.
- Verified Node, npm, Python, ffmpeg, and ffprobe are present; ImageMagick is absent.
- Installed Scroll World and read its skill, prompt templates, pipeline, scrub engine, standalone template, and knockout utility.
- Verified UI UX Pro Max is present; ran its design-system and UX research. Its generic liquid-glass recommendation was rejected in favour of the photographed material-led, dark editorial direction.
- Discovered and recorded the live Flow Assets server schema and system health.
- Inspected all ten product photographs and created the visual source of truth and asset manifest.
- Persisted the initial Jimmy & Wax design system.
- Generated and reviewed one controlled ImageGen campaign anchor from three source references. It is saved as `public/media/generated/stills/hero-style-anchor-v1.png`; it is approved only for atmospheric/editorial use because generated packaging text is not commerce-verifiable.
- Built the first React/Vite commerce-foundation pass: responsive storytelling, shop cards, an accessible cart drawer, quantity controls, local cart persistence, motion reduction styles, and a truthful disabled checkout state pending commercial data.
- Ran browser QA at 1440×900 and 375×812. Verified the rendered hero, mobile layout, product cards, Add to Care List, drawer quantity update, and disabled checkout guard. Fixed the only observed console issue (missing favicon).
- Re-ran the production build and reloaded the browser after the favicon fix: build succeeds, browser error log is empty, and no non-static network failures were reported.
- Ran the controlled Flow qualification job `fc38cccf-1db3-4d6c-b8cc-16af53717fbc`. The watermark-free final delivery completed at 1280×720 / 24fps / 4.01s and passed technical validation, but visual inspection rejected it for Architecture A because the reference-conditioned frame 0 materially changed the approved opening composition. No dependent cinematic legs were generated.
- Created the production home-hero motion with Flow job `42809d06-216d-417c-b92f-ce68e44ea44a`, using the approved branded campaign still as its Ingredient reference. The live Flow UI accepted a 4-second 16:9 request (rather than the requested 8-second option), completed 1280×720 / 24 fps delivery with watermark removal verified, and passed visual review for the independent hero use case. The final delivery was copied into the project and web-encoded without audio at `public/media/generated/video/desktop/hero-hypermotion-web-v1.mp4`; it is layered over the still fallback and is suppressed for reduced-motion preferences.
- Rebuilt the site as a Scroll World cinematic story. The shared Scroll World scrub engine now drives four pinned 3D-style chapters, section navigation, a route rail, progress treatment, still fallbacks, reduced-motion handling, blob-backed seekability, and mobile-safe scroll behavior. Motion (the current Framer Motion package) now handles the outer progress, collection reveals, interaction feedback, and cart transitions.
- Generated three Jimmy & Wax campaign worlds with the built-in ImageGen workflow, each using a supplied product photograph as reference and a physical `JIMMY & WAX` brass engraving / W-monogram motif: polish world, application ritual, and care-kit finale.
- Generated, visually reviewed, and integrated three additional `gemini-omni-flash` Flow chapters. All final deliveries were watermark-removed before they were copied into the project and were re-encoded as silent H.264, 1280×720 / 24 fps / 4-second, small-GOP web files: `polish-world-web-v1.mp4`, `ritual-world-web-v1.mp4`, and `finale-world-web-v1.mp4`.
- Created 1920×1080 desktop presentation encodes for the hero and all three Scroll World chapters. These are Lanczos-upscaled versions of the approved 720p Flow finals (not misrepresented as native 1080p), with audio removed, `faststart`, and an 8-frame GOP retained for responsive scroll seeking. The original 720p web encodes now remain the automatic mobile variants to protect phone latency.
- Reworked the home entrance to use the smaller 720p web film on every viewport and shortened its scroll dwell, removing the up-front 1080p decode cost that made the opening feel stuck.
- Replaced the earlier Flow hero clip with a six-second, source-anchored smooth-motion hero treatment. It is authored directly from the approved Jimmy & Wax hero still, runs at 30 fps with a 15-frame GOP and `faststart`, and has separate 1920×1080 desktop / 1280×720 mobile encodes. This keeps the supplied product presentation exact while removing the perceived stutter.
- Added a multi-route commerce experience: `/shop`, three individual object routes, `/ritual`, and `/story`. Proposed launch prices are plainly marked pending commercial approval: ₹499 (Twinkle Shine), ₹349 (Refill), and ₹1,299 (Care Kit).
- Created three source-conditioned catalog product portraits and three source-faithful product-motion plates. The motion plates are authored directly from the approved catalog images so actual product shapes and labels cannot drift. A Google Omni job (`0cdeb7ee-2823-4f2b-8b6d-e5e13c88c15c`) was technically complete but visually rejected because it redesigned the product label and cap; it was never copied into the website.

### Important decisions

- Cinematic approach: Scroll World Architecture A, one grounded forward journey, subject to Flow first-frame continuity qualification.
- Product truth: use original photography / verified static layers for readable labels and commerce; do not rely on generated text.
- Commerce facts: prices, inventory, delivery, return policy, variants, and checkout URL remain unknown and will not be fabricated.

### Active blockers

- The Flow schema accepts reference images but does not expose an explicitly guaranteed first-frame/end-frame continuation field. The qualification test found that this Ingredients workflow does not yet preserve the required first-frame composition, so it cannot safely power the Architecture-A production chain.
- `refine_video`, `regenerate_video`, and legacy Flow workflow operations were also checked; none supplies first-/last-frame conditioning, so no alternate same-server chain workflow is presently available.
- The Scroll World delivery deliberately uses its still-to-video and chapter crossfades rather than presenting Flow Ingredients conditioning as a false frame-perfect chain. A true continuous multi-clip camera handoff remains blocked until Flow exposes start/end-frame locking.

### Next work

1. Add explicit real commercial data and a checkout adapter when supplied.
2. Build the shop/PDP route split and tests on top of the verified cinematic foundation.
3. Render native 9:16 Omni chapters only if a separate mobile-film budget is approved; the current mobile experience retains its properly centered still/video fallbacks.
