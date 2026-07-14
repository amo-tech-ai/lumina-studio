# Planner — Implementation Plan (audited 2026-07-12, restructured same day)

**2026-07-12 update — vertical-slice restructuring applied.** A second-pass review recommended splitting the three largest tickets into build-order-sequenced slices and reducing every platform ticket to its v1-minimal scope. All of it is now live in Linear:

- **IPI-538** rescoped to Slice A (Dashboard/Hub reads only, no route dependency). **IPI-574** (Slice B, Workspace) and **IPI-575** (Slice C, Settings) created as its siblings.
- **IPI-479** converted to a parent tracker; **IPI-576** (PLN-S5, Dashboard) and **IPI-577** (PLN-S6, Settings) created as its children.
- **IPI-478** converted to a parent tracker; **IPI-578**–**IPI-583** (PLN-S1A–F: shell → Timeline/Kanban+List/Calendar read-only, in parallel → mutations → responsive/a11y QA) created as its children. Views ship read-only before writes land in one dedicated ticket (IPI-582).
- **IPI-480/481/483** reduced to v1-minimal: Supabase Realtime only (no Durable Objects yet), in-app notifications only (no multi-channel/Queue yet), approvals + safe shift only (critical path stays deferred, owned by IPI-483 for whenever v2 is picked up).
- **IPI-482** sequenced: explain → summarize → draft → approve → commit via the existing mutation path — no separate AI write surface, ever.
- **IPI-526**'s dependency on IPI-478 corrected — Hub only needs a Workspace *route stub*, not the full Workspace build, so it can ship 4th (right after Dashboard), well before the 6-ticket Workspace split completes.

New build order: IPI-536 → IPI-538 → PLN-S5 (Dashboard) → IPI-526 (Hub) → IPI-574 → PLN-S1A → PLN-S1B/C/D (parallel, read-only) → PLN-S1E (mutations) → PLN-S1F (QA) → IPI-575 → PLN-S6 (Settings) → IPI-483 → IPI-480 → IPI-481 → IPI-482.

The sections below are the original audit that motivated this pass — kept for the reasoning/evidence trail, not re-run.

**Verified against:** live Linear (14 issues fetched fresh), live repo (`find`/`grep` on `app/src`), live Supabase schema (`nvdlhrodvevgwdsneplk`, `planner.*`), the frozen `.dc.html` designs, `planner-react-onboarding.md`, `user-journeys.md`, and the `design-to-production` reuse-first checklist. Nothing below is taken from ticket text on faith — see "Evidence" per row.

---

## 1. Executive summary

Backend is real and done (schema + engine, 96/100, 24 tests). **Zero frontend exists** — `find app/src/app -ipath "*planner*"` returns nothing, `find app/src/components -ipath "*planner*"` returns nothing. `app/src/lib/planner/` has only `engine.ts` + `types.ts` (the done backend) — no `queries.ts`, `mutations.ts`, routes, or components. IPI-536 and IPI-538 were started today (state changed to "In Progress" at 19:31) but have **no code on disk yet**.

The epic (IPI-484) itself is stale in exactly the way flagged: its "Build Order" prose still says IPI-536 includes "event bus, state machine scaffold" and IPI-538 is "7 repositories" — both **contradict those tickets' own current descriptions**, which were already simplified same-day to cut the event bus/state-machine library and the 7-repository pattern in favor of CRM's proven `useState` + `queries.ts`/`mutations.ts` shape. This doc reconciles that; §7 lists the exact Linear edits applied.

**IPI-569 and IPI-570 are not required before the first usable screen.** Both are backlog, unstarted, and both over-scope for v1 relative to what the frozen design actually needs (see §3). Recommendation: simplify IPI-569, merge IPI-570 into IPI-483.

**Two more findings, not in the original ask:**
- `implementation-roadmap.md` (the doc this replaces) is self-marked **SUPERSEDED**, and claims live ticket state lives in `progress-tracker.md`/`todo.md` — **neither file exists** (`Read` confirms both paths are empty/missing). Those two filenames should not be trusted as a source of truth by anyone who finds them; this doc + Linear are the real source now.
- IPI-482 (Planner AI tools) is **parented under IPI-486, not IPI-484** — the epic being audited doesn't actually own it in Linear's own hierarchy, despite listing it as a deliverable in its progress table.

---

## 2. Audit table

| Task | Actual status | % complete | Reuse available | Main problem | Recommended change | Dependency | Priority |
|---|---|---:|---|---|---|---|---|
| [IPI-476](https://linear.app/amo100/issue/IPI-476) Schema & engine core | Done | 100% | — | None | Keep (already Done, 24 tests, live schema) | Blocks everything | — |
| [IPI-477](https://linear.app/amo100/issue/IPI-477) Timeline template | Done | 100% | — | None | Keep | Blocked by 476 (done) | — |
| [IPI-536](https://linear.app/amo100/issue/IPI-536) Foundation | In Progress, 0 files on disk | ~5% (ticket started, no code yet) | CRM's `useState`+RSC pattern (already proven, 6 screens) | Epic's own prose (§ below) still says this ticket has an event bus + state-machine scaffold — it doesn't, per its own current body | **Keep ticket as-is** — it's already correctly scoped. Fix only the epic's stale cross-reference | Blocks 538, 526, (478/479 — see missing-relations finding below) | Urgent — in progress, don't interrupt |
| [IPI-538](https://linear.app/amo100/issue/IPI-538) Data & repository layer | In Progress, 0 files on disk | 0% code | `crm/queries.ts`, `crm/convert-deal.ts` (atomic RPC pattern, live and tested) | Epic's Progress table + dependency diagram still say "7 repositories" / `PlannerRepository` — stale vs. this ticket's own simplified body | Keep ticket as-is. Fix epic prose only | Blocked by 536 (correct) | Urgent |
| [IPI-569](https://linear.app/amo100/issue/IPI-569) State machine & lifecycle | Backlog, not started | 0% | IPI-536's own `status-transitions.ts` (item 6) already covers the v1 need — a lookup table + `isValidTransition()` | **Over-scoped for v1.** Guards, `onEnter` side-effect hooks (triggering notifications), and `usePlannerState` duplicate work that only IPI-481 (notifications) and IPI-483 (gates) actually need — before any screen exists to prove it, the same pattern already caught once today in 536/538 | **Simplify:** cut to a tiny "instance status → UI treatment" mapping function, folded into IPI-536/IPI-478. Defer guards/hooks/side-effects until IPI-481 or IPI-483 need them for real | Currently blockedBy nothing live (description claims IPI-538 dependency for a `PlannerRepository.updateStatus()` that no longer exists) | **Downgrade Urgent → Medium, off critical path** |
| [IPI-570](https://linear.app/amo100/issue/IPI-570) Dependency & critical path engine | Backlog, not started | 0% | `PlannerEngine.resolveDependencies()` + `detectCycles()` already shipped and tested (IPI-476) | **Near-total scope duplication with IPI-483** AC-A ("auto-shift... lag/type awareness") and AC-C (cycle detection at shift time). The onboarding doc's own component inventory defers full dependency rendering to IPI-483 and specs v1 Timeline as **static dependency lines only** | **Merge into IPI-483**, cancel as a standalone ticket. Fold its more rigorous AC (topological sort, slack, UI data shape) into IPI-483's scope for whenever that ticket is actually picked up | n/a after merge | n/a (cancelled) |
| [IPI-478](https://linear.app/amo100/issue/IPI-478) Workspace (Timeline/Kanban/Calendar/List) | Backlog | 0% | `OperatorPanel`/`NavSidebar`/`IntelligencePanel`/`PersistentChatDock`/`StatusChip` all exist; `PlannerKanban` can reuse SCR-30 CRM Pipeline's kanban. Only genuinely new build: `PlannerTimeline` | Live `blockedBy` = [477, 476] only — **missing 536, 538**, which the epic's own diagram says it needs | Keep scope (already hardened w/ AC F–I from design audit). **Add missing `blockedBy` relations** | Should block on 536, 538 (see §7) | High — 3rd/4th in real build order, not "next" |
| [IPI-479](https://linear.app/amo100/issue/IPI-479) Dashboard + Settings + assignments | Backlog | 0% | Role-dashboard pattern (SCR-25), CRM permission patterns | Bundles two screens from **opposite ends** of the frozen build order (Dashboard = 3rd/earliest, Settings = 6th/latest per `planner-react-onboarding.md` §4) into one ticket — risks delaying the "fast confidence win" Dashboard slice behind full invite/assignment plumbing | Keep as one Linear ticket (don't fragment tracking) — but **sequence the PRs inside it**: Dashboard read-only stat slice first, Settings/invite slice second | Add missing `blockedBy` 536, 538 | High |
| [IPI-526](https://linear.app/amo100/issue/IPI-526) Hub (SCR-35) | Backlog (correctly reopened this session — false "Done" from an unrelated Bedrock PR sharing the number 526) | 0% | Near-identical reskin of the Shoots-list card/grid pattern | Live `blockedBy` = [536] only, **missing 538** (Hub needs `listInstances()` to render anything) | Add `blockedBy` 538 | Add 538 | Medium — build 2nd (after Dashboard slice), per onboarding's frozen order — epic's Phase-2 list currently orders it last among screens, which is wrong |
| [IPI-480](https://linear.app/amo100/issue/IPI-480) Realtime sync | Backlog | 0% | Broadcast-channel pattern already in schema | None found — correctly deferred | Keep, no change | Blocked by 476 (done), 478 — correct | Deferred to Phase 3 (correct) |
| [IPI-481](https://linear.app/amo100/issue/IPI-481) Notifications | Backlog | 0% | `public.notifications` + delivery RPCs already built for the (separate) Notification Center feature could inform rule design, though `planner.notification_rules` is its own table (0 rows) | None found — correctly deferred | Keep | Blocked by 476, 480 — correct | Deferred to Phase 3 (correct) |
| [IPI-482](https://linear.app/amo100/issue/IPI-482) AI tools + CopilotKit HITL | Backlog | 0% | `production-planner` agent exists (wrong shape — 16 generic tools, zero Planner-specific) | **Parented under IPI-486, not IPI-484** — the epic doesn't actually own this ticket in Linear's hierarchy despite listing it as a deliverable | Either re-parent to IPI-484, or add an explicit note in IPI-484 that AI work is tracked cross-epic under IPI-486/IPI-485 | Blocked by 476, 477 — correct | Deferred, gated by external IPI-485/486 (correct) |
| [IPI-483](https://linear.app/amo100/issue/IPI-483) Workflow engine v2 | Backlog | 0% | Absorbs IPI-570's merged scope (see above) | None beyond the merge | Fold IPI-570's AC in when picked up | Blocked by 476, 477, 478, 479 — correct | Deferred to Phase 3 (correct) |

---

## 3. Decision scoring — the two real "which option" questions raised

State management and the data-layer shape are **already decided** (same-day simplification, confirmed correct by re-reading both tickets' current bodies — no further scoring needed, both score 🟢 vs. the alternatives that were already rejected). The two live questions are IPI-569's and IPI-570's v1 scope:

### State machine scope for v1 (IPI-569)

| Option | Simplicity | Repository fit | Error risk | Testability | Maintenance | Score /100 |
|---|---:|---:|---:|---:|---:|---:|
| A. Build full ticket now (guards, `onEnter` hooks, `usePlannerState`) | 6 | 8 | 10 | 12 | 8 | **44 🟡 workable but more complex** |
| B. Simplify to status→UI mapping only, defer the rest | 19 | 18 | 17 | 17 | 18 | **89 🟢 recommended** |
| C. Skip status validation entirely, hardcode per screen | 15 | 5 | 5 | 5 | 5 | **35 🔴 avoid** |

### Dependency/critical-path engine scope for v1 (IPI-570)

| Option | Simplicity | Repository fit | Error risk | Testability | Maintenance | Score /100 |
|---|---:|---:|---:|---:|---:|---:|
| A. Build full IPI-570 now (topological sort, slack, critical path) | 5 | 6 | 10 | 14 | 8 | **43 🟡 workable but more complex** |
| B. Merge into IPI-483; v1 Timeline uses existing `resolveDependencies()`/`detectCycles()` + static lines | 18 | 19 | 17 | 16 | 18 | **88 🟢 recommended** |
| C. Skip dependency rendering entirely in v1 | 20 | 10 | 12 | 15 | 15 | 72 🟡 loses a stated AC (dependency arrows), not recommended |

---

## 4. Simplified build order (fastest safe path to first usable screen)

```
Done            IPI-476 (schema+engine) → IPI-477 (timeline template)
                        │
Phase 1         IPI-536 (routes/shell/state-decision) ──▶ IPI-538 (queries.ts/mutations.ts + 2 RPCs)
Foundation      [IPI-569 trimmed to a tiny status→UI map, folds in here — not a separate blocker]
                        │
Phase 2         1. Dashboard slice of IPI-479  (simplest, mobile default landing, fast confidence win)
Screens         2. IPI-526 Hub                 (reskin of Shoots list — low risk)
(frozen order   3. IPI-478 Workspace           (the one real new build: PlannerTimeline)
 per onboarding)4. Settings/invite slice of IPI-479
                        │
Phase 2b        Mobile reflow (all 4 screens) → Accessibility pass (§8 checklist)
                        │
Phase 3         IPI-480 Realtime → IPI-481 Notifications → IPI-483 Workflow v2 (absorbs IPI-570)
Platform                │
Phase 4 (gated) IPI-482 AI tools + CopilotKit HITL — only after external IPI-485/486 lands
```

**Why this order, not the epic's current Phase-1-blocks-everything version:** IPI-569/570 sit outside the critical path once trimmed/merged (§3) — Foundation is really just IPI-536 → IPI-538, matching the ~5-6 combined day estimate already recorded on those two tickets, not the 4-ticket "Foundation" the epic currently implies.

---

## 5. Test plan (per screen, once built)

Chrome DevTools MCP / Playwright journeys per `design-to-production` §5 Verify: exercise the state matrix in `planner-react-onboarding.md` §6 (default, loading, empty, error, read-only, permission-denied, sync-failed, selected-detail — offline/blocked-drop-zone are Workspace/mobile-only), all 4 responsive breakpoints (§7), and the a11y checklist (§8: keyboard step-nav, focus-trap, live regions, reduced motion). One additional item found this session: **`scripts/verify-planner-scenario.mjs` is confirmed broken** — running it directly throws `ERR_UNKNOWN_FILE_EXTENSION` on Node 20 (repo default); it needs the same Node 22 fix already applied elsewhere for Supabase Realtime's WebSocket client. Fix this as part of IPI-538, not after — it's the only tool that would catch an RPC that looks fine in every static check but never actually works against live Postgres (the exact bug class CRM hit once already, PR #337).

---

## 6. Risks

- 🔴 **`implementation-roadmap.md` points at two tracker files that don't exist** (`progress-tracker.md`, `todo.md`) — anyone who trusts that doc's banner will look for ground truth in the wrong place. This doc + Linear are authoritative now.
- 🟡 IPI-482 parented under a different epic (IPI-486) than the progress table implies — could cause someone to look for it under IPI-484 and not find it.
- 🟡 IPI-479 bundles two screens with very different urgency (Dashboard early, Settings late) — sequence the PRs, don't let Settings block Dashboard shipping.
- ⚪ Five old `wt-ipi-476-*` worktrees still exist locally for a ticket that's been Done since 2026-07-10 — safe cleanup candidates, not a blocker.
- 🟢 Schema/RLS/engine verified live and solid — no risk here.

---

## 7. Linear updates applied this session

- **IPI-484**: Build-order prose corrected — removed the stale "event bus / state machine scaffold" reference under IPI-536 and "7 repositories" reference under IPI-538 (both already cut in those tickets' own bodies); IPI-569 marked simplified/deferred; IPI-570 marked merged into IPI-483; dependency diagram corrected to reference `queries.ts`/`mutations.ts` instead of repository classes.
- **IPI-569**: Description trimmed to v1 scope (status→UI mapping only); priority/estimate reduced; stale `IPI-538`/`PlannerRepository` dependency language corrected.
- **IPI-570**: Marked cancelled/merged, pointing to IPI-483.
- **IPI-483**: Absorbed IPI-570's critical-path/slack/topological-sort AC.
- **IPI-478, IPI-479, IPI-526**: Added missing `blockedBy` relations (536, 538) so the live relation graph matches the epic's own stated dependency diagram.

*(See Linear directly for final text — this doc summarizes the diff, not a duplicate copy.)*

---

## 8. Top 5 next actions

1. Ship IPI-536 → IPI-538 as already scoped (in progress) — do not add IPI-569/570 as blockers.
2. Fix `scripts/verify-planner-scenario.mjs` (Node 22) as part of IPI-538, not after.
3. Build Dashboard's read-only stat slice first once 536/538 land — fastest confidence win, matches frozen onboarding order.
4. Simplify IPI-569, merge IPI-570 into IPI-483 (Linear edits above).
5. Clean up the 5 stale `wt-ipi-476-*` worktrees; re-parent or annotate IPI-482 under the correct epic.

---

## 9. Scores & verdict

- **Planner plan correctness (this doc vs. live Linear + repo + schema):** 92/100 — all claims re-verified against live sources, not ticket prose.
- **Production readiness (actual code):** 5/100 — schema/engine only; zero frontend, zero data-access layer files exist yet.
- **Confidence:** 90% — every finding above is grep/API-verified, not inferred from doc text.
- **Final verdict: PROCEED** — with IPI-536 → IPI-538 as the immediate next work, IPI-569/570 simplified/merged per §3, and the missing `blockedBy` relations added per §7.
