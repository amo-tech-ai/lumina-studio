# Reuse-first checklist — run before creating any task

**Rule:** the first responsibility on any new screen is not to create tasks — it's to find the simplest proven implementation already sitting in this repo. Never assume a screen must be built from scratch. This is the DC-conversion-specific expansion of `ponytail`'s general ladder (does this need to exist → does it already exist → stdlib → native → installed dep → one line → only then write code) — same philosophy, applied here to every category a screen touches.

**Proof this works, not theory:** applied ad-hoc to the Planner setup tickets (2026-07-12) — grepping CRM's existing pattern before planning Planner's data layer cut IPI-536 from Medium→Small (3-4 days→2) and IPI-538 from Medium→Small-Medium (5-6 days→3-4), by reusing `crm_convert_deal`'s RPC-atomicity pattern and CRM's plain-`useState` convention instead of inventing an event bus, a state machine, and a 7-file repository pattern that nothing else in the app uses.

---

## Stop-and-prove gate (answer every row before writing a task)

| Question | Where to check |
|---|---|
| Does this already exist? | `graphify query`, then grep |
| Where is it used? | Grep call sites, not just the definition |
| Can it be reused as-is? | Read the component/function signature — does it already accept what this screen needs? |
| Can it be extended (REUSE+) instead of forked? | Add a prop/param, don't copy the file |
| Is there an official recommended pattern? | Next.js/Supabase/React docs, `WebSearch` if unsure — see IPI-536/538 simplification for the playbook |
| Is there already a repository-wide convention? | What do the other 6 CRM screens / other features actually do, not what a ticket says to do |
| Is this the simplest solution that satisfies the AC? | If two approaches both work, take the one with fewer new files |
| Is there a lower-risk solution? | Prefer a pattern that's already shipped and tested over a novel one |
| Can two planned tasks become one? | Merge before splitting further |
| Can one existing component replace three planned ones? | Check shared primitives (`EmptyState`, `ErrorState`, `Skeleton`, `StatusChip`) before planning screen-local versions |
| Is this over-engineered relative to what shipped for a comparable screen? | Compare against the closest already-built screen, not an ideal abstraction |

**Only if every relevant row is genuinely "No, nothing to reuse" does new work get planned.** A checklist answered "no" without checking is worse than not having the checklist — every "No" needs the grep/search that proves it.

## Reuse-search categories (check each, not just "components")

Don't stop at UI components — a screen touches all of these, and each has its own reuse surface:

| Category | Search example |
|---|---|
| Layouts / shells | `OperatorPanel`, `NavSidebar`, `IntelligencePanel`, `PersistentChatDock` — never rebuild these |
| Pages | Does a sibling route already do 80% of this (e.g. another list screen, another detail screen)? |
| Components | Cards, dialogs, tables, filter bars — `rg "ComponentName" app/src/components` |
| Hooks | `usePlannerPermissions`-style hooks — is there already a hook for this concern? |
| Services / data access | `lib/crm/queries.ts`-style typed functions — one file of functions, not a new abstraction |
| API routes | `app/src/app/api/**` — does an existing route already do this, or close to it? |
| Supabase queries / RPCs | Does an existing RPC (like `crm_convert_deal`) already prove the atomicity/permission pattern this needs? |
| CopilotKit integrations | Is there already an agent + tool wired to this route via `route-agent-map.ts`? |
| Mastra tools | `mastra/tools/**` — a tool for an adjacent domain may need only a new instance, not new code |
| Workflows | Gate/approval flows — reuse the `ApprovalCard`/HITL pattern, don't invent a new one |

## Priority order when multiple options exist

1. Official documentation (Next.js/Supabase/React current best practice — `WebSearch` when genuinely unsure, not from training-data assumptions)
2. An existing repository-wide pattern (what the rest of this app already does)
3. An existing shared component/hook/service
4. Existing backend (a table/RPC/route that's close but not exact — extend it)
5. Existing workflow (gate/approval/agent pattern already proven elsewhere)

Never invent a new pattern if one of the above already covers it.

---

## Research report — produce this before the task list, not after

Once the checklist above is done, write the findings up before creating any Linear tickets. Ten sections, terse — this is a decision record, not documentation:

```markdown
1. Executive Summary — one paragraph: what's being built, biggest reuse win found
2. What already exists — table: file/component/route → what it does today
3. What can be reused — REUSE / REUSE+ / NEW classification per element (design-to-production §3 Plan format)
4. What must actually be built — the genuinely new pieces, and why nothing existing covers them
5. Simplified architecture — the smallest shape that satisfies the AC (see IPI-538's queries.ts/mutations.ts as the reference shape, not a repository-class pattern)
6. Linear task plan — small, independent, dependency-ordered tasks; each produces visible progress
7. Dependency order — what blocks what, as real Linear `blockedBy` relations, not just prose
8. Test plan — Chrome DevTools MCP + Playwright journeys, per design-to-production §5 Verify
9. Risks — 🔴 blocker · 🟡 risk · ⚪ assumption · 🟢 verified, per item
10. Final recommendation — smallest, safest, fewest-new-moving-parts option, named explicitly
```

This is the same shape as [`report-template.md`](report-template.md) but run *before* implementation instead of after — the pre-work proof that reuse was actually checked, not assumed.

---

## When this doesn't apply

Skip the full gate for a one-line fix or a change scoped entirely inside one already-identified file (e.g. fixing a skeleton row count). The gate is for "what should this new screen/feature be built from," not every edit.
