# IPI-667 · SB-EDGE-001 — Edge Function Audit Report

**Date:** 2026-07-18
**Project:** `nvdlhrodvevgwdsneplk`
**Auditor:** OpenCode tidy-otter
**Status:** COMPLETE

---

## Executive Table

| Function | Repo source | Caller | Auth model | `verify_jwt` | Runtime status | Score | Recommendation |
|---|---|---|---|---|---|---|---|
| **brand-intelligence** | `supabase/functions/brand-intelligence/` | onboarding.ts, workflow, tools, approve/start/resume routes | Dual: JWT or service-role | yes (correct) | ✅ Active — recent 200s | **88** | KEEP |
| **audit-asset-dna** | `supabase/functions/audit-asset-dna/` | Cloudinary webhook route | Dual: JWT or service-role | yes (correct) | ✅ Active — 9 recent 200s (1.5–2.4s) | **85** | KEEP |
| **firecrawl-webhook** | `supabase/functions/firecrawl-webhook/` | Firecrawl API → start-brand-crawl | HMAC-SHA256 signature | no (correct) | ✅ Active | **78** | KEEP AFTER FIXES |
| **start-brand-crawl** | `supabase/functions/start-brand-crawl/` | onboarding.ts, BI workflow, BI tools | JWT required | yes (correct) | ✅ Active | **75** | KEEP AFTER FIXES |
| **health** | `supabase/functions/health/` | verify-edge-functions.mjs | Public (intentional) | no (correct) | ✅ Active | **75** | KEEP AFTER FIXES |
| **edge-test** | `supabase/functions/edge-test/` | verify-edge-functions.mjs only | JWT required | yes (correct) | 🟡 Low usage | **70** | KEEP AFTER FIXES |
| **capture-lead** | `supabase/functions/capture-lead/` | marketing-lead route | Public + proxy secret + rate limit | no (correct) | ✅ Active | **72** | KEEP AFTER FIXES |
| **generate-event-draft** | ❌ Downloaded (not tracked) | No repo caller found | None (public) | not in config.toml | 🟡 Unknown | **28** | QUARANTINE |
| **generate-media** | ❌ Downloaded (not tracked) | No repo caller found | None (public) | not in config.toml | 🟡 Unknown | **25** | QUARANTINE |
| **generate-image-preview** | ❌ Downloaded (not tracked) | No repo caller found | None (public) | not in config.toml | 🟡 Unknown | **25** | QUARANTINE |
| **generate-image-final** | ❌ Downloaded (not tracked) | No repo caller found | None (public) | not in config.toml | 🟡 Unknown | **25** | QUARANTINE |
| **resolve-venue** | ❌ Downloaded (not tracked) | No repo caller found | None (public) | not in config.toml | 🟡 Unknown | **30** | QUARANTINE |

---

## Detailed Findings

### 1. `brand-intelligence` — Score: 88/100 ✅ KEEP

**Purpose:** AI-driven brand profile extraction from URLs/crawl data. Core product feature.

**Evidence:**
- 144 deployments, most updated 43m ago
- Verified callers: `app/src/lib/onboarding.ts`, `app/src/mastra/workflows/brand-intelligence-workflow.ts`, `app/src/mastra/tools/brand-intelligence-tools.ts`, 3 API routes (start/resume/approve)
- 3 SQL migrations reference it by name
- Full verify script: `scripts/verify-brand-intelligence.mjs`
- handler.test.ts with 7 Deno tests

**Red flags:** None critical.

**Errors:** Agent log insert failures are non-fatal (`console.warn`). Acceptable.

**Missing controls:**
- No rate limiting on the edge function itself (relies on caller-side limits)
- No payload size limit enforced at handler level (body read is unbounded)

**Critical fixes:** None required.

**Confidence:** 95%

---

### 2. `audit-asset-dna` — Score: 85/100 ✅ KEEP

**Purpose:** AI vision scoring of brand asset images against DNA pillars.

**Evidence:**
- 108 deployments, most updated 43m ago
- Recent logs show 9 successful POST 200s (v97–v108) with 1.5–2.4s execution time
- Called by Cloudinary webhook route at `app/src/app/api/assets/cloudinary/webhook/route.ts:281`
- handler.test.ts with 2 Deno tests
- SSRF protection, Cloudinary host validation, image size limits, response schema validation

**Red flags:**
- Groq DNA path returns 501 (`not_implemented`) — Gemini-only

**Errors:** All logged calls returned 200. No failures in recent log window.

**Missing controls:**
- No rate limiting on expensive Gemini Vision calls
- Asset existence check uses `supabase.from("assets").select("*").eq("id", assetId).single()` — may return partial data depending on RLS

**Critical fixes:** None required.

**Confidence:** 90%

---

### 3. `firecrawl-webhook` — Score: 78/100 🔧 KEEP AFTER FIXES

**Purpose:** Receives Firecrawl signed webhook notifications, upserts crawl pages, rebuilds aggregates, resumes BI workflow.

**Evidence:**
- 124 deployments, most updated 43m ago
- Passes `webhookUrl` constructed in `start-brand-crawl/index.ts:183`
- HMAC-SHA256 signature verification via `verifyFirecrawlSignature`
- Uses `EdgeRuntime.waitUntil` for background processing
- Calls back to `NEXT_PUBLIC_APP_URL/api/workflows/brand-intelligence/resume`

**Red flags:**
- Two attempts to resume BI workflow (lines 272, 321) with different error messages — suggests prior failures
- Agent log insert failures are `console.warn` (non-fatal but silent)

**Missing controls:**
- No unit tests (344 lines, 0 tests)
- No idempotency key on crawl page upserts (relies on brand_crawl_results upsert-by-design)
- No webhook event deduplication
- No timeout on `waitUntil` background work (Deno edge runtime may terminate before completion)

**Critical fixes:** Add handler.test.ts with HMAC verify, page upsert, and resume workflow tests.

**Confidence:** 85%

---

### 4. `start-brand-crawl` — Score: 75/100 🔧 KEEP AFTER FIXES

**Purpose:** JWT-authenticated endpoint to start Firecrawl v2 crawl jobs for brand intelligence.

**Evidence:**
- 125 deployments, most updated 43m ago
- Called from: `app/src/lib/onboarding.ts`, `app/src/mastra/workflows/brand-intelligence-workflow.ts`, `app/src/mastra/tools/brand-intelligence-tools.ts`
- Idempotency key: `onboarding-${brandId}-${sourceUrl}`
- Duplicate detection: reuses existing running/complete/queued crawls

**Red flags:** None critical.

**Missing controls:**
- No unit tests (260 lines, 0 tests)
- No per-brand crawl rate limiting (one user could start crawls for many brands)
- Firecrawl API key check returns 503 (correct behavior but could be more informative)

**Critical fixes:** Add handler.test.ts.

**Confidence:** 85%

---

### 5. `health` — Score: 75/100 🔧 KEEP AFTER FIXES

**Purpose:** Public liveness endpoint for monitoring.

**Evidence:**
- 12 deployments, most updated 24d ago
- Called by `scripts/verify-edge-functions.mjs`
- Minimal: 24 lines, returns `{ status: "ok", function: "health", ts }`
- CORS, method check (GET/POST), try/catch with `safeErrorMessage`

**Red flags:** None.

**Missing controls:**
- No tests
- Returns internal timestamp (minor info leak — acceptable for health endpoint)

**Critical fixes:** None required.

**Confidence:** 95%

---

### 6. `edge-test` — Score: 70/100 🔧 KEEP AFTER FIXES

**Purpose:** Authenticated smoke test endpoint. Replaced legacy `gemini-ping`.

**Evidence:**
- 135 deployments, most updated 43m ago
- Called by `scripts/verify-edge-functions.mjs` only
- JWT required, writes to `ai_agent_logs`

**Red flags:**
- No production caller — only test scripts invoke it

**Missing controls:**
- No tests
- No documented purpose beyond "smoke test" — consider if the verify script could just call `health` with different checks

**Critical fixes:** None required. Consider whether this is still needed given `health` + `verify-edge-functions.mjs` already covers the monitoring space.

**Confidence:** 80%

---

### 7. `capture-lead` — Score: 72/100 🔧 KEEP AFTER FIXES

**Purpose:** Public lead capture from marketing chatbot. Writes to `lead_intake_drafts` via service-role.

**Evidence:**
- 108 deployments, most updated 43m ago
- Called by `app/src/app/api/marketing-lead/route.ts`
- 11 Jest tests via `route.test.ts` cover the integration
- Excellent input validation: payload size (32KB), origin check, email regex, slug allowlist, rate limiting (10/60s), conversation ownership

**Red flags:**
- Uses `createServiceClient()` for all DB writes (bypasses RLS) — acceptable by design per migration comment
- Rate limiting is in-memory (Map) — resets on cold start, not shared across instances

**Missing controls:**
- No Deno unit tests for the function itself
- No structured metadata validation for `leadAnswers` (just `typeof === "object"`)
- No TLS enforcement on webhook/proxy calls
- In-memory rate limiting is per-instance — multi-instance deployments can bypass

**Critical fixes:** Add handler.test.ts with Deno tests.

**Confidence:** 80%

---

### ⚠️ 8–12. LEGACY FUNCTIONS — All Score ≤ 30

These 5 functions were downloaded from live Supabase but have **zero repository tracking**, **zero callers**, **zero tests**, and **zero config.toml entries**.

---

### 8. `generate-event-draft` — Score: 28/100 🟡 QUARANTINE

**Purpose:** AI event draft generation from text/URL/image using Gemini 2.0 Flash.

**Findings:**
- No JWT auth (public endpoint — anyone can trigger Gemini calls)
- `console.log` leaks API key length (line 24) — security anti-pattern
- Uses deprecated `gemini-2.0-flash` model
- Hardcoded event business logic (date inference, ticket tiers)
- CORS from vendored headers (not `_shared/cors.ts`)
- esm.sh supply chain risk for `@google/generative-ai@0.2.1`
- Raw Gemini response text returned directly to caller

**Business need:** None. FashionOS event-era prototype. No callers anywhere in repo or docs except archival mentions.

---

### 9. `generate-media` — Score: 25/100 🟡 QUARANTINE

**Purpose:** Veo 3.1 video generation with start/poll/download actions.

**Findings:**
- No JWT auth (public video generation endpoint — expensive AI compute)
- Uses deprecated `serve` from `std@0.168.0`
- `declare const Deno: any` type hack
- **🔴 CRITICAL:** Line 81 appends `GEMINI_API_KEY` to download URL: `\`${downloadUri}&key=${apiKey}\`` — if any intermediate system logs this URL, the secret leaks
- Download proxy returns raw video binary from Google
- CORS allows PUT and DELETE methods (unnecessary)
- No rate limiting on video generation (costly Veo API calls)
- esm.sh supply chain risk

**Business need:** None. Veo prototype. No callers.

---

### 10. `generate-image-preview` — Score: 25/100 🟡 QUARANTINE

**Purpose:** Image generation via Imagen (gemini-2.5-flash-image) for event previews.

**Findings:**
- No JWT auth (public image generation endpoint)
- Uses deprecated `serve` from `std@0.168.0`
- `declare const Deno: any` type hack
- CORS allows PUT and DELETE
- esm.sh supply chain risk
- Unauthenticated image generation — potential for AI compute abuse
- No rate limiting or payload limits

**Business need:** None. Event image prototype. No callers.

---

### 11. `generate-image-final` — Score: 25/100 🟡 QUARANTINE

**Purpose:** Image upscaling/refinement via Gemini Pro Image.

**Findings:**
- No JWT auth (public endpoint)
- Uses deprecated `serve` from `std@0.168.0`
- `declare const Deno: any` type hack
- Accepts arbitrary base64 images (no size limit — OOM risk)
- CORS allows PUT and DELETE
- esm.sh supply chain risk
- Uses hypothetical model `gemini-3-pro-image-preview` (may not exist)

**Business need:** None. Image refinement prototype. No callers.

---

### 12. `resolve-venue` — Score: 30/100 🟡 QUARANTINE

**Purpose:** Venue search via Gemini with Maps grounding.

**Findings:**
- No JWT auth (public endpoint)
- Uses deprecated `serve` from `std@0.168.0`
- `declare const Deno: any` type hack
- Imports `corsHeaders` from `_shared/cors.ts` (good — only legacy function doing this)
- Uses Gemini 2.5 Flash with Maps grounding + structured output
- esm.sh supply chain risk
- Raw error messages returned to client
- No rate limiting

**Business need:** None. Event venue search prototype. No callers.

---

## Final Decision Groups

```
KEEP (85–100)
  brand-intelligence          — 88 — Core product feature
  audit-asset-dna             — 85 — Active pipeline function

KEEP AFTER FIXES (70–84)
  firecrawl-webhook           — 78 — Needs unit tests
  start-brand-crawl           — 75 — Needs unit tests
  health                      — 75 — Needs unit tests (nice-to-have)
  edge-test                   — 70 — Evaluate if still needed; add tests
  capture-lead                — 72 — Needs unit tests; rate limit hardening

QUARANTINE (0–49)
  generate-event-draft        — 28 — No callers, no auth, no tracking
  generate-media              — 25 — No callers, API key leak risk, no auth
  generate-image-preview      — 25 — No callers, no auth, AI spend risk
  generate-image-final        — 25 — No callers, no auth, OOM risk
  resolve-venue               — 30 — No callers, no auth

RETIRE CANDIDATE
  (none — quarantine first, then retire after approval)

UNKNOWN — MORE EVIDENCE REQUIRED
  (none)
```

---

## 🔴 Critical Fixes — Immediate

### 1. `generate-media` — API key appended to URL (line 81)
The `download` action constructs `${downloadUri}&key=${apiKey}` and logs nothing, but if the download URI is ever captured in an access log, Cloudflare log, or Supabase function log, the `GEMINI_API_KEY` is exposed. **Fix:** Remove or disable the function. Do not deploy code that appends secrets to URLs.

### 2. All 5 legacy functions — Zero auth
They are deployed with `verify_jwt` defaulting to `true` only if config.toml doesn't exist for them. But the Supabase MCP shows them as `verify_jwt: false` for most (generate-media, resolve-venue, generate-image-preview, generate-image-final are `false`). `generate-event-draft` shows `true`. This means 4/5 legacy functions are **publicly accessible** with Gemini API key access. **Fix:** Quarantine immediately — disable or delete.

---

## Overall Production Readiness

**65%** — The 7 maintained functions are solid, but the 5 unmaintained legacy functions represent security and operational risk. The 7 repo-owned functions have good patterns (CORS, JWT, SSRF protection, shared utilities) but lack consistent unit test coverage (only 2/7 have Deno tests).

---

## Remediation Plan (Ordered)

| Step | Action | Risk | Effort |
|------|--------|------|--------|
| 1 | **QUARANTINE** 5 legacy functions: `supabase functions delete` each | Low | 5 min |
| 2 | Re-deploy `generate-event-draft` **only if** verify_jwt=true is confirmed (it was shown as `true` in the `verify_jwt` field) — but given no callers, delete | Low | 5 min |
| 3 | Add Deno tests for `firecrawl-webhook` (HMAC verify, page upsert, resume) | Low | 2-3h |
| 4 | Add Deno tests for `start-brand-crawl` (JWT reject, brand lookup, Firecrawl call) | Low | 1-2h |
| 5 | Add Deno tests for `capture-lead` (validation, rate limiting, claim token) | Low | 2-3h |
| 6 | Add entry to `supabase/config.toml` for any legacy function kept (none recommended) | Low | 1 min |
| 7 | Consider adding per-brand crawl rate limits to `start-brand-crawl` | Low | 1h |
| 8 | Evaluate retirement of `edge-test` in favor of enhanced `health` endpoint | Low | 30m |
| 9 | Update `supabase/functions/_shared/` edge-functions-inventory.md to reflect actual state | Low | 15m |

**Total effort:** ~8-12h

---

## Appendix: Config.toml Missing Entries

The following deployed functions have **no entry** in `supabase/config.toml`:

| Function | Live `verify_jwt` | Config.toml entry |
|---|---|---|
| `generate-event-draft` | `true` | ❌ Missing |
| `generate-media` | `false` | ❌ Missing |
| `resolve-venue` | `false` | ❌ Missing |
| `generate-image-preview` | `false` | ❌ Missing |
| `generate-image-final` | `false` | ❌ Missing |

Adding entries to config.toml would lock the `verify_jwt` setting to the correct value on redeploy. Currently these functions use whatever was set at initial deploy time.

---

## Appendix: Secrets Used

| Secret | Functions |
|---|---|
| `GEMINI_API_KEY` | All 12 functions (directly or via `_shared/gemini.ts`) |
| `SUPABASE_URL` | All functions via `_shared/env.ts` |
| `SUPABASE_SERVICE_ROLE_KEY` | All repo functions via `_shared/env.ts` |
| `FIRECRAWL_API_KEY` | `start-brand-crawl`, `_shared/firecrawl.ts` |
| `FIRECRAWL_WEBHOOK_SECRET` | `firecrawl-webhook` |
| `GROQ_API_KEY` | `brand-intelligence` (via `_shared/llm/groq-client.ts`) |
| `AI_PROVIDER` | `brand-intelligence` (provider selection) |
| `INTERNAL_WEBHOOK_SECRET` | `firecrawl-webhook` (resume BI workflow) |
| `NEXT_PUBLIC_APP_URL` | `firecrawl-webhook` (target URL) |
| `ALLOWED_ORIGINS` | `capture-lead` (optional CORS hardening) |
| `ALLOWED_SERVICE_SLUGS` | `capture-lead` (service allowlist) |

No secret values were captured, copied, or stored. Only names are listed.

---

## Appendix: Caller Map (Production-Critical Paths)

```
User/Chatbot → marketing-lead API route → capture-lead (edge fn) → lead_intake_drafts
Onboarding → onboarding.ts → start-brand-crawl (edge fn) → Firecrawl API → firecrawl-webhook (edge fn) → brand_crawl_results → resume BI workflow → brand-intelligence (edge fn) → brand_scores + ai_profile
Cloudinary upload → Cloudinary webhook → webhook route → audit-asset-dna (edge fn) → assets.dna_status + brand_scores
```

---

**Audit completed 2026-07-18. All 12 functions reviewed.**

---

## Post-audit execution (IPI-667 · 2026-07-18)

All five **QUARANTINE** functions were deleted from `nvdlhrodvevgwdsneplk` (named `functions delete`, no `--prune`).

See `supabase/docs/audit/ipi-667-quarantine-evidence-2026-07-18.md` for probes (HTTP 404 ×5, inventory 7, `supabase:verify-edge` green).

