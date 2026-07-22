# Secrets Classification Audit — Verification (CF-SEC-010)

**Date:** 2026-07-18  
**Baseline audit score:** 82/100  
**Verified score after repo corrections:** **80/100**  
**Linear:** IPI-606 · CF-SEC-010 · follow-up IPI-TBD CF-SEC-030

This document verifies the external secrets classification audit against codebase evidence, Cloudflare official docs, and the corrections applied in this PR.

## Methodology

1. Read allowlist SSOT (`app/scripts/cloudflare-secret-allowlist.mjs`), wrangler config, CI workflow, and runtime usage via grep.
2. Cross-checked Cloudflare docs: Worker secrets vs vars, `secrets.required` validation, `--secrets-file` preservation behavior, Secrets Store `await env.BINDING.get()` API.
3. Applied minimal focused diffs where audit findings were validated.

## Audit item verification

| Audit claim | Verdict | Evidence |
|-------------|---------|----------|
| `INTELLIGENCE_API_URL`, `INTELLIGENCE_GATEWAY_WS_URL` are plain URLs, not secrets | **Agree** | `intelligence-config.ts` checks presence only; no credentials embedded. `.env.example` uses `http://localhost:4201`. |
| `AI_GATEWAY_URL` is a plain URL | **Agree** | `provider.ts` / `provider-adapter.ts` use as HTTP base URL with separate `AI_GATEWAY_API_KEY` for auth. |
| `CLOUDINARY_CLOUD_NAME` is public | **Agree** | In every delivery URL; `url.ts` documents public nature; default `dzqy2ixl0` in code. |
| `CLOUDINARY_API_KEY` is public widget key, not API secret | **Agree** | `url.ts` L20–21: "Public Cloudinary API key — never the secret." Server routes use same public key for signing; `CLOUDINARY_API_SECRET` holds the real secret. |
| Move URL/public keys from runtime secrets → wrangler `vars` | **Agree — applied** | Added to `WRANGLER_VAR_NAMES` + `wrangler.jsonc` per-env `vars`. Removed from sync workflow env blocks. |
| `CAPTURE_LEAD_PROXY_SECRET` missing from allowlist | **Agree — applied** | Used in `app/src/app/api/marketing-lead/route.ts`; added to `RUNTIME_SECRET_NAMES` + workflow. |
| `FIRECRAWL_WEBHOOK_SECRET` belongs in Worker runtime | **Disagree — rejected** | Only referenced in `supabase/functions/firecrawl-webhook/` — Supabase edge surface. Documented in `CI_ONLY_SECRET_NAMES`, not Worker sync. |
| `DATABASE_URL` optional while `MASTRA_STORAGE_MODE=noop` | **Agree** | `storage.ts` skips Postgres when noop; Worker stub rejects pg mode. Remains optional runtime secret until Hyperdrive (IPI-619). |
| `secrets.required` should not list all optional secrets | **Agree — applied** | Expanded to minimal bootstrap trio only: `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `COPILOTKIT_LICENSE_TOKEN`. |
| `--secrets-file` omission preserves existing secrets | **Agree — documented** | [Cloudflare docs](https://developers.cloudflare.com/workers/configuration/secrets/#upload-secrets-alongside-code): "Secrets not included in the file are preserved from the previous version." |
| Worker secrets ≠ Secrets Store bindings | **Agree — documented** | Worker secrets: `process.env.X`. Secrets Store: `await env.BINDING.get()`. Store `6a663ade…` not wired — intentional. |
| `NEXT_PUBLIC_*` should be GitHub vars, not secrets | **Agree — documented** | Build-time only; anon keys and DSN are publishable. CI should use repo variables where possible. |
| `SENTRY_DSN` is public; only `NEXT_PUBLIC_SENTRY_DSN` needed client-side | **Agree — no change** | `instrumentation-client.ts` uses `NEXT_PUBLIC_SENTRY_DSN`; server/edge fall back to `SENTRY_DSN ?? NEXT_PUBLIC_SENTRY_DSN`. Not in Worker sync allowlist (Sentry init at build). |
| Do not add `secrets_store_secrets` bindings yet | **Agree — documented** | Deferred to CF-SEC-030; current Infisical → `--secrets-file` path is working and simpler for single-Worker project. |

## Score adjustment rationale

| Delta | Reason |
|-------|--------|
| +4 | URL/public-key reclassification applied consistently (allowlist, wrangler, workflow, docs) |
| +2 | `CAPTURE_LEAD_PROXY_SECRET` added; `secrets.required` aligned with safer bootstrap set |
| −2 | Audit incorrectly suggested `FIRECRAWL_WEBHOOK_SECRET` for Worker runtime (edge-only) |
| −2 | Production `WRANGLER_VAR_NAMES` placeholders still need manual operator values (Intelligence URLs) |
| −2 | GitHub env var vs secret relabeling for `NEXT_PUBLIC_*` remains manual |
| −2 | Secrets Store store ID not wired; CF-SEC-030 inventory incomplete |

**Verified score: 80/100** (audit baseline 82/100 + validated corrections − remaining manual gaps; corrected from a prior arithmetic error — deltas sum to −2, not +6: 82 + 4 + 2 − 2 − 2 − 2 − 2 = 80)

## Corrections applied

| File | Change |
|------|--------|
| `app/scripts/cloudflare-secret-allowlist.mjs` | Split `WRANGLER_VAR_NAMES`, `CI_ONLY_SECRET_NAMES`; removed 5 misclassified runtime names; added `CAPTURE_LEAD_PROXY_SECRET`; updated `RUNTIME_REQUIRED_SECRET_NAMES` to 3-key bootstrap set; runtime guard rejects var names |
| `app/wrangler.jsonc` | Added `vars` for non-secret config per preview/production; `secrets.required` → 3 keys |
| `app/docs/infisical-cloudflare-secrets.md` | Worker vs Secrets Store section; corrected classification tables; `--secrets-file` preservation; CF-SEC-030 reference |
| `.github/workflows/cloudflare-secrets-sync.yml` | Removed var-classified names from secret env blocks; added `CAPTURE_LEAD_PROXY_SECRET` |
| `app/scripts/cloudflare-secret-allowlist.test.mjs` | Tests for disjoint allowlists, var rejection, required trio, wrangler vars |

## Corrections rejected

| Item | Reason |
|------|--------|
| `FIRECRAWL_WEBHOOK_SECRET` in Worker runtime | Edge-only (`supabase/functions/firecrawl-webhook`); Infisical `/ipix/edge` path |
| `secrets_store_secrets` bindings | Out of scope until CF-SEC-030; would require code changes (`await .get()`) and store wiring |
| `COPILOTKIT_LICENSE_TOKEN` as optional | Audit's safer preview set requires it for CopilotKit bootstrap; matches operator preview expectations |

## Remains manual (operators)

1. **GitHub repository labeling** — move `NEXT_PUBLIC_*` from GitHub Secrets to Variables where currently mislabeled.
2. **GitHub environment variables** — configure `INTELLIGENCE_API_URL`, `INTELLIGENCE_GATEWAY_WS_URL`, and optional `AI_GATEWAY_URL`, `CLOUDINARY_*` on `preview` and `production` environments. Bootstrap injects them via upload `--var` (Wrangler SSOT — do not set in Cloudflare Dashboard).
3. **Orphan secret cleanup** — if Worker still has old secret names (`INTELLIGENCE_API_URL`, etc.) from prior syncs, follow the orphan inventory procedure in `app/docs/infisical-cloudflare-secrets.md`.
4. **Secrets Store** — account store `6a663ade…` exists but is not bound; decision deferred to CF-SEC-030.
5. **Infisical folder scoping** — ensure `/ipix/edge` holds edge-only secrets separately from Worker runtime path.

## Recommended next steps

### IPI-606 (CF-SEC-010 — Infisical → Cloudflare)

- Run dry-run bootstrap: `node scripts/upload-opennext-with-secrets.mjs --infisical-env dev --wrangler-env preview --dry-run`
- Live preview bootstrap after GitHub environment secrets include the 3 required keys + optional set
- Relabel GitHub `NEXT_PUBLIC_*` as repository variables

### IPI-632 (protected preview smoke)

- After bootstrap, run smoke against preview URL: auth gate, `/api/copilotkit/info`, one agent turn
- Verify marketing lead proxy with `CAPTURE_LEAD_PROXY_SECRET` set

### IPI-TBD CF-SEC-030 (full env inventory)

- Complete inventory of all env vars across Worker, Supabase edge, CI, and local dev
- Decide Secrets Store vs per-Worker secrets for shared credentials (Gemini, Supabase service role)
- Wire or formally deprecate store ID `6a663ade…`
- Document Hyperdrive cutover impact on `DATABASE_URL` classification (IPI-619)

## Test verification

```bash
cd app && npm run test -- scripts/cloudflare-secret-allowlist.test.mjs
```

All tests must pass before merge.
