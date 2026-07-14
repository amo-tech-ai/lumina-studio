# Supabase setup — 2026-07-10

Runbook for **fashionos** (`nvdlhrodvevgwdsneplk`). Remote-only policy; no `supabase start`.

---

## 1. Canonical project

| Project | Ref | Status |
|---------|-----|--------|
| **fashionos** | `nvdlhrodvevgwdsneplk` | **Linked** — use this |
| Fashionosv10 | `ssmzppgsyqspryggcops` | Unlinked — do not `supabase link` here by accident |

```bash
supabase projects list   # expect ● on nvdlhrodvevgwdsneplk
```

Dashboard: <https://supabase.com/dashboard/project/nvdlhrodvevgwdsneplk>

---

## 2. Env keys (fixed 2026-07-10)

Both env files now use the dashboard **publishable** key (`sb_publishable_*`), matching `SUPABASE_SERVICE_ROLE_KEY` (`sb_secret_*`).

| Var | Root `.env.local` | `app/.env.local` |
|-----|-------------------|------------------|
| URL | `NEXT_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_URL` | `NEXT_PUBLIC_SUPABASE_URL` |
| Anon / publishable | `NEXT_SUPABASE_PUBLISHABLE_KEY` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_ANON_KEY` |
| Service role | `SUPABASE_SERVICE_ROLE_KEY` | `SUPABASE_SERVICE_ROLE_KEY` |

Legacy root names (`NEXT_SUPABASE_*`) remain for `scripts/verify-supabase.mjs` fallbacks.

**Restart dev after key change:**

```bash
cd app && infisical run --env=dev -- npm run dev
```

Smoke: `/login` with `qa@ipix.test`.

### Env loading for CLI

Do **not** use `export $(grep -v '^#' .env.local | xargs)` — root `.env.local` has non-`KEY=value` lines (SSH keys, etc.) that break bulk export.

```bash
# REST verify (loads .env.local itself)
npm run supabase:verify

# Direct Postgres / migration list
SUPABASE_DB_PASSWORD=$(grep '^SUPABASE_DB_PASSWORD=' .env.local | cut -d= -f2-) \
  supabase migration list --linked

# Or Infisical
infisical run --env=dev -- npm run supabase:migrations
```

---

## 3. Health checks

```bash
cd /home/sk/ipix
npm run supabase:verify          # REST: tasks, profiles, assets, shoots
npm run supabase:verify-rls
npm run supabase:verify-edge
```

**2026-07-10 probe (service role REST):**

| Object | Remote state |
|--------|----------------|
| `crm_companies`, `crm_contacts`, `crm_deals` | ✅ exist |
| `campaigns`, `campaign_deliverables` | ✅ exist |
| `public.bookings` | ❌ not exposed (bookings live in `talent.bookings`) |
| RPCs via PostgREST (`transition_booking`, etc.) | 404 without args/grants — use `psql` or RLS scripts to verify |

---

## 4. Migration drift (Jul 3–7)

`supabase migration list` shows **history mismatch**, not necessarily **schema mismatch**. Same features were applied on remote under different timestamps than the files on this branch.

### 4.1 Remote-only (in DB history, not in tracked repo before fetch)

| Remote version | Fetched file (untracked) | Likely local duplicate |
|----------------|--------------------------|-------------------------|
| `20260704023432` | `20260704023432_ipi341_transition_booking_rpc.sql` | `20260703213000_ipi341_transition_booking_rpc.sql` |
| `20260704024144` | `20260704024144_ipi341_rls_update_with_check.sql` | (split out of 03213000) |
| `20260704085653` | `20260704085653_crm_core_schema.sql` | `20260704090000_crm_core_schema.sql` |
| `20260704085805` | `20260704085805_crm_deals_trigger_revoke_public_execute.sql` | (split out of 04090000) |
| `20260704103223` | `20260704103223_crm_schema_hardening.sql` | `20260704100000_crm_schema_hardening.sql` |
| `20260705003842` | `20260705003842_notifications_crm_deal_rls.sql` | `20260704110000_notifications_crm_deal_rls.sql` |
| `20260705004146` | `20260705004146_crm_fk_cascade_indexes.sql` | `20260704120000_crm_fk_cascade_indexes.sql` |
| `20260707104507` | `20260707104507_check_talent_availability_rpc.sql` | `20260704150000_check_talent_availability_rpc.sql` |
| `20260707132407` | `20260707132407_get_shoot_detail_asset_resource_type.sql` | `20260707105444_get_shoot_detail_asset_resource_type.sql` |

**Cause:** Migrations were pushed from another branch/machine with CLI-generated timestamps. This branch re-authored the same work with hand-picked timestamps. Remote schema largely matches; history table does not.

Fetched SQL is in `supabase/migrations/` as **untracked** files (from `supabase migration fetch --linked`). Do not commit both versions.

### 4.2 Local-only (in repo, not in remote history)

| Local version | File | Notes |
|---------------|------|-------|
| `20260703213000` | `ipi341_transition_booking_rpc` | Superseded on remote by `20260704023432` + `20260704024144` |
| `20260703220000` | `ipi342_get_list_booking_rpcs` | **Genuinely unpushed** — `get_booking` / `list_bookings` |
| `20260704090000`–`20260704150000` | CRM + notifications + indexes + availability | Superseded by remote `20260704*` / `20260705*` set |
| `20260707100000` | `ipi268_campaigns_schema` | Schema **exists** on remote; history row missing |
| `20260707105444` | `get_shoot_detail_asset_resource_type` | Superseded by `20260707132407` on remote |

### 4.3 Also local-only (Jul 3 booking block)

These **are** aligned (local = remote):

- `20260703194500` … `20260703240000` (booking request, version column, shoot data contract)

Only `20260703213000` / `20260703220000` in that window are out of sync with remote history.

---

## 5. Recommended repair (remote history wins)

**Goal:** One migration file per applied version; `migration list` shows no gaps.

### Step 1 — Backup

```bash
git stash -u   # or commit WIP on a branch
supabase migration list --linked > /tmp/migration-list-before.txt
```

### Step 2 — Align repo files to remote history

On a **migrations-only PR**:

1. **Keep** the 9 fetched remote-version files (rename/commit them).
2. **Remove** the 8 superseded local duplicates (table in §4.1 right column + `20260707105444`).
3. **Keep** `20260703220000_ipi342_get_list_booking_rpcs.sql` — still needs apply.
4. **Keep or reconcile** `20260707100000_ipi268_campaigns_schema.sql`:
   - If `campaigns` already matches this file → `migration repair --status applied 20260707100000`
   - If diff exists → write a small forward-only repair migration instead.

```bash
# Example removals (after reviewing diffs):
git rm supabase/migrations/20260703213000_ipi341_transition_booking_rpc.sql
git rm supabase/migrations/20260704090000_crm_core_schema.sql
# … etc per §4.1
git add supabase/migrations/20260704023432_*.sql
# … add all 9 fetched remote versions
```

### Step 3 — Repair remote history for removed local IDs

Mark **local-only IDs that were never applied** as reverted so CLI stops expecting them:

```bash
export SUPABASE_DB_PASSWORD=$(grep '^SUPABASE_DB_PASSWORD=' .env.local | cut -d= -f2-)

for v in 20260703213000 20260704090000 20260704100000 20260704110000 \
         20260704120000 20260704150000 20260707105444; do
  supabase migration repair --status reverted "$v"
done
```

If `20260707100000` schema already on remote:

```bash
supabase migration repair --status applied 20260707100000
```

### Step 4 — Push remaining real migrations

```bash
supabase db push --linked   # should apply only 20260703220000 (and any other true gaps)
supabase migration list --linked   # expect clean Local | Remote pairs
npm run supabase:types
cd app && npm run typecheck
npm run supabase:verify-rls
```

### Step 5 — Verify booking RPCs (not PostgREST)

```bash
infisical run --env=dev -- npm run supabase:verify-rls
# plus scripts/test-booking-transition-fsm.sql, test-get-list-bookings.sql if present
```

---

## 6. Do not do

| Action | Why |
|--------|-----|
| Blind `supabase db push` before §5 | May re-apply CRM/booking DDL → duplicate object errors |
| `supabase migration fetch` without review | Overwrites tracked migration bodies; only use to **add** missing remote files |
| `supabase link` to Fashionosv10 | Wrong database |
| `supabase start` | Remote-only policy; fresh local DB won't replay history |

---

## 7. After migrations are clean

1. Regenerate types: `npm run supabase:types`
2. Resume planner merge order (see `Universal-design-prompt-new/plan/planner/planner.md`):
   - PR #283 fixes (planner PostgREST schema, RLS probe, seed dedup)
   - Types PR → PR #284 → close/rescope IPI-476
3. Optional: add to `supabase/README.md` — canonical ref + pointer to this doc.

---

## 8. Quick reference

```bash
# Linked project
supabase projects list

# Migration drift
SUPABASE_DB_PASSWORD=$(grep '^SUPABASE_DB_PASSWORD=' .env.local | cut -d= -f2-) \
  supabase migration list --linked

# REST health
npm run supabase:verify

# Fetch missing remote SQL (inspect only; do not overwrite blindly)
SUPABASE_DB_PASSWORD=$(grep '^SUPABASE_DB_PASSWORD=' .env.local | cut -d= -f2-) \
  supabase migration fetch --linked
```

---

*Last updated: 2026-07-10 — env aligned; migration reconciliation pending migrations-only PR.*
