# Planner Design Prompts — Review & Conventions

**Read this before opening any of the 3 screen prompts in this folder.** It's the "review existing screens first" step — everything below was pulled from the actual `.dc.html` library and `DESIGN.md`, not invented for the Planner.

## Why these 3 screens, why now

The Planner (`linear/issues/IPI-476..483-PLN-*.md`) needs 3 new UI surfaces that have no Claude Design file yet, unlike every other screen in this app (SCR-01→31). See `plan/planner/01-audit.md` §6 for the gap analysis. This folder is the fix: a design brief per screen, written so Claude Design builds them as a **natural extension** of the existing system, not a new visual language.

| Prompt | Screen | Route | Backing spec |
|---|---|---|---|
| `SCR-32-planner-workspace.md` | Planner Workspace (Timeline/Kanban/Calendar/List) | `/app/planner/[instanceId]` | IPI-478, IPI-483 |
| `SCR-33-planner-dashboard.md` | Planner Dashboard | `/app/planner/dashboard` | IPI-479 |
| `SCR-34-planner-instance-settings.md` | Instance Settings | `/app/planner/[instanceId]/settings` | IPI-479 |
| `SCR-35-planner-hub.md` | Planner Hub (index of all plans) | `/app/planner` | **None yet** — see the file's own header note; open a Linear issue before implementing |

*(Added 2026-07-09 after an external design-quality review confirmed the Hub was a real gap in the original wireframe inventory — see that review's "Valid findings" §1. Everything else the review flagged — Workflow Builder, Approval History, Comments, Dependency Inspector, Notification Rules screen, Planner Analytics, an "AI Modes" taxonomy — was cross-checked against `IPI-476`–`483` and found to have no backing acceptance criteria, so none of it was built. See "Future" notes at the end of each screen prompt and §5 below.)*

Diagrams referenced from all 4 prompts live in `diagrams.md`.  
**Supabase / data vocabulary:** `supabase-reference.md` (verified vs PR #283).  
**Design plan SSOT:** `00-design-plan.md` (not `../planner.md`, which is the engineering audit).

## Note on `DESIGN.md`'s upload sequence

`Universal-design-prompt5/DESIGN.md` §"Quick Start" tells you to upload `docs/design/claude-design/00-README.md`, `.../prompts/00-universal.md`, and `.../00-upload-manifest.md` before pasting a page prompt. **Those 3 files don't exist in this repo** (checked 2026-07-09) — only `DESIGN.md` itself and the real `app/src/styles/tokens.css` / `design-system-rules.md` do. Each prompt in this folder is written to be self-contained, so you can run a session with just: `DESIGN.md` + the reference screens it names + the prompt file. If someone builds the missing universal-prompt scaffold later, fold these in.

---

## 1. Design system — v3 "Zeely Editorial" (confirmed live in the library, not aspirational)

Verified by reading the actual token blocks in `SCR-25-Role-Dashboards.dc.html`, `SCR-15-Notification-Center.dc.html`, `SCR-30-CRM-Pipeline.dc.html`, and every `components/*.dc.html` file — they all agree with each other and with `DESIGN.md` §5:

| Token | Value | Use |
|---|---|---|
| `--color-bg-page` / `--color-bg-card` | `#ffffff` | Page and card surface — **pure white, never off-white/beige** |
| `--color-bg-subtle` | `#fafafa` | Section backgrounds, skeleton base |
| `--color-bg-muted` | `#f5f5f5` / `#f4f4f5` | Avatar/image placeholder fill |
| `--color-border` | `#e5e7eb` | 1px hairline — the only border most surfaces get |
| `--color-border-strong` | `#d1d5db` | Hover state on interactive borders |
| `--color-text-primary` | `#111111` | Body text, headings |
| `--color-text-secondary` | `#4b5563` | Supporting copy |
| `--color-text-muted` | `#9ca3af` | Captions, meta |
| `--color-action` | `#111111` | **The only primary button color — black, not orange** |
| `--approved` | `#059669` | Success / on-track / approved |
| `--warning` / `--approval-border` | `#f3b93c` | Pending / at-risk amber (1px border + dot, never a filled block) |
| `--blocked` | `#dc2626` | Error / destructive / at-risk-critical |
| `--info` | `#2563eb` | Informational status only |
| `--font-sans` | Inter | All UI text |
| `--font-mono` | Geist Mono | **All numbers** — scores, counts, dates, IDs, money — with tabular nums |
| `--radius-lg` / `--card-radius` | 16–20px | Cards |
| `--radius-md` | 10px | Buttons, inputs |
| `--radius-pill` | 9999px | Chips, filter pills, status badges |

**Do not** use serif headings, off-white `#FBF8F5`, or orange `#E87C4D` — that's the retired v2 "Atelier" palette. (`plan/planner/wireframes.md` had this wrong until 2026-07-09; don't propagate the mistake.)

Shell grid, every screen: `grid-template-columns: 56px minmax(0,1fr) 340px` — collapsed NavSidebar / Workspace / IntelligencePanel. Confirmed identical across `SCR-25`, `SCR-15`, and `components/OperatorShell.dc.html`.

---

## 2. Component inventory — reuse vs. new

**Rule from `DESIGN.md` §8: new primitives require explicit justification. Reuse first.** Below is the actual accounting for these 3 screens.

### Reuse as-is (no visual changes needed)

| Component | Source | How the Planner uses it |
|---|---|---|
| `NavSidebar` | `components/NavSidebar.dc.html` | Add one nav item (`Planner`, icon `layout-dashboard` or `calendar-clock`); everything else unchanged. |
| `PageHeader` | `components/PageHeader.dc.html` | Instance name as title, phase/status as subtitle, primary action button (varies per screen). |
| `IntelligencePanel` | `components/IntelligencePanel.dc.html` | Content swaps (plan health instead of DNA score) but the card, tab strip, and layout are unchanged. Keep the fixed content order from `DESIGN.md` §9: **context → AI insights → evidence → pending approvals → conversation.** |
| `PersistentChatDock` | `components/PersistentChatDock.dc.html` | Reused verbatim — this **is** the `production-planner` agent's chat surface (IPI-482). Context-aware greeting names the instance, per `DESIGN.md` §5I. |
| `FilterBar` | `components/FilterBar.dc.html` | Reused for the Timeline/Kanban/Calendar/List view toggle **and** for role/status filters — same pill-chip component, different option lists. |
| `StatusChip` | `components/StatusChip.dc.html` | Reused for task status. Needs new `MAP` entries for the planner's status enum (`todo`, `in_progress`, `blocked`, `done`, `cancelled` per IPI-476's audited schema) — same component, more options, no new component. |
| `ApprovalCard` | `components/ApprovalCard.dc.html` | This **is** the Gate Approval Card (IPI-483) and the `commitSchedule` HITL confirmation (IPI-482) — full variant with before/after diff. Do not build a separate "GateApprovalCard" component; use this one. |
| `EmptyState` | `components/EmptyState.dc.html` | "Select a workflow template to generate the timeline" — preview-photo variant, per `DESIGN.md` §5G. |
| `SkeletonLoader` | `components/SkeletonLoader.dc.html` | `line`/`card` variants cover Kanban cards and dashboard stat cards directly. |
| `BottomSheet` | `components/BottomSheet.dc.html` | Mobile reflow of the IntelligencePanel — identical pattern to every other screen. |
| `BottomNavigation` | `components/BottomNavigation.dc.html` | Mobile tab bar; Planner likely lives under the "More" sheet initially (not one of the 5 fixed slots — confirm with product before promoting it). |

### Reuse the *pattern*, not the file (same visual language, new content)

| New component | Pattern to follow | Source |
|---|---|---|
| `PlannerKanban` (columns + cards) | Column header (dot + label + count), cards with task StatusChip, **gated phase columns** with lock + "Enter via approval only" | `Pages/SCR-30-CRM-Pipeline.dc.html` — reskin deal stages → **workflow phases** (IPI-478), not task statuses |
| `PlannerRoleDashboard` stat cards + shell | 4-up KPI grid (icon + label + mono value + meta), pending-banner chip, chat dock + IntelligencePanel shell | `Pages/SCR-25-Role-Dashboards.dc.html` |
| `TaskDetailDrawer` | Right-side slide-over | shadcn `Sheet` primitive (per `DESIGN.md` §8 rule 6 — every side drawer uses `Sheet`, don't hand-roll one) |
| `InviteMemberDialog` | Modal form | shadcn `Dialog` primitive (§8 rule 6) |

### Genuinely new (no existing pattern in the library — confirmed via search, nothing named "gantt" or "timeline" exists anywhere in `Pages/` or `components/` as a visual bar chart)

| New component | Why it's new | Design constraints |
|---|---|---|
| `PlannerTimeline` (Gantt bars) | No Gantt/timeline visual pattern exists anywhere in this design library yet | Must still obey the system: hairline borders not shadows, black/grey/amber/red status only (no rainbow phase colors), Geist Mono for date labels, 20px card radius on the container |
| `PlannerCalendar` (month/week/day grid) | No calendar grid pattern exists yet | Reuse shadcn `Calendar` primitive per the wireframe spec; multi-day event bars follow the same status-color rules as the Timeline |
| `DependencyLine` (SVG connector) | New, but tiny — a 1–2px line, not a component system | Charcoal/grey line, never colored; IPI-483 only, out of scope for the first Timeline ship |
| `PresenceBar` (active viewers) | New, small | Small circular avatars (reuse the 26–30px avatar-with-status-dot treatment already used in `NavSidebar`'s brand rail), IPI-480 only |

---

## 3. What "review existing screens first" ruled out

- **Do not** design a new dashboard shell for SCR-33 — SCR-25's shell (KPI grid → list → chat dock → intelligence panel) is a direct fit, just re-themed for producer/photographer/retoucher/client_approver instead of model/agency.
- **Do not** design a new Kanban interaction model for SCR-32's Kanban view — SCR-30 already solved gated-column + drag interaction for this exact design system.
- **Do not** redesign the Notification Center — it's out of scope for these 3 prompts entirely (reuse `SCR-15`, see `plan/planner/wireframes.md` Wireframe 6).
- **Do not** invent new status colors — amber/green/red/grey is the full palette; a 6th "phase color" system was in the original architecture plan's wireframes and is **not** part of v3 Zeely Editorial (color communicates status only, per `DESIGN.md` §5A).

## 4. Aspect ratio note

`DESIGN.md`'s image aspect-ratio table (§5H) already lists **"Shoot cover — 4:3 — shoot cards, planner"** — the Planner was anticipated. Any plan/instance card with a cover image (e.g. on the Dashboard's "Recent plans" row) uses 4:3, matching Shoot cards exactly.

---

## 5. Planner design tokens

The Planner introduces two visual primitives — a Gantt timeline and a dependency graph — that nothing else in this design system has. These need their own geometry tokens so every screen (and every future implementer) uses the same values instead of hand-picking pixels per component. Values below extend the existing scale (`--radius-sm` 6px / `--radius-md` 10px / `--radius-lg` 16-20px, `--space-*` in the 4-8-12-16-24-32px rhythm already used across `components/*.dc.html`) — none of these are arbitrary new numbers.

| Token | Value | Use |
|---|---|---|
| `--planner-row-height` | 44px | Timeline row height (phase/task lane) — matches the ≥48px-with-padding row-height convention from `DESIGN.md` §5F, minus the extra table padding since Timeline rows are denser |
| `--planner-bar-height` | 28px | Task/phase bar height within a row, vertically centered |
| `--planner-bar-radius` | `--radius-pill` (9999px) | Bar ends — pill-shaped per `SCR-32`'s prompt |
| `--planner-task-padding` | 8px 12px | Internal padding for bar labels and Kanban card bodies |
| `--planner-grid-gap` | 1px solid `--color-border-subtle` | Vertical day/week column dividers on the Timeline |
| `--planner-week-header-height` | 32px | Week/day header row above the Timeline grid |
| `--planner-calendar-cell-min` | 96px | Minimum calendar-day cell height (enough for 2 event chips + "+N more") |
| `--planner-dependency-stroke` | 1.5px, `--color-text-muted` | `DependencyLine` SVG connectors — charcoal/grey only, never colored (per `IPI-483` scope) |
| `--planner-today-marker` | 2px solid `--color-text-primary` | Vertical "today" line — black, not a colored column, per `SCR-32`'s prompt |
| `--planner-drag-handle-size` | 6px × 100% (edge grab zone) | Timeline bar resize handles |
| `--planner-selection-outline` | 2px solid `--color-action` | Selected task/phase (keyboard focus or click-select) |
| `--planner-hover-elevation` | none (border darkens to `--color-border-strong` only) | Per `DESIGN.md` §5B: "no shadow jump, no scale" on hover — Planner follows the same rule, no exception |
| `--planner-drop-target` | 2px dashed `--color-action`, `--color-bg-subtle` fill | Kanban drop-target column/slot during drag |

These are additions to the existing token file, not a parallel system — `--planner-*` tokens should be defined alongside the other component tokens in `app/src/styles/tokens.css` when implemented, referencing the same primitives (`--color-*`, `--radius-*`) rather than new raw hex values.

## 6. Explicitly deferred (no Linear issue backs these — do not design or build)

An external design-quality review of `SCR-32`–`34` (2026-07-09) proposed 8 additional screens and a 6-mode AI taxonomy. Each was checked against `IPI-476` through `IPI-483`'s actual acceptance criteria and found to have no backing spec. Listed here once so it doesn't need re-litigating per-screen, and so a future real request can find prior art instead of starting from scratch:

- **Workflow Template Builder / Library** (clone, publish, version, archive templates) — `IPI-476` explicitly scopes v1 as SQL-seeded templates, no UI.
- **Approval History screen** — already covered by `planner.events` + `ApprovalCard` + the Task Detail Drawer; no dedicated timeline view is specified.
- **Activity Timeline visualization** — same events table, no dedicated screen specified.
- **Comments & Discussion panel** (threaded, mentions, attachments) — not in any acceptance criteria; the Task Detail Drawer's "comments" mention in the original wireframe was aspirational, not a built requirement.
- **Dependency Inspector** — `IPI-483` only specifies inline `DependencyLine` SVG connectors on the Timeline, not a separate inspector screen.
- **Notification Rules screen** — `IPI-481` specifies a small `NotificationSettings.tsx` component, not a dedicated screen; don't invent a second settings surface.
- **Planner Analytics** — no backing issue anywhere.
- **AI Modes taxonomy** (Suggest/Explain/Optimize/Simulate/Review/Compare) — `IPI-482`'s actual tools (`buildSchedule`, `detectScheduleRisks`, `suggestDependencies`, `shiftTimeline`, `assignTasks`, `commitSchedule`, `explainDelay`, `summarizeTimeline`) are already the interface; a marketing-style mode taxonomy on top would be presentation, not implementation.
- **Cloudflare/infra implementation notes inside these design prompts** — `IPI-480` (Durable Objects/presence) and `IPI-481` (Queues/notification fan-out) already have their own architecture diagrams; repeating that detail here would duplicate rather than help, and blurs design-vs-engineering scope.

If a real Linear issue is opened for any of these, write a new design prompt the same way `SCR-32`–`35` were written: read the existing library first, reuse before inventing, and cite the issue.
