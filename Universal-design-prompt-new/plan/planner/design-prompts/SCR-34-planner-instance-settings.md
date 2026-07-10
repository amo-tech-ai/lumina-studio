# SCR-34 · Planner Instance Settings

**Route:** `/app/planner/[instanceId]/settings`
**Backing spec:** `linear/issues/IPI-479-PLN-004-role-based-views-assignments.md` (Members tab only — see scope note below)
**Read first:** `00-review-and-conventions.md` in this folder — component inventory and token table.

---

## MVP scope — design only what's acceptance-tested

`plan/planner/wireframes.md` Wireframe 7 originally showed 4 tabs (Members / Workflow / Notifications / Danger) as if equally in scope. They aren't:

| Tab | Status | Design this now? |
|---|---|---|
| **Members** | IPI-479 acceptance criterion C ("invite flow") + F (gate ownership) | **Yes — this is the MVP** |
| Notifications | IPI-481 adds a separate `NotificationSettings.tsx` component, not confirmed as a tab in this shell | Design a placeholder tab slot only; don't fully spec the panel yet |
| Workflow | No acceptance criteria in any current issue | Design a disabled/"Coming soon" tab slot only |
| Danger | No acceptance criteria in any current issue | Design a disabled/"Coming soon" tab slot only |

Ship a real, functional Members tab. Show the other 3 as tab labels that exist in the tab strip (so the settings shell doesn't need to be rebuilt later) but render a simple "Coming soon" state — don't invest design time in panels nothing currently builds toward.

---

## Claude Design prompt

> Design the **Members tab** of Planner Instance Settings for iPix — where a plan owner manages who has access to a production plan (a shoot, campaign, or CRM deal's planner instance) and what role they hold: producer, photographer, retoucher, model, client approver, stylist, or coordinator.
>
> Match `DESIGN.md` v3 exactly: white/grey/black, Inter, black actions, hairline borders, Geist Mono for any counts. This is a settings/admin surface, so keep it dense and utilitarian relative to the rest of the app — a table, not a card gallery — following `DESIGN.md` §5F (Tables & Lists): generous row height (≥48px), soft horizontal dividers, no full grid borders, uppercase muted-grey header row.
>
> Layout: a tab strip at the top (Members active; Notifications/Workflow/Danger shown as tabs but visually and functionally disabled — "Coming soon", not fully designed panels). Below it, a member table: Name, Role (as a `StatusChip`-style pill, not free text), Permissions summary, and a row action menu. An "Invite member" button (black, primary) opens a `Dialog` (shadcn primitive per `DESIGN.md` §8 — do not hand-roll a modal) with email + role fields and role-preset permission checkboxes.
>
> Do not design the Notifications, Workflow, or Danger panels in depth — those aren't backed by any current acceptance criteria. A labeled, disabled tab is enough; don't let unscoped work creep into this prompt.

---

## Component inventory

| Element | Reused from | New? |
|---|---|---|
| Tab strip | shadcn `Tabs` (per `DESIGN.md` §8 rule 5 — every tab group uses this) | No |
| Member table | `DESIGN.md` §5F table conventions (reused from every list screen in this app, e.g. CRM Contacts/Companies lists) | No |
| Role pill | `StatusChip.dc.html` treatment, new role-label set | No — extended |
| Invite member modal | shadcn `Dialog` | Reuses a primitive |
| Row action menu | shadcn dropdown (already used elsewhere for row actions, e.g. CRM lists) | No |
| "Coming soon" placeholder tab content | `EmptyState.dc.html`, minimal variant (heading + one line, no CTA) | No |

## Responsive layouts

| Breakpoint | Behavior |
|---|---|
| Desktop (>1280px) | Full table with all columns visible. |
| Tablet (768–1280px) | Permissions-summary column collapses into an expandable row detail (tap row to see full permission JSON as readable text), same collapse pattern this app already uses for dense CRM tables at this breakpoint. |
| Mobile (<768px) | Table becomes a stacked card list — one member per card (name, role pill, one-line permission summary, action menu) — matching the mobile reflow already used for CRM Contacts/Companies lists. |

## States

| State | Design |
|---|---|
| Empty (only the owner, no invites yet) | Simple one-row table (just the owner) + a prominent "Invite member" CTA — not a full `EmptyState` illustration, this is an admin table, keep it plain. |
| Loading | `SkeletonLoader` `line` variant per row. |
| Success | Populated member table. |
| Invite pending | Invited-but-not-joined members show an "Invited" `StatusChip` state (this status value already exists in `StatusChip`'s enum — reuse it, don't invent a new one). |
| Error (invite failed) | Inline error text under the Dialog's email field — a real-time validation error, not a toast, per this app's "prevent mistakes" principle. |

## Accessibility notes

- The member table is a real `<table>` (or ARIA `role="table"` grid), not divs — screen readers need row/column semantics for an admin data table.
- Role pills need their text label read by screen readers, not just conveyed by color (already how `StatusChip` works elsewhere).
- The disabled Notifications/Workflow/Danger tabs need `aria-disabled` and a reason on focus (e.g. "Coming soon"), not just a visually greyed-out tab with no semantic signal.
- Invite Dialog traps focus and returns it to the "Invite member" button on close (standard `Dialog` primitive behavior — confirm it's not overridden).

## Interaction notes

- Row action menu offers role change and remove-member; removing a member is a destructive action and needs a confirm step (this app's "everything is undoable" principle — or at minimum a clear confirm, since membership removal affects RLS-gated access immediately).
- Changing a member's role updates their effective permissions immediately (per IPI-479's server-side RLS enforcement) — the UI should reflect this without requiring a page reload.
- Gate ownership (which role can approve which phase gate) is configured per-workflow, not per-member — don't add a "can approve gates" toggle to the member row; that's workflow-template configuration, out of scope for this tab per the spec's Do-NOT note ("Do NOT authorize view filtering purely on the client").

## Implementation notes

*References only — not additional design work.*

- **Related Linear:** `IPI-479` (Members tab, this screen) · `IPI-481` (Notifications tab — placeholder only, see MVP scope above)
- **Blocked by:** `IPI-476` (assignment/RLS model)
- **Unblocks:** none directly
- **React components:** `app/src/components/planner/PlannerSettings.tsx`, `InviteMemberDialog.tsx`, `app/src/app/(operator)/app/planner/[instanceId]/settings/page.tsx`
- **Supabase tables:** `planner.assignments`; edge function `planner-invite-member`
- **Mastra tools:** none — this is a pure CRUD/admin surface, no agent involvement

## Definition of done

- [ ] Desktop (full table) / tablet (expandable row detail) / mobile (stacked card list) layouts
- [ ] Full keyboard navigation (table semantics, focus-trapped Invite dialog)
- [ ] Empty (owner-only), loading, invite-pending, and invite-error states designed
- [ ] Disabled Notifications/Workflow/Danger tabs have `aria-disabled` + a reason on focus
- [ ] Destructive remove-member action has a confirm step

## Future (explicitly deferred — no Linear issue backs these today)

Workflow and Danger tab content (template swap, archive/delete instance) were considered and rejected for this pass. Ship them as labeled-but-disabled tabs only; design the real panels when an issue exists for them.
