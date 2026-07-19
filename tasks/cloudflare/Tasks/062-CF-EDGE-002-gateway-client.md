# IPI-696 · CF-EDGE-002 — Edge LLM client for Cloudflare AI Gateway + allowlist

**Linear:** [IPI-696 · CF-EDGE-002](https://linear.app/amo100/issue/IPI-696)  
**Task ID:** CF-EDGE-002  
**Phase:** 2 of 5 (CF-EDGE-AI)  
**Difficulty:** Medium  
**Risk:** Low (shared module; no remote flip yet)  
**Estimated time:** 4–6 hours  
**Dependencies:** [IPI-695](https://linear.app/amo100/issue/IPI-695) ADR  
**PR type:** Code-only

---

## Purpose

Add Deno `AI_PROVIDER=cloudflare` that POSTs OpenAI-compatible chat/structured requests to Cloudflare AI Gateway (`ipix-prod`). Mirror contracts from `app/src/lib/ai/provider-adapter.ts` without importing Node into Deno.

### Real-world iPix example

Engineers can unit-test the Cloudflare branch before Brand Hub ever flips. No operator-visible change until 003 + 005.

---

## Recommended method

1. Extend `supabase/functions/_shared/llm/allowlist.ts` (+ BI/DNA resolvers).
2. Add `supabase/functions/_shared/llm/cloudflare-gateway.ts` (or similar) with mocked-`fetch` tests.
3. Prefer gateway base URL from env: `AI_GATEWAY_URL` (native `https://gateway.ai.cloudflare.com/v1/<account>/<gateway>/…` OpenAI path).

---

## Completion steps

- [ ] **A — Mirror gateway contract** — Map fields to Worker/native OpenAI shape + error codes.  
  `proof:` mapping table.
- [ ] **B — Implement client** — structured/chat; timeouts; non-2xx → typed errors.  
  `proof:` export names + paths.
- [ ] **C — Allowlist** — accept `cloudflare`; keep gemini/groq.  
  `proof:` Deno tests green.
- [ ] **D — Unit tests** — mock `fetch`; no live network in CI.  
  `proof:` `deno test` excerpt.

---

## Success criteria

- [ ] `AI_PROVIDER=cloudflare` no longer throws “invalid”
- [ ] Cloudflare path never reads `GEMINI_API_KEY`
- [ ] Deno tests: success + 4xx/5xx
- [ ] Code-only PR
- [ ] Validation level: **Unit Verified**

## Do NOT

- Flip remote Edge secrets (→ CF-EDGE-005)
- Change BI/DNA handlers beyond shared imports
- Add features to frozen `services/cloudflare-worker/`

## Files likely touched

- `supabase/functions/_shared/llm/allowlist.ts`
- `supabase/functions/_shared/llm/structured.ts` (or sibling)
- `supabase/functions/_shared/llm/*.test.ts`
- New: `_shared/llm/cloudflare-gateway.ts` (name flexible)
