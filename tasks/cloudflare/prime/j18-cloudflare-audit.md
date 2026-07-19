# J18 Cloudflare Hosting Audit — Coordinator Summary

**Date:** 2026-07-18  
**Full audit:** [`docs/audits/cloudflare-hosting-implementation-audit.md`](../../docs/audits/cloudflare-hosting-implementation-audit.md)  
**Execution plan:** [`j18-cloudflare-plan.md`](j18-cloudflare-plan.md)  
**Prior plan (still valid):** [`04-plan-hosting.md`](04-plan-hosting.md)

---

## 1. Overall completion: **68%**

Weighted across protected preview (67%), production readiness (22%), journeys (8%), security (55%), bundle/env (40%), Hyperdrive (15%), native AI (12%), edge (5%).

Architecture and OpenNext wiring are sound. Operational proof (remote smoke, provenance, journeys) lags implementation.

---

## 2. Protected-preview readiness: **62%**

| Ready | Not ready |
|-------|-----------|
| Preview Worker deployed (`ipix-operator-preview`) | No remote IPI-632 smoke |
| Bootstrap workflow + `--secrets-file` | IPI-606 open (PR #475) |
| CI `build:cf` + bundle gate pass | `startup_time_ms` not captured |
| IPI-472 Done | Preview URL not in CI summary |
| Fail-closed auth configured | GitHub env vars unverified |

**Deployed baseline (2026-07-18 bootstrap):**

- Version: `a3fd7130-6d63-41df-ae3b-e2d29da34816`
- Commit: `84ea702`
- Gzip: **8,454 KiB** (~8.26 MiB)

---

## 3. Production readiness: **22%**

No production Worker, no remote journey tests, no security proof, no rollback rehearsal, no DNS cutover. Local Playwright (shoot wizard, channel preview) runs against Vercel/dev — not Cloudflare preview.

---

## 4. Critical blockers

| # | Blocker | Blocks |
|---|---------|--------|
| 1 | **IPI-632** — no remote smoke on `*.workers.dev` | Preview proof, IPI-627, cutover path |
| 2 | **IPI-606** — PR #475 not merged; env vars unverified | Correct vars on live Worker |
| 3 | **Orphan secrets** — possible on preview after reclassification | Security / bootstrap drift |
| 4 | **Production Worker absent** | DNS cutover |
| 5 | **Journey tests** (IPI-502, IPI-504, IPI-510) not run on CF | Production gate |

Post-launch only: Hyperdrive, IPI-594 native routing, IPI-694 edge migration, IPI-592 ai-gateway deletion.

---

## 5. Next five tasks (exact execution order)

```text
1. IPI-606 · CF-SEC-010 — Connect Infisical Secrets to Cloudflare Deployment
   → Merge PR #475; set GitHub Environment vars; orphan secret diff

2. Re-bootstrap preview (cloudflare-secrets-sync.yml, dry_run=false, wrangler_env=preview)
   → Confirm vars + secrets on version tied to merged commit

3. IPI-632 · CF-MIG-220 — Protected Preview Runtime Smoke Validation
   → Login, /api/copilotkit/info, SSE, agent turn, logout on live URL

4. IPI-627 · CF-SEC-020 — Deployment Security Proof
   → Route inventory, ratelimit binding, secret name audit

5. IPI-510 · CF-UJ-011 — Journey Test: AI Health, Readiness and Continuous Validation
   → Health endpoints + CI probe on preview
```

**Parallel (non-blocking):** IPI-705 · CF-PERF-001 (deploy provenance) · IPI-706 · CF-BUNDLE-220 planning

---

## 6. Custom code that can be simplified

| Keep (minimal, validated) | Replace / reduce |
|---------------------------|------------------|
| `cloudflare-secret-allowlist.mjs` | → IPI-710 generated inventory |
| `upload-opennext-with-secrets.mjs` | Keep; add `WRANGLER_OUTPUT_FILE_PATH` |
| `check-worker-bundle-size.mjs` | Extend with dual-env + `--metafile` |
| Bootstrap sed parsing for version_id | → Official NDJSON output file (IPI-705) |
| Manual IPI-632 checklist | → IPI-707 Playwright suite |

Official preference ladder unchanged: Dashboard (verify) → Wrangler CLI → OpenNext → GitHub Actions → custom scripts last.

---

## 7. Stale documents that must be updated

| Document | Action |
|----------|--------|
| `tasks/cloudflare/prime/cloudflare-migration-audit.md` | Mark superseded — claims preview not deployed |
| `docs/audits/cloudflare-migration-audit.md` evidence index | Refresh Linear states (IPI-606 In Progress, IPI-632 Todo) |
| Any doc referencing **IPI-456** for DNA | Use **IPI-698** (IPI-456 canceled/duplicate) |
| Any doc conflating **IPI-594** and **IPI-609** | IPI-594 = agent migration; IPI-609 = soak gate |

---

## 8. Final success verdict

| Milestone | Verdict | Condition |
|-----------|---------|-----------|
| **Protected preview** | 🟡 **Will succeed (~85%)** | After IPI-606 + IPI-632 |
| **Production cutover** | 🔴 **Not ready (~22%)** | After journeys + rollback + prod bootstrap |
| **Architecture** | 🟢 **Sound (~94%)** | OpenNext + Wrangler SSOT correct |

**Do not start:** IPI-631 (DNS), IPI-592 (delete ai-gateway), IPI-594 (before IPI-586), production bootstrap.

**Start now:** IPI-606 closeout → IPI-632 smoke.

---

## Linear identity quick reference

| Display | Status (2026-07-18) |
|---------|---------------------|
| IPI-606 · CF-SEC-010 | In Progress (SLA breached) |
| IPI-472 · INFRA-001 | Done |
| IPI-632 · CF-MIG-220 | Todo — **ready to start** |
| IPI-594 · CF-MIG-230 (agents) | Backlog |
| IPI-609 · CF-MIG-230-SOAK | Backlog |
| IPI-456 · CF-DNA | Duplicate → IPI-698 |
| IPI-694 · CF-EDGE-AI | Todo (parallel track) |
| IPI-697 · CF-EDGE-003 | Todo |
| IPI-699 · CF-EDGE-005 | Todo |
| IPI-616 · CF-DB-001 | Todo |
| IPI-586 · CF-AI-003 | Todo (after IPI-632) |
