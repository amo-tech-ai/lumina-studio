# SCR-35 · Planner Hub

**Route:** `/app/planner` (bare index — distinct from `/app/planner/dashboard`, see below)
**Backing spec:** **None yet.** `plan/planner/wireframes.md`'s Screen Inventory (#1) lists this route with a one-line description ("See all active plans and 'My tasks this week'") but it was never elaborated into its own wireframe section, and no Linear issue (`IPI-476`–`483`) defines acceptance criteria for it. This design prompt exists to close that gap — **before implementing, someone should open a real Linear issue against this spec** (folding it into `IPI-479` or as a new `PLN-009` is reasonable; don't build against a prompt with no tracked issue).
**Read first:** `00-review-and-conventions.md` in this folder — component inventory and token table.

---

## Why this is a different screen from SCR-33 (Dashboard)

`/app/planner/dashboard` (`SCR-33`) is **personalized** — "what's mine across all plans" (My Tasks, Needs Approval, At Risk). `/app/planner` (this screen) is the **index** — "what plans exist that I can see," the same relationship `Pages/Shoots List.v2.image-first.dc.html` (`SCR-04`) has to an individual Shoot Detail page. An operator lands here to *find or create* a plan; they land on the Dashboard to see *their own* open items across plans they're already in. Don't merge the two — they answer different questions.

---

## Claude Design prompt

> Design the **Planner Hub** for iPix — the index screen listing every production-plan instance (shoot schedules, campaign timelines, CRM pipeline plans) the signed-in operator has access to, with a way to open one or start a new one.
>
> **This is not a new list pattern.** `Pages/Shoots List.v2.image-first.dc.html` (`SCR-04`) already solved "list of entities with filter + search + New button + image cards" for this exact design system — rebuild that structure with plan instances instead of shoots. Do not design a new list/grid pattern.
>
> Follow `DESIGN.md` v3 "Zeely Editorial" exactly: pure white/grey/black, Inter, black primary "New plan" button, `StatusChip` for instance status (`draft → planned → active → blocked → completed → archived → cancelled` per the audited `planner` schema enums), Geist Mono for any counts/dates.
>
> Layout: `PageHeader` ("Planner", subtitle = count + "N need attention"), a `FilterBar` row (filter by entity type — shoot/campaign/crm_deal — and by status), a search input, then a grid of plan-instance cards (4:3 cover image per `DESIGN.md`'s aspect-ratio table, title, entity-type badge, status chip, progress hint) — same anatomy as a Shoot card. Empty and loading states use the existing `EmptyState`/`SkeletonLoader` components.
>
> Do not invent a new card shape, a new filter pattern, or a new "create" flow — clicking "New plan" should open the same workflow-template picker implied by `SCR-32`'s empty state ("Select a workflow template"), not a separate wizard.

---

## Component inventory

| Element | Reused from | New? |
|---|---|---|
| Page header (title, subtitle, primary action) | `PageHeader.dc.html` | No |
| Filter bar (entity type, status) | `FilterBar.dc.html` | No |
| Search input | `SearchBar.dc.html` | No |
| Plan instance card (4:3 image, title, badge, status chip) | `ShootCard.dc.html` pattern (same anatomy, image-first) | No — reskinned |
| Instance status chip | `StatusChip.dc.html` (planner status enum) | No — same extension already used in `SCR-32`/`SCR-33` |
| Empty state ("no plans yet") | `EmptyState.dc.html` | No |
| Loading skeletons | `SkeletonLoader.dc.html`, `card` variant | No |
| Chat dock | `PersistentChatDock.dc.html` | No |
| Intelligence panel | `IntelligencePanel.dc.html` pattern | No — reskinned (cross-plan summary, not single-instance health) |

## Responsive layouts

| Breakpoint | Behavior |
|---|---|
| Desktop (>1280px) | Full 3-panel shell, grid of instance cards (same column count `SCR-04` uses for shoot cards). |
| Tablet (768–1280px) | IntelligencePanel collapses to `BottomSheet`; card grid drops a column. |
| Mobile (<768px) | Per the same rule as `SCR-32`: Planner defaults to the Dashboard (`SCR-33`) on mobile, not this hub. If deep-linked here, cards stack to a single column, same reflow as the Shoots List mobile view. |

## States

| State | Design |
|---|---|
| Empty (no plans exist yet) | `EmptyState` — "No production plans yet," primary CTA "New plan," one AI-suggestion line. |
| Loading | `SkeletonLoader` `card` variant grid. |
| Success | Populated instance-card grid. |
| Error | Inline retry banner — same treatment as every other list screen. |

## Accessibility notes

- Plan-instance cards are real links (`<a>`/`next/link`), not `div` + `onClick` — same requirement already enforced on every other card in this design system.
- Entity-type badges (shoot/campaign/crm_deal) are never color-only — icon + text label, matching `StatusChip`'s existing convention.
- Filter bar and search are both keyboard-operable and announce result counts on change (`aria-live` region), matching the pattern already used on `SCR-04`/CRM list screens.

## Interaction notes

- Clicking a plan card navigates to `SCR-32` (`/app/planner/[instanceId]`), defaulting to the instance's `planner.view_configs.default_view`.
- "New plan" opens the workflow-template picker (reuses `SCR-32`'s empty-state CTA flow) rather than a separate wizard screen.
- Chat dock greeting is hub-aware: e.g. *"You have 4 active plans. Want me to summarize what needs attention across all of them?"*

## Implementation notes

*References only — not additional design work.*

- **Related Linear:** none yet — **open one before implementing** (see the backing-spec note at the top of this file).
- **Blocked by:** `IPI-476` (schema), `IPI-477` (at least one seeded workflow template to list)
- **Unblocks:** nothing directly — this is a convenience index, not on the critical path
- **React components:** would live at `app/src/app/(operator)/app/planner/page.tsx` (does not exist yet)
- **Supabase tables:** `planner.instances`, `planner.workflows` (for the entity-type/template picker), `planner.assignments` (access filtering)
- **Mastra tools:** none directly

## Definition of done

- [ ] Desktop / tablet / mobile layouts per §"Responsive layouts"
- [ ] Full keyboard navigation (every card and filter control focusable)
- [ ] Empty, loading, error states designed
- [ ] Accessibility: entity-type badges never color-only, search/filter announce result counts
- [ ] **A real Linear issue exists for this screen before any implementation starts**

## Future (explicitly deferred — no Linear issue backs these today)

Saved filters, favorites/pinning, and a template-management view (clone/publish/version/archive workflow templates) were considered and rejected for this pass — templates are SQL-seeded for v1 per `IPI-476`'s explicit scope. Revisit only if a real issue is opened for them.
