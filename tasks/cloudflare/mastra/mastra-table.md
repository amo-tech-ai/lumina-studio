# Mastra × Cloudflare — Task Table

**What this table shows:** All active tasks, sorted by implementation order (what to do first).  
**Score =** how complete/correct the task is right now.

| Score | Meaning |
|:-----:|---------|
| 🟢 90–100% | Nearly done — just needs final verification |
| 🟡 70–89% | On track — core work done, some gaps remain |
| ⚪ 50–69% | Needs significant work — early stages |
| 🔴 <50% | Blocked, broken, or not started |

---

## Phase 0 — Foundation (set up Workers to run the app)

| # | ID | What | Mastra features affected | Score | Next step |
|:-:|----|------|--------------------------|:-----:|-----------|
| 1 | **IPI-490** | CF-MIG-210 — Runtime for Workers | **All 9 agents** fail to load on Workers preview: CopilotKit sidebar that hosts agent chat won't connect, OAuth blocks login, PostgresStore (agent memory backend) intermittently hangs. Agents can't run at all on `.workers.dev`. | 🟡 **85%** | Run remote preview; file separate task for PostgresStore hang |
| 2 | **IPI-472** | INFRA-001 — Deploy pipeline | **Gateway Worker** (the bridge all agents talk through) has no automated deploy. Every model-registry update, provider-adapter change, or router fix requires `wrangler deploy` manually. No preview URL to verify agents work through gateway before prod. | 🟡 **70%** | Set up remote smoke testing so IPI-454 AC-I can verify prod deploy |

---

## Phase 1 — Gateway fix (P0 — unblock everything)

| # | ID | What | Mastra features affected | Score | Next step |
|:-:|----|------|--------------------------|:-----:|-----------|
| 3 | **IPI-573** | CF-AI-012 — Fix 502 on AI Gateway | **All 9 agents fail through gateway path.** Brand-intelligence workflow can't analyze brands. Production-planner can't create shoot plans. Marketing-chat can't answer questions. Creative-director can't generate concepts. CRM-assistant can't help with clients. The Worker that Mastra routes AI calls through returns 502 on every POST. | 🔴 **0%** | Check Worker env vars (`GEMINI_API_KEY`, `CLOUDFLARE_API_TOKEN`); fix route handler; verify with `curl POST` |

---

## Phase 2 — Provider layer (P0 — wire Mastra through Cloudflare)

| # | ID | What | Mastra features affected | Score | Next step |
|:-:|----|------|--------------------------|:-----:|-----------|
| 4 | **IPI-457** | CF-AI-005 — Unify provider types | **Agent model resolution breaks.** `resolveModel(tier)` (used by all agents) reads from `app/src/lib/ai/model-registry.ts`. But the gateway Worker has a **separate copy** at `services/cloudflare-worker/src/model-registry.ts`. If they drift, an agent requests a tier that the gateway doesn't recognize → error. The `AiProvider` enum already disagrees between app and Worker. | 🟡 **35%** | Create focused PR (not stale PR #271) to reconcile `AiProvider`, `ModelTier`, and Groq cleanup |
| 5 | **IPI-461** | CF-AI-004 — Provider REST adapter | **Agents bypass gateway entirely.** `resolveModel()` calls Gemini/Groq SDKs directly instead of using the adapter. The gateway REST client (`provider-adapter.ts`) and its 5 methods (chat/stream/structured/embed/cancel) exist on main ✅ but no Mastra agent calls them. Zero audit logging, zero observability of agent AI calls. | 🟡 **50%** | Wire `resolveModel()` → adapter → gateway as part of IPI-454 AC-F; fix stream error handling |
| 6 | **IPI-454** | CF-AI-001 — AI Gateway routing | **No unified routing.** Production-planner uses Gemini, marketing-chat uses Workers AI, creative-director picks whatever SDK it imports. `shouldRouteTierViaGateway()` and `resolveGatewayModelId()` have the routing code but 502 blocks all traffic. AC-J (E2E) never ran — no one has seen a Mastra agent chat through the gateway end-to-end. | 🟡 **55%** | Fix 502 first (IPI-573); then E2E with `public-marketing` agent; deploy via IPI-472 |

---

## Phase 3 — Cutover (P1 — switch agents to use the gateway)

| # | ID | What | Mastra features affected | Score | Next step |
|:-:|----|------|--------------------------|:-----:|-----------|
| 7 | ⚠️ **New** | Dual-registry CI sync check | **Adding models becomes fragile.** New model for production-planner (e.g. one supporting function calling) requires updating both registries. If only the app registry is updated, the gateway Worker doesn't know the model → agent tool calls fail with 404 at runtime. | ⚪ **0%** | Create Linear task; add CI workflow that diffs the two registry files on every PR |
| 8 | **IPI-485** | MASTRA-CF-001 — Cutover agents | **All 9 agents break at import time** when gateway becomes the only allowed path. Production-planner, creative-director, brand-intelligence, marketing-chat, crm-assistant, exports-agent, shipping-agent, public-marketing, brand-approval — every agent directly imports `@ai-sdk/google`. Every tool call, every workflow step that uses AI must switch to `resolveModel(tier)` → gateway. | ⚪ **10%** | Correctly blocked by IPI-454 AC-F. Do NOT start until (a) gateway tools verified or (b) tool bridge built |
| 9 | ⚠️ **New** | Swap Workers AI to FC model | **Agent tool calls silently fail.** Production-planner calls `lookupChannelSpecs`, brand-intelligence calls brand search tools, creative-director calls asset lookup — all require function calling. Current Workers AI model `llama-3.1-8b-instruct-fp8` doesn't support it. Agents tell users "I can't do that" or hallucinate data instead of calling real tools. | ⚪ **0%** | Create task; swap to `@cf/openai/gpt-oss-120b` after 502 fixed |

---

## Phase 4 — Quality & docs (P2–P3 — fix accuracy before prod)

| # | ID | What | Mastra features affected | Score | Next step |
|:-:|----|------|--------------------------|:-----:|-----------|
| 10 | ⚠️ **New** | Enable `AI_ROUTING_MODE=gateway` | **Gateway code is dead code.** `provider.ts` reads `AI_ROUTING_MODE` at line 129, defaults to `"direct"`. Even after all gateway code works perfectly, Mastra agents continue calling Gemini/Groq directly. The entire Cloudflare AI routing investment — `shouldRouteTierViaGateway()`, `resolveGatewayModelId()`, `createGatewayLanguageModel()` — is never triggered. | ⚪ **0%** | Create task; set env var in Infisical after 502 is fixed |
| 11 | **IPI-462** | CF-AI-006 — Eval suite | **Model changes can silently degrade agents.** Switching brand-intelligence from Gemini to Workers AI might produce worse DNA scores. No automated comparison catches it. Production-planner could start suggesting irrelevant shoot types. Creative-director could generate off-brand concepts. CRM-assistant could give wrong client advice. No quality gate for any agent output. | ⚪ **5%** | Write eval criteria per agent tier; block Workers AI default until this passes |
| 12 | ⚠️ **New** | Fix MASTRA-EPIC.md | **New devs waste time on the wrong thing.** Epic says "model-registry.ts is branch-only" — not true, it's on main. "Registry blocks everything" — no, the 502 is the real blocker. "Single SSOT" — no, there are two copies. Developers reading the epic make wrong prioritization decisions. | ⚪ **0%** | Docs PR fixing E1/E2/E3 from the audit |
| 13 | ⚠️ **New** | Fix mastra-studio-audit.md | **Developer builds tools system from scratch.** Studio audit claims ChatCompletionRequest lacks `tools`/`tool_choice` — they already exist in the Worker's `provider.ts`. Someone reading this might spend days implementing something that's already on main. | ⚪ **0%** | Docs PR fixing A1/A2/A3 from the audit |
| 14 | ⚠️ **New** | Fix prod readiness checklist | **Dual-registry risk is invisible.** Checklist item says "single SSOT ✅" which masks the drift problem. Someone signs off production readiness thinking registries are unified. A model mismatch slips to production, causing agent failures during a client demo. | ⚪ **0%** | Edit line 188 to say "dual registry — needs CI sync check" |

---

## Phase 5 — Hardening (P3 — production safety)

| # | ID | What | Mastra features affected | Score | Next step |
|:-:|----|------|--------------------------|:-----:|-----------|
| 15 | **IPI-460** | CF-AI-010 — Cost tracking | **No per-agent cost visibility.** Can't answer: "How much does brand-intelligence cost per analysis?" "Which client's agent usage is highest?" "Should we switch production-planner to a cheaper tier?" No data to optimize model selection per Mastra agent. | ⚪ **5%** | Wait for IPI-454 routing to stabilize first |
| 16 | **IPI-463** | CF-AI-008 — Failover | **Workers AI goes down → all agents fail.** Workers AI is the default MVP provider. If it goes down during a shoot, production-planner, brand-intelligence, creative-director, marketing-chat all fail. No automatic fallback to Gemini. The agent runtime has zero provider-availability awareness. | ⚪ **5%** | Wait for IPI-454 routing to stabilize |

---

## Phase 6 — Product agents (P4 — ship features)

| # | ID | What | Mastra features affected | Score | Next step |
|:-:|----|------|--------------------------|:-----:|-----------|
| 17 | **IPI-156** | CAMP-001 — Creative director | **No campaign workflows.** The creative-director agent is registered and can chat, but has zero workflows. No campaign creation workflow, no moodboard generation, no shoot brief workflow. The agent exists as a chatbot shell — Mastra's workflow engine (`step()`, `next()`) is unused for its core purpose. Users ask "plan a summer campaign" and get "I don't have that workflow yet." | 🟡 **70%** | Build campaign and shoot workflow chains after IPI-485 cutover |
| 18 | **IPI-233** | CF-AI-007 — Workflow chains | **No multi-agent orchestration.** Can't chain: brand-intelligence analyzes brand → production-planner generates shoot plan → creative-director creates moodboard → CRM assigns crew. Mastra's workflow engine (`shoot-wizard`, `brand-intelligence` workflows exist) but product automation chains aren't built. Each step requires manual user trigger. | 🔴 **0%** | Re-scope the 14-item checklist; depends on IPI-485 |

---

## Summary

| Phase | Tasks | Avg score | What needs to happen first |
|:------|:-----:|:---------:|---------------------------|
| 0 — Foundation | 2 | 🟡 78% | Remote preview + deploy pipeline |
| 1 — Gateway fix | 1 | 🔴 0% | **Fix the 502 (P0 blocker)** |
| 2 — Provider layer | 3 | 🟡 47% | Unblock via IPI-573, then reconcile types, wire adapter, E2E test |
| 3 — Cutover | 3 | ⚪ 3% | Wait for Phase 1 + 2 |
| 4 — Quality | 5 | ⚪ 2% | Create missing tasks; fix docs; write evals |
| 5 — Hardening | 2 | ⚪ 5% | Wait for Phase 2 |
| 6 — Product agents | 2 | 🟡 35% | Wait for Phase 3 |
| **Total** | **18** | **⚪ 22%** | **Fix IPI-573 → everything else follows** |

---

## Tasks that reference Groq (being retired)

These active tasks still mention Groq in their code or docs. They will need cleanup once the gateway path is stable.

| Task | Where Groq appears | Mastra impact | What to do |
|------|--------------------|---------------|------------|
| **IPI-490** | Description said "Groq bundle" | — | ✅ Already fixed in this table — work was historical |
| **IPI-457** | `AiProvider` type union includes `"groq"` | All agents' `resolveModel()` currently has a `"groq"` branch that's still active | Either drop `groq` during types reconciliation, or keep it until a dedicated cleanup task |
| **IPI-454** | `provider.ts` has a `"groq"` branch | `resolveModel()` still chooses `createGroqLanguageModel()` for certain tiers — bypasses gateway | Gateway path replaces it — AC-F removes the need for the Groq branch |
| ⚠️ **IPI-459** · CF-AI-009 | Not created in Linear yet | Remove `@ai-sdk/groq`, `groq-models.ssot.json`, `config/groq-models.json`, and all Groq-specific code from the agent provider layer |
