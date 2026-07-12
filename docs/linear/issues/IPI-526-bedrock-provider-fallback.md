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
- [ ] New file: `services/cloudflare-worker/src/providers/bedrock.ts`
- [ ] Responses API endpoint (bedrock-mantle, not bedrock-runtime)
- [ ] Support: messages, tools, tool_choice, tool_calls, tool_call_id (from PR #333)
- [ ] Support streaming via SSE
- [ ] Reuse ChatMessage type from provider.ts (no converter needed)
- [ ] TypeScript strict mode passes
- [ ] proof: `npm run typecheck` from app/ directory

**B. Authentication & provider registry**
- [ ] **Authentication method documented:** Bedrock API key (not IAM credentials) for Responses API
- [ ] **No hardcoded credentials** in code — all from environment
- [ ] Credentials loaded from: `AWS_BEDROCK_API_KEY`, `AWS_REGION`, `AWS_BEDROCK_BASE_URL`
- [ ] Extend provider type: `provider: "workers-ai" | "bedrock"`
- [ ] Extend ModelEntry interface with provider field
- [ ] Example registry entry: workers-ai primary, bedrock fallback (model ID configurable, not hardcoded)
- [ ] Retryable error classification function: retry on 429, 500–504, timeout, connection reset, DNS failure
- [ ] Do NOT retry: 400, 401, 403, schema validation, tool schema errors
- [ ] proof: `grep -rn "bedrock\|retryable" services/cloudflare-worker/src/providers/` confirms implementation

**C. Fallback routing in gateway**
- [ ] Router detects Workers AI failure
- [ ] If retryable → fallback to Bedrock
- [ ] If non-retryable → propagate error immediately
- [ ] Log provider failure + fallback event (include request ID)
- [ ] Streaming fallback: preserve SSE passthrough
- [ ] proof: Curl test: Workers AI 503 → Bedrock returns 200 with tool_calls

**D. Logging & observability**
- [ ] Request ID logged with every provider call
- [ ] Provider name logged (workers-ai vs bedrock)
- [ ] Model name logged
- [ ] Latency measured and logged
- [ ] Fallback reason logged (e.g., "Workers AI 503 → Bedrock fallback")
- [ ] Tool calling events logged (tool request, tool call, tool result)
- [ ] proof: Logs visible in Worker logs / observability system

**E. Tests**
- [ ] Unit: Bedrock provider chat() with tools
- [ ] Unit: Bedrock provider chatStream() with SSE
- [ ] Integration: Workers AI 503 → fallback to Bedrock → success
- [ ] Integration: Tool round-trip via fallback (execute tool, return result, continue)
- [ ] Edge case: Workers AI 400 (invalid request) does NOT fallback
- [ ] Edge case: Workers AI timeout → Bedrock fallback succeeds
- [ ] All tests pass: `npm test` from services/cloudflare-worker/
- [ ] proof: `npm test -- src/providers/bedrock.test.ts` shows ≥6 tests passing

**F. Documentation & cleanup**
- [ ] Remove Gemini provider references from router
- [ ] Update CLAUDE.md gateway architecture section
- [ ] Add Bedrock model example to registry docs
- [ ] Document Bedrock API choice (Responses API recommended)
- [ ] Document authentication approach (Bedrock API key, not IAM)
- [ ] Remove Gemini fallback config from wrangler.jsonc
- [ ] Update task tracker: `tasks/plan/todo.md` row marked 🟢
- [ ] Linear marked Done (via MCP save_issue)
- [ ] proof: `git diff main | grep -E "bedrock|gemini"` shows additions + Gemini removals

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
Fallback: AWS Bedrock (Responses API)
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
- Use **Responses API** (newer, recommended by AWS for OpenAI-compatible apps)
- Not Chat Completions (supported but legacy path)
- Endpoint: `https://bedrock-mantle.<region>.api.aws` (unified endpoint)
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
- **Do not** add Gemini as an alternative — remove it entirely
- **Do not** retry on authentication errors (401, 403)
- **Do not** retry on request validation (400)
- **Do not** implement Bedrock Converse API — use Responses API only
- **Do not** merge without all AC checked in this spec md

---

## Deliverables

1. **Code:** `services/cloudflare-worker/src/providers/bedrock.ts`
2. **Tests:** `services/cloudflare-worker/src/providers/bedrock.test.ts` (≥6 tests)
3. **Router update:** Fallback logic in router.ts or index.ts
4. **Docs:** Update `CLAUDE.md`, registry docs, remove Gemini references
5. **Tracker:** Update `tasks/plan/todo.md`
6. **Linear:** Mark this issue Done

**Branch:** `ipi/526-bedrock-fallback`

**Proof commands (run before merge):**

```bash
# Typecheck
cd /home/sk/ipix/app && npm run typecheck

# Unit tests (Worker)
cd /home/sk/ipix/services/cloudflare-worker && npm test

# Verify Bedrock provider exists
ls -la /home/sk/ipix/services/cloudflare-worker/src/providers/bedrock.ts

# Verify Gemini references removed from router
grep -c "gemini" /home/sk/ipix/services/cloudflare-worker/src/router.ts || echo "0"

# Full app test
cd /home/sk/ipix/app && npm test
```

---

## Official AWS References

| Purpose | Reference | Use case |
|---------|-----------|----------|
| Tool/function calling | [AWS Bedrock Tool Use](https://docs.aws.amazon.com/bedrock/latest/userguide/tool-use.html) | Implement tool calling in bedrock.ts |
| Endpoint selection | [AWS Bedrock Endpoints](https://docs.aws.amazon.com/bedrock/latest/userguide/endpoints.html) | Use `bedrock-mantle.<region>.api.aws` for Responses API |
| API comparison | [AWS Bedrock APIs](https://docs.aws.amazon.com/bedrock/latest/userguide/apis.html) | Choose Responses API (not Chat Completions) |
| Authentication | [OpenAI Bedrock Responses API](https://help.openai.com/en/articles/20001254-responses-api-support-on-amazon-bedrock) | Use Bedrock API key (not IAM credentials) |

## Related

- Bedrock audit: `tasks/cloudflare/bedrock/bedrock-notes.md` (critical corrections from official AWS docs)
- Bedrock fallback spec: `tasks/cloudflare/bedrock/bedrock-fallback.md`
- PR #333/334 (tool calling): OpenAI-compatible protocol reference
- AWS Bedrock docs: https://docs.aws.amazon.com/bedrock/
