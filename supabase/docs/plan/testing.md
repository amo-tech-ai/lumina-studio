# Supabase testing — strategy & plan

**Last verified:** 2026-07-18  
**Project:** `nvdlhrodvevgwdsneplk` (remote-only)  
**CLI:** ~2.109.1  
**Official guide:** [Testing Your Database](https://supabase.com/docs/guides/database/testing)  
**Related:** [`supabase-plan.md`](./supabase-plan.md) · [`notes-2.md`](./notes-2.md)

| Ticket | Concern |
|--------|---------|
| [IPI-664 · SB-HYGIENE-001](https://linear.app/amo100/issue/IPI-664) | Migration reconcile · HIBP · grant REVOKE |
| [IPI-665 · SB-CI-001](https://linear.app/amo100/issue/IPI-665) | Drift · dry-run · lint · types gates |
| [IPI-667 · SB-EDGE-001](https://linear.app/amo100/issue/IPI-667) | Legacy Edge quarantine |
| [IPI-668 · SB-TEST-001](https://linear.app/amo100/issue/IPI-668) | Required `verify-rls` on trusted CI · expand matrix · grant asserts |
| [IPI-669 · SB-CI-002](https://linear.app/amo100/issue/IPI-669) | Edge Deno unit tests in CI |

---

## Is the testing strategy correct?

**Yes — for a remote-first project with unclean migration replay.**

Local Supabase is not yet reliable (`MIGRATIONS_FAILED` branching; 22-way drift). So we correctly:

```text
Use real Supabase client tests now
→ add CI checks for drift, dry-run, lint, generated types
→ keep targeted SQL tests such as web015
→ require verify-rls on trusted runs
→ add pgTAP later, after local migrations replay cleanly
```

That matches Supabase’s [two recommended approaches](https://supabase.com/docs/guides/database/testing) (client tests now; CLI/pgTAP later) without fighting remote-only.

**Main gap today is not missing pgTAP — it is inconsistent CI enforcement.**

---

## What is already good

### 1. Real client tests

```text
supabase:verify-rls
supabase:verify-booking-gate
supabase:verify-planner
```

Path under test:

```text
Application → Supabase client → Auth/JWT → PostgREST → RLS → Database
```

Catches: cross-org reads, bad JWT handling, broken permissions, RPC access, client config mistakes. This is official approach #1.

### 2. Targeted SQL (`web015`)

Isolated Docker Postgres, one migration, always in CI. Not pgTAP — still a valid narrow proof.

### 3. Deferring pgTAP

Correct until:

```bash
supabase start
supabase db reset --local   # repeatedly
supabase test db --local
```

Adding pgTAP earlier creates flaky maintenance without reliable coverage.

---

## Current CI vs desired (verified)

| Check | Today | Desired |
|-------|-------|---------|
| `test:web015` | ✅ Always | Keep |
| app Vitest / lint / typecheck | ✅ Always | Keep |
| booking-gate / planner | Optional if secrets | Keep optional |
| `verify-rls` | ❌ Manual / Infisical only | **Required on trusted runs** → IPI-668 |
| migration drift | ❌ | → IPI-665 |
| `db push --dry-run` | ❌ | → IPI-665 |
| `db lint --linked --fail-on error` | ❌ | → IPI-665 |
| types drift | ❌ | → IPI-665 |
| `verify-edge-groq` Deno | ❌ Manual | → IPI-669 |
| pgTAP / full local replay | ❌ | Defer P2 |

Evidence: `.github/workflows/ci.yml` installs `@supabase/supabase-js` for booking-gate but **does not** run `supabase:verify-rls`.

---

## Improvements — verified & ticketed

### ✅ Improvement 1–3 — already IPI-665 (after IPI-664)

| # | Check | Why |
|---|-------|-----|
| 1a | `migration list --linked` (PR-aware) | **Ledger validation** (timestamps) — **not** “any local-only → fail” and **not** SQL byte-equality vs live |
| 1b | `db push --linked --dry-run` | **Pending-migration validation** — pending set must **exactly match** PR-introduced migrations |
| 2 | `db lint --linked -s public,planner --fail-on error` | plpgsql_check only — **not** RLS / replay proof |
| 3 | gen types → temp → `test -s` → `diff` vs `app/src/types/supabase.ts` | **CI:** `--project-id "$SUPABASE_PROJECT_ID"` (docs). Local `npm run supabase:types` may keep `--linked` |

**CI secrets (IPI-665 — from [`notes-2.md`](./notes-2.md)):** `SUPABASE_ACCESS_TOKEN` + `SUPABASE_PROJECT_ID` + `SUPABASE_DB_PASSWORD` (for link / dry-run / lint). Trigger: same-repo `pull_request` only; never `pull_request_target` + secrets. Drop `supabase projects list`.

**PR drift rules (critical — audit 2026-07-18):**

| Context | Rule |
|---------|------|
| Pull request | Fail on **remote-only** |
| Pull request | Allow **local-only** only when those versions are files introduced by the PR (`git diff origin/main...HEAD -- supabase/migrations`) |
| Pull request | Dry-run pending set == PR migration versions (no extras, no missing) |
| `main` / post-deploy | Zero local/remote history drift |
| Scheduled | Alert on unexplained remote-only / Dashboard changes |

Wrong: `Local-only OR remote-only → always fail` (blocks every legitimate migration PR).

Lint does **not** prove RLS, JWT, or zero-replay. One CI job, sequential gates. Pin CLI version; restrict linked job to trusted PRs/`main`.

### ✅ Improvement 4–6 — IPI-668 · SB-TEST-001

| Phase | Action |
|-------|--------|
| **1 (first)** | Require existing `verify-rls` on trusted PR + `main`; fork → explicit skip; trusted missing secrets → **config failure** |
| **2 (after IPI-664)** | Grant asserts on a **separate** path (SQL privileges) — not mixed into user-client RLS |
| **3 (incremental)** | Expand **1–2** highest-risk domains at a time in `scripts/verify-rls.mjs` |

Hard rules: **never** `pull_request_target` for secrets; use real `anon`/authenticated clients for authz (service_role = setup/teardown only); unique run-scoped IDs + `finally` cleanup; no customer rows.

### ✅ Improvement 7 — IPI-669 · SB-CI-002 (can ship **now**)

Wire full `npm run supabase:verify-edge-groq` with Deno **2.9.2** pinned + cache. Path filters: `supabase/functions/**`, `deno.json`, `package.json`, workflows. No “thin subset if flaky” — fix/quarantine with owner + expiry. Prefer Action SHA pins. Deployed inventory stays with IPI-667.

---

## What remains deferred

| Item | Until |
|------|--------|
| Full pgTAP suite | History clean → `start` + `db reset --local` reliable |
| Full local Supabase CI | Same |
| Hyperdrive tenant RLS suite | [IPI-621](https://linear.app/amo100/issue/IPI-621) (separate CF-DB track) |

Long-term target:

```text
supabase start → db reset --local → db lint → supabase test db
→ generate types → application tests → remote verify-rls smoke
```

---

## Recommended layers

| Layer | Purpose | Status / ticket |
|-------|---------|-----------------|
| Vitest | App logic + client factories | Keep |
| `verify-rls` | Real JWT + org isolation | Expand + require → **IPI-668** |
| Booking/planner probes | Critical workflows | Keep optional secrets |
| `web015` Docker SQL | Narrow migration/RLS | Keep |
| Migration drift + dry-run | History / deploy preview | **IPI-665** |
| Linked `db lint` | Function errors | **IPI-665** |
| Type drift gate | DB ↔ TS consistency | **IPI-665** |
| Edge Deno unit | Function logic offline | **IPI-669** |
| Grant asserts | Privileges ≠ RLS | **IPI-664** then **IPI-668** |
| Legacy Edge inventory | Orphans / JWT | **IPI-667** |
| pgTAP | SQL/RPC depth | Later (P2) |
| Full local replay | Migrations rebuild DB | Later (PLT-010) |

---

## Best simple strategy

```text
Now (no DB hygiene dependency)
├── Keep real-client tests + web015
├── IPI-669 — Edge Deno unit tests in CI (pin 2.9.2)
└── IPI-667 — Edge orphan quarantine (parallel)

After IPI-664
├── IPI-665 — PR-aware drift + dry-run + lint + types
└── IPI-668 — Phase 1 require verify-rls → Phase 2 grants → Phase 3 +1 domain

Later
├── Fix migration replay (PLT-010)
├── Full local Supabase in CI
└── pgTAP for SQL-specific behavior
```

---

## Scorecard vs official docs

| Docs expectation | iPix status |
|------------------|-------------|
| Approach 1 — client tests | ✅ In use |
| Approach 2 — `supabase/tests/database` + pgTAP | ❌ Deferred (correct) |
| `supabase test db` in CI | ❌ Deferred |
| Drift / lint / types gates | Planned **IPI-665** |
| Required RLS CI | Planned **IPI-668** |

---

## Commands

```bash
# Existing
npm run test:web015
infisical run --env=dev -- npm run supabase:verify-rls
infisical run --env=dev -- npm run supabase:verify-booking-gate
npm run supabase:verify-edge-groq
cd app && npm test

# IPI-665 (not wired yet) — ledger + pending + lint + types
npx supabase migration list --linked
npx supabase db push --linked --dry-run
npx supabase db lint --linked -s public,planner --level warning --fail-on error
# CI types (prefer --project-id; local script may still use --linked):
# npx supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" \
#   --schema public,planner,graphql_public > /tmp/types.ts && diff app/src/types/supabase.ts /tmp/types.ts

# Deferred P2
npx supabase test db --local
```

---

## Acceptance — “testing setup complete”

| Phase | Done when |
|-------|-----------|
| **A (now)** | IPI-664–669 shipped; trusted CI cannot silent-green on RLS/drift/lint/types |
| **B (P2)** | Local replay + ≥1 real pgTAP suite; remote `verify-rls` still release smoke |

---

## Final answer

The strategy is **correct and appropriately lean**.

Focus now on four enforced CI improvements (plus Edge Deno soon):

1. Fail on unexplained migration drift (+ PR-aware dry-run — see IPI-665 rules above).
2. Fail on linked database lint errors.
3. Fail when generated types are stale.
4. Run existing RLS verification automatically on trusted branches.

References: [Testing](https://supabase.com/docs/guides/database/testing) · [Testing and linting](https://supabase.com/docs/guides/local-development/cli/testing-and-linting) · [db lint](https://supabase.com/docs/reference/cli/supabase-db-lint) · [Generating types](https://supabase.com/docs/guides/api/rest/generating-types) · [`links.md`](./links.md)
