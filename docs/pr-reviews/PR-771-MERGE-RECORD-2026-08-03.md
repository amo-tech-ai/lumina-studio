# PR #771 — Merge Record

**Task:** IPI-582 · PLN-S1E — Editable task detail and updateTask
**PR:** `IPI-582 · PLN-S1E — Editable task detail and updateTask` (#771)
**Merge SHA:** `20039e342ae19d12ae54572e1f2843564497bd3f` (squash, `main`)
**Merged:** 2026-08-03 14:24:00 -0400

---

## Purpose

Adds an editable task detail form to the Planner AdaptivePanel so Producers can edit a task's title, description, status, and assignee in place instead of viewing a read-only card. Saves go through the existing IPI-649 `updateTask` Server Action, with pending-state handling, double-submit protection, client-side validation, and `STALE_VERSION` recovery (Reload latest) so two operators editing the same task cannot silently overwrite each other's work. Priority and dates remain display-only; Viewers stay read-only.

Single concern per the repo's one-concern-per-PR rule: AdaptivePanel editable task detail + `updateTask` wiring only. Keyboard/date moves (`shiftTask`), view-preference persistence (`setViewConfig`), ApprovalCard/gate approval UI, drag-and-drop, and priority/date editors are explicitly out of scope (tracked separately below).

## Files / systems changed

- `app/src/app/(operator)/app/planner/[instanceId]/selection-actions.ts` — task selection now also returns `canUpdateTasks` (via `getEffectivePermissions`, fail-closed on error) and assignee options (via `planner_get_member_names`, viewer+ scoped); new exported type `PlannerAssigneeOption`; auth helper now returns the authenticated Supabase client for reuse.
- `app/src/components/planner/planner-selection-detail.tsx` — `PlannerTaskDetail` gains editable mode (title, description, status, assignee) alongside the existing read-only mode; new exported types `TaskSelectionRefresh`, `PlannerTaskDetailProps`; component signature changed from `({ task, onClose })` to `(PlannerTaskDetailProps)`.
- `app/src/components/planner/adaptive-panel.tsx` — adds a memoized `refreshTaskSelection` callback to re-resolve the selected task after save or `STALE_VERSION` reload; wires update permissions/assignees/refresh into `PlannerTaskDetail`.
- `app/src/lib/planner/types.ts` — `PlannerTask.updatedAt?: string` added as the optimistic-concurrency (CAS) token.
- `app/src/lib/planner/queries.ts` — `toTask` maps `updated_at`; `getInstanceDetail`'s task column selection now explicitly includes `updated_at`.
- `app/src/lib/planner/engine.ts` — `buildSchedule` initializes proposed tasks' `updatedAt` to `""` (DB supplies the real value post-persist).
- Test files updated in lockstep: `adaptive-panel.test.tsx`, `planner-selection-detail.test.tsx`, `engine.test.ts`, `mutations.test.ts`, `queries.test.ts`.

No migrations, RPC, or database schema changes — this PR consumes `planner.tasks.updated_at` and the existing `updateTask`/`getEffectivePermissions`/`planner_get_member_names` contracts as-is.

## Tests / CI at merge

- Focused vitest suites (`planner-selection-detail`, `adaptive-panel`, `queries`, `engine`, `mutations`): 157 passed.
- `npx tsc --noEmit`: clean.
- Full pre-push suite: 2,855 passed, 10 skipped.
- Browser verification checklist unchecked at merge time (deferred, see Known limitations):
  - Open a task in AdaptivePanel as Producer, edit assignee/status, confirm save + `STALE_VERSION` Reload latest (SCR-32)
  - Confirm Viewer sees no Save control

## Production impact

Producers can now edit a Planner task's title, description, status, and assignee directly from the AdaptivePanel; the change is committed through the existing `updateTask` Server Action and revalidates every Planner surface (Timeline, Kanban, Calendar, List, Now & Next) from the same committed result. Viewers continue to see read-only detail with no Save control. Concurrent edits are protected by an idempotency key plus optimistic-concurrency (`expectedUpdatedAt`) checks; a conflicting save surfaces `STALE_VERSION` with a non-destructive "Reload latest" action that preserves the operator's unsaved draft until they choose to reload.

## Known limitations

- No `shiftTask` keyboard/date moves, `setViewConfig` view persistence, ApprovalCard/gate approval UI, drag-and-drop, or priority/date editors — explicitly out of scope for this PR.
- Priority and dates remain display-only; the IPI-649 `updateTask` adapter has no priority patch and schedule moves belong to a follow-up PR.
- Browser validation (SCR-32 Producer edit/save/reload flow; Viewer no-Save-control confirmation) was still pending at merge time — not yet independently re-verified by this record.

## Rollback / cleanup notes

- Code-only change (no migrations, secrets, feature flags, or infrastructure touched) — revertable with `git revert 20039e3` if needed.
- No new environment variables or deployment steps to clean up.

## Follow-up tasks

- PR2 — `shiftTask` keyboard/date move (#772)
- PR3 — `setViewConfig` view-tab persistence (#773)
- PR4 — ApprovalCard / IPI-483 gate contract (blocked on IPI-483)
- Complete the pending browser validation checklist (SCR-32 Producer flow; Viewer no-Save-control confirmation)