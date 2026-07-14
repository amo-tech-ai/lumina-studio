# CRM Won/Lost Conversion — Live Browser Test Log (IPI-367)

Full audit report: [`tasks/AUDIT/ipi-367-real-world-browser-workflow-audit.md`](../AUDIT/ipi-367-real-world-browser-workflow-audit.md)

Quick-reference log of what was actually driven through the real running app (`main` @ `06a7e2eb`, live Supabase project `nvdlhrodvevgwdsneplk`) on 2026-07-12.

| Test | Method | Result |
|---|---|---|
| Won, no existing brand | Browser click-through | 🟢 pass |
| Won, existing brand (reuse, no dupe) | Browser click-through | 🟢 pass |
| Lost | Browser click-through | 🟢 pass |
| Cross-org company — won | Browser click-through | 🟢 pass (403, full rollback) |
| Cross-org company — lost | Browser click-through | 🟢 pass (403, full rollback) |
| Escape during in-flight approval | Browser + delayed fetch | 🟢 pass (dialog stays open, one final state) |
| Failure then retry | Browser + forced client failure | 🟢 pass (revert, re-enable, retry once) |
| 400 / 404 / 409 / 403 status codes | Direct authenticated fetch | 🟢 pass, clean JSON, no SQL leak |
| Mobile (375×812) approval dialog | Viewport resize + screenshot | 🟢 pass, 58px touch target |
| Tablet (768×1024) approval dialog | Viewport resize + screenshot | 🟢 pass |
| Console errors / hydration warnings | Full session console capture | 🟢 zero |
| Viewer role rejection | RPC-level (earlier session pass, same live project) | 🟡 not re-driven via browser this pass |
| Cross-org user rejection | RPC-level (earlier session pass, same live project) | 🟡 not re-driven via browser this pass |
| 401 unauthenticated | — | ⚪ not reproduced (same-origin fetch always carries session cookie) |

All test fixtures (companies, deals, brands, foreign org) created via Supabase MCP for this run were deleted afterward — verified zero rows remain.

See the full audit doc for screenshots-in-context, evidence detail, scoring, and the production verdict (**GO**, 93/100).
