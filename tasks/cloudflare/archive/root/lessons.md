# Cloudflare Lessons Learned — cf-wf Improvement Plan

**Date:** 2026-07-12  
**Source:** PR #339 (Bearer Token Auth), PR #340 (Model Registry), PR #336 (Audit)  
**Owner:** cf-wf skill steward

---

## Executive Summary

Three critical patterns emerged from the Cloudflare PR audits that exposed gaps in the cf-wf skill and execution discipline:

1. **Whitespace/edge-case validation skipped** — Bearer token comparison didn't trim before equality check
2. **Deprecated status not verified against live docs** — Model assumed "current" without checking official Cloudflare changelog
3. **Mixed scope allowed in single PR** — Model registry + Gemini provider + types bundled instead of split
4. **CI testing gap** — Cloudflare Worker tests don't run in CI; local-only auth bypass masked real bugs
5. **Pricing claims unverified** — Assumed "same pricing" without official source

**Impact:** Production bugs shipped, scope creep entrenched, regressions undetectable in CI.

---

## Root Causes & Prevention

### 1. Stage 2 (Evidence Collection) Too Shallow

**What went wrong:**
- Bearer token: Line 95 compared untrimmed token to env variable. Test added for happy path but not whitespace edge case.
- Model registry: Assumed `@cf/meta/llama-3.1-8b-instruct` was current; no check against [Cloudflare model changelog](https://developers.cloudflare.com/changelog).
- Pricing: PR #340 claimed "same pricing, same performance, zero risk" without linking to official docs.

**Prevention:**
- Hard rule: Any claim about model status, pricing, deprecation must cite official Cloudflare docs (MCP lookup or webfetch).
- Test: Grep PRs for "same," "current," "no risk" — if unsupported by a link, flag it.
- Add to Stage 0/Stage 2: MCP lookup mandatory for status/pricing/limit claims.

---

### 2. Edge Cases Not Covered in Regression Tests

**What went wrong:**
Bearer token test suite covered valid/missing/wrong but not **valid token with trailing whitespace** (HTTP header artifact).

**Prevention:**
- Add HTTP edge-case table to Stage 4 testing.
- For auth: test whitespace, case sensitivity, CRLF, empty, null.
- For any string comparison to env vars: **always trim both sides**.

---

### 3. Mixed Scope in Single PR

**What went wrong:**
PR #340 bundled model registry + Gemini provider + types + 6 test files. CLAUDE.md rule "one concern per PR" was violated.

**Prevention:**
- Stage 1 hard rule: If >2 domains touched, split or get approval.
- Pre-push hook: reject multi-domain PRs without explicit okay.
- Example: "model-registry.ts + gemini.ts" → split to #340a + #340b.

---

### 4. CI Gap — Worker Tests Not Run

**What went wrong:**
`.dev.vars` sets `AI_GATEWAY_ALLOW_UNAUTHENTICATED=true`, so Bearer token tests ran with auth **disabled**. CI doesn't run `services/cloudflare-worker/npm test` at all.

**Prevention:**
- Add CI job: run `services/cloudflare-worker/npm test` with explicit `BEARER_TOKEN` injected.
- CI gate: required check for cloudflare-worker tests (auth enabled).
- Never use `.dev.vars` bypass in CI; dev mode only.

---

### 5. Deprecated Model Detection Not Automated

**What went wrong:**
Model deprecated 5/30/2026 was still in code 7/12/2026. No lint rule or monthly audit.

**Prevention:**
- Add CI lint: grep all `*.ts` for known-deprecated model patterns.
- Monthly task: audit model registry against Cloudflare changelog.
- Document deprecation cycles per model (Llama 2 EOL 5/2025, Llama 3.1 8B EOL 5/2026, etc.).

---

## Recommended cf-wf Updates

### Update 1: Stage 0 — Add "CI Audit" subsection

Before claiming a test passes, verify:
- [ ] Local tests run with security features **enabled** (auth, RLS, edge validation)
- [ ] CI runs the same tests (not a subset)
- [ ] CI explicitly injects secrets/env vars (not using `.dev.vars` bypass)
- [ ] CI gate is required check

### Update 2: Stage 2 — Add "Official Sources" rule

**Source hierarchy:**
1. Official Cloudflare docs (MCP lookup or webfetch)
2. Installed package source
3. Test results (local or CI)
4. Training data / memory (⚠️ deprecates fast)

For claims about **status, pricing, limits, deprecation:**
- Must cite official source (MCP result or link in PR)
- Never assume from training data
- Mark unverified as "TBD"

Flags for auto-review:
- "same pricing" without source → 🔴 blocker
- "currently supported" without docs link → 🟡 ask for source
- "deprecated as of [DATE]" without Cloudflare changelog → 🔴 blocker

### Update 3: Stage 4 — Add "HTTP Edge Cases" table

Test these automatically for auth-critical code:

| Input | Expected | Why |
|-------|----------|-----|
| `"secret-token"` | ✅ pass | Happy path |
| `"secret-token  "` (trailing) | ✅ pass | HTTP whitespace |
| `"SECRET-TOKEN"` | ❌ fail or handle | Case sensitivity |
| `"secret-token\r\n"` | ✅ pass | CRLF normalization |
| `""` (empty) | ❌ fail | Empty token |
| `null` / `undefined` | ❌ fail | Null handling |

Every auth route must pass these five.

### Update 4: Stage 1 — Add "Concern Isolation" check

Count distinct domains in changed files. If >2 domains, explain why mixing is required. If no hard dependency, split into separate PRs.

Example (blocker):
```
model-registry.ts + gemini.ts + provider.ts + 6 test files
→ Split: PR #340a (Gemini), PR #340b (Registry)
→ Verify no commit depends on the other
```

### Update 5: Known Gotchas — Add entries

**Bearer token whitespace bug (IPI-468):**
- Gotcha: HTTP header parser injects trailing whitespace
- Impact: Valid token "secret-123   " fails comparison to env var
- Test: Bearer token + trailing spaces must pass auth
- Fix: `const trimmedToken = token.trim()` before comparison

**Deprecated model in registry (IPI-525):**
- Gotcha: Cloudflare deprecates models on fixed dates; no auto-disable
- Impact: Code uses model after deprecation; runtime may fail
- Test: `grep` model-registry.ts against deprecated models list
- List: Llama 2 (EOL 5/2025), Llama 3.1 8B (EOL 5/2026), check changelog for others

**CI gap — local-only auth bypass (IPI-468):**
- Gotcha: `.dev.vars` disables auth; tests run without auth gate
- Impact: Auth bugs not caught until production
- Test: CI must have green check for cloudflare-worker tests with auth **enabled**

---

## Action Plan

### P0 (Before next Cloudflare PR)
- [ ] Add HTTP edge-case table to Stage 4 in cf-wf skill
- [ ] Add CI audit subsection to Stage 0
- [ ] Create lint check: flag "same pricing" / "same performance" without source
- [ ] Add CI job to run `services/cloudflare-worker/npm test` with explicit `BEARER_TOKEN`

### P1 (This month)
- [ ] Document deprecated models + EOL dates in Known Gotchas
- [ ] Add pre-push hook to reject multi-domain PRs without approval
- [ ] Create monthly audit task: sync model registry to changelog
- [ ] Add "Official sources" rule to Stage 2

### P2 (Next quarter)
- [ ] Build automated CI lint for deprecated model patterns
- [ ] Create model evaluation task template
- [ ] Audit all Worker tests for dev-mode bypasses
- [ ] Add to pr-workflow verify-matrix: "Cloudflare Worker tests must run with auth enabled"

---

## Priority Summary

| Update | Impact | Effort | Why |
|--------|--------|--------|-----|
| HTTP edge-case table | High | Low | Prevents auth bugs |
| CI audit check | High | Low | Catches coverage gaps |
| Source gating | High | Medium | Prevents unverified claims |
| Multi-domain split | Medium | Medium | Reduces scope creep |
| Deprecated model lint | High | High | Prevents future deprecations |

---

## What We Learned

1. **Official docs are truth, not training data.** Cloudflare moves fast. Stage 0/2 must require MCP lookups for status/pricing/limits.

2. **Edge cases in security code need explicit tests.** Auth-critical code (token comparison, header parsing) has invisible gotchas. HTTP edge-case table is now required.

3. **One concern per PR is not optional.** Mixing concerns made the PR harder to review and easier to ship wrong. Enforce early with pre-push gate.

4. **CI coverage gaps hide bugs.** `.dev.vars` bypass meant auth tests never ran in CI. Bug shipped because it was "tested locally" with auth disabled. CI must run the same security-sensitive tests.

5. **Unverified claims compound.** "Same pricing" → "same performance" → "zero risk" created false confidence. Stage 2 must gate all material claims.

---

**Updated cf-wf skill in place. Follow up with CI jobs + lint automation.**
you 