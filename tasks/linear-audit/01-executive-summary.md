# iPix / FashionOS — Linear Forensic Audit — Executive Summary

**Date:** 2026-07-10 · **Scope:** all 488 issues on Linear team `iPix1` (project "ALL issues.csv" export, cross-checked live via Linear MCP), audited across 6 independent forensic passes covering all 15 requested stacks. Every issue was assigned to exactly one primary stack (no double-counting); `99` overflow bucket ended up empty — all 488 issues classified. Full per-stack detail lives in `02`–`05`; the complete per-task correction table is in `06-task-corrections.md`; the concrete Linear edit list awaiting approval is in `07-linear-update-plan.md`.

**Method:** every "Done"/"In Progress"/"In Review"/"Todo" issue (161 total, the ones making an active claim) got full per-field forensic treatment — verified against `origin/main` (not local worktree state, which was confirmed 23 commits behind and on a conflicted branch), `gh pr list/view`, live Supabase queries, and direct code/migration grep. "Backlog"/"Canceled"/"Duplicate" issues (327 total) got a lighter pattern-level pass, with individual issues flagged only where something looked wrong.

## 1. Executive verdict

| Score | Value | Basis |
|---|---:|---|
| **Overall task accuracy** | **68/100** 🟡 | Most Done issues are genuinely backed by merged code (a strong majority). But a consistent, repeated failure pattern surfaced in every single stack: issues claiming a component/table/screen "already exists" or "is live" when it doesn't (worst case: IPI-336 claims a 13-screen onboarding funnel that was never built; IPI-351 claims a Cloudinary pipeline is verified when the live table has 4 stale seed rows). This is the same failure mode flagged in the prior architecture-diagram audit — it's systemic, not isolated. |
| **Linear status accuracy** | **73/100** 🟡 | ~12 of 161 actively-tracked issues have a wrong status field — a ~93% raw hit rate, but the wrong ones are disproportionately consequential (2 epics, 1 acceptance gate, 1 onboarding claim, 2 stale "In Progress" items that are actually Done, 1 "Done" that must reopen). Status hygiene degrades specifically at epic/tracker level — child-vs-parent status frequently disagrees (IPI-484 Todo vs. child IPI-476 In Progress; IPI-486 Todo despite Done children; IPI-91 Backlog despite 4 Done children). |
| **Dependency quality** | **58/100** 🟡 | Recurring pattern across every stack: `blocked_by` fields point at issues that were later Canceled/Duplicated rather than being repointed to the real successor (IPI-367→dead IPI-366, IPI-369→canceled IPI-365), and several "soft blocker" notes never got updated after the blocking work shipped (IPI-374, IPI-276, IPI-265). One genuine circular dependency found (IPI-153⇄IPI-181). None of this blocks execution today, but it will actively mislead anyone doing dependency-based sequencing without independent verification. |
| **Production readiness** | **27/100** 🔴 | Consistent with the prior architecture audit's 25/100 — this pass refines it slightly upward given Shoot/Booking (90) and Notifications-backend (86) are genuinely strong. Still blocked on: AI Gateway unwired, no rollback script, no monitoring, no OpenNext CI job, Campaign at schema-only, Planner UI at zero code, CRM's Won/Lost gate has zero code despite CRM being labeled "mature" in `prd.md`/`roadmap.md`. |
| **Will the roadmap succeed?** | **Yes, directionally** — conditional on merging what's already sitting in green PRs and closing the status-hygiene gap, not on solving new architecture problems. Every major blocker below is "finish/merge/fix," not "redesign." |

## 2. Top 10 blockers (ranked)

1. **Planner backend (PR #283 schema + PR #284 engine) is CI-green, mergeable, and already past its own SLA-breach timestamp (2026-07-10).** This is the single highest-leverage unmerged work in the whole audit — it unblocks the entire Planner UI track. *(Stack: Planner)*
2. **AI Gateway is deployed but nothing calls it** — zero `AI_GATEWAY_URL` references anywhere in `app/src`; `IPI-454` AC-F is the tracked task, blocked on PR #271 merging first (which carries the provider-registry types IPI-457 needs). *(Stack: AI Gateway)*
3. **IPI-336 ("13-screen Zeely onboarding funnel") is marked Done with zero corroborating code** — the live route is still the original 3-step wizard from IPI-11, last touched a week *before* IPI-336's claimed completion date. This is the single most misleading status in the audit and should be corrected before anyone plans against it. *(Stack: Brand/onboarding)*
4. **IPI-351 (Cloudinary pipeline verification gate) is marked Done but the live `cloudinary_assets` table has only 4 rows, all older than the pipeline itself** — seed artifacts, not proof of real webhook traffic. Reopen and gate on IPI-432 (E2E smoke test) actually running. *(Stack: Assets/Cloudinary)*
5. **Campaign has zero API/Agent/UI Linear issues opened** — schema is real and merged (IPI-268), but the next 4 roadmap milestones (API→Agent→UI→AI) don't exist as tracked work yet, and the live `/app/campaigns` stub points at a dead legacy issue ID (`IPI2-119`). *(Stack: Campaign)*
6. **PR #271 (Cloudflare platform architecture doc + AI provider registry types) is open and blocks two "Complete"-claiming issues (IPI-469, IPI-471) plus the AI Gateway chain (IPI-457→IPI-454 AC-F).** One merge unblocks three separate audit findings at once. *(Stack: Cloudflare)*
7. **PR #267 (production error boundaries for operator routes) is real, complete code sitting unmerged** — zero `error.tsx` files exist on `origin/main` today, meaning unhandled route errors currently show default Next.js error screens in production. *(Stack: Testing/CI/Ops)*
8. **CRM's Won/Lost HITL gate (IPI-367) has zero code** despite `prd.md`/`roadmap.md` both labeling CRM "🟢 Mature/MVP-complete, incremental work only" — the DB guard trigger is live and waiting, but there's no route to trigger it, and Deal Detail (IPI-396) is still a 28-line stub. *(Stack: CRM)*
9. **No rollback script, no monitoring/observability tooling, no CI job builds the OpenNext bundle** — three independent, unowned production-readiness gaps found with no Linear issue directly responsible for the monitoring gap specifically. *(Stack: Testing/CI/Ops)*
10. **Status-hygiene debt across 6+ issues actively misdirects planning**: IPI-363/364 (In Progress, actually shipped and should close), IPI-403 (In Progress, actually 0% and should be Backlog), IPI-277 (Backlog, actually shipped and should be Done), IPI-486 (Todo, actually has Done children and should be In Progress), IPI-91 (Backlog, actually has 4 Done children and should be In Progress), IPI-233 (In Progress, stalled 10+ days past its own SLA with both blockers long resolved). *(Cross-stack)*

## 3. Per-stack summary

| Stack / feature | Score | Dot | Main correction |
|---|---:|:-:|---|
| Cloudflare migration | 48/100 | 🟡 | Two issues (IPI-469, IPI-471) claim "✅ Complete" for content that only exists on an unmerged branch (PR #271); epic progress table (IPI-487) disagrees with `tasks/cloudflare/todo.md` by ~30 points on the same task. |
| AI Gateway and model providers | 78/100 | 🟡 | Gateway Worker deployed, provider adapter real and tested, but nothing routes through it yet (AC-F still open). |
| Mastra agents and workflows | 74/100 | 🟡 | Tool-count claims are stale everywhere (docs say 10, code has 20); `creative-director` (shared by 2 routes) has zero tools; one circular dependency (IPI-153⇄IPI-181). |
| CopilotKit and HITL | 81/100 | 🟢 | Core wiring genuinely shipped and verified; main gap is bookkeeping (IPI-91 epic status, stale "remaining gaps" tables). |
| Supabase (schema/RLS/RPC/Realtime) | 78/100 | 🟡 | Core FIX-phase work is real and merged; one active fix (IPI-452, migration-ordering bug) has a correct, minimal, CI-green fix sitting unmerged in PR #266. |
| Planner | 55/100 | 🔴 | Both real PRs (#283/#284) are green and mergeable but unmerged, past SLA. One AC/code mismatch found (`createInstance` doesn't exist by design). |
| Brand and onboarding | 80/100 | 🟡 | Strong except for one high-impact false Done (IPI-336, see blocker #3). |
| Shoot and booking | 90/100 | 🟢 | Strongest stack in the audit — backend, agent, and both remaining Booking screens shipped and merged since the last pass. |
| Model Booking MVP (talent booking) | 74/100 | 🟡 | Backend + 2 of 5 screens real; the prerequisite Talent Profile screen (IPI-409) is still 0%, creating a sequencing gap under the already-shipped Booking Wizard. |
| CRM | 62/100 | 🟡 | Lists/detail pages and wave-1 agent genuinely shipped with honestly-documented scope cuts; Deal Detail and the Won/Lost gate are not — `prd.md`/`roadmap.md`'s "mature" framing is optimistic. |
| Campaign | 15/100 | 🔴 | Schema-only, exactly as documented; zero downstream Linear issues opened yet. |
| Assets and Cloudinary | 78/100 | 🟡 | Core pipeline shipped and merged; its own "verification" gate (IPI-351) is a false Done (see blocker #4). |
| Notifications | 86/100 | 🟢 | Backend genuinely shipped and merged; gap is entirely UI/Realtime, correctly still Backlog. |
| Design V2 and React parity | 70/100 | 🟡 | Shipped work is real (all cited PRs individually checked); 6 issues are mis-filed under this project despite being pure backend/AI plumbing with no visual deliverable of their own. |
| Testing, CI, deployment, observability, rollback | 39/100 | 🔴 | No OpenNext CI job, no rollback script, zero observability tooling anywhere; one real fix (IPI-453, PR #267) sitting unmerged. |
| Documentation and architecture | — | ⚪ | **No dedicated Linear track exists for this stack.** Every issue mentioning architecture/ADR/documentation matched a more specific feature stack first (e.g. CF-000 matched Cloudflare). This is a legitimate finding, not a gap in this audit's categorization — documentation work is currently untracked as its own line item anywhere in Linear. |

Full per-stack detail, evidence, and the "rest" (Backlog/Canceled) batch notes are in `02-cloudflare-ai.md`, `03-data-agents.md`, `04-features-design.md`, and `05-testing-operations.md`.
