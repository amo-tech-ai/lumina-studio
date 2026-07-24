# IPI-245 · pgTAP — honest status & follow-ups (2026-07-24)

**Audience:** engineers running or extending `supabase/tests/database/*.sql`  
**Related:** **IPI-245 · Database Authorization pgTAP Tests** ([#612](https://github.com/amo-tech-ai/lumina-studio/pull/612) merged) · fixture fix [#621](https://github.com/amo-tech-ai/lumina-studio/pull/621) · parked **IPI-704 · SB-TEST-002 — pgTAP**

Official docs (local-first): [Testing overview](https://supabase.com/docs/guides/local-development/testing/overview) · [pgTAP extension](https://supabase.com/docs/guides/database/extensions/pgtap) · [CLI `supabase test db`](https://supabase.com/docs/reference/cli/supabase-test-db)

---

## Plain English

**Today, pgTAP CI is a remote structural gate — not a local Docker gate.**

When you push a PR, `supabase-verify-rls` runs:

```bash
supabase test db --db-url "$DATABASE_URL" supabase/tests/database
```

That connects to the **shared** fashionos project (`nvdlhrodvevgwdsneplk`), logs `Connecting to remote database...`, and checks catalog/grants/RLS shape against whatever schema is already applied there. Transactions + `rollback` keep fixtures from sticking around in the happy path.

That is **useful** (catches “someone dropped a policy on remote”), but it is **not** what Supabase’s current guides describe (`supabase start` → migrate → `supabase test db` on a clean local DB).

Do **not** claim “we run the official local pgTAP path in CI” until a dedicated local job exists and is green.

---

## What is already good

| Piece | Status |
|-------|--------|
| `pgtap` in `extensions` | ✅ `20260722111926_enable_pgtap.sql` |
| SET ROLE + `extensions` USAGE grants | ✅ follow-up migrations |
| Suites under `supabase/tests/database/` | ✅ `001` / `002` / `003` |
| `begin` → `plan` → `finish` → `rollback` | ✅ |
| Remote plan math | ✅ 195 asserts (79+103+13) |
| No Basejump / dbdev | ✅ keep until local auth fixtures need helpers |
| No `supabase test db --linked` | ✅ (uses `--db-url` instead) |
| `003` self-contained auth fixtures | ✅ [#621](https://github.com/amo-tech-ai/lumina-studio/pull/621) — creates `auth.users` in-txn; does not reuse org UUID `…0001` |

---

## What is not true yet (do not oversell)

| Claim | Reality |
|-------|---------|
| “CI starts local Supabase then runs pgTAP” | ❌ Remote `--db-url` only |
| “`supabase db reset` + `supabase test db` is green on main” | ❌ Local stacks are often incomplete; seed disabled in `config.toml` |
| “pgTAP replaces `verify-rls.mjs`” | ❌ JS still owns JWT/RPC/business flows; pgTAP owns catalog + a thin allow/deny slice |
| “`003` needs seed-organizer@fashionos.com” | ❌ Fixed in #621; old comment was wrong |

---

## Follow-up backlog (separate PRs — one concern each)

### A. Local Docker pgTAP CI — **when ready to invest in migration replay**

**Owner issue:** **IPI-704 · SB-TEST-002 — pgTAP** (parked until unblock).

**Target shape (docs-aligned):**

```yaml
- run: supabase start
- run: supabase db reset   # or migrate-only once seed policy is decided
- run: supabase test db --local supabase/tests/database
```

**Do not add this job while local migration replay is red** — a permanently failing required check is worse than an honest remote gate.

**Unblock paths (from todo):** clean local replay · disposable DB · or PLT-010 squash.

### B. Tighten policy-name assertions / more JWT allow-deny in SQL

| Idea | Why |
|------|-----|
| `policies_are(...)` on high-risk tables | Catch “extra wrong policy appeared,” not only “≥1 policy” ([pgTAP docs](https://supabase.com/docs/guides/database/extensions/pgtap#testing-rls-policies)) |
| More JWT allow/deny in SQL | Less reliance on JS for simple SELECT deny cases; keep deep RPC in `verify-rls.mjs` |

Ship as its **own** code PR after #621 merges.

### C. Optional `000-setup-tests-hooks.sql`

Only if we adopt Basejump helpers or need a shared in-test `create extension` for ephemeral DBs ([advanced pgTAP](https://supabase.com/docs/guides/local-development/testing/pgtap-extended)).

---

## Commands (current)

```bash
# What CI does today (remote structural gate)
supabase test db --db-url "$DATABASE_URL" supabase/tests/database
# alias often present locally:
supabase test db --db-url "$SUPABASE_DB_URL" supabase/tests/database

# Local (may FAIL until stack matches main + pgtap + mastra)
supabase status
supabase test db --local supabase/tests/database
```

**Evidence (2026-07-24):** remote full suite PASS 195/195 after #621 fixture change; pre-fix local run FAIL (missing mastra / wrong fixture UUID).

---

## Scorecard (post–#612 / #621)

| Lens | Score | Notes |
|------|------:|-------|
| Suite structure & remote plan math | 92 | 195 PASS on remote |
| Fixture self-containment | 88 | #621 |
| Official local-stack contract | 35 | still remote-only CI |
| CI honesty / docs | 85 | this file |
| **Composite** | **~70** | remote gate OK; local path still open |

---

## Sibling PRs

| Concern | PR |
|---------|-----|
| Self-contained `003` fixtures | [#621](https://github.com/amo-tech-ai/lumina-studio/pull/621) |
| This doc (remote gate honesty + backlog) | (this PR) |
| Local Docker pgTAP CI | **Do not start** until IPI-704 unblock |
| `policies_are` / more JWT SQL | New code PR after #621 |
