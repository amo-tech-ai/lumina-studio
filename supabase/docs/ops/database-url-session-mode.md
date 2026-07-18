# Database URL — session mode SSOT (IPI-678 · SB-OPS-001)

**Date:** 2026-07-18  
**Why:** Native `psql` multi-statement scripts (verify-rls grant SQL, booking-gate) need Supavisor **session** mode (`:5432`) or a direct DB host. Transaction pooler (`:6543`) can break prepared statements / multi-statement batches and historically caused `fe_sendauth: no password supplied` when the password was dropped during port flips.

## Canonical shape (no secrets in git)

| Consumer | Secret name(s) | Required mode |
|----------|----------------|---------------|
| GitHub Actions (`supabase-verify-rls`, booking-gate, linked tools) | `DATABASE_URL` (accepts `SUPABASE_DB_URL` as alias) | Pooler **session** `:5432` **or** direct `db.<ref>.supabase.co:5432` |
| Infisical `dev` (local `infisical run`) | `DATABASE_URL` and/or `SUPABASE_DB_URL` | **Same as GitHub** — prefer session `:5432` |
| App runtime / Hyperdrive Mastra | may use a separate role URL on `:5432` | Do not overwrite with pooler transaction URL |

Pooler host pattern (iPix):

```text
postgresql://postgres.<project-ref>:***@aws-1-<region>.pooler.supabase.com:5432/postgres
```

Transaction port to avoid for `psql` gates:

```text
…pooler.supabase.com:6543/postgres
```

## Operator checklist

1. In GitHub → Settings → Secrets → `DATABASE_URL`: confirm host is pooler or direct and **port is `5432`** (password present, URL-encoded if needed).
2. In Infisical project (env `dev`): set `SUPABASE_DB_URL` / `DATABASE_URL` to the **same** session/direct URL used in GitHub.
3. Local smoke (password never printed):

```bash
# After Infisical linked: infisical run --env=dev -- bash -c 'python3 -c "from urllib.parse import urlparse; import os; u=urlparse(os.environ[\"DATABASE_URL\"]); print(u.hostname, u.port)"'
psql "$DATABASE_URL" -c 'select 1'
# Optional: one grant file
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/security/chatbot-grants.sql
```

4. CI proof: latest green `supabase-verify-rls` + booking-gate on `main` / recent PR.

## Probe notes (2026-07-18)

| Surface | Port observed | `psql select 1` |
|---------|---------------|-----------------|
| Local `.env.local` pooler `SUPABASE_DB_URL` (before) | **6543** | ok |
| Same credentials rewritten to session | **5432** | ok |
| Same credentials on **6543** | 6543 | ok (auth works; mode wrong for multi-statement gates) |
| GitHub `DATABASE_URL` | value not readable via API | CI `supabase-verify-rls` green (password present) |
| Infisical CLI in this workspace | **not linked** (no `.infisical.json`) | Operator must set in Infisical UI / `infisical init` |

## Out of scope

- Rewriting notification RLS SQL to be pooler-mode agnostic  
- Changing linked-gates concurrency  
- Committing any connection string or password
