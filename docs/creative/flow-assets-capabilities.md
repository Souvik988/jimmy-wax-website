# Flow Assets — live capability record

## Mandatory review gate — 2026-09-23

User-mandated process, now binding: **generate → review → add**. No generated video is integrated
without passing the frame-review checklist in `docs/working-standards.md` — most critically, product
shots must either carry correct Twinkle Shine branding or contain no packaging at all. The Phase-1
hero hypermotion (`8946c486`) was accepted with a brandless white pouch and later rejected by the
user; that acceptance was a gate failure. Brandless product = reject.

Inspected: 2026-09-21

This document records the connected `mcp__flow_assets` server as observed in this workspace. It deliberately avoids inferred model fields or unsupported operations.

## Connection and capacity

- `video_system_health` returned `status: ok`, `acceptingJobs: true`, and an empty queue.
- Effective concurrency is **one** job because the server protects a single persistent browser profile from UI-state corruption.
- `browserConnected` is currently `false`. A Google Flow browser-session authentication step is required before a generation can proceed.

## Video generation

### `generate_video`

Creates a durable asynchronous Google Flow video job. Inputs:

- required: `prompt` — a director-style instruction
- optional: `aspectRatio` (`16:9`, `9:16`, `1:1`), `duration` (`4s`, `6s`, `8s`, `10s`), `model` (`gemini-omni-flash`, `veo-3.1-fast`, `veo-3.1-quality`), `negativePrompt`, `style`, `qualityTarget` (`standard`, `high`), `priority` (`LOW`, `NORMAL`, `HIGH`), `idempotencyKey`, `waitForCompletion`
- optional: `referenceImagePaths` — absolute local paths to PNG, JPEG, or WebP files; they are explicitly uploaded as Google Flow Ingredients.

The tool is asynchronous by default and returns a durable job ID. `outputPath` exists only as a deprecated, ignored input.

### `get_video_job`

Requires a `jobId`. Returns the durable job state, progress timeline, compiled prompt, output, and quality-control result.

### `recover_video_job`

Requires a `jobId` in one of `DOWNLOAD_FAILED`, `RECOVERY_REQUIRED`, `GENERATED`, or `RETRIEVING`. It reattaches to the paid generation, retrieves it, removes the watermark, and completes the job without resubmitting or spending again.

### `cancel_video_job` and `list_video_jobs`

The server exposes cancellation and recent local durable-job history. `list_video_jobs` accepts an optional `limit`.

### Delivery contract

For a completed job, use only `delivery.localPath`, after verifying `delivery.watermarkRemoved === true`. Never use artifacts under `outputs/<job-id>/source/` or `outputs/<job-id>/tmp/`.

## Other related tools

- `flow_browser_generate_video` is a compatibility alias and also requires a manually authenticated Google browser session.
- `get_video_status` is a compatibility alias for durable job lookup and accepts `requestId`.
- `download_flow_video` is legacy manual download for an authorized Google URL or Drive ID; orchestration jobs already retrieve and validate their own media.
- `flow_browser_login`, `flow_browser_check_session`, and browser action/autopilot tooling are present for managing that session.

## Capability assessment for Jimmy & Wax

- Confirmed: local still-image reference paths, 16:9 and 9:16 generation, 4–10 second clips, durable async jobs, job polling, local watermark-removed final delivery, and recovery without duplicate billing.
- Not yet qualified: first-frame fidelity, product geometry stability, motion adherence, native portrait output quality, audio behavior, actual end-frame continuation, output resolution, and URL lifetime. These require the controlled preview planned for Phase 8 after authentication.
- The visible live schema has **reference images**, not a separately named guaranteed frame-lock/end-frame parameter. Architecture A will be qualified with a low-cost short clip before any dependent cinematic chain is committed.
- Other same-server operations were inspected: `refine_video` makes a new version from a prior job using a directive, `regenerate_video` makes a new version from the prior creative brief, and legacy Flow records do not create Google Flow UI workflows. None exposes a first-frame or last-frame conditioning input. They do not close the Architecture-A continuity gap.

## Observed limitations and errors

- Current blocker: no authenticated persistent Flow browser session (`browserConnected: false`).
- Server history includes prior `DOWNLOAD_FAILED`, `UI_CHANGED`, `SUBMISSION_FAILED`, and `AUTH_REQUIRED` jobs; those are historical totals, not evidence of a current failure.

## Qualification result — 2026-09-21

- Job: `fc38cccf-1db3-4d6c-b8cc-16af53717fbc`
- Input: one 16:9 local campaign still supplied through `referenceImagePaths`.
- Requested: a 4-second `gemini-omni-flash` forward-glide test with the supplied still as the exact opening composition.
- Delivered: final watermark-free local MP4, 1280×720, 24 fps, 4.01 seconds, H.264 + AAC. Technical integrity, container, aspect ratio, duration, and frame decoding checks passed.
- Retrieval: the job briefly sat in `GENERATED`; a recovery call raced the existing validation process and returned an invalid-transition error, but the durable job completed successfully. No second generation was submitted.
- Visual finding: **failed first-frame adherence.** The completed first frame materially changed the supplied composition, product arrangement, background, and pack details. The last frame was coherent with the generated clip but is not an acceptable continuation anchor for the supplied hero still.
- Architecture decision: **do not generate a dependent Architecture-A chain from this model/reference workflow yet.** The server has demonstrated Ingredients-style visual conditioning, not the required rendered-frame handoff contract. The clip is retained only as qualification evidence, never as a production cinematic asset.
- Audio finding: the final MP4 carries AAC audio despite the brief’s no-audio constraint. Future web encodes must explicitly strip audio after a qualified visual workflow exists.

## Production hero result — 2026-09-21

- Job: `42809d06-216d-417c-b92f-ce68e44ea44a`
- Input: the approved Jimmy & Wax campaign still through `referenceImagePaths` / Google Flow Ingredients.
- Requested: a single continuous luxury-product hypermotion move (forward push, lateral parallax, warm dust motes, and a calm final frame), preserving the shoe, refill pouch, brush, and cloth.
- Live capability adjustment: the active Flow UI rejected the attempted 8-second route before submission and exposed a 4-second, 16:9, 720p path. The final request used that available configuration; no duplicate job was submitted.
- Delivered: only the completed watermark-free `delivery.localPath` was accepted (1280×720, 24 fps, 4.01 seconds). First/last-frame review confirmed a coherent product arrangement, premium camera movement treatment, and no visible watermark.
- Web integration: the project copy is re-encoded as silent H.264/MP4 with `faststart`, then used as the autoplaying, muted, inline hero layer. The original approved still remains behind it as the loading/error and reduced-motion fallback.

## Scroll World chapter results — 2026-09-21

- Model policy: all additional video requests use `gemini-omni-flash` (Google Omni), 16:9, 4 seconds, and a local ImageGen campaign world supplied as a Flow Ingredient.
- Completed final deliveries, each accepted only from `delivery.localPath` after `delivery.watermarkRemoved: true`: `90602c8f-f2e2-44a2-a078-57bec7ff526d` (polish world), `cec82e9b-2082-496e-a9ad-23102e73a080` (ritual world), and `8f1c6acc-36bb-48c8-9b91-8e6ee754c23e` (care-kit finale).
- Each technical delivery is 1280×720 / 24 fps / 4.01 seconds. The website encodes strip audio, add `faststart`, and use GOP 8 for practical scroll seeking.
- Desktop quality route: Flow's available Omni route delivered only 1280×720, so the site now uses carefully encoded 1920×1080 presentation upscales on desktop and retains the 720p small-GOP web variants on mobile. These upscales improve display fit and encode quality but are explicitly not treated as native 1080p Flow footage.
- Product truth guardrail — 2026-09-21: Google Omni Ingredients are a visual reference, not a guaranteed structural/label lock. Job `0cdeb7ee-2823-4f2b-8b6d-e5e13c88c15c` completed from the approved bottle portrait with watermark removal verified, but visual frame review found an altered cap and redesigned label. It was rejected and is not integrated. Exact-product commerce motion is authored from the approved stills instead; no Flow output that alters packaging is presented as Jimmy & Wax product footage.
- Hero replacement review — 2026-09-21: Google Omni job `fdff5667-4a1e-4d55-84fa-c86dfb6ed558` completed at 1280×720 / 24 fps / 6.016 s with watermark removal verified. Visual review rejected it because it replaced the approved Jimmy & Wax bottle with an invented round tin. It is not integrated. The hero now uses a smooth source-anchored motion treatment rather than misrepresenting the generated object as a real product.
- Visual decision: these clips are used as independent Scroll World chapters with the engine's intentional crossfades. They are not described or used as a mathematically frame-locked continuous chain, because Google Omni's Ingredients workflow remains reference-conditioned rather than guaranteed start/end-frame locked.

## Phase 1 atmosphere films — 2026-09-21

All three jobs used `gemini-omni-flash`, 16:9, a project still as a single Ingredient, `qualityTarget: high`, and prompts that forbid readable text/packaging. Each final was frame-reviewed before acceptance and re-encoded as silent H.264 (`-an`, `+faststart`, crf 21, GOP 48 — these are loop films, not scrubbed chapters).

- Ritual film — job `62561c4e-661d-4d75-827c-353a4b7b6e13`, 8s, 1280×720/24fps, watermark removed (inpaint). Beats verified: brush sweep → cloth application → specular buff with dust motes. Integrated as `public/media/generated/video/desktop/ritual-film-web-v1.mp4` on `/ritual`.
- Materials macro — job `c61ca53b-2ff3-4f37-9760-4fc07fc901c3`, 6s, 1280×720/24fps, watermark removed. Beats verified: bristle macro → cloth pile → brass edge to oxblood sheen. Integrated as `public/media/generated/video/desktop/materials-macro-web-v1.mp4` on `/shop`.
- Atelier ambience — job `96eb76d1-79ed-4680-826e-be98a774e71c`, 8s, 1280×720/24fps, watermark removed. Verified: warm lamp still life, unlabeled apothecary jar, no text. Integrated as `public/media/generated/video/desktop/atelier-ambience-web-v1.mp4` on `/story`.
- Encoding note: loop films use GOP 48 for size; the scroll-scrubbed world chapters keep GOP 8 for seek latency. Both stay silent and `faststart`.
