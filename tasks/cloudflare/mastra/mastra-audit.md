# Mastra × Cloudflare — Forensic Audit

**Date:** 2026-07-09 · **Auditor:** task-verifier + `cloudflare` + `mastra` skills  
**SSOT epic:** [`MASTRA-EPIC.md`](./MASTRA-EPIC.md) — phases, dependencies, Gantt, Linear updates  
**Sources:** `tasks/cloudflare/mastra/mastra issues.md` (Linear export), `app/src/mastra/**`, `app/src/lib/ai/provider.ts`, `services/cloudflare-worker/`, `tasks/cloudflare/todo.md`, official CF/Mastra docs  
**PR context:** #279 merged (Workers AI URL) · #282 OpenNext foundation CI green · preview still Gemini outbound

---

## Executive verdict

| Area | Score | Dot |
|------|------:|:---:|
| Mastra as agent/workflow layer | 95% | 🟢 |
| Cloudflare migration alignment | 82% | 🟡 |
| Provider abstraction (gateway-first) | 68% | 🟡 |
| Task status accuracy (Linear vs `main`) | 58% | 🔴 |
| Product AI-native roadmap (planner, HITL, events) | 72% | 🟡 |
| **Overall task list correctness** | **76%** | 🟡 → **84%** epic (Jul 9 verdict) |

**Will the migration succeed?** 🟢 Yes — if you hold the line: in-process Mastra on OpenNext, gateway-first routing, IPI-462 before Workers AI default, no standalone `CloudflareDeployer` until bundle proof.

**Production ready today?** 🔴 No — preview Workers chat works on Gemini; operator CopilotKit + OAuth + groq FS + gateway wire remain open (CF-MIG-210 / IPI-454 AC-F).

---

## Correct strategy (verified)

```text
Keep Mastra     = agent/workflow brain (in-process in OpenNext Worker)
Move routing    = Cloudflare AI Gateway / unified REST (api.cloudflare.com/.../ai/v1)
Default infer   = Workers AI after IPI-462 eval (not before)
Keep Gemini     = vision + structured fallback
CF Workflows    = long-running external orchestration only (not Mastra replacement)
```

**Official alignment**

| Claim | Doc | Verdict |
|-------|-----|:---:|
| Workers AI OpenAI-compat `/v1/chat/completions` + `/v1/embeddings` | [Workers AI OpenAI compat](https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/) | 🟢 |
| AI Gateway unified REST + logging/fallbacks | [AI Gateway REST changelog](https://developers.cloudflare.com/changelog/post/2026-05-21-rest-api/) | 🟢 |
| Mastra Workers AI model strings | [Mastra CF Workers AI](https://mastra.ai/models/providers/cloudflare-workers-ai) | 🟢 — use gateway-first anyway (central registry) |
| Ephemeral FS → no LibSQL `file:` on Workers | [Mastra deploy CF](https://mastra.ai/guides/deployment/cloudflare) | 🟢 — iPix uses `PostgresStore` |
| CF Workflows for durable multi-step | [Cloudflare Workflows](https://developers.cloudflare.com/workflows/) | 🟢 — IPI-470 scope OK |

**iPix-specific best practice (SSOT):** `.claude/skills/cloudflare/references/mastra/opennext-inprocess.md` — Mastra inside OpenNext, **not** `@mastra/deployer-cloudflare` as primary path.

---

## Current setup (forensic)

```text
Operator / marketing
        │
        ▼
OpenNext Worker (:8787)  ← CF-MIG-110 (#282)
        │
        ├── Mastra in-process (getMastra, agents, workflows)
        │       └── resolveModel() → app/src/lib/ai/provider.ts
        │               ├── gemini (default) ✅ LIVE
        │               ├── groq + readFileSync(groq-models.json) 🔴 Workers-unsafe
        │               └── openai / workers-ai / gateway 🔴 throws or absent
        │
        └── services/cloudflare-worker/ (separate Worker, on main)
                ├── model-registry.ts (tiers: default/fast/structured/vision/embedding)
                ├── workers-ai.ts + gemini.ts providers
                └── router.ts + AI_GATEWAY_URL 🔴 not called by Mastra app
```

**Gap:** two registries, one inference path live (Gemini direct). Gateway worker is scaffold + unit tests; **AC-F (Mastra → gateway) not shipped.**

---

## 🔴 Red flags / blockers

| # | Flag | Impact | Fix |
|---|------|--------|-----|
| 1 | **IPI-457 marked Complete but `app/src/lib/ai/model-registry.ts` absent on `main`** | Split brain: `services/cloudflare-worker/model-registry.ts` vs `config/groq-models.json` | Merge `ai/ipi-471-agent-001-ai-agent-architecture` or dedicated PR; reopen Linear |
| 2 | **IPI-461 / IPI-454 AC-F not done** — no `AI_GATEWAY_URL` in `resolveModel()` | Tasks claim gateway path; Mastra still direct Gemini | IPI-454 AC-F: `@ai-sdk/openai-compatible` → gateway base URL |
| 3 | **`readFileSync` for Groq SSOT** (`provider.ts`) | CF-MIG-210: breaks when `AI_PROVIDER=groq` on Workers | Bundle `groq-models.json` or KV registry |
| 4 | **Standalone `CloudflareDeployer`** in local docs (`deploy-cloudflare.md`) | Team may fork to second Worker + double deploy | Mark **defer** in docs; SSOT = in-process only |
| 5 | **Flip Workers AI default before IPI-462** | Quality regression on shoot/brand/CRM tools | Hard gate in IPI-454 AC + todo.md |
| 6 | **Mastra skill still Gemini-first** (`.claude/skills/mastra/SKILL.md` L44) | Agents implement wrong pattern | Update skill: gateway → `resolveModel` → fallback |
| 7 | **Stale Linear refs** (IPI-129 in `durable.ts` comments; Gemini-only AC on IPI-156/261/263) | Wrong execution order | Wording pass per table below |

---

## Task corrections (Mastra export)

### Reopen / fix status

| Issue | Linear | Repo truth | Correction | Will succeed? | Prod ready? |
|-------|--------|------------|------------|:-------------:|:-----------:|
| **IPI-461** CF-AI-004 Adapter | In Review | Worker adapter **on `main`**; **not** wired to Mastra | Rename AC: "gateway Worker + Mastra wire"; reopen until AC-F | 🟡 | 🔴 |
| **IPI-457** CF-AI-005 Registry | Complete ⚠️ | **Branch only** (`ai/ipi-471-...`) | Reopen; merge before any Done | 🟢 | 🔴 |
| **IPI-454** CF-AI-001 Gateway | In Progress | AC-C ✅ #279; AC-F/I open | Keep In Progress; update audit diagrams | 🟢 | 🔴 |

### Wording fixes (keep task, fix text)

| Issue | Change |
|-------|--------|
| **IPI-240** | Rename → "Provider options alignment" — `thinkingBudget` / provider-specific opts via `resolveProviderOptions()`, not Gemini-only |
| **IPI-156, 259, 261, 262, 263, 369** | Replace `resolveGeminiModel()` / "Gemini structured output" → `resolveModel(tier)` + gateway adapter |
| **IPI-470** | Clarify: CF Workflows for **cross-system** durable jobs (webhooks, approvals, >30s external); Mastra workflows stay in-process for agent steps |
| **IPI-465** AGENT-002 | Tool registry logs → gateway request IDs, not raw provider SDK |

### Keep Done ✅

IPI-129, 132, 133, 134, 135, 227, 278 — verified on `main` (`PostgresStore`, brand workflow, durable agents, snapshots, memory, RLS). Minor: scrub stale IPI-129 defer comments in `durable.ts`.

### Defer ⚪ (do not cancel)

| Issue | Rationale |
|-------|-----------|
| IPI-141–145 RAG | pgvector + ingestion pipeline not stable |
| IPI-279 Durable stream cache | Only if Workers preview replay fails |
| IPI-280 Semantic recall | After pgvector RLS |
| IPI-333 Extra agents | Add tools first (`production-planner` pattern) |
| IPI-139 Browser automation | CF Browser Rendering later |

### Add — **IPI-485 · MASTRA-CF-001** (created 2026-07-09)

**Mastra Provider Gateway Cutover** — https://linear.app/amo100/issue/IPI-485

Blocked by IPI-457 + IPI-454.

```text
AC:
- No agent/tool imports @google/generative-ai or @ai-sdk/groq directly
- All model calls via resolveModel() → gateway OpenAI-compat URL
- AI_GATEWAY_URL + tier registry integration test
- Gemini = vision/fallback only (env flag)
- Workers AI default blocked by IPI-462 sign-off
```

---

## CF-MIG × Mastra (hosting)

| Item | Status | Note |
|------|:------:|------|
| CF-MIG-110 OpenNext | 🟡 | #282 CI green; merge pending |
| CF-MIG-210 runtime | 🔴 | Operator `hono/vercel`, OAuth `*.workers.dev`, groq bundle |
| In-process Mastra | 🟢 | Correct — do not add `CloudflareDeployer` to `mastra/index.ts` |
| `wrangler.jsonc` ast-grep stubs | 🟢 | #282 ship |
| R2 incremental cache | ⚪ | P1 follow-up in `open-next.config.ts` |

---

## Product features × Mastra (your roadmap)

| Area | Score | Dot | Mastra touch | Gap |
|------|------:|:---:|--------------|-----|
| AI onboarding | 80% | 🟡 | brand-intelligence workflow ✅ | Crawl → profile auto-build; HITL approval gate |
| AI Brief | 75% | 🟡 | `suggestShootBrief` tool | One brief engine, multi-mode (campaign/shoot/ecom) |
| Booking wizard | 85% | 🟢 | booking-agent + tools ✅ | Conversational fill; talent recommend — wire planner |
| Shoot workspace | 70% | 🟡 | shoot-wizard workflow | AI production monitor, auto call sheet — needs planner + events |
| CRM | 90% | 🟢 | crm-assistant-agent ✅ | Relationship summary on open — panel + tools |
| Campaigns | 65% | 🟡 | creative-director (IPI-156) backlog | Campaign Brain orchestration |
| Notifications | 60% | 🟡 | — | Event bus (Queues) not wired to Mastra tool outcomes |
| Knowledge/RAG | 55% | 🟡 | IPI-141 defer | Org/brand memory layers — Mastra memory + pgvector |
| **Universal planner** | 40% | 🔴 | — | `app/src/lib/planner/` WIP untracked — **blocks shoot/campaign unification** |
| **AI operator** | 75% | 🟡 | CopilotKit + 5 agents ✅ | Single tool surface; route-agent-map complete |

**Product roadmap composite:** **74%** spec · **58%** execution — strong CRM/booking; planner + events are the critical missing spine.

---

## Architecture target

```text
Cloudflare Workers (OpenNext)
        │
        ▼
AI Gateway Worker  ← services/cloudflare-worker (IPI-454/461)
        │
        ▼
Mastra (agents, workflows, memory → Supabase PG)
        │
 ┌──────┼──────────┐
 ▼      ▼          ▼
Planner CRM    Booking  ← shared engine (PLN epic)
        │
        ▼
Shared memory (Mastra threads + pgvector when ready)
        │
        ▼
Queues / Workflows / Notifications  ← IPI-470, not Mastra replacement
```

---

## Critical path (ordered)

```text
1. Merge #282 (CF-MIG-110)
2. Merge IPI-457 branch → main (reopen Linear)
3. IPI-454 AC-F — Mastra resolveModel → gateway
4. CF-MIG-210 — operator copilotkit, OAuth, groq bundle
5. IPI-462 eval harness → Workers AI default decision
6. **MASTRA-CF-001** — agent-wide gateway cutover
7. CF-MIG-220 smoke → CF-MIG-810 DNS last
```

**Parallel:** Universal planner PR (separate concern) once schema spec lands (IPI-476+).

---

## Improvements (concise)

1. **Single model registry SSOT** — one JSON/KV consumed by gateway Worker + `resolveModel()` (eliminate duplicate tier maps).
2. **Update `mastra` skill** — gateway-first, Workers AI via OpenAI-compat, Gemini vision exception.
3. **Trim `deploy-cloudflare.md` / `cloudfalre-deployer.md`** — banner: "reference only; iPix uses OpenNext in-process."
4. **Linear hygiene** — retract IPI-457 Done; IPI-461 = In Progress until Mastra wire; batch-rename Gemini ACs.
5. **Event envelope** — `ai_agent_logs` + future Queue publisher on tool completion (feeds notification center).

---

## Grading rubric

| Dot | Meaning |
|-----|---------|
| 🟢 | Correct, on `main`, or safe to execute now |
| 🟡 | Direction right; wording, merge, or wire incomplete |
| ⚪ | Correctly deferred |
| 🔴 | Blocker, false Done, or anti-pattern |

---

## Sign-off

**Task list ~76% correct** — strategy matches official CF + Mastra docs; execution lag is **registry merge + Mastra gateway wire + CF-MIG-210**, not framework choice.

**Do not:** standalone Mastra deployer · Workers AI default pre-462 · mark IPI-457 Done on `main`.

**Do next:** merge **#282** + **IPI-457** → **IPI-454 AC-F** → **[IPI-485](https://linear.app/amo100/issue/IPI-485)** MASTRA-CF-001.

**Refs:** [Workers AI OpenAI compat](https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/) · [AI Gateway](https://developers.cloudflare.com/ai-gateway/usage/chat-completion/) · [CF Workflows](https://developers.cloudflare.com/workflows/) · [Mastra CF](https://mastra.ai/guides/deployment/cloudflare) · `tasks/cloudflare/audits/ipi-454-457-462-463-verification.md` · `migration/startup.md`
