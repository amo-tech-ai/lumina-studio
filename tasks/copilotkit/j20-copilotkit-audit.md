# J20 — CopilotKit + Mastra audit (easy read)

**Date:** 2026-07-20 · dual-host + executive scorecard  
**Deep pass:** 2026-07-20 (Mastra + Cloudflare production audit — browser + source + Linear + Supabase MCP)  
**Hosts:** [www.ipix.co/app](https://www.ipix.co/app) (Vercel) · [CF preview `/app`](https://ipix-operator-preview.sk-498.workers.dev/app/)  
**Mode:** Audit only (no code / Linear / secrets / deploy changes)  
**Prior:** [`j19-copilotkit-mastra-audit.md`](./j19-copilotkit-mastra-audit.md) · [`j16-mastra-cloudflare.md`](../mastra/j16-mastra-cloudflare.md) · [`j16-mastra-supabase.md`](../mastra/j16-mastra-supabase.md)  
**Docs:** [CopilotKit Mastra](https://docs.showcase.copilotkit.ai/mastra) · [Mastra + CopilotKit](https://mastra.ai/guides/build-your-ui/copilotkit/overview) · [Mastra Cloudflare](https://mastra.ai/guides/deployment/cloudflare)  
**Canvas:** `mastra-cloudflare-production-audit.canvas.tsx`

---

## Deep pass executive verdict (2026-07-20)

| Metric | Value | Notes |
|------:|------:|-------|
| **Overall correctness** | **78/100** | Architecture strong; storage/advanced Mastra/P0 journey thin |
| **Vercel readiness** | **88/100** | Auth `/info` + `default` SSE Production Verified |
| **Cloudflare readiness** | **72/100** | Discovery + multi-agent SSE on preview; Sign Out + durable memory missing |
| **Full CF migration** | **35/100** | Runtime preview ≠ model/storage/ops complete |
| **P0 success probability** | **~75%** | #519 merged — redeploy CF preview then IPI-724 re-run |
| **Redesign required?** | **No** | Finish validation + Hyperdrive later |

**Workers AI for Mastra chat?** **No.** Gemini direct via `resolveModel()`. CF `/api/ai/health` = AI Gateway **service binding** only (no `env.AI` Workers AI binding in `app/wrangler.jsonc`).

**Top five blockers** (updated 2026-07-20 after IPI-724/725 Done)

1. **IPI-730 · COPILOT-RUNTIME-003** — staging blocked by Vercel Deployment Protection SSO (Phases A–C done; browser human gate)  
2. **IPI-616 → 628 → 629 → 630** — Mastra Node storage chain (ADR still open; `disableInit` absent)  
3. **IPI-619 / IPI-623** — Worker memory still InMemory (`MASTRA_STORAGE_MODE=noop`); stale relations ✅ fixed  
4. **IPI-734 → 735 → 736** — verify wrapper / resilience / timings (after staging green)  
5. **IPI-634** — thin `threadId` localStorage restore (hooks Sign Out allowlist from IPI-725)  

✅ Closed this pass: **IPI-724 · CF-UJ-018** · **IPI-725 · AUTH-UI-001** (Chromium hard AC + allowlist). Do not reopen without new evidence. Leave CF preview traffic on Worker `5b42459b…` (do not promote older `521c8810`).

### Review agreement (2026-07-20)

External review scored backlog **96/100**. Applied:

| Action | Result |
|--------|--------|
| Strengthen **IPI-724** hard AC journey | Explicit Auth → `/info` → every agent → stream → Sign Out → anon 401 → protected → PASS; reopened In Progress |
| Split **IPI-730** AC | Environment · Runtime · Browser (+ first token + one tool) |
| Reopen **IPI-725** | Allowlist + preview proof still open |
| No new Runtime/Perf/Resilience tickets | Keep as AC / flags on IPI-734 |
| Keep closed | IPI-127 · IPI-632 · IPI-702 · IPI-718 |
| Execution order | Phase1: redeploy → 724 → 730 · Phase2: 734→735→736 · Phase3: 634→648 · Phase4: Hyperdrive 619→620→621→624→623 |

---

Yes. Treat most of these as **extend / merge / audit**, not greenfield builds.

| Task | Lean path | Skip |
|------|-----------|------|
| **IPI-725** | **#519 merged** — redeploy CF preview; Playwright Sign Out → anon `/info` 401; allowlisted storage clear (no `localStorage.clear()`). | Expanding AC further or a second auth redesign |
| **IPI-724** | Re-run existing `run-e2e.mjs` after #519. Add a **loop over the 9 agent IDs from `/info`** + Soft FF/WebKit smoke. Record cancel/refresh; don’t block Done on IPI-634. | New test framework; full HAR; claiming Worker memory |
| **IPI-730** | **Env-only first:** Vercel Preview vs prod var *presence* (`DATABASE_URL`, auth). One curl: auth `/info`. Classify. Code PR only if env is fine and stack proves code. | Reopening IPI-702/718; rebuilding Mastra |
| **IPI-634** | Persist `threadId` in `localStorage` in `operator-panel.tsx` (~one read on mount / write on change). Clear on logout (hooks IPI-725). One Playwright refresh test. | Hyperdrive, Intelligence, server thread redesign |
| **IPI-648** | Evolve existing `cf-shiki-stub.mjs` → same-origin vendor assets. Offline = plain escaped code. Gzip before/after in PR. | New highlighter; bundling Shiki into the Worker graph |
| **IPI-734** | Thin wrapper: `npm run verify:copilot` → call IPI-724 runner + prod base-URL flag. Same evidence JSON. | Second Playwright stack / new CI system |
| **IPI-735** | Flags/cases **inside** the verify runner (`--negative`). Unit-test sanitize paths already in route tests. | Separate “resilience product” |
| **IPI-736** | Append timings JSON the runner already records. No dashboard. | APM / historical UI until numbers hurt |

### Efficiency rule of thumb

```text
725 merge → 724 re-run → 730 env probe
         ↘ 734 = rename/wrap 724
              ↘ 735/736 = flags on same script
634 = localStorage only
648 = stub → same-origin (parallel, non-blocking)
```

**Biggest win:** don’t implement **IPI-734 / 735 / 736** as three codebases. Ship **one runner**, three Linear owners for AC slices — after P0 (#519 → 724 → 730) is green.
## Plain English verdict

The **architecture is right**. Operator chat goes Browser → authenticated CopilotKit multi-route runtime → in-process Mastra → Gemini (default) → storage. That matches current CopilotKit + Mastra guidance.

What is still thin is **operational proof**: every agent run, deeper streaming/tool checks, staging Preview, CF Sign Out journey, and Worker durable memory. Do **not** redesign the stack — finish validation and close open PRs.

| Score | Value |
|------:|-------|
| **Overall correctness** | **78/100** (was 91 — deep pass lowered for storage/advanced gaps) |
| Architecture | **96/100** |
| Implementation (core chat) | **88/100** |
| Advanced Mastra features | **32/100** |
| Merge core runtime? | **Yes** (already merged) |
| Claim full platform Done? | **No** — see next steps |

**Workers AI for Mastra chat?** **No.** Default is Gemini direct. CF `/api/ai/health` only proves the AI Gateway binding.

---

## Scorecard

| Area | Score | Status | One-line meaning |
|------|------:|:------:|------------------|
| CopilotKit architecture | 98% | 🟢 | Multi-route + `useSingleEndpoint={false}` correct |
| Mastra integration (core) | 90% | 🟢 | In-process `getLocalAgents`; lazy storage |
| Mastra advanced (OM/RAG/durable-all) | 32% | 🔴 | Deferred / partial |
| Cloudflare Workers runtime | 85% | 🟡 | Preview live; memory InMemory; no Hyperdrive |
| Authentication | 96% | 🟢 | 401 anon → 200 auth on both hosts |
| Runtime validation | 70% | 🟡 | Discovery strong; all-9 + Sign Out journey open |
| Production readiness (Vercel chat) | 88% | 🟢 | SSE verified this pass |
| Production readiness (CF cutover) | 55% | 🟡 | Preview chat works; ops gaps |
| Documentation accuracy | 90% | 🟢 | This pass corrects prior optimism |
| **Overall** | **78%** | 🟡 | Validation + storage gaps, not redesign |

---

## What is correct (keep)

| Area | Why it is good |
|------|----------------|
| 🟢 Runtime shape | Browser → CopilotKit Runtime → Mastra → LLM → Storage |
| 🟢 Auth ladder | 401 anonymous → 200 authenticated → agent registry → chat |
| 🟢 Discovery first | `GET /api/copilotkit/info` before browser agent demos |
| 🟢 Cloudflare | AI Gateway **service binding**, not public `fetch` to gateway |
| 🟢 One concern / PR | Evidence (#517) · Sign Out (#519) · Nav (#524) stay split |
| 🟢 Gemini primary | Operator agents via `resolveModel("default")` |

```text
Browser (/app/*)
  → <CopilotKit runtimeUrl="/api/copilotkit" useSingleEndpoint={false}>
  → GET /info | POST /agent/:agentId/run
  → withOperatorAuth → MastraAgent.getLocalAgents({ resourceId })
  → resolveModel() → Gemini (default)
  → PostgresStore (Vercel) | InMemoryStore (Workers)
```

---

## Dual-host live matrix (2026-07-20 · deep pass)

| Check | Vercel prod | CF preview |
|-------|:-----------:|:----------:|
| Unauth `/api/copilotkit/info` | 🟢 401 | 🟢 401 |
| Auth `/info` + 9 agents + `1.61.0` | 🟢 200 | 🟢 200 |
| Login → `/app` | 🟢 Playwright | 🟢 Playwright |
| Auth SSE `default` | 🟢 RUN_STARTED + stream | 🟢 RUN_STARTED + `OK` content |
| Auth SSE `booking` / `brand-intelligence` / `crm-assistant` | ⚪ not this pass | 🟢 200 + content |
| Invalid agent id | 🟢 404 JSON | 🟢 404 JSON |
| Sign Out UI on `/app` | 🔴 absent | 🔴 absent (#519) |
| `/api/ai/health` | 🔴 503 → localhost:8787 | 🟢 `probeVia: service_binding` |
| Durable Mastra memory | 🟡 Postgres intended | 🔴 InMemory (`noop`) |
| Staging Preview `/info` | 🔴 Vercel SSO 302 | n/a |

**Do not treat `/api/ai/health` as CopilotKit readiness or Workers AI for Mastra.** Gateway probe only.

---

## What’s missing (validation gaps)

Map to **existing** Linear issues first. Propose a new ticket only if nothing owns it.

| Sev | Gap | Why it matters | Own with | Concrete fix |
|-----|-----|----------------|----------|--------------|
| 🔴 | **Per-agent execution** — only discovery + mostly `default` SSE | Discovery ≠ every agent can run | Extend **IPI-724** runner / future verify suite | One authenticated `POST …/agent/:id/run` for: `default`, `production-planner`, `creative-director`, `brand-intelligence`, `booking`, `crm-assistant`, `social-discovery`, `visual-identity`, `model-match` |
| 🔴 | **Staging Preview 503** | Planner staging broken for chat | **IPI-730 · COPILOT-RUNTIME-003** | Env audit first (`DATABASE_URL`, deploy SHA); then auth `/info` 200 |
| 🟡 | **CF full journey + Sign Out** | Cutover confidence | **IPI-724** + **IPI-725** (#519) | Merge Sign Out → redeploy preview → re-run; `hard_ac_pass` must be true |
| 🟡 | **Streaming depth** | First token only soft-measured | **IPI-724** / **IPI-632** patterns | Assert first token, `RUN_FINISHED`, no mid-stream drop; optional cancel later |
| 🟡 | **Tool path** | Chat ≠ tool → UI | **IPI-482** (planner HITL) · journey packs under **IPI-500** | One tool: Mastra → serialized → rendered card |
| 🟡 | **Negative / failure cases** | Happy path only | **IPI-735 · COPILOT-RESILIENCE-001** | 401, invalid agent, expired session, 503 sanitize, idle timeout |
| 🟡 | **Refresh / new session** | Dock clears today | **IPI-634 · COPILOT-THREAD-001** | localStorage/`threadId` restore (don’t wait for Intelligence) |
| 🟡 | **Browser matrix** | Chromium only | **IPI-724** (Firefox + WebKit smoke in AC) | Firefox + WebKit smoke required for Done |
| 🟡 | **Mobile / tablet** | Panel is responsive | UX follow-ups / **IPI-197** Done for context | 390 / tablet / desktop smoke of chat dock |
| 🟡 | **Network resilience** | No offline/3G/429 suite | **IPI-735 · COPILOT-RESILIENCE-001** | 500/502/429/timeout/cancel — synthetic |
| 🟡 | **Worker cold start** | CF-specific latency | **IPI-736 · COPILOT-PERF-001** (+ IPI-724 metadata) | Measure cold vs warm first `/info` + first stream |
| 🟡 | **Worker durable memory** | InMemory across isolates | **IPI-619 / IPI-623** Hyperdrive | After Hyperdrive: thread survives isolate |
| 🟡 | **Alpha/beta pins** | `@ag-ui/mastra` beta, `@mastra/memory` alpha | Ops / deps hygiene | Exact pins; no `^`/`latest` on those |

---

## Production readiness snapshot

| Component | Ready | Note |
|-----------|:-----:|------|
| Runtime architecture | 🟢 | Official pattern |
| Discovery `/info` | 🟢 | Both hosts |
| Authentication | 🟢 | Both hosts |
| Agent registry | 🟢 | 9 keys match |
| Vercel prod chat | 🟢 | IPI-127 |
| Cloudflare preview discovery | 🟢 | Auth `/info` 200 |
| Cloudflare browser journey | 🟡 | IPI-724 / #517 |
| Thread persistence UI | ⚪ | IPI-634 + Intelligence off |
| Worker Postgres memory | ⚪ | Hyperdrive |
| Vercel staging Preview | 🔴 | IPI-730 |

---

## Progress Task Tracker

| Status | Task | Purpose | Missing | Next action | Complete |
|--------|------|---------|---------|-------------|-------:|
| 🟢 | **IPI-127 · AIOR-011** | Prod runtime | Optional UI checkbox | Leave Done | 97% |
| 🟢 | **IPI-702 · COPILOT-RUNTIME-001** | Lazy storage | — | No new branch | 100% |
| 🟢 | **IPI-718 · COPILOT-RUNTIME-002** | ESM `@mastra/pg` | Linear AC boxes | Docs-only checkbox sync | 97% |
| 🟢 | **IPI-632 · CF-MIG-220** | Preview Phase A | — | Don’t reopen | 100% |
| 🟡 | **IPI-724 · CF-UJ-018** | CF E2E journey (AC expanded) | Sign Out hard AC; all-9 + FF/WebKit | #519 → re-run → close #517 | 60% |
| 🟡 | **IPI-725 · AUTH-UI-001** | Sign Out + session clear (AC expanded) | Not on preview **or** prod | Merge **#519** + redeploy | 75% |
| 🟡 | **IPI-731 · NAV-001** | Shoot wizard nav | Preview deploy | Merge **#524** | 80% |
| 🔴 | **IPI-730 · COPILOT-RUNTIME-003** | Staging 503 (P0 env audit) | **Vercel SSO blocks probe** + root cause | Bypass SSO → env audit | 5% |
| ⚪ | **IPI-634 · COPILOT-THREAD-001** | Thread after refresh (expanded) | Restore strategy | localStorage first | 0% |
| 🟡 | **IPI-648 · COPILOT-UI-002** | Shiki CDN → same-origin | Offline/CSP/gzip | Don’t block chat | 40% |
| ⚪ | **IPI-734 · COPILOT-VERIFY-001** | One `verify:copilot` command | Not started | After P0 path | 0% |
| ⚪ | **IPI-735 · COPILOT-RESILIENCE-001** | Negative / failure suite | Not started | After VERIFY scaffold | 0% |
| ⚪ | **IPI-736 · COPILOT-PERF-001** | Perf benchmarks history | Not started | Soft budgets from 724 | 0% |
| ⚪ | **IPI-619 / 623** | Hyperdrive memory | Not started for chat parity | After CF cutover path | 0% |
| 🔴 | Vercel `/api/ai/health` | Gateway probe | Points at localhost | Ops fix — **not** CopilotKit | 0% |

---

## Linear backlog sync (2026-07-20) — done

**Goal:** Finish validation without fragmenting the backlog. ~80% of remaining work stays on existing tickets.

### Updated existing (5)

| Issue | Priority | What changed |
|-------|:--------:|--------------|
| [IPI-724 · CF-UJ-018](https://linear.app/amo100/issue/IPI-724) | 🔴 P0 | All 9 agents, SSE timing/cancel, refresh, invalid agent, `/api/ai/health`, auth lifecycle, Firefox+WebKit |
| [IPI-730 · COPILOT-RUNTIME-003](https://linear.app/amo100/issue/IPI-730) | 🔴 P0 | Staging vs prod env, Mastra/storage init, `/info` + `/agent/*` + tools, stack, classify env/runtime/deploy |
| [IPI-725 · AUTH-UI-001](https://linear.app/amo100/issue/IPI-725) | 🔴 P0 | Revoke session, clear local/session storage, redirect, anon `/info`, protected redirect |
| [IPI-634 · COPILOT-THREAD-001](https://linear.app/amo100/issue/IPI-634) | 🟡 P1 | localStorage, refresh, reopen, resume, Worker InMemory note |
| [IPI-648 · COPILOT-UI-002](https://linear.app/amo100/issue/IPI-648) | 🟡 P1 | Remove CDN, offline, CSP, gzip before/after |

### Created only (3)

| Issue | Priority | Purpose |
|-------|:--------:|---------|
| [IPI-734 · COPILOT-VERIFY-001](https://linear.app/amo100/issue/IPI-734) | 🟡 P1 | `npm run verify:copilot` → PASS/FAIL + evidence |
| [IPI-735 · COPILOT-RESILIENCE-001](https://linear.app/amo100/issue/IPI-735) | 🟢 P2 | Automated 401/403/invalid/timeout/cancel/429/500 |
| [IPI-736 · COPILOT-PERF-001](https://linear.app/amo100/issue/IPI-736) | 🟢 P2 | First byte/token/completion, cold Worker, history |

### Do not create

Architecture · Mastra runtime · Cloudflare migration · Agent registry · Gemini · Auth foundation · AI health ownership.

### Create later (after Hyperdrive)

**COPILOT-WORKER-MEMORY-001** — only after IPI-619/623. Current Worker InMemory is intentional.

**One command target:**

```bash
npm run verify:copilot   # owned by IPI-734
```

---

## Improvements (production-grade only)

1. **Finish the open path:** #519 → re-run IPI-724 → close #517 with `hard_ac_pass: true`.  
2. **Staging before code:** IPI-730 env audit on Planner Preview URL.  
3. **Per-agent smoke:** owned by expanded IPI-724; suite later by IPI-734.  
4. **Pin beta/alpha** packages used on the Copilot path.  
5. **Separate gateways:** keep `/api/ai/health` out of Copilot green/red dashboards.  
6. **Thread restore** via IPI-634 without waiting for Managed Intelligence.  
7. **Avoid complexity:** no new agent framework, no Workers AI migration for operator chat, no Intelligence premium until product asks.

---

## Prioritized next steps

| # | Do this | Owner | Done when |
|---|---------|-------|-----------|
| 1 | Merge Sign Out **#519**, redeploy CF preview | IPI-725 | Sign Out visible on preview |
| 2 | Re-run IPI-724; exit non-zero until hard AC green | IPI-724 / #517 | `hard_ac_pass: true` + Sign Out → 401 |
| 3 | Staging Preview env audit | IPI-730 | Auth `/info` 200 on staging URL |
| 4 | Scaffold `npm run verify:copilot` | IPI-734 | PASS/FAIL artifact |
| 5 | Thread restore | IPI-634 | Refresh keeps dock |
| 6 | Shiki same-origin | IPI-648 | No jsDelivr; gzip OK |
| 7 | Perf history + resilience suites | IPI-736 / IPI-735 | Benchmarks + negative tests |
| 8 | Hyperdrive when cutting over Worker memory | IPI-619/623 | Memory survives isolate |
| 9 | Fix or document Vercel AI health localhost | Ops | No false “AI down” |

---

## Packages (pin risk)

| Package | Version | Risk |
|---------|---------|------|
| `@copilotkit/runtime` / `react-core` | 1.61.0 | Pin |
| `@ag-ui/mastra` | 0.2.1-beta.2 | Beta — pin exact |
| `@mastra/core` | 1.41.0 | ESM |
| `@mastra/pg` | 1.12.0 | Static import (IPI-718) |
| `@mastra/memory` | 1.0.1-alpha.1 | Alpha — pin exact |

---

## Final answers

| Question | Answer |
|----------|--------|
| Is Mastra completely configured? | **No** — core chat yes (~90%); advanced ~32% |
| Completely migrated to Cloudflare? | **No** — ~35% (runtime preview ≠ full) |
| Workers AI actually used by Mastra? | **No** — Gemini direct |
| All agents operational? | **Discovery yes (9/9)**; SSE this pass: CF `default`+`booking`+`brand-intelligence`+`crm-assistant`; Vercel `default` |
| Memory durable on both hosts? | **No** — Vercel Postgres intended; Worker InMemory |
| Anything missing? | Sign Out live, IPI-724 hard AC, staging SSO/env, threads UI, Hyperdrive, `disableInit`/RLS, OpenNext CI |
| Will the tasks succeed? | **Likely** if #519 → 724 → 730 order held (~75% P0) |
| Production-ready? | **Vercel chat mostly yes**; **full platform / CF cutover no** |
| Redesign needed? | **No** |

---

## Evidence appendix

| Probe | Result | When |
|-------|--------|------|
| Unauth `/info` prod + CF | **401** | 2026-07-20 |
| Auth `/info` prod + CF | **200** · 9 agents · v1.61.0 | 2026-07-20 deep |
| Prod SSE `default` | **200** RUN_STARTED (+ tool/content) | 2026-07-20 Playwright |
| CF SSE `default` | **200** + TEXT `OK` | 2026-07-20 Playwright |
| CF SSE booking / brand-intelligence / crm | **200** + content | 2026-07-20 Playwright |
| Invalid agent both hosts | **404** JSON Agent not found | 2026-07-20 |
| Sign Out UI both hosts | **absent** | 2026-07-20 |
| CF `/api/ai/health` | **200** service_binding | 2026-07-20 |
| Prod `/api/ai/health` | **503** localhost:8787 | 2026-07-20 |
| Staging Preview `/info` | **302** Vercel SSO | 2026-07-20 |
| Supabase `mastra_*` | **33** tables · **0** RLS policies · 44 msgs / 23 threads | MCP SQL |
| Unit tests | storage + provider + agents index **66/66** | 2026-07-20 |
| #517 / #519 / #524 | **Merged** 2026-07-20 | tip includes Sign Out + E2E evidence + shoot wizard nav |

**Validation level:** Production Verified (Vercel auth `/info` + `default` SSE) · CF Preview Verified (auth `/info` + 4-agent SSE) · **not** IPI-724 Done · **not** IPI-730 fixed · **not** Full migration.

---

## Deep architecture map (source)

```text
Browser (/app/*)
  → <CopilotKit runtimeUrl="/api/copilotkit" useSingleEndpoint={false}>
  → GET /info | POST /agent/:agentId/run  (AG-UI SSE)
  → withOperatorAuth → CopilotRuntime.agents()
  → MastraAgent.getLocalAgents({ mastra: getMastra(), resourceId: user.id, requestContext })
  → Agent (registry in app/src/mastra/index.ts)
  → resolveModel(tier) → Gemini (default) | Groq | gateway only if AI_ROUTING_MODE=gateway + allowlist
  → Tools / workflows (shoot-wizard, brand-intelligence)
  → Memory → getMastraStorage()
       Vercel: PostgresStore(@mastra/pg) when DATABASE_URL set
       Workers: InMemoryStore (MASTRA_STORAGE_MODE=noop; @mastra/pg stubbed)
```

| Piece | File | Fact |
|-------|------|------|
| Entrypoint | `app/src/mastra/index.ts` | `getMastra()` lazy; Proxy `mastra` for CLI |
| Durable wrap | `app/src/mastra/durable.ts` | Only `default` / `production-planner` / `creative-director` |
| Storage | `app/src/mastra/storage.ts` | No `disableInit`; Workers skip PG |
| Memory | `app/src/mastra/memory.ts` | lastMessages 40; planner workingMemory; no semantic recall |
| Models | `app/src/lib/ai/provider.ts` + `gemini-registry.ts` | Default `gemini-3.1-flash-lite` |
| Copilot route | `app/src/app/api/copilotkit/[[...slug]]/route.ts` | InMemoryAgentRunner; 20s idle timeout; error sanitize |
| Wrangler | `app/wrangler.jsonc` | `MASTRA_STORAGE_MODE=noop`; `AI_GATEWAY` service; **no** Hyperdrive; **no** `ai` binding |

### Model routing (every operator agent)

| Agent | Tier | Vercel provider | CF provider | Workers AI? | Tools OK? |
|-------|------|-----------------|-------------|------------:|-----------|
| default / production-planner | default | Gemini | Gemini | No | Yes (direct) |
| creative-director | default | Gemini | Gemini | No | Yes |
| brand-intelligence | default | Gemini | Gemini | No | Yes |
| booking | default | Gemini | Gemini | No | Yes |
| crm-assistant | default | Gemini | Gemini | No | Yes |
| social-discovery | default | Gemini | Gemini | No | Yes |
| visual-identity | vision | Gemini (forced) | Gemini | No | Vision path |
| model-match | default | Gemini | Gemini | No | Yes |
| public-marketing (separate route) | fast | Gemini; gateway *if* opted | same | Only if gateway+Workers AI behind gateway | Tool-free |

Gateway note: `shouldRouteTierViaGateway` allows only `fast` by default; tool tiers need `AI_GATEWAY_ALLOW_TOOL_TIERS=1` — **operator Mastra must stay direct** until a tool bridge exists.

### Cloudflare migration matrix

| Layer | Current state | Correct? | Missing | Blocking? | Fix |
|-------|---------------|:--------:|---------|:---------:|-----|
| Runtime | OpenNext Worker preview live | ✅ | Prod DNS cutover (IPI-631) | later | Keep OpenNext path |
| Model | Gemini direct on both | ✅ for product | Workers AI unused by Mastra | no for chat | Do not flip gateway for tools yet |
| Storage | InMemory + stubs | ✅ intentional | Hyperdrive + un-stub | **yes for parity** | IPI-619 → 620 → 623 |
| Operational | Auth on; Sign Out **merged** (#519) | 🟡 | CF preview redeploy; allowlist clear; OpenNext CI | **yes redeploy** | Redeploy + prove anon `/info` 401 |
| Fully migrated | App still Vercel | ❌ | Memory + cutover + CI | **yes** | After P0 + Hyperdrive |

### Errors / red flags / fixes

| Sev | File/task | Error | Failure scenario | Exact fix | Verification |
|-----|-----------|-------|------------------|-----------|--------------|
| 🔴 | Live hosts / **IPI-725** | Sign Out not on CF preview yet | Operator cannot end session on preview | Redeploy preview with #519; allowlist storage clear | Sign Out → anon `/info` 401 |
| 🔴 | **IPI-730** staging URL | Vercel SSO 302 | Cannot audit staging `/info` | Disable Deployment Protection or use protected cookie; then env diff | Auth `/info` 200 |
| 🔴 | `storage.ts` / Supabase | No `disableInit`; RLS 0 policies | Studio/local PG init 42501; runtime DML risk for Hyperdrive role | Own under existing Mastra Supabase tickets (IPI-227 path) | MCP grants + init smoke |
| 🟡 | **IPI-724** | All-9 + FF/WebKit not Done | False confidence from discovery | Extend runner; exit non-zero | `hard_ac_pass: true` |
| 🟡 | Vercel `/api/ai/health` | Points at localhost:8787 | False “AI down” | Ops: set `AI_GATEWAY_URL` or document non-Copilot | health JSON |
| 🟡 | `@mastra/memory` alpha / `@ag-ui/mastra` beta | Pin risk | Silent break on bump | Exact pins in package.json | lockfile |
| 🟡 | DurableAgent cache | InMemoryServerCache | Stream resume lost on isolate | After Hyperdrive / IPI-129 | reconnect test |
| ⚪ | Semantic recall / OM | Deferred IPI-136 | No vector recall | Leave until Phase 2 | n/a |

### Linear corrections (deep pass)

| Task | Status | Done work | Missing | % | Success | Recommended |
|------|--------|-----------|---------|--:|--------:|-------------|
| **IPI-724 · CF-UJ-018** | In Progress | Evidence runner; Phase A; this pass 4-agent SSE | Sign Out AC on redeployed preview; all-9; FF/WebKit soft | 60% | 70% | Redeploy → hard AC |
| **IPI-725 · AUTH-UI-001** | In Progress | **#519 merged** | Not on CF preview yet; allowlist clear open | 85% | 90% | Redeploy + prove 401 |
| **IPI-730 · COPILOT-RUNTIME-003** | Todo | Ticket scope | SSO blocks probe; 0 env audit | 5% | 65% | Todo → start with SSO/env only |
| **IPI-634 · COPILOT-THREAD-001** | Backlog | Root cause known | Implementation | 0% | 85% | After Sign Out clear hooks |
| **IPI-734 · COPILOT-VERIFY-001** | Backlog | — | Not started | 0% | 80% | Wrap 724 runner |
| **IPI-735 · COPILOT-RESILIENCE-001** | Backlog | Partial unit sanitize exists | Automated suite | 10% | 75% | Flags on same runner |
| **IPI-736 · COPILOT-PERF-001** | Backlog | Soft budgets in 724 | History JSON | 0% | 80% | Append timings |
| **IPI-619 · CF-DB-005** | Backlog | Hyperdrive config exists (IPI-618) | wrangler bind | 0% | 85% | Bind-only PR |
| **IPI-623 · CF-DB-009** | Backlog | Scope corrected (not ai_agent_logs) | Needs 619–621 | 0% | 55% | After 620 PROCEED |

### Mastra feature % (core vs advanced)

| Feature | % | Evidence |
|---------|--:|----------|
| Agent registry + Copilot discovery | 95% | 9 keys both hosts |
| Streaming SSE | 85% | Live content; cancel/finish soft |
| Tools + instruction HITL | 75% | Tools registered; end-to-end tool→UI thin |
| Workflows (2) | 70% | shoot-wizard + brand-intelligence |
| Memory lastMessages | 70% | Wired; Worker not durable |
| Working memory (planner) | 65% | Schema present; CF InMemory |
| DurableAgent resume | 40% | Only planner/CD; InMemory cache |
| Semantic recall / OM / RAG | 10% | Explicitly deferred |
| Workers AI / gateway for tools | 5% | Opt-in; blocked for tool tiers |
| **Core Mastra** | **~90%** | |
| **Advanced Mastra** | **~32%** | |

### Improvements (ranked)

1. Redeploy CF preview with Sign Out (**#519 merged**) → finish **IPI-724** Chromium hard AC.  
2. **IPI-730**: remove/bypass Vercel SSO on staging Preview, then env presence audit only.  
3. One `verify:copilot` (**IPI-734**) wrapping the 724 runner — do not build three frameworks.  
4. **IPI-634** versioned `threadId` (clear on logout with 725 allowlist).  
5. Keep Mastra on Gemini direct; treat `/api/ai/health` as infra-only; **IPI-586** is smoke-only (not Mastra chat).  
6. Ship **IPI-616 ADR** then **628→629→630** before claiming durable Node memory; bind **IPI-619** in parallel (bind-only; clear Done IPI-625 blocker).  
7. Fix stale Linear relations (batch table below) before treating blockers as real.  

### Unit test note

`cd app && npx vitest run src/mastra/storage.test.ts src/lib/ai/provider.test.ts src/mastra/agents/index.test.ts` → **66/66 passed** (2026-07-20).

---

## Batch Linear task audit — Mastra / CF / journeys (2026-07-20)

**Mode:** task-verifier Quick + evidence probes (Linear MCP · `storage.ts` · `wrangler.jsonc` · `provider.ts` · Mastra/`@mastra/pg` docs · Cloudflare AI Gateway binding docs)  
**Scope:** 51 issues from the user list · **none** of these 51 are Done  
**Overall batch correctness:** **72/100** · **Production-ready as a set:** **No** · **Will succeed if corrections land:** **~78%**

Legend: 🟢 ≥90% correct / safe to execute · 🟡 70–89% fix before Done · ⚪ backlog/ok but not ready · 🔴 blocker or stale/wrong

### Executive verdict

| Question | Answer |
|----------|--------|
| Are specs 100% correct? | **No** — chain design is strong; relations + Vite paths + provider boilerplate need fixes |
| Architecture redesign needed? | **No** |
| Gemini / Groq stale? | **Default model OK** (`gemini-3.1-flash-lite`). Groq remains a valid **opt-in** `AI_PROVIDER=groq` path — not dead. Workers AI is **not** Mastra chat today. |
| Workers AI updated in tickets? | **IPI-586** AC matches [CF binding docs](https://developers.cloudflare.com/ai-gateway/integrations/aig-workers-ai-binding/) (`env.AI.run` + `gateway.id`). Do **not** install `workers-ai-provider` for smoke. |
| Production ready? | **No** for Hyperdrive / durable Worker memory / full UJ suite. Vercel Gemini chat **is** production-proven separately. |

### Critical relation / status errors (fix Linear first)

| Sev | Issue | Error | Fix |
|-----|-------|-------|-----|
| 🔴 | **IPI-503 · CF-UJ-003** | `blockedBy` **IPI-485** (Canceled) — prose already says use IPI-594 | `removeBlockedBy: IPI-485`; optionally soft `blockedBy: IPI-594` |
| 🔴 | **IPI-501 · CF-UJ-001** | `blockedBy` **IPI-454** (Canceled) | Clear; soft-block on live BI path / IPI-656 if needed |
| 🔴 | **IPI-586 · CF-AI-003** | Still `blockedBy` **IPI-632** but **IPI-632 is Done** (2026-07-20) | `removeBlockedBy: IPI-632` → Todo/In Progress when ready |
| 🔴 | **IPI-619 · CF-DB-005** | Still `blockedBy` **IPI-625** but **IPI-625 is Done**; also hard-blocked by **IPI-616** while prose says soft | `removeBlockedBy: IPI-625`; keep soft/docs link to IPI-616 (or demote 616 from hard block) |
| 🟠 | **IPI-245 · Mastra RLS probes** | Prose says blocked by IPI-629; graph often empty | Add `blockedBy: IPI-629` |
| 🟠 | **IPI-475 · AI-CHAT-001** | Paths still cite retiring Vite `src/` | Rewrite to `app/src/` only |
| 🟡 | **IPI-263 / 262 / 156 / 369** | Shared provider boilerplate still names Groq/`resolveGeminiModel` as if primary | Point to `resolveModel()` + Gemini default; Workers AI = IPI-586/594 only |
| 🟡 | **IPI-105 · AIOR-010** | Stale `services/agent`, IPI2 IDs | Refresh paths to `app/src/mastra` + current logging |

### Gemini / Groq / Workers AI — evidence

| Claim | Probe | Result |
|-------|-------|--------|
| Mastra default model | `app/src/lib/ai/gemini-registry.ts` | ✅ `gemini-3.1-flash-lite` |
| Default provider | `provider.ts` `AI_PROVIDER ?? "gemini"` | ✅ Gemini direct |
| Groq | `VALID_PROVIDERS` includes `groq` | 🟡 Opt-in — keep tickets accurate |
| Workers AI binding | `app/wrangler.jsonc` | 🔴 No `"ai": { "binding": "AI" }` yet — IPI-586 |
| Hyperdrive binding | `wrangler.jsonc` | 🔴 No `HYPERDRIVE_FRESH` — IPI-619 |
| `disableInit` / `schemaName` | `storage.ts` + Mastra PG docs | 🔴 Absent; official in [Mastra PostgreSQL storage](https://mastra.ai/reference/storage/postgresql) — IPI-630 correct |
| Worker storage mode | `wrangler.jsonc` `MASTRA_STORAGE_MODE=noop` | ✅ Intentional until Hyperdrive |

### Hot path — Mastra Supabase + Hyperdrive (must stay ordered)

```text
IPI-616 ADR (docs)
  → IPI-628 schema migration
    → IPI-629 grants/RLS  (USING(true) ≠ tenant)
      → IPI-630 disableInit + schemaName (Node)
Parallel bind: IPI-619 (after clearing Done IPI-625; ADR soft)
  → IPI-620 spike PROCEED/HOLD
    → IPI-621 tenant model + IPI-624 monitoring
      → IPI-623 one Mastra workload (not ai_agent_logs alone)
```

### Per-task scoreboard (all 51)

| Dot | Task | Spec% | Success% | Prod? | Errors / missing | Corrections |
|-----|------|------:|---------:|:-----:|------------------|-------------|
| 🟢 | **IPI-616 · CF-DB-001 ADR** | 92 | 90 | Docs | Unstarted; blocks chain | Ship ADR matrix this week |
| 🟢 | **IPI-628 · MASTRA-SUPABASE-002** | 90 | 85 | No | Needs 616 | Pin `@mastra/pg` `exportSchemas()`; backup |
| 🟢 | **IPI-629 · MASTRA-SUPABASE-003** | 91 | 88 | No | Needs 628 | Document `USING(true)` ≠ tenant; deny anon/auth |
| 🟡 | **IPI-630 · MASTRA-SUPABASE-004** | 88 | 90 | Node/Worker no | `disableInit` missing in code | After 629: `disableInit:true` + ADR `schemaName` |
| 🟡 | **IPI-619 · CF-DB-005** | 90 | 95 | Bind | Stale blockedBy 625; hard 616 | Clear 625; bind-only; **no** `MASTRA_STORAGE_MODE=pg` |
| 🟡 | **IPI-620 · CF-DB-006** | 88 | 70 | Spike | Needs 619 | Explicit PROCEED/HOLD/REDESIGN |
| 🟡 | **IPI-621 · CF-DB-007** | 90 | 75 | No | Needs 620 | Hyperdrive has no JWT — app-scoped filters |
| ⚪ | **IPI-624 · CF-DB-010** | 85 | 90 | Ops | Soft before 623 | Pool alerts before migrate |
| 🟡 | **IPI-623 · CF-DB-009** | 92 | 65 | No | 4 blockers | Thread/memory only; never Done via `ai_agent_logs` |
| 🟡 | **IPI-714 · pool exhaustion** | 85 | 80 | Diag | Overlap 629/623 | Diagnose before raising pool |
| ⚪ | **IPI-245 · RLS probes** | 80 | 85 | After 629 | Relation gap | Wire `blockedBy: IPI-629` |
| 🟡 | **IPI-586 · CF-AI-003** | 93 | 88 | Smoke | Stale blockedBy Done 632 | Clear 632; smoke only; no Mastra flip |
| ⚪ | **IPI-609 · soak** | 85 | 70 | After native | After IPI-594 | Keep after native routing |
| ⚪ | **IPI-455 · CF-EDGE-B** | 90 | 40 | Parked | Cancel-gate IPI-699 | Keep parked |
| 🟡 | **IPI-500 · CF-UJ-000** | 80 | — | Meta | Children stale | Align with IPI-724 runner |
| 🔴 | **IPI-501 · CF-UJ-001** | 60 | 40 | No | blockedBy canceled 454 | Clear relation |
| 🔴 | **IPI-503 · CF-UJ-003** | 55 | 40 | No | blockedBy canceled 485 | Clear → soft IPI-594 |
| ⚪ | **IPI-504 · CF-UJ-004** | 80 | 55 | No | Feature-gated | Reuse 724; Chromium hard |
| ⚪ | **IPI-505 · CF-UJ-005** | 80 | 55 | No | Feature-gated | Same |
| ⚪ | **IPI-506 · CF-UJ-006** | 78 | 50 | No | CRM surface thin | After CRM MVP |
| ⚪ | **IPI-507 · CF-UJ-007** | 82 | 60 | No | Planner tools | After planner HITL stable |
| ⚪ | **IPI-511 · CF-UJ-010** | 80 | 55 | No | Visual DNA | Feature-gated |
| 🟡 | **IPI-656 · BRAND-INTEL-001** | 85 | 75 | No | Multi-source scope | Keep draft-only AI |
| 🟡 | **IPI-657 · BRAND-AGENT-001** | 85 | 70 | No | Needs 656 | Conversation + lead only |
| 🟡 | **IPI-658 · BRAND-PROFILE-001** | 85 | 70 | No | Needs 657 | Guest → org save |
| 🟡 | **IPI-369 · CRM-AI-003** | 78 | 65 | No | Provider boilerplate | Gemini default; draft insights |
| 🔴 | **IPI-475 · AI-CHAT-001** | 55 | 50 | No | Vite `src/` paths | Rewrite to `app/src/` |
| 🟡 | **IPI-482 · planner tools HITL** | 82 | 70 | Partial | Scope broad | One concern; tools registry |
| 🟡 | **IPI-262 · DESIGN-078 VI** | 80 | 70 | No | Provider section old | Gemini + channel preview |
| 🟡 | **IPI-263 · DESIGN-079 social** | 80 | 70 | No | Same | Gemini + creator match |
| 🟡 | **IPI-259 · DESIGN-075 planner** | 82 | 75 | Partial | Route wiring | Keep Gemini direct |
| ⚪ | **IPI-156 · CAMP-001 CD** | 80 | 45 | No | Schema deps | Post-MVP |
| ⚪ | **IPI-157 · CAMP-002 engine** | 78 | 40 | No | Needs 156 | Post-MVP |
| ⚪ | **IPI-159 · CAMP-004 approval** | 80 | 40 | No | Needs 157 | Post-MVP |
| ⚪ | **IPI-160 · MATCH-001** | 82 | 40 | No | Post-MVP | Keep Backlog |
| ⚪ | **IPI-161 · MATCH-002** | 82 | 40 | No | Needs 160 | Same |
| ⚪ | **IPI-162 · MATCH-003** | 82 | 40 | No | Needs 161 | Same |
| 🟡 | **IPI-172 · AI-EVIDENCE-001** | 85 | 70 | No | Old GEMINI-009 name hist | Provider-neutral OK |
| 🟡 | **IPI-279 · AIOR-017b stream** | 80 | 55 | No | Deferred; stale IPI-129 | After Hyperdrive/cache |
| 🟡 | **IPI-105 · AIOR-010 obs** | 55 | 50 | No | Stale paths | Refresh to `app/src/mastra` |
| ⚪ | **IPI-131 · AIOR-015 HITL** | 90 | 95 | Docs | Quick win | Docs-only policy |
| ⚪ | **IPI-147 · MASTRA-GOV-003** | 85 | 70 | No | Overlap 482 | Don't duplicate registry |
| ⚪ | **IPI-146 · MASTRA-GOV-002** | 85 | 70 | No | Overlap 621 | Tenant memory |
| ⚪ | **IPI-338 · DESIGN-060b** | 80 | 45 | No | Publish/schedule | After channel preview |
| ⚪ | **IPI-249 · DESIGN-058 campaign** | 78 | 40 | No | React parity | Post-MVP |
| ⚪ | **IPI-309 · MODEL-P3 talent** | 80 | 50 | No | Profile URL | Feature track |
| ⚪ | **IPI-265 · ASSET-UX-001** | 82 | 55 | No | Upload widget | Asset track |
| ⚪ | **IPI-151 · SHOOT-AI-004** | 80 | 50 | No | Auto-tag gallery | After shoot gallery |
| ⚪ | **IPI-215 · shoot regenerate** | 82 | 60 | Partial | Mastra regenerate | Draft-only |
| ⚪ | **IPI-192 · MI-03b quality** | 78 | 50 | No | Platform checks | After image pipeline |
| ⚪ | **IPI-233 · fix workflow chains** | 75 | 55 | No | API/DB chains | Narrow to one chain |

### Missing across the batch

1. Formal Linear cleanup for **canceled/Done blockers** (501/503/586/619).  
2. **IPI-725 allowlist** storage cleanup still open after merge (thread keys for 634).  
3. Single **`verify:copilot`** owner (IPI-734) referenced by journey tickets — most UJ tickets don't cite it.  
4. Explicit line on agent-wiring tickets: **Mastra stays on Gemini until IPI-594**; IPI-586 ≠ agent migration.  
5. IPI-623 must stay blocked on **619+620+621+624** — do not start early.

### Best practices (official)

| Domain | Do | Don't |
|--------|----|-------|
| Mastra PG | `disableInit: true` + migrate via Supabase; `schemaName` from ADR ([docs](https://mastra.ai/reference/storage/postgresql)) | Runtime DDL as `hyperdrive_mastra_runtime` |
| Workers AI | `wrangler` AI binding + `env.AI.run(..., { gateway: { id: "ipix-prod" } })` ([CF](https://developers.cloudflare.com/ai-gateway/integrations/aig-workers-ai-binding/)) | Install `workers-ai-provider` for IPI-586; route Mastra tools through Workers AI yet |
| Hyperdrive | Bind early; migrate one Mastra thread/memory last | Claim Done with `ai_agent_logs` helper-only |
| Journeys | Reuse IPI-724 runner; Chromium hard | Blind write prompts to all 9 agents |

### Recommended Linear actions (no new tickets)

1. Fix 🔴 relations: 501, 503, 586, 619, 245.  
2. Rewrite IPI-475 paths to `app/`.  
3. Start **IPI-616** (unblock 628–630).  
4. Clear **IPI-586** → ready after removing Done IPI-632.  
5. Bind **IPI-619** in parallel (after relation fix; ADR soft).  
6. Keep agent/product tickets Backlog until storage + Sign Out preview proof land.

### Composite scores (batch)

| Slice | Spec /100 | Execution readiness /100 | Skills alignment /100 | Composite |
|-------|----------:|-------------------------:|----------------------:|----------:|
| Mastra-Supabase (616–630) | 90 | 40 | 88 | **70** |
| Hyperdrive (619–624) | 90 | 25 | 90 | **64** |
| Workers AI (586) | 93 | 35 | 92 | **69** |
| CF journeys (500–511) | 72 | 30 | 75 | **56** |
| Brand/CRM/design wiring | 78 | 35 | 70 | **59** |
| **Batch overall** | **82** | **33** | **80** | **72** |

### Verification report — 2026-07-20 · batch

| Task set | Spec /100 | Execution /100 | Skills /100 | Composite | Blockers | Safe? |
|----------|----------:|---------------:|------------:|----------:|----------|-------|
| 51-issue Mastra/CF batch | 82 | 33 | 80 | **72** | 4 🔴 relations + durable memory gap | **No*** |

\*Safe to execute **now:** IPI-616, relation cleanup, IPI-586 (after clear 632), IPI-619 bind-only (after clear 625).  
🛑 Not ready: flip Worker `MASTRA_STORAGE_MODE=pg`, claim Hyperdrive Mastra Done, or mark UJ journeys Done while blocked by canceled IDs.

**Stop condition:** Not production-ready as a set. Not ready. These blockers must be fixed first: stale `blockedBy` on IPI-501/503/586/619; missing `disableInit`/schema ADR chain (616→628→629→630); no Hyperdrive or AI binding in `wrangler.jsonc` yet.

---

## IPI-730 · COPILOT-RUNTIME-003 — Staging Runtime Investigation (2026-07-20)

**Branch:** `ai/ipi-730-ipi-730-copilot-runtime-003-staging-runtime-investigation` · docs PR [#534](https://github.com/amo-tech-ai/lumina-studio/pull/534)  
**CF preview:** left unchanged (live `5b42459b…` @ 100%; do **not** promote `521c8810` / SHA `51dbe818` rollback).  
**IPI-724 / IPI-725:** Done — not reopened.  
**External audit (same day):** **96/100** 🟢 — process correct; production readiness correctly blocked. Refs: [Vercel Deployment Protection](https://vercel.com/docs/deployment-protection) · [env vars](https://vercel.com/docs/environment-variables) · [CopilotKit runtime](https://docs.copilotkit.ai/).

### Verdict

| Item | Result |
|------|--------|
| Process / investigation score | **96/100** (external audit) · internal evidence **72→88/100** after AC expansion |
| Root cause (primary) | **Deployment Protection / SSO** |
| Reproduced | **Partial** — SSO 302 + Vercel HTML confirmed; app-level 503 **not** reachable without auth cookie |
| Code change required | **No** (not yet — env gap is config; app 503 unproven) |
| Staging readiness | **Not ready (correctly blocked)** until SSO bypass / disable |
| Success probability after SSO | **~95%** if Preview env aligned + fresh deploy after any env change |
| Production contrast | Healthy gate: anon `/api/copilotkit/info` → **401** (app route, not SSO) |

### Audit agreement — flagged items vs evidence

| Audit flag | Status | Notes |
|------------|:------:|-------|
| Record deployment metadata before testing | ✅ Done | Phase A table (ID, SHA, runtime, region, timestamp, age) |
| Env beyond secrets (Edge Config, flags, overrides, build/runtime) | ✅ Expanded | Phase B+ below |
| Runtime URL + agents + tools + provider + storage | ✅ Code-verified | Live `/info` still SSO-blocked |
| Browser first-token / tool / request ID | ⛔ Blocked | Human SSO gate — AC written, not executed |
| Separate fix PR only if proven | ✅ | No code PR yet |

### Phase A — Deployment metadata (recorded before runtime diagnosis)

| Field | Value |
|-------|-------|
| Staging URL | `https://ipix-operator-git-release-ipi-542-staging-mdeai.vercel.app` |
| Deployment ID | `dpl_2chyjndpXinBLi5fWd81mCAXWNxj` |
| Deployment URL | `https://ipix-operator-j0x80qof5-mdeai.vercel.app` |
| Git SHA | `33a6487af717d5e7ca491f1982707534f637e1b8` |
| SHA matches branch tip? | ✅ Equals `origin/release/ipi-542-staging` |
| Branch | `release/ipi-542-staging` |
| Commit | `chore(ipi-542): second staging preview for rollback pair` |
| Build timestamp | 2026-07-20T05:28:12Z (Ready) |
| Preview age | ~4.2h at investigation time |
| Node / runtime | **24.x** / `nodejs24.x` lambdas |
| Region | **iad1** (build createdIn sfo1) |
| Framework | Next.js (`ipix-operator`) |
| Deployment Protection | **Enabled** — `ssoProtection.deploymentType = all_except_custom_domains` |
| Unauth `/` + `/api/copilotkit/info` | **HTTP 302** → `https://vercel.com/sso-api?url=…` |
| Follow-redirect body | Vercel SSO **HTML** (not CopilotKit JSON / not Next 503) |
| Classification | **Vercel Deployment Protection / SSO** — not application auth, not CopilotKit runtime, not Mastra yet |

**Do not treat unauthenticated curl as app failure.** Production (custom domain) correctly returns app **401** on anon `/info`.

### Phase B — Env presence matrix (names only · no values)

Source: `vercel env ls` on `mdeai/ipix-operator` (2026-07-20).

| Variable | Production | Staging / Preview | Branch override `release/ipi-542-staging` | Required for `/info` | Notes |
|---|:---:|:---:|:---:|:---:|---|
| `DATABASE_URL` | Y | **N** | — | N | **Prod-only.** Agent `/agent/*` needs durable store on Vercel; `/info` skips storage per route |
| `NEXT_PUBLIC_SUPABASE_URL` | Y | Y | **Y** | Y | Branch override present |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Y | Y | **Y** | Y | Branch override present |
| `SUPABASE_ANON_KEY` | Y | Y | **Y** | — | Branch override present |
| `SUPABASE_SERVICE_ROLE_KEY` | Y | **N** | — | N | Prod-only; not needed for browser `/info` |
| `COPILOTKIT_LICENSE_TOKEN` | Y | Y | — | Soft | Threads/Intelligence; discovery works without |
| `GEMINI_API_KEY` | Y | Y | — | For agent turn | Present on Preview |
| `GROQ_API_KEY` | Y | Y | — | N | Opt-in provider |
| `OPENAI_API_KEY` | N | N | — | N | Absent both |
| `AI_PROVIDER` | N | N | — | N | Absent both |
| `AI_GATEWAY_URL` | N | N | — | N | Absent both |
| `INTELLIGENCE_API_URL` | Y | Y | — | Soft | With license trio |
| `INTELLIGENCE_GATEWAY_WS_URL` | Y | Y | — | Soft | |
| `INTELLIGENCE_API_KEY` | Y | Y | — | Soft | |
| `MASTRA_STORAGE_MODE` | N | N | — | N | Unset → Node uses PG when `DATABASE_URL` set |
| `OPERATOR_AUTH_ENABLED` | Y | Y | — | Y | Present Preview |
| `NEXT_PUBLIC_SITE_URL` | Y | Y | **Y** | Soft | Branch override |

#### Beyond secrets — Edge Config · flags · build/runtime

| Surface | Production | Preview / Staging | Notes |
|---------|:----------:|:-----------------:|-------|
| Vercel Edge Config | **None** | **None** | Project `edgeConfigs` empty — N/A for this failure |
| Feature-style env | `SL_ENABLED`, `NEXT_PUBLIC_MARKETING_CHAT_ENABLED`, `OPERATOR_AUTH_ENABLED` | Same names present | Presence only; values not compared |
| Branch Preview overrides | — | `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_ANON_KEY` | Scoped to `release/ipi-542-staging` |
| Build vs runtime vars | Next.js 24.x project | Same | No separate Edge Config / build-only CopilotKit keys found |
| `AI_PROVIDER` / `AI_ROUTING_MODE` / `AI_GATEWAY_URL` | Absent | Absent | Defaults to Gemini direct |
| `MASTRA_STORAGE_MODE` | Absent | Absent | Node uses PG when `DATABASE_URL` set |

**Env finding:** Preview staging lacks `DATABASE_URL` (and service-role). That is a **real config gap for agent turns** after SSO is cleared, but it is **not proven** as the cause of `runtime_info_fetch_failed` while SSO still intercepts `/info`. Any env fix requires a **new Vercel deployment** before retest.

### Phase C — Runtime / repo inspection (no code changes)

| Check | Finding |
|-------|---------|
| Runtime URL (operator) | `runtimeUrl="/api/copilotkit"` · `useSingleEndpoint={false}` in `(operator)/layout.tsx` |
| Route registration | `app/src/app/api/copilotkit/[[...slug]]/route.ts` — GET/POST/PATCH/DELETE → authenticated handler · `basePath: "/api/copilotkit"` |
| `/info` storage | `requestNeedsDurableStorage`: pathname ending `/info` → **false** (no `getMastraStorage()` gate) |
| Agents on `/info` | `MastraAgent.getLocalAgents({ mastra: getMastra(), … })` via lazy storage proxy |
| Expected agent IDs (9) | `default`, `production-planner`, `creative-director`, `visual-identity`, `social-discovery`, `brand-intelligence`, `model-match`, `crm-assistant`, `booking` |
| Required trio enforced | `REQUIRED_AGENT_IDS` = default / production-planner / creative-director |
| Tool modules (source) | **24** tool `.ts` files under `app/src/mastra/tools/` (excl. tests) — live count still SSO-blocked |
| Model provider | Default **`gemini`** via `resolveModel()` when `AI_PROVIDER` unset; model id `gemini-3.1-flash-lite` |
| Storage mode (Preview) | No `MASTRA_STORAGE_MODE`; no `DATABASE_URL` → agent paths → `storage_unavailable` in prod Node; `/info` still listable |
| Top-level risk | Module constructs `CopilotRuntime` + warns on license; **no** throw without `DATABASE_URL` |
| Staging vs main | Staging tip **behind** main by 4 commits (unrelated to CopilotKit route). Deploy SHA **matches** branch tip |

**HTTP 200 alone is insufficient** — browser phase must assert agent IDs, first token, and one tool.

### Phase D — Browser (human gate) · expanded AC

| Check | Result | Capture when unblocked |
|-------|--------|------------------------|
| Login → Command Center | **Blocked** — SSO | timestamp · deployment ID · SHA |
| Auth `GET /api/copilotkit/info` | **Blocked** | status · sanitized body · **agent ID list** |
| Expected agents (9 IDs) | **Blocked** | exact set match, not empty 200 |
| Agent turn starts | **Blocked** | agent selected |
| First streaming token | **Blocked** | **latency ms** · event type |
| One tool invocation | **Blocked** | tool name · JSON/runtime error vs HTML 500 |
| Successful completion / RUN_FINISHED | **Blocked** | sanitized |
| Request / correlation ID | **Blocked** | `x-vercel-id` / app request id if present |
| Planner Option A routes | **Blocked** | |
| Sign Out regression | **Blocked** | (proven on CF via IPI-724) |

**Human action required:** disable Deployment Protection for this Preview ([docs](https://vercel.com/docs/deployment-protection)), add a bypass token for automation, or complete Vercel SSO in a shared browser session and hand off cookies ([Playwright auth](https://playwright.dev/docs/auth)).

### Expanded acceptance criteria (post-audit)

#### Environment

- [x] Deployment ID recorded
- [x] Git SHA recorded + matches `release/ipi-542-staging` tip
- [x] Preview deployment age recorded
- [x] SSO vs application response classified
- [x] Env presence matrix (incl. flags / overrides / Edge Config absence)
- [ ] Redeploy after any env change then retest

#### Runtime

- [x] Runtime endpoint registration (`/api/copilotkit` + catch-all)
- [x] Runtime URL config (`runtimeUrl="/api/copilotkit"`)
- [x] Expected agent registry (9 IDs) from source
- [x] Tool module count from source (24)
- [x] Provider selected (Gemini default)
- [x] Storage selected (Preview: no URL → agent gate risk)
- [ ] Live authenticated `/info` without 503

#### Browser

- [x] SSO blocker documented
- [ ] Auth `/info` 200 + expected agent list
- [ ] First stream token + latency
- [ ] One tool call + response type
- [ ] Request ID + sanitized logs
- [ ] Successful completion

### Phase E — Root-cause classification

**Primary (confirmed):** Deployment Protection / SSO  

**Secondary (config risk · unproven for `/info`):** missing Preview `DATABASE_URL` → will 503 `storage_unavailable` on authenticated **agent** runs once SSO is cleared  

**Not claimed:** CopilotKit route registration defect · Mastra init crash · stale deployment alone · application code defect  

### Phase F — Decision

| Option | Status |
|--------|--------|
| Code fix PR now | **No** — investigation incomplete without browser |
| Env change | Document only: add `DATABASE_URL` (pooler `6543`) to Preview **after** SSO plan; redeploy staging; retest |
| Close IPI-730 | **No** |
| Next | **Blocked by human SSO access** |

### Recommended execution order (audit-aligned)

1. ✅ Verify Deployment Protection / SSO  
2. ✅ Record deployment metadata  
3. ✅ Compare env presence (no values)  
4. ⬜ Redeploy if env changes  
5. ⬜ Browser login (authenticated session)  
6. ⬜ `/info` + expected agents  
7. ⬜ First streaming token  
8. ⬜ One tool invocation  
9. ⬜ Sanitized logs + request IDs  
10. ⬜ Final root-cause class  
11. ⬜ Separate fix PR only if required  

### Commands / evidence

```bash
curl -sI "https://ipix-operator-git-release-ipi-542-staging-mdeai.vercel.app/api/copilotkit/info"
# → 302 Location: https://vercel.com/sso-api?url=…

curl -sI "https://www.ipix.co/api/copilotkit/info"
# → 401 (application Unauthorized — healthy contrast)

vercel inspect https://ipix-operator-git-release-ipi-542-staging-mdeai.vercel.app
# → dpl_2chyjndpXinBLi5fWd81mCAXWNxj · SHA 33a6487a… · release/ipi-542-staging

vercel env ls   # presence only — never pull values into git
```

Project API: `ssoProtection.deploymentType = all_except_custom_domains` · Edge Config: none.

### Fix decision

Do **not** open a production-code PR from this investigation. After SSO access:

1. Auth browser `/info` → expect **200 + the 9 agent IDs** (not empty 200).  
2. Record first-token latency, tool name, response type, request ID.  
3. If agent turn 503 `storage_unavailable` → set Preview `DATABASE_URL` → redeploy → retest.  
4. Only then open a separate one-concern code PR if stack proves a code defect.
