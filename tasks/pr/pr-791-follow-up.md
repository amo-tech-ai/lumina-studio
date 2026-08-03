# Follow-up Work — IPI-915 · AUTH-FIX (Sign-out E2E evidence hardening)

**Scope reviewed:** `tasks/cloudflare/tests/ipi-724-e2e-preview-journey/` (runner + regenerated evidence artifacts). Production `SignOutButton` fix tracked separately in sibling PR #764 (merged `b12e4a5d39d70c7b15f55178ddf31102aaa5cb0e`, 2026-08-03T20:14:31Z).

**Merge record:** `docs/pr-reviews/PR-791-MERGE-RECORD-2026-08-03.md`

---

## Unresolved risks

### Soft performance regression not yet investigated

`metadata.json` at merge (`fe1826dc`) records `command_center_ms: 14064` against a **5000 ms** soft budget (`soft_perf_pass: false`). PR #791 explicitly calls this out as known preview latency debt, not a sign-out regression, but no active investigation owns the **~3×** budget overrun. Prior evidence (2026-07-20) recorded **7711 ms** — latency **degraded further**, not improved.

**Suggested owner:** **IPI-726 · PERF-001 — Improve Command Center Initial Load** (existing backlog issue) plus a new follow-up issue filed post-merge with updated evidence anchor.

### Evidence validity vs sibling PR #764

**#764 was not covered.** Recorded `worker_version_created_on` (`2026-08-02T04:46:48Z`) predates #764's merge (`2026-08-03T20:14:31Z`). The runner's checks exercise `POST /auth/signout` / cookies but do not prove `SignOutButton` `keepalive: true`. Re-run evidence only against a preview Worker deployed from post-#764 `main`.

### Stale fallback messaging in the runner

`run-e2e.mjs` (line ~744, `main` @ `fe1826dc`) still hardcodes:

```text
Needs Fix — missing Sign out UI (hard AC; blocked on IPI-725 / PR #519)
```

for any future `12_signout_ui` failure. That message references a ticket/PR pairing that predates this fix and is no longer the active blocker path — if sign-out regresses again, the recommendation text will misdirect reviewers toward resolved, unrelated work instead of current runner/product code.

---

## Missing tests

### CI wiring gap is narrower than “manual-only”

`.github/workflows/ci.yml` already has **`verify-copilot-preview`**, which runs `npm run verify:copilot` and delegates to this IPI-724 `run-e2e.mjs` for same-repo pushes/PRs. So **IPI-938 must not claim “no PR CI”** — that would duplicate existing coverage.

Genuine gaps (if still desired):
- scheduled / nightly preview evidence refresh;
- fork-PR / Dependabot paths where the job is skipped or cannot use secrets;
- asserting the **final** `13f` manual-redirect contract against freshly regenerated evidence (current checked-in `metadata.json` still shows `status: 200` follow-redirect capture under runner SHA `5a708fa5…`).

Related: **IPI-238 · FIX — Playwright E2E in CI pipeline** (backlog), **IPI-850 · Test Cloudflare Preview** (Done — stub path).

### No test locks in `ai_health.adapterAvailable` removal

Evidence only carries an advisory note when `adapterAvailable` reappears. There is no hard/soft criterion in `run-e2e.mjs` that fails the run if `adapterAvailable` reappears in `/api/ai/health`, so the regression the note warns about would not be caught automatically.

---

## Deferred scope

| Item | Status |
|------|--------|
| Sibling PR #764 (`keepalive: true` production fix) | ✅ Merged — confirm fresh preview deploy built from post-#764 `main`; regenerate evidence if capture predates deploy |
| Command Center soft-perf budget breach (~14 s vs 5 s) | Deferred investigation — see **IPI-726** + new follow-up issue |
| PR #775 · IPI-582 · PLN-S1E — Planner view preferences | Out of scope for IPI-915; verify separately before merge (do not bundle) |

---

## Documentation drift

- `run-e2e.mjs` hardcoded failure-path recommendation still cites "blocked on IPI-725 / PR #519" — generalize or update to reflect that sign-out UI is implemented (IPI-725 Done, IPI-739 Done).
- Merge record and this doc should be linked from **IPI-915** Linear issue comments if not already.

---

## Cleanup tasks

### Credential rotation (do not drop)

Predecessor evidence runs recorded `qa_rotation_required: true` / instructions to rotate `qa@ipix.test` and revoke sessions if a full HAR escaped a PR tip. The #791 capture removed those security/audit fields without citing a completed rotation. **Keep this open until rotation is confirmed externally** — do not classify it as stale cleanup.

Other cleanup: documentation-drift item above only; no dead code found in the merged diff.

---

## Suggested follow-up tasks (Linear)

**Do not reuse IPI-916 / IPI-917 / IPI-918** — those IDs already exist for unrelated work (Error monitoring, Lean Canvas wizard, Production package generator). Post-merge issues filed 2026-08-03:

| Issue | Title |
|-------|-------|
| [IPI-937](https://linear.app/amo100/issue/IPI-937) | **IPI-937 · PERF-DEBT — Investigate Command Center Preview Load Regression (~14s vs 5s Soft Budget)** — relates to **IPI-726** |
| [IPI-938](https://linear.app/amo100/issue/IPI-938) | **IPI-938 · CI-GATE — Scheduled / fork-PR coverage for IPI-724 preview E2E** (narrow scope — `verify-copilot-preview` already covers same-repo PRs) |
| [IPI-939](https://linear.app/amo100/issue/IPI-939) | **IPI-939 · EVIDENCE-DRIFT — Update Stale Sign-out Failure Message and Verify PR #764 Deployment Coverage in Preview Evidence** |

**Related merged PRs:**

| PR | Merge SHA | Title |
|----|-----------|-------|
| #764 | `b12e4a5d39d70c7b15f55178ddf31102aaa5cb0e` | **IPI-915 · AUTH-FIX — Keepalive logout so Sign out clears the session** |
| #791 | `fe1826dc827791e5341c280ed6f2f8b21378c090` | **IPI-915 · AUTH-FIX — E2E evidence: Sign out posts /auth/signout on preview** |
