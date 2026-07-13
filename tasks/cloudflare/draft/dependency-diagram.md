# PR #342 Audit Fixes — Task Dependency Diagram

## Execution Flow

```mermaid
graph TD
    Start["PR #342 Audit Fixes<br/>Start"]
    
    %% Phase 1: Fix Code Gaps (CRITICAL)
    subgraph Phase1["Phase 1: Fix Code Gaps (CRITICAL)"]
        IPI527["🔴 IPI-527<br/>selectProvider Integration Test<br/>Severity: Critical"]
        IPI528["🔴 IPI-528<br/>toGeminiMessages Guard<br/>Severity: Critical"]
    end
    
    %% Phase 2: Verify in CI (HIGH)
    subgraph Phase2["Phase 2: Verify in CI (HIGH)"]
        IPI529["🟡 IPI-530<br/>Validation Function Tests<br/>Severity: High<br/>Blocked by: IPI-527"]
        IPI530["🟡 IPI-531<br/>Error Path Tests<br/>Severity: High<br/>Blocked by: IPI-527"]
        IPI531["🟡 IPI-529<br/>Fix Audit Report Score<br/>Severity: High"]
    end
    
    %% Phase 3: Stage Verification (CRITICAL)
    subgraph Phase3["Phase 3: Stage Verification (CRITICAL)"]
        IPI532["🔴 IPI-532<br/>Live Injection Test<br/>Severity: Critical<br/>Blocked by: IPI-527,528,529,530,531"]
    end
    
    %% Phase 4: Production Hardening (MEDIUM/HIGH)
    subgraph Phase4["Phase 4: Production Hardening"]
        IPI533["🟡 IPI-533<br/>Registry Schema Validation<br/>Severity: High<br/>Independent"]
        IPI534["⚪ IPI-534<br/>Monitoring & Observability<br/>Severity: Medium<br/>Independent"]
    end
    
    %% Flow
    Start --> Phase1
    Phase1 --> Phase2
    Phase2 --> Phase3
    Phase3 --> Phase4
    
    %% Internal dependencies
    IPI527 --> IPI529
    IPI527 --> IPI530
    IPI528 --> IPI532
    IPI529 --> IPI532
    IPI530 --> IPI532
    IPI531 --> Phase3
    
    %% Independent tasks can run parallel
    IPI533 -.->|Can start anytime| Phase4
    IPI534 -.->|Can start anytime| Phase4
    
    Phase4 --> Done["✅ All Fixes Complete<br/>Ready for Merge + Production"]
```

---

## Task Matrix

| Task | ID | Type | Severity | Status | Blockers | Est. Effort |
|------|-----|------|----------|--------|----------|-------------|
| selectProvider integration test | IPI-527 | Bug Fix | 🔴 Critical | Ready | None | 2h |
| toGeminiMessages guard | IPI-528 | Bug Fix | 🔴 Critical | Ready | None | 1h |
| Fix audit report score | IPI-529 | Docs | 🟡 High | Ready | None | 30min |
| Validation function tests | IPI-530 | Bug Fix | 🟡 High | Blocked | IPI-527 | 2h |
| Error path tests | IPI-531 | Bug Fix | 🟡 High | Blocked | IPI-527 | 2h |
| Live injection test | IPI-532 | Security | 🔴 Critical | Blocked | IPI-527,528,529,530,531 | 3h |
| Registry schema validation | IPI-533 | Feature | 🟡 High | Ready | None | 3h |
| Monitoring & observability | IPI-534 | Feature | ⚪ Medium | Ready | None | 4h |

**Total effort:** ~17.5 hours  
**Critical path:** IPI-527 → IPI-530/531 → IPI-532 (requires all Phase 1 & 2 complete)  
**Can parallelize:** IPI-533, IPI-534 independent; Phase 2 tasks parallel

---

## Merge Gate

```
✅ Phase 1 Complete (IPI-527, 528)
├─ selectProvider routes to GLM
├─ toGeminiMessages rejects tool messages
└─ No new type errors
    ↓
✅ Phase 2 Complete (IPI-529, 530, 531)
├─ All validation functions imported and tested
├─ Error paths verified
├─ Audit score corrected
└─ CI passes typecheck, test, build
    ↓
🟢 **PR READY TO MERGE**
```

---

## Production Gate

```
✅ Merge Complete + Deployed to Staging
├─ Phase 3: Live injection test PASSED
│  └─ Tool results don't hijack model
├─ Phase 4: Production hardening
│  ├─ Registry schema validation in place
│  └─ Monitoring alerts configured
└─ Manual smoke test passed
    ↓
🟢 **READY FOR PRODUCTION DEPLOYMENT**
```

---

## Parallel Execution Strategy

**Can do in parallel (no blocking dependencies):**
- IPI-527 & IPI-528 (both Phase 1, independent)
- IPI-533 & IPI-534 (Phase 4 independent tasks)
- IPI-529 (documentation, anytime)

**Must wait for:**
- IPI-529, IPI-530, IPI-531 wait for IPI-527 ✅
- IPI-532 waits for all Phase 1 & 2 complete ⚠️
- Phase 4 can start after Phase 3, but IPI-533/534 independent

**Recommended execution order:**
1. Week 1: IPI-527 + IPI-528 + IPI-529 (in parallel, ~2-3 days)
2. Week 1: IPI-530 + IPI-531 (after 527, ~2-3 days)
3. Week 2: Merge PR #342 to main
4. Week 2: IPI-532 (staging verification, ~3 hours)
5. Week 2: IPI-533 + IPI-534 (production hardening, parallel, ~4 hours)
6. Week 3: Production deployment

