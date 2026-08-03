# PR #791 — Merge Record

**Task:** **IPI-915 · AUTH-LOGOUT-001 — Fix Sign-Out Session Invalidation** (evidence-only slice; production keepalive fix in sibling PR #764)
**PR:** `IPI-915 · AUTH-FIX — E2E evidence: Sign out posts /auth/signout on preview` (#791)
**Squash merge SHA (`main`):** `fe1826dc827791e5341c280ed6f2f8b21378c090`
**PR head tip (pre-squash):** `f9dcdaa03c50997c3795964c32dac7d8caad073b` — `fix(ipi-915): harden sign-out E2E probes and portable evidence paths`
**Author:** amo-tech-ai (Cursor co-author) · **Merged:** 2026-08-03 17:07:19 -0400 (`2026-08-03T21:07:20Z`)

---

## Purpose

Docs/evidence-only PR that hardens the **IPI-724 · CF-UJ-018 — End-to-End Preview User Journey Validation** runner so Sign out is only marked successful when a real `POST /auth/signout` response is observed, and regenerates the corresponding preview journey evidence artifacts. No production authentication UI was changed in this PR; the related `SignOutButton` `keepalive: true` fix lives in sibling PR #764 (merged earlier the same day).

## Files / systems changed

All changes are confined to `tasks/cloudflare/tests/ipi-724-e2e-preview-journey/`:

| File | Change |
|------|--------|
| `run-e2e.mjs` | Runner logic: waits for login hydration before filling credentials; registers the `/auth/signout` response listener before the click; validates POST status/redirect/`Set-Cookie` via `headerValues("set-cookie")`; adds anonymous-session check, post-signout refresh check, idempotent second sign-out check, and local-storage evidence capture; waits for the app's own logout redirect before falling back to `/login`; sanitizes `blob:` network URLs to real host/path; writes `evidence_out` as repo-relative. |
| `metadata.json` | Regenerated run metadata: new deployment/version identifiers and timestamps; `12_signout_ui` now passes; new `13c_signout_request`, `13d_sb_cookies_cleared`, `13e_refresh_logged_out`, `13f_signout_idempotent` criteria; `overall_pass: true`, `hard_ac_pass: true`, `recommendation: "Done"`. Prior-run security/audit fields (including any `qa_rotation_required` signal) were dropped from this capture — treat rotation as still open unless completed outside this PR (see Known limitations + follow-up doc). |
| `console.json` | Refreshed console diagnostics (two 401 resource errors, updated preload-warning timestamps/URLs). |
| `network-summary.json` | Regenerated network capture (**258** entries vs. **169** in the prior run), including sign-out requests and updated Cloudflare ray IDs; `critical_failures` remains empty. |
| `screenshots/01-login.png`, `02-dashboard.png`, `03-chat.png` | Refreshed evidence screenshots. |

No production code, infrastructure, or database changes were included.

## Tests / CI results

Evidence captured at merge commit against `https://ipix-operator-preview.sk-498.workers.dev` (`worker_version_id: 50bd2987-b728-4b9c-a8da-f2a1e66841d5`, run started `2026-08-03T20:43:31.526Z`):

| Check | Result |
|-------|--------|
| Runner requires observed `POST /auth/signout` before `12_signout_ui` passes | ✅ |
| Hard AC rejects a `signoutError=1` redirect as success | ✅ |
| Evidence `13c_signout_request`: `POST /auth/signout` → 303 → `/login` | ✅ |
| Inert Sign-out control failure path uses `signoutCandidatesProbed` | ✅ implemented in runner (tip commits after evidence capture) |
| `13f_signout_idempotent` | ⚠️ **Unverified against final runner** — checked-in `metadata.json` records `status: 200`, `final_path: "/login"`, `pass: true` under `evidence_runner_git_sha` `5a708fa5…`. Tip commits after capture require `redirect: "manual"` + 3xx `Location` → `/login`; that contract was **not** re-proven by regenerating evidence. Do not treat aggregate `hard_ac_pass: true` as validation of the final 13f gate. |
| `evidence_out` repo-relative; `blob:` URLs sanitized | ✅ in tip runner; evidence `evidence_out` was later normalized in follow-up commits |
| Overall preview journey (as captured) | `overall_pass: true`, `hard_ac_pass: true`, `soft_perf_pass: false` — subject to 13f caveat above |

Documentation-only change set; no app build/test matrix rows apply beyond standard CI green at merge time.

## Production impact

None. This PR only touches test evidence artifacts and the E2E runner script under `tasks/cloudflare/tests/ipi-724-e2e-preview-journey/`. No production authentication UI, API, or deployment configuration was modified.

## Known limitations

- **`soft_perf_pass: false`** — Command Center load after login measured **~14064 ms** against a **5000 ms** soft budget (`command_center_ms: 14064`). Soft criterion only; not a sign-out regression. Prior evidence run recorded **7711 ms** — latency degraded further, not improved. Tracked separately (see follow-up doc + Linear).
- **Evidence is point-in-time** — reflects the preview Worker version deployed at capture time (`worker_version_id` above). Re-verify against a fresh preview deploy if the underlying Worker changes. `deployment_git_sha` is intentionally null (Workers versions API limitation).
- **PR #764 was not covered by this evidence capture.** `worker_version_created_on` is `2026-08-02T04:46:48Z`, while #764 merged at `2026-08-03T20:14:31Z` (`b12e4a5d…`). The tested preview Worker **predates** the `SignOutButton` `keepalive: true` fix. Do not reuse this run as validation of #764 — re-test only after a post-#764 preview deploy.
- **Credential rotation follow-up** — Predecessor evidence runs flagged possible HAR/credential exposure (`qa_rotation_required`). This merge record must not imply that was completed; rotate `qa@ipix.test` / revoke sessions if not already done externally (tracked in follow-up doc).

## Rollback / cleanup notes

No rollback required — no production code or infrastructure changes. To supersede evidence artifacts, re-run `run-e2e.mjs` against a current preview deployment and commit refreshed `metadata.json`, `console.json`, `network-summary.json`, and screenshots as a follow-up docs/evidence PR.

Revert path if needed: `git revert fe1826dc827791e5341c280ed6f2f8b21378c090`.

## Follow-up tasks

| Item | Tracker |
|------|---------|
| Command Center soft-perf regression (~14 s vs 5 s budget) | [IPI-937](https://linear.app/amo100/issue/IPI-937) (also relates to **IPI-726**) |
| Wire IPI-724 preview E2E runner into scheduled/PR CI | [IPI-938](https://linear.app/amo100/issue/IPI-938) |
| Stale sign-out failure message + #764 deployment coverage | [IPI-939](https://linear.app/amo100/issue/IPI-939) |
| Sibling PR #764 production fix | ✅ Merged — re-validate with fresh preview deploy if evidence predates deploy |

See also: `tasks/pr/pr-791-follow-up.md`
