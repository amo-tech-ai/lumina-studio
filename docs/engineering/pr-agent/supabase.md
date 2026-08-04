# PR-Agent Expert Sheet — Supabase

> Domain rules the AI reviewer must enforce for PRs touching `supabase/`, migrations, RLS,
> edge functions, or `app/src/lib/supabase/*`. Sheet: `supabase.md` · phase: B (post-measurement).

## Hard rules (BLOCKING if violated)

1. **Remote-only workflow.** No `supabase start`/local Docker replays. Migrations ship via
   `npm run supabase:push` against the remote project (`nvdlhrodvevgwdsneplk`).
2. **RLS + grants together (IPI-896).** Every tenant-owned table exposed via the Data API needs,
   in the same migration: `enable row level security`, explicit `grant … to authenticated`,
   and an org-boundary (or anonymous-NULL) policy. "RLS on, zero policies, still granted"
   = loaded half of a two-part safety model — flag it.
3. **Storage-like null-owner rows** use the integer-WHERE `auth.uid() is null` anonymous pattern
   or an explicit `security definer` view/interface — never blanket grants to shared strategic rows.
4. **Migrations are forward-safe.** Destructive DDL on existing production data ships with
   rollback / recovery / roll-forward instructions in the migration header comment.
5. **Migration filename is `YYYYMMDDHHMMSS_name.sql`** (existing convention, monotonic).
6. **After any schema change:** `npm run supabase:types` regenerates `src/types/supabase.ts` —
   a migration PR without the regenerated types file is incomplete.
7. **Never client-side:** `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `GEMINI_API_KEY`.
   Server-side access only through `lib/supabase/server.ts` or `admin.ts`.

## Client boundaries

- `app/src/lib/supabase/` has deliberate client/server/admin layers (anon → RLS-scoped,
  server → session-scoped, admin → service role for worker-only paths).
- A client component must never import the server or admin client.

## Edge functions (`supabase/functions/`)

- Use `_shared/` building blocks: `resolveAuth`, `handleCors`, `jsonResponse`/`errorResponse`,
  `createUserClient`, `getOptionalSecret`. Duplicating auth/CORS logic = IMPORTANT finding.
- Secrets via Supabase Edge secrets (`supabase secrets set`), never committed `.env` or code.
- New DB-access functions need explicit tests controlled by `supabase/functions/_shared` convention
  and the verify scripts (`supabase:verify-edge`, `supabase:verify-rls`).

## Data ownership

Supabase owns brand intelligence, asset metadata, Mercur product links, AI agent logs.
Commerce catalog/sellers/checkout belong to Mercur (`my-marketplace/`) — flag schema that
duplicates commerce state in Supabase (see `commerce.md`).

## Acceptable patterns (do NOT flag)

- RLS-free designs where the Data API does not expose the table AND it is access-gated
  exclusively through `security definer` functions/views with an explicit comment.
- `verify-rls`/`verify-edge` failing ahead of the PR landing the matching migration — check
  whether the migration is this PR's deliverable before flagging.

## How to flag

`BLOCKING` — missing RLS policy/grant pair on a Data API-exposed tenant table;
service-role key client-reachable; destructive DDL without recovery instructions.
`IMPORTANT` — hand-rolled auth/CORS in an edge function; types not regenerated; org scoping
absent on a tenant table (and no anonymous-NULL pattern explanation).
