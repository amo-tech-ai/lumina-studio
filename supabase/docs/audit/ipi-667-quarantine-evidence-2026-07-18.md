# IPI-667 · SB-EDGE-001 — Quarantine evidence (2026-07-18)

**Project:** `nvdlhrodvevgwdsneplk` (fashionos)  
**Validation level:** Production Verified (deleted endpoints)  
**Skills:** `ipix-supabase` · `task-verifier`

## Decision

Delete five FashionOS-era Edge Functions that were deployed but not present under `supabase/functions/`. No `--prune`.

| Slug | Live `verify_jwt` (pre-delete) | Repo source | Callers (app/scripts) | 24h edge logs | Action |
|------|-------------------------------|-------------|------------------------|---------------|--------|
| `generate-event-draft` | true | none | none | none | **DELETED** |
| `generate-media` | false | none | none | none | **DELETED** |
| `resolve-venue` | false | none | none | none | **DELETED** |
| `generate-image-preview` | false | none | none | none | **DELETED** |
| `generate-image-final` | false | none | none | none | **DELETED** |

Prior audit (keep/quarantine scoring): `supabase/docs/audit/j18-edge-functions-audit.md` (QUARANTINE ×5).

## Evidence probes

1. **Inventory (MCP `list_edge_functions`):** 12 ACTIVE before delete; 7 ACTIVE after.
2. **Repo callers:** `rg` over production paths — only historical mentions in audit docs; no `app/` or `scripts/` invoke the five slugs.
3. **Logs (MCP `get_logs` service=`edge-function`, last 24h):** only `audit-asset-dna` POST 200s; zero hits on orphan slugs.
4. **Delete:** `supabase functions delete <slug> --project-ref nvdlhrodvevgwdsneplk --yes` ×5 — each returned `Deleted Edge Function.`
5. **HTTP post-delete:** all five → **404**; `health` control → **200**.
6. **Gate:** `npm run supabase:verify-edge` → **passed** (health + edge-test).

## Remaining deployed (= repo-owned)

`audit-asset-dna` · `brand-intelligence` · `capture-lead` · `edge-test` · `firecrawl-webhook` · `health` · `start-brand-crawl`

| Function | Auth model (retained) |
|----------|----------------------|
| brand-intelligence | Dual: user JWT or service-role |
| audit-asset-dna | Dual: JWT or service-role (Cloudinary webhook path) |
| start-brand-crawl | JWT required |
| firecrawl-webhook | Provider-signed HMAC (`verify_jwt=false` correct) |
| capture-lead | Public + proxy secret + rate limit |
| health | Intentionally public |
| edge-test | JWT required (verify harness) |

## Related

- Closes / supersedes **IPI-239 · FIX — Legacy edge functions audit + retire** with this evidence.
- **IPI-666** remains canceled duplicate.

## Out of scope (not done here)

- Deno unit tests for firecrawl / start-brand-crawl / capture-lead  
- Cloudflare Worker migration of Edge Functions  
- Secret rotation (names only; no values recorded)
