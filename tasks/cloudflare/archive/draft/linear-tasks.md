# Linear Tasks — Verified Status (Jul 12, 2026)

**Verification method:** Live Linear MCP queries (not assumptions)

**Date verified:** 2026-07-12

---

## IPI-525 · CF-AI-011 — Workers AI Tool Calling

**Linear status:** 🟡 In Progress (no blockers)
**Priority:** Urgent (1)
**Assigned:** S K
**PR:** #333 attached
**Branch:** `ai/ipi-525-cf-ai-011-workers-ai-tool-calling-add-toolstool_choice`
**Created:** 2026-07-12 04:11 UTC
**Started:** 2026-07-12 04:30 UTC

### Verdict: KEEP In Progress, NO blockers

**Why:** Critical path. Linter is fixed, so no false dependencies.

### Before Done
- [ ] PR #333 passes live tool round-trip test (curl with `tools` array)
- [ ] Tool forwarding works: model receives `tools`, returns `tool_calls`
- [ ] Streaming `tool_calls` works (chunked responses)
- [ ] Fallback to Gemini if gateway down
- [ ] Mastra production-planner routes through gateway with tools

---

## IPI-490 · CF-MIG-210 — Runtime Compatibility (Hono, OAuth, Groq)

**Linear status:** 🟡 In Progress (NOT ready for Done yet)
**Priority:** Urgent (1)
**Created:** 2026-07-10 09:41 UTC
**PR:** #286 (real-world verification complete)

### Verdict: KEEP In Progress (despite "verified" status)

**Why:** PR #286 explicitly says "not ready for Done" — intermittent PostgresStore hang identified.

### Status (from PR #286)
- ✅ Hono + OpenNext work on Cloudflare preview
- ✅ OAuth callbacks work on preview hosts
- ✅ Groq bundle verified in Worker
- ✅ CopilotKit streams work when DB query succeeds
- 🟡 PostgresStore hang mitigated with 20s timeout (not fixed)

### Acceptance criteria met
- [X] Runtime typecheck/test/build passes
- [X] Worker starts successfully
- [X] `/api/copilotkit` smoke test passes
- [X] Marketing chat streams on preview
- [X] OAuth allowlist verified
- [X] Groq config present in bundle
- [⚠️] CopilotKit streaming: works when DB succeeds; bounded RUN_ERROR at 20s when it doesn't

### Before Done
- [ ] Remote (live Cloudflare) preview deploy confirms same behavior
- [ ] Intermittent Postgres hang itself investigated (propose Hyperdrive or pool-lifecycle fix as follow-up)
- [ ] Operator E2E workflows tested on preview (Week 2)

---

## IPI-471 · AGENT-001 — AI Agent Architecture

**Linear status:** 🟡 In Progress (but mostly done)
**Priority:** Urgent (1)
**Created:** 2026-07-07 21:56 UTC
**PR:** #271 (awaiting merge)

### Current truth
- ✅ 7-agent architecture documented on main at `tasks/cloudflare/cf-000-platform-architecture.md` (169 lines, PR #296)
- ⏳ PR #271 still open (contains additional `provider-adapter.ts`, `types.ts` — tracked under IPI-457)

### Verdict: KEEP In Progress until PR #271 merges

**Why:** Architecture doc exists but PR has lingering payload (provider types). Keep as In Progress until merged.

### Before Done
- [ ] PR #271 merge to main
- [ ] Architecture document on main (already done)

---

## IPI-465 · AGENT-002 — Shared AI Tool Registry

**Linear status:** 🟡 In Progress (design phase only)
**Priority:** Urgent (1)
**Created:** 2026-07-07 21:56 UTC
**Parent:** IPI-486

### Current truth
No PR or design doc yet. `app/src/mastra/tools/index.ts` exists (20 tools, Zod-typed) but NOT shared with Worker.

### Verdict: KEEP In Progress OR move to Todo (deferred OK)

**Why:** Design phase. Not blocking IPI-525 or user journeys. Can defer.

### Recommendation
Move to **Todo** if no design work this week. This is "nice-to-have" behind tool calling. Don't let it block critical path.

---

## IPI-454 · CF-AI-001 — AI Gateway (Cloudflare Provider Routing)

**Linear status:** 🟡 In Progress (AC-F done, AC-J/I open)
**Priority:** Urgent (1)
**Created:** 2026-07-07 20:16 UTC
**PR:** #317 (AC-F merged)

### Acceptance criteria status

| AC | Status | Evidence |
|----|--------|----------|
| A | ✅ Done | OpenAI-compat `/v1/chat/completions` on main |
| B1–B3 | ✅ Done | Gemini chat / stream / structured (PR #312) |
| B4 | ✅ Done | Embeddings via Workers AI (IPI-491 / PR #316) |
| C | ✅ Done | Workers AI URL modes (PR #279) |
| D | ✅ Done | Retry/fallback scaffolding (IPI-463) |
| E | ✅ Done | Worker tests on main |
| **F** | ✅ **Done** | **PR #317 merged** — `AI_ROUTING_MODE=gateway` works for fast tier |
| G | ⚪ Optional | KV (not required for smoke) |
| H | ⚪ Deferred | IPI-463 (failover) |
| I | 🔴 Blocked | IPI-472 prod deploy (not smoke-gated yet) |
| **J** | 🔴 Next | **E2E checklist** — streaming, tools, structured, cancel |

### Verdict: KEEP In Progress (AC-F done, J/I open)

**Why:** Gateway routing works for fast tier. AC-J E2E is next.

### Before Done
- [ ] AC-J: E2E journey (CopilotKit, AG-UI, tools, stream cancel)
- [ ] AC-I: Production deploy (IPI-472)

---

## IPI-515 · PR-AGENT-000 — Epic (PR-Agent on Bedrock Qwen3)

**Linear status:** 🟡 In Progress
**Priority:** High (2)
**Created:** 2026-07-12 01:01 UTC
**Parent:** IPI-487 (different epic — not Cloudflare critical path)

### Verdict: MOVE to **Todo** or **Deferred**

**Why:** PR-Agent is separate roadmap. Not blocking Cloudflare cutover (Aug 12). Defer post-cutover.

### Recommendation
Move to **Todo with note:** "After Cloudflare live (Aug 12)". Release lock for Week 1–4.

---

## Summary Table

| Task | Status | Action | Timeline |
|------|--------|--------|----------|
| IPI-525 | 🟡 In Progress | KEEP | This week (critical) |
| IPI-490 | 🟡 In Progress | KEEP (not Done) | Week 2 (verify) |
| IPI-471 | 🟡 In Progress | KEEP | When PR #271 merges |
| IPI-465 | 🟡 In Progress | → Todo | Deferred (not blocking) |
| IPI-454 | 🟡 In Progress | KEEP | AC-J next week |
| IPI-515 | 🟡 In Progress | → Todo | After Aug 12 |

---

## Errors Checked

✅ **No errors in IPI-525 data.** Verified:
- No fake `blockedBy` relationships (relations array is empty)
- PR #333 attached correctly
- Priority is Urgent (value 1)
- Status is "In Progress" (started 2026-07-12 04:30)
- No conflicting AC or scope

✅ **IPI-490 interpretation correct.** Verified:
- Explicitly says "not ready for Done"
- PostgresStore hang is real (identified in PR #286)
- 20s timeout mitigation is deployed
- Recommendation: keep In Progress, test Week 2

---

## Cloudflare MCP Status

Testing now via task-verifier skill...
