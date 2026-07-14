# Design Tokens — Reference

> Single design reference for the Zeely Editorial v3 system. Authoritative source: `tokens.css`. Port these to CSS vars / Tailwind theme. **No hardcoded hex in components — tokens only.**

## Colour
| Token | Value | Use |
|---|---|---|
| `--color-bg-page` | `#FFFFFF` | page background |
| `--color-bg-card` | `#FFFFFF` | cards/surfaces |
| `--color-bg-subtle` | `#FAFAFA` | recessed surfaces, hover |
| `--color-bg-muted` | `#F4F4F5` | track/fills |
| `--color-border` | `#E5E7EB` | hairlines |
| `--color-border-strong` | `#D1D5DB` | hover border |
| `--color-border-subtle` | `#F0F0F1` | inner dividers |
| `--color-text-primary` | `#111111` | headings, key text |
| `--color-text-secondary` | `#6B7280` | body/secondary |
| `--color-text-muted` | `#9CA3AF` | meta/captions |
| `--color-text-disabled` | `#C4C7CC` | disabled |
| `--color-action` | `#111111` | **primary buttons** |
| `--color-action-hover` | `#000000` | primary hover |
| `--color-action-text` | `#FFFFFF` | on primary |
| `--color-approved` | `#059669` | success/approved |
| `--color-warning` (HITL amber) | `#D97706`/`#B45309` | attention only |

**Status dots:** 🟢 ready `#16A34A`/`#059669` · 🟡 attention `#CA8A04`/`#D97706` · ⚪ stale/neutral `#9CA3AF` · 🔴 blocked/critical `#DC2626`.
**DNA bands:** high ≥80 (dark) · mid 60–79 · low <60 (amber flag on weakest pillar).
**Rule:** no orange chrome, no beige, no gradients. Saturated colour only as a dot, chip, ≤2px accent, or a single button.

## Typography
- **Family:** Inter (UI). Numerals/scores/IDs/dates use `font-feature-settings:'tnum'` (mono numerals).
- **Scale (fs):** display ~30px · 2xl ~24 · xl ~20 · lg ~18 · base ~15–16 · sm ~13–14 · xs ~11–12. Min 12px.
- **Weights:** 400 body · 500 medium · 600 semibold (titles/labels) · 700–800 (display/scores).
- **Line-height:** 1.1 display · 1.5–1.55 body. `text-wrap:pretty` for paragraphs.

## Radius
| Token | Value | Use |
|---|---|---|
| `--card-radius` | ~1.25rem (20px) | cards, hero images, modals |
| `--radius-md` | ~0.625rem (10px) | buttons, inputs, chips-rect |
| pill | `999px` | filter chips, toggles, badges |
| `--image-radius` / `-sm` | ~16px / ~9px | media, thumbnails |

## Spacing
4px base. Common: 6/8/10/12/14/16/18/20/24/28/32/40px. Workspace padding ~28–40px desktop, 16–20px mobile. Card padding 14–22px. Section gap ~20px. Control gap 8–14px (flex/grid `gap`, not margins).

## Elevation / shadows
- Surfaces separated by **1px hairlines** (`--color-border`), not shadows.
- `--shadow-card`: `0 1px 3px rgba(17,17,17,.05), 0 1px 2px -1px rgba(17,17,17,.04)` (resting cards, very subtle).
- Shadows reserved for **transient overlays**: modal/sheet/popover/toast (`0 8–24px 28–60px rgba(0,0,0,.16–.28)`).

## Icon sizes
13–16px inline/meta · 18–20px nav/controls · 22–28px hero/empty. Stroke 1.7–2. **Lucide** in production (prototypes use inline equivalents).

## Layout tokens
`--nav-width-collapsed: 3.5rem` · `--nav-width-expanded: 14rem`. Workspace max-width ~820–1080px column. Breakpoint **`max-width:1024px`** = mobile.

## Motion (see `ANIMATIONS.md`)
`--duration-normal: 250ms` · `--ease-default: cubic-bezier(.16,1,.3,1)`. Respect `prefers-reduced-motion`.

## Token governance (D-DS15)
> How tokens are named, added, changed, and retired. `tokens.css` is the **single source**; this doc is its human reference. No screen ever hard-codes a value a token covers.

### Naming
- Pattern: `--<category>-<role>[-<modifier>]` — `category` ∈ `color · fs · card-radius/radius · shadow · nav-width · duration · ease`. Role is semantic (`text-primary`, `action-hover`), **never** literal (`--color-grey-3`, `--blue`).
- Semantic over literal: name by **job**, not appearance — a value used for "primary button" is `--color-action`, so a future palette change edits one token, not 40 call sites.
- Numerals scale by size word (`fs-xs…display`), not by px in the name.

### Adding a token
1. Prove reuse — a value used **once** does not become a token (inline it). A token earns its place at ~3+ uses or when it's a deliberate system decision.
2. Check for an existing token first (avoid `--color-bg-subtle` **and** `--color-bg-muted` drifting into duplicates).
3. Add to `tokens.css` **and** this table in the same change; give it a semantic role + a "Use" note.
4. New color must pass AA contrast in its intended pairing and obey the palette rule (no orange chrome/beige/gradient).

### Changing a token
- Changing a **value** propagates everywhere — run the `DESIGN-QA.md` color/contrast + visual pass on the 🔴 high-blast surfaces (every card uses `--color-border`, `--color-text-primary`, `--color-action`).
- **Never** repurpose a token's meaning (don't make `--color-approved` amber). Add a new token instead.
- Renames are breaking: keep the old name as an alias for one cycle, mark it Deprecated (below), then remove.

### Deprecating a token
- Mark `⚠️ Deprecated → use <replacement>` in this table; keep it aliased in `tokens.css` for one release; grep the codebase to zero before deleting.
- Log every add/rename/deprecate in `changelog.md`.

### Anti-patterns (reject in review)
- Raw hex / px in a screen where a token exists · literal-named tokens (`--grey-2`) · a second token for a value that already exists · saturated color used as a background (allowed only as dot/chip/≤2px accent/single button).
