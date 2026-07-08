# Claude Design Prompt — Matching (`/app/matching`)

**Screen:** Matching — discover and evaluate brand ↔ creator / product ↔ asset DNA alignment.
**Route:** `/app/matching`
**Agent:** `social-discovery`

Paste after the universal prompt from `prompts/00-universal.md`.

---

## Prompt (copy everything below this line)

---

Design the **Matching** screen (`/app/matching`) for iPix / FashionOS.

### Layout

Standard 3-panel shell:

```
grid-template-columns: auto  minmax(0, 1fr)  auto
                        ↑          ↑              ↑
                    NavSidebar  Workspace   IntelligencePanel
```

Active nav item: Matching (Lucide `Shuffle` or `Link2` icon, `var(--color-text-primary)`).
Workspace header: `Matching › Nike` — breadcrumb + `[Run new match]` primary Button top-right.

---

### NavSidebar — Left panel

Identical to other screens. Matching nav item highlighted. Active state is a calm thin-grey: `--nav-item-active` light-grey fill + `--nav-item-active-text` charcoal label + charcoal icon. No orange, no heavy highlight.

---

### Workspace — Center panel

**Agent greeting card:**
- `I found 12 creators with ≥85% DNA alignment to Nike. Top match: @runwithkara — 94%. Want me to prepare an outreach brief?`
- `var(--color-bg-subtle)` bg, 1px `var(--color-border)`, `var(--card-radius)`, `var(--font-size-sm)`

**Quick-action chips:**
1. `View top 10 matches`
2. `Run new match`
3. `Export shortlist`

**Match type tabs** (horizontal, below chips):

`Creator Matches | Asset Matches | Product Matches`

Using `<Tabs>` from `ui/tabs.tsx`. Active: black underline + text (`var(--color-text-primary)`).

---

#### Tab: Creator Matches (default active)

**Filter bar:**
- DNA score minimum `<Select>`: ≥90 · ≥80 · ≥70 · Any
- Audience size `<Select>`: Nano · Micro · Mid · Macro · Mega
- Platform `<Select>`: All · IG · TikTok · YouTube · Pinterest

**Match card list** (full-width rows, stacked):

Each match is a `<Card>`. Height ~80px.

```
┌─────────────────────────────────────────────────────────────────┐
│  👤  @runwithkara            94%  ████████░   Nike DNA          │
│      Micro · 42K IG · Running, Athlete lifestyle               │
│      "Authentic performance content, strong brand tone match"   │
│                               [View profile]  [Add to brief]   │
└─────────────────────────────────────────────────────────────────┘
```

Card anatomy:
- Left: avatar circle (48px, fashion photography crop or model portrait, `object-fit: cover`, border-radius 50%. Fall back: `var(--color-bg-subtle)` + Lucide `User` icon) + handle `var(--font-size-base)` `var(--font-weight-semibold)` + match % `var(--font-size-base)` Geist Mono right-aligned
- DNA bar: full-width 6px below name row, `var(--dna-bar-high)` filled, `var(--color-bg-subtle)` track
- Second row: tier · follower count Geist Mono · content tags `var(--font-size-sm)` `var(--color-text-secondary)`
- Third row: AI rationale excerpt `var(--font-size-xs)` `var(--color-text-muted)` italic, truncated 1 line
- Right: `[View profile]` outline sm + `[Add to brief]` ghost sm

Match % colour:
- ≥90 → `var(--dna-bar-high)` green
- 80–89 → `var(--dna-bar-mid)` amber
- <80 → `var(--dna-bar-low)` red

Selected card: 2px left border `var(--color-text-primary)`, `var(--color-bg-subtle)` bg.

**Show 5 creators:**
1. `@runwithkara` — 94%, Micro, 42K IG, Running/Athlete lifestyle
2. `@the_daily_athlete` — 91%, Micro, 78K IG+TT, Performance gear
3. `@nikestylegram` (organic fan) — 88%, Macro, 210K IG, Streetwear
4. `@fuelledbymovement` — 82%, Nano, 18K IG, Wellness/Running
5. `@kickscollector99` — 74%, Micro, 55K IG, Sneaker culture

---

#### Tab: Asset Matches

Grid of asset pairs — show how brand assets match against products or campaigns.

Each row:
```
[asset thumb]  →  [product thumb]   88%  ████████░
Spring Lookbook, Shot 3        Air Max 2026 Collab
```

Simplified version — 4 rows, compact format. Same token usage as creator matches.

---

#### Tab: Product Matches

Table format — products matched to assets with DNA scores.

Columns: Product name | Top matching asset | DNA % | `[View]` action.
4 rows shown. `var(--font-size-sm)` throughout. Alternating row bg: `var(--color-bg-card)` / `var(--color-bg-subtle)`.

---

**AI Chat Dock** (pinned to bottom of center workspace — always present):
- Context-aware greeting: names active match type, brand, and next action — e.g. "I matched 1,200 creators against Nike DNA. @runwithkara scores 94% — want me to add her to the outreach brief?" Never "How can I help?".
- Quick-action chips (3–5): thin grey, context-specific, minimal line icons.
- Streaming status: live steps — green check = done, pulsing dot = active, faint dot = pending. Never a spinner.
- Input: full-width "Ask about this match…" placeholder, mic icon left, black send button right.
- Style: white bg, 1px `var(--color-border)` top border, Inter, black actions. No orange, no gradients.

---

### IntelligencePanel — Right panel

Loaded with selected creator match. Always white. 320px.

**Panel header:**
- `@runwithkara` — `var(--font-size-base)` `var(--font-weight-semibold)`
- Close `×` icon right

**Match score section:**

Score: `94` `var(--font-size-display)` Geist Mono `var(--font-weight-bold)` `var(--dna-bar-high)` color. Label "DNA Match" muted.

Full-width bar: 94%, 6px, `var(--dna-bar-high)`.

Pillar breakdown:
```
Brand tone    ████████░  95   --dna-bar-high
Visual style  █████████  97   --dna-bar-high
Audience fit  ████████░  89   --dna-bar-high
Content style ███████░░  81   --dna-bar-high
```

Divider.

**Creator profile:**
```
Handle     @runwithkara
Platform   Instagram
Tier       Micro
Followers  42K
Niche      Running · Athlete lifestyle
Avg eng.   4.2%
```
`var(--font-size-xs)` label `var(--color-text-muted)` + `var(--font-size-sm)` value.

Divider.

**AI rationale:**

Label "Why this match" `var(--font-size-xs)` uppercase muted + Lucide `Sparkles` 12px `var(--color-text-primary)`.
`Kara's aesthetic centres performance + authentic athlete lifestyle — identical to Nike's brand tone pillar (95%). Her audience skews 25–34 active professionals, matching Nike's core segment.` `var(--font-size-sm)` `var(--color-text-secondary)`.

Divider.

**Actions:**
- `[Add to outreach brief]` — `<Button variant="default" size="sm">` full-width `var(--color-text-primary)` bg
- `[View full profile]` — `<Button variant="outline" size="sm">` full-width

**Panel tabs** (sticky bottom):
`Profile | Match Detail | Past Collabs` — `<Tabs>`. Active: black underline (`var(--color-text-primary)`).

---

### Generate all 5 states

**State 1 — Populated, creator tab, @runwithkara selected** (as above)

**State 2 — Empty** (no match results for this filter):
- Center: realistic quietly-faded mockup of 3 populated match rows using editorial fashion photography creator portraits (3:4 ratio, slightly desaturated). Below the preview: Agent: `No creators match ≥90% DNA for Nike yet. I can lower the threshold or expand to new platforms.` + `[Adjust threshold]` ghost Button + `[Run broad match]` black `default` Button.
- Right panel: Lucide `Users` 32px muted + `Run a match to see results here` + `[Run new match]` Button

**State 3 — Loading:**
- Center: skeleton greeting + skeleton filter bar + skeleton tab bar + 5 skeleton match rows (80px each, shimmer)
- Right panel: skeleton avatar (40px circle) + skeleton score (32px) + 4 skeleton bars

**State 4 — Matching in progress** (agent running match):
- Center: streaming progress card: `Scanning 1,200 creator profiles against Nike DNA…` with animated cursor. Progress: `847 / 1,200 profiles` Geist Mono. Agent thinking dots.
- Match card list hidden until complete.

**State 5 — HITL: AI recommends a shortlist:**
After match completes, agent inserts ApprovalCard in center workspace:

```
┌──────────────────────────────────────────────────────────┐
│ ⚠  Match Shortlist — Nike (Top 3)                         │
│                                                          │
│  @runwithkara      94%  Micro  42K IG                    │
│  @the_daily_athlete 91%  Micro  78K IG+TT                │
│  @nikestylegram     88%  Macro  210K IG                  │
│                                                          │
│  Recommended for Spring Lookbook outreach brief          │
│  91% avg confidence · Based on Nike DNA + campaign brief │
│                                                          │
│  [Approve shortlist]   [Adjust]   [See all matches]       │
└──────────────────────────────────────────────────────────┘
```

---

### Design tokens

| Element | Token |
|---|---|
| Page bg | `var(--color-bg-page)` |
| Match card bg | `var(--color-bg-card)` |
| Match card border | `var(--color-border)` |
| Selected card bg | `var(--color-bg-subtle)` |
| Selected card border | `var(--color-text-primary)` 2px left |
| DNA match ≥90 | `var(--dna-bar-high)` |
| DNA match 80–89 | `var(--dna-bar-mid)` |
| DNA match <80 | `var(--dna-bar-low)` |
| Creator portrait | 3:4 aspect ratio, `--image-radius-sm`, `object-fit: cover` |
| Nav active fill | `--nav-item-active` |
| Nav active text | `--nav-item-active-text` |
| HITL card border | `var(--approval-border)` (amber 1px) |
| HITL card bg | `var(--approval-bg)` (white) |
| Streaming cursor | `var(--streaming-cursor)` |
| Thinking dots | `var(--thinking-dot)` |

---

### Rules for this screen

1. Match cards are full-width rows — not a grid. DNA % is right-aligned and always visible without clicking.
2. The DNA bar on each match card uses the same color thresholds as asset/brand DNA bars — consistent visual language.
3. AI rationale is always visible on the card (truncated, 1 line) — operators should not need to open the right panel to see why.
4. The right panel loads on card click in non-select mode. It shows detailed match breakdown, not just a repeat of the card data.
5. Three match types (Creator / Asset / Product) are tabs — not separate routes. Switching tabs does not reset filters.
6. `[Add to outreach brief]` in the right panel is the primary action — it saves the creator to a brief (implementation out of scope — link to `#`).
7. During match-in-progress (state 4), show actual scan progress (profiles scanned count) — never a spinner.
8. The HITL shortlist card must show the top 3 with all key data inline — not a list of names only.
9. Follower counts use Geist Mono. DNA percentages use Geist Mono. Names use Geist Sans.

---

### Output format

Full-page HTML prototype:
- All 5 states as toggle-able views
- Tab switching functional (Creator / Asset / Product)
- Click match card → loads right panel detail
- Filter dropdowns filter the list
- State 4 streaming: scan counter increments every 300ms via JS interval
- Panel tabs functional
- Mobile at `max-width: 1024px`: right panel hidden, card tap opens Sheet from bottom
