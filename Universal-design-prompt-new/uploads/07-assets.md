# Claude Design Prompt — Assets (`/app/assets`)

**Screen:** Assets — full asset library with DNA match scoring and multi-select bulk actions.
**Route:** `/app/assets`
**Agent:** `visual-identity`

Paste after the universal prompt from `prompts/00-universal.md`.

---

## Prompt (copy everything below this line)

---

Design the **Assets** screen (`/app/assets`) for iPix / FashionOS.

### Layout

Standard 3-panel shell:

```
grid-template-columns: auto  minmax(0, 1fr)  auto
                        ↑          ↑              ↑
                    NavSidebar  Workspace   IntelligencePanel
```

Active nav item: Assets (Grid icon, `var(--color-text-primary)`).
Workspace header: `Assets › Nike` — breadcrumb `var(--font-size-sm)` `var(--color-text-muted)` + `[Upload assets]` primary Button top-right.

---

### NavSidebar — Left panel

Identical to other screens. Assets nav item highlighted. Active state is a calm thin-grey: `--nav-item-active` light-grey fill + `--nav-item-active-text` charcoal label + charcoal icon. No orange, no heavy highlight.

---

### Workspace — Center panel

**Agent greeting card:**
- `Nike has 47 assets. 8 score below 70% DNA match — I can suggest improvements or replacements.`
- `var(--color-bg-subtle)` bg, 1px `var(--color-border)`, `var(--card-radius)`, `var(--font-size-sm)`

**Quick-action chips:**
1. `Review low-scoring assets`
2. `Upload new assets`
3. `Bulk tag by shoot`

**Filter + view bar:**

Two rows:
- Row 1 (filters): Brand `<Select>` · Shoot `<Select>` · DNA score range `<Select>` (All · ≥80 · 60–79 · <60) · Asset type `<Select>` (All · Photo · Video · Graphic)
- Row 2 (results + view): `47 assets` `var(--font-size-sm)` `var(--color-text-muted)` left + view toggle right: Lucide `Grid` (active, `var(--color-text-primary)`) | Lucide `List` (inactive)

**Asset masonry grid** (3 columns, variable row height):

Each asset is a `<Card>` with image fill.

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│              │  │              │  │              │
│   [image]    │  │   [image]    │  │   [image]    │
│              │  │   taller     │  │              │
│              │  │              │  │              │
│  95%  ✓dna   │  │  72%  !dna   │  │  88%  ✓dna   │
└──────────────┘  └──────────────┘  └──────────────┘
```

Card anatomy:
- Image fills card, `var(--card-radius)` radius, `object-fit: cover`
- Bottom overlay (gradient `rgba(0,0,0,0.4)` → transparent, from bottom 40px):
  - DNA match % `var(--font-size-xs)` Geist Mono white — left
  - DNA badge: `✓` green if ≥80, `!` amber if 60–79, `✗` red if <60 — right
- Hover: white overlay `opacity-hover`, Lucide `Eye` 20px centered, `var(--card-radius)`. Checkbox appears top-left (multi-select mode).
- Selected state (multi-select): `var(--color-text-primary)` 2px border, checkbox checked `#000000`

Show 9 assets in populated state (mix of scores — some ≥80, some 60–79, one <60).

**Bulk action bar** (fixed bottom, appears when ≥1 asset selected):

```
┌────────────────────────────────────────────────────────────────┐
│  ☑ 3 selected   [Download]  [Tag]  [Match to product]  [Clear] │
└────────────────────────────────────────────────────────────────┘
```

- Background: `var(--color-bg-card)` white, 1px top border `var(--color-border)`, 12px padding
- Count: `var(--font-size-sm)` `var(--font-weight-medium)` `var(--color-text-primary)`
- Buttons: outline sm. `[Clear]` ghost sm `var(--color-text-muted)`.
- Hides when no assets selected.

**AI Chat Dock** (pinned to bottom of center workspace, above bulk bar if visible — always present):
- Context-aware greeting: names active filter, brand, and next action — e.g. "Nike has 8 assets below 70% DNA match — want me to suggest replacements or improvements?" Never "How can I help?".
- Quick-action chips (3–5): thin grey, context-specific, minimal line icons.
- Streaming status: live steps — green check = done, pulsing dot = active, faint dot = pending. Never a spinner.
- Input: full-width "Ask about this asset library…" placeholder, mic icon left, black send button right.
- Style: white bg, 1px `var(--color-border)` top border, Inter, black actions. No orange, no gradients.

---

### IntelligencePanel — Right panel

Shows selected asset detail when one asset is clicked (not in multi-select mode). Always white. 320px.

**Panel header:**
- `Asset Detail` — `var(--font-size-base)` `var(--font-weight-semibold)`
- Close icon Lucide `X` 16px `var(--color-text-muted)` right (deselects asset)

**Asset preview:**
100% wide, 160px tall, `object-fit: cover`, `var(--card-radius)`. Filename below: `var(--font-size-xs)` `var(--color-text-muted)` Geist Mono.

**DNA match section:**

Score: `95` `var(--font-size-display)` Geist Mono `var(--font-weight-bold)` `var(--dna-bar-high)` color. Label "DNA Match" `var(--font-size-xs)` muted.

Full-width bar: 95% `var(--dna-bar-high)`, 6px.

Pillar breakdown:
```
Composition   ████████░  92   --dna-bar-high
Colour        █████████  97   --dna-bar-high
Subject       ████████░  88   --dna-bar-high
Brand tone    ████░░░░░  61   --dna-bar-mid  ← weakest
```

Divider.

**EXIF / metadata:**
```
Shoot      Spring Lookbook 2026
Shot #     3 · Lifestyle
Date       Jan 28, 2026
Type       Photo · JPEG
Size       4.2 MB · 4000×5000px
```
Label `var(--color-text-muted)` `var(--font-size-xs)`. Value `var(--color-text-primary)` `var(--font-size-sm)`.

Divider.

**AI suggestions section:**

Label "AI Suggestions" `var(--font-size-xs)` uppercase muted + Lucide `Sparkles` 12px `var(--color-text-primary)`.

Suggestion rows:
- `Brand tone score is 61. Try increasing contrast in the background.` `var(--font-size-sm)` `var(--color-text-secondary)`
- `2 similar assets score 94%+ — consider using those for hero placement.` + `[View alternatives]` link

**Panel tabs** (sticky bottom):
`Detail | DNA | Similar | History` — `<Tabs>`. Active: black underline (`var(--color-text-primary)`).

---

### Generate all 5 states

**State 1 — Populated, one asset selected** (95% DNA, Spring Lookbook asset)

**State 2 — Multi-select mode** (3 assets selected):
- Grid: 3 assets with `var(--color-text-primary)` 2px border + checked checkbox
- Right panel: shows `3 assets selected` summary — total size, avg DNA score (avg `var(--font-size-display)` Geist Mono), and `[Download all]` `[Tag all]` Buttons
- Bulk bar visible at bottom

**State 3 — Empty** (no assets for this brand/filter):
- Center: realistic quietly-faded editorial fashion photography mockup of a populated masonry grid (3 columns, 6 cards, slightly desaturated). Below the preview: Agent: `No assets match this filter. Upload new assets or adjust the filters.` + `[Upload assets]` black `default` Button. Optional AI suggestion: `I can analyse any uploaded asset for DNA match in seconds.`
- Right panel: Lucide `Image` 32px muted + `Select an asset to see DNA match and details` + `[Upload assets]` Button

**State 4 — Loading:**
- Center: skeleton greeting + skeleton filter bar + skeleton masonry grid (9 skeleton cards of varying heights, shimmer)
- Right panel: skeleton preview (160px) + skeleton score (32px) + 4 skeleton bars

**State 5 — HITL: AI flags a low-scoring asset:**
Center workspace shows an inline ApprovalCard:

```
┌──────────────────────────────────────────────────────────┐
│ ⚠  Low DNA Match — asset-047.jpg (61%)                    │
│                                                          │
│  Before: Current hero shot — indoor café setting         │
│  After:  Suggested replacement — studio white bg         │
│          Replacement scores 94% DNA match                │
│                                                          │
│  62% confidence · Based on Nike DNA (brand tone pillar)  │
│                                                          │
│  [Use replacement]   [Keep original]   [Find more]       │
└──────────────────────────────────────────────────────────┘
```

---

### Design tokens

| Element | Token |
|---|---|
| Page bg | `var(--color-bg-page)` |
| Asset card overlay | `rgba(0,0,0,0.4)` gradient |
| Asset selected border | `var(--color-text-primary)` 2px |
| DNA high (≥80) | `var(--dna-bar-high)` |
| DNA mid (60–79) | `var(--dna-bar-mid)` |
| DNA low (<60) | `var(--dna-bar-low)` |
| DNA badge ✓ | `var(--status-active-text)` |
| DNA badge ! | `var(--color-warning)` |
| DNA badge ✗ | `var(--color-error)` |
| Bulk bar bg | `var(--color-bg-card)` |
| Asset masonry | native aspect ratio; 1:1 uniform toggle available |
| Nav active fill | `--nav-item-active` |
| Nav active text | `--nav-item-active-text` |
| HITL card border | `var(--approval-border)` (amber 1px) |
| HITL card bg | `var(--approval-bg)` (white) |

---

### Rules for this screen

1. Asset grid is masonry — variable row height based on image aspect ratio. Never force equal heights.
2. DNA score overlays are always on a dark gradient — never on white — so text is readable over any image.
3. Multi-select activates on checkbox click, not card click. Card click in non-select mode opens right panel detail.
4. Bulk action bar is fixed-bottom and only appears when ≥1 asset is selected. It does not push content up.
5. The right panel shows single-asset detail. In multi-select mode, right panel switches to the selection summary.
6. DNA pillar breakdown in the right panel always flags the weakest pillar — amber bar + indicator.
7. EXIF / metadata is read-only in the right panel. Editing shoot assignment is out of scope for this screen.
8. `[Upload assets]` in the header opens a file picker (implementation out of scope — link to `#`).
9. DNA scores use Geist Mono throughout — they are data, not prose.
10. Hover state on asset cards never covers the DNA score overlay — the overlay is always readable.

---

### Output format

Full-page HTML prototype:
- All 5 states as toggle-able views
- Masonry grid with 9 placeholder images (use `var(--color-bg-subtle)` filled divs of varying heights if no images available)
- Click asset → loads right panel detail, deselects any multi-select
- Checkbox appears on hover; clicking it enters multi-select mode for that asset
- Selecting ≥1 asset shows bulk action bar at bottom
- Filter dropdowns functional (filter by score range hides cards below threshold)
- Panel tabs functional
- Mobile at `max-width: 1024px`: 2-column grid, right panel hidden, asset tap opens Sheet from bottom
