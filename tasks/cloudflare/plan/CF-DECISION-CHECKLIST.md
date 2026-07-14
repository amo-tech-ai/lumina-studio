# Cloudflare Architecture Redesign: Decision Checklist

**Date:** 2026-07-12  
**Stakeholders:** Engineering lead, Product, DevOps  
**Decision Timeline:** This week (team sync)

---

## Quick Summary

**Current state:** Custom architecture (2,600 lines) with 32 documented issues  
**Root cause:** We built what Cloudflare now provides natively  
**Recommendation:** Adopt Cloudflare Agents SDK (Think) + AI Gateway + embedded function calling  
**Benefit:** 77% code reduction, fix 12 issues, 50–70% cost savings, 95% failure reduction

**Timeline:** 4 weeks (5 phases), low risk, staged rollout

---

## For Engineering Lead

### Decision Questions

- [ ] **Do we accept that the current architecture is over-engineered?**
  - Evidence: Custom router (~300 lines) vs AI Gateway routing (native)
  - Evidence: Custom registry (~200 lines) vs Workers AI native models
  - Evidence: Custom state (~300 lines KV code) vs Durable Objects persistence
  - **Decision:** Proceed if yes

- [ ] **Can we adopt Durable Objects as the agent runtime?**
  - Trade-off: More tightly coupled to Cloudflare platform
  - Benefit: Real-time state sync, automatic hibernation, free idle cost
  - **Decision:** Proceed if yes

- [ ] **Can we depend on AI Gateway for provider routing?**
  - Trade-off: Less application-level control over routing logic
  - Benefit: Native fallback, budget enforcement, timeout handling, zero code
  - **Decision:** Proceed if yes

- [ ] **Are we comfortable with Cloudflare Agents SDK (Think) stability?**
  - Status: GA product, 30+ production examples, Cloudflare official support
  - **Decision:** Proceed if yes

### Risk Checklist

- [ ] **Can we run staging tests in parallel with Phase 1 improvements?**
  - Phase 1 (validation, logging, docs) is non-breaking
  - Phase 2+ (DO) requires new deployment
  - **Mitigation:** Phase 1 ships immediately, Phase 2 staging-only

- [ ] **Do we have a rollback plan?**
  - Old system runs in standby for 1 week post-cutover
  - Gradual canary (10% → 50% → 100%)
  - **Mitigation:** Rollback script ready before cutover

- [ ] **Can we measure cost impact during canary?**
  - AI Gateway provides native metrics
  - Target: 50–70% cost reduction
  - **Mitigation:** Monitor before/after carefully

### Resource Allocation

| Phase | Duration | FTE-weeks | Team |
|-------|----------|-----------|------|
| **Phase 1** | 1 week | 0.5 | 1 backend eng |
| **Phase 2** | 1 week | 1.0 | 2 backend eng |
| **Phase 3** | 1 week | 1.0 | 2 backend eng |
| **Phase 4** | 1 week | 1.0 | 2 backend eng |
| **Phase 5** | 1 week | 0.5 | 1 ops + 1 devops |
| **Cleanup** | Parallel | 0.3 | 1 backend eng |

**Total:** 3 FTE-weeks, 2–3 engineers, 1 month to complete

---

## For Product

### Stakeholder Impact

| Stakeholder | Impact | Risk | Mitigation |
|-------------|--------|------|-----------|
| **Operators** | Faster responses, better reliability | None (improvements only) | Monitor latency during canary |
| **Finance** | 50–70% cost reduction | None (savings) | Track AI Gateway spend metrics |
| **DevOps** | Simpler deployment (Durable Objects + config) | None (simpler) | One-week standby period |
| **Legal** | Same compliance (Cloudflare handles) | None | Verify SLA coverage unchanged |

### SLA Commitments

| Metric | Current | Target | Confidence |
|--------|---------|--------|------------|
| **Uptime** | 99.5% | 99.95% | High (Durable Objects + Cloudflare SLA) |
| **Latency P50** | 450ms | 350ms | High (native routing) |
| **Latency P95** | 2.1s | 1.2s | Medium (depends on model) |
| **Error rate** | 0.5% | 0.1% | High (native error handling) |

---

## For DevOps

### Infrastructure Changes

**New Components:**
- Durable Objects (replaces KV session code)
- AI Gateway routes config (JSON, replaces router code)
- Worker binding (simple)

**Removed Components:**
- KV session management (~300 lines code)
- Custom router (~300 lines code)
- Circuit breaker logic (~150 lines code)

**Deployment:**
- No new services
- No new databases
- Pure Cloudflare platform (all native)

### Operational Playbooks

**Playbook 1: AI Gateway Fallback Trigger**

If Workers AI latency spikes:
1. AI Gateway automatically routes to OpenAI fallback
2. No manual intervention needed
3. Monitor via dashboard: Metrics > Routes > Fallback rate

**Playbook 2: Budget Limit Exceeded**

If spending exceeds budget:
1. AI Gateway automatically switches to fallback (cheaper model)
2. Alert: `AI_GATEWAY_BUDGET_EXCEEDED`
3. Decide: increase budget or reduce traffic

**Playbook 3: Durable Object Eviction**

If Durable Object is evicted mid-conversation:
1. Think framework automatically recovers using "recoverable fibers"
2. Partial output buffered and retried
3. State persisted, conversation continues seamlessly

**Playbook 4: Rollback**

If production issues detected:
1. Redirect traffic back to old system (load balancer flag)
2. New system stays in standby (don't delete)
3. Investigate, fix, redeploy
4. Retry canary (10% → 50% → 100%)

### Monitoring Dashboard

Set up alerts for:

```
AI Gateway:
  - fallback_rate > 5% → Investigate Workers AI
  - budget_exceeded → Increase budget or reduce traffic
  - latency_p95 > 2s → Likely upstream issue

Durable Objects:
  - eviction_rate (normal, just monitor)
  - cpu_usage > 50% (usually fine, workload-dependent)
  - storage_usage > 1GB per object (large conversations, monitor)

Workers:
  - error_rate > 0.5% → Immediate investigation
  - cold_start_rate (should be low, DO hibernation helps)
```

---

## Team Decision Template

Copy and complete this during sync:

### We agree to:

- [ ] Adopt Cloudflare Agents SDK (Think framework)
- [ ] Use AI Gateway for provider routing
- [ ] Use Durable Objects for agent state
- [ ] Use embedded function calling (@cloudflare/ai-utils)
- [ ] Proceed with phased 4-week migration
- [ ] Allocate 3 FTE-weeks of engineering capacity
- [ ] Run staging tests in parallel with Phase 1
- [ ] Maintain one-week rollback standby after production cutover

### We will NOT:

- [ ] Keep custom provider router code
- [ ] Keep custom model registry
- [ ] Keep custom circuit breaker logic
- [ ] Keep KV session management
- [ ] Build new features during migration (feature freeze Phase 2–5)

### First Actions (This Week):

- [ ] **Eng lead:** Schedule kickoff, assign Phase 1 owner
- [ ] **DevOps:** Prepare AI Gateway routes config template
- [ ] **Eng:** Create Phase 1 PR for Zod validation (non-blocking)
- [ ] **Product:** Communicate to stakeholders (uptime improvement)
- [ ] **All:** Read research summary (CF-ARCHITECTURE-REDESIGN-2026.md)

### Tentative Timeline:

- Week 1: Phase 1 (validation, logging, docs) — low risk, quick wins
- Week 2: Phase 2 (Durable Objects) — staging only
- Week 3: Phase 3 (AI Gateway) — staging only
- Week 4: Phase 4 + Phase 5 (production canary + rollback standby)

---

## Success Criteria

### After Phase 1 (One Week)

- ✅ 3 PRs merged (validation, logging, docs)
- ✅ 0 production incidents
- ✅ 6 issues fixed (out of 32)
- ✅ Staging agent skeleton deployed

**Gate:** Proceed to Phase 2 if all green.

### After Phase 5 (Four Weeks)

- ✅ Code reduction: 2,600 → 600 lines (77%)
- ✅ Issues fixed: 12 of 32 (others architectural/doc)
- ✅ Latency: P95 < 1.5s (target 1.2s)
- ✅ Cost: 50–70% reduction verified
- ✅ Uptime: 99.95% in first week
- ✅ Error rate: < 0.2%
- ✅ Zero customer-facing incidents

**Gate:** Keep production system if all green; retire standby.

---

## FAQ

### Q: Will this break anything?

**A:** No. Phase 1 is non-breaking. Phases 2–5 only touch staging initially. Production canary is 10% → 50% → 100% with rollback ready.

### Q: How long will it take?

**A:** 4 weeks total (108 hours), with team mostly working in parallel. Phase 1 (1 week) can ship immediately.

### Q: Will costs go up?

**A:** No, they'll go down. Durable Objects hibernation + embedded function calling = 50–70% savings. AI Gateway budget enforcement prevents overspend.

### Q: Can we keep using Mastra?

**A:** Yes! Think framework integrates with Mastra agents as tools. Use `@callable()` methods to expose agent tools to the agentic loop.

### Q: What if AI Gateway doesn't route correctly?

**A:** AI Gateway routes based on your JSON config (no code). You control the config. Fallback chain is: Workers AI → OpenAI → Anthropic (your choice).

### Q: What about existing conversations?

**A:** Phase 2 includes migration script to load old KV sessions into Durable Object state. No data loss.

### Q: How do we handle the transition?

**A:** Gradual canary (10% → 50% → 100%) over 3–4 hours. Old system in standby for 1 week. Rollback script ready.

### Q: Do we need new infrastructure?

**A:** No. Durable Objects, Workers, AI Gateway are all Cloudflare native. No new VMs, databases, or services.

### Q: What if Cloudflare has an outage?

**A:** Same as now (Worker outage = service down). No additional risk. SLA coverage unchanged.

---

## Comparison: Before & After

### Before (Current)

```
2,600 lines of custom code
32 documented issues
90 potential failure points
~$X cost per month (baseline)
Multi-RPC per request
Fragile state management
Tool call IDs not preserved
```

### After (Recommended)

```
~600 lines of custom code
20 remaining issues (architectural/doc, not code)
3 potential failure points
~$X * 0.35 cost per month (50–70% savings)
Single DO per conversation
Persistent state (auto-persisted)
Tool call IDs preserved
```

---

## Recommended Reading Order

1. **This document** (5 min) ← You are here
2. **CF-ARCHITECTURE-REDESIGN-2026.md** (30 min) — Full strategic review
3. **CF-ARCHITECTURE-DIAGRAMS.md** (20 min) — Visual comparison
4. **CF-MIGRATION-ROADMAP.md** (15 min) — Phase breakdown

**Total time:** ~70 minutes for full context

---

## Decision Record

**Date:** ___________  
**Attendees:** ___________  
**Decision:** 

- [ ] Approve recommendation (proceed with migration)
- [ ] Defer (request more information)
- [ ] Reject (keep current architecture)

**Rationale:** ___________

**Next Actions:** ___________

**Sign-off:**

- Engineering Lead: __________ Date: __________
- Product Manager: __________ Date: __________
- DevOps Lead: __________ Date: __________

---

**Document Version:** 1.0  
**Last Updated:** 2026-07-12  
**Questions?** See the full research document or schedule a sync
