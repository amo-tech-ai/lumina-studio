# Cloudflare hosting — remaining cutover work

**Date:** 2026-08-01  
**Verdict:** 🔴 **HOLD** — do not start production DNS cutover  
**Progress tracker (SSOT):** [`../prime/01-cloudflare-hosting.md`](../prime/01-cloudflare-hosting.md) · scores [`../prime/04-plan-hosting.md`](../prime/04-plan-hosting.md) · docs PR [#736](https://github.com/amo-tech-ai/lumina-studio/pull/736)

Hosting lane ~**72%** · production cutover readiness ~**20%**. `www.ipix.co` still **Vercel**. Prod Worker `ipix-operator` missing / NOT VERIFIED (404).

## Critical path (serial)

```text
IPI-849 · CF-BUNDLE-222 — Remove CopilotKit web-inspector from Worker bundle (#722 merge)
→ IPI-848 · CF-BUNDLE-223 — Metafile regression gate + Worker bundle composition CI
→ IPI-734 · COPILOT-VERIFY-001 — Runtime Verification Suite
→ Approved production Worker bootstrap *(ops — cloudflare-secrets-sync / ipix-operator)*
→ IPI-707 · CF-SMOKE-001 — Run the Existing Runtime Verification Suite Against Each Worker Version
→ IPI-708 · CF-ROLLBACK-001 — Rehearse Canary Promotion and Version Rollback
→ IPI-709 · CF-OBS-001 — Establish Native Workers Observability and Cutover Alerts *(prod re-verify)*
→ IPI-627 · CF-SEC-020 — Deployment Security Proof *(prod re-proof)*
→ IPI-794 · CF-GOV-001 — Protect Main with a GitHub Ruleset
→ IPI-631 · CF-MIG-810 — Cut Over ipix.co to Cloudflare Workers with Tested Vercel Fallback
→ 48-hour soak *(post-cutover)*
```

## Remaining tasks

| # | Status | Full task name | % | Why remaining | Next action |
|--:|:------:|----------------|--:|---------------|-------------|
| 1 | 🟡 | **IPI-849 · CF-BUNDLE-222 — Remove CopilotKit web-inspector from Worker bundle** | 90 | #716 merged; #722 OPEN / merge-ready (gzip **7.677 MiB** in PR body) | Merge [#722](https://github.com/amo-tech-ai/lumina-studio/pull/722) → Linear Done |
| 2 | ⚪ | **IPI-848 · CF-BUNDLE-223 — Metafile regression gate + Worker bundle composition CI** | 0 | Size gate is MiB WARN/FAIL only — no metafile `banList` hard-fail | After 849: WARN→FAIL + ban-list CI |
| 3 | ⚪ | **IPI-734 · COPILOT-VERIFY-001 — Runtime Verification Suite** | 0 | `verify:copilot` → **NO_VERIFY_COPILOT** | Thin wrapper; can run ∥ 848 after 849 |
| 4 | 🔴 | **Approved production Worker bootstrap** *(ops — cloudflare-secrets-sync / ipix-operator)* | 0 | `ipix-operator*.workers.dev` → 404; deployments list NOT VERIFIED | Bootstrap `ipix-operator` after 848/734 GO |
| 5 | ⚪ | **IPI-707 · CF-SMOKE-001 — Run the Existing Runtime Verification Suite Against Each Worker Version** | 0 | No automated remote smoke against Worker versions | Run suite per version after prod bootstrap |
| 6 | ⚪ | **IPI-708 · CF-ROLLBACK-001 — Rehearse Canary Promotion and Version Rollback** | 0 | No dated rehearsal log | One previous-% `versions deploy` after 707 |
| 7 | 🟡 | **IPI-709 · CF-OBS-001 — Establish Native Workers Observability and Cutover Alerts** *(prod re-verify)* | 100* | Linear Done for baseline; cutover alerts on **prod** Worker NOT VERIFIED | Re-verify alerts on prod Worker before 631 |
| 8 | 🟡 | **IPI-627 · CF-SEC-020 — Deployment Security Proof** *(prod re-proof)* | 100* | Linear Done for **preview**; prod re-proof pending | Re-proof after prod bootstrap |
| 9 | ⚪ | **IPI-794 · CF-GOV-001 — Protect Main with a GitHub Ruleset** | 0 | `main` ruleset / required checks NOT VERIFIED (admin) | Ruleset before DNS |
| 10 | ⚪ | **IPI-850 · CF-SMOKE-002 — Worker/operator post-stub runtime smoke journey** *(parallel)* | 0 | Parallel track; not on serial critical path | Run ∥ 848; confirm Linear title if drifted |
| 11 | 🔴 | **IPI-631 · CF-MIG-810 — Cut Over ipix.co to Cloudflare Workers with Tested Vercel Fallback** | 0 | **HARD HOLD** — prod still Vercel; full path above incomplete | Do not start until path green |
| 12 | ⚪ | **48-hour soak** *(post-cutover)* | 0 | After DNS cutover only | Monitor errors / rollback window |
| 13 | ⚪ | **IPI-510 · CF-UJ-011 — Journey Test: AI Health, Readiness and Continuous Validation** | — | Soft / optional cutover gate — **not** on 2026-08-01 serial path; treat as deferred unless product requires AI-health proof before DNS | Run on preview/prod if re-gated; else keep deferred |

\*Linear Done for preview/baseline slice — not production-cutover complete.

## Parallel track

- After **IPI-849 · CF-BUNDLE-222 — Remove CopilotKit web-inspector from Worker bundle**: **IPI-734 · COPILOT-VERIFY-001 — Runtime Verification Suite** ∥ **IPI-848 · CF-BUNDLE-223 — Metafile regression gate + Worker bundle composition CI**
- **IPI-850 · CF-SMOKE-002 — Worker/operator post-stub runtime smoke journey** ∥ **IPI-848 · CF-BUNDLE-223 — Metafile regression gate + Worker bundle composition CI** (post-stub operator smoke)
- Do **not** serialize 850/734 behind each other once 849 lands

## Explicitly deferred (not cutover blockers)

| Status | Item | Note |
|:------:|------|------|
| ⚪ | **IPI-847 · CF-BUNDLE-221 — Mermaid/KaTeX browser CDN fallback + stub test coverage** | Explicitly deferred this pass — keep off critical path |
| ⚪ | Hyperdrive / Mastra storage (**IPI-616 · CF-DB-001 — Mastra Storage and Schema ADR** → **IPI-619 · CF-DB-005 — Add Initial Supabase Hyperdrive Binding to OpenNext Worker**…) | Post-preview / post-cutover platform phase |
| ⚪ | Native AI routing (**IPI-586 · CF-AI-003 — Wire One Workers AI Call Through ipix-prod Gateway** waves / **IPI-594 · CF-MIG-230 — Migrate Mastra Agents to Cloudflare-Native AI Routing**) | Separate lane — not a hosting DNS prerequisite |

## Done / not in remaining list

Pointer only (see progress tracker for evidence): **IPI-606 · CF-SEC-010 — Connect Infisical Secrets to Cloudflare Deployment**, **IPI-472 · INFRA-001 — OpenNext CI and Deployment Pipeline**, **IPI-632 · CF-MIG-220 — Protected Preview Runtime Smoke Validation**, **IPI-627 · CF-SEC-020 — Deployment Security Proof** (preview), **IPI-706 · CF-BUNDLE-220 — Restore OpenNext Worker Bundle Headroom**, **IPI-709 · CF-OBS-001 — Establish Native Workers Observability and Cutover Alerts** (baseline), **IPI-595 · CF-GW-010 — Configure AI Gateway Authentication**.
