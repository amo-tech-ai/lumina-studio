# Supabase testing — strategy & plan

**Last verified:** 2026-07-18 (audit correction — disposable-project option)  
**Project:** `nvdlhrodvevgwdsneplk` (remote-only)  
**CLI:** ~2.109.1  
**Official guide:** [Testing Your Database](https://supabase.com/docs/guides/database/testing)  
**Related:** [`supabase-plan.md`](./supabase-plan.md) · [`todo`](./todo) · [`notes-2.md`](./notes-2.md)

| Ticket | Concern | Status (2026-07-18) |
|--------|---------|---------------------|
| [IPI-664 · SB-HYGIENE-001](https://linear.app/amo100/issue/IPI-664) | Migration reconcile · HIBP · grant REVOKE | 🟢 Done |
| [IPI-665 · SB-CI-001](https://linear.app/amo100/issue/IPI-665) | Drift · dry-run · lint · types gates | 🟢 Done (`supabase-linked-gates.yml`) |
| [IPI-667 · SB-EDGE-001](https://linear.app/amo100/issue/IPI-667) | Legacy Edge quarantine | 🟢 Done |
| [IPI-668 · SB-TEST-001](https://linear.app/amo100/issue/IPI-668) | Required `verify-rls` on trusted CI · grant asserts | 🟢 Done (`supabase-verify-rls.yml`) |
| [IPI-669 · SB-CI-002](https://linear.app/amo100/issue/IPI-669) | Edge Deno unit tests in CI | 🟢 Done (#441) |
| [IPI-704 · SB-TEST-002](https://linear.app/amo100/issue/IPI-704) | pgTAP + `supabase test db` | ⏸ P2 Backlog — after **PLT-010** **or** disposable test project |
| [IPI2-29 · PLT-010](https://linear.app/amo100/issue/IPI2-29) | Squash migration baseline for local Docker | ⏸ P2 — one unblock path; lives on **old Linear team** (ownership/replacement may be needed) |

---

## Why “testing” still looks incomplete

**Phase A (remote-first CI) is largely shipped.** What remains open is **Phase B** — full local replay + pgTAP — and that is **intentionally deferred**, not forgotten.

| Phase | Meaning | Status |
|-------|---------|--------|
| **A** | Trusted CI cannot silent-green on RLS / drift / lint / types / Edge Deno | ✅ Done (664–669) |
| **B** | Local `db reset` **or** disposable test project + ≥1 real pgTAP suite under `supabase/tests/database` | ❌ Deferred until an unblock path is real |

If someone opens this file and still sees old “verify-rls ❌ Manual” rows below in git history, those rows were **stale as of the evening sync** — live truth is the table above + [`supabase-plan.md`](./supabase-plan.md) Progress Tracker.

**Do not start pgTAP now** while Edge wave (**IPI-692** next · **IPI-697** parallel · **IPI-690** Done no-rotate [human final]) is the active queue — wrong concern. Unblock Phase B via **PLT-010 squash** **or** a **dedicated disposable Supabase test project** (never production `nvdlhrodvevgwdsneplk`). Parking is OK; “must PLT-010 only” is softened.

---

## Is the testing strategy correct?

**Yes — for a remote-first project with unclean migration replay.**

Local Supabase is not yet reliable (branching `MIGRATIONS_FAILED`; full history does not replay). So we correctly:

```text
Use real Supabase client tests now
→ CI: drift, dry-run, lint, generated types, required verify-rls, Edge Deno
→ keep targeted SQL tests such as web015
→ add pgTAP later, after local migrations replay cleanly (PLT-010)
   **or** against a dedicated disposable Supabase test project (never prod)
```

That matches Supabase’s [two recommended approaches](https://supabase.com/docs/guides/database/testing) (client tests now; CLI/pgTAP later) without fighting remote-only.

**Main remaining gap is Phase B (pgTAP / clean replay) — not missing verify-rls.**

**PLT-010 note:** [IPI2-29 · PLT-010](https://linear.app/amo100/issue/IPI2-29) is on an older Linear team — active-team ownership or a replacement squash ticket on iPix1 may be needed. If using `supabase migration squash`, heed official caveats (DML / config / cron / storage / vault restore) and validate on a disposable project first.

---

## What is already good

### 1. Real client tests

```text
supabase:verify-rls          # required CI: supabase-verify-rls.yml
supabase:verify-booking-gate
supabase:verify-planner
```

Path under test:

```text
Application → Supabase client → Auth/JWT → PostgREST → RLS → Database
```

Catches: cross-org reads, bad JWT handling, broken permissions, RPC access, client config mistakes. This is official approach #1.

### 2. Targeted SQL (`web015`)

Isolated Docker Postgres, **one** migration (`npm run test:web015` / `supabase-web015` in `ci.yml`). Not pgTAP — still a valid narrow proof. Pattern to extend if you need SQL-level asserts **without** full history replay.

### 3. Deferring pgTAP

Correct until:

```bash
supabase start
supabase db reset --local   # repeatedly
supabase test db --local
```

Adding pgTAP earlier creates flaky maintenance without reliable coverage. There is still **no** `supabase/tests/database/*.test.sql` on disk; Linear backlog is filed as **[IPI-704 · SB-TEST-002](https://linear.app/amo100/issue/IPI-704)** (parked until **PLT-010** **or** a disposable test project exists).

---

## Current CI vs desired (verified 2026-07-18 evening)

| Check | Today | Notes |
|-------|-------|-------|
| `test:web015` | ✅ Always (`ci.yml` → `supabase-web015`) | Keep |
| app Vitest / lint / typecheck | ✅ Always | Keep |
| booking-gate / planner | Optional if secrets | Keep optional |
| `verify-rls` | ✅ Required trusted CI | **IPI-668** Done — `supabase-verify-rls.yml` |
| migration drift + dry-run | ✅ | **IPI-665** / **IPI-673** — `supabase-linked-gates.yml` |
| `db lint --linked --fail-on error` | ✅ | IPI-665 |
| types drift | ✅ | IPI-665 (`--project-id` in CI) |
| Edge Deno unit | ✅ | **IPI-669** Done; expand crawl tests via **IPI-686** |
| pgTAP / full local replay | ❌ | Defer P2 — after **PLT-010** **or** disposable project → **IPI-704** |

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

### ✅ Improvement 7 — IPI-669 · SB-CI-002 — **Done** (#441)

Deno unit tests in CI. Further Edge test depth = crawl path (**IPI-686 · SB-EDGE-003**), not a new pgTAP track.

---

## What remains deferred

| Item | Until |
|------|--------|
| Full pgTAP suite | **PLT-010** history clean → `start` + `db reset --local` **or** disposable test project → then **SB-TEST-002** |
| Full local / disposable Supabase CI | Same |
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
| `verify-rls` | Real JWT + org isolation | ✅ **IPI-668** (expand domains incrementally) |
| Booking/planner probes | Critical workflows | Keep optional secrets |
| `web015` Docker SQL | Narrow migration/RLS | Keep (extend pattern if needed) |
| Migration drift + dry-run | History / deploy preview | ✅ **IPI-665** |
| Linked `db lint` | Function errors | ✅ **IPI-665** |
| Type drift gate | DB ↔ TS consistency | ✅ **IPI-665** |
| Edge Deno unit | Function logic offline | ✅ **IPI-669** (+ **IPI-686** crawl) |
| Grant asserts | Privileges ≠ RLS | ✅ **IPI-664** / **IPI-677** / **IPI-668** |
| Legacy Edge inventory | Orphans / JWT | ✅ **IPI-667** |
| pgTAP | SQL/RPC depth | Later (P2) — **IPI-704 · SB-TEST-002** |
| Full local / disposable replay | Migrations rebuild DB | Later (**PLT-010** / IPI2-29 **or** disposable project) |

---

## Best simple strategy

```text
DONE (Phase A)
├── Real-client tests + web015
├── IPI-665 — linked drift + dry-run + lint + types
├── IPI-668 — required verify-rls + grant asserts
├── IPI-669 — Edge Deno unit in CI
└── IPI-667 — Edge orphan quarantine

NOW (Edge wave — see todo; not pgTAP)
├── IPI-690 — Gemini ops 🟢 Done (no-rotate) [human final — audit rotate REJECTED]
├── IPI-689 — inventory CI 🟢 Done #463
├── IPI-692 — atomic webhookId dedup ← NEXT
├── IPI-697 — CF-EDGE REST + BI (parallel)
└── IPI-693 — crawl quotas (after product limits)

LATER (Phase B)
├── PLT-010 squash OR dedicated disposable Supabase test project (never prod)
├── Full local / disposable Supabase in CI
└── IPI-704 · SB-TEST-002 — pgTAP + supabase test db (parked)
```

---

## Scorecard vs official docs

| Docs expectation | iPix status |
|------------------|-------------|
| Approach 1 — client tests | ✅ In use + required CI |
| Approach 2 — `supabase/tests/database` + pgTAP | ❌ Deferred (correct) |
| `supabase test db` in CI | ❌ Deferred |
| Drift / lint / types gates | ✅ **IPI-665** |
| Required RLS CI | ✅ **IPI-668** |

---

## Commands

```bash
# Phase A (shipped)
npm run test:web015
infisical run --env=dev -- npm run supabase:verify-rls
infisical run --env=dev -- npm run supabase:verify-booking-gate
# Edge Deno — see IPI-669 workflow / supabase:verify-edge*
cd app && npm test

# Linked gates (CI + local)
npx supabase migration list --linked
npx supabase db push --linked --dry-run
npx supabase db lint --linked -s public,planner --level warning --fail-on error

# Deferred P2 (after PLT-010 local replay OR disposable test project)
npx supabase test db --local
```

---

## Acceptance — “testing setup complete”

| Phase | Done when | Status |
|-------|-----------|--------|
| **A** | IPI-664–669 shipped; trusted CI cannot silent-green on RLS/drift/lint/types/Edge Deno | ✅ Done |
| **B (P2)** | Local replay + ≥1 real pgTAP suite; remote `verify-rls` still release smoke | ❌ Not started (correct) |

---

## Final answer

Phase A strategy **shipped**. Incomplete = **Phase B (pgTAP)** only — needs a clean replay path (**PLT-010** **or** disposable test project), not more CI ideas.

**Do not add pgTAP before finishing the Edge wave** (690 Done no-rotate → 689 Done → **692 next** ∥ 697). Parked ticket: **[IPI-704 · SB-TEST-002 — pgTAP suite and supabase test db in CI](https://linear.app/amo100/issue/IPI-704)**. Until then extend `web015` or `verify-rls.mjs` for SQL/JWT gaps.

References: [Testing](https://supabase.com/docs/guides/database/testing) · [Testing and linting](https://supabase.com/docs/guides/local-development/cli/testing-and-linting) · [db lint](https://supabase.com/docs/reference/cli/supabase-db-lint) · [Generating types](https://supabase.com/docs/guides/api/rest/generating-types) · [`links.md`](./links.md)
