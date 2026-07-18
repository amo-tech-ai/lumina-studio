# PR #342 Implementation Plan — Concise DoD

## Task Inventory (15 tasks)

| ID | Task | Type | P | Effort | Blocks | Blocked By | DoD |
|----|------|------|---|--------|--------|-----------|-----|
| **IPI-527** | selectProvider integration test | Bug | P0 | 2h | IPI-530,531 | — | selectProvider() called; all tiers tested; errors thrown correctly |
| **IPI-528** | toGeminiMessages guard | Bug | P0 | 1h | — | — | role:tool → explicit error before conversion; test present |
| **IPI-529** | Fix audit report score | Docs | P0 | 30m | — | — | Score corrected 92→90; verdict "Ready for CI & staging"; test terminology fixed |
| **IPI-530** | Validation function tests | Bug | P1 | 2h | — | IPI-527 | validateToolRequest, hasToolsInHistory, needsToolProvider all imported + called |
| **IPI-531** | Error path tests | Bug | P1 | 2h | — | IPI-527 | All 10+ error scenarios tested; correct status codes + error messages |
| **IPI-532** | Live injection test (staging) | Security | P0 | 3h | — | IPI-527,528,531 | Deployed to staging; injection payload sent; model output doesn't execute; pass logged |
| **IPI-533** | Registry schema validation | Feature | P1 | 3h | — | — | Zod schema defined; buildEffectiveRegistry validates override; invalid config rejected |
| **IPI-534** | Observability + cost telemetry | Feature | P1 | 4h | — | — | Structured logging in selectProvider; cost tracking; error categorization; no secret leaks |
| **IPI-535** | Tool correlation validation | Bug | P1 | 2h | — | IPI-527 | tool_call_id ↔ tools validated; loop depth bounded; test present |
| **IPI-536** | Streaming chunk failures | Bug | P1 | 2h | — | IPI-527 | Incomplete, malformed, duplicate chunks tested; reconstruction fails safely |
| **IPI-537** | Tool authorization allowlist | Security | P1 | 2h | — | — | Allowlist loaded; default-deny; tenant-scoped; authorization gate before exec |
| **IPI-538** | Tool argument schema validation | Security | P1 | 2h | — | — | JSON schema validation; no coercion; enum + constraints checked; test present |
| **IPI-539** | Execution timeout + loop limits | Reliability | P1 | 2h | — | IPI-535 | AbortController on 5s timeout; loop depth bounded; test present |
| **IPI-540** | Retry + circuit breaker | Reliability | P1 | 2h | — | — | Exponential backoff; circuit open on >50% errors; fallback to Bedrock; test present |
| **IPI-541** | Live GLM E2E test | Verification | P0 | 3h | — | IPI-527–531 | Deployed to staging; multi-turn request sent; tool_calls validated; final answer verified |
| **IPI-542** | Staging deployment + rollback | Operational | P0 | 2h | — | IPI-541 | Deployed to staging; smoke test passed; rollback executed; prior version verified |
| **IPI-543** | CI deprecated models gate | Config | P1 | 1h | — | IPI-533 | Deprecated models rejected at CI; registry schema validated at CI; merge blocked if invalid |

**Totals:** 9 core (17.5h) + 7 extension (15h) = 15 tasks, 32.5h effort, ~22h parallelized

---

## Critical Path

```
IPI-527 (2h)
  ├─→ IPI-530 (2h)
  │    └─→ IPI-531 (2h)
  │         └─→ IPI-532 (3h)
  │              └─→ IPI-541 (3h)
  │                   └─→ IPI-542 (2h)
  │                        └─→ MERGE READY ✅
  │
  └─→ IPI-528 (1h)
  └─→ IPI-529 (30m)
  └─→ IPI-533 (3h)
  └─→ IPI-534 (4h)

Parallel (anytime):
  IPI-535, 536, 537, 538, 539, 540, 543 (15h)
  
**Merge gate:** IPI-527, 528, 529, 530, 531, 532, 533, 534, 541, 542 complete  
**Production gate:** + IPI-535–540, 543 complete
```

---

## Success Criteria

### Merge Gate ✅
- [ ] selectProvider and all validators directly tested (IPI-527, 530, 531)
- [ ] toGeminiMessages explicitly rejects role:tool (IPI-528)
- [ ] Live injection test passes on staging (IPI-532)
- [ ] Registry schema validation deployed (IPI-533)
- [ ] Observability in place (IPI-534)
- [ ] Live E2E GLM test passes (IPI-541)
- [ ] Rollback verified (IPI-542)
- [ ] Audit report corrected (IPI-529)
- [ ] CI green: typecheck, build, all tests
- [ ] **Score: 90/100 (not 92)**
- [ ] **Verdict: "Ready for CI & staging" (not "Production-ready")**

### Production Gate (before live traffic) ✅
- [ ] Tool authorization allowlist enforced (IPI-537)
- [ ] Argument schema validation enforced (IPI-538)
- [ ] Execution timeout + loop limits enforced (IPI-539)
- [ ] Tool correlation validation enforced (IPI-535)
- [ ] Streaming failures handled safely (IPI-536)
- [ ] Retry + circuit breaker deployed (IPI-540)
- [ ] CI gates deprecated models + invalid registry (IPI-543)
- [ ] **Score: 95+/100**
- [ ] **Verdict: "Production-ready"**

---

## Architecture Verification Checklist

| Check | Evidence | Status |
|-------|----------|--------|
| Router functions tested | selectProvider, validateToolRequest, hasToolsInHistory, needsToolProvider all called in tests | IPI-527, 530 |
| Gemini guard | role:tool → explicit error before toGeminiMessages | IPI-528 |
| Registry safety | Zod schema validates; buildEffectiveRegistry safe merge | IPI-533 |
| Tool authorization | Allowlist enforced; default-deny; tenant-scoped | IPI-537 |
| Argument validation | JSON schema checked; no coercion; type-safe | IPI-538 |
| Execution safety | 5s timeout; 10-turn max; loop bounded | IPI-539 |
| Streaming robustness | Chunk failures handled; reconstruction verified | IPI-536 |
| Error resilience | Retry + exponential backoff + circuit breaker | IPI-540 |
| Tool correlation | tool_call_id ↔ tools; loop depth bounded | IPI-535 |
| Injection prevention | Tool results treated as data; no execution | IPI-532 |
| Observability | Cost tracking; error categorization; audit log | IPI-534 |
| Deployment safety | Staging tested; rollback verified; CI gates | IPI-541, 542, 543 |

---

## Wave 1 vs Wave 2

**Wave 1: Merge** (IPI-527–534, 541–542, 529)
- Duration: 3–4 days (1 dev) or 2 days (2 devs)
- Outcome: PR merged, CI green, 70% production-ready
- Risk: No authorization/schema validation; tools available to all users

**Wave 2: Hardening** (IPI-535–540, 543)
- Duration: 1–2 weeks (can parallelize)
- Outcome: 95%+ production-ready
- Security fixes: IPI-537, 538 (authorization, arg validation)
- Resilience: IPI-535, 536, 540 (correlation, streaming, retry)

Recommendation: Start Wave 2 immediately after Wave 1 merges, don't wait.

---

## Files Changed (Summary)

### Core files (must change)
- `services/cloudflare-worker/src/router.ts` — selectProvider, validation, auth, timeouts
- `services/cloudflare-worker/src/providers/gemini.ts` — toGeminiMessages guard
- `services/cloudflare-worker/src/router.tools.test.ts` — import + call real functions
- `services/cloudflare-worker/src/router.toolloop.test.ts` — streaming failure tests
- `services/cloudflare-worker/src/model-registry.ts` — Zod schema validation

### New files
- `services/cloudflare-worker/src/tool-allowlist.ts` — allowlist loading
- `services/cloudflare-worker/src/tool-validator.ts` — argument schema validation
- `services/cloudflare-worker/src/retry-policy.ts` — retry + circuit breaker
- `services/cloudflare-worker/src/deprecated-models.json` — deprecation list
- `.github/workflows/ci.yml` — update for registry/deprecated gates

---

## Mermaid Diagrams (Reference)

See `pr-342-architecture.md`:
- A. Current state (gaps highlighted)
- B. Target state (all gates in place)
- C. Multi-turn sequence (happy path)
- D. Failure decision tree (all error branches)
- E. CI + deployment flow

Each diagram node maps to one or more Linear tasks.

---

## Recommendation

✅ **Create all 15 tasks.**

Reasoning:
1. Audit findings are comprehensive (selectProvider never tested, toGeminiMessages no guard, etc.)
2. Each task genuinely independent (can parallelize Wave 2)
3. Clear priority signals (P0=merge blocker, P1=hardening)
4. Diagram + mapping shows exactly why each task matters
5. Team can parallelize: someone does Wave 1 while others start Wave 2

**Do not merge without Wave 1 complete.**  
**Do not deploy to production without Wave 2 complete.**

