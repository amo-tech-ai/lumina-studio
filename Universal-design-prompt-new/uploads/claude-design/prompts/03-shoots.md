# Claude Design Prompt — Shoots List (`/app/shoots`)

**Screen:** Shoots List — view and manage all photo shoots for the active brand.
**Route:** `/app/shoots`
**Agent:** `production-planner`

Paste after the universal prompt from `prompts/00-universal.md`. Upload `05-shoots-list.md` wireframe and any shoot card screenshots.

---

## Prompt (copy everything below this line)

---

Design the **Shoots List** screen (`/app/shoots`) for iPix / FashionOS.

### Layout

Standard 3-panel shell:

```
grid-template-columns: auto  minmax(0, 1fr)  auto
                        ↑          ↑              ↑
                    NavSidebar  Workspace   IntelligencePanel
```

Active nav item: Shoots (Camera icon, `var(--nav-item-active-text)` orange).
Workspace header: `Shoots › Nike` breadcrumb `var(--font-size-sm)` `var(--color-text-muted)` + `[+ New shoot]` primary button top-right.

---

### NavSidebar — Left panel

Identical to other screens. Nike active (`●`), badge `[3]`, Shoots nav item highlighted.

---

### Workspace — Center panel

**Agent greeting card:**
- `Nike has 3 shoots this quarter. Next: Spring Lookbook — Feb 3, Studio A, 12 shots.`
- `var(--color-bg-subtle)` bg, 1px `var(--color-border)`, `var(--card-radius)`, `var(--font-size-sm)`

**Quick-action chips:**
1. `View shot list`
2. `Add a shoot`
3. `Review past shoots`

**Shoot card list** (scrollable, below chips):

Each shoot is a `<Card>` (extends `ui/card.tsx`). Layout: horizontal, full-width, 72px tall.

```
┌──────────────────────────────────────────────────────────────┐
│ 📸  Spring Lookbook              confirmed   Feb 3, 2026     │
│     Studio A · 12 shots                    [View] [Edit]    │
└──────────────────────────────────────────────────────────────┘
```

Card anatomy:
- Left: camera icon (Lucide `Camera`, 20px, `var(--color-text-muted)`) + shoot name `var(--font-size-base)` `var(--font-weight-medium)` + location · shot count `var(--font-size-sm)` `var(--color-text-secondary)`
- Right: status chip + date `var(--font-size-sm)` Geist Mono + action buttons
- Status chips using `<Badge>`:
  - `confirmed` → `var(--status-active-text)` + `var(--status-active-bg)` (green)
  - `draft` → `var(--status-planning-text)` + `var(--status-planning-bg)` (amber)
  - `complete` → `var(--status-complete-text)` + `var(--status-complete-bg)` (gray)
- Action buttons: `[View]` outline sm + `[Edit]` ghost sm. `[Add shot]` ghost sm for confirmed only.
- Selected card: `var(--color-accent-light)` bg (#F5F0EB), `var(--color-accent)` left border 2px. This is whichever shoot is loaded in the right panel.

**Show 3 shoots in populated state:**
1. `Spring Lookbook` — confirmed, Feb 3, Studio A, 12 shots (selected — this one loads in right panel)
2. `Campaign B-Roll` — draft, Mar 2, Outdoor, 6 shots
3. `Summer Edit` — complete, Jan 15, Location TBD, 8 shots

Card hover: `var(--color-bg-subtle)` bg overlay (`var(--opacity-hover)` = 0.08), cursor pointer.

**Chat input** (pinned bottom): same as all screens.

---

### IntelligencePanel — Right panel

Loaded with the selected shoot (Spring Lookbook). Always white bg.

**Panel header:**
- `Spring Lookbook` — `var(--font-size-base)` `var(--font-weight-semibold)`
- Brand chip: `Nike` — `var(--font-size-xs)` `var(--color-text-muted)` `var(--color-bg-subtle)` pill

**Shoot metadata:**

4-row spec grid, `var(--font-size-sm)`:
```
Date       Feb 3, 2026        ← Geist Mono, --color-text-primary
Location   Studio A, Toronto
Shots      12
Status     confirmed          ← green badge
```
Label column: `var(--color-text-muted)` right-aligned. Value column: `var(--color-text-primary)`.

Divider.

**Shot List section:**

Label "Shot List" `var(--font-size-xs)` `var(--color-text-muted)` uppercase + shot count badge right.

Numbered list, scrollable (max-height ~200px), `var(--font-size-sm)`:
```
1.  Hero shot — white bg, product centre
2.  Detail — sole construction
3.  Lifestyle — park setting, athlete in motion
4.  Collab — with athlete ambassador
… +8 more
```
Each item: number `var(--color-text-muted)` Geist Mono + description `var(--color-text-primary)`. Row hover: `var(--color-bg-subtle)`. Scroll indicator at bottom if list overflows.

Divider.

**Location section:**

Label "Location" `var(--font-size-xs)` uppercase muted.
Map placeholder: 100% wide, 80px tall, `var(--color-bg-subtle)` bg, `var(--card-radius)`, centered Lucide `MapPin` icon (20px muted). Below: `Studio A, Toronto` `var(--font-size-sm)`.

Divider.

**CTA:**
`[+ New shoot]` — `<Button variant="default" size="sm">` full-width, orange. Opens `/app/shoots/new`.

**Panel tabs** (sticky bottom):
`Details | Shot List | Location | Assets` — `<Tabs>`. Active tab orange underline + text.

---

### Generate all 5 states

**State 1 — Populated, shoot selected** (as above — Spring Lookbook in right panel)

**State 2 — Populated, no selection** (page loads, no shoot clicked yet):
- Right panel: empty state — Lucide `Camera` (32px muted) centered + `Select a shoot to see details` `var(--font-size-sm)` `var(--color-text-muted)` + `[+ New shoot]` button
- Center: same shoot cards, none highlighted

**State 3 — Empty** (no shoots for this brand):
- Center workspace: no cards. Agent greeting: `No shoots planned yet. I can plan your first shoot for Nike based on the campaign calendar.` + `[Plan first shoot]` chip (primary orange Button)
- Right panel: empty state — Camera icon + `Plan your first shoot` + `[+ New shoot]` Button

**State 4 — Loading:**
- Center: skeleton greeting (2 lines) + 3 skeleton cards (full-width, 72px each, `var(--color-bg-subtle)` shimmer)
- Right panel: skeleton for header (1 line), 4 skeleton spec rows, skeleton shot list (5 lines), skeleton map placeholder

**State 5 — HITL: AI quick-plans a shoot** (operator asked agent to plan a shoot inline):
Center workspace shows a `ShootDraftCard` (ApprovalCard variant) in the conversation:

```
┌──────────────────────────────────────────────────────────┐
│ ⚠  New Shoot Draft — Summer Edit                         │
│                                                          │
│  Date:      Mar 15, 2026                                 │
│  Location:  Studio A, Toronto                            │
│  Shots:     8                                            │
│  Brief:     Product-focused summer colourway launch       │
│                                                          │
│  87% confidence · Based on Spring campaign brief + DNA   │
│                                                          │
│  [Approve & save]    [Customise in wizard]               │
└──────────────────────────────────────────────────────────┘
```

- Border: `var(--approval-border)`, bg: `var(--approval-bg)`
- "Approve & save" = `<Button variant="default" size="sm">` orange
- "Customise in wizard" = `<Button variant="outline" size="sm">` → navigates to `/app/shoots/new` with draft pre-filled

---

### Design tokens

| Element | Token |
|---|---|
| Page bg | `var(--color-bg-page)` |
| Shoot card bg | `var(--color-bg-card)` |
| Shoot card border | `var(--color-border)` |
| Selected card bg | `var(--color-accent-light)` |
| Selected card border | `var(--color-accent)` 2px left |
| Status confirmed | `var(--status-active-text)` + `var(--status-active-bg)` |
| Status draft | `var(--status-planning-text)` + `var(--status-planning-bg)` |
| Status complete | `var(--status-complete-text)` + `var(--status-complete-bg)` |
| HITL draft border | `var(--approval-border)` |
| HITL draft bg | `var(--approval-bg)` |
| Date text | Geist Mono, `var(--color-text-primary)` |
| Shot number | Geist Mono, `var(--color-text-muted)` |
| Map placeholder | `var(--color-bg-subtle)` |

---

### Rules for this screen

1. Shoot cards are horizontal full-width rows — not a grid. Date is the most important data point, right-aligned.
2. The selected card has a 2px orange left border accent — this ties to the right panel content.
3. Status badges use the `<Badge>` primitive with StatusChip tokens — never custom inline styles.
4. Shot list in the right panel is read-only. Editing happens via `[Edit]` on the card → navigates to shoot detail.
5. "New shoot" button appears in two places: workspace header (always visible) and right panel bottom (contextual). Both are identical primary orange buttons.
6. The AI quick-plan HITL card (State 5) always offers two paths: approve-and-save (minimal) or customise-in-wizard (full flow). Never force the full wizard for simple shoots.
7. Location map is always a placeholder on this list screen — real maps integration is out of scope. Lucide `MapPin` + text is sufficient.
8. Shot count uses Geist Mono — it's data, not prose.
9. Agent greeting must name the next upcoming shoot by date, not just "you have shoots".

---

### Output format

Full-page HTML prototype:
- States 1–5 as toggle-able views (selector at top of prototype)
- Click on a shoot card → loads that shoot in right panel (selectedShootId state)
- Selected card highlight transitions smoothly (`var(--duration-fast)` 150ms)
- Shot list scrollable within the right panel with visible scroll indicator
- Panel tabs functional — Details tab shows metadata + shot list + map, Shot List tab shows full expanded list
- Mobile at `max-width: 1024px`: right panel hidden, shoot card tap opens a Sheet (`ui/sheet.tsx`) sliding up from bottom with right panel content
