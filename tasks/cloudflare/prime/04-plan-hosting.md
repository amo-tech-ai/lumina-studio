# Cloudflare hosting — executive plan (2026-07-18)

**J18 audit (2026-07-18):** [`j18-cloudflare-audit.md`](j18-cloudflare-audit.md) · [`j18-cloudflare-plan.md`](j18-cloudflare-plan.md)  
**Full forensic audit:** [`docs/audits/cloudflare-hosting-implementation-audit.md`](../../docs/audits/cloudflare-hosting-implementation-audit.md)  
**Prior audit:** [`docs/audits/cloudflare-migration-audit.md`](../../docs/audits/cloudflare-migration-audit.md)  
**Task inventory:** [`01-cloudflare-hosting.md`](01-cloudflare-hosting.md) · **Official links:** [`02-links.md`](02-links.md)

---

## Executive scores

| Lens | Score | Notes |
|------|------:|-------|
| **Architecture & official alignment** | **94/100** | OpenNext + `--secrets-file` + versions model — correct |
| **Operational readiness** | **72/100** | Smoke, auto verification, bundle headroom still open |
| **Likelihood of preview success** | **95%** | After env vars + #475 + IPI-632 |
| **Likelihood of production cutover** | **65%** | After journeys + rollback rehearsal |

**Verdict:** ✅ Architecture sound · 🟡 Operational validation remaining

---

## Official preference ladder (use before custom code)

```text
1. Cloudflare Dashboard     → account, Worker visibility, promote version, observability
2. Wrangler CLI             → versions upload/deploy, secrets, rollback, dry-run, metafile
3. OpenNext (@opennextjs/cloudflare) → build, preview, upload passthrough
4. GitHub Actions           → orchestration only (call wrangler/opennext; no inline deploy logic)
5. Official examples/templates → workers-sdk, opennextjs-cloudflare/examples, CF GitHub Actions doc
6. Custom scripts             → last resort (allowlist, redaction — already minimal)
```

**Critical nuance:** Dashboard is **not** SSOT for var/secret **values**. Cloudflare states Wrangler config is SSOT and Dashboard var edits are overwritten on deploy ([Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)). Use Dashboard to **verify** Workers/bindings/Hyperdrive; use **GitHub Environments + `wrangler.jsonc` + `--var`/`--secrets-file`** to **set** values at deploy.

---

## Target deployment flow (replace current)

**Instead of:**
```text
Dashboard edits → GitHub secrets → custom upload script → manual validation
```

**Use:**
```text
Dashboard (verify Worker exists, bindings, observability)
→ wrangler versions upload + --secrets-file + --var   [or opennextjs-cloudflare upload passthrough]
→ wrangler versions deploy (100% preview, then gradual prod)
→ Preview URL / version override smoke
→ Playwright authenticated suite (IPI-632)
→ Journey tests
→ Production cutover
```

Refs: [Versions & deployments](https://developers.cloudflare.com/workers/versions-and-deployments/) · [Deployment management](https://developers.cloudflare.com/workers/versions-and-deployments/deployment-management/) · [GitHub Actions CI/CD](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)

---

## Per-task efficiency (official-first)

| Task / area | Current | More efficient (official-first) | Tool | Score |
|-------------|---------|-------------------------------|------|------:|
| **Account & Worker setup** | wrangler.jsonc only | Dashboard: confirm `ipix-operator-preview`, bindings, Paid plan | [Dashboard](https://dash.cloudflare.com) | 96 |
| **GitHub environment variables** | Manual repo settings | GitHub Environments (`preview`/`production`) → workflow `vars.*` → `--var` | GitHub Actions + Wrangler | 96 |
| **IPI-606 · CF-SEC-010** | Custom allowlist + upload script | Keep minimal script; use `wrangler versions upload --secrets-file` directly in CI after greenfield | [Secrets upload](https://developers.cloudflare.com/workers/configuration/secrets/) | 95 |
| **Secret reconciliation** | Manual orphan delete | CI: `wrangler secret list` → `diffSecretNames()` → report (delete gated) | Wrangler CLI + existing allowlist | 90→95 |
| **Preview bootstrap** | upload + deploy fallback | Greenfield: one `deploy --secrets-file`; thereafter **`versions upload` → `versions deploy`** only | [Versions deploy](https://developers.cloudflare.com/workers/versions-and-deployments/deployment-management/) | 97 |
| **IPI-472 · INFRA-001** | Manual workflow summary | `WRANGLER_OUTPUT_FILE_PATH` NDJSON: version_id, URL, commit SHA; artifact gzip report | [Wrangler output file](https://developers.cloudflare.com/workers/wrangler/system-environment-variables/) | 98 |
| **IPI-490 / CF-BUNDLE-220** | Custom dry-run parser | `wrangler deploy --dry-run --metafile bundle-meta.json` per env; OpenNext troubleshooting metafile | [OpenNext troubleshooting](https://opennext.js.org/cloudflare/troubleshooting) | 96 |
| **IPI-632 · CF-MIG-220** | Manual login/SSE | Playwright: login → health → `/api/copilotkit/info` → SSE → agent turn → logout | Existing E2E infra + [version overrides](https://developers.cloudflare.com/workers/versions-and-deployments/version-overrides/) | 95 |
| **IPI-627 · CF-SEC-020** | Custom security checklist | Wrangler `ratelimit` binding + Dashboard WAF rules where applicable | Workers bindings docs | 92 |
| **IPI-510 · CF-UJ-011** | Manual health | CI curl/Playwright against `/api/health` on preview URL | GitHub Actions | 93 |
| **IPI-631 · CF-MIG-810** | Planned DNS cutover | Dashboard custom domain + `wrangler triggers deploy`; gradual deployment before 100% | [Gradual deployments](https://developers.cloudflare.com/workers/versions-and-deployments/gradual-deployments/) | 94 |
| **CI/CD long-term** | workflow_dispatch bootstrap | **Workers Builds** (native) or official [GitHub Actions template](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/) | Workers Builds | 95 |
| **Hyperdrive (Phase 3)** | Config exists unwired | Dashboard Hyperdrive + `hyperdrive` binding in wrangler.jsonc — no duplicate create | [Hyperdrive](https://developers.cloudflare.com/hyperdrive/) | 90 |
| **Journey tests (Phase 2)** | Docs only | Extend Playwright: upload/Cloudinary, vector search, provider failover | Official examples + existing vitest | 88 |

---

## Recommended implementation order

1. **Dashboard** — verify Workers, bindings, observability, Hyperdrive config  
2. **Wrangler CLI** — `versions upload` / `versions deploy` / `rollback` / `--metafile` / `secret list`  
3. **OpenNext** — `build:cf`, official adapter, metafile analysis  
4. **GitHub Actions** — orchestrate only; thin wrappers around wrangler/opennext  
5. **Official GitHub Actions / Workers Builds** — replace bespoke bootstrap over time  
6. **Playwright smoke** — automate IPI-632  
7. **Journey tests** — IPI-502, IPI-504, IPI-510 (+ upload/Cloudinary/failover before prod)  
8. **Production cutover** — gradual deploy → DNS  
9. **CF-BUNDLE-220** — target ≤7.5 MiB (Service Bindings if needed per [limits doc](https://developers.cloudflare.com/workers/platform/limits/))  
10. **Advanced** — Hyperdrive, Workers AI routing, Edge migration (post-preview)

---

## Phase 1 — Configuration (now)

| Action | Where | SSOT for values? |
|--------|-------|------------------|
| Confirm `ipix-operator-preview` live | Dashboard | — |
| Set `INTELLIGENCE_*` URLs | GitHub Environment `preview` | ✅ GitHub → `--var` |
| Runtime secrets | GitHub Environment secrets / Infisical OIDC | ✅ `--secrets-file` |
| Bindings (ASSETS, IMAGES, services) | `app/wrangler.jsonc` | ✅ Wrangler file |
| Domains (later) | Dashboard + wrangler routes | ✅ Wrangler |

**Do not** set production Intelligence URLs in Dashboard — deploy overwrites them.

---

## Phase 2–5 — Wrangler → OpenNext → GitHub → Smoke

```bash
# After build:cf (OpenNext)
opennextjs-cloudflare upload --env preview -- --secrets-file secrets.json --var INTELLIGENCE_API_URL:... 
# Or direct Wrangler:
wrangler versions upload --env preview --secrets-file secrets.json --var KEY:VALUE
wrangler versions deploy --env preview   # promote when smoke passes
```

Capture per deploy ([CF-PERF-001](below)):
- `version_id`, preview URL, gzip (dry-run), `startup_time_ms` from deploy output  
- commit SHA from `GITHUB_SHA`

---

## Linear operational tasks (created 2026-07-18)

| Linear | Name | Purpose |
|--------|------|---------|
| [IPI-709](https://linear.app/amo100/issue/IPI-709) | CF-OBS-001 | Observability baseline before prod |
| [IPI-708](https://linear.app/amo100/issue/IPI-708) | CF-ROLLBACK-001 | Version rollback rehearsal |
| [IPI-705](https://linear.app/amo100/issue/IPI-705) | CF-PERF-001 | Deploy provenance (version_id, gzip, startup_time_ms) |
| [IPI-711](https://linear.app/amo100/issue/IPI-711) | CF-BINDINGS-001 | Binding inventory preview vs production |
| [IPI-710](https://linear.app/amo100/issue/IPI-710) | CF-ENV-001 | Authoritative env inventory SSOT |
| [IPI-706](https://linear.app/amo100/issue/IPI-706) | CF-BUNDLE-220 | Bundle reduction ≤7.5 MiB |
| [IPI-712](https://linear.app/amo100/issue/IPI-712) | CF-DEPLOY-030 | Config ownership in CI |
| [IPI-707](https://linear.app/amo100/issue/IPI-707) | CF-SMOKE-001 | Playwright automated IPI-632 |

---

## Red flags (unchanged)

| Flag | Target |
|------|--------|
| 🟡 Manual secret cleanup | Automate diff report in bootstrap workflow |
| 🟡 Bundle 8.25 MiB | **7.5 MiB** — trim Sentry/Mermaid/Mastra before Service Bindings split |
| 🟡 No auto deploy verification | CF-PERF-001 + CF-SMOKE-001 |
| 🟢 Correct deferrals | Hyperdrive, Workers AI routing, Edge migration post-preview |

---

## Immediate next three

1. **Configure GitHub Environment vars** (`INTELLIGENCE_API_URL`, `INTELLIGENCE_GATEWAY_WS_URL`) on `preview`  
2. **Merge PR #475** · **IPI-606 · CF-SEC-010 — Connect Infisical Secrets to Cloudflare Deployment**  
3. **IPI-632 · CF-MIG-220 — Protected Preview Runtime Smoke Validation** (Playwright-first)

---

## Will it succeed?

| Milestone | Probability | Condition |
|-----------|------------:|-----------|
| Protected preview | **95%** | Env vars + #475 + automated smoke |
| Production cutover | **65%** | + journeys, CF-ROLLBACK-001, CF-OBS-001, bundle headroom |

Architecture is **not** the blocker — operational automation and validation are.
