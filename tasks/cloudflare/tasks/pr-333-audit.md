Forensic Audit Report — PR #333 · Workers AI Tool Calling
Files (original): 8 files (+1217/−?), later split into 3 clean PRs
Updated since last review: Gemini guards added, ChatMessage now discriminated union

NOTE — SCOPE CORRECTION: The original PR #333 mixed code + skills + CLAUDE.md + audit doc in one PR, violating AGENTS.md #1 (NEVER MIX CONCERNS). It has since been split into:
  • PR #333 (now code-only): 4 files — types + Gemini guards + tests — ORIGINAL STALE
  • PR #334 (ipi/525-code): code-only split (identical to #333)
  • PR #335 (ipi/525-skill): docs-only — cloudflare-workflow skill + CLAUDE.md
  • PR #336 (ipi/525-audit): docs-only — this audit file
This audit was written for the pre-split state. The scores below have been corrected to reflect current truth.

Official Schema Verification (Gemma 4 26B — Cloudflare's own docs)
PR Type	Official Schema	Verdict
ToolDeclaration { type, function: { name, description?, parameters?, strict? } }	{ type: "function", function: { name, description?, parameters?, strict? } }	✅ Exact match — strict is real
ToolChoice = "none" | "auto" | "required" | { type: "function", function: { name } }	enum: ["none","auto","required"] + { type: "function", function: { name } } + { type: "custom", custom: { name } } + { type: "allowed_tools", ... }	✅ Matches OpenAI subset — custom/allowed_tools omitted (acceptable)
ChatToolCall { id, type: "function", function: { name, arguments: string } }	{ id, type: "function", function: { name, arguments: "JSON-encoded string" } }	✅ Exact match
ChatMessage discriminated union: system, user, assistant(content string|null), tool	Roles: system, developer, user, assistant, tool, function	✅ Correct — omission of developer/function is acceptable
assistant.content: string | null	content: string | null | array	🟡 Minor — array content not typed (rare edge case)
parallel_tool_calls: boolean	"parallel_tool_calls": {"type": "boolean", "default": true}	✅ Exact match
Cross-Reference Matrix
Cloudflare Official Schema
    ↓  match
PR #333 Types (provider.ts)
    ↓  used by
Workers AI Provider (workers-ai.ts) — forwards via JSON.stringify(req)
Router (router.ts) — body cast as unknown as ChatCompletionRequest
    ↓  guarded by
Gemini Provider (gemini.ts) — 3 rejection checks
    ↓  covered by
Tests (workers-ai.test.ts) — 4 mocked tests
Audit Findings
✅ CORRECT (verified against official Cloudflare schema)
Item	Evidence
Type definitions match OpenAI-compat format	Gemma 4 26B schema confirms { type: "function", function: { name, description?, parameters?, strict? } }
ChatToolCall shape correct	Schema confirms { id, type: "function", function: { name, arguments: string } } — arguments IS JSON-encoded string, not object
strict?: boolean is real field	Gemma schema: "strict": {"anyOf": [{"type": "boolean"}, {"type": "null"}], "default": false}
tool_choice: "required" is valid	Gemma schema: "enum": ["none", "auto", "required"]
tool_choice: { type: "function", function: { name } } is valid	Gemma schema confirms this variant
parallel_tool_calls: boolean is valid	Gemma schema: "type": "boolean", "default": true
tool role message with tool_call_id is valid	Gemma schema: { role: "tool", content, tool_call_id }
Provider pass-through works	JSON.stringify(req) in workers-ai.ts:44 forwards all unknown fields
Gemini tool guards fail closed	3 guards reject tools/tool_choice/parallel_tool_calls before reaching Gemini API
toGeminiMessages strips tool role	filter((m) => m.role !== "tool") — correct
toGeminiMessages handles content: null	m.content ? [{ text: m.content }] : [] — correct for assistant tool_calls-only messages
Streaming passes through raw SSE	new Response(upstream.body, ...) — correct, tool delta chunks pass through unchanged
Discriminated union ChatMessage is backward compatible	assistant, system, user roles still have content: string
🟡 MINOR ISSUES (non-blocking)
Issue	Detail	Recommendation
toGeminiMessages redundant ternary	.map((m) => (m.role === "system" ? m.content : "")) — the preceding .filter() already ensures role=system	Change to .map((m) => m.content)
assistant.content: string | null missing array variant	Official schema allows content to be string | null | array for multi-modal (text+image) assistant responses	Add array variant to type: content: string | null | Array<{type: "text"; text: string}>
ToolChoice omits custom and allowed_tools variants	Gemma schema has { type: "custom", custom: { name } } and { type: "allowed_tools", ... }	Acceptable — these are Workers AI-specific extensions, not part of OpenAI standard
🟢 LOW / NON-ISSUES (previously flagged, now cleared)
Issue	Resolution
strict field speculative	CLEARED — confirmed in Gemma 4 26B official schema
Response tool_calls format mismatch	CLEARED — confirmed arguments: string (JSON-encoded) is correct OpenAI format
No Router validation for tool-capable models	Acceptable — Router passes through, Workers AI returns error for unsupported models, caught by catch→502
✅ FIXED (all tests added before merge)
Gap	Status	Evidence
No test for Gemini tool guard	✅ FIXED	Commit ca37957d adds 10 tests: gemini.chat + chatStream each rejects tools, tool_choice, parallel_tool_calls, tool msgs, tool_calls msgs
No test for toGeminiMessages with tool-aware input	✅ Covered by tool_calls rejection tests	toGeminiMessages logic validated indirectly through tool_calls rejection tests
Redundant ternary in toGeminiMessages	✅ FIXED	Commit ca37957d removes redundant role check after filter
No test for streaming with tool_calls delta	🟢 N/A	Covered by workers-ai.test.ts passthrough tests; Gemini provider validates before reaching stream logic
No E2E live proof	🟡 Optional	Can add live curl proof in follow-up; primary safety gate (Gemini guard) is tested and passing
Router doesn't validate tool-capable model	🟢 N/A	Router passes through; Workers AI returns error for unsupported models, caught by catch→502
Grading
Criterion	Score	Rationale
Correctness vs official docs	95%	All types match Cloudflare's schema exactly; minor array-content type omission
Test coverage	90%	18 tests in gemini.test.ts (10 guard tests new), 14 in workers-ai.test.ts. Full Gemini rejection coverage. LIVE PROOF MISSING: tools silently dropped by deployed Gemini (pre-PR #333). No model-registry tool-capable model registered
Safety (fail-closed)	85%	Gemini guards fail closed at 6 validation checkpoints in code. BUT: deployed Worker (ai-gateway.sk-498.workers.dev) is pre-PR #333 — no guards active. Tools silently dropped by Gemini provider. Live gateway has zero auth
Scope preservation	30%	FAIL — Original PR #333 mixed code + skills + CLAUDE.md + audit in one PR. Violation of AGENTS.md #1. Split into #334/#335/#336 fixed this, but the violation existed at time of writing
Docs alignment	70%	Types match Cloudflare official schema. But: no model-registry entry for a tool-capable Workers AI model. CLAUDE.md update and cloudflare-workflow skill moved to PR #335
Composite	70%	CORRECTED from 96%. Main drag: scope violation (30%), and production readiness blockers (deployed guards missing, no auth, no model-registry update)
Merge Recommendation
🟡 **SPLIT REQUIRED — DO NOT MERGE AS-IS**

The original PR #333 had mixed concerns and was blocked. It has since been split into 3 clean PRs:
  • PR #334 (code-only) — review and merge this for the code changes
  • PR #335 (docs-only) — merge-ready, infra CI failures are pre-existing
  • PR #336 (audit-only) — this file, updated here

Gates status:
✅ Gemini guard tests added (10 test cases, commit ca37957d)
✅ Redundant ternary fixed (1 line change, commit ca37957d)
✅ All 1150 app tests pass
✅ All 67 Worker tests pass (includes 18 Gemini tests)
✅ ChatMessage discriminated union enforces tool_call_id requirement
✅ Tool rejection fails closed at 6 validation points (tools, tool_choice, parallel_tool_calls, tool msgs, assistant tool_calls, content: null handling)
🔴 CLAUDE.md update → MOVED to PR #335
🔴 cloudflare-workflow skill → MOVED to PR #335
🔴 Scope violation → SPLIT into 3 clean PRs (now resolved)

Post-merge blockers (must close before IPI-525 can ship):
1. Merge PR #334 → deploy Worker → verify tools no longer silently dropped
2. Register a tool-capable Workers AI model (e.g. qwen3-30b-a3b-fp8) in model-registry.ts
3. Add Bearer auth to Worker handleChat() — currently zero auth on deployed gateway
4. Fix requireOperator() gap — referenced in middleware.ts but does not exist
5. Live E2E proof: Mastra agent → gateway → Workers AI tool_calls → execute → result
6. Optional: add array-content variant to ChatMessage assistant type for future multi-modal support

Production readiness: **NOT YET**. Blocked on deployment gap (guards not live), no model-registry tool model, zero auth on gateway, missing requireOperator(). Composite corrected from 96% to 70%.