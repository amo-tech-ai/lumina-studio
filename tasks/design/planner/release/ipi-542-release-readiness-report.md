# IPI-542 · PLN-REL-001 — Release readiness report

**Issue:** [IPI-542 · PLN-REL-001 — Planner Staging Deployment, Rollback, and Production Verification](https://linear.app/amo100/issue/IPI-542)  
**Report updated (UTC):** 2026-07-20T05:55:00Z  
**Evidence base:** live Linear · `origin/main` @ `c640f01e` · staging Supabase `wtuhdynujhszsbwxlbdi` · Vercel Preview `release/ipi-542-staging` · Playwright desktop smoke + alias rollback  
**Scope of this document:** docs / evidence only — **no production deploy, no production Supabase, no application code change in the evidence PR.**

---

## Executive verdict (locked)

| Decision | Result |
| --- | --- |
| **Option A staging drill** | **GO** |
| **IPI-542 Option A acceptance criteria** | **Complete after evidence PR #521 merges** |
| **Production release / cutover** | **NO-GO** — this result does **not** approve a production cutover |
| **Readiness score** | **90 / 100** |

Option A (desktop read-only Planner Phase 1) staging drill completed on a dedicated Vercel Preview branch and a separate Supabase staging project. Hub, Dashboard, Workspace shell, assignment visibility, and Vercel **website-only** rollback passed with disposable fixtures. CopilotKit Preview 503 is **outside** the reduced Planner gate. Database recovery requires a **new forward migration**; **never** revert **IPI-647 · PLN-SEC-002** assignment-aware RLS.

---

## GO / NO-GO

| Decision | Result |
| --- | --- |
| **Option A — Smaller Phase 1 staging drill** | **GO** |
| **Full AC / Phase 1.1** (real views, mutations, approvals, mobile) | **NO-GO / deferred** |
| **Production cutover (`www.ipix.co` / prod Vercel / prod Supabase)** | **NO-GO** |

---

## Reduced Phase 1 scope

Verified in this drill:

- Planner Hub
- Planner Dashboard
- Planner Workspace shell + empty view tabs
- Planner Settings route presence (see smoke matrix note on Members path)
- Assigned / unassigned visibility
- Role / assignment permission behavior (**IPI-647 · PLN-SEC-002**)
- **IPI-544** function-security migrations present on staging ledger (via full migration push)
- Desktop browser behavior
- Vercel website rollback (branch alias → prior Preview deployment → restored to RC)
- Post-rollback smoke

---

## Deferred Phase 1.1 scope

Explicitly **not** tested / not claimed complete:

- **IPI-579 · PLN-S1B — Planner Timeline Read-Only View**
- **IPI-580 · PLN-S1C — Planner Kanban and List Views**
- **IPI-581 · PLN-S1D — Planner Calendar View**
- **IPI-582 · PLN-S1E — Planner Task Detail and Safe Mutations**
- Approval and schedule-shift flows (**IPI-483** runtime still unavailable on Dashboard)
- **IPI-557 · PLN-S7 — Tablet and Mobile Planner Layouts**
- CopilotKit / Mastra agent chat on Preview (503 residual — out of Option A gate)
- Tablet / mobile layouts

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
| Smoke RC created | 2026-07-20T05:19:10Z (approx from Vercel inspect) |
| Branch after drill | Alias restored to RC tip `dpl_2chyjndpXinBLi5fWd81mCAXWNxj` |
| Supabase staging ref | `wtuhdynujhszsbwxlbdi` |
| Region | `us-east-2` |
| Migration ledger head | `20260720032827` |

Identity values above agree with `smoke-results.json` (branch URL), `staging-host-probe.json` (host), and rollback narrative (D1 → D2 → restore D2).

---

## Staging environment

### Vercel

| Item | Value |
| --- | --- |
| Environment | Preview |
| Branch | `release/ipi-542-staging` |
| Protection | Standard — `ssoProtection.deploymentType = all_except_custom_domains` (Vercel Authentication) — confirmed via 302 → `vercel.com/sso-api` without bypass |
| Branch-scoped env | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL` → staging only for this branch |
| Automation bypass | Created for drill; secret **not** committed |
| Production | **Not modified** |

### Supabase

| Item | Value |
| --- | --- |
| Project name | `ipix-planner-staging` |
| Project ref | **`wtuhdynujhszsbwxlbdi`** |
| Region | `us-east-2` |
| Status | `ACTIVE_HEALTHY` |
| Production ref (forbidden for drill) | `nvdlhrodvevgwdsneplk` — **not used / not modified** |
| Exposed schemas (PostgREST) | `public,graphql_public,planner` |
| Auth `site_url` | branch Preview URL |
| Customer data | **None copied** — disposable fixtures only |
| Migration ledger head | **`20260720032827`** (`planner_bootstrap_before_insert.sql`) |

**Migration note:** Fresh-project push failed on `20260719010000_ipi680_revoke_anon_graphql_execute.sql` (`graphql.resolve` missing). Safe forward path: applied available revoke for `graphql_public.graphql`, `migration repair … applied`, then pushed remaining migrations including IPI-647. **Do not reopen IPI-680** (security outcome remains Done). Follow-up is fresh-project migration compatibility only (see Residual follow-ups).

---

## Migration and RLS evidence

| Check | Result |
| --- | --- |
| `supabase db push --linked` (staging) | ✅ Complete through `20260720032827` |
| `supabase migration list --linked` | ✅ Local/remote matched at head |
| `supabase db lint --linked` | ⚠️ Warnings only on `public.planner_shift_task` cast types (pre-existing pattern) |
| `npm run supabase:verify` (staging URL/anon) | ✅ against `wtuhdynujhszsbwxlbdi` |
| `npm run supabase:verify-rls` (staging) | ⚠️ Partial — CRM convert-deal probes failed on empty fixtures; Planner assignment RLS proven via dedicated fixtures + UI smoke |
| API RLS probe (fixtures) | ✅ Assigned sees instance `1`; same-org unassigned sees `0` |
| Staging host in Preview | ✅ `wtuhdynujhszsbwxlbdi.supabase.co` |

---

## Desktop smoke matrix

Base: branch URL · smoke RC deploy `dpl_J1Gu4kVmwmGJrcQtqWnRkUjMFYJx` · SHA `eb1608de` · desktop 1440×900 · Vercel bypass header for automation only (secret not in git).

| # | Check | Result |
| --- | --- | --- |
| 1 | Assigned login | ✅ → `/app/onboarding` then Planner |
| 2 | Hub loads assigned plan | ✅ plan title visible (`02-hub-assigned.png`) |
| 3 | Dashboard loads | ✅ `/app/planner/dashboard` |
| 4 | Workspace shell opens | ✅ `/app/planner/{instanceId}` |
| 5 | Empty view tabs switch | ✅ 4 tabs, no page errors |
| 6 | Settings / Members | ⚠️ **Evidence correction:** harness first hit `/settings/members` (no such App Router page; only `/settings` exists for **IPI-577**). `05-settings-members.png` is a marketing **404**, not the Settings UI — false pass because harness accepted HTTP &lt; 500. Members UI was **not** screenshot-verified; Settings route code exists at `/app/planner/[instanceId]/settings`. Residual: re-smoke `/settings` only. |
| 7 | Unassigned cannot see plan in Hub | ✅ hidden (`07-hub-unassigned.png` — 0 plans) |
| 8 | Unassigned direct Workspace URL | ✅ enumeration-safe not-found pattern |
| 9 | Staging Supabase traffic | ✅ `staging-host-probe.json` |
| 10 | Console | ⚠️ CopilotKit `/api/copilotkit` **503** — **outside Option A Planner gate** |
| 11 | Page errors | ✅ none |

Screenshots: `tasks/design/planner/release/evidence/ipi-542/01-*.png` … `10-*.png`.

---

## Permission matrix

| Actor | Org member | Planner assignment | Hub | Direct Workspace |
| --- | --- | --- | --- | --- |
| Assigned operator | yes (owner) | owner | sees drill plan | opens shell |
| Same-org unassigned | yes (editor) | none | plan hidden | not-found / no plan title |

Matches **IPI-647 · PLN-SEC-002** assignment-aware SELECT (no org-admin bypass). Internally consistent with Hub screenshots (assigned shows plan card; unassigned shows empty Hub).

---

## Application rollback evidence

| Step | Evidence |
| --- | --- |
| Supported procedure | `vercel alias set <deployment-host> <branch-alias>` — Preview branch URLs are aliases; Instant Rollback UI is Production-oriented |
| Tip before rollback | `dpl_2chyjndpXinBLi5fWd81mCAXWNxj` (`33a6487a`) |
| Prior known-good (rollback target) | `dpl_J1Gu4kVmwmGJrcQtqWnRkUjMFYJx` (`eb1608de`) |
| Rollback executed | Branch alias → `ipix-operator-73w8143rh-mdeai.vercel.app` (smoke RC) |
| Success | CLI reported branch alias now points at prior deployment host |
| Restore RC | Alias set back to `dpl_2chyjndpXinBLi5fWd81mCAXWNxj` |
| Supabase during rollback | **Unchanged** — migration head remained `20260720032827`; instance row id/name unchanged |
| Production | **Untouched** |

**Rule:** Vercel rollback affects the **website only**. It does not roll back Postgres.

---

## Database forward-recovery rule

- Website rollback **does not** change Postgres.
- Staging migration head stayed `20260720032827` across rollback.
- **Never** roll back by deleting/editing historical migrations.
- **Never** revert **IPI-647 · PLN-SEC-002** assignment-aware RLS.
- Database recovery = **new forward migration** only.

---

## Post-rollback verification

| Check | Result |
| --- | --- |
| Application loads | ✅ |
| Authentication works | ✅ |
| Hub + assigned plan | ✅ (`09-post-rollback-hub-assigned.png`) |
| Unassigned deny | ✅ (`10-post-rollback-hub-unassigned.png`) |
| Staging DB unchanged | ✅ same instance; migration head unchanged |
| RC restored to branch URL | ✅ alias → `dpl_2chyjndp…` |

Evidence: `09-post-rollback-hub-*.png`, `post-rollback-smoke.json`.

---

## Errors and warnings

1. **IPI-680 GraphQL revoke migration** not replay-clean on empty projects — repaired forward for staging. Security outcome of **IPI-680 · SB-SEC-002** remains **Done**; do not reopen. Fresh-project compatibility is a separate follow-up.
2. **`supabase:verify-rls`** not fully green on fresh staging (CRM convert-deal path lacks fixtures). Planner assignment RLS proven via dedicated fixtures + UI. Follow-up under **SB-TEST-003** (not a reopen of **IPI-668 · SB-TEST-001**).
3. **CopilotKit 503** on Preview `/api/copilotkit` — **outside** reduced Planner gate; Planner Hub/Dashboard/Workspace remained usable.
4. **Settings Members screenshot false positive** — see smoke matrix row 6.
5. **Onboarding redirect** after login for disposable users — expected; operators still reached Planner routes.
6. **Protection bypass secret** on Vercel project for automation — rotate/revoke when staging disposition says so.
7. **Secret near-miss (local only):** an unpushed worktree checkpoint briefly staged `.local-staging-*` / `.local-vercel-*` files; commit was **hard-reset and never pushed**. Those paths are **not** on `origin` or in PR #521.

---

## Residual risks

- Staging Preview still shares non-Supabase Preview secrets (Gemini/Groq/etc.) with other Preview deploys — only Supabase URL/keys were branch-scoped.
- Fresh staging DB lacks production edge-function wiring; not required for Option A read paths.
- Phase 1.1 views/mutations/approvals still open — do not market as “full Planner Phase 1 complete.”
- Settings Members UI needs a clean re-smoke against `/app/planner/{id}/settings` only.

---

## Residual follow-ups (tracking)

| Follow-up | Ticket |
| --- | --- |
| Fresh-project GraphQL revoke migration safety | **[IPI-728 · SB-MIG-002 — Make pg_graphql Revoke Migration Fresh-Project Safe](https://linear.app/amo100/issue/IPI-728)** — does **not** reopen **IPI-680** |
| Fresh-project `verify-rls` fixture self-sufficiency | **[IPI-729 · SB-TEST-003 — Make Verify-RLS Fresh-Project Compatible](https://linear.app/amo100/issue/IPI-729)** — does **not** reopen **IPI-668**; **IPI-704 · SB-TEST-002** already owns pgTAP |
| CopilotKit Preview 503 on Vercel staging | **[IPI-730 · COPILOT-RUNTIME-003 — Diagnose CopilotKit 503 on Vercel Planner Staging Preview](https://linear.app/amo100/issue/IPI-730)** — **IPI-718**/**IPI-632** Done; **IPI-724** is Cloudflare E2E (related only) |

---

## Staging environment disposition

| Item | Disposition |
| --- | --- |
| Environment owner | iPix platform / assignee on **IPI-542** (S K) until Phase 1.1 handoff |
| Vercel branch URL | **Keep** `https://ipix-operator-git-release-ipi-542-staging-mdeai.vercel.app` as reusable Planner staging QA URL (`release/ipi-542-staging`) |
| Supabase project `wtuhdynujhszsbwxlbdi` | **Remain ACTIVE** for Phase 1.1 Planner work — do not delete until evidence PR merges and owner confirms |
| Credential owner | Infisical + local untracked `.env.staging.local` (operator machine); Vercel branch-scoped Preview env for public keys |
| Rotation process | Rotate staging DB password + Vercel automation bypass after Phase 1.1 or if leaked; revoke bypass if QA automation ends |
| Fixture cleanup rule | Disposable users/orgs/plans deleted after each drill (`cleanup.json`); no production customer data ever loaded |
| Review / expiry date | **2026-08-20** — reconfirm keep vs delete of staging project and branch |

**Do not delete** the staging environment until PR #521 is merged and this disposition is accepted.

---

## Production checklist

- [ ] Do **not** point production at staging Supabase
- [ ] Do **not** run this drill against `nvdlhrodvevgwdsneplk`
- [ ] Complete Phase 1.1 tickets before claiming full Planner Phase 1
- [ ] Separate production GO report after Option A + Phase 1.1 + prod verification
- [ ] Keep DB recovery as forward migrations only
- [ ] Never revert IPI-647 RLS

---

## Evidence index

| Artifact | Path | Notes |
| --- | --- | --- |
| This report | `tasks/design/planner/release/ipi-542-release-readiness-report.md` | Locked Option A verdict |
| Smoke results | `…/evidence/ipi-542/smoke-results.json` | Branch URL + CopilotKit 503 console notes |
| Staging host probe | `…/evidence/ipi-542/staging-host-probe.json` | `wtuhdynujhszsbwxlbdi.supabase.co` |
| Post-rollback smoke | `…/evidence/ipi-542/post-rollback-smoke.json` | assigned/unassigned + appLoaded |
| Cleanup log | `…/evidence/ipi-542/cleanup.json` | fixtures deleted `2026-07-20T05:33:50Z` |
| Screenshots | `…/evidence/ipi-542/*.png` | `05-*.png` is marketing 404 (see matrix) |

**Not in git (local only):** `.env.staging.local`, `.local-staging-*`, `.local-vercel-bypass-*`, fixture passwords. **No** passwords, tokens, cookies, Authorization headers, service-role keys, or DB URLs in committed evidence.

---

## Cleanup results

Disposable staging fixtures (org, workflow, instance, tasks, assignments, both users) **deleted** — see `cleanup.json` (`cleanedAt: 2026-07-20T05:33:50.416Z`).

---

## Dependency snapshot (unchanged product reality)

| Ticket | Option A relevance |
| --- | --- |
| IPI-526 Hub | ✅ exercised |
| IPI-576 Dashboard | ✅ exercised (approvals stub OK for Option A) |
| IPI-578 Workspace shell | ✅ exercised |
| IPI-577 Settings Members | ⚠️ route exists at `/settings`; Members screenshot evidence invalid (404 path) |
| IPI-647 assignment RLS | ✅ exercised |
| IPI-579/580/581/582/557/483 runtime | Deferred — remain open |
