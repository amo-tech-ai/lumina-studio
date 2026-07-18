> **CLOSED — no rotate (2026-07-18).** Human decision: keys work; inventory sufficient; do not rotate/revoke; keep existing `GEMINI_API_KEY`. Edge Gemini drop stays deferred to **IPI-699 · CF-EDGE-005** (separate; not canceled). Linear: [IPI-690](https://linear.app/amo100/issue/IPI-690) → Done / Low.

# IPI-690 · SB-EDGE-007 — Gemini key exposure ops checklist

**Status:** 🟢 Done · **no-rotate** · Decision recorded on Linear  
**Project:** `nvdlhrodvevgwdsneplk`  
**Why (historical):** Deleted FashionOS `generate-media` appended `GEMINI_API_KEY` to download URLs. Orphans are 404 live; exposure window may still exist in logs/CDNs. Updating Infisical/Supabase alone is **not** rotation — revoke at Google (not done — closed without rotate).

**Safer drop of Edge `GEMINI_API_KEY`:** after **IPI-699 · CF-EDGE-005 — Secrets + remote smoke** proves Brand Hub via AI Gateway (unchanged; separate track).

---

## Consumer inventory (repo evidence 2026-07-18)

| Surface | Path / secret store | Uses `GEMINI_API_KEY`? | Notes |
|---------|---------------------|------------------------|-------|
| Edge shared LLM | `supabase/functions/_shared/llm/structured.ts` | Yes | Structured generation |
| Edge Brand Intelligence | `supabase/functions/brand-intelligence/handler.ts` | Yes | Crawl analysis path |
| Edge Asset DNA | `supabase/functions/audit-asset-dna/handler.ts` | Yes | Vision / DNA audit |
| Edge other live fns | `health`, `edge-test`, `capture-lead`, `start-brand-crawl`, `firecrawl-webhook` | No | Do not require Gemini |
| Operator app / Mastra | `app/src/lib/ai/gemini-registry.ts` (+ Mastra agents) | Yes | Infisical / local `.env` — **separate from Edge secret** |
| Cloudflare Worker | `services/cloudflare-worker` / `.dev.vars` | Possible local | Gateway path — not Edge Deno secret |
| Deleted orphans | `generate-media` (was live) | **Was yes — URL leak risk** | Deleted under **IPI-667 · SB-EDGE-001**; do not restore |
| Supabase Edge secrets | Dashboard → Edge Functions → Secrets | Yes if set | **Unchanged** (no-rotate) |
| Infisical `dev` / prod | `GEMINI_API_KEY` | Yes | **Unchanged** (no-rotate) |

---

## Rotation sequence (superseded by no-rotate)

```text
[x] 1. Inventory complete (table above)
[x] 2–7. SKIPPED — human decision 2026-07-18: no rotate / no revoke
[x] 8. Decision recorded on Linear IPI-690: no-rotate
```

**Do not:** paste key values into Linear, git, Slack, or PR bodies.  
**Do not:** treat “no hits in Edge logs” as proof of non-exposure (retention limits).

---

## Decision record

| Field | Value |
|-------|-------|
| Decision | ☑ **no-rotate** (human final 2026-07-18 — keys work; inventory sufficient) |
| Google new key created | ☐ N/A |
| Infisical updated | ☐ No — keep current |
| Supabase Edge secret updated | ☐ No — keep current |
| Smoke BI | ☐ N/A (no key change) |
| Smoke DNA | ☐ N/A (no key change) |
| Old key revoked at Google | ☐ No — do not revoke |
| Edge GEMINI drop deferred to | **IPI-699 · CF-EDGE-005** (preferred; remains open) |

---

## Related

- **IPI-667 · SB-EDGE-001** — orphans deleted (Done #443)
- **IPI-699 · CF-EDGE-005** — after gateway smoke, safer to remove Edge Gemini
- Supabase secrets docs: https://supabase.com/docs/guides/functions/secrets
