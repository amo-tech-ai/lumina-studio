# IPI-694 · CF-EDGE-AI — Route Supabase Edge LLM through Cloudflare AI Gateway

**Linear:** [IPI-694 · CF-EDGE-AI](https://linear.app/amo100/issue/IPI-694)  
**Task ID:** CF-EDGE-AI  
**Phase:** Parallel to native Mastra path (IPI-586+) — Edge-specific  
**Difficulty:** Medium  
**Risk:** Medium (secrets + remote BI)  
**Estimated time:** 3–5 days across children  
**Dependencies:** Working OpenAI-compat path on `ipix-prod` (or interim Gateway URL)  
**Agent plan:** [`../agent/5-cf-edge-plan.md`](../agent/5-cf-edge-plan.md)

---

## Purpose

Stop Brand Hub / Asset DNA Edge Functions from depending on Edge-stored `GEMINI_API_KEY`. Keep handlers on Supabase Deno; send model traffic to **Cloudflare AI Gateway → Workers AI**.

### Real-world iPix example

Operator runs Brand Hub crawl analysis. Today Edge calls Gemini. After Phase A, the same button still works, but the model runs on Workers AI via `ipix-prod`. Engineers can then rotate/remove Gemini on Edge (**IPI-690**) without breaking the Hub.

---

## Child task files

| File | Linear | Spec |
|------|--------|------|
| [`061-CF-EDGE-001-adr.md`](061-CF-EDGE-001-adr.md) | [IPI-695](https://linear.app/amo100/issue/IPI-695) | ADR docs-only |
| [`062-CF-EDGE-002-gateway-client.md`](062-CF-EDGE-002-gateway-client.md) | [IPI-696](https://linear.app/amo100/issue/IPI-696) | Deno client + allowlist |
| [`063-CF-EDGE-003-brand-intelligence.md`](063-CF-EDGE-003-brand-intelligence.md) | [IPI-697](https://linear.app/amo100/issue/IPI-697) | Wire BI |
| [`064-CF-EDGE-004-audit-asset-dna.md`](064-CF-EDGE-004-audit-asset-dna.md) | [IPI-698](https://linear.app/amo100/issue/IPI-698) | Wire DNA or defer |
| [`065-CF-EDGE-005-secrets-smoke.md`](065-CF-EDGE-005-secrets-smoke.md) | [IPI-699](https://linear.app/amo100/issue/IPI-699) | Secrets + remote smoke |
| Phase B | [IPI-455](https://linear.app/amo100/issue/IPI-455) | Full Worker port — after 699 |

---

## Epic success criteria

- [ ] ADR merged (Edge stays Deno; LLM via Gateway HTTP)
- [ ] `AI_PROVIDER=cloudflare` works for BI structured output remotely
- [ ] DNA wired **or** deferred with linked ticket
- [ ] Remote smoke: Edge → `ipix-prod` → Workers AI without Gemini on happy path
- [ ] Infisical + Supabase secret names documented
- [ ] IPI-455 clarified as Phase B
- [ ] Validation: Local Runtime + Remote Preview (not Production until soak)

## Out of scope

- OpenNext operator hosting
- Mastra agent cutover (IPI-586 / IPI-594)
- Deleting custom gateway Worker (IPI-592)
- Firecrawl webhook / capture-lead moves
