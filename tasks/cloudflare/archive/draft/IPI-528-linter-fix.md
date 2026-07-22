# IPI-528 · INFRA-010 — Fix Linter OOM in CI

**Status:** 🔴 BLOCKER (blocks all PRs)  
**Priority:** Critical  
**Effort:** 1 hour  
**Type:** Infrastructure / CI  
**Linked:** IPI-525, IPI-454, CF-MIG-110–810

---

## Problem

**Current:** ESLint runs out of memory during `npm run lint` in GitHub Actions CI.

**Impact:**
- No PRs can merge
- IPI-525 (tool calling) blocked from review
- Entire Cloudflare roadmap blocked
- Operator deployments stalled

**Root cause:** Node.js default heap (512MB) is insufficient for 141 test files + 50+ component files + Mastra agent registry.

---

## Solution

### Option A: Increase Node Heap (Recommended)

**Change:** In `.github/workflows/ci.yml`, update the lint step:

```yaml
# Before:
- name: Lint
  run: npm run lint

# After:
- name: Lint
  run: node --max-old-space-size=4096 node_modules/.bin/eslint . --max-warnings=0
```

**Heap:** 512MB → 4096MB (4GB)  
**Status:** ✅ IMPLEMENTED (see [PR #334](https://github.com/amo-tech-ai/lumina-studio/pull/334))

---

### Option B: Switch to Biome (Long-Term)

**Alternative:** Replace ESLint with Biome (faster, lower memory).

```bash
npm install --save-dev @biomejs/biome
npx biome migrate eslint
npx biome lint .
```

**Pros:** Faster, uses 10x less memory, single tool (lint + format)  
**Cons:** Migration work, new tooling learning curve  
**Recommended for:** Q3 2026 refactor (not critical now)

---

## Implementation

### ✅ Done (Option A)

File: `.github/workflows/ci.yml` (line 57–58)

```yaml
- name: Lint
  run: node --max-old-space-size=4096 node_modules/.bin/eslint . --max-warnings=0
```

**Why this works:**
- Explicit heap size avoids default 512MB limit
- `--max-warnings=0` ensures CI fails on any warning (strict)
- Direct `eslint` invocation bypasses npm wrapper overhead

### Testing

```bash
# Local verification (matches CI):
cd app
node --max-old-space-size=4096 node_modules/.bin/eslint . --max-warnings=0
```

**Expected:** Completes in ~60s, no OOM.

---

## Gate

- [ ] PR #334 merged (CI workflow update)
- [ ] Next CI run completes lint without OOM
- [ ] PR #333 (IPI-525) can now be reviewed and merged
- [ ] IPI-528 marked Done

---

## Impact

**After merge:**
- ✅ All pending PRs (including #333) can merge
- ✅ IPI-525 tool calling can proceed
- ✅ Cloudflare roadmap unblocked
- ✅ Operator deployments can resume

**Timeline:** Merge by EOD (1 hour) → CI green → PR #333 mergeable within 2 hours.

---

## Future Consideration

**Q3 2026:** Evaluate Biome migration (Option B). Current solution is sufficient for production; Biome would improve CI performance (60s → 10s lint).

**Decision gate:** If lint becomes noticeable slow point in CI, revisit Biome.

---

## References

- ESLint Node heap: https://nodejs.org/en/docs/guides/simple-profiling/
- GitHub Actions setup-node: https://github.com/actions/setup-node
- Biome intro: https://biomejs.dev/
- Current workaround (manual local): `node --max-old-space-size=8192 node_modules/.bin/eslint .`

---

## Checklist

- [x] Root cause identified (heap limit)
- [x] Solution designed (Option A + B)
- [x] Option A implemented (CI workflow updated)
- [x] Local testing documented
- [x] PR #334 created
- [ ] PR #334 merged
- [ ] CI confirmed green (next run)
- [ ] IPI-528 marked Done
- [ ] IPI-525 PR #333 unblocked + merged
