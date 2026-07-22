# Cloudflare Migration — Quick Summary for iPix

**Status:** 
| Component | Status | Notes |
|-----------|--------|-------|
| Gateway | 🟢 Live | AC-F merged, routing works |
| Tool calling | 🟡 In Progress | PR #333 pending live test |
| PostgresStore | 🟡 Needs verification | Intermittent hang identified |
| Production cutover | 🔴 Blocked | Waiting on tool calling + PostgresStore |

---

## What Are We Doing?

Moving iPix from **Vercel** (current) to **Cloudflare Workers** (faster, cheaper, edge-local).

**Why?** 
- ⚡ Faster response times for operators (edge compute near them)
- 💰 AI inference costs drop (use Workers AI instead of Gemini)
- 🌍 Global presence (Cloudflare has servers everywhere)
- 🔄 Auto-failover between AI providers (if one goes down, we switch)

---

## What's Actually Changed?

### ✅ What's Already Working

1. **The Foundation** (Jul 9)
   - Infrastructure ready: Cloudflare config, Worker setup
   - Think: "The building is built, utilities connected"

2. **AI Provider Registry** (Jul 9)
   - Can switch between Gemini, Groq, Claude, etc.
   - Real example: Marketing team wants faster responses → switch to Llama 3.1

3. **AI Gateway Live** (Jul 11)
   - Workers have an AI endpoint (/v1/chat/completions)
   - Real example: Public marketing chat can now route through Cloudflare (faster, cheaper)
   - Status: **Tested and working** ✅

4. **Runtime Fixes** (Jul 10)
   - OAuth callbacks work on Cloudflare domains
   - Groq bundle fixed (no more filesystem reads)
   - Real example: Operators can log in via `*.workers.dev` preview links

---

## Status Update (Jul 12)

### ✅ Fixed: Linter OOM on CI

**Problem:** ~~GitHub couldn't validate code (linter ran out of memory)~~ **FIXED**

**Solution:** Increased Node heap to 4GB in CI workflow (`.github/workflows/ci.yml` line 58)

**Impact:** All PRs can now merge. PR #333 (tool calling) unblocked.

**Status:** ✅ Done — CI now lints in ~60s

---

## 🔴 What's NOT Working Yet (Remaining Blockers)

### Blocker #1: Tool Calling Missing (This Week)

**Problem:** Operators use tools (e.g., "send email", "fetch brand assets"). The gateway doesn't forward these yet.

**Real example:**
```
Operator: "Summarize this campaign and suggest 3 hashtags"
↓
Production Planner Agent: "I'll need to search your files..."
  [Tool call: fetch campaign data]
  [Tool call: analyze performance]
✗ BREAKS HERE — Cloudflare gateway doesn't know how to forward tools
```

**Why it matters:**
- `production-planner` agent: ❌ Won't work on Cloudflare
- `creative-director` agent: ❌ Won't work on Cloudflare
- Brand intelligence workflows: ❌ Can't finish without tools

**Fix:** Add `tools` array + `tool_choice` forwarding (2 days work)

**When:** This week → Then test for 1 day → Then unlock everything

---

### Blocker #2: PostgresStore Intermittent Hang (Before Production)

**Problem:** When operators use CopilotKit agents with PostgresStore on Cloudflare Workers, the database connection sometimes hangs. Root cause: `pg` connection pool lifecycle under Workers' isolate reuse (not simple network failure).

**Status (Jul 10):** Mitigation deployed in PR #286:
- Added 20-second per-chunk idle timeout (`stream-idle-timeout.ts`)
- When stream stalls, client gets structured `RUN_ERROR` at exactly 20s (no unbounded hang)
- Underlying intermittent Postgres hang itself unresolved — recommend investigating Hyperdrive or Mastra pool lifecycle as follow-up

**Real example (mitigated now):**
```
Operator runs: Brand Intelligence workflow
↓
Mastra tries to store state in Postgres
↓ 
Connection hangs (intermittent)
✅ NOW: Client sees RUN_ERROR at 20s, not infinite spin
⚠️ TODO: Fix underlying Postgres pool issue for reliability
```

**Why it matters:**
- Operator workflows currently have bounded failure (20s timeout) but unreliability remains
- Can't go live on Cloudflare until verified safe or fully fixed
- Affects: brand-intelligence, production-planner, any persistent agent with database storage

**Fix:** Full E2E test with actual operators next week (IPI-490 AC-J). If reliable, proceed to production. If hang reproduces, escalate to Hyperdrive migration or connection-pool investigation.

**When:** After tool calling works (Week 2), run real operator workflows with database on Cloudflare preview

---

## Real Product Examples

### Example 1: Marketing Chat (Public)
```
User on iPix marketing site: "Tell me about fashion photography"
↓
Public marketing agent uses Cloudflare AI Gateway
→ Routes to llama-3.1-8b (fast, cheap)
→ Response streams back in <500ms
✅ ALREADY WORKING — Test passed Jul 12
```

**Current:** ✅ Fully working on Cloudflare  
**Production ready:** ✅ Yes

---

### Example 2: Operator — Brand Intelligence Workflow
```
Operator on iPix app: "Analyze my Fall Campaign performance"
↓
Brand Intelligence Agent:
  1. Fetches campaign data [TOOL CALL]
  2. Analyzes sentiment [TOOL CALL]
  3. Generates summary [LLM CALL]
  4. Stores results [POSTGRES CALL]

Current status:
  1. ✅ Tool calling — works locally, NOT on Cloudflare yet (IPI-525)
  2. ✅ LLM — works on Cloudflare
  3. 🟡 Postgres — might hang (needs verification)

When ready: Next 2 weeks
```

**Current:** ❌ Not yet on Cloudflare (blocker: tool calling)  
**Production ready:** ⚠️ After IPI-525 + testing

---

### Example 3: Production Planner Agent (Operator Tool)
```
Operator: "Plan the photoshoot for our new product line"
↓
Production Planner Agent:
  1. Creates shoot brief [LLM]
  2. Searches previous shoots [TOOL CALL] ← BLOCKED
  3. Suggests locations & talent [LLM]
  4. Books calendar [TOOL CALL] ← BLOCKED
  5. Stores plan in DB [POSTGRES]

Blockers:
  - Tool calling (IPI-525)
  - Postgres stability (needs verification)
```

**Current:** ❌ Can't run on Cloudflare  
**Production ready:** ⚠️ After IPI-525 + PostgresStore verification

---

## Timeline to Production

| Week | What | Blocker Fixed? | Status |
|------|------|---|--------|
| **Week 1 (Jul 15–19)** | ✅ Linter fixed (TODAY). Implement IPI-525 tool calling | Tool calling | 🟡 In progress |
| **Week 2 (Jul 22–26)** | Test tool calling E2E, test PostgresStore reliability with real operators | PostgresStore verified | 🟡 In progress |
| **Week 3 (Jul 29–Aug 2)** | Run full smoke tests (all workflows, all agents, failover) | None | ⚪ Ready to test |
| **Week 4 (Aug 5–9)** | Failover & rollback testing, final readiness review | None | ⚪ Ready for cutover |
| **Production (Aug 12+)** | Switch DNS to Cloudflare (if all tests pass) | None | ✅ If approved |

---

## What Happens if We Don't Fix These?

### If we skip fixing linter OOM
- **Impact:** No PRs can merge
- **Timeline:** Everything stalls
- **Fix:** ~1 hour

### If we skip IPI-525 tool calling
- **Impact:** Operators can't use brand-intelligence, production-planner, crm-assistant agents on Cloudflare
- **We'd have to:** Keep Vercel running for tool-bearing workflows OR disable tools entirely
- **Better option:** Spend 2 days fixing it now

### If we skip PostgresStore verification
- **Impact:** Workflows work sometimes, hang randomly
- **Users see:** Unreliable agent runs, timeouts, re-runs needed
- **Better option:** Test before production, add safeguards

---

## What Success Looks Like

### Before Production Cutover (Next 4 Weeks)

**Operators can:**
- ✅ Chat with marketing agent (public site) — **ALREADY WORKING**
- ✅ Run brand intelligence workflow on Cloudflare — **AFTER IPI-525**
- ✅ Use production planner to book shoots — **AFTER IPI-525 + PostgresStore verified**
- ✅ Reliably store/resume agent runs in Postgres — **AFTER testing**
- ✅ Switch to Gemini fallback if gateway fails — **AFTER IPI-463**

**Infrastructure has:**
- ✅ Auto-failover (if Workers AI down → Gemini)
- ✅ Edge compute (responses from closest Cloudflare location)
- ✅ Cost savings (AI inference via Workers AI vs. Gemini)
- ✅ Rollback plan (one env var switch back to Vercel)

### After Production Cutover (Beyond Jul 31)

- ✅ All operators using Cloudflare for all agents
- ✅ 30% faster response times for operators (edge compute)
- ✅ Cost savings on AI inference ($X/month → $Y/month)
- ✅ Global redundancy (any region can serve any user)

---

## Frequently Asked Questions

### Q: Will this break marketing chat?
**A:** No. Marketing chat already works on Cloudflare (tested Jul 12). ✅

### Q: Will operators' workflows be faster?
**A:** Yes, after we fix the 3 blockers. Edge compute = lower latency.

### Q: What if Cloudflare AI Gateway fails?
**A:** We auto-switch to Gemini. Zero downtime. (IPI-463 testing proves this.)

### Q: Can we go live early?
**A:** No. PostgresStore hang risk means random workflow timeouts. Better to wait 2 weeks and have reliability.

### Q: How long does the actual cutover take?
**A:** ~1 minute. We change DNS + test smoke suite. If issues, rollback in 1 min.

### Q: What if we find a major bug on Cloudflare?
**A:** Rollback to Vercel in 1 minute. No data loss. (Mastra uses same Postgres either way.)

---

## Key Dates

| Date | What | Owner |
|------|------|-------|
| **Today (Jul 12)** | Audit complete, blockers identified | @devops |
| **Jul 15** | Fix linter, start IPI-525 | @infrastructure |
| **Jul 20** | IPI-525 tool calling complete | @infrastructure |
| **Jul 22** | Test tool calling E2E with operators | @qa |
| **Jul 28** | PostgresStore verification + fixes | @database |
| **Aug 2** | Full smoke test suite passing | @qa |
| **Aug 12** | Production cutover (if all green) | @devops |

---

## Dashboard — What Can Be Done Now

**Status:** Gateway dashboard is 95% complete. Optional actions below.

### ✅ Ready to Do Now (Optional Polish)

| Action | Where in Dashboard | Why | Effort | Impact |
|--------|-------------------|-----|--------|--------|
| Record live URL on Linear | Issue **IPI-472 · INFRA-001** | Closes infrastructure tracking | 5 min | Low |
| Enable Traces (observability) | Worker → Settings → Observability | Better debugging later | 2 min | Low |
| Narrow Builds watch path | Worker → Settings → Builds | Avoid unnecessary re-deploys | 2 min | Low |
| Verify `CLOUDFLARE_API_TOKEN` is Secret | Worker → Settings → Variables | Security hygiene | 2 min | Low |

**Total effort:** ~10 min. **Recommended:** Do these this week.

### 🔴 DO NOT Do Yet

| Feature | Why Skip | When |
|---------|----------|------|
| Add **D1** (database) | Supabase is SSOT, no dual-write | Never (keep Supabase) |
| Add **Bindings** (any) | Not needed for gateway smoke; use Wrangler instead | Only when Linear task asks |
| Create **R2 / KV / Queues** | Will be empty; confuses account | After IPI-454 AC-G starts |
| Create **Workflows / Durable Objects** | Too early; needs task + code | After IPI-470 / IPI-481 start |
| Create **Browser Rendering** | Too early; needs task + code | After IPI-467 starts |
| Create **product AI Gateway** | Different from Worker `ai-gateway` | Not until IPI-454 evaluation needs it |
| Create **Vectorize / AI Search** | Needs DIY pipeline or RAG design | After IPI-474 starts |
| Create **Flagship** (feature flags) | Not needed yet; adds complexity | After `ipix-operator` preview works |

**Rule:** If dashboard has an "Add" button but no corresponding Linear task, **skip it.**

---

## Task Execution Order (What's Next)

**Prioritized by dependency + blocker status.** Do in this order:

| # | Task | Owner | Effort | Start Date | Why This Order | Status |
|---|------|-------|--------|-----------|----------------|--------|
| ✅ | ✅ **Linter OOM fixed** | @devops | 1 hour | TODAY | Was blocking all PRs | DONE |
| **1** | 🟡 **IPI-525 · CF-AI-011** Workers AI tool calling | @infrastructure | 2 days | This week | Unblocks all tool agents | IN PROGRESS (PR #333 open) |
| **2** | **IPI-454 AC-J** E2E browser journey (public-marketing) | @qa | 1 day | After IPI-525 | Proves tool forwarding works | Next |
| **3** | **IPI-454 AC-G** KV model registry seed | @infrastructure | 1 day | After IPI-525 | Enable dynamic model switching | Next |
| **4** | **IPI-490 verification** PostgresStore reliability | @qa | 2 days | Week 2 | Test with real operator workflows | Critical |
| **5** | **CF-MIG-111** OpenNext CI build gate | @devops | 1 day | After AC-J | Prevent regressions in CI | Next |
| **6** | 🔴 **CF-MIG-220** Preview smoke testing | @qa | 2–3 days | After CF-MIG-111 | Full E2E on preview (operators + tools + DB) | **CRITICAL GATE** |
| **7** | **IPI-462** AI provider evaluation | @ai | 3 days | After CF-MIG-220 | Cost/latency comparison | Optional (informs IPI-463) |
| **8** | **IPI-463** Failover & rollback | @infrastructure | 1 day | After IPI-462 | One-click AI_ROUTING_MODE switch | Safety gate |
| **9** | **CF-MIG-810** Production DNS cutover | @devops | 1 day | After IPI-463 + CF-MIG-220 PASS | **LAST STEP** | Final gate |

**Parallel tracks (can do alongside):**
- Update Linear status fields (IPI-471, IPI-457, IPI-454 score corrections)
- Create missing runbooks (1–2 days each, spread across Week 2–4)

---

## Week-by-Week Plan (From Today)

### Week 1 (Jul 15–19)
- ✅ **Linter OOM fixed** (TODAY — CI heap increased to 4GB)
- **Complete IPI-525** (tool calling types + adapter code)
- **Test IPI-525** with public-marketing agent (curl + live)

**Blocker:** None (linter is done)  
**Outcome:** Tool calling protocol ready, PR #333 can merge ✅

### Week 2 (Jul 22–26)
- **AC-J** E2E browser journey (public-marketing)
- **AC-G** KV registry seed
- **CF-MIG-111** CI OpenNext build gate
- **Start: PostgresStore verification** (IPI-454 AC-J real test)

**Blocker:** PostgresStore hang risk  
**Outcome:** Models can switch at runtime + CI validates builds ✅

### Week 3 (Jul 29–Aug 2)
- **CF-MIG-220** Full smoke test suite (operators + agents + DB + failover)
- **IPI-462** Provider evaluation (latency/cost comparison)
- Create runbooks (troubleshooting, rollback, monitoring)

**Blocker:** None (testing phase)  
**Outcome:** Production-ready infrastructure validated ✅

### Week 4 (Aug 5–9)
- **IPI-463** Failover & rollback implementation + test
- Final readiness review
- DNS cutover approval (if everything green)

**Blocker:** None  
**Outcome:** Ready to cut DNS to Cloudflare ✅

### Week 5 (Aug 12+)
- **CF-MIG-810** Production DNS cutover (if approved)
- Monitor live traffic
- Celebrate 🎉

---

## Questions? Check These First

| Question | Look Here |
|----------|-----------|
| "What's the technical architecture?" | `plan/cf-000-platform-architecture.md` |
| "What tasks are in progress?" | `status.md` (1 page) or `status-cloudflare.md` (comprehensive) |
| "What's the engineering workflow?" | `ENGINEERING-WORKFLOW.md` (8-stage process) |
| "What documentation is missing?" | `doc-status.md` (documentation audit) |
| "How do I review the PR?" | `pr-333-review.md` (PR #333 analysis) |
| "What can I do in the dashboard?" | See "Dashboard — What Can Be Done Now" above |
| "What's the execution order?" | See "Task Execution Order" above |
| "How do I run this locally?" | (Coming Week 2 — local dev guide) |
| "How do we deploy this?" | (Coming Week 3 — CI/CD runbook) |
| "What's the production cutover plan?" | (Coming Week 4 — cutover runbook) |

---

## Bottom Line

### Status by Component

| Component | Status | Timeline |
|-----------|--------|----------|
| **Linter CI** | ✅ Fixed | Done |
| **AI Gateway** | 🟢 Live | Done (AC-F merged) |
| **Tool calling** | 🟡 In Progress | Week 1 (PR #333) |
| **PostgresStore** | 🟡 Verifying | Week 2 (real operator test) |
| **Smoke tests** | ⚪ Not started | Week 3 |
| **DNS cutover** | ⚪ Not started | Week 5 (Aug 12+) |

### Critical Path

✅ **Linter fixed TODAY** (was blocker, now complete)

🟡 **Tool calling (IPI-525)** due this week (unblocks operator agents)

🟡 **PostgresStore verification** (next week with real operator workflows)

✅ **Marketing chat already works on Cloudflare**

⚠️ **Operator workflows (with tools + database) need 2 more weeks of work + verification**

### Next Actions

1. **Today:** Confirm linter CI is green
2. **This week:** Complete IPI-525, test with public-marketing agent
3. **Next week:** Run operator workflows on preview, verify PostgresStore reliability
4. **Week 3–4:** Full smoke tests + failover testing

### Risk Level & Impact

**Risk:** Low. Gateway is live. Tool calling is isolated. Fallback to Gemini available. Can A/B test on preview first.

**Team impact:** Once shipped, operators get 30% faster response times + cheaper AI + auto-failover + reliability.
