# ANALYTICS-PLAN.md — FashionOS / iPix

> **Planning only — do NOT build yet.** Design plan for the Analytics surface. Reuses the existing shell, components, and patterns; introduces **no new explainability or card components**. **Chart/KPI gate CLEARED — D-DS6/D-DS9/D-DS11 locked in `PATTERNS.md#charts/#kpi` (2026-07-01); SCR-16 may start.** Style: Zeely Editorial v3 (white / grey / charcoal, Inter, image-first where relevant, monochrome charts).

## 1. Purpose & scope
A read-first performance surface for operators/executives: brand DNA improvement over time, campaign & asset performance, AI activity, team productivity. **Every metric is explainable** (route the "why" through the existing `EvidenceBlock`), and every insight offers a next action (no dead dashboards).

## 2. Screens (proposed)
| ID | Screen | Route | Agent | Primary user |
|---|---|---|---|---|
| SCR-16 | **Analytics Overview** | `/app/analytics` | analytics-intelligence | Executive, Marketing |
| SCR-17 | **Campaign Performance** | `/app/analytics/campaigns` | analytics-intelligence | Marketing |
| (later) | Asset / Channel drill-downs | `/app/analytics/assets` | analytics-intelligence | Ops, Marketing |

Build **SCR-16 first**; SCR-17 and drill-downs follow once the chart/KPI language is proven.

## 3. Layout — reuse the 3-panel shell (no 4th column)
```
NavSidebar │ Workspace (KPI row → charts → insights)      │ IntelligencePanel
           │ + PersistentChatDock (bottom)                │ (context: filters,
           │                                              │  AI insights, EvidenceBlock)
```
- **Workspace:** date-range + brand/campaign **FilterBar** → **KPI card row** → **chart grid** (trend + comparison) → **AI insights list**.
- **IntelligencePanel:** active filters summary · top AI insights · "Explain this metric" → **EvidenceBlock** (score/metric → why, evidence, reasoning, suggestions). Never detail content in a 4th column.
- **ChatDock:** context-aware ("Spring 2026 is your top campaign — CPE down 18%. Want the breakdown?"). Never "How can I help?".

## 4. Components — reuse only (no new components)
| Need | Reuse |
|---|---|
| Shell | OperatorShell (NavSidebar · Workspace · IntelligencePanel) |
| KPI cards | `PATTERNS.md#kpi` (big mono value · label · delta ▲/▼ · sparkline · status dot) |
| Charts | `PATTERNS.md#charts` (line/area trend, bar compare, ring/donut, sparkline — monochrome, hairline axes) |
| Metric explainability | **EvidenceBlock** (`AI-EXPLAINABILITY.md`) — "Explain this metric" |
| Filters | FilterBar (chip row + search, AND-combine) + date-range control |
| Status | StatusChip · AgentStatusIndicator |
| AI | PersistentChatDock · EvidenceBlock · ApprovalCard (if an insight proposes a write) |
| States | SkeletonLoader · EmptyState (chart skeletons; "No data yet" + what produces it) |

**Rule:** if a metric needs a "why", route it through EvidenceBlock — do not invent a second explainability component. New chart/KPI visuals are *pattern instances* from `PATTERNS.md`, not new shared components (unless a genuinely reusable `KpiCard`/`Chart` primitive emerges — decide during D-DS11).

## 5. KPIs (SCR-16)
- **Avg Brand DNA** (trend + delta vs last period) · **Campaigns live** · **Assets published** · **Avg asset DNA match** · **AI actions approved** · **Approval turnaround** (down = good).
- Each KPI card: mono value · delta direction (🟢 up-good / 🔴 down-bad, inverted for cost/turnaround) · sparkline · "Explain" affordance.

## 6. Charts (SCR-16)
- **DNA over time** — line/area, per pillar toggle.
- **Campaign performance** — bar compare (reach/engagement/CPE) across campaigns.
- **Asset performance** — bar/scatter (DNA match vs. engagement).
- **AI activity** — stacked bar (suggested / approved / rejected) + approval-rate ring.
- **Team productivity** — line (deliverables/week) + leaderboard list.

## 7. AI insights (the differentiator)
- Ranked insight list: each = plain-language finding + confidence + **evidence** + a **next action** (e.g. "Reallocate budget to Spring 2026" → ApprovalCard if it writes).
- Drill-down opens **EvidenceBlock** (metric → why, evidence, reasoning, suggested improvements, potential, Approve→apply).
- Streaming while computing: determinate step list, `aria-live="polite"` (per `AI-EXPLAINABILITY.md`).

## 8. States (all required)
Populated · **Loading** (skeleton KPI row + chart shapes) · **Empty** ("No data yet — publish a campaign to see performance") · **Error** (Retry · Report · Go back; analytics-intelligence is not durable → error+retry, not resumable stream) · **Approval-pending** (an insight proposing a write shows an ApprovalCard).

## 9. Mobile (per `MOBILE-PLAN.md`)
- KPI row → horizontal snap-scroll or 2-col grid; charts stack full-width; IntelligencePanel → bottom sheet; ChatDock docked; charts get larger touch targets + tap-for-tooltip (no hover-only). Honor `prefers-reduced-motion` (no chart entrance animation).

## 10. User journeys
- Exec: open Overview → scan KPIs → "why is DNA up?" → EvidenceBlock → done.
- Marketing: Overview → Campaign Performance → compare → reallocate (ApprovalCard) → back.
- Ops: Overview → team productivity → drill to a shoot.

## 11. Dependencies & gates
1. **Chart/KPI language: ✅ LOCKED** (`PATTERNS.md#charts` + `#kpi`, D-DS6/D-DS9/D-DS11, 2026-07-01) — build to that spec; do not invent new chart types.
2. Confirm `analytics-intelligence` agent + route in `route-agent-map.ts` (engineering; see `IMPLEMENTATION-TASKS.md`).
3. Data availability (published campaigns/assets) — until then, Empty state is the honest default.

## 12. Out of scope (for the first build)
Custom report builder, export/scheduling, real-time streaming metrics, role-specific executive dashboards (SCR-18) — future phases.

## 13. Definition of done (when built)
3-panel shell · KPI row + ≥3 charts from `PATTERNS.md` · EvidenceBlock on every metric · AI insights with next actions · all 5 states · mobile + tablet · a11y (keyboard tooltips, live regions, reduced-motion) · no new shared components · console clean.
