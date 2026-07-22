# iPix Cloudflare Migration — Forensic Audit

**Date:** 2026-07-18  
**Auditor:** Forensic audit (audit-only; no code/Linear/deploy changes)  
**Repository:** `amo-tech-ai/lumina-studio` @ branch `fix/cf-secrets-classification` · commit `ecacd90d`  
**Evidence:** Repo disk, GitHub PRs, Linear MCP, Cloudflare MCP (live account), official Cloudflare/OpenNext docs  
**Companion:** `tasks/cloudflare/prime/04-plan-hosting.md` (concise execution plan)

---

## Executive summary

| Metric | Score |
|--------|------:|
| **Overall migration correctness** | **83%** |
| **First protected preview readiness** | **72%** |
| **Production DNS cutover readiness** | **28%** |
| **Post-launch platform maturity** | **45%** |
| **Critical blockers (preview path)** | **3** |

**Verdict:** 🟡 **Conditionally ready** — preview Worker exists and bootstrap architecture is sound; remote smoke, env-var ownership, and bundle headroom block confident launch.

---

## Repository state (Step 2)

| Item | Verified value |
|------|----------------|
| Branch / commit | `fix/cf-secrets-classification` · `ecacd90d` |
| Uncommitted | `tasks/cloudflare/prime/04-plan-hosting.md` (local edits) |
| Next.js | `16.2.10` (`app/package.json`) |
| OpenNext | `@opennextjs/cloudflare` `^1.20.1` |
| Wrangler | `4.110.0` (lockfile; cf-typegen output) |
| Mastra | `@mastra/core` `1.41.0` · `mastra` `1.1.0-alpha.3` |
| Supabase | `@supabase/supabase-js` `^2.108.2` · `@supabase/ssr` `^0.12.0` |
| Node | `>=22` (`app/.nvmrc`) |
| Preview Worker | `ipix-operator-preview` — **deployed** (MCP: modified 2026-07-18T14:52:04Z) |
| Production Worker | `ipix-operator` — **not deployed** |
| Other Workers | `ai-gateway`, `ipi636-webhook-probe` |
| Compatibility | `2026-07-08` · `nodejs_compat` |
| Bindings | `ASSETS`, `IMAGES`, `WORKER_SELF_REFERENCE` (service) |
| Static vars | `MASTRA_STORAGE_MODE=noop`, `OPERATOR_AUTH_ENABLED=true` |
| Deploy-time vars | `WRANGLER_VAR_NAMES` via GitHub env → upload `--var` (PR #475) |
| Required secrets | `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `COPILOTKIT_LICENSE_TOKEN` |
| CI build | `npm run build:cf` in `.github/workflows/ci.yml` (placeholder `NEXT_PUBLIC_*`) |
| Bootstrap | `.github/workflows/cloudflare-secrets-sync.yml` (manual dispatch) |
| Bundle (clean dry-run) | **8,451 KiB gzip** (~8.25 MiB) · PR #476 audit branch |
| Hyperdrive | `ipix-supabase-fresh` exists — **not bound** in `wrangler.jsonc` |

**Correction vs stale draft** (`tasks/cloudflare/prime/cloudflare-migration-audit.md`): `ipix-operator-preview` **is deployed**. IPI-472 is **Done** in Linear and merged (#468).

---

## Official compliance anchors

| Topic | Official source | iPix alignment |
|-------|-----------------|----------------|
| Next.js on Workers | [Cloudflare Next.js guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/) | Uses `@opennextjs/cloudflare` — correct path (not Pages adapter) |
| Env vars vs secrets | [Environment variables](https://developers.cloudflare.com/workers/configuration/environment-variables/) | Non-sensitive in `vars` / `--var`; credentials as secrets |
| Wrangler SSOT | [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/) | PR #475 removes Dashboard-as-SSOT for production URLs |
| Upload + secrets | [Secrets — upload alongside code](https://developers.cloudflare.com/workers/configuration/secrets/) | `upload-opennext-with-secrets.mjs` → `--secrets-file`; omitted secrets preserved |
| Worker size limits | [Platform limits](https://developers.cloudflare.com/workers/platform/limits/) | Paid 10 MiB gzip — bundle ~8.25 MiB deployable but tight |
| OpenNext env split | [OpenNext env vars howto](https://opennext.js.org/cloudflare/howtos/env-vars) | `BUILD_TIME_SECRET_NAMES` vs runtime secrets vs wrangler vars |

---

## Architecture audit (Step 5)

### Cloudflare / OpenNext — 🟡 Good (84%)

🟢 **Correct:** `wrangler.jsonc` SSOT for bindings; preview/production named envs; `secrets.required`; bundle stubs (`alias`); `build:cf` + dry-run gate in CI; manual bootstrap workflow with GitHub environments.

🟡 **Risks:** Bundle **~1.75 MiB headroom** under Paid 10 MiB limit; gate checks default env only (not explicit preview + production dry-runs); bootstrap uses `deploy` fallback + `upload` (two operational branches); no Workers Builds / gradual deployment yet.

🔴 **Blockers:** IPI-632 remote smoke not executed — no proof of SSE/CopilotKit on `*.workers.dev`.

### Mastra — 🟡 Good (78%)

🟢 **Correct:** In-process Mastra in OpenNext Worker (not `@mastra/deployer-cloudflare`); `MASTRA_STORAGE_MODE=noop` + pg stubs; IPI-633 merged for local preview.

🟡 **Risks:** `@mastra/core` is top bundle contributor; persistent threads require Hyperdrive path (Phase 3).

### Supabase — 🟢 Good (86%)

🟢 Canonical SSR clients; RLS tests in CI; service role only server-side.

⚪ Hyperdrive config exists but unwired — correct deferral until IPI-619.

### Security / secrets — 🟡 Good (88%)

🟢 Infisical/GitHub → `--secrets-file`; allowlist module; fail-closed auth (IPI-468); OIDC validation script; log redaction in sync scripts.

🟡 PR #475 fixes var ownership; orphan secrets may remain on live preview from prior classification.

### CI/CD — 🟡 Good (80%)

🟢 `build:cf` on PR CI; bootstrap workflow with `set -o pipefail`; environment-scoped jobs.

🟡 No automated preview deploy on merge; bootstrap is `workflow_dispatch` only; no deployment provenance artifacts (`WRANGLER_OUTPUT_FILE_PATH`).

---

## Per-task audit table (Step 9)

| Task | Phase | Purpose | Current approach | Official approach | Errors | Risks | Missing work | More efficient approach | Dependency correction | Ready | Succeed | Score |
|------|-------|---------|------------------|-------------------|--------|-------|--------------|-------------------------|----------------------|------:|--------:|------:|
| **IPI-606 · CF-SEC-010 — Connect Infisical Secrets to Cloudflare Deployment** | 1 | Route secrets build vs runtime | Allowlist + `--secrets-file` upload | Wrangler `--secrets-file` + vars in config ([docs](https://developers.cloudflare.com/workers/configuration/secrets/)) | Dashboard var guidance (fixed in #475) | Orphan secrets on live Worker | Merge #475; GitHub env vars; orphan cleanup | GitHub env vars → `--var`; Infisical OIDC for rotation | None — unblocks IPI-632 after merge | Conditional | Yes after #475 | **88** |
| **IPI-472 · INFRA-001 — OpenNext CI and Deployment Pipeline** | 1 | CI + preview upload path | `build:cf` in CI; manual bootstrap workflow | OpenNext build + Wrangler upload ([OpenNext CF](https://opennext.js.org/cloudflare)) | Two bootstrap branches (upload vs deploy fallback) | No auto-deploy on main | Consolidate to version upload → explicit deploy | Workers Builds or GitHub Action from OpenNext docs | IPI-606 for secrets — satisfied | Yes | Yes | **91** |
| **IPI-632 · CF-MIG-220 — Protected Preview Runtime Smoke Validation** | 1 | Prove remote preview works | Not started | Remote smoke on `*.workers.dev` | None — correctly blocked until now | Treating HTML 200 as SSE proof | Run smoke: auth, `/api/copilotkit/info`, SSE, agent turn | Documented curl/journey from `tasks/cloudflare/tests/` | Worker exists — **ready to start** | Yes | Conditional | **35** |
| **IPI-627 · CF-SEC-020 — Deployment Security Proof** | 1 | Security proof on live Worker | Planned | Wrangler + Workers security features | None | Rate limit binding not configured | After IPI-632 | Cloudflare `ratelimit` binding per docs | Correctly after IPI-632 | No | Yes when unblocked | **70** |
| **IPI-510 · CF-UJ-011 — Journey Test: AI Health, Readiness and Continuous Validation** | 1 | Continuous AI health | Backlog plan only | CI health probe | None | No health route wired | Wire health route + CI step | Workers observability + synthetic check | After IPI-632 | No | Yes | **62** |
| **IPI-631 · CF-MIG-810 — Production DNS Cutover and Rollback** | 1/6 | DNS cutover | Backlog | Custom domain + Wrangler routes ([docs](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)) | Listed twice in epic (intentional gate) | No production Worker | Full preview + journey path first | Gradual traffic + DNS TTL prep task | Many blockers — correct | No | Conditional | **55** |
| **IPI-500 · CF-UJ-000 — Real-World AI Journey Test Suite** | 2 | Parent journey suite | Docs in `tasks/cloudflare/user-journeys/` | Manual + CI journey tests | None | None | Execute when surfaces ready | Reuse existing vitest + remote smoke | After Phase 1 | No | Yes | **65** |
| **IPI-501 · CF-UJ-001 — Journey Test: AI Onboarding** | 2 | Onboarding journey | Backlog | Journey test pack | None | None | Defer post-preview | — | After IPI-632 | No | Yes | **60** |
| **IPI-502 · CF-UJ-002 — Journey Test: AI Brand Intelligence** | 2 | Brand intelligence | Backlog | Journey test | None | Launch-critical per epic | Priority for cutover | — | After preview stable | No | Yes | **58** |
| **IPI-503 · CF-UJ-003 — Journey Test: AI Brand Brief Generation** | 2 | Brief generation | Backlog | Journey test | None | None | Defer | — | After IPI-502 | No | Yes | **58** |
| **IPI-504 · CF-UJ-004 — Journey Test: Shoot Planning Workflow** | 2 | Shoot planning | Backlog | Journey test | None | Launch-critical | Priority for cutover | — | After preview | No | Yes | **58** |
| **IPI-505 · CF-UJ-005 — Journey Test: Booking Workflow** | 2 | Booking | Backlog | Journey test | None | Optional for launch | Defer unless promised | — | Optional | No | Yes | **55** |
| **IPI-506 · CF-UJ-006 — Journey Test: CRM Workflow** | 2 | CRM | Backlog | Journey test | None | None | Post-launch | — | Defer | No | Yes | **55** |
| **IPI-507 · CF-UJ-007 — Journey Test: Planner Workflow** | 2 | Planner | Backlog | Journey test | None | Optional | Defer | — | Optional | No | Yes | **55** |
| **IPI-509 · CF-UJ-009 — Journey Test: Embeddings and Asset Search** | 2 | Embeddings search | Backlog | Journey + gateway | None | Depends on ai-gateway | After gateway stable | Service binding to `ai-gateway` | Partial — ai-gateway live | No | Conditional | **52** |
| **IPI-511 · CF-UJ-010 — Journey Test: Visual DNA Analysis** | 2 | Visual DNA | Backlog | Journey test | None | None | Post-launch | — | Defer | No | Yes | **55** |
| **IPI-616 · CF-DB-001 — Mastra Storage and Schema ADR** | 3 | Storage ADR | Todo | ADR doc | None | Hyperdrive exists ahead of ADR | Write ADR before IPI-619 wire | — | None | Yes | Yes | **72** |
| **IPI-619 · CF-DB-005 — Add Initial Supabase Hyperdrive Binding to OpenNext Worker** | 3 | Hyperdrive binding | Config exists (MCP) | [Hyperdrive binding](https://developers.cloudflare.com/hyperdrive/) | Binding not in wrangler | Duplicate work risk | Document existing config in AC | `hyperdrive` binding in wrangler.jsonc | After ADR | Conditional | Yes | **68** |
| **IPI-620 · CF-DB-006 — Hyperdrive Query Helper and PostgresStore Integration** | 3 | Query helper | Backlog | Hyperdrive + pg | None | None | After IPI-619 | Official Hyperdrive examples | IPI-619 | No | Yes | **60** |
| **IPI-621 · CF-DB-007 — Tenant Authorization and RLS Tests** | 3 | RLS on Hyperdrive path | Backlog | pgTAP + probes | None | None | After helper | Existing `verify-rls` CI | IPI-620 | No | Yes | **65** |
| **IPI-622 · CF-DB-008 — Benchmark Hyperdrive Placement and Supabase Data API** | 3 | Benchmark | Backlog | Benchmark scripts | None | None | Post-persistence | — | IPI-620 | No | Yes | **58** |
| **IPI-623 · CF-DB-009 — Migrate One Mastra Workload to Hyperdrive** | 3 | Canary workload | Backlog | Canary deploy | None | None | After IPI-621 | — | Phase 3 chain | No | Yes | **58** |
| **IPI-624 · CF-DB-010 — Configure Hyperdrive Monitoring and Connection Controls** | 3 | Hyperdrive ops | Backlog | Dashboard + alerts | None | None | After canary | Cloudflare observability | IPI-623 | No | Yes | **55** |
| **IPI-626 · SUPA-CLEANUP — Canonical Supabase Clients and Environment Configuration** | 3 | Client cleanup | Backlog | Canonical factories | Overlaps IPI-606 var work | None | Merge with CF-ENV-001 inventory | — | Can parallel post-preview | Yes | Yes | **70** |
| **IPI-586 · CF-AI-003 — Wire One Workers AI Call Through ipix-prod Gateway** | 4 | Workers AI smoke | Todo | Workers AI binding | None | Not preview blocker | After IPI-632 | `@cloudflare/ai` or AI Gateway | Epic defers correctly | Yes | Yes | **65** |
| **IPI-458 · CF-AI-007 — NVIDIA NIM Evaluation** | 4 | NIM eval | Backlog | Provider eval | None | Experiment | Post-launch | — | Defer | No | Yes | **50** |
| **IPI-462 · CF-AI-006 — AI Provider Evaluation Suite** | 4 | Provider suite | Backlog | Eval harness | None | None | Post-launch | — | Defer | No | Yes | **55** |
| **IPI-463 · CF-AI-008 — AI Provider Failover and Rollback** | 4 | Failover | Partial (`ai-gateway`) | Gateway failover | Task may duplicate live Worker | Update AC vs deployed `ai-gateway` | Verify against live Worker | Use existing `ai-gateway` | None | Yes | Yes | **75** |
| **IPI-460 · CF-AI-010 — AI Cost Tracking and Observability** | 4 | Cost tracking | Backlog | AI Gateway analytics | None | None | Post-launch | [AI Gateway analytics](https://developers.cloudflare.com/ai-gateway/) | Defer | No | Yes | **52** |
| **IPI-594 · CF-MIG-230 — Migrate Mastra Agents to Cloudflare-Native AI Routing** | 4 | Native AI routing | Backlog (note: ID collision with IPI-609 soak) | Workers AI / Gateway | ID naming collision in epic | None | Rename/clarify vs IPI-609 | Service bindings | After IPI-586 | No | Conditional | **55** |
| **IPI-694 · CF-EDGE-AI — Route Supabase Edge LLM Through Cloudflare AI Gateway** | 5 | Edge LLM routing | Backlog | AI Gateway | None | Not hosting blocker | Phase 5 | Gateway REST client | Defer | No | Yes | **55** |
| **IPI-697 · CF-EDGE-003 — Add Cloudflare AI Gateway REST Client and Wire Brand Intelligence** | 5 | BI gateway client | Backlog | AI Gateway SDK | None | None | Phase 5 | Official gateway client | IPI-694 | No | Yes | **55** |
| **IPI-455 · CF-EDGE-B — Phase B: Port Brand-Intelligence Handler to Cloudflare Worker** | 5 | Port BI handler | Backlog | Worker port | None | None | Phase 5 | — | IPI-697 | No | Conditional | **52** |
| **IPI-699 · CF-EDGE-005 — Edge Secrets, Cloudflare Canary and Rollback** | 5 | Edge canary | Backlog | Canary deploy | None | None | Phase 5 | Workers gradual deployment | Phase 5 | No | Yes | **55** |
| **IPI-698 · CF-EDGE-004 — DNA Vision Evaluation After Brand-Intelligence Canary** | 5 | DNA vision eval | Backlog | Eval | None | None | After canary | — | IPI-699 | No | Yes | **50** |
| **IPI-456 · CF-EDGE-A — Migrate Asset DNA Scoring to Cloudflare** | 5 | DNA on CF | Backlog | Worker compute | None | None | Phase 5 | — | Defer | No | Conditional | **50** |
| **IPI-609 · CF-MIG-230 — Soak, Zero-Legacy-Traffic Audit and Production Soak Gate** | 6 | Soak gate | Backlog | Observability soak | ID collision with IPI-594 label | Should not block first DNS cutover per epic | Post-cutover maturity | Workers analytics | After preview journeys | No | Yes | **60** |
| **IPI-592 · CF-MIG-820 — Delete Custom AI Gateway Worker** | 6 | Delete legacy gateway | Backlog | Decommission | Must not run before IPI-594 | Premature deletion risk | After native routing | — | IPI-594 | No | No until stable | **55** |

**Also verified (foundation, not in 37 list):**

| Task | Score | Notes |
|------|------:|-------|
| **IPI-468 · SEC-001 — Fail-Closed Operator Authentication** | **92** | Done · `OPERATOR_AUTH_ENABLED` in wrangler |
| **IPI-490 · CF-MIG-210 — Enforce Cloudflare Worker Bundle Size Gate** | **86** | Gate works; headroom + dual-env measurement missing (PR #476 audit) |
| **IPI-633 · CF-DB-011 — Restore Worker-Safe Mastra Noop Storage** | **90** | Done · local OpenNext preview |

---

## Correction table (Step 10)

| Task | Severity | Current problem | Required correction | Official source | Blocking? |
|------|----------|-----------------|---------------------|-----------------|-----------|
| IPI-606 | 🔴 High | Dashboard suggested for production vars | GitHub env vars → `--var` only | [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/) | Yes — #475 |
| IPI-632 | 🔴 High | No remote smoke evidence | Run protected preview smoke on live URL | task-verifier / journey docs | Yes — preview proof |
| IPI-490 | 🟡 Med | ~1.75 MiB headroom; warn at 8.5 MiB too late | CF-BUNDLE-220: target 7.5 MiB; warn 8.0; both envs | [Platform limits](https://developers.cloudflare.com/workers/platform/limits/) | No — deploy works |
| IPI-472 | 🟡 Med | upload vs deploy fallback | Single version-upload path after greenfield | OpenNext CLI | No |
| IPI-619 | 🟡 Med | Hyperdrive exists but AC may duplicate | Reference existing `ipix-supabase-fresh` in AC | Hyperdrive MCP | No |
| IPI-463 | 🟡 Med | AC may not reflect live `ai-gateway` | Audit deployed Worker vs AC | Workers MCP | No |
| IPI-631 | ⚪ Low | Duplicate listing in epic phases | Document intentional (gate + final) | — | No |
| Live preview | 🟡 Med | Possible orphan secrets from reclassification | `wrangler secret delete` after diff | [Secrets upload](https://developers.cloudflare.com/workers/configuration/secrets/) | Conditional |

---

## Critical blockers (Step 11)

| # | Blocker | Affected | Evidence | Fix | Blocks |
|---|---------|----------|----------|-----|--------|
| 1 | **No IPI-632 remote smoke** | IPI-632, IPI-627, cutover | Worker deployed; no SSE/auth/agent evidence | Execute smoke checklist on `ipix-operator-preview` | Preview proof |
| 2 | **GitHub env vars not verified** | IPI-606, bootstrap | `INTELLIGENCE_*` required at upload; not verified in audit | Set `preview`/`production` GitHub variables | Preview bootstrap |
| 3 | **PR #475 not merged** | IPI-606 | Open; var ownership fix pending | Merge after CI green | Config SSOT |
| 4 | **Bundle headroom ~1.75 MiB** | IPI-490, growth | 8,451 KiB gzip (PR #476) | CF-BUNDLE-220 reductions | Comfort / future deploys |
| 5 | **Production Worker absent** | IPI-631 | MCP: only preview deployed | Bootstrap production after preview proven | DNS cutover |
| 6 | **No journey validation on CF** | IPI-502, IPI-504, IPI-510 | All backlog | Run after IPI-632 | Production cutover |
| 7 | **Hyperdrive unwired** | IPI-619–624 | Config exists; no binding | Phase 3 after preview | Persistent Mastra only |
| 8 | **Legacy ai-gateway retirement** | IPI-592 | Worker live | Defer until IPI-594 | Post-launch only |

---

## Missing tasks (Step 12)

| Proposed | Purpose | Milestone | Mandatory |
|----------|---------|-----------|-----------|
| **IPI-TBD · CF-ENV-001 — Generate Authoritative Cloudflare Environment Inventory** | Single SSOT → allowlists, docs, validation | With IPI-606 closeout | Yes |
| **IPI-TBD · CF-BUNDLE-220 — Reduce OpenNext Worker Bundle and Preserve Headroom** | Target ≤7.5 MiB gzip; dual-env gate; CI artifacts | Before production bootstrap | Yes |
| **IPI-TBD · CF-DEPLOY-030 — Enforce Preview/Production Config Ownership in CI** | Extend `--var` passthrough to all deploy paths | With IPI-606 | Yes |
| **IPI-TBD · CF-SMOKE-001 — Automate IPI-632 Smoke in CI** | Remote smoke as optional workflow | After first manual smoke | Optional |
| **IPI-TBD · CF-OAUTH-001 — OAuth Callback Allowlist for Preview/Production URLs** | Supabase redirect URLs for `*.workers.dev` | Before IPI-632 | Conditional |
| **IPI-TBD · CF-PROV-001 — Deployment Provenance Artifacts** | `WRANGLER_OUTPUT_FILE_PATH` version IDs in CI | With IPI-472 hardening | Optional |

---

## Merge / defer / cancel (Step 13)

| Task | Recommendation | Reason |
|------|----------------|--------|
| IPI-606 | **Correct** | Merge #475 |
| IPI-472 | **Keep** | Done; minor consolidation follow-up |
| IPI-490 | **Correct** | Merge #476 audit; implement CF-BUNDLE-220 |
| IPI-454 / IPI-461 | **Cancel** (done) | Already canceled in Linear — use `ai-gateway` |
| IPI-508 | **Cancel** (done) | Canceled — covered by IPI-632 / UJ paths |
| IPI-463 | **Correct** | Reconcile AC with deployed `ai-gateway` |
| IPI-609 vs IPI-594 | **Split clarity** | Both use CF-MIG-230 label — rename one |
| IPI-616–624 | **Defer** | Post-preview unless threads required |
| IPI-694–456 | **Defer** | Edge migration not hosting blocker |
| IPI-626 | **Merge scope** | Combine with CF-ENV-001 |

---

## Optimal execution order (Step 14)

### A. Minimum path to first protected preview

```text
Configure GitHub env vars (INTELLIGENCE_API_URL, INTELLIGENCE_GATEWAY_WS_URL)
↓
Merge PR #475 · IPI-606 · CF-SEC-010 — Connect Infisical Secrets to Cloudflare Deployment
↓
Orphan secret cleanup on ipix-operator-preview
↓
Re-bootstrap preview (cloudflare-secrets-sync.yml, dry_run=false)
↓
IPI-632 · CF-MIG-220 — Protected Preview Runtime Smoke Validation
```

**Parallel:** Merge PR #476 (audit evidence) · CF-BUNDLE-220 planning

### B. Minimum path to production cutover

```text
IPI-632
↓
IPI-627 · CF-SEC-020 — Deployment Security Proof
↓
IPI-510 · CF-UJ-011 — Journey Test: AI Health, Readiness and Continuous Validation
↓
IPI-502 · CF-UJ-002 — Journey Test: AI Brand Intelligence
↓
IPI-504 · CF-UJ-004 — Journey Test: Shoot Planning Workflow
↓
Preview soak (short)
↓
Production bootstrap (ipix-operator)
↓
IPI-631 · CF-MIG-810 — Production DNS Cutover and Rollback
```

### C. Mastra persistence

```text
IPI-616 → IPI-619 → IPI-620 → IPI-621 → IPI-623 → IPI-624
```

### D. Cloudflare-native AI

```text
IPI-586 → IPI-462 → IPI-463 (verify ai-gateway) → IPI-594
```

### E. Legacy retirement

```text
IPI-609 (soak) → IPI-631 (cutover complete) → IPI-592 (delete ai-gateway)
```

---

## Efficiency table (Step 15)

| Task | Current method | More efficient method | Official tool | Benefit |
|------|----------------|----------------------|-------------|---------|
| IPI-606 | Manual allowlists in 3 files | CF-ENV-001 generated inventory | Wrangler vars + `--secrets-file` | Less drift |
| IPI-472 | workflow_dispatch bootstrap | Workers Builds on push to main | [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/) | Repeatable deploys |
| IPI-490 | Single-env dry-run | Both `--env preview` and production | `wrangler deploy --dry-run` | Catch env-specific bloat |
| IPI-632 | Manual smoke | Optional CI workflow with secrets | GitHub environments | Regression catch |
| IPI-619 | Greenfield bind | Wire existing Hyperdrive config | Dashboard + wrangler binding | Avoid duplicate config |
| IPI-586 | New smoke route | Workers AI binding + minimal route | Workers AI docs | Less custom code |

---

## Category grading (Step 16)

| Category | Score | Status | Explanation |
|----------|------:|--------|-------------|
| Architecture | 84 | 🟡 | OpenNext-in-Worker correct; bundle tight |
| Security | 88 | 🟡 | Strong secrets model; var ownership fixing |
| Cloudflare configuration | 86 | 🟡 | wrangler.jsonc solid; Hyperdrive unwired |
| OpenNext compatibility | 85 | 🟡 | Builds pass; stubs for heavy deps |
| Deployment | 78 | 🟡 | Preview live; no prod; manual bootstrap |
| CI/CD | 80 | 🟡 | build:cf on PR; no auto preview deploy |
| Mastra | 78 | 🟡 | noop mode works; persistence deferred |
| Supabase | 86 | 🟢 | RLS CI; canonical clients |
| Hyperdrive | 55 | ⚪ | Config only |
| AI routing | 70 | 🟡 | ai-gateway live; in-app routing separate |
| Testing | 45 | 🔴 | No remote smoke |
| Observability | 65 | ⚪ | Enabled in wrangler; no alert runbooks |
| Rollback | 60 | ⚪ | Vercel rollback plan; CF rollback untested |
| Documentation | 82 | 🟡 | Strong docs; stale prime draft |

**Overall: 83%** · Preview: **72%** · Production cutover: **28%** · Post-launch maturity: **45%**

---

## Executive conclusion (Step 17)

1. **Protected preview now?** Partially — Worker deployed; not proven end-to-end.
2. **Blocks first preview?** GitHub env vars, merge #475, IPI-632 smoke, optional re-bootstrap.
3. **Replace Vercel now?** No.
4. **Blocks DNS cutover?** IPI-632 → IPI-627 → journeys → production bootstrap → soak.
5. **True launch blockers:** IPI-606 (closeout), IPI-632, IPI-627, IPI-510, IPI-502/IPI-504, IPI-631.
6. **Post-launch:** Hyperdrive chain, edge migration, ai-gateway retirement, provider eval.
7. **Cancel/merge:** IPI-454/461/508 canceled; merge IPI-626 with CF-ENV-001; reconcile IPI-463 with ai-gateway.
8. **Fastest safe order:** See Section A above.
9. **Success probability (current plan):** ~**75%** for preview; ~**40%** for cutover on first attempt.
10. **After corrections:** ~**90%** preview; ~**65%** cutover.

**Final verdict:** 🟡 **Conditionally ready**

---

## Addendum — Executive efficiency audit (2026-07-18)

Reconciled with operator executive review. **Architecture score: 94/100.** Operational readiness remains ~72% until smoke automation and deploy provenance land.

### Dashboard vs Wrangler SSOT

| Use Dashboard for | Do NOT use Dashboard for |
|-------------------|--------------------------|
| Worker visibility, promote version, observability | Ongoing secret/var **values** (overwritten on deploy) |
| Hyperdrive create/inspect, token permissions | Production Intelligence URLs as permanent config |
| Custom domain attach (with wrangler routes) | Source of truth that contradicts `wrangler.jsonc` |

Official: [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/) · [Deployment management](https://developers.cloudflare.com/workers/versions-and-deployments/deployment-management/)

### Official deployment flow (target)

```text
Dashboard (verify) → wrangler versions upload (+ --secrets-file, --var)
→ wrangler versions deploy → Preview URL → Playwright smoke → journeys → prod
```

Replace greenfield `deploy` fallback with one-time bootstrap; thereafter versions workflow only ([gradual deployments](https://developers.cloudflare.com/workers/versions-and-deployments/gradual-deployments/)).

### Efficiency wins (official before custom)

| Area | Replace custom with |
|------|---------------------|
| Bundle analysis | `wrangler deploy --dry-run --metafile` + OpenNext metafile ([troubleshooting](https://opennext.js.org/cloudflare/troubleshooting)) |
| Deploy provenance | `WRANGLER_OUTPUT_FILE_PATH` NDJSON |
| CI/CD | [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/) or [GitHub Actions template](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/) |
| IPI-632 smoke | Playwright + [version overrides](https://developers.cloudflare.com/workers/versions-and-deployments/version-overrides/) |
| Secret drift | `wrangler secret list` + existing `diffSecretNames()` in CI report |

### Additional proposed tasks

CF-OBS-001 · CF-ROLLBACK-001 · CF-PERF-001 · CF-BINDINGS-001 · CF-SMOKE-001 (see `tasks/cloudflare/prime/04-plan-hosting.md`)

**Concise plan:** `tasks/cloudflare/prime/04-plan-hosting.md`

---

## Evidence index

- Repo: `app/wrangler.jsonc`, `app/package.json`, `.github/workflows/ci.yml`, `.github/workflows/cloudflare-secrets-sync.yml`
- PRs: #468 merged, #471 merged, #475 open, #476 open
- Linear: IPI-472 Done, IPI-606 In Progress, IPI-632 Backlog, IPI-487 In Progress
- Cloudflare MCP: Workers `ipix-operator-preview`, `ai-gateway`, `ipi636-webhook-probe`; Hyperdrive `ipix-supabase-fresh`
- Bundle: `docs/opennext-bundle-audit` branch audit — 8,451 KiB gzip
