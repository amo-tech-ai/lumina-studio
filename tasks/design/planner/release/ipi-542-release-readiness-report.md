# IPI-542 · PLN-REL-001 — Release readiness report

**Issue:** [IPI-542 · PLN-REL-001 — Planner Staging Deployment, Rollback, and Production Verification](https://linear.app/amo100/issue/IPI-542)  
**Report updated (UTC):** 2026-07-20T05:35:00Z  
**Evidence base:** live Linear · `origin/main` @ `c640f01e` · staging Supabase `wtuhdynujhszsbwxlbdi` · Vercel Preview `release/ipi-542-staging` · Playwright desktop smoke + alias rollback  
**Scope of this document:** docs / evidence only — **no production deploy, no production Supabase, no application code change in the evidence PR.**

---

## Executive verdict

Option A (desktop read-only Planner Phase 1) **staging drill completed** on a dedicated Vercel Preview branch and a separate Supabase staging project. Hub, Dashboard, Workspace shell, Settings Members, assignment visibility, and Vercel **website** rollback all passed with disposable fixtures. Production cutover remains **NO-GO**.

| Score | Value |
| --- | ---: |
| **Readiness (Option A staging drill)** | **90 / 100** |
| Production cutover readiness | **NO-GO** (not attempted) |
| Can IPI-542 be marked Done for Option A? | **Yes, with residual warnings below** — after this evidence PR is reviewed |

---

## GO / NO-GO

| Decision | Result |
| --- | --- |
| **Option A — Smaller Phase 1 staging drill** | **GO (executed)** — evidence in this report |
| **Full AC / Phase 1.1** (real views, mutations, approvals, mobile) | **NO-GO / deferred** |
| **Production cutover (`www.ipix.co` / prod Vercel / prod Supabase)** | **NO-GO** |

---

## Reduced Phase 1 scope

Verified in this drill:

- Planner Hub
- Planner Dashboard
- Planner Workspace shell + empty view tabs
- Planner Settings Members
- Assigned / unassigned visibility
- Role / assignment permission behavior (IPI-647)
- IPI-544 function-security migrations present on staging ledger (via full migration push)
- Desktop browser behavior
- Vercel website rollback (branch alias → prior Preview deployment)
- Post-rollback smoke

---

## Deferred Phase 1.1 scope

Explicitly **not** tested / not claimed:

- **IPI-579 · PLN-S1B — Planner Timeline Read-Only View**
- **IPI-580 · PLN-S1C — Planner Kanban and List Views**
- **IPI-581 · PLN-S1D — Planner Calendar View**
- **IPI-582 · PLN-S1E — Planner Task Detail and Safe Mutations**
- Approval and schedule-shift flows (**IPI-483** runtime still unavailable on Dashboard)
- **IPI-557 · PLN-S7 — Tablet and Mobile Planner Layouts**

---

## Release identity

| Field | Value |
| --- | --- |
| Release id | `PLN-P1-20260720-eb1608de` (smoke RC) · tip after rollback-pair `33a6487a` |
| Base main SHA | `c640f01e82f3525518300108d2ad3b17db17adec` |
| Smoke RC Git SHA | `eb1608de3a7f…` (`chore(ipi-542): trigger staging preview deploy for release drill`) |
| Rollback-pair tip SHA | `33a6487af717…` (`chore(ipi-542): second staging preview for rollback pair`) |
| Vercel project | `ipix-operator` · `prj_jor9hPS4Yq6LJTu8rAHyPMLms4e9` |
| Smoke RC deployment ID | `dpl_J1Gu4kVmwmGJrcQtqWnRkUjMFYJx` |
| Smoke RC commit URL | `https://ipix-operator-73w8143rh-mdeai.vercel.app` |
| Branch URL (stable QA) | `https://ipix-operator-git-release-ipi-542-staging-mdeai.vercel.app` |
| Rollback-pair deployment ID | `dpl_2chyjndpXinBLi5fWd81mCAXWNxj` |
| Rollback-pair commit URL | `https://ipix-operator-j0x80qof5-mdeai.vercel.app` |
| Smoke RC created | 2026-07-20T05:19:10Z (approx from Vercel inspect EDT) |
| Branch after drill | Alias restored to RC tip `dpl_2chyjndp…` |

---

## Staging environment

### Vercel

| Item | Value |
| --- | --- |
| Environment | Preview |
| Branch | `release/ipi-542-staging` |
| Protection | Standard — `ssoProtection.deploymentType = all_except_custom_domains` (Vercel Authentication) — confirmed via 302 → `vercel.com/sso-api` without bypass |
| Branch-scoped env | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL` → staging only for this branch (global Preview env left pointing at prior shared config) |
| Automation bypass | Created for drill (`note: IPI-542 planner staging drill`); secret **not** committed |
| Production | **Not modified** |

### Supabase

| Item | Value |
| --- | --- |
| Project name | `ipix-planner-staging` |
| Project ref | **`wtuhdynujhszsbwxlbdi`** |
| Region | `us-east-2` |
| Status | `ACTIVE_HEALTHY` |
| Production ref (forbidden for drill) | `nvdlhrodvevgwdsneplk` — **not used** |
| Exposed schemas (PostgREST) | `public,graphql_public,planner` (aligned to production after create) |
| Auth `site_url` | branch Preview URL |
| Customer data | **None copied** — disposable fixtures only |
| Migration ledger head | **`20260720032827`** (`planner_bootstrap_before_insert.sql`) |

**Migration note:** Fresh-project push failed on `20260719010000_ipi680_revoke_anon_graphql_execute.sql` (`graphql.resolve` missing). Safe forward path: applied available revoke for `graphql_public.graphql`, `migration repair … applied`, then pushed remaining migrations including IPI-647. Follow-up: make that revoke migration idempotent on fresh projects (separate ticket).

---

## Migration and RLS evidence

| Check | Result |
| --- | --- |
| `supabase db push --linked` (staging) | ✅ Complete through `20260720032827` |
| `supabase migration list --linked` | ✅ Local/remote matched at head |
| `supabase db lint --linked` | ⚠️ Warnings only on `public.planner_shift_task` cast types (pre-existing pattern) |
| `npm run supabase:verify` (staging URL/anon) | ✅ `tasks` / `profiles` / `assets` / `shoots` ok against `wtuhdynujhszsbwxlbdi` |
| `npm run supabase:verify-rls` (staging) | ⚠️ Partial — most org/asset RLS ok; CRM convert-deal probes failed on fresh DB; planner probes initially failed until `planner` schema was exposed, then fixtures proved IPI-647 |
| API RLS probe (fixtures) | ✅ Assigned sees instance `1`; same-org unassigned sees `0` |
| Staging host in Preview | ✅ Confirmed `https://wtuhdynujhszsbwxlbdi.supabase.co` during Hub navigation |

---

## Desktop smoke matrix

Base: branch URL · deploy `dpl_J1Gu4kVmwmGJrcQtqWnRkUjMFYJx` · desktop 1440×900 · Vercel bypass header for automation only.

| # | Check | Result |
| --- | --- | --- |
| 1 | Assigned login | ✅ → `/app/onboarding` then Planner |
| 2 | Hub loads assigned plan | ✅ plan title visible |
| 3 | Dashboard loads | ✅ `/app/planner/dashboard` |
| 4 | Workspace shell opens | ✅ `/app/planner/{instanceId}` |
| 5 | Empty view tabs switch | ✅ 4 tabs, no page errors |
| 6 | Settings Members loads | ✅ `.../settings/members` |
| 7 | Unassigned cannot see plan in Hub | ✅ hidden |
| 8 | Unassigned direct Workspace URL | ✅ enumeration-safe not-found pattern |
| 9 | Staging Supabase traffic | ✅ confirmed in follow-up capture (first automated check raced listeners) |
| 10 | Console | ⚠️ CopilotKit `/api/copilotkit` **503** on Preview (AI runtime) — Planner surfaces still usable |
| 11 | Page errors | ✅ none |

Screenshots: `tasks/design/planner/release/evidence/ipi-542/01-*.png` … `08-*.png`.

---

## Permission matrix

| Actor | Org member | Planner assignment | Hub | Direct Workspace |
| --- | --- | --- | --- | --- |
| Assigned operator | yes (owner) | owner | sees drill plan | opens shell |
| Same-org unassigned | yes (editor) | none | plan hidden | not-found / no plan title |

Matches **IPI-647 · PLN-SEC-002** assignment-aware SELECT (no org-admin bypass).

---

## Application rollback evidence

| Step | Evidence |
| --- | --- |
| Supported procedure verified | `vercel alias set <prior-deployment-host> <branch-alias>` (CLI `vercel alias set`) — Preview branch URLs are aliases; Instant Rollback UI is Production-oriented |
| Previous known-good | `dpl_J1Gu4kVmwmGJrcQtqWnRkUjMFYJx` (`eb1608de`) after tip advanced to `dpl_2chyjndp…` (`33a6487a`) |
| Rollback executed | Branch alias → `ipix-operator-73w8143rh-mdeai.vercel.app` (D1) |
| Success line | `Success! … now points to ipix-operator-73w8143rh-mdeai.vercel.app` |
| Production | Untouched |

---

## Database forward-recovery rule

- Website rollback **does not** change Postgres.
- Staging migration head stayed `20260720032827` across rollback.
- **Never** roll back by deleting/editing historical migrations.
- **Never** revert IPI-647 assignment-aware RLS.
- Database recovery = **new forward migration** only.

---

## Post-rollback verification

| Check | Result |
| --- | --- |
| Application loads | ✅ |
| Authentication works | ✅ |
| Hub + assigned plan | ✅ |
| Unassigned deny | ✅ |
| Staging DB instance row unchanged | ✅ same id/name; count `0-0/1` before and after |
| RC restored to branch URL | ✅ alias set back to `dpl_2chyjndp…` |

Evidence: `09-post-rollback-hub-*.png`, `post-rollback-smoke.json`.

---

## Errors and warnings

1. **IPI-680 GraphQL revoke migration** not replay-clean on empty projects — repaired forward for staging.
2. **`supabase:verify-rls` full suite** not fully green on fresh staging (CRM convert-deal path); Planner assignment RLS proven via dedicated fixtures + UI smoke.
3. **CopilotKit 503** on Preview — out of Option A Planner surface; do not treat as Planner Hub failure.
4. **Onboarding redirect** after login for disposable users — expected; operators still reached Planner routes.
5. **Protection bypass secret** exists on the Vercel project for automation — rotate/revoke when drill is closed if not needed for ongoing QA.

---

## Residual risks

- Staging Preview still shares non-Supabase Preview secrets (Gemini/Groq/etc.) with other Preview deploys — only Supabase URL/keys were branch-scoped.
- Fresh staging DB lacks production edge-function wiring; not required for Option A read paths.
- Phase 1.1 views/mutations/approvals still Backlog — do not market as “full Planner Phase 1 complete.”
- Worktree may remain linked to staging Supabase — re-link to production before any prod migration work.

---

## Production checklist

- [ ] Do **not** point production at staging Supabase
- [ ] Do **not** run this drill against `nvdlhrodvevgwdsneplk`
- [ ] Complete Phase 1.1 tickets before claiming full Planner Phase 1
- [ ] Separate production GO report after Option A + Phase 1.1 + prod verification
- [ ] Keep DB recovery as forward migrations only

---

## Evidence index

| Artifact | Path |
| --- | --- |
| This report | `tasks/design/planner/release/ipi-542-release-readiness-report.md` |
| Smoke results | `tasks/design/planner/release/evidence/ipi-542/smoke-results.json` |
| Post-rollback smoke | `tasks/design/planner/release/evidence/ipi-542/post-rollback-smoke.json` |
| Cleanup log | `tasks/design/planner/release/evidence/ipi-542/cleanup.json` |
| Screenshots | `tasks/design/planner/release/evidence/ipi-542/*.png` |

**Not in git (local only):** `.env.staging.local`, `.local-staging-*`, `.local-vercel-bypass-secret`, fixture passwords.

---

## Cleanup results

Disposable staging fixtures (org, workflow, instance, tasks, assignments, both users) **deleted** — see `cleanup.json`.

---

## Dependency snapshot (unchanged product reality)

| Ticket | Option A relevance |
| --- | --- |
| IPI-526 Hub | ✅ exercised |
| IPI-576 Dashboard | ✅ exercised (approvals still unavailable stub — acceptable for Option A) |
| IPI-578 Workspace shell | ✅ exercised |
| IPI-577 Settings Members | ✅ exercised |
| IPI-647 assignment RLS | ✅ exercised |
| IPI-579/580/581/582/557/483 runtime | Deferred |
