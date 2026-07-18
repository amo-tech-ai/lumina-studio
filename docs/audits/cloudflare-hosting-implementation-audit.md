# Cloudflare Workers Implementation & Hosting Audit

**Date:** 2026-07-18  
**Auditor:** Evidence-based forensic audit (repo + GitHub + Linear + bootstrap logs)  
**Repository:** `amo-tech-ai/lumina-studio`  
**Local branch / commit:** `docs/remove-universal-design-prompt-new` · `1f252bed`  
**Deployed preview commit:** `84ea702` (main, bootstrap run #29648772820)  
**Companion docs:** [`tasks/cloudflare/prime/j18-cloudflare-audit.md`](../../tasks/cloudflare/prime/j18-cloudflare-audit.md) · [`tasks/cloudflare/prime/j18-cloudflare-plan.md`](../../tasks/cloudflare/prime/j18-cloudflare-plan.md)

---

## Executive Summary

| Metric | Score |
|--------|------:|
| **Overall implementation completion** | **68%** |
| **Protected-preview readiness** | **62%** |
| **Production-cutover readiness** | **22%** |
| **Confidence level** | **78%** (architecture sound; operational proof gaps) |

| Baseline | Verified value |
|----------|----------------|
| **Preview Worker** | `ipix-operator-preview` — deployed |
| **Worker version ID** | `a3fd7130-6d63-41df-ae3b-e2d29da34816` |
| **Deployed commit SHA** | `84ea702ec5f719195589c5d916d6fa4bca54c4ba` |
| **Gzip upload size** | **8,454.18 KiB** (~8.26 MiB) |
| **Uncompressed size** | 42,470.78 KiB (~41.5 MiB) |
| **Remote `startup_time_ms`** | **Not captured** (bootstrap WARN) |
| **Preview URL in CI** | **Empty** (not parsed from wrangler output) |
| **Next.js** | 16.2.10 |
| **OpenNext** | @opennextjs/cloudflare 1.20.1 |
| **Wrangler** | 4.110.0 (lockfile) / 4.107.1 (package.json range) |
| **Node** | >=22 (`app/.nvmrc`) |

**Most important blocker:** No remote IPI-632 smoke evidence — preview Worker exists but auth, SSE, CopilotKit, and agent turns are unproven on `*.workers.dev`.

**Final verdict:** 🟡 **Conditionally ready for protected preview** after IPI-606 closeout + IPI-632. **Not production-ready.**

---

## Step 1 — Current Baseline

### Repository configuration (verified on disk)

| File | Status | Notes |
|------|--------|-------|
| `app/wrangler.jsonc` | ✅ | OpenNext entry `.open-next/worker.js`; preview/production envs; `secrets.required`; alias stubs |
| `app/open-next.config.ts` | ✅ | Minimal `defineCloudflareConfig({})` |
| `app/package.json` | ✅ | `build:cf`, `upload`, `deploy`, `cf-typegen`, bundle gate |
| `.github/workflows/ci.yml` | ✅ | `build:cf` on every PR with placeholder `NEXT_PUBLIC_*` |
| `.github/workflows/cloudflare-secrets-sync.yml` | ✅ | Manual bootstrap; GitHub environments; `--secrets-file` |
| `app/scripts/upload-opennext-with-secrets.mjs` | ✅ | Allowlist + greenfield deploy fallback |
| `app/scripts/check-worker-bundle-size.mjs` | ✅ | 8.5 warn / 9.0 fail MiB; default env only |
| `app/scripts/cloudflare-secret-allowlist.mjs` | ✅ | Three-path classification |

### Live Cloudflare state (bootstrap evidence)

| Resource | Status | Evidence |
|----------|--------|----------|
| `ipix-operator-preview` | 🟢 Deployed | GH run `29648772820` success 2026-07-18T14:52:04Z |
| `ipix-operator` (production) | 🔴 Not deployed | No production bootstrap run found |
| `ai-gateway` | 🟢 Legacy prod Worker | Pre-migration; do not delete before IPI-609 |
| `ipi636-webhook-probe` | 🟢 Test Worker | Unrelated probe |
| Hyperdrive `ipix-supabase-fresh` | 🟡 Exists | Not bound in `wrangler.jsonc` |
| AI binding | 🔴 Missing | Required for IPI-586 |
| Rate limit binding | 🔴 Missing | Required for IPI-627 |

### Bootstrap run #29648772820 (authoritative deploy evidence)

```
Commit:           84ea702 (main)
Worker version:   a3fd7130-6d63-41df-ae3b-e2d29da34816
Total Upload:     42470.78 KiB / gzip: 8454.18 KiB
startup_time_ms:  NOT PARSED — "WARN (local profiling only): startup ms not parsed"
preview_url:      EMPTY in workflow summary
```

---

## Step 2 — Linear Task Identity Reconciliation

### ID collisions corrected (live Linear 2026-07-18)

| Ambiguous label | Canonical Linear identity |
|-----------------|---------------------------|
| `CF-MIG-230` (migration) | **IPI-594 · CF-MIG-230 — Migrate Mastra Agents to Cloudflare-Native AI Routing** |
| `CF-MIG-230` (soak gate) | **IPI-609 · CF-MIG-230-SOAK — Zero-Legacy-Traffic Audit and Production Soak Gate** |
| IPI-456 (DNA scoring) | **IPI-456 · CF-DNA — superseded** → Duplicate of **IPI-698 · CF-EDGE-004** (Canceled/Duplicate) |
| IPI-TBD env inventory | **IPI-710 · CF-ENV-001** (created in Linear) |
| IPI-TBD bundle reduction | **IPI-706 · CF-BUNDLE-220** |
| IPI-TBD deploy ownership | **IPI-712 · CF-DEPLOY-030** |
| IPI-TBD smoke automation | **IPI-707 · CF-SMOKE-001** |
| IPI-TBD deploy provenance | **IPI-705 · CF-PERF-001** |

### Stale documents requiring update

| Document | Problem |
|----------|---------|
| `tasks/cloudflare/prime/cloudflare-migration-audit.md` | States `ipix-operator` not deployed — **superseded**; preview IS deployed |
| `docs/audits/cloudflare-migration-audit.md` evidence index | Lists IPI-606 Done / IPI-632 Backlog — Linear now shows IPI-606 **In Progress**, IPI-632 **Todo** |

---

## Step 3 — Progress Tracker

| Status | Task | Purpose | Impl. | Prod Ready | Conf. | Blockers | Evidence | Next Action |
| ------ | ---- | ------- | ----: | ---------: | ----: | -------- | -------- | ----------- |
| 🟡 | **IPI-606 · CF-SEC-010 — Connect Infisical Secrets to Cloudflare Deployment** | Secrets + vars three-path contract | 82% | 70% | 85% | PR #475 open; GitHub env vars unverified; orphan secrets | #468/#471 merged; bootstrap workflow; allowlist scripts | Merge #475; set GitHub Environment vars; orphan secret diff |
| 🟢 | **IPI-472 · INFRA-001 — OpenNext CI and Deployment Pipeline** | CI + first preview upload | 91% | 75% | 92% | No auto-deploy; no WRANGLER_OUTPUT_FILE_PATH | CI `build:cf`; bootstrap success; version `a3fd7130…` | CF-PERF-001 for provenance |
| 🔴 | **IPI-632 · CF-MIG-220 — Protected Preview Runtime Smoke Validation** | Remote auth/SSE/agent proof | 15% | 10% | 80% | No remote evidence | Local smoke only; Worker deployed | Run manual smoke; commit evidence JSON |
| ⚪ | **IPI-627 · CF-SEC-020 — Deployment Security Proof** | Live security proof | 5% | 0% | 75% | Blocked by IPI-632 | wrangler observability enabled | After IPI-632 |
| ⚪ | **IPI-510 · CF-UJ-011 — Journey Test: AI Health, Readiness and Continuous Validation** | Continuous AI health | 10% | 0% | 70% | No health route on preview | Backlog in Linear | After IPI-632 |
| ⚪ | **IPI-502 · CF-UJ-002 — Journey Test: AI Brand Intelligence** | Brand Intelligence on CF | 5% | 0% | 65% | No remote journey | Edge path separate (IPI-694+) | After preview stable |
| ⚪ | **IPI-504 · CF-UJ-004 — Journey Test: Shoot Planning Workflow** | Shoot planning on CF | 5% | 0% | 65% | Local Playwright only | CI shoot-wizard e2e on Vercel path | After preview stable |
| ⚪ | **IPI-631 · CF-MIG-810 — Production DNS Cutover and Rollback** | DNS cutover | 5% | 0% | 60% | Many blockers | Backlog; no prod Worker | Do not start |
| 🟡 | **IPI-710 · CF-ENV-001 — Generate Authoritative Cloudflare Environment Inventory** | SSOT env inventory | 0% | 0% | 90% | Manual allowlists today | Linear created IPI-710 | Implement after IPI-606 |
| 🟡 | **IPI-706 · CF-BUNDLE-220 — Reduce OpenNext Worker Bundle and Preserve Headroom** | Bundle ≤7.5 MiB | 20% | 15% | 88% | 8.26 MiB today; ~1.7 MiB headroom | Bootstrap gzip 8454 KiB | Trim Sentry/Mermaid/Mastra before Service Binding split |
| 🟡 | **IPI-712 · CF-DEPLOY-030 — Enforce Preview and Production Config Ownership in CI** | CI config ownership | 30% | 25% | 85% | PR #475 pending | wrangler SSOT pattern in repo | Merge #475 |
| 🟡 | **IPI-616 · CF-DB-001 — Mastra Storage and Schema ADR** | Storage ADR | 0% | 0% | 85% | Hyperdrive exists ahead of ADR | IPI-617/618 Done per Linear | Write ADR before IPI-619 |
| ⚪ | **IPI-619 · CF-DB-005 — Add Initial Supabase Hyperdrive Binding to OpenNext Worker** | Hyperdrive binding | 25% | 0% | 80% | Config exists; not in wrangler | Dashboard Hyperdrive config | After IPI-616 |
| ⚪ | **IPI-620 · CF-DB-006 — Hyperdrive Query Helper and PostgresStore Integration** | Query helper | 0% | 0% | 75% | IPI-619 | Backlog | Phase 4 post-preview |
| ⚪ | **IPI-621 · CF-DB-007 — Tenant Authorization and RLS Tests** | RLS on Hyperdrive | 0% | 0% | 80% | IPI-620 | Existing verify-rls CI | Phase 4 |
| ⚪ | **IPI-624 · CF-DB-010 — Configure Hyperdrive Monitoring and Connection Controls** | Hyperdrive ops | 0% | 0% | 75% | IPI-623 | Backlog | Phase 4 |
| ⚪ | **IPI-623 · CF-DB-009 — Migrate One Mastra Workload to Hyperdrive** | Canary workload | 0% | 0% | 75% | Full Phase 4 chain | Backlog | Post-preview |
| ⚪ | **IPI-586 · CF-AI-003 — Wire One Workers AI Call Through ipix-prod Gateway** | Workers AI smoke | 0% | 0% | 85% | Blocked by IPI-632 | Todo in Linear | After IPI-632 |
| ⚪ | **IPI-458 · CF-AI-007 — NVIDIA NIM Evaluation** | NIM eval | 0% | 0% | 50% | Post-launch | Backlog | Defer |
| ⚪ | **IPI-462 · CF-AI-006 — AI Provider Evaluation Suite** | Provider eval | 0% | 0% | 55% | Post-launch | Backlog | Defer |
| 🟡 | **IPI-463 · CF-AI-008 — AI Provider Failover and Rollback** | Failover | 60% | 40% | 75% | AC may not reflect live ai-gateway | ai-gateway Worker deployed | Reconcile AC vs live Worker |
| ⚪ | **IPI-460 · CF-AI-010 — AI Cost Tracking and Observability** | Cost tracking | 0% | 0% | 50% | Post-launch | Backlog | Defer |
| ⚪ | **IPI-594 · CF-MIG-230 — Migrate Mastra Agents to Cloudflare-Native AI Routing** | Native AI routing | 0% | 0% | 70% | Blocked by IPI-586 | Backlog; waves documented | Do not start before IPI-586 |
| ⚪ | **IPI-694 · CF-EDGE-AI — Route Supabase Edge LLM Through Cloudflare AI Gateway** | Edge LLM via Gateway REST | 0% | 0% | 80% | Not hosting blocker | Todo; corrected 2026-07-18 | Parallel track post-preview |
| ⚪ | **IPI-697 · CF-EDGE-003 — Add Cloudflare AI Gateway REST Client and Wire Brand Intelligence** | BI Edge client | 0% | 0% | 80% | Child of IPI-694 | Todo | After IPI-695 ADR |
| ⚪ | **IPI-699 · CF-EDGE-005 — Edge Secrets, Cloudflare Canary and Rollback** | Edge canary ops | 0% | 0% | 85% | Blocked by IPI-697 | Todo | Ops-only after code PR |
| ⚪ | **IPI-455 · CF-EDGE-B — Phase B: Port Brand-Intelligence Handler to Cloudflare Worker** | Full BI Worker port | 0% | 0% | 50% | Parked; cancel-gate IPI-699 | Backlog | Phase 5 only |
| ⚪ | **IPI-698 · CF-EDGE-004 — DNA Vision Evaluation After BI Canary** | DNA vision eval | 0% | 0% | 50% | Supersedes IPI-456 | Parked | After IPI-699 |
| ⚪ | **IPI-609 · CF-MIG-230-SOAK — Zero-Legacy-Traffic Audit and Production Soak Gate** | Soak before legacy delete | 0% | 0% | 80% | Blocked by IPI-594 | Backlog | Post-launch |
| ⚪ | **IPI-592 · CF-MIG-820 — Delete Custom AI Gateway Worker** | Delete legacy gateway | 0% | 0% | 70% | Must not run before IPI-609 | ai-gateway live | Do not start |

**Foundation tasks (verified complete):**

| Status | Task | Evidence |
| ------ | ---- | -------- |
| 🟢 | **IPI-468 · SEC-001 — Fail-Closed Operator Authentication** | `OPERATOR_AUTH_ENABLED=true` in wrangler |
| 🟢 | **IPI-490 · CF-MIG-210 — Enforce Cloudflare Worker Bundle Size Gate** | CI gate; 8454 KiB gzip passes 9.0 fail |
| 🟢 | **IPI-633 · CF-DB-011 — Restore Worker-Safe Mastra Noop Storage** | noop mode + pg stubs |

---

## Step 4 — Per-Task Review Highlights

### Phase 1 — Protected Preview (critical path)

#### 1. IPI-606 · CF-SEC-010

| Stage | Finding |
|-------|---------|
| **Examine** | Allowlist module, upload script, bootstrap workflow, Infisical OIDC validation — merged in #468/#471 |
| **Verify** | `--secrets-file` matches [Cloudflare secrets docs](https://developers.cloudflare.com/workers/configuration/secrets/) |
| **Validate** | Bootstrap succeeded; PR [#475](https://github.com/amo-tech-ai/lumina-studio/pull/475) open (CI green); Linear **In Progress** (SLA breached) |
| **Measure** | Impl 82% · Prod 70% · Conf 85% |
| **Identify** | GitHub Environment **variables** for `INTELLIGENCE_*` not verified in audit; orphan secrets possible |
| **Improve** | Merge #475; use GitHub env vars → `--var`; `wrangler secret list` diff |

#### 2. IPI-472 · INFRA-001

| Stage | Finding |
|-------|---------|
| **Examine** | `build:cf` in CI; manual bootstrap workflow; first preview upload complete |
| **Verify** | Matches [OpenNext Cloudflare](https://opennext.js.org/cloudflare/get-started) + [versions upload](https://developers.cloudflare.com/workers/versions-and-deployments/) |
| **Validate** | Linear **Done**; version `a3fd7130…`; commit `84ea702` |
| **Measure** | Impl 91% · Prod 75% · Conf 92% |
| **Identify** | `startup_time_ms` not captured; preview URL empty; greenfield deploy/upload dual path |
| **Improve** | `WRANGLER_OUTPUT_FILE_PATH` (IPI-705); consolidate to versions workflow after greenfield |

#### 3. IPI-632 · CF-MIG-220

| Stage | Finding |
|-------|---------|
| **Examine** | No `tasks/cloudflare/tests/ipi-632-preview-smoke/` remote evidence on disk |
| **Verify** | Checklist in Linear + `tasks/cloudflare/tests/worker-user-journeys.md` |
| **Validate** | **No evidence found** for remote SSE/auth/agent — **cannot mark complete** |
| **Measure** | Impl 15% · Prod 10% · Conf 80% |
| **Identify** | HTML-200-only would be false pass; Supabase OAuth for `*.workers.dev` may need allowlist |
| **Improve** | Manual smoke first → IPI-707 Playwright automation |

---

## Step 5 — Custom Code Evaluation

| Script | Problem | Wrangler/OpenNext? | Tested | Secret-safe | Recommendation |
|--------|---------|-------------------|--------|-------------|----------------|
| `upload-opennext-with-secrets.mjs` | Orchestrate upload + `--secrets-file` + greenfield fallback | Partial — OpenNext passthrough exists | Yes (allowlist tests) | Yes (redaction) | **Keep** — adds pairing validation + version ID parse |
| `cloudflare-secret-allowlist.mjs` | Classify build/runtime/CI secrets | No — app-specific | Yes | Names only | **Keep** until IPI-710 generates from inventory |
| `check-worker-bundle-size.mjs` | Gzip gate | `wrangler deploy --dry-run` native | CI integrated | N/A | **Keep**; extend dual-env + metafile (IPI-706) |
| `sync-wrangler-secrets-from-infisical.mjs` | Secure temp file + redaction | Wrangler `--secrets-file` | Partial | Yes | **Keep** |
| Bootstrap workflow sed parsing | Extract version_id | `WRANGLER_OUTPUT_FILE_PATH` official | Fragile (preview_url empty) | N/A | **Replace** with IPI-705 |

---

## Step 6 — Project Scores

### Weighted implementation completion: **68%**

| Area | Weight | Completion |
|------|-------:|-----------:|
| Protected preview hosting | 25% | 67% |
| Production readiness | 25% | 22% |
| Journey validation | 15% | 8% |
| Security & observability | 10% | 55% |
| Bundle & environment controls | 10% | 40% |
| Hyperdrive & persistence | 5% | 15% |
| Cloudflare-native AI | 5% | 12% |
| Edge migration & cleanup | 5% | 5% |

### Production readiness (production-critical only): **22%**

Counted: deployment (preview only), secrets (partial), authentication (local), smoke (missing), journeys (missing), security proof (missing), observability (partial), rollback (untested), DNS (not started), soak (not started).

Preview readiness is **not** lowered by deferred Hyperdrive/AI work per audit rules.

---

## Critical Blockers

### Blocks protected preview

1. **IPI-632 remote smoke not executed** — no SSE/auth/agent evidence on live Worker
2. **IPI-606 not closed** — PR #475 open; GitHub Environment vars for `INTELLIGENCE_*` unverified
3. **Possible orphan secrets** on preview from prior classification — needs `wrangler secret list` diff

### Blocks production DNS cutover

4. **Production Worker not deployed** (`ipix-operator`)
5. **IPI-627, IPI-510, IPI-502, IPI-504** — all backlog
6. **IPI-708 rollback rehearsal** — not done
7. **IPI-609 soak gate** — blocks IPI-592 legacy deletion and is listed blocker on IPI-631

### Post-launch (do not block first preview)

- Hyperdrive chain (IPI-616–624)
- Native AI routing (IPI-586 → IPI-594)
- Edge migration (IPI-694–699)
- Bundle headroom (IPI-706) — deploy works today but tight

---

## High-Priority Fixes (ranked)

1. **Security:** Merge PR #475; verify GitHub Environment variable ownership; orphan secret cleanup
2. **Deployment failure risk:** Capture `startup_time_ms` + preview URL via `WRANGLER_OUTPUT_FILE_PATH` (IPI-705)
3. **Authentication risk:** Run IPI-632 with Supabase redirect allowlist for preview URL
4. **User-facing failure:** Remote CopilotKit SSE smoke — highest unknown
5. **Operational complexity:** Automate smoke (IPI-707) after first manual pass
6. **Cost/optimization:** IPI-706 bundle reduction before production bootstrap

---

## Missing Tasks

All proposed tasks now exist in Linear (created 2026-07-18):

| Linear | Task |
|--------|------|
| IPI-710 | CF-ENV-001 — Authoritative env inventory |
| IPI-706 | CF-BUNDLE-220 — Bundle reduction |
| IPI-712 | CF-DEPLOY-030 — Config ownership in CI |
| IPI-707 | CF-SMOKE-001 — Playwright smoke |
| IPI-705 | CF-PERF-001 — Deploy provenance |
| IPI-708 | CF-ROLLBACK-001 — Rollback rehearsal |
| IPI-709 | CF-OBS-001 — Observability baseline |

**Conditional (if Supabase OAuth blocks preview login):** CF-OAUTH-001 — OAuth callback allowlist for `*.workers.dev`

---

## Simplification Opportunities

| Current | Official replacement | Benefit | Risk | Recommendation |
|---------|---------------------|---------|------|----------------|
| Manual version_id sed parse | `WRANGLER_OUTPUT_FILE_PATH` NDJSON | Reliable provenance | Low | **Adopt** (IPI-705) |
| workflow_dispatch-only bootstrap | [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/) | Auto deploy on main | Medium — secrets model | Evaluate after preview proven |
| Single-env bundle gate | `wrangler deploy --dry-run --env preview\|production --metafile` | Catch env drift | Low | **Adopt** (IPI-706) |
| Manual IPI-632 smoke | Playwright + [version overrides](https://developers.cloudflare.com/workers/versions-and-deployments/version-overrides/) | Regression safety | Medium — secrets in CI | **Adopt** (IPI-707) |
| Triple allowlist files | Generated from IPI-710 inventory | Less drift | Low | **Adopt** after IPI-606 |
| Custom ai-gateway Worker | Native `env.AI` + AI Gateway binding | Less ops | High until IPI-609 | **Defer** deletion |

---

## Recommended Execution Order

### Minimum path to protected preview

```text
1. Configure GitHub Environment variables on `preview`
   (INTELLIGENCE_API_URL, INTELLIGENCE_GATEWAY_WS_URL)
2. IPI-606 · CF-SEC-010 — Merge PR #475 + orphan secret diff
3. Re-bootstrap preview (cloudflare-secrets-sync.yml, dry_run=false)
4. IPI-632 · CF-MIG-220 — Protected Preview Runtime Smoke Validation
5. IPI-705 · CF-PERF-001 — Capture version_id, gzip, startup_time_ms (parallel)
```

### Minimum path to production cutover

```text
IPI-632
→ IPI-627 · CF-SEC-020 — Deployment Security Proof
→ IPI-510 · CF-UJ-011 — AI Health / Readiness
→ IPI-502 · CF-UJ-002 — Brand Intelligence journey
→ IPI-504 · CF-UJ-004 — Shoot Planning journey
→ IPI-708 · CF-ROLLBACK-001 — Rollback rehearsal
→ Production bootstrap (ipix-operator)
→ IPI-709 · CF-OBS-001 — Observability baseline
→ IPI-631 · CF-MIG-810 — Production DNS Cutover
```

### Post-launch platform work

```text
Hyperdrive:  IPI-616 → IPI-619 → IPI-620 → IPI-621 → IPI-623 → IPI-624
Native AI:   IPI-586 → IPI-594 (waves) → IPI-591 verification
Edge:        IPI-694 → IPI-697 → IPI-699 → IPI-698
Retirement:  IPI-609 (soak) → IPI-592 (delete ai-gateway)
Optimization: IPI-706 · CF-BUNDLE-220 (can start in parallel after preview)
```

---

## Final Verdict

| Question | Answer |
|----------|--------|
| **Will protected preview succeed?** | **Yes, conditionally (~85%)** after IPI-606 closeout + IPI-632 smoke |
| **Will the migration succeed?** | **Yes (~65%)** if journey tests and rollback are completed before DNS |
| **Is the project production-ready?** | **No** — 22% production readiness |
| **Next task?** | **IPI-606** — merge PR #475, configure GitHub env vars |
| **What must not start yet?** | IPI-631 DNS cutover; IPI-592 ai-gateway deletion; IPI-594 before IPI-586 |
| **What can simplify immediately?** | IPI-705 (`WRANGLER_OUTPUT_FILE_PATH`); dual-env dry-run (IPI-706 planning) |

---

## Evidence Index

| Source | Reference |
|--------|-----------|
| Repo | `app/wrangler.jsonc`, `app/package.json`, `.github/workflows/ci.yml`, `.github/workflows/cloudflare-secrets-sync.yml` |
| GitHub PRs | #468 merged, #471 merged, [#475 open](https://github.com/amo-tech-ai/lumina-studio/pull/475) (CI green) |
| GitHub Actions | Bootstrap run [`29648772820`](https://github.com/amo-tech-ai/lumina-studio/actions/runs/29648772820) |
| Linear | IPI-606 In Progress, IPI-472 Done, IPI-632 Todo, IPI-594/IPI-609 disambiguated |
| Official docs | [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/), [OpenNext Cloudflare](https://opennext.js.org/cloudflare), [Platform limits](https://developers.cloudflare.com/workers/platform/limits/) |
