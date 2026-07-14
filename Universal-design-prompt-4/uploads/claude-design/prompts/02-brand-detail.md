# Claude Design Prompt — Brand Detail (`/app/brand/[id]`)

**Screen:** Brand Detail — deep view of one brand's DNA, assets, and approval queue.
**Route:** `/app/brand/[id]`
**Agent:** `brand-intelligence`

Paste after the universal prompt from `prompts/00-universal.md`. Upload `03-brand-detail.md` wireframe and any brand hub screenshots.

---

## Prompt (copy everything below this line)

---

Design the **Brand Detail** screen (`/app/brand/[id]`) for iPix / FashionOS.

### Layout

Same 3-panel shell as all operator screens:

```
grid-template-columns: auto  minmax(0, 1fr)  auto
                        ↑          ↑              ↑
                    NavSidebar  Workspace   IntelligencePanel
```

Active nav item: Brands (Layers icon, `var(--nav-item-active-text)` orange).
Breadcrumb in workspace header: `Brands › Nike` — `var(--font-size-sm)` `var(--color-text-muted)`.

---

### NavSidebar — Left panel

Identical to dashboard. Nike active (`●`), badge `[3]`, other brands listed. Brands nav item highlighted.

---

### Workspace — Center panel

**Agent greeting card** (top, same pattern as dashboard — structured card, not a bare bubble):
- `Nike DNA: 87. Strongest: Voice (94). Weakest: Visual (72). Want me to draft improvements?`
- `var(--font-size-sm)` `var(--color-text-secondary)`, `var(--color-bg-subtle)` bg, 1px `var(--color-border)`, `var(--card-radius)`

**Quick-action chips** (horizontal row below greeting):
1. `Improve Visual score`
2. `Plan a shoot`
3. `Review assets`

Chips: `<Button variant="outline" size="sm">` — white bg, `var(--color-border)`, `var(--font-size-sm)`.

**HITL card — DNA draft** (inline in workspace, below chips, not in the right panel):

This is the primary write gate. An `ApprovalCard` rendered by `useInterrupt`:

```
┌──────────────────────────────────────────────────────────┐
│ ⚠  Brand DNA Draft — Visual Identity improvements         │
├───────────────────────┬──────────────────────────────────┤
│ Before                │ After                            │
│ Photography style:    │ Photography style:               │
│ studio-centric,       │ dynamic mixed-context —          │
│ product-focused       │ studio + lifestyle + athlete     │
├───────────────────────┴──────────────────────────────────┤
│ 87% confidence · Based on 47 crawled pages + asset audit │
│                                                          │
│ [Approve]   [Edit]   [Discard]                           │
└──────────────────────────────────────────────────────────┘
```

Token spec:
- Border: 1.5px `var(--approval-border)` (#F3B93C)
- Background: `var(--approval-bg)` (#FFFBF0)
- Radius: `var(--card-radius)` = 0.625rem
- Warning icon: Lucide `AlertTriangle` 14px, amber
- Before/After: two columns, `var(--font-size-sm)`, label in `var(--color-text-muted)` `var(--font-size-xs)` uppercase
- Confidence: `var(--ai-confidence-high)` (#059669) for ≥80%
- Evidence: `var(--color-text-muted)` `var(--font-size-xs)`
- Approve: `<Button variant="default" size="sm">` — orange
- Edit: `<Button variant="outline" size="sm">` — white + border
- Discard: `<Button variant="ghost" size="sm">` — no bg, muted text

**On approve:** card transitions border → `var(--approval-done-border)` (#059669), bg → `var(--approval-done-bg)` (#D1FAE5), then fades out after 1s.

**Conversation area** (below HITL card): empty until operator asks a question. Agent responses render as cards here.

**Chat input** (pinned bottom): same as dashboard — full-width input, mic + send icons.

---

### IntelligencePanel — Right panel

Always white. 320px. 1px left border `var(--intel-border)`.

**Panel header:**
- `Nike` — `var(--font-size-base)` `var(--font-weight-semibold)`
- Dropdown chevron
- Status chip: `active` — green text `var(--status-active-text)`, green bg `var(--status-active-bg)`, `var(--font-size-xs)`, pill

**DNA Score section:**

Score: `87` in `var(--font-size-display)` (32px) `var(--font-weight-bold)`. Label "DNA Score" right-aligned `var(--font-size-xs)` `var(--color-text-muted)`.

Overall bar: 87% `var(--color-dna-high)`, 6px, full radius.

4-pillar breakdown (Brand, Visual, Voice, Commerce):
```
Brand     ████████░  88   → --dna-bar-high
Visual    ██████░░░  72   → --dna-bar-mid  (weakest, highlight)
Voice     █████████  94   → --dna-bar-high
Commerce  ███████░░  79   → --dna-bar-mid
```
Visual row: add a subtle amber dot `var(--color-warning)` before label to flag weakest pillar.

Each row: label `var(--font-size-sm)` `var(--color-text-secondary)` | bar | score `var(--font-size-sm)` `var(--font-weight-medium)` Geist Mono.

Divider `var(--color-border-subtle)`.

**Profile section:**

Label "Profile" `var(--font-size-xs)` `var(--color-text-muted)` uppercase.
Body: 2-line truncated brand voice excerpt. `var(--font-size-sm)` `var(--color-text-secondary)`.
`Read more` ghost link `var(--color-accent)` `var(--font-size-xs)`.

Divider.

**Assets section:**

Label "Assets (12)" left, `[→]` icon-link right (navigates to assets tab).
4-wide thumbnail grid (2 rows × 4 cols), 40px squares, `var(--card-radius)` radius, `var(--color-bg-subtle)` placeholder bg.
Each thumbnail: small DNA match chip overlaid bottom-right (green/amber/red based on score).

Divider.

**Approvals section:**

Label "Approvals" left, amber badge `[3]` right (`var(--color-warning)` bg, white text).
Single summary row: `⚠ 3 pending reviews` `var(--font-size-sm)` `var(--color-warning-text)`.
`[Review →]` link `var(--color-accent)` `var(--font-size-sm)` — scrolls to Approvals tab.

**Panel tabs** (bottom, sticky):
`Overview | Assets | Approvals | History` — `<Tabs>` from `ui/tabs.tsx`. Active: orange underline + text.

---

### Generate all 5 states

**State 1 — Populated** (as above, Nike loaded, 3 approvals, DNA draft visible)

**State 2 — No DNA data yet** (brand exists but intelligence hasn't run):
- Right panel: DNA section replaced with: Lucide `Zap` icon (24px muted) + `Run Brand Intelligence` subtitle + `[Analyse brand]` primary button (orange)
- Center workspace: Agent greeting: `Nike is set up but hasn't been analysed yet. I can crawl nike.com and build the DNA profile — takes about 2 minutes.` + `[Start analysis]` chip
- No HITL card (nothing pending)

**State 3 — Analysis in progress** (Mastra workflow running):
- Right panel DNA section: animated progress bar (indeterminate, orange) + `Analysing… 31 of 47 pages` `var(--font-size-xs)` `var(--color-text-muted)` Geist Mono
- Center workspace: streaming progress card — `Crawling nike.com…` with live text updates (use `var(--streaming-cursor)` animated cursor). Agent state: `thinking` (3 pulsing dots `var(--thinking-dot)`).
- No HITL card until analysis completes

**State 4 — Loading** (page first load):
- Right panel: `<Skeleton>` for score number (48×32px), 4 skeleton bars (100%×6px each), 2 skeleton text lines for profile, 8 skeleton thumbnail squares
- Center workspace: 2 skeleton lines for greeting, 3 skeleton chips

**State 5 — Error** (brand fetch failed):
- Right panel: Lucide `WifiOff` (24px muted) + `Brand unavailable` + `[Try again]` ghost button
- Center workspace: Agent still operable. Greeting: `I can't load Nike's data right now, but you can still ask me questions.`

---

### Design tokens

| Element | Token |
|---|---|
| Page bg | `var(--color-bg-page)` |
| Right panel bg | `var(--intel-bg)` = white always |
| HITL card border | `var(--approval-border)` |
| HITL card bg | `var(--approval-bg)` |
| HITL approved border | `var(--approval-done-border)` |
| HITL approved bg | `var(--approval-done-bg)` |
| DNA high (≥80) | `var(--dna-bar-high)` |
| DNA mid (60–79) | `var(--dna-bar-mid)` |
| DNA low (<60) | `var(--dna-bar-low)` |
| Weakest pillar dot | `var(--color-warning)` |
| Confidence high | `var(--ai-confidence-high)` |
| Confidence mid | `var(--ai-confidence-mid)` |
| Evidence text | `var(--color-text-muted)` |
| Streaming cursor | `var(--streaming-cursor)` |
| Thinking dots | `var(--thinking-dot)` |

---

### Rules for this screen

1. The HITL DNA draft card lives in the **center workspace**, not the right panel. It's inline in the conversation flow.
2. Before/after diff is always two columns — never a single paragraph of new text.
3. Confidence and evidence source are required on every ApprovalCard. No exceptions.
4. The weakest DNA pillar is visually flagged (amber dot) — make it obvious at a glance.
5. During analysis-in-progress, show actual progress text (pages crawled), not a spinner.
6. Assets in the right panel are thumbnails only — clicking opens in center workspace or navigates to assets tab.
7. Discard action on the HITL card uses ghost/muted styling — it's destructive but not alarming.
8. Profile text in the right panel is read-only. Editing only happens via AI draft + ApprovalCard in center.
9. `var(--font-size-display)` (32px Geist Mono) for the DNA score number — largest element in the right panel.

---

### Output format

Full-page HTML prototype:
- All 5 states as toggle-able views
- HITL card approve transition animated (border + bg color change → fade out)
- DNA bars animate in on load (width 0 → final %, `var(--duration-normal)` 250ms, `var(--ease-default)`)
- Right panel tabs functional (click switches panel content)
- Mobile at `max-width: 1024px`: right panel collapses, `[Brand Details]` button at bottom of workspace slides up a Sheet (`ui/sheet.tsx`) with the right panel content
