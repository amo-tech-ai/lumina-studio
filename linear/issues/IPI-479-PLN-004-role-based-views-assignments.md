# IPI-479 · PLN-004 — Role-based views + assignments

**Role:** You are implementing this as an iPix engineer. One concern per PR.

**Linear:** https://linear.app/amo100/issue/IPI-479
**Track:** UI
**Blocked by:** IPI-476, IPI-478 · **Unblocks:** IPI-480, IPI-483
**Skills:** ipix-task-lifecycle · ipix-supabase · frontend-design · worktrees · pr-workflow
**MVP proof:** #1

---

## The problem this solves

- In a production plan, a model, photographer, retoucher, and client all need different information.
- Today, everyone sees the same schedule tab, which leaks details and creates noise.
- There is no way to assign owners to phases or restrict who can approve gates.

**Fix:** Add instance-level role assignments and permission-aware views so each user sees only what matters to them.

---

## User story

> As a retoucher, when I open a production plan,
> I see only retouching tasks and approvals relevant to my role,
> so I can focus without being overwhelmed by unrelated work.

---

## Wireframe — Role Dashboard

```
┌────────────────────────────────────────────────────────────────┐
│  Good morning, Maya — here's your production week               │
├────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────────┐  ┌────────────────┐   │
│  │ My Tasks 8   │  │ Needs Approval 2 │  │ At Risk 1      │   │
│  └──────────────┘  └──────────────────┘  └────────────────┘   │
│                                                                 │
│  Recent plans                                                   │
│  [Summer Lookbook] [CRM — Acme Co] [Fall Campaign]             │
│                                                                 │
│  Upcoming this week                                             │
│  Mon [Item delivery] Tue [Outfit confirmation] ...             │
└────────────────────────────────────────────────────────────────┘
```

**States:**

| State | What to show |
|---|---|
| Empty | "You are not assigned to any plans yet" + invite CTA for owners |
| Loading | Stat card skeletons + plan list shimmer |
| Success | Personalized cards and calendar strip |
| Error | Inline retry + support link |

---

## Acceptance criteria

- **A — Assignment model:** `planner.assignments` links a user to an instance with a role (`producer`, `photographer`, `retographer`, `model`, `client_approver`, `stylist`, `coordinator`) and a `permissions` JSONB.
- **B — Role presets:** Default permission sets per role; instance owners can customize.
- **C — Invite flow:** Instance owner can invite users by email/role from the planner settings panel.
- **D — Filtered views:** Timeline/kanban/calendar hide tasks the user is not allowed to see; "My tasks" filter shows only assigned tasks.
- **E — Role dashboard:** `/app/planner/dashboard` shows per-user stats: My Tasks, Needs Approval, At Risk, Recent plans, upcoming calendar strip.
- **F — Gate ownership:** Approval gates show only to users whose role matches `phase.required_role`.

---

## Technical notes

**Files to touch:**
- `app/src/lib/planner/permissions.ts` — role presets + effective permission resolver.
- `app/src/components/planner/RoleDashboard.tsx` — personalized landing.
- `app/src/components/planner/InviteMemberDialog.tsx` — invite by email/role.
- `app/src/components/planner/PlannerSettings.tsx` — members + roles tab.
- `app/src/app/(operator)/app/planner/dashboard/page.tsx` — dashboard route.
- `app/src/app/(operator)/app/planner/[instanceId]/settings/page.tsx` — settings route.
- `supabase/functions/planner-invite-member/index.ts` — service-role invite + email.

**Do NOT:** Authorize view filtering purely on the client; RLS must enforce the same rules server-side.

**Known data / constraints:** Roles are string slugs aligned with existing iPix personas; permissions JSONB schema is versioned (`v1`).

---

## Out of scope

- Real-time presence (IPI-480)
- Notifications (IPI-481)
- AI assignment suggestions (IPI-482)
- Workflow gate logic (IPI-483)

---

## Wiring plan

| Action | Path | Notes |
|--------|------|-------|
| Create | `app/src/lib/planner/permissions.ts` | Permission resolver |
| Create | `app/src/components/planner/RoleDashboard.tsx` | Dashboard |
| Create | `app/src/components/planner/InviteMemberDialog.tsx` | Invite UI |
| Create | `app/src/components/planner/PlannerSettings.tsx` | Settings tabs |
| Create | `app/src/app/(operator)/app/planner/dashboard/page.tsx` | Dashboard route |
| Create | `app/src/app/(operator)/app/planner/[instanceId]/settings/page.tsx` | Settings route |
| Create | `supabase/functions/planner-invite-member/index.ts` | Invite edge fn |

---

## Verify

### Per-task (Phase 3)
| Task | Test command | Proof |
|------|--------------|-------|
| 1 — Permission resolver | `cd app && npx vitest run src/lib/planner/permissions.test.ts` | All presets pass |
| 2 — Invite flow | Edge fn smoke | Member row created |
| 3 — Filtered UI | Browser login as retoucher | Only retouching tasks visible |

### Aggregate (Phase 4)
- [ ] `cd app && npm run lint && npm run typecheck && npm test`
- [ ] `cd app && npm run build`
- [ ] `npm run supabase:verify-rls`
- [ ] Browser smoke: role dashboard @ 375px + 1280px
- [ ] `tasks/plan/todo.md` row → green · Linear → Done
