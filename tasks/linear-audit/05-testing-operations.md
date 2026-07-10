# Linear Audit — Testing, CI, Deployment, Observability, Rollback & Documentation/Architecture

## Stack 14 — Testing, CI, deployment, observability, rollback (score 39/100 🔴)

### Priority issues (4)

| Dot | Task | Current status | Correct status | Action | Exact correction | Blocker |
|---|---|---|---|---|---|---|
| 🔴 | IPI-453 — FIX Production Error Boundaries for Operator Routes | In Review | In Review (keep) | keep | Real commit `5c66d2bd` exists only on branch `ipi/453-error-boundaries`, **open PR #267**, not merged. Confirmed zero `error.tsx` files anywhere under `app/src/app` on `origin/main`. Do not mark Done until #267 merges — production currently shows default Next.js error screens on unhandled route errors. | PR #267 merge |
| 🟢 | IPI-124 — SEC-002 Remove VITE_GEMINI_API_KEY from production bundle | Done | Done | keep | Zero `VITE_GEMINI_API_KEY`/`NEXT_PUBLIC_GEMINI*`/`NEXT_PUBLIC_*_API_KEY` violations anywhere in `app/`. | none |
| 🟢 | IPI-451 — BE-SD1 Database seed data | Done | Done | keep | `supabase/seed.sql` exists (13KB). | none |
| 🟢 | IPI-121 — PLT-012 Vendor Next.js operator app into monorepo + CI split | Done | Done | keep | `app/` is not a nested repo, tracked in main repo; `app-build` CI job exists. Note: the root Vite app it was split *from* (`src/`) no longer exists at all — the "two-job CI split" framing is now historical, not a correction, just context. | none |

### Rewrite candidates

- **IPI-118 — DEVX-003 npm audit triage** — vulnerability counts are stale. Re-ran `npm audit --omit=dev` in `app/`: now 22 vulnerabilities (1 critical, 1 high, 9 moderate, 11 low), not the old "21: 2 critical, 2 high." Drift is expected as transitive deps update — refresh the numbers, not a red flag.
- **IPI-224 — FIX Playwright bootstrap** — partially stale. `@playwright/test` and `test:e2e` script **both now exist** in root `package.json` (previously claimed missing). What's genuinely still missing: `webServer` config in `playwright.config.ts` — narrow the scope to just that.

### Close/cancel candidates

- **IPI-117 — DEVX-002 Fix root Vite ESLint** — recommend **close as moot/stale**. Root `src/` (the Vite app) no longer exists in the repo at all. The root `eslint.config.js` is already scoped correctly and there's no `lint` script in the root `package.json` to even run — the whole premise no longer has a subject.
- **IPI-232, IPI-120, IPI-89, IPI-96** — all correctly Canceled, reference retired Vite/Vercel tooling, consistent with confirmed Vite retirement. No action.

### Missing tasks (verified gaps, no existing owner)

- **No CI job builds the OpenNext bundle.** `.github/workflows/ci.yml` has one workflow, `app-build` runs plain `next build`, never `opennextjs-cloudflare build`. Matches CF-MIG-111 (0%) — no new task needed.
- **No rollback script exists anywhere.** Only an archived doc (`docs/architecture/diagrams/archive/49-rollback-strategy.md`). Matches CF-MIG-810 (0%, "Vercel still prod") — no new task needed.
- **Zero observability/monitoring tooling in any `package.json`** (root, `app/`, `services/cloudflare-worker/`) — no Sentry, Datadog, or OpenTelemetry dependency anywhere. This is a real gap with **no existing Linear issue owning it** — flagging to the team as an uncovered gap rather than authoring a speculative new issue here.

### Rest batch (14 issues) — patterns

Two groups. (a) The IPI-222 "June 28 audit" epic family (222, 235, 238, 224, 92) — correctly Backlog, chained behind a certification gate referencing issues (223/225-230/231-234) outside this stack's dataset, so the full chain couldn't be re-verified — flagged as partially unverified. (b) Standalone DEVX Backlog items (119, 118, 117, 116, 6) — all accurately reflect unresolved gaps except IPI-117 (recommend close, see above).

### Unverifiable this pass

PR #286's "CI green" claim (secondary-source only, not independently re-run); Cloudflare-side live infrastructure state (no MCP/OAuth access this session); the IPI-223/225-230/231/233/234 dependency chain (outside this stack's dataset).

---

## Stack 15 — Documentation and architecture

**Finding: no dedicated Linear track exists for this stack.** Every issue whose title mentioned architecture/ADR/documentation/audit was captured by a more specific feature stack first during categorization (e.g. `IPI-469 — CF-000 Cloudflare Platform Architecture` correctly lives under Cloudflare, not a generic "docs" bucket). Cross-checked: zero issues remained unclaimed after the other 14 stacks' keyword/label rules ran, confirming this isn't a script gap — architecture and documentation work is currently tracked as a property of whichever feature it documents, not as its own line item anywhere in Linear.

This is worth surfacing as a process observation, not a Linear correction: as the number of "false Done" and "stale proof link" findings in this audit shows (IPI-336, IPI-351, IPI-286, the CF-000/AGENT-001 pair, several stale path citations across Design V2), documentation accuracy is a recurring, cross-cutting failure mode that no single stack currently owns fixing. No new Linear issue is proposed here per the "no invented tasks" rule — but if the team wants a home for doc-hygiene work going forward, this audit is evidence that one doesn't currently exist.
