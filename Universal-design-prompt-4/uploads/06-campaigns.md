# Claude Design Prompt — Campaigns (`/app/campaigns`)

**Screen:** Campaigns — view and manage all marketing campaigns for the active brand.
**Route:** `/app/campaigns`
**Agent:** `creative-director`

Paste after the universal prompt from `prompts/00-universal.md`.

---

## Prompt (copy everything below this line)

---

Design the **Campaigns** screen (`/app/campaigns`) for iPix / FashionOS.

### Layout

Standard 3-panel shell:

```
grid-template-columns: auto  minmax(0, 1fr)  auto
                        ↑          ↑              ↑
                    NavSidebar  Workspace   IntelligencePanel
```

Active nav item: Campaigns (Megaphone icon, `var(--color-text-primary)`).
Workspace header: `Campaigns › Nike` — breadcrumb `var(--font-size-sm)` `var(--color-text-muted)` + `[+ New campaign]` primary Button top-right.

---

### NavSidebar — Left panel

Identical to other screens. Nike active (`●`), badge `[3]`, Campaigns nav item highlighted. Active state is a calm thin-grey: `--nav-item-active` light-grey fill + `--nav-item-active-text` charcoal label + charcoal icon. No orange, no heavy highlight.

---

### Workspace — Center panel

**Agent greeting card:**
- `Nike has 2 active campaigns. Spring Lookbook deliverables are due in 12 days — 3 assets still need approval.`
- `var(--color-bg-subtle)` bg, 1px `var(--color-border)`, `var(--card-radius)`, `var(--font-size-sm)`

**Quick-action chips:**
1. `Review Spring deliverables`
2. `Plan Summer campaign`
3. `Generate IG assets`

**Filter bar:**
- Status filter `<Select>`: All · Active · Planning · Complete · Archived
- Date range: `<input type="month">` start + end (Geist Mono)
- Brand filter `<Select>` (for multi-brand operators)

**Campaign card list** (full-width rows, stacked):

Each campaign is a `<Card>`.

```
┌────────────────────────────────────────────────────────────────┐
│  ███████████████████████████████████████████████████████████  │  ← 72px campaign hero image
│  ███████████  [CAMPAIGN HERO / EDITORIAL PHOTO]  ████████████  │     object-fit cover, full-width
│  ███████████████████████████████████████████████████████████  │
├────────────────────────────────────────────────────────────────┤
│  Spring Lookbook 2026                active   Jan 15 – Mar 31  │
│  3 shoots · 12 deliverables · 3 pending                        │
│  Nike                                          [View]  [Edit]  │
└────────────────────────────────────────────────────────────────┘
```

Card anatomy:
- Top: campaign cover image at **16:9 aspect ratio**, full-width, `object-fit: cover`, `--image-radius` top corners. Source editorial fashion photography from `/app/design/images/`. Neutral `--image-placeholder-bg` at exact 16:9 ratio if no image.
- Name row: campaign name `var(--font-size-base)` `var(--font-weight-semibold)` + status chip right + date range `var(--font-size-sm)` Geist Mono far right
- Second row: metadata `var(--font-size-sm)` `var(--color-text-secondary)` · approval badge if pending
- Third row: brand chip `var(--font-size-xs)` `var(--color-bg-subtle)` pill + action buttons right

Status chips:
- `active` → `var(--status-active-text)` + `var(--status-active-bg)` (green)
- `planning` → `var(--status-planning-text)` + `var(--status-planning-bg)` (amber)
- `complete` → `var(--status-complete-text)` + `var(--status-complete-bg)` (gray)
- `archived` → `var(--color-text-muted)` + `var(--color-bg-subtle)` (faint)

Pending approval badge: `⚠ 3 pending` `var(--color-text-primary)` text + `var(--color-bg-subtle)` bg, inline in second row.

Selected card: 2px left border `var(--color-text-primary)`, `var(--color-bg-subtle)` bg.

**Show 3 campaigns:**
1. `Spring Lookbook 2026` — active, Jan 15–Mar 31, 3 shoots, 12 deliverables, 3 pending
2. `Winter Basics` — complete, Nov 1–Dec 15, 2 shoots, 8 deliverables, 0 pending
3. `Summer Edit` — planning, Apr 1–Jun 30, 0 shoots yet, 0 deliverables

Card hover: `var(--color-bg-subtle)` overlay, cursor pointer.

**AI Chat Dock** (pinned to bottom of center workspace — always present):
- Context-aware greeting: names active campaign, brand, and next action — e.g. "You're viewing Nike campaigns. Spring Lookbook has 3 assets pending approval and is due in 12 days." Never "How can I help?".
- Quick-action chips (3–5): thin grey, context-specific, minimal line icons.
- Streaming status: live steps — green check = done, pulsing dot = active, faint dot = pending. Never a spinner.
- Input: full-width "Ask about this campaign…" placeholder, mic icon left, black send button right.
- Style: white bg, 1px `var(--color-border)` top border, Inter, black actions. No orange, no gradients.

---

### IntelligencePanel — Right panel

Loaded with selected campaign (Spring Lookbook). Always white. 320px.

**Panel header:**
- `Spring Lookbook 2026` — `var(--font-size-base)` `var(--font-weight-semibold)`
- Status chip: `active` green

**Campaign metadata grid:**
```
Brand      Nike
Status     active
Dates      Jan 15 – Mar 31, 2026
Shoots     3
Deliverables  12
Due in     12 days
```
Label: `var(--color-text-muted)` `var(--font-size-sm)`. Value: `var(--color-text-primary)` `var(--font-size-sm)` Geist Mono for dates/numbers.

Divider.

**Deliverables section:**

Label "Deliverables (12)" + `[→]` icon-link.

Progress bar: 9 of 12 complete — `var(--dna-bar-high)` filled, `var(--color-bg-subtle)` track, 6px. `9 / 12` right-aligned Geist Mono `var(--font-size-xs)`.

Platform breakdown (compact rows):
```
IG Post      4/4  ✓    --status-active-text
IG Story     2/4  ··   in progress
TikTok       1/2  ··   in progress
Amazon       2/2  ✓    --status-active-text
```
`var(--font-size-xs)` each row.

Divider.

**Pending approvals:**

Label "Needs Review" + dark badge `[3]`.
Single ApprovalCard summary: `⚠ 3 deliverables awaiting approval` + `[Review →]` `var(--color-text-primary)`.

Divider.

**AI brief summary:**

Label "Campaign Brief" `var(--font-size-xs)` uppercase muted.
2-line excerpt `var(--font-size-sm)` `var(--color-text-secondary)`. `Read more` ghost link `var(--color-text-primary)` `var(--font-size-xs)`.

**Panel tabs** (sticky bottom):
`Overview | Deliverables | Shoots | Brief` — `<Tabs>`. Active: black underline (`var(--color-text-primary)`).

---

### Generate all 5 states

**State 1 — Populated, Spring Lookbook selected** (as above)

**State 2 — Empty** (no campaigns for this brand):
- Center: realistic quietly-faded editorial fashion photography mockup of 2 populated campaign cards (slightly desaturated). Below the preview: Agent: `No campaigns yet. I can draft your first campaign brief based on Nike's DNA and seasonal calendar.` + `[Create campaign]` black `default` Button. Optional AI suggestion below CTA: `I can plan channels, shoot count, and deliverables in one pass.`
- Right panel: Lucide `Megaphone` 32px muted + `Plan your first campaign` + `[+ New campaign]` Button full-width

**State 3 — Loading:**
- Center: skeleton greeting (2 lines) + skeleton filter bar + 3 skeleton campaign rows (96px each, shimmer)
- Right panel: skeleton for name (1 line) + skeleton grid (4 rows × 2 cols) + skeleton progress bar

**State 4 — Error:**
- Center: `WifiOff` 32px muted + `Couldn't load campaigns` + `[Try again]` ghost Button
- Right panel: same error state

**State 5 — HITL: AI drafts a new campaign** (operator asked agent to plan a campaign):
Center workspace shows an ApprovalCard inline:

```
┌──────────────────────────────────────────────────────────┐
│ ⚠  New Campaign Draft — Summer Edit 2026                  │
│                                                          │
│  Dates:     Apr 1 – Jun 30, 2026                         │
│  Channels:  IG · TikTok · Amazon                         │
│  Shoots:    2 planned                                    │
│  Deliverables: 16 (IG 6 · TikTok 4 · Amazon 6)          │
│                                                          │
│  Brief: Warm-season colourway launch with lifestyle…     │
│                                                          │
│  85% confidence · Based on Spring brief + seasonal DNA   │
│                                                          │
│  [Approve & create]   [Customise]   [Discard]            │
└──────────────────────────────────────────────────────────┘
```

---

### Design tokens

| Element | Token |
|---|---|
| Page bg | `var(--color-bg-page)` |
| Campaign card bg | `var(--color-bg-card)` |
| Campaign card border | `var(--color-border)` |
| Selected card bg | `var(--color-bg-subtle)` |
| Selected card border | `var(--color-text-primary)` 2px left |
| Active status | `var(--status-active-text)` + `var(--status-active-bg)` |
| Planning status | `var(--color-text-muted)` + `var(--color-bg-subtle)` |
| Complete status | `var(--status-complete-text)` + `var(--status-complete-bg)` |
| Pending badge | `var(--color-text-primary)` + `var(--color-bg-subtle)` |
| Progress bar fill | `var(--dna-bar-high)` |
| Campaign cover image | 16:9, `--image-radius` top corners, `object-fit: cover` |
| Nav active fill | `--nav-item-active` |
| Nav active text | `--nav-item-active-text` |
| HITL card border | `var(--approval-border)` (amber 1px) |
| HITL card bg | `var(--approval-bg)` (white) |

---

### Rules for this screen

1. Campaign cards are horizontal full-width rows — not a grid. Date range is always visible without clicking.
2. Pending approval count is always shown inline on the card — operators must not miss outstanding reviews.
3. Deliverables progress uses a bar + fraction count — never just a percentage.
4. Platform breakdown in the right panel uses actual channel names (IG Post, TikTok, etc.) — not generic "channel 1".
5. The right panel shows the selected campaign's detail. Clicking a card loads its detail here — no navigation.
6. `[View]` on a card opens a full-page campaign detail (not yet designed — link to `#`). `[Edit]` opens inline editing.
7. The AI campaign draft HITL card must show channels and deliverable breakdown — not just a brief snippet.
8. Date range always uses Geist Mono — it is data, not prose.
9. Agent greeting must name the most urgent campaign (closest deadline with pending approvals).
10. Campaign cards are image-first — a 16:9 cover image leads each card, full-width with `--image-radius` top corners. Source editorial fashion photography from `/app/design/images/`.

---

### Output format

Full-page HTML prototype:
- All 5 states as toggle-able views
- Click on campaign card → loads that campaign in right panel
- Selected card highlight transitions smoothly (`var(--duration-fast)` 150ms)
- Deliverables progress bar animates in on right panel load
- Panel tabs functional (Overview / Deliverables / Shoots / Brief switch content)
- Mobile at `max-width: 1024px`: right panel hidden, card tap opens Sheet from bottom
