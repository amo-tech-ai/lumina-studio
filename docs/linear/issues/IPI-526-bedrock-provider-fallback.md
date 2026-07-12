---
title: "IPI-526 · CF-AI-012 — AWS Bedrock Provider Fallback"
cycle: 2026-Q3
epic: CF-AI-012
status: Todo
---

# IPI-526 · CF-AI-012 — AWS Bedrock Provider Fallback

**Objective:** Replace Gemini fallback with AWS Bedrock. Workers AI remains PRIMARY; Bedrock is ONLY fallback on retryable errors.

**Scope:** Provider implementation, routing logic, tests, docs. **Keep focused — no unrelated refactoring.**

---

## Acceptance Criteria

**A. Bedrock provider implementation**
- [x] New file: `services/cloudflare-worker/src/providers/bedrock.ts` (166 lines)
- [x] Chat Completions API endpoint (bedrock-mantle, not bedrock-runtime)
- [x] Support: messages, tools, tool_choice, tool_calls, tool_call_id
- [x] Support streaming via SSE
- [x] Reuse ChatMessage type from provider.ts (no converter needed)
- [x] TypeScript strict mode passes
- [x] proof: `npx tsc --noEmit` passes in services/cloudflare-worker

**B. Authentication & provider registry**
- [x] **Authentication method documented:** Bedrock API key (not IAM credentials) for Chat Completions API
- [x] **No hardcoded credentials** in code — all from environment
- [x] Credentials loaded from: `AWS_BEDROCK_API_KEY`, `AWS_REGION`, `AWS_BEDROCK_BASE_URL`
- [x] Extend provider type: `provider: "workers-ai" | "bedrock" | "gemini" | "nvidia"`
- [x] Extend ModelEntry interface with provider field
- [x] Example registry entry: workers-ai primary, bedrock fallback (model ID configurable, not hardcoded)
- [x] Retryable error classification function: retry on 429, 500–599, timeout, connection reset, DNS failure
- [x] Do NOT retry: 400, 401, 403, schema validation, tool schema errors
- [x] proof: `grep -rn "bedrock\|retryable" services/cloudflare-worker/src/providers/` confirms implementation

**C. Fallback routing in gateway**
- [x] Router detects Workers AI failure (try/catch in handleChat)
- [x] If retryable → fallback to Bedrock (resolveModelEntry("default-fallback"))
- [x] If non-retryable → propagate error immediately (isRetryableProviderError gate)
- [x] Log provider failure + fallback event (include request ID)
- [x] Streaming fallback: preserve SSE passthrough
- [x] proof: Unit tests in router.fallback.test.ts (422 lines) cover all fallback scenarios

**D. Logging & observability**
- [x] Request ID logged with every provider call (console.log with requestId field)
- [x] Provider name logged (entry.provider in log)
- [x] Model name logged (entry.model in log)
- [x] Latency measured and logged (Date.now() delta at each step)
- [x] Fallback reason logged (e.g., "retryable error from primary provider, attempting fallback")
- [x] Tool calling events logged (hasToolCalls, toolCallCount in success log)
- [x] proof: All logging statements in router.ts handleChat()

**E. Tests**
- [x] Unit: Bedrock provider chat() with tools (bedrock.test.ts: 6 tests)
- [x] Unit: Bedrock provider chatStream() with SSE (bedrock.test.ts: streaming tests)
- [x] Integration: Workers AI 503 → fallback to Bedrock → success (router.fallback.test.ts)
- [x] Integration: Tool round-trip via fallback (router.fallback.test.ts: tool call scenarios)
- [x] Edge case: Workers AI 400 (invalid request) does NOT fallback (retry-classifier.test.ts)
- [x] Edge case: Workers AI timeout → Bedrock fallback succeeds (router.fallback.test.ts)
- [x] All tests pass: `npm test` — 104/104 passing (was 96, added 8 regression tests)
- [x] proof: `npm test -- src/providers/bedrock.test.ts` shows 6 tests passing

**F. Documentation & cleanup**
- [x] Gemini kept as registry-resolvable provider in router — intentionally, for `structured` & `vision` tiers that still need Gemini (removal is follow-up IPI-NNN, not part of fallback replacement)
- [ ] Update CLAUDE.md gateway architecture section
- [x] Add Bedrock model example to registry docs (model-registry.ts + docs in spec)
- [x] Document Bedrock API choice (Chat Completions API — correct for stateless fallback)
- [x] Document authentication approach (Bedrock API key, not IAM)
- [x] Remove Gemini fallback config from wrangler.jsonc (wrangler.jsonc already clean — no Gemini env vars)
- [ ] Update task tracker: `tasks/plan/todo.md` row marked 🟢
- [ ] Linear marked Done (via MCP save_issue)
- [ ] proof: `grep -rn "gemini" services/cloudflare-worker/src/router.ts` shows Gemini references remaining (intentional) + Bedrock additions

---

## Skills

Read these before implementation:

| Skill | When |
|-------|------|
| [nextjs-developer](/.claude/skills/nextjs-developer/SKILL.md) | Next.js routes, env vars, build context |
| [cloudflare-workflow](/.claude/skills/cloudflare-workflow/SKILL.md) | 8-stage Cloudflare gate (evidence, testing, bundle, production readiness) |
| [pr-workflow](/.claude/skills/pr-workflow/SKILL.md) | Verify matrix, PR review gates, one concern per commit |
| [task-verifier](/.claude/skills/task-verifier/SKILL.md) | Before marking Done — spec quality, execution probes, anti-fake-done checklist |

AWS plugin (now available) handles authentication + MCP tools for Bedrock discovery (optional).

---

## Architecture

**Current (to replace):**

```
Mastra agents
    ↓
iPix AI Gateway Worker
    ↓
Primary: Cloudflare Workers AI
    ↓
Fallback: Gemini (deprecated)
```

**Target:**

```
Mastra agents
    ↓
iPix AI Gateway Worker
    ↓
Primary: Cloudflare Workers AI
    ↓ (if 429/5xx/timeout)
Fallback: AWS Bedrock (Chat Completions API)
```

**Model routing example:**

| Use case | Primary | Fallback |
|----------|---------|----------|
| Marketing chat | Workers AI small/fast | Bedrock GPT OSS 20B |
| Booking agent | Workers AI GPT OSS 120B | Bedrock GPT OSS 120B |
| Production planner | Workers AI GPT OSS 120B | Bedrock GPT OSS 120B |

---

## Implementation notes

**Bedrock API choice:**
- Use **Chat Completions API** (`/v1/chat/completions`) — correct for lightweight stateless fallback (text-focused tasks with tool calling)
- Not Responses API (heavier, agentic-oriented — unnecessary for fallback)
- Endpoint: `https://bedrock-mantle.<region>.api.aws/v1/chat/completions` (unified endpoint)
- Not `bedrock-runtime.<region>.amazonaws.com` (native API endpoint — requires SigV4 signing)

**Authentication:**
- ⚠️ **CRITICAL:** Use **Bedrock API key** for Responses API, NOT raw IAM credentials
- IAM credentials (AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY) are only for native Bedrock APIs (Converse, InvokeModel) via AWS SDK
- OpenAI-compatible Bedrock APIs require Bedrock-native authentication
- Environment variables:
  ```bash
  AWS_BEDROCK_API_KEY        # Bedrock API key (required for Responses API)
  AWS_REGION                 # e.g., us-east-1
  AWS_BEDROCK_BASE_URL       # Optional: override endpoint, defaults to bedrock-mantle.<region>.api.aws
  ```

**Model routing (configurable via registry, NOT hardcoded):**
- Primary: Workers AI (`@cf/openai/gpt-oss-120b`)
- Fallback: Bedrock (`openai.gpt-oss-120b-1:0` as example, but make configurable)
- Update registry to include provider + model pairs, example:
  ```json
  {
    "default-fallback": {
      "provider": "bedrock",
      "model": "openai.gpt-oss-120b-1:0"
    }
  }
  ```

**Verify Bedrock access:**
```bash
# First, get Bedrock API key from AWS console or credentials system
# Then test connectivity (tool calling support verification coming next)
```

**Fallback logic pattern:**

```typescript
try {
  return await workersAiProvider.chat(request, workersConfig);
} catch (error) {
  if (!isRetryableProviderError(error)) {
    throw error; // Non-retryable → fail fast
  }
  log.info("Workers AI failed, attempting Bedrock fallback", { error, requestId });
  return bedrockProvider.chat(request, bedrockConfig);
}
```

---

## Do NOT

- **Do not** modify unrelated features
- **Do not** add Gemini as an alternative in the fallback tier — Gemini stays as a registry-resolvable provider for `structured`/`vision` tiers (separate concern, not in IPI-526 scope)
- **Do not** retry on authentication errors (401, 403)
- **Do not** retry on request validation (400)
- **Do not** implement Bedrock Converse API — use Chat Completions API only
- **Do not** merge without all AC checked in this spec md

---

## Deliverables

1. **Code:** `services/cloudflare-worker/src/providers/bedrock.ts` (166 lines)
2. **Tests:** `services/cloudflare-worker/src/providers/bedrock.test.ts` (6 tests), `retry-classifier.test.ts` (19 tests), `router.fallback.test.ts` (9 integration tests)
3. **Router update:** Fallback logic in router.ts (304 lines, +204/-5)
4. **Retry classifier:** `retry-classifier.ts` (112 lines)
5. **Docs:** Updated spec (this file) + registry docs in model-registry.ts
6. **Tracker:** Update `tasks/plan/todo.md`
7. **Linear:** Mark this issue Done

**Branch:** `ipi/526-bedrock-fallback` (37 commits, 11 PR files)

**Proof commands (run before merge):**

```bash
# Typecheck
cd /home/sk/ipix/services/cloudflare-worker && npx tsc --noEmit

# Unit tests (Worker)
cd /home/sk/ipix/services/cloudflare-worker && npm test

# Verify Bedrock provider exists
ls -la /home/sk/ipix/services/cloudflare-worker/src/providers/bedrock.ts

# Verify Gemini as provider (not fallback) — 3 references remain in router (intentional)
grep -n "gemini" /home/sk/ipix/services/cloudflare-worker/src/router.ts

# Full app test
cd /home/sk/ipix/app && npm test
```

---

## Official AWS References

| Purpose | Reference | Use case |
|---------|-----------|----------|
| Tool/function calling | [AWS Bedrock Tool Use](https://docs.aws.amazon.com/bedrock/latest/userguide/tool-use.html) | Implement tool calling in bedrock.ts |
| Endpoint selection | [AWS Bedrock Endpoints](https://docs.aws.amazon.com/bedrock/latest/userguide/endpoints.html) | Use `bedrock-mantle.<region>.api.aws` for Responses API |
| API comparison | [AWS Bedrock APIs](https://docs.aws.amazon.com/bedrock/latest/userguide/apis.html) | Chat Completions API for stateless fallback (not Responses API) |
| Authentication | [OpenAI Bedrock Responses API](https://help.openai.com/en/articles/20001254-responses-api-support-on-amazon-bedrock) | Use Bedrock API key (not IAM credentials) |

## Related

- Bedrock audit: `tasks/cloudflare/bedrock/bedrock-notes.md` (critical corrections from official AWS docs)
- Bedrock fallback spec: `tasks/cloudflare/bedrock/bedrock-fallback.md`
- PR #333/334 (tool calling): OpenAI-compatible protocol reference
- AWS Bedrock docs: https://docs.aws.amazon.com/bedrock/
