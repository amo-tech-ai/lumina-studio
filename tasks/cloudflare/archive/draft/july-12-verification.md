Now I have complete data. Here is the forensic audit of IPI-525 / PR #333.

---

## Verification Report — 2026-07-12 · IPI-525 Workers AI Tool Calling

| Task | Spec /100 | Execution /100 | Skills /100 | Composite | Blockers | Safe? |
|------|----------:|---------------:|------------:|----------:|----------|-------|
| IPI-525 | **65** | **60** | **70** | **64** | **2 🔴** | **Not ready** |

### Files Changed (PR #333)
- `services/cloudflare-worker/src/providers/provider.ts` — types added (87 lines)
- `services/cloudflare-worker/src/providers/workers-ai.test.ts` — 4 tool tests added

`workers-ai.ts` is **not modified** — the pass-through `JSON.stringify(req)` already forwards unknown fields. No router changes. No model-registry changes.

### Red Flags

| # | Flag | Sev | Evidence | Root cause |
|---|------|:---:|----------|------------|
| **1** | **Response `tool_calls` format unverified** | 🔴 | gpt-oss-120b `sync-output.json` returns native `{ arguments: object, name: string }` at top level; PR assumes OpenAI format `{ id, type: "function", function: { name, arguments: string } }` inside `choices[].message` | The `/run` endpoint and `/v1/chat/completions` endpoint may return different shapes. **Never tested.** |
| **2** | **No live proof with real Workers AI model** | 🔴 | All 4 tests mock `fetch` — zero bytes sent to an actual Workers AI endpoint | PR scope was types+tests only; E2E was deferred |
| **3** | **`strict?: boolean` in `ToolDeclaration`** | 🟡 | `strict` is **not** in any Workers AI model schema (gpt-oss-120b, Gemma 4 26B, Grok 4.20). The OpenAI-compat endpoint may ignore or reject it | Speculative field copied from OpenAI spec |
| **4** | **`parallel_tool_calls` not in gpt-oss-120b schema** | 🟡 | gpt-oss-120b sync-input.json has no `parallel_tool_calls` field; Grok 4.20 and Gemma 4 26B do | Field is model-dependent |
| **5** | **`tool_choice` not in gpt-oss-120b schema** | 🟡 | gpt-oss-120b Messages variant has no `tool_choice`; Gemma 4 26B and Grok 4.20 do | Field is model-dependent |
| **6** | **Test model not in Worker model registry** | 🟡 | Test uses `@cf/openai/gpt-oss-120b` but Worker `model-registry.ts` has no `tools` tier or entry for this model | Registry update not included in PR |
| **7** | **No Router-level tool validation** | 🟢 | Router `handleChat` casts `body as unknown as ChatCompletionRequest` — tools pass through unchecked. Workers AI returns error for unsupported models, caught by catch→502 | Intentional pass-through design |

### What's Actually Correct

| Item | Status | Evidence |
|------|:------:|----------|
| Type definitions (`ToolDeclaration`, `ToolChoice`, `ChatToolCall`) | ✅ | Match OpenAI-compat shape used by Gemma 4 26B and Grok 4.20 schemas |
| Extended `ChatMessage` (`tool` role, `tool_call_id`, `tool_calls`) | ✅ | Verified in gpt-oss-120b output schema |
| Provider pass-through (no workers-ai.ts changes needed) | ✅ | `JSON.stringify(req)` forwards all fields — verified by reading source |
| Tests cover 4 scenarios (forward, response, multi-turn, stream) | ✅ | All 4 test shapes verified in diff |
| Breaking change to `ChatCompletionResponse.choices[].message` | ✅ | Backward-compatible — `content: string` still present |
| Router `handleChat` passes tools through to provider | ✅ | Router uses `body as unknown as ChatCompletionRequest` — any JSON fields pass through |

### Claims for IPI-525

| Claim | Status | Probe |
|-------|:------:|-------|
| Types added to `provider.ts` | ✅ | `ToolDeclaration`, `ToolChoice`, `ChatToolCall`, extended `ChatMessage`, extended `ChatCompletionRequest` |
| Workers AI provider forwards tools | ✅ | `JSON.stringify(req)` in workers-ai.ts:44 passes all fields unchanged |
| Tests verify tool forwarding | ✅ | 4 tests: request shape, response `tool_calls`, multi-turn `tool` role, streaming |
| Router accepts tool requests | ✅ | `body as unknown as ChatCompletionRequest` in router.ts:132 |
| Gateway Worker deployed with tool support | ❌ | PR not merged — branch only |
| Live E2E with real Workers AI model | ❌ | No curl/puppeteer proof |
| Model registry updated for tool-capable model | ❌ | No changes to `model-registry.ts` |
| Stream response includes `tool_calls` delta | ❌ | Not tested — streaming test only verifies request body shape |

### Docs Contradictions

| Surface | Status | Detail |
|---------|:------:|--------|
| Source code (`provider.ts`) | ✅ | Matches OpenAI-compat shape |
| Tests (`workers-ai.test.ts`) | ⚪ | Mock tests — don't prove real API behavior |
| Cloudflare docs (gpt-oss-120b schema) | 🟡 | Native tool_calls format `{ arguments: object, name }` — PR assumes OpenAI format `{ id, type, function: { name, arguments: string } }` |
| Linear IPI-525 | ⚪ | No spec file on disk at `docs/linear/issues/IPI-525.md` |
| todo.md | 🟡 | Lists 7 stages, says 0% — PR shows ~60% code complete |

### Required Fixes Before Merge

1. **🔴 Contract spike**: Send one real curl with `tools` + `tool_choice` to `gpt-oss-120b` via the gateway, verify response `tool_calls` shape. If it returns OpenAI format → bump severity to 🟢. If native → fix `ChatToolCall` and response mapper.
2. **🔴 Add `@cf/openai/gpt-oss-120b` or similar tool-capable model** to Worker `model-registry.ts` as a new `tools` tier (or extend `fast`).
3. **🟡 Remove `strict?: boolean`** from `ToolDeclaration` unless Cloudflare docs confirm support.
4. **🟡 Gate `tool_choice` and `parallel_tool_calls`** behind `AI_GATEWAY_ALLOW_TOOL_TIERS` check in router, matching the pattern used for `fast` tier routing.
5. **🟡 Add non-mock E2E test** (or curl proof) that sends a real tool request through the live gateway.

### Remaining Risks

- If Workers AI returns native `tool_calls` format (`{ arguments: object, name }`) instead of OpenAI format (`{ id, type, function: { name, arguments } }`), the types won't match and Mastra will fail to parse tool responses.
- Current 502 on gateway POST means **no tool routing works at all** until the `GEMINI_API_KEY not configured` error is fixed (dashboard re-deploy needed).
- The existing agent model `@cf/meta/llama-3.1-8b-instruct-fp8` doesn't support function calling — even with types deployed, tool calls will fail until the model is swapped.

### Recommendations

1. **Do not merge PR #333** until the contract spike proves the response format.
2. Fix the gateway 502 first (IPI-454 AC-J) — without a working gateway, no tool calls can be tested.
3. Run one curl:
   ```bash
   curl https://ai-gateway.sk-498.workers.dev/v1/chat/completions \
     -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "model": "@cf/openai/gpt-oss-120b",
       "messages": [{"role": "user", "content": "What is the weather in London?"}],
       "tools": [{
         "type": "function",
         "function": {
           "name": "get_weather",
           "description": "Get weather",
           "parameters": {
             "type": "object",
             "properties": {"city": {"type": "string"}},
             "required": ["city"]
           }
         }
       }],
       "tool_choice": "auto"
     }'
   ```
4. Audit the response `tool_calls` shape before any type assumptions.

## Objective
- Audit Mastra Studio provider display, verify Cloudflare AI platform tasks, create IPI-525 for Workers AI tool calling, and produce forensic verification reports with corrected findings

## Important Details
- **CORRECTION (2026-07-12):** Workers AI DOES support function/tool calling on 16+ models (`gpt-oss-120b`, `llama-4-scout`, `qwen3-30b`, etc.) via the standard OpenAI-compatible API. The Mastra docs model table (empty Tools column for all 22 models) is misleading — Cloudflare's own docs confirm tools work. See `tasks/cloudflare/tasks/mastra-studio-audit.md` §5.2.
- Worker live at `https://ai-gateway.sk-498.workers.dev` — both `GET /health` and `POST /v1/chat/completions` return 200 ✅ (the 502 was transient, now resolved)
- PR #317 merged (`ca5a077`) — AC-F landed, `fast` tier gateway-routable; `default`/`structured`/`vision` remain direct; `AI_GATEWAY_ALLOW_TOOL_TIERS` disabled
- PR #328 merged (`d0d82792`) — IPI-519 PR-Agent GitHub Action deployed to `origin/main` (`.pr_agent.toml` + `.github/workflows/pr-agent.yml`)
- PR #323 merged (`fc3a951d`) — IPI-472 empty vars wipe fixed
- `model-registry.ts` on `main` via PR #302; IPI-457 is Done
- `GEMINI_API_KEY` + `SUPABASE_SERVICE_ROLE_KEY` still exposed in plaintext in `app/.env.local`
- IPI-525 is the new task for Workers AI Tool Calling — code support added (types, streaming, tests in draft PR #333), live proof still missing, ~60-70% complete
- Corrected priority: IPI-508 (fast-tier browser E2E) before IPI-525 implementation

## Work State
### Completed
- Synced repo, verified all probes (Worker live ✅, PRs merged, model-registry on main)
- **Corrected** the Worker AI tool-calling finding in `mastra-studio-audit.md` (30+ references updated) and `todo.md`
- Created **IPI-525** (CF-AI-011 — Workers AI Tool Calling) with mermaid diagrams, 7-stage plan, model cost table, and acceptance criteria
- Updated IPI-525 Linear description with architecture diagrams (before/after) and implementation flow
- Added 2 Linear comments: IPI-454 (new IPI-525 dependency) and IPI-485 (updated dependency chain)
- Verified CLOUDFLARE-EPIC.md — 4 stale status fields (IPI-457, IPI-454, IPI-471, IPI-490), architecture/dependencies correct, ~88% accuracy
- Read all 9 agent definitions, tool registry, Workers router, providers, model-registry
- Confirmed Mastra Studio Google display is **expected** — `resolveModel("default")` at module load, `AI_PROVIDER="gemini"`, `AI_ROUTING_MODE="direct"`
- Wrote and corrected `/home/sk/ipix/tasks/cloudflare/tasks/mastra-studio-audit.md` (471 lines) — comprehensive forensic audit with corrected tool-calling section

### Active
- IPI-525 draft PR #333 open at `https://github.com/amo-tech-ai/lumina-studio/pull/333` — tool types + streaming + tests added, live Workers AI proof still missing
- IPI-508 (fast-tier browser E2E) identified as immediate next task before IPI-525 implementation

### Blocked
- IPI-525 needs live proof with a real Workers AI model (`gpt-oss-120b`) — send tools → receive `tool_calls` → execute → send result → final answer
- `AI_ROUTING_MODE` env var does not exist in any `.env` file or Infisical
- IPI-465 (shared tool registry) still pre-design — no shared registry code exists

## Next Move
1. **IPI-471** → Move to Done (architecture doc on main)
2. **IPI-490** → Run final remote preview, move to Done (track PostgresStore hang separately)
3. **IPI-508** → Run browser E2E for `public-marketing`/`fast` tier through live gateway (streaming, cancellation, error handling, direct fallback)
4. **IPI-454 AC-J** → Record proof from IPI-508
5. **IPI-525** → Contract spike: one read-only tool (`get_weather`) through `gpt-oss-120b` via curl/gateway
6. **IPI-465** → Design shared tool registry (tool ID, Zod schemas, HITL policy, audit format)
7. **IPI-525** forwarding implementation → Add `tools`/`tool_choice` to gateway, behind `AI_GATEWAY_ALLOW_TOOL_TIERS`
8. **IPI-462** → Run provider eval suite before broad migration
9. **IPI-485** → Gradual agent cutover (fast → one tool → CRM → booking → planner)

## Relevant Files
- `/home/sk/ipix/tasks/cloudflare/tasks/mastra-studio-audit.md`: Corrected forensic audit (11 sections + 3 appendices, updated §5.2 for tool calling)
- `/home/sk/ipix/tasks/cloudflare/todo.md`: Updated platform tracker — IPI-525 added, scores corrected, resolved blockers listed
- `/home/sk/ipix/tasks/cloudflare/CLOUDFLARE-EPIC.md`: Epic strategy — 4 stale statuses need updating
- `/home/sk/ipix/tasks/cloudflare/plan/cf-000-platform-architecture.md`: Architecture doc, on main (169 lines, 7 agents)
- `/home/sk/ipix/tasks/cloudflare/dash/setup.md`: Dashboard setup doc — needs IPI-525 reference added
- `/home/sk/ipix/app/src/lib/ai/provider.ts`: Core provider resolver — `resolveModel()`, `shouldRouteTierViaGateway()`, AI_GATEWAY_ALLOW_TOOL_TIERS
- `/home/sk/ipix/app/src/lib/ai/provider-adapter.ts`: Gateway client factory — `AI_GATEWAY_URL` fallback at line 41
- `/home/sk/ipix/app/src/lib/ai/model-registry.ts`: Typed model registry on main (PR #302)
- `/home/sk/ipix/app/src/mastra/agents/index.ts`: Agent definitions — `MODEL` frozen at module load (line 9)
- `/home/sk/ipix/app/src/mastra/agents/public-marketing-agent.ts`: Only `fast`-tier agent, sole gateway-eligible
- `/home/sk/ipix/services/cloudflare-worker/src/providers/provider.ts`: `ChatCompletionRequest` — needs `tools`/`tool_choice` added
- `/home/sk/ipix/services/cloudflare-worker/src/providers/workers-ai.ts`: Workers AI provider — needs tool forwarding
- `/home/sk/ipix/linear/issues/IPI-525.md`: New task spec file for Workers AI Tool Calling
- Draft PR #333: `https://github.com/amo-tech-ai/lumina-studio/pull/333` — tool types+streaming+tests (live proof pending)