# Cloudflare Migration Forensic Audit (superseded)

> **Superseded 2026-07-18.** This draft predates PR #468 merge and incorrectly states preview is not deployed.  
> **Use instead:** [`docs/audits/cloudflare-hosting-implementation-audit.md`](../../docs/audits/cloudflare-hosting-implementation-audit.md)  
> **Coordinator summary:** [`j18-cloudflare-audit.md`](j18-cloudflare-audit.md) · **Plan:** [`j18-cloudflare-plan.md`](j18-cloudflare-plan.md)

---

# Cloudflare Migration Forensic Audit (archived draft)

**Date:** 2026-07-18  
**Scope:** 37 tasks across 6 phases (IPI-600 series)  
**Evidence sources:** Linear API, Cloudflare MCP (live account), repo disk, Cloudflare docs  
**Auditor note:** Run-by-run findings against official Cloudflare/OpenNext documentation.

---

## Summary

| Metric | Value |
|---|---|
| **Total tasks** | 37 |
| **Done** | 3 (IPI-606, IPI-490, IPI-468) |
| **In Progress** | 1 (IPI-472) |
| **Backlog / Todo** | 33 |
| **Critical blocker** | IPI-472 (In Progress, SLA breached) |
| **Existing Workers** | `ai-gateway` (prod), `ipi636-webhook-probe` (test) |
| **Hyperdrive** | `ipix-supabase-fresh` (created 2026-07-15) |
| **KV / D1 / R2** | None (R2 not enabled) |
| **ipix-operator** | **Not deployed** |

---

## Phase 1 — Next.js Hosting on Cloudflare

### IPI-606 · CF-SEC-010 — Infisical Secrets
- **Status:** ✅ Done (2026-07-18, PR #456)
- **Evidence:** Attached to PR #456. Linear state history shows clean progression: Backlog → Todo → In Progress → Done.
- **Verdict:** **Confirmed.**
- **Note:** No live audit of whether `wrangler secret` sync actually ran — secret values not inspectable via MCP. Documented as "manual `wrangler secret put` in CI step" per AC.

### IPI-490 · CF-MIG-210 — Bundle Size Gate
- **Status:** ✅ Done (2026-07-16, PR #410)
- **Evidence:** PR #410 merged. Git gzip after trim: **8.223 MiB** (under 9.0 MiB fail gate).
- **Verdict:** **Confirmed.** Baseline + final gzip recorded, contributors proven from generated bundle.
- **Risk:** Single-run gzip measurement — needs second clean baseline confirmation before IPI-472 upload.

### IPI-472 · INFRA-001 — OpenNext CI and Deployment Pipeline
- **Status:** 🔄 In Progress (PR #455, SLA breached)
- **Evidence:** CI file at `.github/workflows/ci.yml` shows `next build` only — no `opennextjs-cloudflare build` step. No `NEXT_PUBLIC_SUPABASE_*` wired for CI build vars.
- **Findings:**
  - PR #455 exists but hasn't merged
  - SLA breached (SLA started 2026-07-07, SLA breach at 2026-07-08)
  - History shows it went Done → back to In Progress (reopened 2026-07-14)
  - CI still missing OpenNext build and preview upload
- **Verdict:** **Confirmed blockers remain.** CI pipeline is the critical path bottleneck holding up IPI-632, IPI-627, IPI-510, and the entire Phase 1.

### IPI-632 · CF-MIG-220 — Preview Smoke Validation
- **Status:** 🔴 Backlog (blocked by IPI-472)
- **Evidence:** No `ipix-operator` Worker exists in the account (verified via MCP — 404 on get_worker_code).
- **Verdict:** **Correctly blocked.** Cannot proceed until IPI-472 uploads the first preview.

### IPI-627 · CF-SEC-020 — Deployment Security Proof
- **Status:** 🔴 Backlog (blocked by IPI-632)
- **Evidence:** No preview URL exists to test against. Rate limiting, headers, secret audit all depend on live Worker.
- **Verdict:** **Correctly blocked.**

### IPI-510 · CF-UJ-011 — AI Health / Continuous Validation
- **Status:** 🔴 Backlog
- **Evidence:** No health route documented or wired. CI does not include any AI health probe.
- **Verdict:** **Correctly deferred** until IPI-472 provides a deployed Worker.

### IPI-631 · CF-MIG-810 — Production DNS Cutover
- **Status:** 🔴 Backlog (blocked by IPI-609, IPI-632, IPI-627, IPI-586, IPI-623)
- **Evidence:** No production Worker, no custom domain configured.
- **Verdict:** **Correctly parked.** Final production gate — far from ready.

---

## Phase 2 — Production Journey Validation

**All 11 tasks (IPI-500 through IPI-511):** 🔴 Backlog

- IPI-500 (parent test suite): No journey test scripts found on disk
- IPI-502 (Brand Intelligence): Not started
- IPI-504 (Shoot Planning): Not started
- **Verdict:** These are correctly deferred until Phase 1 completes. The plan treats IPI-502 and IPI-504 as the most important journeys for first production cutover.

---

## Phase 3 — Mastra Persistence & Hyperdrive

### Hyperdrive Already Configured (Ahead of Plan)
- `ipix-supabase-fresh` config exists (created 2026-07-15, modified 2026-07-16)
- Points to `db.nvdlhrodvevgwdsneplk.supabase.co:5432`, user `hyperdrive_mastra_runtime`
- Caching disabled
- **Verdict:** **IPI-619 is partially done.** The Hyperdrive binding exists before the formal Phase 3 tasks have started. Verifying the connection works is outstanding.

### All 8 Phase 3 tasks
| Task | Status | Notes |
|---|---|---|
| IPI-616 · CF-DB-001 (Storage ADR) | 🔴 Backlog | Schema decision not made |
| IPI-619 · CF-DB-005 (Hyperdrive Binding) | 🟡 Partially done | Config exists, not wired to OpenNext |
| IPI-620 · CF-DB-006 (Query Helper) | 🔴 Backlog | |
| IPI-621 · CF-DB-007 (RLS Tests) | 🔴 Backlog | |
| IPI-622 · CF-DB-008 (Benchmark) | 🔴 Backlog | |
| IPI-624 · CF-DB-010 (Monitoring) | 🔴 Backlog | |
| IPI-623 · CF-DB-009 (Mastra Canary) | 🔴 Backlog | |
| IPI-626 · SUPA-CLEANUP (Client Cleanup) | 🔴 Backlog | |

- **Finding:** Hyperdrive was configured ahead of plan (potentially from a prior spike), but not yet linked to the OpenNext Worker.
- **Recommendation:** Either fast-track IPI-619 (it's partially done) or document the existing Hyperdrive binding in the task's AC so work isn't duplicated.

---

## Phase 4 — Cloudflare-Native AI Routing

### ai-gateway Worker Already Deployed (Ahead of Plan)
- Full provider stack: Workers AI, Gemini, Bedrock
- Provider failover with `default-fallback` to Bedrock
- Embedding support (Workers AI `@cf/baai/bge-base-en-v1.5`, Gemini)
- Model registry with tiered routing (fast, structured, vision, embedding)
- **Verdict:** This Worker was deployed before the formal Phase 4. IPI-594 (Migrate Mastra to Cloudflare-native routing) can leverage this existing infrastructure.

### Phase 4 tasks
| Task | Status | Notes |
|---|---|---|
| IPI-586 · CF-AI-003 (Workers AI smoke) | 🟡 Todo | Was In Progress, moved back. Needs AI binding in wrangler.jsonc + smoke route |
| IPI-458 · CF-AI-007 (NVIDIA NIM) | 🔴 Backlog | Not started |
| IPI-462 · CF-AI-006 (Provider Eval) | 🔴 Backlog | Not started |
| IPI-463 · CF-AI-008 (Failover) | 🟢 Partially done | ai-gateway Worker already has failover logic |
| IPI-460 · CF-AI-010 (Cost tracking) | 🔴 Backlog | Not started |
| IPI-594 · CF-MIG-230 (Migrate Mastra) | 🔴 Backlog | Not started |

- **Finding:** The `ai-gateway` Worker already implements IPI-463's provider failover. The task description should be updated to acknowledge this existing implementation.
- **Recommendation:** Verify IPI-463 AC against the deployed ai-gateway Worker and mark what's done vs what's outstanding.

---

## Phase 5 — Supabase Edge & Cloudflare Canary

**All 6 tasks:** 🔴 Backlog

| Task | Status |
|---|---|
| IPI-694 · CF-EDGE-AI (Route Edge LLM) | 🔴 Backlog |
| IPI-697 · CF-EDGE-003 (Gateway Client + BI) | 🔴 Backlog |
| IPI-455 · CF-EDGE-B (Port BI Handler) | 🔴 Backlog |
| IPI-699 · CF-EDGE-005 (Secrets & Canary) | 🔴 Backlog |
| IPI-698 · CF-EDGE-004 (DNA Vision) | 🔴 Backlog |
| IPI-456 · Migrate DNA Scoring | 🔴 Backlog |

- **Verdict:** Correctly deferred. These require Phase 1+4 to be stable first.

---

## Phase 6 — Soak & Legacy Retirement

**All 3 tasks:** 🔴 Backlog

| Task | Status |
|---|---|
| IPI-609 · CF-MIG-230 (Soak Gate) | 🔴 Backlog |
| IPI-631 · CF-MIG-810 (DNS Cutover) | 🔴 Backlog |
| IPI-592 · CF-MIG-820 (Delete ai-gateway) | 🔴 Backlog |

- **Note:** IPI-592 plans to delete the `ai-gateway` Worker. This must NOT proceed until IPI-594 (Mastra migration to native routing) is complete.

---

## Existing Infrastructure Audit (Live Account)

| Resource | Status | Details |
|---|---|---|
| **Workers** | 2 deployed | `ai-gateway` (prod), `ipi636-webhook-probe` (test) |
| **ipix-operator** | **Not deployed** | 404 on get_worker_code — expected, blocked by IPI-472 |
| **KV** | 0 | None created |
| **D1** | 0 | None created |
| **R2** | Not enabled | 403 error — must be enabled in Dashboard |
| **Hyperdrive** | 1 config | `ipix-supabase-fresh`, Supabase + `hyperdrive_mastra_runtime` user |
| **Observability** | Configured | Enabled in app/wrangler.jsonc |

---

## CI/CD Pipeline Audit

| Requirement | Status | Evidence |
|---|---|---|
| `opennextjs-cloudflare build` in CI | 🔴 Missing | CI only runs `next build` |
| `NEXT_PUBLIC_SUPABASE_*` for build | 🔴 Not wired | Not in CI env vars |
| Bundle dry-run gate | 🟢 Exists in app scripts | `npm run upload` / `npm run deploy` |
| Version ID capture | 🔴 Not done | Depends on first upload |
| Rollback runbook | 🔴 Not documented | |
| Workers Builds duplicate path | 🟡 Avoid | Plan explicitly says no separate Workers Builds path |

---

## Architecture Alignment Verification

### OpenNext Compatibility
- `@opennextjs/cloudflare` ^1.20.1 installed
- `open-next.config.ts` is minimal (empty `defineCloudflareConfig({})`)
- Wrangler config uses `.open-next/worker.js` as main entry — matches OpenNext output convention
- **Verdict:** Config is skeleton. Needs R2 incremental cache config and potentially WASM support flags.

### Wrangler Config (`wrangler.jsonc`)
- `nodejs_compat` flag set ✅ (required for OpenNext + Mastra)
- `observability.enabled: true` ✅
- `images` binding set ✅
- `services` self-reference binding set ✅
- `@ast-grep/napi` alias stubs ✅ (required for Mastra bundle compatibility)
- **Missing:** AI binding (needed by IPI-586), Hyperdrive binding (needed by IPI-619), rate limiting binding (needed by IPI-627)

### .dev.vars.example
- **Missing** — cannot verify local development secrets contract
- **Risk:** Developers must reverse-engineer required env vars from code

---

## Documentation Completeness

| Asset | Status |
|---|---|
| `01-cloudflare-hosting.md` | ✅ Complete — 37 tasks across 6 phases with dependency chains |
| `02-links.md` | ✅ Complete — all official doc URLs catalogued |
| `03-prompt.md` | ✅ Complete — 17-step forensic audit structure |
| `04-plan-hosting.md` | 🔴 **Empty** — no hosting plan detail |
| `.dev.vars.example` | 🔴 **Missing** — no local dev secrets template |

---

## Key Risks

1. **IPI-472 is the critical bottleneck.** Everything in Phase 1 (IPI-632, IPI-627, IPI-510) and downstream depends on it. SLA already breached.
2. **`04-plan-hosting.md` is empty.** The hosting plan — intended to be the central execution guide — has no content.
3. **`.dev.vars.example` missing.** New developers cannot easily set up local development without reverse-engineering env vars from code.
4. **R2 not enabled.** If the plan requires R2 for OpenNext incremental cache (common pattern), it must be enabled in the Cloudflare Dashboard.
5. **ai-gateway Worker has no redundancy.** A single Worker routing all AI calls — no HA configuration.
6. **IPI-592 risk.** Plan to delete `ai-gateway` Worker must not happen before Mastra is fully migrated to native routing (IPI-594).

---

## Recommendations

1. **Unblock IPI-472 first.** Merge PR #455, wire OpenNext build + `NEXT_PUBLIC_SUPABASE_*` in CI, then do the first `wrangler versions upload`.
2. **Fill `04-plan-hosting.md`** with the hosting architecture, environment topology, and deployment workflow.
3. **Create `.dev.vars.example`** from the env vars used in wrangler.jsonc and the actual runtime code.
4. **Enable R2** in the Cloudflare Dashboard if the plan intends to use it for incremental cache.
5. **Update IPI-619 AC** to reflect that the Hyperdrive config already exists — scope the remaining work (wiring it to OpenNext Worker).
6. **Update IPI-463 AC** to acknowledge the ai-gateway Worker already has failover logic — scope what's left.
7. **Move IPI-586 forward.** The AI binding in wrangler.jsonc and a smoke route are well-defined, small-scope tasks that can run in parallel with IPI-472.
8. **Consider enabling R2** for static asset delivery optimization (Cloudflare Images binding is configured but R2 offers complementary benefits).
