# Follow-up Work — PR #722

**IPI-849 · CF-BUNDLE-222 — Complete CopilotKit inspector disable contract**  
**Merge on `main`:** `f2828ed124c4a7bb9414d8d09227358fa27614db`

## Scope check

Action applies: PR touches `app/src/app/(operator)/layout.tsx` and `app/src/test/opennext-ci-contract.test.ts` (application source/test). Not lockfile-only.

## Verified already resolved (not re-raised)

- Operator and marketing providers both set `enableInspector={false}` + `showDevConsole={false}` — no other `<CopilotKit>` mounts in `app/src` needing alignment.
- Contract test asserts all five stub exports individually plus default object shape.
- Operator prop assertion is order-independent via lookahead regex on the opening tag.
- Post-merge local `build:cf`: gzip **7.677 MiB**; **0** real `node_modules/@copilotkit/web-inspector` metafile hits.

## Genuine remaining risks / gaps

| Gap | Owner | Notes |
| --- | --- | --- |
| Stub validates shape, not real-package parity | **IPI-900 · CF-BUNDLE-224** | New Low backlog issue — do **not** overload IPI-850 |
| No runtime proof inspector is suppressed | Soft under **IPI-850 · CF-SMOKE-002** / **IPI-734** | Static JSX regex only today |
| Transitive `@copilotkit/web-inspector` unpinned | **IPI-900** | Optional exact `devDependency` pin |
| Upstream build-flag to retire alias | Watch item on **IPI-900** | Comment already in `cf-web-inspector-stub.mjs` |

## ID correction (do not ship the draft mislabel)

The draft follow-up named this **“IPI-850 · CF-BUNDLE-223”**. That is wrong:

| Correct ID | Spec | Role |
| --- | --- | --- |
| **IPI-848** | CF-BUNDLE-223 | Metafile regression gate + composition CI |
| **IPI-850** | CF-SMOKE-002 | Worker/operator post-stub browser smoke |
| **IPI-900** | CF-BUNDLE-224 | Stub ↔ real export drift hardening |

## Next cutover actions

| Task | GO/HOLD |
| --- | --- |
| **IPI-848 · CF-BUNDLE-223** | **GO** — web-inspector → hard-fail ban list |
| **IPI-734 · COPILOT-VERIFY-001** | **GO** — thin wrapper; ∥ 848 |
| **IPI-850 · CF-SMOKE-002** | **GO** after AC de-dupe vs 734 |
| **IPI-900 · CF-BUNDLE-224** | Later / Low |
| Production Worker bootstrap | **HOLD** until remote preview remeasure |
| DNS (**IPI-631**) | **HOLD** |
