# Linear Audit — Mastra Agents, CopilotKit/HITL, Supabase, Planner

## Stack 03 — Mastra agents and workflows (score 74/100 🟡)

### Priority issues (11)

| Dot | Task | Current status | Correct status | Action | Exact correction | Blocker |
|---|---|---|---|---|---|---|
| 🟡 | IPI-153 — DNA-003 Product linking agent | Todo | Todo | keep + fix relation | No Mercur/product-linking tool exists under `app/src/mastra/tools/`. Description says "Blocked by IPI-181"; IPI-181's structured `blocked_by` field is IPI-153 — **circular**. Pick one direction and clear the other. | circular `blocked_by` |
| 🟢 | IPI-223 — FIX GEMINI_MODEL env + registry | Done | Done | keep | `provider.ts` + `gemini-registry.ts` present, matches description. | none |
| 🟢 | IPI-227 — FIX Mastra RLS hardening | Done | Done | keep | `supabase/migrations/20260628173206_mastra_rls_hardening.sql` shipped as described. | none |
| 🟡 | IPI-133 — AIOR-017 Durable agent foundation | Done | Done | keep, note follow-up | `app/src/mastra/durable.ts` wraps `productionPlannerAgent`/`creativeDirectorAgent` as claimed. Stream cache still in-memory — correctly tracked separately as open IPI-279, don't conflate. | none for this issue |
| 🟢 | IPI-135 — AIOR-019 Agent memory foundation | Done | Done | keep | `getMastraMemory()`/`getPlannerMemory()` wired in `agents/index.ts`. | none |
| 🟢 | IPI-134 — AIOR-018 Workflow snapshots + recovery | Done | Done | keep | Consistent with IPI-129 (Postgres storage) + shoot-wizard suspend/resume gates. | none |
| 🟢 | IPI-129 — AIOR-013 Mastra durable storage (Postgres) | Done | Done | keep | Backing store confirmed wired, no in-memory LibSQL refs in registry files. | none |
| 🟡 | IPI-229 — FIX social-discovery edge deploy or retire | Done | Done | keep, fix stale text | PR #139 confirmed **MERGED** 2026-06-29 — description still says "Status: In Review." Update description only. | none |
| 🟡 | IPI-113 — AIOR-004 Agent Tool Registry | Done | Done | keep, rewrite proof | Claims `agentTools` exports "10 tools." Verified current count in `app/src/mastra/tools/index.ts:35-56` is **20 tools**. Status stays Done (DoD was met at ship time); the stale count is exactly the gap IPI-147 (still Backlog, tool-count governance) exists to close. | IPI-147 (not yet built) |
| 🟢 | IPI-429 — DOCS-GROQ-MASTRA | Done | Done | keep | Docs-only, no production claim to verify. | none |
| 🟡 | IPI-97 — WEB-015.8 Lead capture workflow (tool → edge fn → draft) | Done | Done | keep, rewrite title | Functionally shipped and correct, but there is no agent tool in this flow — `public-marketing-agent.ts` is explicitly built with zero tools (`// ponytail: no tools — public agent is read-only and unauthenticated by design`). Lead capture is chat widget → `/api/marketing-lead` REST proxy → `capture-lead` edge fn. Retitle to remove "(tool → edge fn → draft)". | none functional |

### Rewrite candidates

- **IPI-153 / IPI-181** — resolve the circular `blocked_by` in one direction.
- **IPI-113** — update the "10 tools" claim to 20, link IPI-147 as the open governance item that keeps this honest going forward.
- **IPI-97** — retitle to "(chat widget → proxy route → edge fn → draft)".
- **IPI-229** — flip description status line to Merged.

### Missing tasks (verified gap)

`/app/assets` and `/app/campaigns` both route to `creative-director`, an agent with **zero tools** (`app/src/mastra/agents/index.ts:62-70` — no `tools:` key at all). Campaigns' gap is implicitly covered by CAMP-001 (IPI-156, Backlog); there is no equivalent tracked issue for the Assets route's agent gap. Recommend opening one narrowly scoped issue (Asset DNA/tag tools on `creative-director` or a dedicated Assets agent) rather than leaving it silently assumed under Campaign work.

### Rest batch (28 issues) — patterns

Mostly legitimate Backlog/deferred items (RAG foundation, observability, multi-tenant memory, browser automation, supervisor architecture) with accurate self-descriptions — confirmed no `operator-supervisor` agent exists (IPI-109 correctly Backlog), only 2 real workflow files exist (`shoot-wizard.ts`, `brand-intelligence-workflow.ts` — matches the known "2, not 7" finding). IPI-104 correctly Canceled, superseded by IPI-135 per its own description.

---

## Stack 04 — CopilotKit and HITL (score 81/100 🟢)

### Priority issues (11)

| Dot | Task | Current status | Correct status | Action | Exact correction | Blocker |
|---|---|---|---|---|---|---|
| 🟢 | IPI-127 — AIOR-011 CopilotKit license + prod runtime config | In Progress | In Progress | keep | `COPILOTKIT_LICENSE_TOKEN` gating verified live, correctly conditioned on `OPERATOR_AUTH_ENABLED`. Ops-rollout item, not a code gap. | none |
| 🟢 | IPI-230 — FIX Prod OPERATOR_AUTH + CopilotKit license config | Done | Done | keep | `app/src/lib/operator-gate.ts` + `middleware.ts` confirmed wired exactly as claimed. | none |
| 🟢 | IPI-197 — UX Contextual Copilot Sidebar | Done | Done | keep | No contradicting evidence. | none |
| 🟢 | IPI-110 — AIOR-002 CopilotKit Operator Panel | Done | Done | keep | `route-agent-map.ts` + `operator-panel.tsx` pattern confirmed live. | none |
| 🟢 | IPI-48 — AIOR-001 Mastra Runtime Foundation | Done | Done | keep | In-process Mastra via `/api/copilotkit` confirmed. | none |
| 🟢 | IPI-218 — 3-Panel Operator Layout right-panel wiring | Done | Done | keep | `active-brand-context.tsx` present, consistent with claim. | none |
| 🟢 | IPI-50 — DASH-004 useAgentContext Global Injection | Done | Done | keep | No contradicting evidence. | none |
| 🟡 | IPI-51 — DASH-005 Route agentId Map | Done | Done | keep, close gap note | `route-agent-map.ts` confirmed current — the "remaining gaps → IPI-247" note is stale; PR #147 (IPI-247) confirmed **MERGED** 2026-06-30. Remove the stale table. | none |
| 🟢 | IPI-103 — WEB-015.5 Homepage chat widget UI | Done | Done | keep | Consistent with epic and live code. | none |
| 🟡 | IPI-102 — WEB-015.4 Public runtime /api/marketing-chat | Done | Done | keep | Confirmed isolated `publicMastra` instance, no auth gate, matches description. | none |
| 🟢 | IPI-100 — WEB-015.3 public-marketing-agent | Done | Done | keep | Confirmed zero tools by explicit design comment, matches description. | none |

### Rewrite candidates

- **IPI-51** — remove the stale "Remaining gaps → IPI-247" table (resolved).
- **IPI-475** (rest batch, AI-CHAT-001) — remove/update the "DC design files unavailable... confirmed absent" caveat; `Universal-design-prompt-new/` is now tracked in git (commits `84155521`/`dedbe3da`).
- **IPI-91** (rest batch, WEB-015 epic) — move out of Backlog. 4 of 7 direct children (IPI-97, 100, 102, 103) are Done and the chatbot is confirmed live in prod. Correct status: **In Progress**.

### Rest batch (23 issues) — patterns

IPI-111 (Human Approval Cards) and IPI-128 (`useRenderToolCall` Gen UI registry) both carry unusually accurate, already-self-audited "PARTIAL SHIP" language — verified against code: 3 domain-specific HITL cards exist (`ShotListApprovalCard`, `BudgetApprovalCard`, `DeliverableApprovalCard`), wired only in `shoots/new/page.tsx`; a separate `useRenderToolCall` usage in `copilot-tool-presentation.tsx` is a wildcard hide/debug renderer, not the per-tool Gen UI registry these issues actually want. Both correctly remain Backlog.

---

## Stack 05 — Supabase schema, RLS, RPCs, Realtime (score 78/100 🟡)

### Priority issues (7)

| Dot | Task | Current status | Correct status | Action | Exact correction | Blocker |
|---|---|---|---|---|---|---|
| 🟡 | IPI-452 — Fix migration ordering bug blocking `supabase db reset` | In Progress | In Review (ready to merge) | keep | PR #266 contains the real fix: idempotent `do $$ if to_regtype(...) is null then create type ... end if; end $$` guard, correct root-cause fix. CI green on all 4 jobs. `mergeable: UNKNOWN` — needs a rebase check before merge. | needs merge |
| 🟢 | IPI-225 — FIX Migration drift sync | Done | Done | keep | PR #130 confirmed **MERGED** 2026-06-28. | — |
| 🟡 | IPI-226 — FIX Supabase TS types regen | Done | Done (unverified proof) | keep | Branch cited (`ipi/supabase-types-sync`) has no matching PR found via `gh pr list`. Not contradicted, just unproven by a citable artifact — recommend attaching the PR # to the issue. | missing proof link |
| 🟢 | IPI-231 — FIX Supabase verify suite + edge inventory | Done | Done | keep | `supabase/functions/` now has exactly the 7 dirs the plan calls for; the two "retire" targets are confirmed gone. | — |
| 🟢 | IPI-125 — OPS-001 OAuth callback | Done | Done | keep | PR #71 confirmed **MERGED** 2026-06-25. | — |
| 🟡 | IPI-126 — Push IPI-46 migration + verify remote | Done | Done (partially verified) | keep | Migration file exists on disk/main; remote push itself not re-verified via live DB query this pass — file existence isn't proof of a remote push. | live-DB re-check |
| 🟢 | IPI-101 — WEB-015.1 DB schema + RLS + claim RPC | Done | Done | keep | Migration + RLS test file both present, consistent with archived-complete status. | — |

### Rest batch (18 issues) — patterns

Dominated by stale CLD/ANA/COM/PLT placeholder tasks generated from one boilerplate template (identical "Spec score: 84/100" on every single one — this is a templating artifact, not a real per-task quality signal, treat as noise). Individually worth acting on: **IPI-287** (Codacy false positives on Postgres migrations, real bug, fix is a `.codacy.yml` exclude — not merge-blocking today since `main` has no branch protection yet, but will bite when it's added); **IPI-241** (chatbot RLS docs, genuinely partial — only the standalone `supabase/docs/chatbot-rls.md` file is missing); **IPI-239** consistent with IPI-231's already-verified state.

---

## Stack 06 — Planner (score 55/100 🔴)

The real Planner epic is exactly: **IPI-476** (schema & engine core), **477** (shoot timeline template), **478** (timeline/kanban/calendar shell), **479** (role-based views), **480** (Realtime sync via Supabase + Durable Objects), **481** (notification rules + Cloudflare Queue fan-out), **482** (Mastra planner AI tools + CopilotKit HITL), **483** (workflow engine v2), **484** (epic tracker), plus **259** (route wiring). These don't all say "Planner" in the title — they were identified by parent-issue relationship, not keyword match.

**Naming-collision flags:** IPI-42 ("Campaign Planner Agent") is Brand/Campaign scope, not part of this epic, despite the name. IPI-115 (canceled Mastra `shoot-planner-workflow`) is historical/superseded, unrelated to the current epic. Neither appears in this stack's actual dataset — confirmed via grep — so nothing to action for them here, but don't let the name similarity cause confusion elsewhere.

### Priority issues (2)

| Dot | Task | Current status | Correct status | Action | Exact correction | Blocker |
|---|---|---|---|---|---|---|
| 🔴 | IPI-476 — Planner schema & reusable engine core | In Progress | In Progress, **SLA breached** | keep + urgent merge | PR #283 (schema, 627 LOC) and PR #284 (engine, 1012 LOC) both **OPEN**, `mergeable: MERGEABLE`, all CI checks passing. Both issues' `slaBreachesAt` is 2026-07-10 — **today, already passed**. Schema verified: exactly 10 tables, 3 enums, 37 RLS policies using security-definer helpers — matches AC A/C/D. **AC gap:** AC E requires a `createInstance` engine method; `app/src/lib/planner/engine.ts` has no such method by design (engine is intentionally pure/no-writes) — fix the AC text, not the code. Realtime is implemented via `realtime.broadcast_changes` triggers on a private channel, not a `supabase_realtime` publication — architecturally consistent with IPI-480's own design, just worth noting it differs from the repo's one genuinely-published-table pattern (`brand_crawls`). | merge is the only remaining blocker |
| 🟡 | IPI-484 — Production Planner Epic Tracker | Todo | Todo (correct, but inconsistent vs. child) | keep | Epic itself is correctly unstarted, but its own SLA (2026-07-10, also breached) sits oddly next to child IPI-476 being "In Progress" since 2026-07-09 — flag as a possible Linear template/workflow issue (tracker issues carrying their own SLA clock), not a Planner-specific defect. | same merge blocker |

### Rewrite candidate

**IPI-476** — either implement a thin, still-pure `createInstance` factory so AC E is literally true, or (lazier and more honest) edit AC E to say instance creation is a DB insert at the edge-function layer, not the pure engine — matching what was actually built.

### Move-to-another-epic

None within this stack's actual data — IPI-42/IPI-115 aren't part of it (see naming-collision note above). All 9 real Planner issues are correctly scoped to project "DESIGN V2 — Operator React Parity" with a clean, cycle-free dependency chain (476→477→478→{479,480→481,482}→483).

### Rest batch (8 issues)

All correctly Backlog, correctly blocked per the dependency chain, consistent with the epic's own Gantt — no anomalies. `production-planner` agent registration confirmed live at `app/src/mastra/agents/index.ts:25`.

### Unverifiable this pass

IPI-226/126's merge/push provenance (no citable PR); the IPI-222 "June 28 audit" family's upstream blockers (IPI-223/225-230/231/233/234, outside this stack's dataset).
