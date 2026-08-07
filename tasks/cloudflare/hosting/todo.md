# Cloudflare hosting — remaining cutover work

**Date:** 2026-08-01 (post-merge #722)  
**Verdict:** 🔴 **HOLD** production DNS + production Worker bootstrap  
**Progress tracker (SSOT):** [`../prime/01-cloudflare-hosting.md`](../prime/01-cloudflare-hosting.md) · scores [`../prime/04-plan-hosting.md`](../prime/04-plan-hosting.md) · docs PR [#736](https://github.com/amo-tech-ai/lumina-studio/pull/736)  
**Linear SSOT:** [HOSTING](https://linear.app/amo100/project/hosting-d5d53bf2e887) · [Platform-first execution standard](https://linear.app/amo100/document/platform-first-execution-standard-75ed58d1ea8e)

Hosting lane ~**75%** · production cutover readiness ~**22%**. `www.ipix.co` still **Vercel**. Prod Worker `ipix-operator` missing / NOT VERIFIED (404).

## Milestone map (HOSTING)

| Milestone | Issues |
| -- | -- |
| **M0 — Preview foundation (complete)** | **IPI-849 · CF-BUNDLE-222** (evidence only; not active M1) |
| **M1 — Preview shippable** | **IPI-848** → **IPI-734** → **IPI-850**; **IPI-847** parallel / non-blocking |
| **M2 — Prod Worker ready** | **IPI-705** · **IPI-707** · **IPI-708** |
| **M3 — DNS cutover** | **IPI-631** |
| **M4 — Post-cutover soak** | **IPI-609** |

## Critical path (serial)

```text
IPI-849 · CF-BUNDLE-222 — Complete ✅ (#716 + #722 @ f2828ed1)
→ IPI-848 · CF-BUNDLE-223 — Metafile regression gate + Worker bundle composition CI  ← NEXT
→ IPI-734 · COPILOT-VERIFY-001 — Runtime Verification Suite  (∥ 848 OK)
→ Remote preview upload/remeasure (gzip < 8.5 MiB) — pending release gate for bootstrap
→ Approved production Worker bootstrap *(ops — HOLD until preview remeasure)*
→ IPI-707 · CF-SMOKE-001 — Run the Existing Runtime Verification Suite Against Each Worker Version
→ IPI-708 · CF-ROLLBACK-001 — Rehearse Canary Promotion and Version Rollback
→ IPI-709 · CF-OBS-001 — Establish Native Workers Observability and Cutover Alerts *(prod re-verify)*
→ IPI-627 · CF-SEC-020 — Deployment Security Proof *(prod re-proof)*
→ IPI-631 · CF-MIG-810 — Cut Over ipix.co to Cloudflare Workers with Tested Vercel Fallback
→ IPI-609 · Post-cutover soak
```

## IPI-849 evidence (M0 complete)

| Item | Status | Evidence class |
| -- | -- | -- |
| PR #716 — bundle exclusion (alias/stub) | ✅ Merged | CI / code on `main` |
| PR #722 — inspector disable + contract | ✅ Merged `f2828ed124c4a7bb9414d8d09227358fa27614db` | CI / code on `main` |
| Operator `enableInspector={false}` + `showDevConsole={false}` | ✅ On `main` | Local post-merge verify |
| Contract stub surface (`defineWebInspector`, `WEB_INSPECTOR_TAG`, `WebInspectorElement`, `ɵCpkThreadDetails`, `default`) | ✅ | Local: `opennext-ci-contract.test.ts` |
| Local / CI bundle evidence | ✅ Complete | Local Runtime Verified |
| Worker gzip (post-merge `main` @ `f2828ed1`) | **7861.24 KiB = 7.677 MiB** — below 8.5 WARN | Local: `npm run build:cf` + `check:worker-bundle` |
| Real `node_modules/@copilotkit/web-inspector` metafile hits | **0** (stub-only path present) | Local metafile scan |
| Remote preview verification | ⏳ Pending | Remote Preview — not run this pass |
| Production Worker / DNS | ⛔ HOLD | Production — do not start |

## Remaining tasks

| # | Status | Full task name | % | Why remaining | Next action |
|--:|:------:|----------------|--:|---------------|-------------|
| 1 | 🟢 | **IPI-849 · CF-BUNDLE-222 — Remove CopilotKit web-inspector from Worker bundle** | 100 | #716 + #722 merged; Linear Done; M0 foundation | Keep as evidence for IPI-848 hard-fail; remote preview remeasure still open |
| 2 | ⚪ | **IPI-848 · CF-BUNDLE-223 — Metafile regression gate + Worker bundle composition CI** | 0 | Size gate is MiB WARN/FAIL only — web-inspector can now hard-fail | **GO next** — extend `check-worker-bundle-size.mjs`; no new analyzer |
| 3 | ⚪ | **IPI-734 · COPILOT-VERIFY-001 — Runtime Verification Suite** | 0 | `verify:copilot` → **NO_VERIFY_COPILOT** | **GO** thin wrapper around IPI-724; ∥ 848 |
| 4 | 🔴 | **Approved production Worker bootstrap** *(ops — cloudflare-secrets-sync / ipix-operator)* | 0 | `ipix-operator*.workers.dev` → 404; HOLD until remote preview gzip confirms under 8.5 MiB | HOLD |
| 5 | ⚪ | **IPI-707 · CF-SMOKE-001 — Run the Existing Runtime Verification Suite Against Each Worker Version** | 0 | Needs 734 + prod bootstrap | After bootstrap |
| 6 | ⚪ | **IPI-708 · CF-ROLLBACK-001 — Rehearse Canary Promotion and Version Rollback** | 0 | No dated rehearsal log | After 707 |
| 7 | 🟡 | **IPI-709 · CF-OBS-001 — Establish Native Workers Observability and Cutover Alerts** *(prod re-verify)* | 100* | Linear Done for baseline; cutover alerts on **prod** Worker NOT VERIFIED | Re-verify alerts on prod Worker before 631 |
| 8 | 🟡 | **IPI-627 · CF-SEC-020 — Deployment Security Proof** *(prod re-proof)* | 100* | Linear Done for **preview**; prod re-proof pending | Re-proof after prod bootstrap |
| 9 | 🟢 | **IPI-794 · CF-GOV-001 — Protect Main with a GitHub Ruleset** | 100 | Linear Done (structural rules verified) | No longer a cutover blocker in Linear |
| 10 | ⚪ | **IPI-850 · CF-SMOKE-002 — Worker/operator post-stub runtime smoke journey** *(parallel)* | 0 | Browser journey after stubs; overlap-check vs 734 first | **GO** ∥ 848 after AC de-dupe |
| 11 | 🔴 | **IPI-631 · CF-MIG-810 — Cut Over ipix.co to Cloudflare Workers with Tested Vercel Fallback** | 0 | **HARD HOLD** — prod still Vercel; M2 incomplete | Do not start until path green |
| 12 | ⚪ | **IPI-609 · Post-cutover soak** | 0 | After DNS cutover only | Monitor errors / rollback window |
| 13 | ⚪ | **IPI-847 · CF-BUNDLE-221 — Mermaid/KaTeX browser CDN fallback + stub test coverage** | 0 | Non-blocking for cutover unless diagrams are launch-required | Defer / parallel |

\*Linear Done for preview/baseline slice — not production-cutover complete.

## Parallel track (M1)

- **GO:** **IPI-848 · CF-BUNDLE-223** (serial first on composition) ∥ **IPI-734 · COPILOT-VERIFY-001**
- **GO:** **IPI-850 · CF-SMOKE-002** after overlap check vs 734 / `e2e/copilotkit-prod-smoke.spec.ts`
- **HOLD:** production Worker bootstrap until remote preview upload/remeasure confirms Worker gzip under **8.5 MiB**
- Do **not** change DNS, create prod Workers, or sync prod secrets in this phase

## Explicitly deferred (not cutover blockers)

| Status | Item | Note |
|:------:|------|------|
| ⚪ | **IPI-847 · CF-BUNDLE-221 — Mermaid/KaTeX browser CDN fallback + stub test coverage** | Non-blocking unless launch requires diagrams/equations |
| ⚪ | **IPI-900 · CF-BUNDLE-224 — Harden CopilotKit web-inspector stub against upstream drift** | Low — after 848 unless CopilotKit bump imminent; not CF-SMOKE-002 |
| ⚪ | Hyperdrive / Mastra storage (**IPI-616** → **IPI-619**…) | Separate from DNS cutover |
| ⚪ | Native AI routing (**IPI-594** family) | Separate lane |

## Done / not in remaining list

Pointer only: **IPI-849 · CF-BUNDLE-222** (#716 + #722), **IPI-606**, **IPI-472**, **IPI-632**, **IPI-627** (preview), **IPI-706**, **IPI-709** (baseline), **IPI-595**, **IPI-794**.
