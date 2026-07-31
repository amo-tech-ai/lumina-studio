---
title: "Mastra — Feature Adoption Report"
version: "1.0"
lastUpdated: "2026-07-31"
status: Active
purpose: "How iPix uses Mastra, which platform features we hand-built instead, and which Mastra templates to steal."
ssot: ../../../tasks/mastra/todo.md
verifiedAgainst: "app/src/mastra/** · app/package.json · live grep for scorers/networks/processors/MCP"
verifiedAt: "2026-07-31"
scores: { core: 75, advanced: 15, overall: 51 }
---

# Mastra — 51/100 (C) 🟡

**One-line problem:** zero scorers, zero evals. Nine agents in production and no
mechanical way to tell whether a prompt edit made one better or worse.

---

## 1. Summary

| Feature | Mastra offers | iPix uses | % | Dot | Notes |
|---------|:-------------:|:---------:|--:|:---:|-------|
| Agents | ✅ | ✅ 9 | 95 | 🟢 | `agents/*`, registry in `index.ts:26` |
| Tools | ✅ | ✅ 26 + 1 | 95 | 🟢 | Single registry, auditable — good practice |
| Workflows | ✅ | ✅ 2 | 70 | 🟡 | `shoot-wizard` (3 steps), `brand-intelligence` (7 steps) |
| Suspend / resume (HITL) | ✅ | ✅ | 75 | 🟡 | `save-draft-and-wait` in the BI workflow |
| Storage (Postgres) | ✅ | ✅ | 90 | 🟢 | `@mastra/pg` 1.12.0, `mastra` schema |
| Durable agents | ✅ | ✅ 2 of 9 | 40 | 🟡 | Only planner + creative-director (`durable.ts`) |
| Memory — history | ✅ | ✅ | 70 | 🟡 | `lastMessages: 40` |
| Memory — working memory | ✅ | ✅ 1 of 9 | 30 | 🔴 | Only `PlannerWorkingMemory` |
| Memory — semantic recall | ✅ | ❌ | 0 | ⚪ | Comment: "deferred to IPI-136 / Phase 2" |
| Memory — observational | ✅ | ❌ | 0 | ⚪ | Table exists, unused |
| Observability / AI spans | ✅ | 🟡 | 50 | 🟡 | Built, **opt-in flag, off by default** |
| **Scorers / evals** | ✅ | ❌ | **0** | ⚪ | `mastra_scorers` table exists, empty |
| Processors (input/output) | ✅ | ❌ | 0 | ⚪ | No guardrail/PII layer |
| Agent networks / sub-agents | ✅ | ❌ | 0 | ⚪ | Routing is a URL map, not an agent |
| MCP client | ✅ | ❌ | 0 | ⚪ | Agents can't reach external MCP tools |
| MCP server | ✅ | ❌ | 0 | ⚪ | Our tools aren't exposed to other clients |
| Task lists | ✅ | ❌ | 0 | ⚪ | Multi-step plans tracked in prompt text |
| Studio / Agent Builder | ✅ | 🟡 | 20 | 🔴 | `mastra dev` locally only |
| Cloudflare deployer | ✅ | ❌ | 0 | ⚪ | Runs inside Next.js on Vercel |
| Templates | ✅ | ❌ | 0 | ⚪ | All 9 agents hand-written |

**Core 75 · Advanced 15 → 51**

---

## 2. What we do well

| Practice | Where | Why it's right |
|----------|-------|----------------|
| Single tool registry | `tools/index.ts:41` | One auditable surface. The file even documents the read/write convention |
| Deliberate tool scoping | `agents/index.ts:19-33` | `production-planner` explicitly destructures **out** booking, CRM, and asset tools so a shoot chat can't create a booking. Most projects hand every agent every tool |
| Boot-time registry assertion | `index.ts:37` | Throws if `default`, `production-planner`, or `creative-director` go missing — a frontend/backend contract enforced at startup |
| Lazy storage proxy | `memory.ts:9` | Re-reads request-scoped ALS storage per method (IPI-803). Correct for Workers |
| Vision pinned to Gemini | `visual-identity.ts:16` | `resolveModel("vision")` ignores `AI_PROVIDER` until a golden-eval gate passes — a provider cutover can't silently degrade colour extraction |

---

## 3. 🔴 The gap that matters most — no scorers

Mastra ships built-in scorers for correctness, faithfulness to retrieved context,
tone and safety, plus a Scorer API that stores metadata for error analysis.

The `mastra_scorers`, `mastra_scorer_definitions`, and `mastra_experiments` tables
already exist in our database. They are empty.

**Real iPix example.** `production-planner`'s instructions contain a hard rule:
*"Never invent shot angle names — always use angles from `lookupShotReferences`
results."* Today nothing checks that. If a model update starts inventing "Hero
three-quarter dutch tilt," we find out when a photographer reads the call sheet on
set. A faithfulness scorer over `lookupShotReferences` output → shot list would
catch it in CI.

| Agent | Scorer to add | Catches |
|-------|---------------|---------|
| `production-planner` | Faithfulness (shot list vs `lookupShotReferences`) | Invented angles |
| `brand-intelligence` | Faithfulness (score explanation vs `explainPillar` evidence) | Made-up rationale |
| `crm-assistant` | Faithfulness (summary vs `evidenceIds`) | Its instructions demand citations; nothing verifies |
| `public-marketing` | Safety + tone | Unauthenticated, public-facing, no tools |
| `booking` | Correctness (never confirms) | The single highest-consequence rule in the app |

---

## 4. Other gaps, ranked

| # | Gap | Consequence | Fix |
|---|-----|-------------|-----|
| 1 | No scorers | Prompt changes are unmeasurable | §3 |
| 2 | Observability exporter off in prod | AI spans exist but nobody sees them | Set `MASTRA_OBSERVABILITY_EXPORTER=1` + `MASTRA_SCHEMA=mastra` after rehearsal (already planned in `index.ts` comments) |
| 3 | Working memory on 1 of 9 | `brand-intelligence` re-derives brand context each turn | Add a typed schema per stateful agent |
| 4 | No semantic recall | Long shoot-planning threads lose early decisions past 40 messages | IPI-136; `brands.embedding` already exists |
| 5 | No processors | No PII filter or output guardrail before a model call | Add an input processor on `public-marketing` first |
| 6 | 7 of 9 agents not durable | Tab close mid-conversation = lost thread | Wrap `brand-intelligence` and `crm-assistant` next |
| 7 | No MCP client | Agents can't use Cloudinary's 5 MCP servers or Supabase MCP | See [05-cloudinary](./05-cloudinary.md) |
| 8 | No task lists | Multi-step plans live in prose instructions | Candidate for `shoot-wizard` |

---

## 5. Mastra templates worth stealing

From [mastra.ai/templates](https://mastra.ai/templates):

| Template | Maps to | What to copy |
|----------|---------|--------------|
| **Research assistant** | `brand-intelligence` | Its scorer + citation pattern — our BI agent already claims evidence-backed scores but doesn't verify them |
| **Firecrawl / web-search agent** | `brand-intelligence`, `visual-identity` | We call Firecrawl by raw `fetch` in `visual-identity.ts:52`. The template wraps it as a proper tool with retry + schema |
| **Database chat agent** | `crm-assistant` | Structured query-to-SQL with guardrails — our CRM search tools are hand-rolled |
| **Agent Builder** | new agents | Natural-language/visual agent authoring instead of a new hand-written file each time |

**The meta-point.** `tasks/mastra/` has 18 planning files and we wrote all 9 agents
by hand. The ratio of custom code to platform features is backwards — the fastest
way to cut Mastra maintenance is to adopt scorers, processors and templates rather
than write more bespoke agent files.

---

## 6. Mastra on Cloudflare Workers — real use cases for iPix

Mastra's `CloudflareDeployer` deploys a standalone Mastra app to Workers.
**The blocker is bundle size:** free tier 3 MiB, paid 10 MiB, and Mastra bundles
are known to blow past both ([issue #14494](https://github.com/mastra-ai/mastra/issues/14494)).

| Use case | Why Workers | Verdict |
|----------|-------------|:-------:|
| `public-marketing` agent | Stateless, no tools, no memory, latency-sensitive, already resolves a Cloudflare model tier via `resolveAgentModel` | ✅ Best first candidate |
| `visual-identity` | Screenshot → Cloudinary → vision. Long-running, better as a Workflow than a Worker | 🟡 Later |
| Operator agents (7) | Need Postgres + session auth + durable streams | ❌ Keep in Next.js |

**Recommendation:** don't move the Mastra runtime wholesale. Extract
`public-marketing` to a Worker — it is the only agent with no Postgres dependency,
and it proves the deployer path at low risk. `app/src/lib/ai/cloudflare-models.ts`
already exists for exactly this.

---

## 7. Progress tracker

| ID | Task | | % | Examine | Verify | Blocker |
|----|------|:-:|--:|---------|--------|---------|
| MA-01 | 9 agents registered + routed | 🟢 | 95 | `index.ts`, `route-agent-map.ts` | `cd app && npm test` | — |
| MA-02 | 26-tool registry | 🟢 | 95 | `tools/index.ts` | `npm test` | — |
| MA-03 | 2 workflows w/ HITL suspend | 🟡 | 70 | `workflows/` | `npm test` | Only 2 |
| MA-04 | Durable agents | 🟡 | 40 | `durable.ts` | `npm test` | 2 of 9 |
| MA-05 | Working memory | 🔴 | 30 | `memory.ts` | `memory.test.ts` | 1 of 9 |
| MA-06 | Semantic recall | ⚪ | 0 | `memory.ts` comment | — | IPI-136 |
| MA-07 | Scorers / evals | ⚪ | 0 | `mastra_scorers` empty | `grep -r createScorer` | Not scoped |
| MA-08 | Observability in prod | 🟡 | 50 | `index.ts` flag | `MASTRA_OBSERVABILITY_EXPORTER=1` | Rehearsal evidence |
| MA-09 | Processors / guardrails | ⚪ | 0 | — | — | Not scoped |
| MA-10 | MCP client | ⚪ | 0 | — | — | Not scoped |

---

## 8. Next 5 tasks

| # | Task | Effort | Why |
|:-:|------|:------:|-----|
| 1 | Faithfulness scorer on `production-planner` shot lists | M | Guards the highest-consequence hallucination in the app |
| 2 | Turn on the observability exporter in prod | S | Already built and flag-gated. Pure config |
| 3 | Working-memory schemas for `brand-intelligence` + `crm-assistant` | M | Stops re-deriving context every turn |
| 4 | Wrap `brand-intelligence` in `createDurableAgent` | S | Copy the 4 lines from `durable.ts` |
| 5 | Extract `public-marketing` to a Cloudflare Worker via `CloudflareDeployer` | L | Proves the deployer path on the only agent with no Postgres dependency |

---

## 9. Sources

- [Mastra docs](https://mastra.ai/docs) · [agents](https://mastra.ai/docs/agents/overview) · [memory](https://mastra.ai/docs/memory/overview) · [templates](https://mastra.ai/templates) · [Agent Builder](https://mastra.ai/agent-builder)
- [Cloudflare deployer](https://mastra.ai/docs/deployment/cloud-providers/cloudflare-deployer) · [bundle-size issue #14494](https://github.com/mastra-ai/mastra/issues/14494)
- [mastra-ai/mastra](https://github.com/mastra-ai/mastra)
