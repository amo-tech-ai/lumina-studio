# Claude Design Prompt — Shoot Wizard (`/app/shoots/new`)

**Screen:** Shoot Wizard — multi-step flow to plan a new photo shoot with AI assistance.
**Route:** `/app/shoots/new`
**Agent:** `production-planner`

Paste after the universal prompt from `prompts/00-universal.md`.

---

## Prompt (copy everything below this line)

---

Design the **Shoot Wizard** screen (`/app/shoots/new`) for iPix / FashionOS.

### Layout

The wizard uses the standard 3-panel shell but the center workspace is full-focus — no distractions.

```
grid-template-columns: auto  minmax(0, 1fr)  auto
                        ↑          ↑              ↑
                    NavSidebar  Workspace   IntelligencePanel
```

Active nav item: Shoots (Camera icon).
Workspace header: `New Shoot` breadcrumb `Shoots › New Shoot` — `var(--font-size-sm)` `var(--color-text-muted)` + `[Save draft]` ghost button top-right + `[Cancel]` ghost button.

---

### NavSidebar — Left panel

Identical to other screens. Shoots nav item highlighted. Brand switcher available (wizard is brand-scoped). Active state is a calm thin-grey: `--nav-item-active` light-grey fill + `--nav-item-active-text` charcoal label + charcoal icon. No orange, no heavy highlight.

---

### Workspace — Center panel

**Step progress bar** (top of workspace, below header):

Horizontal step track — 4 steps:
```
① Basics  ──  ② Brief  ──  ③ Shot List  ──  ④ Review
```
- Completed step: `#000000` filled circle, label `var(--color-text-primary)` `var(--font-weight-medium)`
- Active step: `#000000` outline circle, label `var(--color-text-primary)` `var(--font-weight-semibold)`
- Upcoming step: `var(--color-bg-subtle)` circle, label `var(--color-text-muted)`
- Connector line: 1px `var(--color-border-subtle)`, turns `var(--color-text-primary)` when step completes

**Step 1 — Basics** (active state):

Form fields, each full-width, stacked:

```
Shoot name
[Spring Lookbook 2026              ]

Brand
[Nike                            ▾ ]  ← <Select>

Date
[Feb 3, 2026                     📅]  ← date input

Location
[Studio A, Toronto                 ]

Estimated shots
[12                                ]  ← number input
```

Field style: label `var(--font-size-sm)` `var(--font-weight-medium)` `var(--color-text-primary)` above input. Input: `var(--color-bg-card)` bg, 1px `var(--color-border)`, `var(--card-radius)`, 12px padding, `var(--font-size-sm)`. Focus: `var(--color-border-focus)` = `#000000`, 2px ring.

**AI suggestion card** (below form fields, inline):
- `var(--color-bg-subtle)` bg, 1px `var(--color-border)`, `var(--card-radius)`
- Lucide `Sparkles` 14px `var(--color-text-primary)` + `Based on Nike's Spring campaign — I suggest: Feb 3, Studio A, 12 shots.` `var(--font-size-sm)` `var(--color-text-secondary)`
- `[Apply suggestion]` ghost sm Button `var(--color-text-primary)` text

**Step navigation** (bottom of workspace, always visible):
- Left: `[← Back]` ghost Button (disabled on step 1)
- Right: `[Next →]` primary Button `var(--color-text-primary)` bg

---

**Step 2 — Brief:**

**Agent brief card** (AI-drafted, shown as ApprovalCard):

```
┌──────────────────────────────────────────────────────────┐
│ ● AI-drafted shoot brief              87% confidence      │
├────────────────────────┬─────────────────────────────────┤
│ Before                 │ After (AI draft)                 │
│ No brief               │ Objective: Showcase Spring 2026  │
│                        │ colourway with athlete lifestyle  │
│                        │ + studio hero shots.             │
│                        │                                  │
│                        │ Tone: Dynamic, aspirational,     │
│                        │ product-forward.                 │
│                        │ References: Spring 2025 (92%)    │
├────────────────────────┴─────────────────────────────────┤
│ Based on Nike DNA + Spring campaign                       │
│                                                          │
│  [Approve brief]   [Edit brief]   [Discard]              │
└──────────────────────────────────────────────────────────┘
```

Required elements: amber status dot + title, before/after diff (two columns), confidence %, evidence source, `[Approve brief]` (black fill) + `[Edit brief]` (outline) + `[Discard]` (ghost).

Below the card: `Or write your own brief` link → collapses card, shows textarea.

Textarea (if editing): full-width, 8 rows, same input style as step 1. `[Regenerate brief]` ghost link `var(--color-text-primary)` below.

---

**Step 3 — Shot List:**

**Agent-generated shot list** (ApprovalCard variant):

```
┌──────────────────────────────────────────────────────────┐
│ ● AI-drafted shot list (12 shots)    91% confidence       │
├────────────────────────┬─────────────────────────────────┤
│ Before                 │ After (AI draft)                 │
│ No shot list           │ 1. Hero — white bg, product      │
│                        │ 2. Detail — sole construction    │
│                        │ 3. Lifestyle — park, athlete     │
│                        │ 4. Collab — athlete ambassador   │
│                        │ … +8 more                        │
├────────────────────────┴─────────────────────────────────┤
│ Based on Spring campaign brief + DNA                      │
│                                                          │
│  [Approve list]   [Edit shots]   [Discard]               │
└──────────────────────────────────────────────────────────┘
```

Required elements: amber status dot + title, before/after diff (two columns), confidence %, evidence source, `[Approve list]` (black fill) + `[Edit shots]` (outline) + `[Discard]` (ghost).

If approved: list expands in-place showing all 12 shots as editable rows:
```
1. [ Hero — white bg, product centre              ] [×]
2. [ Detail — sole construction                   ] [×]
…
[+ Add shot]
```

Each row: text input, delete icon `×` ghost. `[+ Add shot]` ghost button at bottom.

---

**Step 4 — Review:**

Full summary card (read-only):

```
┌──────────────────────────────────────────────────────────┐
│  Spring Lookbook 2026                        active-draft │
│  Nike · Feb 3, 2026 · Studio A, Toronto · 12 shots       │
├──────────────────────────────────────────────────────────┤
│  Brief                                                   │
│  Showcase Spring 2026 colourway with athlete lifestyle… │
├──────────────────────────────────────────────────────────┤
│  Shot List (12)                                          │
│  1. Hero · 2. Detail · 3. Lifestyle … +9 more            │
├──────────────────────────────────────────────────────────┤
│  AI confidence: 89% · Evidence: campaign brief + DNA     │
└──────────────────────────────────────────────────────────┘
```

Bottom nav: `[← Back]` ghost + `[Save shoot]` primary black Button (`var(--color-text-primary)` bg, large, full-width).

After save: success toast + redirect to `/app/shoots` with new card highlighted.

---

### IntelligencePanel — Right panel

Context assistance while the wizard is active. Always white.

**Panel header:**
- `Production Planner` — `var(--font-size-base)` `var(--font-weight-semibold)`
- Agent status: `thinking` or `ready`

**Brand context section:**

Label "Active Brand" `var(--font-size-xs)` uppercase muted.
Nike DNA summary (compact):
```
DNA  87    ████████░
Visual 72  ██████░░░  ← weakest
```

Divider.

**Suggestions section** (updates per step):

Step 1: `Based on Nike's campaign calendar, Feb 3 is optimal — avoids the Mar 15 campaign conflict.`

Step 2: `For Nike's Spring campaign, lifestyle + hero split is 70/30. Current draft is 58% lifestyle — consider adding 1–2 more hero shots.`

Step 3: `Shot #3 (park setting) has 95% DNA match. Shot #8 (indoor café) has 61% — may dilute brand consistency.`

Step 4: `This shoot scores 89% DNA alignment. Previous Nike shoots average 87%.`

Each suggestion: Lucide `Sparkles` 14px `var(--color-text-primary)` + text `var(--font-size-sm)` `var(--color-text-secondary)`. `var(--color-bg-subtle)` bg card, `var(--card-radius)`.

Divider.

**Reference shoots:**

Label "Past Nike Shoots" `var(--font-size-xs)` uppercase muted.
2 compact rows with shoot thumbnails — **4:3 aspect ratio**, `--image-radius-sm`, `object-fit: cover`:
- `Spring 2025 Lookbook` — 91% DNA · 10 shots
- `Winter Campaign` — 88% DNA · 8 shots

Each: `var(--font-size-xs)` `var(--color-text-secondary)`. Link `var(--color-text-primary)` → `/app/shoots/[id]`.

---

### Generate all 5 states

**State 1 — Step 1 (Basics), empty form** (wizard just opened):
As described above. AI suggestion card visible.

**State 2 — Step 3 (Shot List), AI streaming:**
Agent is generating the shot list live — show `var(--streaming-cursor)` animated cursor inside the ApprovalCard body. Agent status in right panel: `thinking` (3 pulsing dots `var(--thinking-dot)`). Shot items appear one at a time.

**State 3 — Step 4 (Review), all approved:**
Review summary card fully populated. `[Save shoot]` Button active.

**State 4 — Loading** (pre-filled wizard from AI quick-plan):
Skeleton for all form fields (full-width, 36px each). Skeleton for ApprovalCard (120px). Step progress shows step 1 active.

**State 5 — Error** (save failed):
After clicking `[Save shoot]`, inline error banner below summary card: Lucide `AlertCircle` 16px red `var(--color-error)` + `Couldn't save the shoot. Try again.` + `[Retry]` ghost Button. Form data preserved.

---

### Design tokens

| Element | Token |
|---|---|
| Page bg | `var(--color-bg-page)` |
| Form input bg | `var(--color-bg-card)` |
| Form input border | `var(--color-border)` |
| Form focus ring | `var(--color-border-focus)` = `#000000` |
| Step active | `--color-action` (black) outline circle |
| Step complete | `--color-action` (black) filled circle |
| Step connector active | `--color-action` (black) |
| Step upcoming | `var(--color-bg-subtle)` |
| Nav active fill | `--nav-item-active` |
| Nav active text | `--nav-item-active-text` |
| AI suggestion bg | `var(--color-bg-subtle)` |
| HITL card border | `var(--approval-border)` (amber 1px) |
| HITL card bg | `var(--approval-bg)` (white) |
| HITL approved border | `var(--approval-border-done)` (green) |
| Shoot thumbnail | 4:3, `--image-radius-sm`, `object-fit: cover` |
| Streaming cursor | `var(--streaming-cursor)` |
| Thinking dots | `var(--thinking-dot)` |
| Error | `var(--color-error)` |

---

### Rules for this screen

1. 4 steps only. Never collapse into fewer steps — each step has a distinct decision the operator must make.
2. AI drafts (brief, shot list) always appear as ApprovalCards — never auto-populated into form fields.
3. The step progress bar is always visible — operators need spatial orientation in a multi-step flow.
4. `[Save draft]` in the header saves partial progress without completing the wizard — always available from step 2 onward.
5. Right panel suggestions update per step — they are contextual, not static.
6. Shot list editing (step 3) must support both approve-as-is and edit-inline — never force full manual entry.
7. Form fields use standard focus rings (`var(--color-border-focus)`) — no custom focus styles.
8. After save, redirect to shoots list with the new shoot card highlighted (dark left border, `var(--color-text-primary)`) for 3s then fade.
9. If wizard was opened from a quick-plan HITL card, pre-fill all fields and start at step 4 (Review).

---

### Output format

Full-page HTML prototype:
- 4 steps as toggle-able views (step selector at top)
- Step progress bar updates as steps change
- Step 1: AI suggestion [Apply] fills the form fields
- Step 2: [Approve brief] collapses the ApprovalCard and shows editable summary
- Step 3: [Approve list] expands to editable shot rows
- Step 4: [Save shoot] shows success state
- Mobile at `max-width: 1024px`: right panel hidden, full-width wizard steps, step progress bar scrolls horizontally
