# Supabase (iPix)

**Project:** `nvdlhrodvevgwdsneplk` ([Dashboard](https://supabase.com/dashboard/project/nvdlhrodvevgwdsneplk))

Commerce catalog lives on **Mercur** (Postgres `:5433`), not Supabase. Supabase holds brand intelligence, assets metadata, Mercur product links, and AI logs (PLT-001).

---

## Local Supabase Policy

For MVP, iPix uses **remote Supabase only**.

**Do not run `supabase start` during MVP work.**

Remote project: `nvdlhrodvevgwdsneplk`

**Reason:** Historical migrations do not replay cleanly on a fresh local Docker DB. The remote schema is valid and verified.

**Use:**

```bash
export $(grep -v '^#' .env.local | xargs)
npm run supabase:verify
npm run supabase:migrations
npm run supabase:types
npm run supabase:push
```

Local Docker is deferred until migration squash (**PLT-010**).

---

## 1. Current decision

**Remote-only is the supported workflow for iPix MVP.**

Develop against the linked remote project. Do not require local Docker for day-to-day work. New schema changes ship via `supabase db push --linked` (or `npm run supabase:push`).

---

## 2. Why

| Factor | Status |
|--------|--------|
| Remote database | Healthy — `npm run supabase:verify` passes |
| PLT-001 schema | Pushed (`brands`, `brand_scores`, `commerce_product_links`, `ai_agent_logs`, `assets` extensions) |
| Local migration replay | **Blocked** — ~91 migrations fetched from remote do not apply cleanly on a fresh local DB (FashionOS-era drift: missing enums/tables, seeds before DDL) |
| Commerce data | Mercur Postgres — not duplicated in Supabase |
| Local Docker | Optional; offset ports avoid conflict with mdeapp |

Forensic note: remote schema evolved incrementally (repairs, dashboard DDL, seeds). The migration **files** are a historical audit trail, not a guaranteed fresh-install script. Fixing replay order is deferred to **PLT-010** (P2).

---

## 3. Daily commands

From repo root:

```bash
cd /home/sk/ipix
export $(grep -v '^#' .env.local | xargs)

npm run supabase:verify      # REST ping: tasks, profiles, assets, shoots
npm run supabase:migrations  # local vs remote migration history
npm run supabase:types       # regenerate src/types/supabase.ts from remote
```

**Prerequisites:** `supabase login`, project linked (`supabase/.temp/project-ref`), `.env.local` with `SUPABASE_DB_PASSWORD` for CLI.

---

## 4. Creating new migrations

```bash
cd /home/sk/ipix
export $(grep -v '^#' .env.local | xargs)

supabase migration new <name>   # creates supabase/migrations/<timestamp>_<name>.sql
# review SQL manually

npm run supabase:push           # apply to remote (linked)
npm run supabase:types          # refresh TypeScript types
npm run supabase:verify         # smoke-test REST access
```

Only **new** forward migrations belong in this repo. Do not rewrite or reorder already-applied remote history.

---

## 5. Local Docker (optional)

Not required for MVP. If you need local Studio/API for experiments:

```bash
cd /home/sk/ipix
supabase start
supabase status
```

**Expected ports** (offset +10 in `config.toml` — mdeapp owns `54321–54327`):

| Service | Port |
|---------|------|
| API (Kong) | **54331** |
| Postgres | **54332** |
| Studio | **54333** |

`supabase start` may still fail until **PLT-010** (baseline squash). Use remote when local replay errors.

---

## 6. Do not do

- **Do not** run `supabase db reset` against linked/remote workflows without explicit intent — destructive and unrelated to MVP.
- **Do not** push old orphan migrations or re-apply fetched history that was reverted/repaired on remote.
- **Do not** put Mercur commerce tables (products, orders, sellers) in Supabase — see `docs/ecommerce/adr/002-ipix-commerce-ownership.md`.
- **Do not** stop mdeapp Supabase just to run iPix on default ports — offsets exist so both stacks can coexist.

---

## 7. Future cleanup task

**PLT-010 — Squash Supabase Migration Baseline For Local Docker** (P2)

Goal: one (or few) migrations derived from `supabase db dump --linked` so `supabase start` replays cleanly.

Until then: remote-only is official.

---

## App client

```ts
import { supabase } from "@/lib/supabase";
```

Env (Vite): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`  
Server/CLI only: `SUPABASE_DB_PASSWORD`, `SUPABASE_SERVICE_ROLE_KEY`

Do not wire the dashboard `todos` demo — remote has `tasks`, not `todos`.

---

## Auth (PLT-002)

### Routes

| Route | Access | Purpose |
|-------|--------|---------|
| `/login` | Public | Sign in / sign up (`Login.tsx`) |
| `/dashboard` | Protected | Operator shell (`ProtectedRoute` → `Dashboard.tsx`) |

Unauthenticated visits to `/dashboard` redirect to `/login?redirect=%2Fdashboard`.

### Profile sync

On session restore, sign-in, or sign-up, the app calls `ensureProfile()` (`src/services/profileService.ts`):

- Upserts `public.profiles` with `id = auth.users.id` and `email`
- Idempotent — no duplicate rows (`23505` handled)
- Updates email if auth email changed
- Surfaces errors on the dashboard via `profileError` in `AuthContext`

Remote RLS (already applied):

- `authenticated_users_can_view_own_profile`
- `authenticated_users_can_insert_own_profile`
- `authenticated_users_can_update_own_profile`

### Manual login test

```bash
cd /home/sk/ipix
npm run dev
```

Open `http://localhost:8080/dashboard` → should redirect to `/login`.

1. **Sign up** with a test email + password (min 6 chars).
2. If Supabase Auth requires email confirmation and no session is returned, confirm via email then **sign in**.
3. Dashboard should load with your email in the header.
4. **Refresh** — session and profile should persist.
5. **Sign out** — should return to marketing site header flow / unauthenticated state; `/dashboard` redirects to login again.

### RLS verification

Automated smoke test (creates ephemeral users on remote):

```bash
export $(grep -v '^#' .env.local | xargs)
npm run supabase:verify-rls
```

Requires `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` for test-user cleanup (optional but recommended).

Validates isolation on: `profiles`, `brands`, `brand_scores`, `commerce_product_links`, `ai_agent_logs`.

### Applying forward migrations (orphan-safe)

`supabase db push --linked` fails while local orphan `20251129062152` exists ahead of remote history. For new migrations:

```bash
export $(grep -v '^#' .env.local | xargs)
supabase db query --linked --file supabase/migrations/<timestamp>_<name>.sql
supabase migration repair --status applied <timestamp> --linked
```

Do **not** use `--include-all` unless you intend to push `20251129062152`.

Applied on remote: `20260614000001_plt002_profiles_rls_and_trigger.sql` (profiles INSERT/SELECT RLS + `handle_new_user` fix).

---

## Edge Functions (PLT-003)

**Foundation only** — no Gemini or Cloudinary calls until AI-001 / PLT-011.

### Layout

```text
supabase/functions/
├── _shared/
│   ├── cors.ts
│   ├── response.ts
│   ├── env.ts
│   ├── auth.ts
│   ├── supabase-client.ts
│   └── agent-log.ts
├── health/          # public ping
└── edge-test/       # JWT required; inserts one ai_agent_logs row
```

JSON envelope: `{ ok: true, data }` or `{ ok: false, error: { code, message } }`.

### Deploy (remote)

```bash
cd /home/sk/ipix
export $(grep -v '^#' .env.local | xargs)

supabase functions deploy health edge-test --project-ref nvdlhrodvevgwdsneplk
```

Secrets inventory: `docs/supabase/secrets-inventory.md` (SEC-002).

### Manual curl

```bash
URL=https://nvdlhrodvevgwdsneplk.supabase.co
ANON=$VITE_SUPABASE_PUBLISHABLE_KEY

curl -s "$URL/functions/v1/health" -H "apikey: $ANON"
curl -i -X OPTIONS "$URL/functions/v1/health" -H "apikey: $ANON"

# 401 without JWT:
curl -s -X POST "$URL/functions/v1/edge-test" -H "apikey: $ANON" -H "Content-Type: application/json" -d '{}'

# With session access_token from login:
curl -s -X POST "$URL/functions/v1/edge-test" \
  -H "apikey: $ANON" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" -d '{}'
```

### Automated verify

```bash
npm run supabase:verify-edge
```

Client helper: `src/services/edgeFunctionService.ts` (`pingEdgeHealth`, `runEdgeTest`).

---

## Warnings

- **Do not run `supabase start`** during MVP — use remote-only workflow (see above).
- **Do not push** orphan local migration `20251129062152_create_organizations_table.sql` without review — it exists locally but is **not** on remote.

---

## MCP (Cursor)

Configured in `.cursor/mcp.json` for `project_ref=nvdlhrodvevgwdsneplk`. Authenticate Supabase MCP in Cursor Settings (OAuth).
