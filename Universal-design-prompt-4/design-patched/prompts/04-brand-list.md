# Claude Design Prompt — Brand List (`/app/brand`)

**Screen:** Brand List — grid of all brands managed by this operator.
**Route:** `/app/brand`
**Agent:** `brand-intelligence`

Paste after the universal prompt from `prompts/00-universal.md`.

---

## Prompt (copy everything below this line)

---

Design the **Brand List** screen (`/app/brand`) for iPix / FashionOS.

### Layout

Standard 3-panel shell:

```
grid-template-columns: auto  minmax(0, 1fr)  auto
                        ↑          ↑              ↑
                    NavSidebar  Workspace   IntelligencePanel
```

Active nav item: Brands (Layers icon, `var(--color-text-primary)`).
Workspace header: `Brands` — `var(--font-size-xl)` `var(--font-weight-semibold)` + `[+ Add brand]` primary button top-right.

---

### NavSidebar — Left panel

Identical to dashboard. Nike active (`●`), badge `[3]`, Brands nav item highlighted. Active state is a calm thin-grey: `--nav-item-active` light-grey fill + `--nav-item-active-text` charcoal label + charcoal icon. No orange, no heavy highlight.

---

### Workspace — Center panel

**Agent greeting card:**
- `You manage 3 brands. Nike needs attention — Visual DNA score dropped to 72. Want me to draft improvements?`
- `var(--color-bg-subtle)` bg, 1px `var(--color-border)`, `var(--card-radius)`, `var(--font-size-sm)`

**Quick-action chips:**
1. `Improve Nike Visual`
2. `Add a brand`
3. `Run bulk analysis`

**Filter bar** (below chips, horizontal):
- Search input: `var(--color-bg-card)` bg, 1px `var(--color-border)`, `var(--card-radius)`, placeholder `Search brands…`, Lucide `Search` 16px left
- Status filter: `<Select>` — All · Active · Analysing · Draft
- Sort: `<Select>` — DNA score · Name · Recently updated

**Brand card grid** (3 columns, responsive to 2 at 1280px):

Each brand is a `<Card>` (extends `ui/card.tsx`).

```
┌──────────────────────────────┐
│  ██████████████████████████  │  ← brand cover image, 16:9 aspect ratio
│  ████  [EDITORIAL PHOTO]  ██  │     full-width, --image-radius top corners
│  ██████████████████████████  │     status chip top-right corner of image
├──────────────────────────────┤
│  Nike                 active │  ← status chip also here as fallback label
│  DNA  87  ████████░          │
│  Visual 72*  Voice 94        │
│  [View]           [Analyse]  │
└──────────────────────────────┘
```

Card anatomy:
- Top: brand cover image at **16:9 aspect ratio**, full-width to card corners, `--image-radius` top corners, `object-fit: cover`. Source editorial fashion photography from `/app/design/images/`. Neutral `--image-placeholder-bg` skeleton at exact 16:9 ratio if no image.
- Status chip (`active`, `draft`, `analysing`) sits in the **top-right corner of the image** — a small grey/amber chip with a dot. Also shown as text below the image for clarity.
- Brand row: brand name `var(--font-size-base)` `var(--font-weight-semibold)` + status chip right
- DNA score row: `DNA` label `var(--font-size-xs)` muted + score `var(--font-size-xl)` `var(--font-weight-bold)` Geist Mono + overall bar full-width 6px
- Pillar row: 4 mini scores `var(--font-size-xs)` Geist Mono, truncated with `·` separator, `var(--color-text-secondary)`
- Weakest pillar flagged: `var(--color-text-muted)` with `*` asterisk — e.g. `Visual  72*` with footnote `* weakest pillar`
- Action row: `[View]` outline sm → `/app/brand/[id]` · `[Analyse]` ghost sm → triggers workflow

Status chips:
- `active` → `var(--status-active-text)` + `var(--status-active-bg)` (green)
- `analysing` → `var(--color-text-primary)` text + `var(--color-bg-subtle)` bg, pulsing dark dot animation
- `draft` → `var(--color-text-muted)` + `var(--color-bg-subtle)` (grey)
- `no data` → `var(--color-text-muted)` + `var(--color-bg-subtle)` (gray)

Card hover: `var(--shadow-card-hover)`, cursor pointer.

**Show 3 brands in populated state:**
1. `Nike` — active, DNA 87, Brand 88 / Visual 72 (weakest) / Voice 94 / Commerce 79
2. `Adidas` — active, DNA 91, Brand 90 / Visual 88 / Voice 95 / Commerce 91
3. `Zara` — draft, DNA — (no data yet)

**AI Chat Dock** (pinned to bottom of center workspace — always present):
- Context-aware greeting: names active page, brand, and next action — e.g. "You manage 3 brands. Nike's Visual DNA dropped to 72 — want me to draft improvements?" Never "How can I help?".
- Quick-action chips (3–5): thin grey, context-specific, minimal line icons.
- Streaming status: live steps — green check = done, pulsing dot = active, faint dot = pending. Never a spinner.
- Input: full-width "Ask about this brand portfolio…" placeholder, mic icon left, black send button right.
- Style: white bg, 1px `var(--color-border)` top border, Inter, black actions. No orange, no gradients.

---

### IntelligencePanel — Right panel

Summarises portfolio health. Always white bg. 320px.

**Panel header:**
- `Portfolio` — `var(--font-size-base)` `var(--font-weight-semibold)`
- `3 brands` — `var(--font-size-xs)` `var(--color-text-muted)` right

**Portfolio health section:**

Average DNA: `89` — `var(--font-size-display)` Geist Mono `var(--font-weight-bold)`. Label "Avg DNA" `var(--font-size-xs)` muted.

Brand rows (3, compact):
```
● Nike    87  ████████░   --dna-bar-high
● Adidas  91  █████████   --dna-bar-high
○ Zara    —   ░░░░░░░░░   --color-bg-subtle (no data)
```
Each row: dot indicator + name `var(--font-size-sm)` + score `var(--font-size-sm)` Geist Mono right + mini bar 4px.

Divider.

**Needs attention section:**

Label "Needs Attention" `var(--font-size-xs)` uppercase muted + amber badge `[1]`.

Single row card: `⚠ Nike — Visual DNA 72` with `[Fix now]` link `var(--color-text-primary)` `var(--font-size-xs)`.

Divider.

**Pending approvals:**

Label "Approvals" + dark badge `[3]`.
`3 pending across all brands` `var(--font-size-sm)` + `[Review →]` `var(--color-text-primary)`.

**Panel tabs** (sticky bottom):
`Portfolio | Approvals | Activity` — `<Tabs>`. Active: black underline (`var(--color-text-primary)`).

---

### Generate all 5 states

**State 1 — Populated** (3 brands, 1 needs attention, 3 approvals)

**State 2 — Empty** (no brands yet):
- Center: realistic quietly-faded mockup of 3 populated brand cards using editorial fashion photography (slightly desaturated). Below the preview: Agent: `No brands yet. Add your first brand and I'll crawl it and build Brand DNA in minutes.` + `[+ Add brand]` black `default` Button. Optional AI suggestion below CTA: `I can crawl your website and build a full Brand DNA profile in under 2 minutes.`
- Right panel: `No brands` Lucide `Layers` 32px muted + `Add a brand to get started` + `[+ Add brand]` Button full-width

**State 3 — Loading:**
- Center: skeleton greeting (2 lines) + skeleton filter bar (full-width 36px) + 3 skeleton cards (180px each, `var(--color-bg-subtle)` shimmer)
- Right panel: skeleton for average score (48×32px) + 3 skeleton brand rows (full-width, 20px each)

**State 4 — Error** (brand list fetch failed):
- Center: Lucide `WifiOff` 32px muted centered + `Couldn't load brands` `var(--font-size-sm)` + `[Try again]` ghost Button
- Right panel: same error state — icon + text + retry

**State 5 — Analysis in progress** (operator clicked Analyse on a brand):
- Nike card gains `analysing` chip with pulsing dark dot
- Center workspace: inline streaming progress card for Nike: `Crawling nike.com… 23 of 47 pages analysed.` animated cursor `var(--streaming-cursor)` + agent thinking dots `var(--thinking-dot)`
- Right panel: Nike row gains animated indeterminate bar

---

### Design tokens

| Element | Token |
|---|---|
| Page bg | `var(--color-bg-page)` |
| Brand card bg | `var(--color-bg-card)` |
| Brand card border | `var(--color-border)` |
| Card hover shadow | `var(--shadow-card-hover)` |
| Brand cover image | 16:9, `--image-radius` top corners, `object-fit: cover` |
| Image placeholder | `--image-placeholder-bg` neutral fill |
| Nav active fill | `--nav-item-active` |
| Nav active text | `--nav-item-active-text` |
| Active status | `var(--status-active-text)` + `var(--status-active-bg)` |
| Draft status | `var(--color-text-muted)` + `var(--color-bg-subtle)` |
| DNA high bar | `var(--dna-bar-high)` |
| DNA mid bar | `var(--dna-bar-mid)` |
| DNA no-data bar | `var(--color-bg-subtle)` |
| Weakest pillar flag | `var(--color-text-muted)` with `*` asterisk marker |
| Attention badge | `var(--color-text-primary)` text + `var(--color-bg-subtle)` bg |
| Streaming cursor | `var(--streaming-cursor)` |
| Thinking dots | `var(--thinking-dot)` |

---

### Rules for this screen

1. Brand cards are a grid — not a table, not a list. 3 columns on desktop.
2. DNA score is the most important number on the card — `var(--font-size-xl)` Geist Mono.
3. The weakest pillar score is visually flagged on every card — `var(--color-text-muted)` with a `*` asterisk marker (+ a `* weakest pillar` footnote) — operators must spot problems at a glance. (No amber fill; keep the card calm/monochrome.)
4. Filter + sort controls are always visible above the grid — never hidden behind a menu.
5. `[Analyse]` on a card triggers the Mastra workflow inline — the card updates in place, no navigation.
6. The right panel shows portfolio-level health, not the selected brand's detail. Brand detail lives at `/app/brand/[id]`.
7. `[View]` always navigates to the brand detail page. Card click also navigates.
8. `+ Add brand` button appears in two places: workspace header (always) and right panel empty state (contextual).
9. Status `analysing` uses an animated pulsing dot — not a spinner — to match the streaming design language.
10. Brand cards are image-first — the brand cover image at 16:9 is the primary visual anchor. `--image-radius` top corners, `object-fit: cover`. Source editorial fashion photography from `/app/design/images/`.
11. Status chip (`active`, `draft`, `analysing`) sits in the top-right corner of the image — not only below the image.

---

### Output format

Full-page HTML prototype:
- All 5 states as toggle-able views
- Filter/sort controls functional (filter by status, sort by DNA)
- Card hover + click interaction (click navigates to brand detail — use `#` as href)
- Analyse button triggers in-place state update on the card (analysing → populated)
- Mobile at `max-width: 1024px`: right panel hidden, 2-column grid, `[Portfolio]` button opens Sheet
