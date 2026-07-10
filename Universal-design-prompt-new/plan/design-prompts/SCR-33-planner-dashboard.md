# SCR-33 · Planner Dashboard

**Route:** `/app/planner/dashboard`
**Backing spec:** `linear/issues/IPI-479-PLN-004-role-based-views-assignments.md`
**Read first:** `00-review-and-conventions.md` in this folder — component inventory and token table.

---

## Claude Design prompt

> Design the **Planner Dashboard** for iPix — a personalized landing page showing a producer, photographer, retoucher, model, client approver, stylist, or coordinator what matters to *them* across all their production plans: My Tasks, Due Today, Overdue, Waiting, Needs Approval, At Risk, Upcoming, team workload, recent activity, and their list of plan instances.
>
> **This is not a new dashboard pattern.** `Pages/SCR-25-Role-Dashboards.dc.html` already solved this exact problem for a different persona set (Model/Agency) — same shell: greeting header → 4-up KPI stat-card grid → a role-conditional content section → chat dock at the base → IntelligencePanel on the right. Rebuild that structure with Planner data and Planner personas. Do not design a new dashboard shell.
>
> Follow `DESIGN.md` v3 "Zeely Editorial" exactly: pure white/grey/black, Inter, Geist Mono for every number, black primary buttons, amber border for pending/at-risk (never a filled amber panel), green border + check for on-track/approved.
>
> Header greets by name and states the single most useful next action, per this app's golden-teammate rule (never "Good morning" with nothing else) — e.g. *"Good morning, Maya — 2 gates need your approval, and Item delivery is at risk."*
>
> Stat cards (reuse the exact KPI-card shape from `SCR-25`: icon + label + large Geist Mono value + small meta line) for: **My Tasks**, **Needs Approval**, **At Risk**, plus role-conditional extras (Due Today / Overdue / Waiting / Upcoming / Team workload) — don't cram all 8 possible stats onto one screen at once; show the 3–4 that matter for the signed-in role, same restraint `SCR-25` uses (4 KPIs max per role).
>
> Below the stat row: a **Recent plans** row (plan/instance cards, 4:3 cover image per `DESIGN.md`'s aspect-ratio table, status chip on the image corner) and an **Upcoming this week** calendar strip (7-day horizontal, tasks as small event chips) — same visual weight and spacing as `SCR-25`'s roster/bookings section.
>
> Do not invent new stat-card shapes, new persona-switching UI, or a new activity-feed pattern — the IntelligencePanel's "Recent activity" list (dot + text + relative time) already covers that.

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
- Role-conditional content (which stats show, what the recent-activity feed emphasizes) is resolved server-side via `planner.assignments` + `permissions` JSONB (IPI-479 acceptance criterion F) — the design should have clearly-labeled "slots" for role variants (Producer sees budget gates, Client approver sees only their approval gates), matching how `SCR-25` already documents its Model vs. Agency variants inline.
- Chat dock greeting is dashboard-aware, not instance-aware here (no single open plan) — e.g. *"You have 3 plans active. Item delivery on Summer Lookbook needs attention first."*
