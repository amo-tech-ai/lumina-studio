# Planner security audit session notes (2026-07-14)

Salvaged from agent-worktree AGENTS.md append.


## Conversation Summary

### 2026-07-14 — Planner security audit & verification

**Session scope:** Comprehensive audit of IPI-575 PR #387 security fix and all 22 planner-related Linear tasks (IPI-483 through IPI-594). Generated `planner-audit-6.md`.

**Key work:**
- Implemented migration `20260714211800` fixing SEC-003 (manager gate on invite), SEC-003b (role promotion bypass), SEC-004 (email enumeration cloaking), and error reordering
- Implemented migration `20260714220000` closing RLS assignments_insert bypass path (SEC-003 at RLS layer)
- Authored `verify-rls.mjs` for RLS policy testing
- Authored comprehensive audit of all 22 planner tasks across 8 scoring dimensions

**Post-audit corrections from verification report (11 claims, 10 confirmed):**
- IPI-579/580 are blocked by IPI-574 (not "Ready to start")
- IPI-588 depends on IPI-578, not IPI-579/580
- Migration integrity: `20260714211800` was edited in-place after being `db push`'ed to remote; `20260714220000` never pushed — out-of-band changes not reflected in migration history
- Canary-frontend IPI-575/576, Scheduling, Charting screens are 0-40% (not complete)
- Scoring colors had 3 mismatches against the published legend
- `needsApproval` is a planned limitation (IPI-483), not a defect
- Shared WeekGrid rendering abstraction is wrong — Timeline/Kanban/Calendar/List should not share a layout component

**Migration integrity to fix:**
- `20260714211800` — current git content differs from what was applied to remote DB (in-place rewrite)
- `20260714220000` — exists locally but never `supabase db push`'ed to remote

### 2026-07-16 — IPI-432/CLD-105 E2E pipeline smoke test COMPLETE

**What shipped:** The full Cloudinary pipeline smoke test (`npm run verify:cloudinary-pipeline`) now proves signed upload → Cloudinary → webhook → Supabase rows (brand_id resolved) → DNA audit → signed delivery URL (200 image/*) → cleanup.

**Key fix:** The test folder was changed from `ipix/cld105-test` to `ipix/brands/{brandId}/cld105-test` so the webhook's `resolveBrandId` can extract the brand UUID from the folder path — the regex `BRAND_FOLDER_RE` requires `ipix/brands/<uuid>/...` to produce a non-null `brand_id`.

**Webhook delivery:** Cloudinary Free plan does NOT deliver async `notification_url` webhooks to ephemeral `.trycloudflare.com` tunnels. The test works around this by POSTing a properly signed notification to the webhook endpoint directly from the upload response data — verifying signature verification, row creation, DNA trigger, and delivery URL generation. This limitation is documented; the webhook route itself is fully functional and tested.

**Live E2E result (2026-07-16 03:38 UTC):** ALL 10/10 stages PASS in 9.8s. 1303/1309 unit tests pass (6 skipped), typecheck clean.

**Stages:**
1. `image-created` — 1108 bytes generated
2. `upload-signature` — brand-aware folder returned
3. `cloudinary-upload` — public_id in brand test folder
4. `webhook-received` — assets.id created
5. `supabase-row` — brand_id matched, status=ready
6. `dna-status` — populated (dna_score=0)
7. `signed-delivery` — URL generated
8. `delivery-http-200` — HTTP 200 image/png
9. `cleanup` — all assets and rows removed