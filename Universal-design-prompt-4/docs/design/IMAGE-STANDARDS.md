# Image Standards (D-DS20)

> The image-first system's rules: ratios, crop, quality, delivery, and fallbacks. Images lead every surface — they must be consistent, sharp, and never break layout. Ratios below are the ones **actually used across the 13 built screens** (grounded, not aspirational). Radius/border come from `DESIGN-TOKENS.md`; production delivery is Cloudinary.

## 1. Aspect ratios (canonical)
| Ratio | Use | Seen on |
|---|---|---|
| **4 / 5** (portrait) | editorial hero, asset card, before/after, recent-work rail, AI result | Command Center, Assets, EvidenceBlock, Channel Preview (IG feed) |
| **3 / 4** (portrait) | moodboard tiles, look/pack imagery | Shoot Wizard, Onboarding |
| **16 / 10** (landscape) | shoot cover, brand before/after diptych | Shoot Detail, Brand Detail |
| **1 / 1** (square) | thumbnails, moodboard grid, IG-feed crop, creator recent posts | Matching, Channel Preview, tile AssetCard |
| **9 / 16** (story) | channel story/reel previews only | Channel Preview (story frame) |

**Rule:** pick from this set — do not introduce new ratios. Portrait 4/5 is the default for a single feature image; 1/1 for grids/thumbs. The container owns the ratio (`aspect-ratio`), the image fills it (`object-fit: cover`).

## 2. Crop & focal point
- **`object-fit: cover`** always — never `contain` (no letterboxing) and never distort.
- Crop toward the **subject/product**; production supplies a focal point (Cloudinary `g_auto` or a stored focal coord) so the same asset re-crops safely across 4/5, 1/1, 16/10.
- Faces/products must survive the tightest crop (1/1). Safe-zone dashed overlay (Channel Preview) validates channel crops before publish.
- Text/logo overlays sit on a scrim (`--image-scrim`) or gradient, never straight on the photo.

## 3. Treatment
- Radius: `--image-radius` (~16px) for cards/heroes, `--image-radius-sm` (~9px) for thumbs. Modals/hero share `--card-radius`.
- Border: `1px solid --image-border` hairline; approved/after states use `1.5px --color-approved`, HITL amber uses `--approval-border`.
- Very subtle `--shadow-card` on resting media only; no heavy drop shadows.
- No filters except the intentional `saturate(.75)` on "before" comparison images.

## 4. Minimum size & resolution
- **Min displayed:** a card image ≥ 138px wide (recent-work rail); heroes ≥ 200px.
- Serve **2× (retina)** source for every slot; never upscale a small source to fill a large slot (blur = reject in QA).
- A hero/feature source should be ≥ 1200px on its long edge before crop.

## 5. Delivery (production — Cloudinary)
- All media through Cloudinary with named transform presets per ratio (`asset_4x5`, `thumb_1x1`, `cover_16x10`, `story_9x16`).
- `f_auto` (AVIF/WebP) + `q_auto` (or `q_auto:good` for heroes) + `dpr_auto`; `c_fill,g_auto` for focal crop.
- Responsive `srcset`/`sizes` per slot; lazy-load below the fold, eager-load the LCP hero.
- Cache-bust by version, not query soup.

## 6. Fallback hierarchy
1. **Real asset** (Cloudinary URL).
2. **Brand/placeholder image** — the local `images/NN-fashionos.jpeg` set (prototype) / a branded placeholder (production) when the asset is missing.
3. **SkeletonLoader** while loading (never a broken-image icon, never a spinner over empty space).
4. **EmptyState** when there is genuinely no image and none is expected (e.g. "no shots yet").
- On decode error: swap to fallback #2, log, never show the browser's broken-image glyph.

## 7. Performance (see D-DS23 budget)
- Images are the largest payload — they own **LCP**. Hero must be prioritised + correctly sized; no oversized source shrunk by CSS.
- Every `<img>`/media slot has explicit ratio (`aspect-ratio`) so there is **zero CLS** as images load.
- Grids virtualize / paginate past ~30 items rather than mounting hundreds of full-res tiles.

## 8. QA gate (image row of `DESIGN-QA.md`)
- [ ] Ratio from the canonical set; container owns it; `object-fit: cover`.
- [ ] Focal crop keeps subject in 1/1; no distortion.
- [ ] Retina source; no upscaled blur.
- [ ] Radius + hairline from tokens; scrim under any overlay text.
- [ ] Fallback chain works (real → placeholder → skeleton → empty); no broken-image glyph.
- [ ] Explicit ratio set → no CLS; hero prioritised for LCP.
