# Follow-up Work — IPI-915 · AUTH-FIX (Sign-out E2E evidence hardening)

**Scope reviewed:** `tasks/cloudflare/tests/ipi-724-e2e-preview-journey/` (runner + regenerated evidence artifacts). Production `SignOutButton` fix tracked separately in sibling PR #764 (merged `b12e4a5d39d70c7b15f55178ddf31102aaa5cb0e`, 2026-08-03T20:14:31Z).

**Merge record:** `docs/pr-reviews/PR-791-MERGE-RECORD-2026-08-03.md`

---

## Unresolved risks

### Soft performance regression not yet investigated

`metadata.json` at merge (`fe1826dc`) records `command_center_ms: 14064` against a **5000 ms** soft budget (`soft_perf_pass: false`). PR #791 explicitly calls this out as known preview latency debt, not a sign-out regression, but no active investigation owns the **~3×** budget overrun. Prior evidence (2026-07-20) recorded **7711 ms** — latency **degraded further**, not improved.

**Suggested owner:** **IPI-726 · PERF-001 — Improve Command Center Initial Load** (existing backlog issue) plus a new follow-up issue filed post-merge with updated evidence anchor.

### Evidence validity vs sibling PR #764

The runner's sign-out checks (`12_signout_ui`, `13c`–`13f`) exercise `POST /auth/signout` and cookie clearing directly; they do not specifically prove the `SignOutButton` component's `keepalive: true` behavior from PR #764. `deployment_git_sha` is intentionally null (Workers versions API limitation), so nothing in the evidence cryptographically proves the deployed preview Worker includes #764's fix at capture time — only that a click-triggered signout worked after #764 had merged.

### Stale fallback messaging in the runner

`run-e2e.mjs` (line ~744, `main` @ `fe1826dc`) still hardcodes:

```text
Needs Fix — missing Sign out UI (hard AC; blocked on IPI-725 / PR #519)
```

for any future `12_signout_ui` failure. That message references a ticket/PR pairing that predates this fix and is no longer the active blocker path — if sign-out regresses again, the recommendation text will misdirect reviewers toward resolved, unrelated work instead of current runner/product code.

---

## Missing tests

### No CI wiring

`run-e2e.mjs` is invoked manually against the live preview Worker; PR #791 does not add a scheduled or PR-triggered CI job to rerun it automatically. A future sign-out regression would only surface on the next manual evidence pass.

Related existing issues: **IPI-238 · FIX — Playwright E2E in CI pipeline** (backlog), **IPI-850 · Test Cloudflare Preview** (Done — stub path only).

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

None beyond the documentation-drift item above; no dead code, unused variables, or leftover debug artifacts were found in the merged diff.

---

## Suggested follow-up tasks (Linear)

**Do not reuse IPI-916 / IPI-917 / IPI-918** — those IDs already exist for unrelated work (Error monitoring, Lean Canvas wizard, Production package generator). Post-merge issues filed 2026-08-03:

| Issue | Title |
|-------|-------|
| [IPI-937](https://linear.app/amo100/issue/IPI-937) | **IPI-937 · PERF-DEBT — Investigate Command Center Preview Load Regression (~14s vs 5s Soft Budget)** — relates to **IPI-726** |
| [IPI-938](https://linear.app/amo100/issue/IPI-938) | **IPI-938 · CI-GATE — Wire IPI-724 Preview E2E Runner into Scheduled/PR CI** |
| [IPI-939](https://linear.app/amo100/issue/IPI-939) | **IPI-939 · EVIDENCE-DRIFT — Update Stale Sign-out Failure Message and Verify PR #764 Deployment Coverage in Preview Evidence** |

**Related merged PRs:**

| PR | Merge SHA | Title |
|----|-----------|-------|
| #764 | `b12e4a5d39d70c7b15f55178ddf31102aaa5cb0e` | **IPI-915 · AUTH-FIX — Keepalive logout so Sign out clears the session** |
| #791 | `fe1826dc827791e5341c280ed6f2f8b21378c090` | **IPI-915 · AUTH-FIX — E2E evidence: Sign out posts /auth/signout on preview** |
