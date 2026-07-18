# PR #342 Task Breakdown — What's Mandatory vs Optional

## A. Task Priority Matrix

| ID | Task | Type | P0 Blocker | Why | Effort | Can Merge Without |
|----|------|------|-----------|-----|--------|-------------------|
| **IPI-527** | selectProvider integration test | Bug | 🔴 YES | Tests don't call actual router | 2h | NO |
| **IPI-528** | toGeminiMessages guard | Bug | 🔴 YES | Silently corrupts tool messages | 1h | NO |
| **IPI-529** | Fix audit report | Docs | 🟡 YES | 92→58 score; credibility | 30m | NO |
| **IPI-530** | Validation function tests | Bug | 🟡 YES | No tests for core validators | 2h | NO |
| **IPI-531** | Error path tests | Bug | 🟡 YES | 10+ error scenarios untested | 2h | NO |
| **IPI-532** | Live injection test | Security | 🔴 YES | Tool results could hijack model | 3h | NO |
| **IPI-533** | Registry schema validation | Feature | 🟡 YES | Invalid configs pass silently | 3h | NO |
| **IPI-534** | Observability & cost telemetry | Feature | 🟡 YES | Production blind spot | 4h | NO |
| ---|---|---|---|---|---|
| **IPI-535** | Tool correlation validation | Bug | 🟡 HIGH | Malformed loops not caught | 2h | MAYBE |
| **IPI-536** | Streaming chunk failures | Bug | 🟡 HIGH | Silent tool loss under network issues | 2h | MAYBE |
| **IPI-537** | Tool authorization allowlist | Security | 🟡 HIGH | Any user can invoke any tool | 2h | MAYBE |
| **IPI-538** | Tool argument schema validation | Security | 🟡 HIGH | Invalid args could crash tools | 2h | MAYBE |
| **IPI-539** | Execution timeout + loop limits | Reliability | 🟡 HIGH | Tools can hang or loop forever | 2h | MAYBE |
| **IPI-540** | Retry + circuit breaker | Reliability | 🟡 HIGH | Transient failures cause 5xx | 2h | MAYBE |
| **IPI-541** | Live GLM E2E test | Verification | 🔴 YES | Code could fail at production runtime | 3h | NO |
| **IPI-542** | Staging deployment + rollback | Operational | 🔴 YES | Unable to rollback if issues arise | 2h | NO |
| **IPI-543** | CI deprecated models gate | Config | 🟡 HIGH | Stale configs merge silently | 1h | MAYBE |

---

## B. Mandatory for Merge (8 tasks, 17.5h)

**These 8 MUST complete before PR #342 merges. They fix critical audit findings.**

### Phase 1 — Fix Code Gaps (3h, parallel)
- **IPI-527** (2h): selectProvider integration test — **directly test the router**
- **IPI-528** (1h): toGeminiMessages guard — **prevent Gemini tool corruption**

### Phase 2 — Verify in CI (5h, parallel after 527)
- **IPI-530** (2h): Validation function tests — **test validateToolRequest, hasToolsInHistory, needsToolProvider**
- **IPI-531** (2h): Error path tests — **cover all 400/403/504 scenarios**
- **IPI-529** (30m): Fix audit report — **correct 92→58 score, update verdict**

### Phase 3 — Stage Verification (3h, parallel after Phase 2)
- **IPI-532** (3h): Live injection test on staging — **verify tool results can't hijack model**

### Phase 4 — Production Hardening (6.5h, parallel)
- **IPI-533** (3h): Registry schema validation — **runtime validation of config**
- **IPI-534** (4h): Observability + telemetry — **production visibility**
- **IPI-541** (3h): Live GLM E2E on staging — **real model behavior**
- **IPI-542** (2h): Staging rollback verification — **safe deployment**

**Merge gate:** Phases 1–3 complete + CI green + no P0/P1 blockers  
**Production gate:** Phase 4 complete + staging smoke + rollback test  

**Critical path:** 3h → 5h → 3h → 6.5h = **17.5h wall-clock (can parallelize to ~11h)**

---

## C. Production Hardening (7 tasks, 15h)

**These 7 SHOULD complete before production traffic, but can follow merge if you're confident on audit findings. Ranked by risk.**

### 🔴 CRITICAL (must have for production)
- **IPI-537** (2h): Tool authorization — **prevent unauthorized tool execution**
- **IPI-538** (2h): Argument schema validation — **prevent invalid/malicious args**
- **IPI-539** (2h): Timeout + loop limits — **prevent hangs and infinite loops**

### 🟡 HIGH (strongly recommended)
- **IPI-535** (2h): Tool correlation validation — **prevent malformed loops**
- **IPI-536** (2h): Streaming failure tests — **robustness under network issues**
- **IPI-540** (2h): Retry + circuit breaker — **handle transient failures gracefully**
- **IPI-543** (1h): CI deprecated models gate — **prevent stale configs at merge time**

---

## D. Minimal Viable Set (Merge Only)

**If timeline is tight, THIS is the absolute minimum:**

```
IPI-527 (selectProvider test) — 2h
IPI-528 (toGeminiMessages guard) — 1h
IPI-530 (validation tests) — 2h
IPI-531 (error paths) — 2h
IPI-532 (injection test on staging) — 3h
IPI-533 (registry schema validation) — 3h
IPI-534 (observability) — 4h
IPI-541 (live E2E GLM) — 3h
IPI-542 (rollback test) — 2h
IPI-529 (audit correction) — 30m

TOTAL: 22.5h ≈ 3 days for 1 developer, 2 days if parallelized

Can produce a PR that:
✅ Tests production router functions (IPI-527)
✅ Guards Gemini corruption (IPI-528)
✅ Validates all error paths (IPI-531)
✅ Tests injection on live model (IPI-532)
✅ Validates registry at runtime (IPI-533)
✅ Has production visibility (IPI-534)
✅ Verified on live GLM (IPI-541)
✅ Rollback tested (IPI-542)

MISSING (add after merge if needed):
❌ Tool authorization allowlist (IPI-537) — security risk
❌ Argument schema validation (IPI-538) — security risk
❌ Timeout + loop limits (IPI-539) — reliability risk
❌ Tool correlation (IPI-535) — robustness gap
❌ Streaming failures (IPI-536) — edge case gap
❌ Retry + circuit (IPI-540) — resilience gap
```

---

## E. Recommended: Two-Wave Plan

**Wave 1: Merge (9.5h) — Get PR into main**

✅ Core 8 tasks (IPI-527–534, 541–542, 529) merged  
✅ CI green  
✅ Production readiness: 70%  
✅ Recommendation: OK for production with **tooling guardrails** (see Wave 2)

**Wave 2: Hardening (15h) — Add production safeguards**

Parallel, over next 1–2 weeks:
- **IPI-537** (2h): Tool authorization allowlist — **blocks unapproved tools at exec time**
- **IPI-538** (2h): Argument schema validation — **blocks malformed args at exec time**
- **IPI-539** (2h): Timeout + loop limits — **bounds execution and prevents hangs**
- **IPI-535, 536, 540, 543** (7h) — **robustness + resilience**

Production readiness after Wave 2: **95%+**

---

## F. Why We Can't Skip These

| Task | Audit Finding | Skip Risk |
|------|---|---|
| IPI-527 | "Tests don't call selectProvider()" | Router untested; production fails despite passing CI |
| IPI-528 | "toGeminiMessages() silently converts role:tool to user" | Tool requests silently corrupted when routed to Gemini |
| IPI-530 | "Validation functions never imported" | Validator logic untested; edge cases bypass guards |
| IPI-531 | "Error paths not tested" | Error responses could leak secrets or crash |
| IPI-532 | "No injection test on live model" | Tool results could execute injected instructions |
| IPI-533 | "Registry overrides not schema-validated" | Invalid configs accepted at runtime |
| IPI-534 | "No observability" | Production blind spot; cost overruns, errors undetected |
| IPI-541 | "No live E2E test" | Unit tests pass but live model fails; discovered at production |
| IPI-542 | "No rollback verification" | Unable to rollback if production issues arise |
| IPI-529 | "92→58 score error" | Audit credibility destroyed; stakeholder trust lost |

---

## G. Effort Estimate Confidence

| Phase | Tasks | Effort | Confidence | Risk |
|-------|-------|--------|------------|------|
| Phase 1 (Gaps) | IPI-527, 528 | 3h | 95% | Low: code changes are small, focused |
| Phase 2 (Verify) | IPI-530, 531, 529 | 5h | 90% | Low: tests are straightforward |
| Phase 3 (Stage) | IPI-532 | 3h | 80% | Medium: depends on GLM availability + network |
| Phase 4 (Harden) | IPI-533, 534, 541, 542 | 6.5h | 75% | Medium: schema validation design, observability scope |
| Extension (Prod) | IPI-535–540, 543 | 15h | 85% | Medium: distributed features, some cross-cutting |

**Total confidence: 85%** — 22.5–27.5 hour range, 95% likely to land in [19h, 32h]

---

## H. Decision: How Many Tasks to Create?

### Option 1: Core 8 + Extension 7 = 15 tasks ✅ RECOMMENDED

**Pros:**
- Full clarity on what needs doing
- Clear priority signals (P0 vs P1 vs P2)
- Extension tasks can be picked up post-merge without re-planning
- Diagram + mapping helps team see interdependencies

**Cons:**
- Looks like a lot of work
- But it *is* a lot of work to ship safely

### Option 2: Core 8 only

**Pros:**
- Focused on merge gate
- Smaller task list

**Cons:**
- Extension tasks left implicit; discovered later as bugs
- Wave 2 security fixes (IPI-537, 538) become urgent after merge
- Lack of observability (IPI-534) means production surprises

### Option 3: Consolidate to 6 tasks

**Not recommended.** Combining tasks hides blockers. E.g., "Router and validation" → single task → if selectProvider test takes longer than expected, validation tests slip.

---

## I. Final Recommendation

**Create all 15 tasks.**

- **Wave 1 (9 tasks):** Mandatory for merge gate
- **Wave 2 (7 tasks):** Production hardening, can parallelize post-merge

Reasoning:
- Audit findings are comprehensive and serious
- Each task is genuinely independent
- Clear priorities let team parallelize work
- Extension tasks become obvious next steps post-merge
- Diagram shows exactly why each task matters

**Conservative estimate:** 3–4 weeks for 1 developer, 2 weeks if 2 developers split Wave 1 + Wave 2.

