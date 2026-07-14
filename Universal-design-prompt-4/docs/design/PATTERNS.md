# Component Patterns — Forms · Tables · Charts · Notifications

> Shared interaction patterns for new and existing screens. Reuse these; do not invent per-screen variants. Tokens: `DESIGN-TOKENS.md`. Components: `../../components/COMPONENTS.md`.

## Forms {#forms}
- **Layout:** labelled fields (label above input; placeholder ≠ label), grouped in sections, 44px inputs, `--radius-md`, hairline borders, focus border `#111`.
- **AI-assist:** fields arrive **pre-filled** by AI where possible; an "AI suggested" affordance with **accept / edit**; before/after on AI changes.
- **Validation:** inline, on blur + submit; error text below field (not colour-only); summarise errors at top for long forms.
- **Auto-save:** drafts save silently (wizard pattern: "Save draft" + dirty flag + unsaved-exit guard); show last-saved.
- **Confirmation/review:** destructive or high-impact actions get a confirm modal with a checklist (e.g. Create Shoot). Multi-step ends in a review summary.

## Tables {#tables}
- **Use when** scanning many rows/columns matters (Assets table view, Matching table); otherwise prefer image-first cards.
- **Sort** on column headers (asc/desc indicator). **Filter** via the FilterBar chip row + search (AND-combine). **Bulk**: row checkboxes → sticky action bar (tag/approve/delete).
- **Selection** drives the IntelligencePanel/right-panel detail (consistent with cards).
- **Sticky** header + first (identity) column on wide tables.
- **Mobile:** collapse to a card/list (key fields + chevron), not a horizontal-scroll table.

## Charts {#charts}
> **LOCKED 2026-07-01 (D-DS6/D-DS9).** The chart language for Analytics + inline metrics. All charts are pattern instances built from tokens — **not** new shared components (a `Chart` primitive may be extracted during SCR-16 build; until then, compose inline per these rules).

**Foundations**
- **Style:** minimal, editorial — hairline axes (`1px var(--color-border)`), no gridlines beyond a faint baseline, no 3D/shadows/gradients. Mono numerals (`--font-mono`). Generous padding.
- **Colour:** monochrome-first — series in `--color-text-primary` (#111) then greys (`--color-text-secondary`, `--color-border-strong`). **One accent max** per chart for the focus series. Status hues (🟢`--color-approved` / 🟡`--color-low` / 🔴 `#b91c1c`) **only** to encode state, never decoration. No rainbow palettes.
- **Labels/axes:** ≥12px; y-axis abbreviated (`1.2k`, `86%`); x-axis sparse (every Nth tick). Never truncate a critical label.
- **Density:** show the trend, not every point; cap ~12 visible x-points on mobile, ~30 desktop; aggregate beyond.

**Chart types (locked set — pick from these; don't invent)**
| Type | Use | Recipe |
|---|---|---|
| **Trend** (line/area) {#trend} | value over time (DNA over time, deliverables/week) | 1.5px line `--color-text-primary`; optional area = 8% alpha fill; dots only on hover/focus + last point; multi-series toggle, one accent |
| **Comparison** (bar) {#comparison} | compare objects (channels, campaigns, assets) | 1 bar per object, `--color-text-primary`, `--radius-sm` top; focus bar = accent; horizontal when labels are long; value label at bar end |
| **Score** (ring/donut + linear) {#score} | a single 0–100 score / readiness / rate | ring: track `--color-bg-muted`, fill by band (≥80 `--color-approved` · 60–79 `--color-low` · <60 `#b91c1c`); centre = mono value; **reuse the existing DNA pillar linear bars** for breakdowns |
| **Sparkline** {#sparkline} | inline trend inside a KPI card | 24–32px tall, no axes, last point dot; colour = KPI delta direction |

**Tooltips** {#tooltips}
- Trigger on **hover AND focus** (keyboard-accessible); dismiss on blur/Esc.
- Content: object name + value (+ delta vs prior when relevant). Mono value. One line.
- Card: `--color-bg-card`, `1px --color-border`, `--radius-md`, `--shadow-card`, ≤240px.
- **Mobile:** tap a point/bar to pin the tooltip (no hover); tap elsewhere dismisses.

**States** (every chart) {#chart-states}
- **Loading:** skeleton in the chart's final shape (bars → grey blocks; line → shimmer band) via `SkeletonLoader`; never a spinner. `aria-busy="true"`.
- **Empty:** centered "No data yet" + the one action that produces it ("Publish a campaign to see performance"). Never an empty axis grid.
- **Error:** inline "Couldn't load — Retry" (+ Report where relevant); never colour-only.
- **Partial/estimated:** dashed/8%-alpha segment + a note ("last 2 days estimated").

**Motion:** entrance = 250ms grow/fade, `--ease-default`; **disabled under `prefers-reduced-motion`** (render final state). No looping/ambient motion.

**Accessibility:** every chart has a text alternative (caption or adjacent value list); never encode a series by colour alone (pair with label/pattern/direct label); keyboard-reachable data points; tooltips on focus.

**Do / Don't**
- ✅ monochrome + one accent · hairline axes · mono numerals · text alt · reduced-motion safe · empty/loading/error every time.
- ❌ rainbow palettes · 3D/donut-with-shadow · gridline clutter · hover-only tooltips · colour-only series · pie charts with >4 slices · animating persistent data on every render.

## KPI / metric cards {#kpi}
> **LOCKED 2026-07-01 (D-DS11).** Inline screen KPIs + dashboard metric cards. Pattern instance from tokens; a `KpiCard` primitive may be extracted at SCR-16 build — until then compose per this recipe.

**Anatomy (fixed order):** label (xs, muted, uppercase) → **big mono value** (`--font-mono`, 2xl/3xl, `--color-text-primary`) → delta row (▲/▼ + % vs prior) → optional sparkline → optional status dot + "Explain" affordance. Hairline card (`1px --color-border`, `--card-radius`, **no shadow**), `--color-bg-card`.

**Variants** {#kpi-variants}
| Variant | Use |
|---|---|
| **Value** | single number (Assets published, Campaigns live) |
| **Value + delta** | number with change vs prior period (▲/▼ + %) |
| **Value + sparkline** | number + inline trend (DNA, engagement) |
| **Comparison** | two values + delta (this vs benchmark / before→after) |
| **Score** | 0–100 with the ring `#score` chart (readiness, approval rate) |

**Delta colour rule:** value stays monochrome; **only the delta encodes state** — 🟢 up-good / 🔴 down-bad, **inverted** where down is good (cost, approval turnaround, assets-below-threshold). Always pair the arrow with the sign (never colour-only).

**States:** loading = skeleton card (label + value block + bar); empty = "No data yet" + producer; error = "—" value + inline Retry. `aria-busy` while loading.

**EvidenceBlock for every metric** {#kpi-evidence}
Every KPI/score exposes an **"Explain"** affordance that opens the existing **`EvidenceBlock`** (`AI-EXPLAINABILITY.md`): metric → why · confidence · evidence · AI reasoning · suggestions · potential · Approve→apply. **Never** build a second explainability surface; never show a metric's "why" in a bespoke popover.

**Mobile/tablet:** KPI row → horizontal snap-scroll (mobile) or 2-col grid (tablet); charts stack full-width; tooltips tap-to-pin; IntelligencePanel (with EvidenceBlock) → bottom sheet. Reduced-motion honored.

**Do / Don't**
- ✅ mono value · delta always signed + arrow · one accent · Explain→EvidenceBlock · skeleton/empty/error · no shadow.
- ❌ colour-only delta · decorative icons per card · shadowed/gradient cards · a metric with no "why" path · bespoke explain popovers.

## Selection & drag {#selection}
> Canonical card interaction system (D-DS5). Reference build: **Assets** masonry. Reuse for Assets · Campaigns · Products · Matching · Collections — never a per-screen variant.
- **Select mode:** a header **Select** toggle enters multi-select; a 24px checkbox appears top-left of every card (always visible once any item is selected). On mobile, **long-press** a card enters select mode.
- **Toggle:** clicking a card in normal mode opens its detail; in select mode it toggles selection. The checkbox always toggles (stops propagation). Selected card gets a `--color-text-primary` border ring.
- **Selection counter + bulk bar:** when ≥1 selected, a **sticky black toolbar** shows "N selected · Select all" + bulk actions (Approve · Reject · Add to shoot · Add to campaign · Clear). Each action fires a toast and clears selection.
- **Drag & drop:** cards are `draggable`; on drag-start, unselected items auto-add to the selection and a **floating drop dock** appears (Drop into Shoot · Drop into Campaign). Drop fires a toast ("N assets added to …") and clears. Always pair drag with the bulk-bar buttons (keyboard/no-drag fallback).
- **Tokens:** checkbox `--color-action` filled when on; bar `--color-text-primary` bg, `--shadow-panel`; drop targets `2px dashed --color-text-primary`.
- **A11y:** every drag action has an equivalent bulk-bar button; checkboxes are real buttons with `aria-label`; counter is announced.

## Notifications {#notifications}
| Type | When | Behaviour |
|---|---|---|
| **Toast** | transient confirmation (saved, sent, exported) | bottom-center, auto-dismiss ~2.2–2.4s, live region |
| **Banner** | persistent context (stale data, read-only, offline) | inline at top of workspace; dismiss/Refresh/Request-access |
| **Modal** | blocking decision (confirm create/publish/exit guard) | focus trap, Esc/backdrop close |
| **Alert** | error needing attention | inline near source + Retry; never colour-only |
| **AI message** | dock greeting / suggestion / result | named object + next action, ≤2 sentences |
| **System message** | account/permission/maintenance | banner or notification center |
| **Notification center** (SCR-15) | inbox of approvals due, assignments, mentions, shoots today | list + read/unread + filters + deep links |

**Rule:** match severity to surface — toast for transient, banner for persistent context, modal only for blocking decisions. Never stack competing toasts; coalesce.
