# Performance Budget (D-DS23)

> Targets the design enforces and React/Claude Code verifies. Design owns the **layout-level** guarantees (explicit ratios → no CLS, one hero → clean LCP, token-scale fonts); Claude Code owns the **runtime** measurement (Lighthouse/field data in the code repo). Cross-refs: `IMAGE-STANDARDS.md` (images own LCP), `ANIMATIONS.md` (motion), `DESIGN-TOKENS.md` (fonts).

## Core Web Vitals (targets)
| Metric | Target | Owner | Design lever |
|---|---|---|---|
| **LCP** | ≤ 2.5s | Design + Code | prioritise + correctly size the hero image; no oversized source shrunk by CSS |
| **CLS** | ≤ 0.05 | **Design** | every media slot has explicit `aspect-ratio`; reserve space for async content; no layout-shifting webfont swap |
| **INP** | ≤ 200ms | Code | keep interactions light; virtualize long grids |
| **TTFB** | ≤ 0.8s | Code | SSR/edge cache |

## Asset budgets (per route, gzipped)
| Resource | Budget | Notes |
|---|---|---|
| **Images** | ≤ 1.0 MB above the fold | Cloudinary `f_auto`/`q_auto`/`dpr_auto`; responsive `srcset`; lazy below fold (`IMAGE-STANDARDS.md`) |
| **Fonts** | ≤ 150 KB (Inter subset) | 2–3 weights max (400/500/600 + 700 display); `font-display: swap`; preload the one hero weight; **no** webfont for numerals if `tnum` on a loaded weight covers it |
| **JS** | ≤ 250 KB initial | code-split per route; CopilotKit/agent runtime lazy where possible |
| **CSS** | ≤ 60 KB | tokens + Tailwind purged; no unused utilities |
| **Icons (Lucide)** | tree-shaken | import per-icon, never the whole set |
| **SVG** | inline only small UI glyphs | large illustration → optimized asset, not inline |

## Rules the design guarantees
- **Zero CLS from images:** container owns `aspect-ratio`; image fills with `object-fit:cover`. No image without reserved space.
- **One LCP element per screen:** the editorial hero. It loads eager + prioritized; everything else lazy.
- **Skeletons, not spinners:** `SkeletonLoader` in the real layout shape holds space (no reflow when content lands).
- **Motion is cheap:** transform/opacity only (`ANIMATIONS.md`); no animating layout properties; `prefers-reduced-motion` disables.
- **Long lists virtualize/paginate** past ~30 items (Assets masonry, Matching table) — never mount hundreds of full-res tiles.
- **Fonts don't shift layout:** `font-display:swap` with a metrics-matched fallback; reserve heading space.

## Verification (Claude Code, code repo)
- [ ] Lighthouse ≥ 90 performance on each route (throttled mobile).
- [ ] Field CWV (LCP/CLS/INP) within targets on real devices.
- [ ] Bundle analyzer within JS/CSS budgets per route.
- [ ] Image transfer within budget; hero is the LCP element and is prioritized.
- [ ] No CLS regressions (explicit ratios everywhere; verified in the QA gate, `DESIGN-QA.md` §10).
