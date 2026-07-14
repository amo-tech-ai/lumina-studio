# SCR-33 · Planner Dashboard

**Route:** `/app/planner/dashboard`
**Backing spec:** `linear/issues/IPI-479-PLN-004-role-based-views-assignments.md`
**Read first:** `00-review-and-conventions.md` · `supabase-reference.md` · `00-design-plan.md` in this folder.

---

## Claude Design prompt

> Design the **Planner Dashboard** for iPix — a personalized landing page showing what matters to *this* operator across production plans: My Tasks, Needs Approval, At Risk, plus a few role-conditional extras (Due Today / Overdue / Waiting / Upcoming).
>
> **Personas vs access roles:** Dashboard *copy and which KPI slots show* may speak to jobs (Producer, Photographer, Retoucher, Client Approver, …) — those are **display personas**, not DB columns. Access control is **`planner.assignments.role`**: `owner|manager|contributor|viewer` only (see `supabase-reference.md`). Do not design a `production_role` field.
>
> **This is not a new dashboard pattern.** `Pages/SCR-25-Role-Dashboards.dc.html` already solved this for Model/Agency — same shell: greeting → 4-up KPI grid → role-conditional section → chat dock → IntelligencePanel. Reskin with Planner data. Do not design a new dashboard shell.
>
> Follow `DESIGN.md` v3 "Zeely Editorial" exactly: pure white/grey/black, Inter, Geist Mono for every number, black primary buttons, amber border for pending/at-risk (never a filled amber panel), green border + check for on-track/approved.
>
> Header greets by name and states the single most useful next action — e.g. *"Good morning, Maya — 2 gates need your approval, and Item delivery is at risk."* (**At risk** = derived signal, not an instance status.)
>
> Stat cards (SCR-25 KPI shape: icon + label + large Geist Mono value + meta) for **My Tasks**, **Needs Approval**, **At Risk**, plus 0–1 role-conditional extras — max 3–4 cards. **At Risk** and any **Progress** hints are **derived** (never stored statuses).
>
> Below: **Recent plans** (4:3 cover from linked entity or muted placeholder; instance `StatusChip`) and **Upcoming this week** strip. IntelligencePanel covers recent activity — do not invent a second activity feed.

---

## Component inventory

| Element | Reused from | New? |
|---|---|---|
| Page shell + greeting header | `SCR-25-Role-Dashboards.dc.html` | No — reskinned |
| Stat cards (My Tasks / Needs Approval / At Risk / role-conditional) | `SCR-25`'s KPI grid pattern | No — reskinned |
| Recent plans row | `SCR-25`'s roster-grid pattern (image card, 4:3 not 3:4) | No — reskinned |
| Upcoming-this-week calendar strip | New composition of existing chip/StatusChip primitives | Small new composite, no new primitives |
| Chat dock | `PersistentChatDock.dc.html` | No |
| Intelligence panel (board health, recommendation, recent activity) | `IntelligencePanel.dc.html` pattern | No — reskinned |
| Empty state ("not assigned to any plans yet") | `EmptyState.dc.html` | No |
| Loading skeletons | `SkeletonLoader.dc.html` — `card` variant for stat cards and plan cards | No |

## Responsive layouts

| Breakpoint | Behavior |
|---|---|
| Desktop (>1280px) | Full 3-panel shell, 4-column stat grid, matches `SCR-25` exactly. |
| Tablet (768–1280px) | Stat grid drops to 2 columns; IntelligencePanel collapses to `BottomSheet`. |
| Mobile (<768px) | **This is the default landing view for mobile Planner access** per IPI-478's responsive acceptance criteria — stat cards stack to 1 column, recent plans becomes a horizontal scroll strip, calendar strip becomes a simple vertical day list. |

## States

| State | Design |
|---|---|
| Empty (no assignments) | `EmptyState`: "You are not assigned to any plans yet" + an "invite CTA" for instance owners only (role-conditional CTA, same pattern as `SCR-25`'s role-conditional sections). |
| Loading | Stat-card skeletons + plan-list shimmer — matches `SCR-25`'s loading feel exactly. |
| Success | Personalized stat cards, plan cards, and calendar strip populated. |
| Error | Inline retry banner + support link — same treatment as every other screen's error state, no new pattern. |

## Accessibility notes

- Stat cards are not just visual tiles — each is a link/button to the filtered view it represents (e.g. "At Risk" card → Planner Workspace filtered to at-risk tasks), so it needs a real accessible name beyond the number ("3 tasks at risk, view them").
- Recent-plans image cards need alt text describing the plan/shoot, not the decorative image.
- Calendar strip day cells need a text equivalent for screen readers (date + task count), not just a colored bar.

## Interaction notes

- Every stat card is clickable and deep-links into the Planner Workspace (SCR-32) pre-filtered — this dashboard is a router, not a dead end, matching this app's "always show the next step" principle.
- Role-conditional content is resolved server-side via `planner.assignments.role` (+ optional `permissions` JSONB) — document labeled slots (e.g. owner/manager vs viewer; Client-approver-style copy). Matching `SCR-25` Model vs Agency variants. **No `production_role` column.**
- Chat dock greeting is dashboard-aware, not instance-aware here (no single open plan) — e.g. *"You have 3 plans active. Item delivery on Summer Lookbook needs attention first."*

## Implementation notes

*References only — not additional design work.*

- **Related Linear:** `IPI-479` (this screen)
- **Blocked by:** `IPI-476` (schema) · `IPI-478` (workspace it links into)
- **Unblocks:** `IPI-480` (real-time) · `IPI-483` (dependency/gate engine)
- **React components:** `app/src/components/planner/RoleDashboard.tsx`, `app/src/app/(operator)/app/planner/dashboard/page.tsx`
- **Supabase tables:** `planner.assignments`, `planner.instances`, `planner.tasks`
- **Mastra tools:** none directly — pure data read, filtered server-side by RLS

## Definition of done

- [ ] Desktop (4-col) / tablet (2-col) / mobile (1-col, default mobile landing) layouts
- [ ] Full keyboard navigation (every stat card and plan card is a real focusable link)
- [ ] Empty ("not assigned to any plans"), loading, error states designed
- [ ] Role-conditional variants documented (at minimum: Producer, Client Approver)
- [ ] Accessibility: stat cards have real accessible names beyond the number, calendar-strip cells have a text equivalent

## Future (explicitly deferred — no Linear issue backs these today)

Planner Analytics (cross-instance reporting) was considered and rejected for this pass. Revisit only if a real issue is opened for it.
