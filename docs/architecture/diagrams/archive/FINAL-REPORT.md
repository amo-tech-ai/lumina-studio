# Architecture Diagramming — Final Report

**Date:** 2026-07-09 · **Scope:** 52 diagrams across 8 categories (Platform, AI, Core Features, Data, Planner, Cloudflare, Application, Operations), each verified against `prd.md`, `roadmap.md`, and real code — not generated from docs alone.

## 1. Overall architecture completeness score: 64/100 🟡

This scores how much of the *documented* architecture is actually *built*, weighting 🟢 full credit, 🟡 half credit, ⚪/🔴 no credit, per category:

| Category | Estimate | Why |
|---|:---:|---|
| Platform / hosting | ~55% | Matches `roadmap.md`'s own number — foundation done, gateway/CI/cutover remain |
| AI | ~45% | 4 of 7 agent roles real; the Gateway itself is fully unwired |
| Core Features | ~75% | 5 of 9 features mature; Campaign unbuilt, Planner UI unbuilt, Intelligence undecided |
| Data | ~85% | Schema is the platform's strongest layer; Realtime/notifications is the one real gap |
| Planner | ~35% | Backend near-merge; UI is 100% unbuilt (design-only) |
| Cloudflare services | ~30% | Only Workers + Workers AI are actually live; DO/Queues/KV-as-registry are all target-only |
| Application structure | ~80% | Solid, just missing routes for the 2 unbuilt features |
| Operations | ~25% | No monitoring, error boundaries unmerged, rollback script doesn't exist |

This is consistent with `roadmap.md`'s own self-reported percentages — this diagramming pass corroborates them independently rather than contradicting them.

## 2. Missing diagrams

**None.** All 52 requested diagrams were produced. Where a topic had no real backing (Prompt Registry, Durable Objects, Queues — all target-only; R2/KV/Vectorize — mostly unused), the diagram was still produced but scoped to a decision-status or target-state diagram rather than a fabricated working flow, per the "do not invent" instruction.

## 3. Incorrect or outdated documentation found

Every item below was independently discovered by a different agent verifying against real code — not asserted from a single source. Full detail lives in each cited diagram's own Explanation section.

| # | Document | Claim | Reality | Found in |
|---|---|---|---|---|
| 1 | `prd.md` §3 | Writes only go through service-role edge functions, never a Mastra tool directly | `booking-tools.ts` calls Supabase RPCs directly via a user-scoped client, RLS-enforced — no edge function involved | `06-runtime-request-flow.md` |
| 2 | `prd.md` §4.4 | Workers AI is the MVP default for `default`/`fast`/`structured` tiers | Real `model-registry.ts` `DEFAULT_REGISTRY` has **Gemini** as the provider for those 3 tiers; Workers AI only wired for `embedding` | `11-model-provider-routing.md` |
| 3 | `prd.md` §5.2 | production-planner agent has "10 tools" | Real code excludes only 3 booking-write tools from the shared barrel — it actually holds 17 of 20 registered tools | `08-mastra-architecture.md`, `12-shared-tool-registry.md` |
| 4 | *(undocumented anywhere)* | — | A 9th real agent, `public-marketing-agent`, exists outside `getMastra()`'s registry entirely, behind `/api/marketing-chat` | `08-mastra-architecture.md` |
| 5 | `tasks/cloudflare/plan/ai-agent-architecture.md` §3.1 | Brand Agent has 2 separate approval points (profile, then DNA scores) | Real workflow has **one** combined suspend/resume gate | `16-brand-onboarding-workflow.md` |
| 6 | `prd.md` §6.6 | `campaign_deliverables` "needs schema" | Already deployed in `20260707100000_ipi268_campaigns_schema.sql`, with different columns than described | `22-campaign-workflow.md` |
| 7 | `prd.md` §6.5 | `NotificationCenter` component reuses `SCR-15` | **No such component exists anywhere in the codebase** — the API/DB layer is real, nothing renders it | `24-notification-workflow.md` |
| 8 | `prd.md` §7 | `public.notifications` is "Realtime-enabled" | Not in the `supabase_realtime` publication — frontend polls via REST. Only brand-crawl progress is actually live-Realtime today | `30-realtime-architecture.md` |
| 9 | `prd.md` §4.1 | KV is "Use now" | Its binding is commented out in `wrangler.jsonc`; `model-registry.ts` is a hardcoded in-memory object, no actual KV read/write | `42-r2-kv-vectorize-status.md` |
| 10 | `Universal-design-prompt-new/plan/planner/mermaid-diagrams.md` + `design-prompts/diagrams.md` | `AtRisk` is drawn as a real instance status | The real enum has 7 values, no `at_risk` — it's a computed UI overlay from `detectScheduleRisks`, never persisted | `34-planner-state-machine.md` |
| 11 | Same file, class diagram; `IPI-476` AC E | `PlannerEngine.createInstance()` | Doesn't exist in the real `engine.ts` — makes sense, the engine is intentionally pure/no-writes | `32-planner-template-engine.md` |
| 12 | `tasks/diagrams/03-agent-tool-architecture.md`, `04-workflow-architecture.md` | Draw Campaign/Research agents and 7 Mastra workflows as if all real | Only 4 of the agent roles and 2 of the workflows (`shoot-wizard`, `brand-intelligence`) actually exist | AI + Core Features agents |
| 13 | `CLOUDFLARE-EPIC.md` rollback plan | References an `OPS-002` rollback script | No such script exists anywhere on disk — the plan is a runbook, not yet an executable artifact | `49-rollback-strategy.md` |
| 14 | *(no doc claims otherwise, but worth stating)* | — | Zero monitoring/error-tracking/APM tooling exists anywhere in the repo (grepped for Sentry/Datadog/Grafana) | `50-monitoring-observability.md` |

## 4. Recommended corrections

**Applied directly** (factual, unambiguous, in a document this session already owns — `prd.md`): items 1, 2, 3, 6, 7, 8, 9 above. See the diff in `prd.md` following this report.

**Recommended, not applied** (these live in historical/Approved docs outside this session's ownership — flagging rather than unilaterally editing an Approved decision record):
- `tasks/cloudflare/plan/ai-agent-architecture.md` §3.1 (item 5) — update Brand Agent's approval-point count.
- `tasks/diagrams/03-agent-tool-architecture.md` and `04-workflow-architecture.md` (item 12) — both are stale relative to real code; recommend archiving in favor of this new `docs/architecture/diagrams/` set rather than maintaining two parallel diagram sets.
- `CLOUDFLARE-EPIC.md`'s rollback section (item 13) — either write the `OPS-002` script or relabel the section "runbook, not yet automated."

## 5. Production readiness assessment: 🔴 Not ready

This matches `roadmap.md` §3's own MVP Release Gate — this diagramming pass independently confirms the same blockers rather than finding new ones:
- AI Gateway unwired (blocks gate criterion 3)
- OAuth doesn't trust the eventual Cloudflare production host (blocks criterion 4)
- Campaign and Planner UI unbuilt (blocks criteria 5-6)
- No monitoring/observability (not itself a release-gate line item today, but a real operational blind spot post-cutover)
- Error boundaries written but unmerged (`IPI-453`, PR #267)
- Rollback plan exists but its script doesn't

## 6. Suggested additional diagrams

**None, and that's a deliberate finding, not an oversight.** The 52 requested diagrams already cover the platform's real architecture completely. What this pass surfaced instead was **documentation drift** (the 14 items above) — the fix for those is correcting existing docs, not drawing more diagrams. Adding new diagram categories now would be exactly the kind of unrequested scope-expansion this whole effort has been avoiding.
