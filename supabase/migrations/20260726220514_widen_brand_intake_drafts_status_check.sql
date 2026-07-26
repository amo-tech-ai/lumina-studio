-- IPI-807 · ONB-AI-001 — accept 'pending_approval' in brand_intake_drafts.status
--
-- The HITL brand-DNA flow writes status='pending_approval'
-- (app/src/mastra/workflows/brand-intelligence-workflow.ts:250), but the live CHECK
-- constraint allows only pending/approved/rejected/expired. Every draft write therefore
-- fails with SQLSTATE 23514 and no brand ever reaches the approval queue.
--
-- `drop constraint if exists` is required, not defensive noise. The constraint was created
-- out-of-band on the remote and appears in none of the 243 tracked migrations — a grep for
-- `brand_intake_drafts_status_check` / `add constraint ... status` across supabase/migrations
-- returns only cloudinary_assets hits, and 20260626000005 creates the table with a bare
-- `status text not null default 'pending'`. Without IF EXISTS this breaks every environment
-- that never received the out-of-band constraint.
--
-- Deliberately not used here:
--   * NOT VALID / VALIDATE CONSTRAINT — the table holds 27 rows, all status='pending', so a
--     plain validating ADD is instant and leaves no unvalidated constraint behind.
--   * a Postgres enum — ALTER TYPE ... ADD VALUE cannot run inside a transaction block,
--     which is exactly how Supabase's migration runner executes these files.
--
-- There is no RLS leg: intake_drafts_select_org_or_owner (20260626000005) does not reference
-- status at all. The only other status-aware object is the partial index in 20260715010000,
-- which already covers 'pending_approval'.
--
-- Provenance: applied to the remote on 2026-07-26 and recorded in
-- supabase_migrations.schema_migrations as version 20260726220514 — this file is named to
-- match so the tracked chain and the remote history agree and no `db push` re-runs it. No
-- workflow in .github/workflows applies migrations at all; DDL reaches the remote
-- out-of-band, which is how the original constraint came to be missing from the chain. The
-- statements below are idempotent regardless: drop-if-exists followed by add.
--
-- All four readers already agree on the value:
--   app/src/mastra/workflows/brand-intelligence-workflow.ts:250  writer
--   app/src/app/api/_lib/process-draft-approval.ts:5             PENDING_DRAFT_STATUS
--   app/src/app/(operator)/app/brand/[id]/page.tsx:67            .eq("status", ...)
--   app/src/lib/command-center/queries.ts:21                     PENDING_DRAFT_STATUSES

alter table public.brand_intake_drafts
  drop constraint if exists brand_intake_drafts_status_check;

alter table public.brand_intake_drafts
  add constraint brand_intake_drafts_status_check
  check (status in ('pending', 'pending_approval', 'approved', 'rejected', 'expired'));
