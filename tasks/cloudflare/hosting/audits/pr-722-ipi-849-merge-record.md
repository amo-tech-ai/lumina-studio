# Merge Record

**IPI Task:** [IPI-849 · CF-BUNDLE-222 — Remove CopilotKit web-inspector from Worker bundle](https://linear.app/amo100/issue/IPI-849)  
**PR:** [#722](https://github.com/amo-tech-ai/lumina-studio/pull/722) — IPI-849 · CF-BUNDLE-222 — Complete CopilotKit inspector disable contract  
**Merge SHA (on `main`):** `f2828ed124c4a7bb9414d8d09227358fa27614db` (squash merge)  
**Last PR-branch commit (not on main ancestry as tip):** `edbc30fae778626f6acf7acff99211423318bc45` — `fix(ipi-849): order-independent CopilotKit prop contract assert`  
**Recorded:** 2026-08-01  
**Validation level:** Local Runtime Verified (clean worktree @ merge SHA). Remote Preview: pending. Production: not claimed.

## Squashed commits (PR head history)

- `fix(ipi-849): enableInspector false + stub export contract` (`ea948934`)
- `chore(ipi-849): re-trigger CI after no-changelog label` (`9ae4a3d2`, `b4ef6830`)
- `fix(ipi-849): anchor CopilotKit prop asserts to opening tag` (`3c61a221`)
- `fix(ipi-849): order-independent CopilotKit prop contract assert` (`edbc30fa`)

## Purpose

Sibling PR [#716](https://github.com/amo-tech-ai/lumina-studio/pull/716) stubbed `@copilotkit/web-inspector` out of the Cloudflare Worker bundle, but the operator `<CopilotKit>` provider only set `showDevConsole={false}`. In CopilotKit 1.61.0, `showDevConsole` controls error banners/toasts while inspector visibility on localhost (including `npm run preview`) is controlled separately by `enableInspector`. This PR adds `enableInspector={false}` to the operator provider to match marketing chat, and hardens the OpenNext CI contract so the CF stub export surface cannot silently shrink.

**Single concern:** complete the prop-level inspector disable contract + stub export / prop regression tests. No alias/DNS/docs/bundle-composition changes.

## Files / systems changed

| Path | Change |
| --- | --- |
| `app/src/app/(operator)/layout.tsx` | `enableInspector={false}` + comments for both disable props / CF stub |
| `app/src/test/opennext-ci-contract.test.ts` | Stub exports: `defineWebInspector`, `WEB_INSPECTOR_TAG`, `WebInspectorElement`, `ɵCpkThreadDetails`, `default`; order-independent regex requiring both props on `<CopilotKit>` opening tag |

No changes to Cloudflare stub aliases, Worker deploy/DNS, documentation, or ban-list gate.

## Tests and CI results

| Check | Result | Evidence class |
| --- | --- | --- |
| `npx vitest run src/test/opennext-ci-contract.test.ts` | 9/9 passed | Local (post-merge @ `f2828ed1`) |
| `npm run lint` | clean | Local |
| `npm run typecheck` | clean | Local |
| `npm run build:cf` + `check:worker-bundle` | OK | Local |
| Worker dry-run gzip | **7861.24 KiB (7.677 MiB)** — below 8.5 WARN | Local |
| Real `node_modules/@copilotkit/web-inspector` metafile hits | **0** (stub-only path) | Local |
| CI `app-build` | SUCCESS (at merge) | CI |
| Remote preview upload/remeasure | **Not run** | Remote Preview — pending |
| Production Worker / DNS | **Not touched** | Production — HOLD |

## Production impact

Operators debugging Brand Hub / Command Center chat on localhost or Cloudflare preview will no longer see the real CopilotKit inspector (`enableInspector` defaults on for localhost when unset). Operator and marketing providers now share the same inspector/dev-console disable contract.

No Worker bundle graph change in this PR — aliasing from #716 already prevented inspector code from shipping. This PR completes the prop contract and regression coverage.

## Known limitations

- Props alone do not remove `@copilotkit/web-inspector` from the static import graph — that remains the `IPIX_CF_BUNDLE_STUBS` alias (#716).
- Stub contract validates **shape**, not real-package export parity → tracked as **IPI-900 · CF-BUNDLE-224**.
- No runtime/E2E proof of inspector non-mount → soft coverage under **IPI-850 · CF-SMOKE-002** / **IPI-734 · COPILOT-VERIFY-001**.

## Rollback

Revert merge commit `f2828ed1` (or restore prior `showDevConsole={false}`-only layout + looser contract asserts). No migrations, infra, or deploy unwind.

## Follow-ups

| Task | Verdict |
| --- | --- |
| **IPI-848 · CF-BUNDLE-223** — metafile ban-list hard-fail (incl. web-inspector) | **GO** next |
| **IPI-734 · COPILOT-VERIFY-001** — thin verify wrapper | **GO** (∥ 848) |
| **IPI-850 · CF-SMOKE-002** — post-stub browser journey | **GO** after AC de-dupe vs 734 |
| **IPI-900 · CF-BUNDLE-224** — stub ↔ real export parity | Low / after 848 unless CopilotKit bump imminent |
| Production Worker bootstrap | **HOLD** until remote preview remeasure confirms gzip under 8.5 MiB |
| DNS cutover (**IPI-631**) | **HOLD** |
