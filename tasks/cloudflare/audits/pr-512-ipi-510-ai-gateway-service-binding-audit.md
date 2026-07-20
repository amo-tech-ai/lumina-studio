# PR #512 Audit — IPI-510 · CF-UJ-011 — AI Gateway service binding

**Date:** 2026-07-20  
**PR:** https://github.com/amo-tech-ai/lumina-studio/pull/512  
**Sibling docs PR:** https://github.com/amo-tech-ai/lumina-studio/pull/510  
**Code HEAD (at audit):** `6f9eeab8`  
**Verified against:** Cloudflare docs (service bindings, cache-keys/placeholder hostname, same-zone routing), OpenNext bindings doc, live preview probe, and `services/cloudflare-worker/`.

---

## ✅ Verdict: **~90% correct. Code is sound; remote AC already met.**

Original draft said “~85% … will succeed after preview redeploy.” **Correction:** preview already returns HTTP **200** with `probeVia: "service_binding"` (re-probed 2026-07-20). Remaining work is checkbox/docs hygiene + optional test/local-dev polish — not a code correctness blocker.

---

## Errors found

| # | Severity | Location | Issue | Fix / status |
|---|---|---|---|---|
| E1 | **none (false alarm)** | `probe-ai-gateway-health.ts` | CodeRabbit flagged `https://ai-gateway/health` — shipped URL is `http://ai-gateway/health`. Correct per [CF cache-keys · service binding URL](https://developers.cloudflare.com/workers/cache/cache-keys/#service-binding-url). | None — dismiss bot. |
| E2 | **none (false alarm)** | `probe-ai-gateway-health.ts` | CodeRabbit said `hasApiKey` missing on binding path. Computed once and reused on both paths. | None. |
| E3 | Low (nuance) | `route.ts` `EnvWithAiGateway` hand-rolled | Bypasses generated `CloudflareEnv`. **Correction:** `app/cloudflare-env.d.ts` is **gitignored** (`app/.gitignore`); regenerating types is a local/dev step, not a commit. Hand-rolled narrow type keeps CI/typecheck green without committing generated files. | Optional: cast to `CloudflareEnv` when present; do **not** force-commit gitignored types. |
| E4 | Low | `wrangler.jsonc` top-level `services` | `AI_GATEWAY` only on `env.preview` / `env.production`. Fine for `--env` deploys; `wrangler dev` without `--env` lacks the binding. | Add top-level `AI_GATEWAY` for symmetry, or document `--env preview`. |

---

## Red flags / blockers

| # | Severity | Detail | Status after re-verify |
|---|---|---|---|
| B1 | **Was blocker (AC)** — now **docs lag** | Test plan checkbox `Preview redeploy + remote /api/ai/health → 200` was unchecked in PR body. | **Met.** Live: `curl https://ipix-operator-preview.sk-498.workers.dev/api/ai/health` → 200, `probeVia: "service_binding"`, gateway `{status:ok,service:ai-gateway}`. Evidence JSON in docs PR #510 (`tasks/cloudflare/tests/ipi-510-health/`). Update PR #512 checkboxes. |
| B2 | Non-PR noise | `booking-gate`, `supabase-linked-gates`, `supabase-verify-rls` fail on remote migration drift. | Pre-existing / unrelated. **Do not block merge.** |
| B3 | Risk (low) | Assumes `ai-gateway` Worker exists in same CF account. | Confirmed: `services/cloudflare-worker/wrangler.jsonc` `"name": "ai-gateway"`; public `/health` 200; binding path already works in preview. |

---

## Missing (still accurate)

- No unit test for **service-binding fetch rejection** (`gatewayFetcher.fetch` throws → 503). URL-path `ECONNREFUSED` is covered; binding path is not.
- No test for **AbortSignal** abort mid-flight on either path.
- No committed `wrangler types` output — **by design** (gitignored); not a PR gap.
- Thin local-dev story for `wrangler dev --env preview` (needs `ai-gateway` running or remote binding).
- Evidence file SHA still points at first deploy commit (`b40dca21`); HEAD has follow-up fixes (`cb95367a`, `6f9eeab8`). Live behavior still green; refresh evidence SHA/version on next docs touch.

---

## Suggested improvements (ranked)

1. ~~**Do:** Add binding-fetch-rejects → 503 test.~~ **Done** in `fef8913c`.
2. ~~Drop always-true `adapterAvailable`.~~ **Done** in `fef8913c` (confirmed unused in `app/src` before delete).
3. **Skip commit:** Do not add `cloudflare-env.d.ts` to git; keep hand-rolled type or narrow cast. (`cf-typegen` is local-only.)
4. **Nice (DX):** Top-level `AI_GATEWAY` in `wrangler.jsonc` **or** document `wrangler dev --env preview` — not an implementation error.
5. **Done enough:** PR title already `IPI-510 · CF-UJ-011 — …`; sibling docs PR #510 linked in body.

---

## What's correct (re-verified)

| Claim | Evidence |
|---|---|
| `services[]` wrangler schema | Matches [CF wrangler configuration · service bindings](https://developers.cloudflare.com/workers/wrangler/configuration/#service-bindings). |
| `http://ai-gateway/health` placeholder | Matches [cache-keys service binding URL](https://developers.cloudflare.com/workers/cache/cache-keys/#service-binding-url) (`http://internal/...` style). |
| `getCloudflareContext({ async: true })` | OpenNext Cloudflare bindings pattern. |
| Same-zone `*.workers.dev` 404 diagnosis | Why binding was required; public gateway was already healthy. |
| Downstream `GET /health` | `services/cloudflare-worker/src/router.ts` ~L373 → `{ status: "ok", service: "ai-gateway" }`. |
| Secret hygiene | Only `hasApiKey` boolean; tests assert key absent from `JSON.stringify(body)`. |
| AGENTS.md #1 | 5 files, all `app/`, one concern (IPI-510 binding). |
| Live preview | 200 + `probeVia: "service_binding"` (2026-07-20 re-probe). |

---

## Will it succeed / merge?

**Yes.** Code path is correct and **Remote Preview Verified**. Before merge:

1. ~~Tick PR #512 test-plan checkboxes~~ (done).
2. Dismiss CodeRabbit false alarms (E1/E2).
3. Do **not** block on B2 Supabase/RLS CI noise.
4. Optional: preview redeploy so live JSON drops `adapterAvailable` (HEAD already removed it; preview still on older version).
5. Optional DX: top-level `services` / local-dev note — not merge-blocking.

**Verification level:** Remote Preview Verified (not Production Verified — Vercel prod untouched, as intended).

---

## Meta-review acceptance (2026-07-20) — 94/100 🟢

Second-pass review of this audit. **Accepted with minor severity wording tweaks.**

| Category | Score | Notes |
|---|---:|---|
| Technical accuracy | 96% | E1/E2 false alarms correct; B1 resolved after live binding 200 |
| Cloudflare best practices | 95% | Placeholder URL + `services[]` schema match CF docs |
| OpenNext guidance | 95% | `getCloudflareContext({ async: true })` correct |
| Test coverage review | 92% | Binding-reject path now covered (`fef8913c`) |
| Severity classification | 90% | E3 = maintainability debt; E4 = DX, not a defect |
| **Overall** | **94%** | Quality leftovers, not architectural blockers |

### Severity reclassification (accepted)

| Item | Original | Revised |
|---|---|---|
| E3 hand-rolled `EnvWithAiGateway` | Low issue | **Technical debt / maintainability** (gitignored types by policy) |
| E4 top-level `services` | Low issue | **Developer experience** — only if team uses bare `wrangler dev` |
| B1 preview AC | Blocker (historical) | **Resolved** — live `probeVia: service_binding` + status ok |
| B3 ai-gateway exists | Risk | **Operational prerequisite** — verified same account (`ai-gateway` /health 200) |
| AbortSignal mid-flight test | Missing | **Low / nice-to-have** — do not block merge |
| Remove `adapterAvailable` | Suggested | **Done** after consumer check — field was always-true false signal |

### Still open (non-blocking)

- Preview redeploy to pick up `fef8913c` (drop `adapterAvailable` from live JSON).
- Short local-dev note: `wrangler dev --env preview` + `ai-gateway` running or remote binding.
- Refresh evidence JSON SHA/version on next docs touch.
- Optional smoke script: deploy preview → curl health → save JSON + cf-ray + Worker version (reproducibility).

### Merge path

Merge code PR **#512** + attach evidence/docs PR **#510**. Then reuse the same preview Worker for **IPI-632 · CF-MIG-220 — Protected Preview Runtime Smoke Validation** and **IPI-627 · CF-SEC-020 — Deployment Security Proof** without another deployment (unless HEAD changes require redeploy).
