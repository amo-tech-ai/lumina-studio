---
paths:
  - "supabase/migrations/**"
---

# Database: Create migration

You are a Postgres Expert who loves creating secure database schemas.

This project uses the migrations provided by the Supabase CLI.

## Order of operations — local first, always

**Write the file → commit → review → merge → then apply to the remote.** Never the reverse.

Applying a migration to the live project before its file is on `main` creates a *remote-only
migration*: the remote ledger has a version the repo cannot account for. The
`supabase-linked-gates` CI job fails on exactly that, and it measures the base branch — so a
remote-first push turns **every open PR red**, not just yours. The person who applied it usually
never sees the failure; everyone else does.

| Step | Command |
|------|---------|
| 1. Create the file | `supabase migration new <short_description>` |
| 2. Verify locally | `supabase db reset` (local stack) or `supabase test db` for pgTAP |
| 3. Commit + open a PR | one migration concern per PR |
| 4. Merge to `main` | CI must be green |
| 5. **Then** apply | `supabase db push --linked` |

Never use the Dashboard SQL editor for schema changes. It writes straight to the remote with no
file, which is the same failure with no paper trail.

### Checking for drift

```bash
node scripts/check-supabase-migration-drift.mjs --main   # local set vs remote ledger
supabase migration list --linked                          # raw local/remote table
```

The first is what CI runs, as the `supabase-linked-gates` job in
`.github/workflows/supabase-linked-gates.yml`. Run it from an **up-to-date checkout** — it
compares the remote ledger against the `supabase/migrations/` files on disk, so a stale local
branch reports drift that does not exist. Confirm `git log -1` matches `origin/main` before
believing a failure.

### Emergency: a migration was already applied remotely

If a hotfix genuinely had to go straight to production, capture it immediately — the window
between "applied" and "file on `main`" is the window every other PR is blocked.

1. **Identify the version and its name:**
   ```bash
   supabase migration list --linked --output-format json   # find the remote-only version
   ```
   ```sql
   -- the remote ledger stores the applied statements
   select version, name, statements
   from supabase_migrations.schema_migrations
   where version = '<version>';
   ```
2. **Recreate the file at that exact version** — the filename timestamp must equal the remote
   version, or the ledgers still will not match:
   `supabase/migrations/<version>_<name>.sql`
3. **Do not re-apply it.** The remote already has it. The file exists to make the ledgers agree.
4. **Open a capture PR the same day**, referencing the incident. Merging it clears the red check
   for every open PR at once.
5. Confirm with `node scripts/check-supabase-migration-drift.mjs --main` → `ok: main ledger
   aligned; dry-run up to date`.

**Real incident, 2026-08-01.** `20260801091009_ipi896_revoke_default_table_privileges` was applied
to the remote at 09:10:09; PR [#719](https://github.com/amo-tech-ai/lumina-studio/pull/719) merged
its file at 09:20:32. For those ten minutes `supabase-linked-gates` failed on every open PR. The
process worked — the file did land — but the ordering was backwards, and a stale base branch kept
the false failure visible for another quarter of an hour after it was actually fixed.

## Creating a migration file

Given the context of the user's message, create a database migration file inside the folder `supabase/migrations/`.

The file MUST following this naming convention:

The file MUST be named in the format `YYYYMMDDHHmmss_short_description.sql` with proper casing for months, minutes, and seconds in UTC time:

1. `YYYY` - Four digits for the year (e.g., `2024`).
2. `MM` - Two digits for the month (01 to 12).
3. `DD` - Two digits for the day of the month (01 to 31).
4. `HH` - Two digits for the hour in 24-hour format (00 to 23).
5. `mm` - Two digits for the minute (00 to 59).
6. `ss` - Two digits for the second (00 to 59).
7. Add an appropriate description for the migration.

For example:

```
20240906123045_create_profiles.sql
```

## SQL Guidelines

Write Postgres-compatible SQL code for Supabase migration files that:

- Includes a header comment with metadata about the migration, such as the purpose, affected tables/columns, and any special considerations.
- Includes thorough comments explaining the purpose and expected behavior of each migration step.
- Write all SQL in lowercase.
- Add copious comments for any destructive SQL commands, including truncating, dropping, or column alterations.
- When creating a new table, you MUST enable Row Level Security (RLS) even if the table is intended for public access.
- When creating RLS Policies
  - Ensure the policies cover all relevant access scenarios (e.g. select, insert, update, delete) based on the table's purpose and data sensitivity.
  - If the table is intended for public access the policy can simply return `true`.
  - RLS Policies should be granular: one policy for `select`, one for `insert` etc) and for each supabase role (`anon` and `authenticated`). DO NOT combine Policies even if the functionality is the same for both roles.
  - Include comments explaining the rationale and intended behavior of each security policy

The generated SQL code should be production-ready, well-documented, and aligned with Supabase's best practices.
