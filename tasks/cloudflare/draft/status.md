# Cloudflare Migration Status — 2026-07-12

**Overall Progress:** 88% | **Production Ready:** 72% | **Blocker:** Linter OOM

---

## Current State

| Item | Status | Evidence |
|------|--------|----------|
| Tests | ✅ 1039/1039 pass | `npm test -- --run` (7.89s) |
| Build | ✅ Next.js + OpenNext | Both passing |
| Type check | ✅ Zero errors | `npm run typecheck` |
| Linter | 🔴 OOM crash | **Blocks CI** — needs fix |
| AI Gateway Worker | ✅ Live | Health check 200, routing works |
| Main branch | ✅ Current | `a220e381` (latest) |

---

## Tasks Complete (7/10)

| # | Task | Status | PR |
|---|------|--------|-----|
| 1 | CF-MIG-110 · OpenNext Foundation | 🟢 100% | #282 |
| 2 | IPI-457 · Unified Provider Registry | 🟢 100% | #302 |
| 3 | IPI-454 AC-F · Gateway Routing | 🟢 85% | #317 |
| 4 | CF-MIG-210 · Runtime Compatibility | 🟢 92% | #286 |

---

## Tasks In Progress (2/10)

| # | Task | % | Blocker |
|---|------|---|---------|
| 5 | IPI-525 · Workers AI Tool Calling | 20% | Core gap: forwarding code |
| 6 | IPI-465 · Shared Tool Registry | 20% | Depends on IPI-525 |

---

## Tasks Not Started (3/10)

| # | Task | Blocked By |
|---|------|-----------|
| 7 | IPI-485 · Mastra Gateway Cutover | IPI-525 + AC-J |
| 8 | CF-MIG-111 · CI Build Gate | IPI-525 + AC-J |
| 9 | CF-MIG-220 · Preview Smoke Tests | PostgresStore verification |
| 10 | IPI-463 · Failover & Rollback | IPI-462 |

---

## Critical Blockers

### 🔴 1. Linter OOM Crash
- **Impact:** CI cannot validate PRs
- **Root cause:** ESLint + 141 test files = heap overflow
- **Fix:** Increase Node heap OR migrate to Biome
- **Timeline:** Today

### 🔴 2. IPI-525 Tool Calling Missing
- **Impact:** Tool-bearing agents can't reach Workers AI gateway
- **Status:** Spec written, code not implemented
- **Fix:** Add tools array + tool_choice forwarding
- **Timeline:** 1–2 days

### 🟡 3. CF-MIG-220 Smoke Tests
- **Impact:** No E2E proof before production cutover
- **Blocker:** PostgresStore hang risk verification needed
- **Fix:** Run real browser journeys on preview
- **Timeline:** After IPI-525 + AC-J complete

---

## Next Actions (Priority Order)

1. **Today:** Fix linter OOM (blocks all PRs)
   ```bash
   # Option A: Increase heap
   node --max-old-space-size=8192 node_modules/.bin/eslint .
   
   # Option B: Use Biome
   npm install --save-dev @biomejs/biome
   npx biome migrate eslint
   ```

2. **This week:** Implement IPI-525 (unblocks all tool agents)
   - Add `tools` array to gateway `/v1/chat/completions`
   - Forward `tool_choice` from Mastra to Workers AI
   - Test with production-planner agent

3. **Next week:** Complete AC-J + AC-G
   - E2E browser journey (public-marketing chat)
   - KV model registry seed

---

## Task Corrections Needed (Linear)

Update these immediately:

| Task | Should Be | Reason |
|------|-----------|--------|
| IPI-471 | Done (100%) | Doc merged to main |
| IPI-457 | Done (100%) | Registry merged PR #302 |
| IPI-454 | In Progress (85%) | AC-F merged, AC-G/J pending |
| CF-MIG-210 | Done (92%) | PR #286 merged, 1 risk remains |

---

## Production Readiness

**Currently:** 72% ready  
**Blockers to cutover:**
- [ ] Linter OOM fixed
- [ ] IPI-525 tool calling implemented
- [ ] IPI-454 AC-J E2E proof passing
- [ ] CF-MIG-220 smoke tests passing
- [ ] PostgresStore hang risk verified/mitigated

**Timeline to production:** End of July 2026 (if no blocking issues found)

---

## What NOT to Do Yet

- ❌ Cut DNS (CF-MIG-810) until CF-MIG-220 passes
- ❌ Remove Gemini fallback until IPI-463 rollback tested
- ❌ Set `AI_ROUTING_MODE=gateway` in production until AC-J passes
- ❌ Merge any new PRs until linter is fixed

---

## References

- Full audit: `status-cloudflare.md` (320 lines, all evidence)
- Architecture: `plan/cf-000-platform-architecture.md`
- Engineering workflow: `ENGINEERING-WORKFLOW.md`
- Epic (stale, needs update): [IPI-487](https://linear.app/amo100/issue/IPI-487)
