# Audit Report — PR #336 · IPI-525 Audit Doc

**Date:** 2026-07-12 · **PR:** `ipi/525-audit` → `main`  
**Files:** 1 · `tasks/cloudflare/tasks/pr-333-audit.md` (+83/-0)  
**Size:** 83 lines (clean, docs-only)

---

## Scorecard

| Category | Score | Status |
|:---------|:-----:|:------:|
| Scope cleanliness | 100% | 🟢 Docs-only, 1 file, no code |
| CI / mergeability | 95% | 🟢 app-build ✅ booking-gate ✅ supabase ✅ Codacy ❌ |
| Factual accuracy (types/schema) | 95% | 🟢 Types verified against Cloudflare docs |
| Factual accuracy (readiness) | 30% | 🔴 Overstates readiness, ignores scope violations |
| Composite | **75%** | 🟡 |

---

## Strengths

| Item | Evidence |
|:-----|:---------|
| Types verified against Cloudflare Gemma 4 schema | ✅ Exact match for ToolDeclaration, ToolChoice, ChatToolCall, parallel_tool_calls |
| Gemini guard tests confirmed | ✅ `ca37957d` — 10 tests in gemini.test.ts |
| Workers AI pass-through confirmed | ✅ `JSON.stringify(req)` forwards all fields |
| toGeminiMessages tool role handling confirmed | ✅ `filter((m) => m.role !== "tool")` |
| App tests: 1150 pass | ✅ Verified live |
| Worker tests: 67 pass | ✅ Verified live (audit says 65 — minor delta) |
| No secrets in diff | ✅ Clean |

---

## 🔴 Issues & Inaccuracies

| # | Claim in PR #336 | Reality | Severity |
|:-:|:-----------------|:--------|:--------:|
| 1 | **"3 files (+155/−1)"** | PR #333 now has 4 files (442+9). Audit was written pre-split | 🟡 Stale number |
| 2 | **"Scope preservation: 100%, Single concern"** | Original PR #333 mixed code + skills + CLAUDE.md + audit — a blocking violation per AGENTS.md #1 | 🔴 Incorrect claim |
| 3 | **"Composite score: 96%"** | Our cross-referenced audit (`audit-4r-linear.md`) scores IPI-525 at 70%. The 96% ignored concern mixing, missing model registry update, and lack of live E2E proof | 🔴 Overstated |
| 4 | **"Production readiness: READY"** | **Not ready.** Deployed Gemini provider has no tool guards (pre-PR #333). Model registry has no function-calling-capable model. Tools silently dropped by Gemini. Gateway has no auth | 🔴 Overstated |
| 5 | **"All required gates passed"** | Concern-mixing gate failed. Split into #334/#335/#336 was required | 🔴 Overstated |
| 6 | **"Gemini guards tested" → implies deployed** | Guards are on PR branch only. Deployed Worker (`ai-gateway.sk-498.workers.dev`) is pre-PR #333 — no tool guards | 🟡 Deployment gap |

---

## Inconsistencies vs Latest Audit

| Dimension | PR #336 Claim | Latest Truth (`audit-4r-linear.md`) | Delta |
|:----------|:-------------|:-------------------------------------|:------|
| Composite | 96% | 70% | -26% |
| Production ready | ✅ Yes | 🔴 No | Critical |
| Scope clean | ✅ 100% | 🔴 Violation (fixed by split) | Mixed |
| Test count (Worker) | 65 | 67 | -2 (minor) |

---

## CI Status

| Check | Status | Notes |
|:------|:------:|:------|
| app-build | ✅ Pass | Core build |
| booking-gate | ✅ Pass | |
| supabase-web015 | ✅ Pass | |
| CodeRabbit | ✅ Pass | |
| Codacy | 🔴 Fail | Same pre-existing issue as PR #335 |
| Vercel | ✅ Pass | |

---

## Verdict

| Question | Answer |
|:---------|:-------|
| Is the PR clean (1 concern, docs-only)? | 🟢 Yes |
| Is the audit content mostly correct? | 🟡 Mostly — schema verification is solid |
| Does it overstate readiness? | 🔴 Yes — claims 96%/Ready, reality is 70%/Blocked |
| Should the inaccuracies be fixed? | 🟡 Recommended — update composite, scope claim, and production readiness to match current truth |
| Merge-blocking? | 🟡 **Not blocking** (docs-only, can be corrected post-merge), but **recommend corrections** before closing IPI-525 |

**Recommendation:** 🟢 Merge (docs-only, no harm in fixing post-merge). But the audit doc needs corrections:
1. Composite score: 96% → 70%
2. Production readiness: READY → NOT YET (deployment gap + model registry)
3. Add note that PR #333 was split due to concern-mixing violation (now fixed)
