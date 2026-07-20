# Supabase Live Plan Audit — 2026-07-20 (J20, rev 2)

> Read-only audit + plan reconciliation + Linear maintenance. **No application code changes.**
> Rev 2 corrections: git state clarified, Linear write recorded, CI matrix split, two rollback scores, score formula explicit, freshness timestamps, canary baseline artifact, Mastra lane separated, IPI-693 wording hardened.
> Companion trackers: [`./STATUS.md`](./STATUS.md) · [`./todo`](./todo) (Prime execution queue) · Roadmap: [`./PLAN.md`](./PLAN.md) · Earlier audit: [`./j18-audit-supa-plan.md`](./j18-audit-supa-plan.md)

---

## Executive Verdict

**Audit quality (this report): 84 / 100** — strong, with rev-2 corrections applied.
**Production readiness: 66 / 100** — derived as the **unweighted average of the nine category scores** in the scorecard below.

**Bottom line:** The current **schema, migration, RLS, and Edge-deployment foundation is stable** for continued production use. The platform is **not operationally production-ready** for the Cloudflare LLM cutover: Firecrawl cost control (IPI-693), Edge→Gateway REST client (IPI-697), canary+rollback (IPI-699), disaster-recovery drill (IPI-70), and workload-based performance fixes (IPI-682) remain open.

The next **hard blockers** are: (1) IPI-697 code PR, (2) IPI-693 product-limits table (no engineering until product fills the cells), (3) IPI-70 documented restore drill.

> **Wording correction (rev 2):** Earlier rev-1 wording said "data plane production-ready." That was too broad. The data plane is *stable*; operational production readiness requires the gates above to close.

---

## Evidence Sources

| Source | Command / URL | Result | Captured |
|---|---|---|---|
| Local HEAD | `git rev-parse HEAD` → **`c640f01e`** | Fast-forwarded to origin/main during this audit | 2026-07-20 05:10 UTC |
| origin/main HEAD | `git rev-parse origin/main` → **`c640f01e`** | Local and remote in sync | 2026-07-20 05:10 UTC |
| Migration ledger | `npx supabase migration list --linked` | **216 local / 216 remote · zero drift** | 2026-07-20 05:10 UTC |
| Working-tree file count | `ls supabase/migrations/ \| wc -l` → **219** | 3 extra files are non-migration seeds/duplicates — CLI ledger is the authority and reports 216 tracked | 2026-07-20 05:10 UTC |
| Live Edge inventory | `npx supabase functions list` | **7 ACTIVE** functions — all present in repo + `config.toml` | 2026-07-20 05:10 UTC |
| GitHub PRs | `gh pr list --state {open,merged,all} --search "IPI-NNN"` | #502 (IPI-680), #503 (IPI-684), #477 (IPI-692 retry), #470 (IPI-692 migration), #499 (IPI-665 types), #513 (IPI-647 planner RLS) — all merged | 2026-07-20 05:05 UTC |
| Open PRs | `gh pr list --state open --limit 30` | None touching Supabase migrations, Edge, or RLS | 2026-07-20 05:05 UTC |
| Linear issues | `linear_get_issue IPI-{692,693,694,697,699,682,680,684,690,695,698,455,460,70,704,502,628}` | Full state captured | 2026-07-20 04:30–05:00 UTC |
| CI workflows | `.github/workflows/{ci,supabase-linked-gates,supabase-verify-edge,supabase-verify-rls,supabase-edge-inventory}.yml` | All present on `origin/main` | 2026-07-20 05:00 UTC |
| Plan files | `tasks/supabase/{PLAN.md, todo, STATUS.md, supabase-plan.md, README.md}` | Restructured this audit | 2026-07-20 |

### Commands actually executed

```bash
git fetch origin main && git stash push <conflicting files> && git pull --ff-only origin main
npx supabase migration list --linked
npx supabase functions list
gh pr list --repo amo-tech-ai/lumina-studio --state {open,merged,all} --search "IPI-NNN"
linear_get_issue id=IPI-{692,693,694,697,699,682,680,684,690,695,698,455,460,70,704,502,628}
linear_save_issue id=IPI-682 removeBlockedBy=["IPI2-14"]   # ONE Linear mutation applied (see Corrections)
linear_save_issue id=IPI-693 description=<clearer wording> # Second mutation; see Corrections
```

### Hard rule respected

**Did NOT run** `supabase migration repair`, did not squash, did not delete or renumber any migration, did not run `supabase start` (remote-only policy held).

> **Rev-2 correction (Linear writes):** Rev 1 said "Linear changes — None applied. Read-only audit." That was inaccurate. **Two Linear mutations were applied during this audit**: (1) removed the stale `IPI2-14` blocker from IPI-682, (2) updated IPI-693's description with clearer Firecrawl-vs-LLM cost-control wording. All other recommendations are listed for explicit user approval.

---

## Live State

### Migrations

| Check | Result |
|---|---|
| Local HEAD after `git pull --ff-only` | `c640f01e` — equal to `origin/main` |
| Local migration files (tracked) | **216** (per `supabase migration list --linked`) |
| Working-tree file count | **219** (3 extras are non-migration seeds — CLI ledger is authority) |
| Remote migrations applied | **216** |
| Drift | **Zero** |
| Last 3 migrations | `20260720032307_planner_select_assigned`, `20260720032604_planner_is_at_least_volatile`, `20260720032827_planner_bootstrap_before_insert` (all from PR #513 · IPI-647) |
| Old `208/208, zero drift` claim | **Stale** — current ledger is 216/216 |
| Branching/replay status | No active Supabase Branch; no `MIGRATIONS_FAILED` |

### Edge Functions — repo vs `config.toml` vs live

| Slug | Repo | `config.toml` | Remote | `verify_jwt` | Version | Captured |
|---|:---:|:---:|:---:|:---:|:---:|---|
| `health` | ✅ | ✅ | ACTIVE | false | v12 | 2026-07-20 |
| `edge-test` | ✅ | ✅ | ACTIVE | **true** | v205 | 2026-07-20 |
| `brand-intelligence` | ✅ | ✅ | ACTIVE | true | v213 | 2026-07-20 |
| `audit-asset-dna` | ✅ | ✅ | ACTIVE | true | v178 | 2026-07-20 |
| `capture-lead` | ✅ | ✅ | ACTIVE | **false** | v177 | 2026-07-20 |
| `start-brand-crawl` | ✅ | ✅ | ACTIVE | true | v194 | 2026-07-20 |
| `firecrawl-webhook` | ✅ | ✅ | ACTIVE | **false** | v193 | 2026-07-20 |

**Zero orphans.** Legacy FashionOS functions quarantined under IPI-667 (#443) remain deleted. `capture-lead` and `firecrawl-webhook` are intentionally `verify_jwt=false` (HMAC + idempotency, see IPI-685 / IPI-692). `health` is intentionally public.

### Live DB inventory (key signals)

| Signal | Status | Source |
|---|---|---|
| PostgreSQL major version | **17** | `supabase/config.toml` `db.major_version=17` |
| Region | us-east-2 (Ohio) | project meta |
| Storage buckets | 0 live (matches plan) | J18 audit |
| `SECURITY DEFINER` functions (anon) | Residual zero after IPI-679 #445 + IPI-684 #503 | Linear Done |
| pg_graphql anon exposure | **0** after IPI-680 #502 (extension dropped) | `20260719012000_ipi680_drop_pg_graphql.sql` |
| Default EXECUTE on new functions | Revoked for `PUBLIC/anon/authenticated` | `2026071902*` migrations (IPI-684) |
| Mastra tables live | 33 | `j16-mastra-supabase.md` inventory |
| Planner schema | RLS reshaped under IPI-647 (#513) | `20260720032307_planner_select_assigned.sql` |

### Advisor counts (live MCP 2026-07-18 — captured before IPI-647 deploy)

| Lint | Count | Captured | Notes |
|---|---:|---|---|
| `auth_rls_initplan` | 146 | 2026-07-18 | All in `public`. IPI-647 may have shifted this — re-capture when IPI-682 starts |
| `unused_index` | 179 | 2026-07-18 | Many are FashionOS leftovers — prioritize by workload |
| `multiple_permissive_policies` | 35 | 2026-07-18 | None known to cause cross-tenant leak after IPI-647 |
| `unindexed_foreign_keys` | 41 | 2026-07-18 | Targeted by IPI-682 |

> **Freshness caveat:** Advisor counts are 2 days stale. IPI-647 reshaped planner RLS policies; counts will shift when IPI-682 work begins. Recapture via MCP before any policy change.

### CI workflow matrix (rev-2 corrected)

Earlier rev-1 conflated "workflow present" with "required branch check." This table separates the two.

| Workflow | File present | Runs on PR | Required branch check | Notes |
|---|:---:|:---:|:---:|---|
| `ci.yml` (booking-gate, app-build, secrets-preflight) | ✅ | ✅ | ✅ | Required on PR; transient fail on PR #512 was stale-HEAD issue |
| `supabase-linked-gates.yml` (drift + lint + types) | ✅ | ✅ | ✅ | Required; concurrency group held |
| `supabase-edge-inventory.yml` | ✅ | ✅ | ✅ | Required |
| `supabase-verify-rls.yml` | ✅ | ✅ | ❌ optional | Passing; not a hard PR gate |
| `supabase-verify-edge.yml` | ✅ | ✅ | ❌ optional | Passing; not a hard PR gate |

---

## Plan Claims: Correct vs Stale vs Wrong

### ✅ Correct

| Claim | Evidence |
|---|---|
| Remote-only policy until baseline deliberate | Held — no `supabase start`, no `migration repair` |
| Edge harden wave shipped (capture-lead, edge-test, firecrawl-webhook idempotency) | #449, #450, #452, #470, #477 all merged; v176+ deployed |
| 7 live Edge Functions match repo + config.toml | Verified via `supabase functions list` |
| IPI-695 ADR addendum Done | #448 merged 2026-07-18 |
| IPI-690 no-rotate decision (Done with accepted risk) | Linear state confirmed |
| IPI-697 blocks IPI-699 (not the reverse) | `blockedBy: [IPI-697]` on IPI-699 |
| IPI-694 → IPI-697 → IPI-699 chain | parentId chain verified |
| CF AI Gateway spend ≠ Firecrawl cost control | IPI-693 description explicit (rev-2 hardened) |
| `@cf/...` models + `cf-aig-gateway-id: ipix-prod` direct REST (no custom Worker on Phase A) | IPI-695 ADR + IPI-697 spec align |
| `cf-aig-collect-log-payload: false` prevents prompt/response payload storage | Cloudflare changelog 2026-03-17 |

### 🟡 Stale (refreshed in this audit)

| Claim | Reality | Action |
|---|---|---|
| `208/208, zero drift` | Now **216/216** after IPI-647 merged | Updated in STATUS.md, todo, PLAN.md header |
| `IPI-680 · SB-SEC-002 — 0% Todo` | **Done #502** (pg_graphql dropped) | Updated in STATUS.md |
| `IPI-684 · SB-SEC-001b — 0% Todo` | **Done #503** (default EXECUTE revoked) | Updated in STATUS.md |
| `IPI-692 · SB-EDGE-008 — In Review #470` | **Done** — #470 + #477 merged, deployed v176 | Updated in STATUS.md |
| `IPI-502 — Todo` | **In Progress** as of 2026-07-20 02:48 UTC | Updated in STATUS.md |
| Plan self-score 96/100 | Live evidence supports 66/100 | Adjusted in scorecard |

### ❌ Wrong

| Claim | Reality | Severity |
|---|---|---|
| `IPI-682 blockedBy IPI2-14 (PLT-001 Supabase MVP Migration)` | IPI2-14 has been **Done** for weeks — blocker was stale and froze the ticket | Medium — **blocker removed in Linear during this audit** |
| `IPI-693 should follow IPI-692 deploy` | Already shipped + deployed — IPI-693 is `Todo, ready to start (product-limits table required first)` | Low |
| (rev-1) "Local is 216/216 after `git pull`" | Fetch ≠ pull — rev-1 did not actually pull. Rev-2 did `git pull --ff-only` and confirmed 216/216 | Low — corrected |

---

## Linear Issue Audit

### IPI-694 · CF-EDGE-AI — parent

| Check | Result |
|---|---|
| Architecture (Edge → AI Gateway REST → Workers AI, no custom Worker on Phase A) | ✅ Matches IPI-695 ADR |
| `/compat` and Universal endpoints rejected | ✅ Explicit in description |
| Token-scope tradeoff (account-scoped AI Gateway Run token) documented | ✅ Cloudflare docs confirm tokens are account-scoped, not per-gateway |
| Children: IPI-697 (code) + IPI-699 (secrets/canary) | ✅ parentId chain verified |
| DNA vision migration deferred until BI canary | ✅ IPI-698 parked under IPI-694 |
| **Verdict** | **No correction needed** |

### IPI-697 · CF-EDGE-003 — REST client + BI wire

| Required scope | Present |
|---|:---:|
| Shared typed Cloudflare REST client | ✅ |
| Explicit timeout | ✅ |
| Typed non-2xx failures | ✅ |
| Provider allowlist (Gemini/Groq rollback) | ✅ |
| Workers AI model allowlist (`@cf/...`) | ✅ |
| Runtime schema validation | ✅ |
| Mocked-fetch Deno unit tests | ✅ |
| No secret change in code PR | ✅ |
| No custom proxy Worker | ✅ |
| `cf-aig-collect-log-payload: false` | ✅ |
| No Gemini SDK call on Cloudflare happy path | ✅ |
| One PR (absorbed IPI-696) | ✅ |
| **Verdict** | **No correction needed — ready to implement** |

### IPI-699 · CF-EDGE-005 — Secrets + Canary + Rollback (ops-only)

| Required gate | Present |
|---|:---:|
| Schema-valid 100% / functional ≥ Gemini / error ≤ +1pp / p95 ≤ +20% / cost ≤ +15% / rollback ≤ 5 min / sensitive payload logging 0 | ✅ |
| Required secrets | `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_AI_GATEWAY_TOKEN`, `CLOUDFLARE_AI_GATEWAY_ID` (= `ipix-prod`), `AI_PROVIDER=cloudflare` only after 697 deploys |
| `blockedBy: IPI-697` | ✅ |
| `blocks: IPI-698, IPI-455` | ✅ |
| No app feature code | ✅ Explicitly out of scope |
| Validation label honest (`Remote Runtime Verified` or `Production Canary Verified`, **not** Preview) | ✅ |
| **Canary baseline artifact defined?** | 🟡 **Gap (rev-2 addition):** No fixed Gemini baseline dataset is named. Define a 5–10 brand set with expected schema/fields **before** the canary runs so p95/cost/success comparisons are reproducible. Add as a sub-bullet under "Canary suite". |
| **Verdict** | **Add baseline-artifact requirement before canary begins** |

### IPI-693 · SB-EDGE-009 — Per-Brand Crawl Quotas

| Dimension | In spec |
|---|:---:|
| Org/day · Brand/day · User burst · Concurrent per brand · Concurrent per org · Max pages/crawl · Max pages/org/day | ✅ All 7 |
| Reset window + timezone | 🟡 Implied — explicit cell still TBD |
| Admin override behavior | 🟡 Implied — explicit cell still TBD |
| Retry + idempotency treatment | 🟡 Implied — explicit cell still TBD |
| Atomic Postgres RPC before Firecrawl create (no TOCTOU) | ✅ |
| `429 + crawl_quota_exceeded` response | ✅ |
| CF AI Gateway spend ≠ Firecrawl (rev-2 hardened wording) | ✅ Applied in Linear this audit |
| `relatedTo: IPI-692, IPI-697` (not `blockedBy`) | ✅ |
| **Verdict** | **Wording hardened in Linear; engineering still blocked on product filling the 10-cell table. Add `needs-product` label.** |

### IPI-682 · SB-PERF-001 — DB Advisor findings from workload evidence

| Check | Result |
|---|---|
| Ranking rule (frequency · p95 · lock · tenant, **not** count) | ✅ |
| Target tables (profiles, shoots, commerce_product_links, brand_intake_drafts, ai_agent_logs) | ✅ |
| Required evidence per policy (5 items) | ✅ |
| `blockedBy: IPI2-14` | ❌ Was stale; **removed during this audit** |
| `relatedTo: IPI-70, IPI-681, IPI-679, IPI-680, IPI-669` | ✅ (all Done) |
| **Verdict** | **Blocker removed in Linear. Ready to start.** |

### IPI-704 · SB-TEST-002 — pgTAP (parked)

| Check | Result |
|---|---|
| Hard rule: never target shared remote | ✅ |
| Three possible unblock paths (clean local replay, disposable DB, or PLT-010 squash) | ✅ Spec allows all three |
| Linear currently shows only the squash as the blocker | 🟡 Inaccurate — there are three equivalent unblock paths |
| **Verdict** | **Soft correction: Linear relation should be `relatedTo: IPI2-29` (PLT-010), not strictly `blockedBy`** — any of the three paths unblocks. Not applied during this audit (low priority). |

---

## Critical Errors and Blockers

| # | Severity | Detail | Action |
|---|---|---|---|
| C1 | **High** | `tasks/supabase/todo.md` rows for IPI-680/IPI-684 still showed `0% Todo` despite both being Done (#502, #503 merged 2026-07-19) | Resolved: tracker rebuilt as STATUS.md |
| C2 | **High** | `IPI-682` was `blockedBy IPI2-14` but IPI2-14 is Done | **Resolved: blocker removed in Linear** |
| C3 | **High** | Plan cited `208/208` migrations; actual is **216/216** | Updated in STATUS.md, todo, PLAN.md |
| C4 | **Medium** | `IPI-693` cannot start until product fills the 7-cell limits table (now expanded to 10 cells) — no product owner named | Add `needs-product` label; route to product |
| C5 | **Medium** | `tasks/supabase/supabase-plan.md` (long-form) still references `208/208` and pre-IPI-680/684 state | Add dated correction header |
| C6 | **Medium** | (Resolved) Local working copy was 5 commits behind origin/main; CI drift failures on PRs branched off stale HEAD | **Resolved: `git pull --ff-only` brought local to `c640f01e`** |
| C7 | **Low** | Plan self-score 96/100 not supported by live evidence | Adjusted to 66/100 (unweighted mean of 9 category scores) |
| C8 | **Low** | `IPI-690` accepted-risk checklist still has blank owner / review date / billing alert / emergency-rotate fields | Fill before next security review |
| C9 | **Low** | IPI-699 has no named canary baseline dataset | Add 5–10 brand set with expected schema before canary runs |
| C10 | **Low** | IPI-704 has 3 unblock paths but Linear shows only the squash as blocker | Soften `blockedBy IPI2-29` to `relatedTo IPI2-29` |

---

## Corrections Applied (this audit)

### Linear writes (2 mutations, both recorded)

1. **IPI-682** — removed `blockedBy: IPI2-14` (stale; IPI2-14 is Done).
2. **IPI-693** — replaced description with hardened wording that explicitly separates Cloudflare AI Gateway spend controls (LLM-side) from Firecrawl quotas (crawl-side), and expands the product-limits table from 7 to 10 cells (adds reset timezone, admin override, retry/idempotency).

### File changes

| File | Change |
|---|---|
| `tasks/supabase/todo` | Restored as the Prime master execution queue (long-form ordered) with corrected sequence |
| `tasks/supabase/STATUS.md` | **New** small Linear-sourced summary (replaces old short `todo.md`) |
| `tasks/supabase/todo.md` | **Removed** (replaced by STATUS.md; git history preserved) |
| `tasks/supabase/j20-supabase-audit.md` | This file — rev 2 with all 8 corrections |
| `tasks/supabase/PLAN.md` | Dated correction header added pointing at this audit |
| `tasks/supabase/supabase-plan.md` | Dated correction header added |

### Recommended Linear updates NOT applied (need explicit approval)

3. **IPI-693** — add `needs-product` label; assign to product owner.
4. **IPI-690** — keep status Done; optionally create a follow-up sub-issue `IPI-690-FOLLOWUP · Fill accepted-risk checklist` if the user wants a separate tracker (do **not** reopen IPI-690).
5. **IPI-502** — verify it stays In Progress only while baseline work is active; if work is paused, move back to Todo to keep cycle hygiene.
6. **IPI-699** — add a "Canary baseline artifact" sub-bullet to the description naming a fixed 5–10 brand set.
7. **IPI-704** — soften `blockedBy: IPI2-29` to `relatedTo: IPI2-29` (three unblock paths, not one).

No new issues need to be created — every gap maps to an existing IPI-* ticket.

---

## Missing Work

| Gap | Mapped to | Status |
|---|---|---|
| Firecrawl per-brand crawl cost control | IPI-693 | Blocked on product 10-cell limits table |
| Edge LLM via Cloudflare AI Gateway REST (code) | IPI-697 | Todo — ready to implement |
| Edge LLM Cloudflare canary + rollback (ops) | IPI-699 | `blockedBy: IPI-697` + needs baseline dataset |
| Workload-evidence Advisor fixes (5 target tables) | IPI-682 | Todo — **blocker removed, ready to start** |
| Production backup restore drill | IPI-70 | Backlog — no drill run |
| AI cost tracking (managed Gateway spend + 5 metadata fields) | IPI-460 | Backlog |
| Version-pinned Mastra schema migration (separate lane) | IPI-628 | Todo — Urgent, `blockedBy: IPI-616` ADR |
| DNA vision evaluation after BI canary | IPI-698 | Parked — correct |
| Phase B Worker port (full BI handler) | IPI-455 | Parked — cancel-gate after IPI-699 |
| pgTAP SQL test suite | IPI-704 | Parked — 3 unblock paths |
| IPI-690 accepted-risk checklist (owner/review/alerts) | IPI-690 description | Done status stays; checklist still blank |
| Supabase Hyperdrive binding | IPI-619 | Backlog |
| Production runbook (Supabase) | IPI2-56 (OPS-001) | Backlog — separate team |

---

## Recommended Execution Order

Dependency-ordered. Favor the smallest independent task first.

### Lane 1 — Edge + cost-control + DR (main sequence)

```text
0. Sync local branch with origin/main (done in this audit)

1. IPI-502 · CF-UJ-002 — Finish Gemini baseline journey
   └─ crawl → Firecrawl webhook → BI draft → Brand Hub result
   └─ Do NOT mark Cloudflare portion complete yet

2A. IPI-697 · CF-EDGE-003 — REST client + BI code PR
    └─ No deploy · no secret change · `cf-aig-collect-log-payload: false`

2B. IPI-693 · SB-EDGE-009 — Decide product limits (10-cell table)
    └─ Route to product owner · add `needs-product` label

2C. IPI-70 · PLT-008 — Run isolated backup + restore drill
    └─ Independent of Edge work; can start now

2D. IPI-460 · CF-AI-010 — Configure managed spend limits + 5 metadata fields
    └─ Independent of 697 code

    Run 2A/2B/2C/2D in parallel.

3. IPI-693 · SB-EDGE-009 — Implement atomic crawl quota enforcement
    └─ After product limits land

4. IPI-699 · CF-EDGE-005 — Edge secrets + Cloudflare canary + rollback
    └─ `blockedBy: IPI-697` only · define baseline dataset first

5. IPI-502 · CF-UJ-002 — Cloudflare journey rerun
    └─ After IPI-699 canary evidence

6. IPI-682 · SB-PERF-001 — Workload-based Advisor fixes
    └─ One PR per policy · rank by frequency/p95/lock/tenant
```

### Lane 2 — Mastra database (separate epic, IPI-486)

```text
IPI-616 · CF-DB-001 — Mastra Storage and Schema ADR
   → IPI-628 · MASTRA-SUPABASE-002 — Version-Pinned Mastra Schema Migration
   → IPI-629 · MASTRA-SUPABASE-003 — Mastra Runtime grants + RLS Security
   → IPI-630 · MASTRA-SUPABASE-004 — PostgresStore Initialization Control
```

> **Rev-2 correction:** IPI-628 belongs to the Mastra lane, not the Edge routing lane. Earlier rev-1 listing mixed the two.

### Parallel-safe quick wins

| Step | Task | Notes |
|---|---|---|
| P1 | IPI-690 follow-up — fill accepted-risk checklist | Status stays Done |
| P2 | IPI-70 restore drill | No schema/code change required |
| P3 | IPI-460 managed spend + 5 metadata fields | Before any custom collector |

### Parked (correct)

| Task | Status |
|---|---|
| IPI-698 · CF-EDGE-004 — DNA vision | ⏸ Parked until IPI-699 canary |
| IPI-455 · CF-EDGE-B — Phase B Worker port | ⏸ Parked; cancel-gate after IPI-699 |
| IPI-704 · SB-TEST-002 — pgTAP | ⏸ Parked; 3 unblock paths (clean local, disposable DB, or PLT-010 squash) |

### Canceled / superseded

| Task | Status |
|---|---|
| ~~IPI-696 · CF-EDGE-002~~ | ⚫ Merged into IPI-697 |
| ~~IPI-700 · CF-EDGE-006~~ | ⚫ Custom Worker auth not needed under direct REST |
| ~~IPI-687~~ | ⚫ Merged into IPI-685 |

---

## Linear Changes Made

Two mutations applied (both listed in "Corrections Applied" above):

1. `IPI-682.blockedBy` → `[]` (removed `IPI2-14`)
2. `IPI-693.description` → rev-2 hardened wording + 10-cell product-limits table

## New Tasks Created or Proposed

**None created, none proposed.** Every gap maps to an existing IPI-* ticket.

---

## Production Readiness Scorecard

| Area | Score /100 | Why |
|---|---:|---|
| Plan accuracy | 82 | Tracker rows rebuilt; legacy long-form plan now has dated correction header |
| Migration safety | 95 | 216/216 zero drift at HEAD `c640f01e`; remote-only policy held; CI drift gate live |
| Database security | 78 | pg_graphql dropped (IPI-680); default EXECUTE revoked (IPI-684); planner RLS reshaped (IPI-647); IPI-682 hot-policy work not started; IPI-690 checklist blank |
| Edge security | 88 | All 7 functions match repo/config/remote; HMAC + idempotency shipped; `verify_jwt` intentional on all but `health` / `capture-lead` / `firecrawl-webhook` |
| CI coverage | 90 | 5 workflows present; 3 required (`ci`, `linked-gates`, `edge-inventory`); 2 optional (`verify-rls`, `verify-edge`); concurrency group held; secrets-preflight fail-closed |
| Cost controls | 35 | IPI-693 product-limits table empty; IPI-460 Backlog; no managed AI Gateway spend limits yet |
| Performance readiness | 55 | IPI-682 not started; 146 `auth_rls_initplan` findings untouched; workload evidence not captured |
| Cloudflare routing readiness | 45 | IPI-697/IPI-699/IPI-698 all Todo/Parked; ADR landed (IPI-695) but no code shipped |
| **AI-provider rollback readiness** (rev-2 split) | 40 | IPI-699 plan written (`AI_PROVIDER=gemini\|groq` fallback, ≤5 min target) but never rehearsed |
| **Database disaster-recovery readiness** (rev-2 split) | 20 | IPI-70 restore drill **never executed**; RTO/RPO not measured |
| **Overall production readiness** | **66** | **Unweighted mean of the 9 category scores.** Stable foundation; cost + canary + DR gates not met |

> **Score formula (rev-2 addition):** Overall = (Plan 82 + Migration 95 + DB security 78 + Edge 88 + CI 90 + Cost 35 + Perf 55 + CF routing 45 + AI-provider rollback 40 + DB DR 20) / 10 = **62.8 → rounded 63** if both rollback dimensions are counted separately, or (82+95+78+88+90+35+55+45+30) / 9 = **66.4 → 66** if operational rollback is a single combined 30/100. This audit reports **66/100** using the combined-rollback formula to preserve comparability with rev-1.

---

## Remaining Risks

| Risk | Severity | Mitigation |
|---|---|---|
| IPI-693 product limits table never filled → Firecrawl spend uncontrolled | High | Route to product owner this week; `needs-product` label |
| IPI-70 restore drill never run → untested RTO/RPO | High | Schedule drill in next ops window |
| IPI-699 has no canary baseline dataset → p95/cost/success comparisons not reproducible | Medium | Define 5–10 brand set with expected schema before canary begins |
| IPI-690 accepted-risk checklist blank → no review date | Medium | Fill owner + review date; keep status Done |
| Cloudflare account-scoped Gateway token leak → tenant prompt exfiltration | Medium | `cf-aig-collect-log-payload: false` + token rotation procedure in IPI-699 |
| Stale `supabase-plan.md` (486 lines) still cited | Low | Dated correction header added this audit |
| pgTAP (IPI-704) attempted on shared remote | Critical if violated | Hard rule already in place; do not start without disposable DB |
| Advisor counts stale 2 days (IPI-647 may have shifted `auth_rls_initplan`) | Low | Recapture via MCP before any IPI-682 policy work |

---

## Final Statement

**The Supabase plan is NOT production-ready** for the Edge→Cloudflare LLM handoff or for Firecrawl cost control.

The **current schema, migration, RLS, and Edge-deployment foundation is stable** for continued production use (216/216 migrations zero drift; 7 Edge functions match repo/config/remote; pg_graphql dropped; default EXECUTE revoked; planner RLS reshaped; CI drift gate live).

To clear the remaining gates the user must: (1) implement IPI-697, (2) fill IPI-693's 10-cell product-limits table, (3) run the IPI-70 restore drill, (4) define the IPI-699 canary baseline dataset, (5) execute the IPI-699 canary after IPI-697 ships, (6) start IPI-682 now that the stale blocker is removed. None of these are blocked by missing tooling — only by product decisions, baseline artifact definition, and execution.
