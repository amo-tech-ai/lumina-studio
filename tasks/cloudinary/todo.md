# Cloudinary Progress Task Tracker

**Last reviewed:** 2026-07-18

## Linear (active)

| Surface | Link |
|---------|------|
| **Project** | [Cloudinary — Media Platform](https://linear.app/amo100/project/cloudinary-media-platform-a44602c2c36f) |
| **Overview** | [Cloudinary — Overview](https://linear.app/amo100/document/cloudinary-overview-7461d13600cf) |
| **Product Plan and Roadmap** | [Cloudinary — Product Plan and Roadmap](https://linear.app/amo100/document/cloudinary-product-plan-and-roadmap-7f263c42ae23) |
| **Progress Tracker** | [Cloudinary — Progress Tracker](https://linear.app/amo100/document/cloudinary-progress-tracker-34bf8fa188cd) |

### Related active issues

- [IPI-642 · CLD-OPS-001 — Usage/Cost Monitoring](https://linear.app/amo100/issue/IPI-642)
- [IPI-265 · ASSET-UX-001 — Upload widget](https://linear.app/amo100/issue/IPI-265)
- [IPI-639 · CLD-APPROVAL-001 — Approval schema](https://linear.app/amo100/issue/IPI-639)
- [IPI-637 · CLD-EVENT-001 — Durable event inbox](https://linear.app/amo100/issue/IPI-637)


**Audit date:** 2026-07-18  
**Branch:** `ai/ipi-641-cloudinary-asset-id` @ `d6109144`  
**Production SHA:** `ea91bd5` (Vercel Production – ipix-operator, 2026-07-18T05:59:30Z)  
**Cloudinary cloud:** `dzqy2ixl0` · **Supabase:** `nvdlhrodvevgwdsneplk`  
**Plans:** [`plan/new-plan.md`](./plan/new-plan.md) · [`plan/cloudinary-supabase.md`](./plan/cloudinary-supabase.md)  
**Skills:** `cloudinary` · `ipix-supabase` · `task-verifier`

Legend: 🟢 Complete · 🟡 In progress · 🔴 Failed or blocked · ⚪ Not started

---

## Progress Task Tracker

| Status | Task | Percent complete | Verified evidence | Missing / blocker | Exact next action |
| ------ | ---- | ---------------: | ----------------- | ----------------- | ----------------- |
| 🟢 | Cloudinary account configuration | 88 | MCP `list-upload-presets` + `list-triggers`; cloud `dzqy2ixl0`; webhook preflight HTTP 401 on bad sig | No global `notification_url` on preset; no rename/eager Console triggers | Add Console `rename` trigger only after spike; document additive global triggers |
| 🟢 | Signed upload preset `ipix-signed-upload` | 100 | MCP: `unsigned:false`, `type=authenticated`, `overwrite:false`, `eager_async:true`, eager 600/1200/1600 | None for MVP | Keep preset; no unsigned fallback |
| 🟢 | Webhook signature security | 95 | `route.ts` `verifyWebhookSignature`: legacy_hmac, `CLOUDINARY_NOTIFICATION_API_SECRET` fallback, 300s replay window, whitespace env trim (#425); live preflight 401 | No live invalid-signature replay test this run | Keep secrets server-only; rotate via Infisical |
| 🟢 | Upload trigger | 100 | MCP trigger `upload` → `https://www.ipix.co/api/assets/cloudinary/webhook`, `additive:true`, `legacy_hmac` | — | Monitor delivery in prod logs |
| 🟢 | Delete trigger | 100 | MCP trigger `delete` same URL/auth; live audit row archived after Admin destroy | — | None |
| 🟡 | Rename trigger (Console) | 20 | Code handles `notification_type=rename` + `normalizeCloudinaryNotification` (#421/#425) | **No Console `rename` trigger**; Console rename untested end-to-end | Spike path A (app rename) vs B (Console trigger) before enabling |
| 🟢 | PR #421 code | 100 | MERGED; CI green (`app-build`, `supabase-web015`, `booking-gate`); on `origin/main` | Codacy ACTION_REQUIRED was process-only at merge | None — shipped |
| 🟢 | PR #425 follow-up | 100 | MERGED (#425 → `76b75444` on main); prod deploy `ea91bd5` includes squash | Branch tip `d6109144` (live-script test commit) not on main — cosmetic only | Merge or cherry-pick `d6109144` if desired; not blocking prod |
| 🟢 | Supabase migration `ipi641_cloudinary_asset_id` | 100 | Remote `20260716182739`; column `cloudinary_asset_id text NULL`; partial unique `cloudinary_assets_cloudinary_asset_id_uidx`; `version bigint` reused | — | None |
| 🟡 | Provider identity persistence | 82 | Prod direct upload: `cloudinary_asset_id=2f4cdbcd23ef19f4e2f713035ff54185`, `version=1784355404`, identity_match=true; 48 webhook Vitest | **5/6** live mirrors still null provider id (legacy); official live script blocked at upload-sign | Backfill decision for legacy rows; fix upload-sign auth (below) |
| 🟡 | Overwrite handling | 75 | Unit tests in `route.test.ts` + pipeline verifier; #425 skips assets write when public_id unchanged | No live overwrite QA this run | One disposable overwrite after upload-sign fix |
| 🟡 | Rename handling | 65 | Unit tests: `from_public_id`, `to_public_id`, stale guards, 503 retry; code on prod | No Console rename trigger; no live rename QA | Choose rename path A/B; add trigger or app rename API |
| 🟡 | Duplicate delivery idempotency | 70 | Unit tests + pipeline verifier synthetic replay | Live webhook replay not executed this run | Replay one signed upload notification in staging/prod fixture |
| 🟢 | Delete handling | 90 | Live: destroy → webhook → `status=archived`, provider id retained on mirror | — | None |
| 🟢 | Stale event protection | 95 | Tests: older version skip, equal version public_id regression block, reconcile assets on skip | — | None |
| 🟢 | Partial failure / retry (503) | 95 | Tests: mirror-before-assets, lookup error → no duplicate insert | — | None |
| 🟢 | Local webhook tests | 100 | `npx vitest run …/webhook/route.test.ts` → **48 passed** | — | Keep in pre-push gate |
| 🟢 | Local pipeline verifier tests | 100 | `npx vitest run scripts/verify-cloudinary-pipeline.test.mjs` → **47 passed** | — | None |
| 🟢 | Typecheck | 100 | `npm run typecheck` exit 0 | — | None |
| 🔴 | Lint | 0 | `eslint .` OOM at ~4GB and ~8GB (`NODE_OPTIONS=--max-old-space-size=8192`) | Memory limit on full-repo lint | Retry scoped lint on touched paths or raise CI memory |
| 🟢 | Full test suite | 100 | `npm test` → **1456 passed**, 6 skipped | — | None |
| 🟢 | Build | 100 | `npm run build` exit 0; `/api/assets/cloudinary/webhook` route present | — | None |
| 🟢 | Production deployment | 100 | Vercel Production `ea91bd5`; PR #421+#425 ancestor on main; webhook HEAD 405 (expected) | — | None |
| 🟡 | Live QA upload (end-to-end) | 65 | **Direct Cloudinary upload → prod webhook → Supabase:** identity + version match, brand correct, delete archived | `npm run verify:cloudinary-webhook-live` **FAIL** HTTP 403 `Brand not owned by caller` — upload-sign uses cookie `createSupabaseServerClient()` while script sends Bearer token | Fix upload-sign to query brand ownership with Bearer-authenticated client or org membership (`is_org_member`) |
| 🟡 | Legacy backfill decision | 25 | Counts: **1/6** mirrors have provider id (audit fixture, archived); **1** ready null (`synth-probe`); **4** processing fashionos null | Decision not recorded in Linear/docs | Record forward-only vs one-shot Admin backfill for 5 null mirrors + 1 orphan asset |
| 🔴 | Upload UI (IPI-433) | 0 | Repo grep: **zero** `CldUploadWidget`; `/app/assets` read-only workspace | Product upload path missing | Implement brand-only widget → upload-sign → poll Supabase |
| 🟡 | Asset search / library (IPI-435) | 45 | `listAssets` Supabase-first; 16 workspace tests; RLS hides null-brand (**14/25** assets) | No URL filters/search v1; stale org-aware comment in `get-assets.ts` | Extend `listAssets` filters in IPI-435 |
| ⚪ | Realtime | 0 | `pg_publication_tables`: none for `assets` / `cloudinary_assets` / `shoots` / `brands` | Deliberately unpublished | Poll in IPI-433; revisit with IPI-281 only |
| ⚪ | Shoot ingestion (SHOOT-ARCH-002) | 10 | IPI-524 ADR Option B accepted locally; webhook nulls brand on shoot folders; no `assets.shoot_id` write | Not implemented | Schedule SHOOT-ARCH-002 when shoot upload is prioritized |
| 🟡 | IPI-641 Done gate | 78 | Linear **Done** (2026-07-18); prod identity proof via direct upload; PRs merged + deployed | Official live script not green; 83% mirrors still null provider id; upload-sign org gap blocks operator path | Re-open or add follow-up if Done requires full live script + backfill decision |

---

## Evidence summary (this run)

### Git / PRs

| Item | Result |
| --- | --- |
| PR #421 | **MERGED** — identity webhook + migration + tests |
| PR #425 | **MERGED** — overwrite sync, env trim, rename URL synthesis, review fixes |
| `origin/main` | `ea91bd5b` |
| Branch vs main (webhook code) | **No diff** — prod matches branch webhook implementation |
| Branch-only commit | `d6109144` live-script assertion (not on main) |

### Local commands

| Command | Result |
| --- | --- |
| `git branch --show-current` | `ai/ipi-641-cloudinary-asset-id` |
| `git log -1 --oneline` | `d6109144 test(IPI-641): assert live webhook persists cloudinary_asset_id + version` |
| Webhook Vitest | **48 passed** |
| Pipeline Vitest | **47 passed** |
| `npm run typecheck` | **pass** |
| `npm run lint` | **fail** — JavaScript heap OOM (4GB and 8GB) |
| `npm test` | **1456 passed** |
| `npm run build` | **pass** |

### Cloudinary MCP

| Check | Value |
| --- | --- |
| Cloud name | `dzqy2ixl0` |
| Preset | `ipix-signed-upload` — signed, authenticated, overwrite false, eager async |
| Upload trigger | ✅ additive, legacy_hmac → prod webhook |
| Delete trigger | ✅ additive, legacy_hmac → prod webhook |
| Rename trigger | ❌ not configured |
| Eager trigger | ❌ not configured |
| API secret in browser | ✅ only `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` in root `.env.example` |

### Supabase SQL counts

| Metric | Count |
| --- | ---: |
| `cloudinary_assets` total | 6 |
| With `cloudinary_asset_id` | 1 (audit row, archived) |
| Null provider id | 5 |
| Ready + null provider id | 1 (`synth-probe`) |
| `assets` total | 25 |
| Null `brand_id` | 14 |
| With `cloudinary_public_id` | 2 |
| Duplicate provider ids | 0 |
| Assets with public_id, no mirror | 1 (`16-fashionos_ylgerh`) |
| Orphan mirrors (no assets row) | 4 (fashionos legacy) |
| Archived mirrors | 1 (post-delete audit) |
| Realtime publication | none for assets tables |

### Live production QA (2026-07-18)

| Stage | Result |
| --- | --- |
| Webhook preflight (bad sig) | ✅ HTTP 401 |
| Triggers configured | ✅ upload + delete additive legacy_hmac |
| `verify:cloudinary-webhook-live` | ❌ upload-sign HTTP 403 — Bearer auth not used for brand lookup |
| Direct authenticated upload → webhook | ✅ `cloudinary_asset_id` + `version` match Cloudinary response |
| Delete → webhook | ✅ mirror `status=archived` |

---

## Final verdict

| # | Question | Answer |
| --- | --- | --- |
| 1 | **Overall Cloudinary readiness** | **72 / 100** — ingest + identity proven on prod; operator upload path and legacy data debt remain |
| 2 | **Cloudinary works locally?** | **Yes** — 48 webhook + 47 pipeline + 1456 full tests + build green; lint OOM is infra-only |
| 3 | **Production works end-to-end?** | **Partial yes** — webhook identity + delete archive proven via direct upload; **not** via upload-sign + live script |
| 4 | **PR #421 fully deployed?** | **Yes** — merged and on prod SHA `ea91bd5` |
| 5 | **PR #425 required or optional?** | **Required and deployed** — overwrite/rename hardening already on prod |
| 6 | **IPI-641 can be marked Done?** | **Conditionally yes** — Linear already Done; forensic gate says **hold follow-up** until upload-sign Bearer fix + backfill decision + optional live script green |
| 7 | **Critical fixes (priority)** | 1) upload-sign brand auth (Bearer + org membership) 2) Legacy provider-id backfill decision 3) IPI-433 upload UI 4) Lint OOM / scoped lint 5) Rename Console trigger (post-spike) |
| 8 | **Execution plan to 100%** | See below |

---

## Execution plan to 100%

```text
Immediate
  1. Fix POST /api/assets/upload-sign brand ownership:
     use resolveOperatorUser Bearer session for Supabase query OR is_org_member(org_id)
  2. Re-run npm run verify:cloudinary-webhook-live against https://www.ipix.co (qa brand db1f728d…)
  3. Record backfill decision: forward-only vs Admin backfill for 5 null mirrors + fashionos orphans
  4. Scoped lint fix or CI memory bump

Next (product)
  5. IPI-433 — CldUploadWidget + poll Supabase ready (brand-only)
  6. IPI-435 — listAssets filters / URL state (parallel OK)
  7. IPI-642 — document server CLOUDINARY_* in .env.example

Later
  8. Rename spike → Console trigger or app uploader.rename + DB write
  9. SHOOT-ARCH-002 shoot folder → brand resolution
 10. Fashionos orphan cleanup / archive
 11. Realtime only if IPI-281 gallery requires it
```

---

## Do now / Next / Later (checklist)

### Do now
- [ ] Fix upload-sign Bearer + org brand ownership (blocks live script + IPI-433)
- [ ] Re-run `verify:cloudinary-webhook-live` to green on prod
- [ ] Record legacy backfill decision (5 null provider ids)

### Next
- [ ] **IPI-433** — brand-only `CldUploadWidget` + poll
- [ ] **IPI-435** — extend `listAssets` (parallel OK)
- [ ] **IPI-642** — server Cloudinary env docs
- [ ] Docs commit — IPI-524 ADR onto main

### Later
- [ ] Rename spike (A app vs B webhook) — issue only after path chosen
- [ ] Create SHOOT-ARCH-002 when scheduling shoot ingest
- [ ] IPI-638 · IPI-637 · approval chain · IPI-281

### Not now
- Rename webhook ticket as automatic P0 · Realtime for `/app/assets` · duplicate backfill tickets

---

## Linear ticket audit (2026-07-18)

**Dots:** 🟢 needed & correctly sequenced · 🟡 needed but stale/priority wrong · ⚪ defer · 🔴 stale, duplicate, or blocked by missing prereq

**Overall roadmap score: 78 / 100** — sequencing in tickets is mostly correct; several issues are stale vs shipped code, and IPI-637/638 Urgent labels are outdated.

### Correct execution order (what you actually need)

| Wave | Order | Issue | Dot | Why |
| --- | ---: | --- | --- | --- |
| **Now** | 0 | *(fix)* upload-sign Bearer + org auth | 🔴 | Blocks IPI-433 + live QA; not a Linear ticket |
| **Now** | 1 | [IPI-433](https://linear.app/amo100/issue/IPI-433) Upload workspace | 🟢 | P0 product path; `CldUploadWidget` + poll Supabase |
| **Now** | 2 | [IPI-435](https://linear.app/amo100/issue/IPI-435) Search/discovery | 🟢 | Parallel OK; extend `listAssets`, Supabase-first |
| **Now** | 3 | [IPI-642](https://linear.app/amo100/issue/IPI-642) Ops/env docs | 🟢 | Server `CLOUDINARY_*` undocumented |
| **Core UI** | 4 | [IPI-436](https://linear.app/amo100/issue/IPI-436) Asset detail (slim) | 🟢 | One preview + metadata; after library usable |
| **Audit spine** | 5 | [IPI-441](https://linear.app/amo100/issue/IPI-441) `asset_events` | 🟢 | **No table in repo** — must ship before approval |
| **Audit spine** | 6 | [IPI-639](https://linear.app/amo100/issue/IPI-639) Approval schema | 🟢 | Versioned publish gate; `cloudinary_assets.approval` exists but incomplete |
| **Audit spine** | 7 | [IPI-437](https://linear.app/amo100/issue/IPI-437) Approval UI | 🟢 | After 441 + 639 |
| **Ops** | 8 | [IPI-438](https://linear.app/amo100/issue/IPI-438) Bulk actions | ⚪ | After approval + events |
| **Ops** | 9 | [IPI-439](https://linear.app/amo100/issue/IPI-439) Metadata manager | ⚪ | After 436; Supabase-first mirror |
| **Ops** | 10 | [IPI-440](https://linear.app/amo100/issue/IPI-440) Soft delete UI | 🟡 | Webhook archives today; needs 30-day purge worker + UI |
| **Scale upload** | 11 | [IPI-434](https://linear.app/amo100/issue/IPI-434) Chunked upload | ⚪ | Phase B of 433 only |
| **Library+** | 12 | [IPI-444](https://linear.app/amo100/issue/IPI-444) Saved views | ⚪ | After 435 filters |
| **Export** | 13 | [IPI-640](https://linear.app/amo100/issue/IPI-640) Export manifest | ⚪ | Before export center |
| **Export** | 14 | [IPI-448](https://linear.app/amo100/issue/IPI-448) Channel export center | ⚪ | Named transforms + archive API |
| **Shoot** | 15 | SHOOT-ARCH-002 *(create)* | 🔴 | Blocks IPI-281 shoot ingest |
| **Shoot** | 16 | [IPI-281](https://linear.app/amo100/issue/IPI-281) Shoot gallery + Realtime | ⚪ | After SHOOT-ARCH-002 + RLS publication proof |
| **Later** | 17 | [IPI-644](https://linear.app/amo100/issue/IPI-644) Visual shot browser | ⚪ | Nice-to-have |
| **Later** | 18 | [IPI-646](https://linear.app/amo100/issue/IPI-646) Promote to references | ⚪ | After 639 approval |
| **Later** | 19 | [IPI-443](https://linear.app/amo100/issue/IPI-443) Completeness checker | ⚪ | Needs Mercur + taxonomy |
| **Later** | 20 | [IPI-447](https://linear.app/amo100/issue/IPI-447) Relationship graph | ⚪ | After 436 Where Used |
| **Later** | 21 | [IPI-449](https://linear.app/amo100/issue/IPI-449) Delivery preview | ⚪ | Cosmetic; safe zones only |
| **Later** | 22 | [IPI-80](https://linear.app/amo100/issue/IPI-80) Campaign image agent | ⚪ | Deferred; needs approval + HITL |

### Stale or rescope (update Linear)

| Issue | Dot | Evidence | Action |
| --- | --- | --- | --- |
| [IPI-637](https://linear.app/amo100/issue/IPI-637) Event inbox | 🟡 | Webhook idempotent in code (641/425); no inbox table; plan says Queues **after** proof | Downgrade Urgent → P2; trigger only on retry-storm metrics |
| [IPI-638](https://linear.app/amo100/issue/IPI-638) Delete reconciliation | 🟡 | Live delete → `status=archived` proven 2026-07-18 | Rescope to orphan report + fashionos cleanup, not greenfield sync |
| [IPI-643](https://linear.app/amo100/issue/IPI-643) Shot taxonomy seed | 🔴 | `shoot.shot_type_references`: **49 rows** across 5 categories | Mark Done or verify AC + close |
| [IPI-645](https://linear.app/amo100/issue/IPI-645) Mastra lookup | 🔴 | `lookupShotReferences.ts` shipped | Mark Done or verify agent wiring |
| [IPI-184](https://linear.app/amo100/issue/IPI-184) Epic | ⚪ | Tracker only; children A/B partially shipped | Keep as epic; don't implement monolith |

### Full ticket audit table

| Issue | Dot | Need? | Seq OK? | Score | Red flags / blockers |
| --- | --- | --- | --- | ---: | --- |
| IPI-433 | 🟢 | **Yes — P0** | 1 | 92 | upload-sign 403; no widget in repo |
| IPI-435 | 🟢 | **Yes — P1** | 2 | 90 | 14/25 null-brand hidden; thin data OK |
| IPI-436 | 🟢 | Yes | 4 | 88 | Don't ship 6 previews + graph in v1 |
| IPI-437 | 🟢 | Yes | 7 | 85 | Blocked: no `asset_events`, no 639 schema |
| IPI-438 | ⚪ | Later | 8 | 82 | Needs 441 audit trail |
| IPI-439 | ⚪ | Later | 9 | 80 | IPI-430 metadata exists; mirror sync untested |
| IPI-440 | 🟡 | Yes (narrow) | 10 | 78 | Overlaps webhook archive; needs purge worker |
| IPI-441 | 🟢 | **Yes — P1** | 5 | 91 | **Zero code** for `asset_events` |
| IPI-639 | 🟢 | **Yes — P1** | 6 | 87 | Partial `approval` column only |
| IPI-434 | ⚪ | Phase B | 11 | 90 | Must not duplicate 433 |
| IPI-637 | 🟡 | Conditional | — | 65 | **Stale Urgent**; premature vs plan |
| IPI-638 | 🟡 | Conditional | — | 70 | **Stale Urgent**; core delete path works |
| IPI-640 | ⚪ | Export path | 13 | 85 | Needs version + approval snapshots |
| IPI-448 | ⚪ | Export path | 14 | 84 | Depends 640 + 639 |
| IPI-444 | ⚪ | Later | 12 | 86 | Absorbs 442/446 — good |
| IPI-447 | ⚪ | Later | 19 | 88 | Correctly deferred |
| IPI-449 | ⚪ | Defer | 21 | 90 | Correctly "not Core" |
| IPI-443 | ⚪ | Later | 19 | 82 | Mercur truth not wired |
| IPI-642 | 🟢 | Yes | 3 | 95 | Root `.env.example` gap only |
| IPI-281 | ⚪ | After shoot arch | 16 | 92 | Correctly blocked; Realtime off |
| IPI-80 | ⚪ | Defer | 22 | 85 | Correctly deferred |
| IPI-184 | ⚪ | Epic | — | 75 | Split good; children stale |
| IPI-643 | 🔴 | **Verify Done** | — | 40 | 49 rows live — ticket stale |
| IPI-644 | ⚪ | Later | 17 | 88 | Blocked on taxonomy UX only |
| IPI-646 | ⚪ | Later | 18 | 86 | Needs 639 approval gate |

### Category grades

| Category | Score | Notes |
| --- | ---: | --- |
| MVP sequencing (433→435→436) | **92** | Correct; upload-sign fix is implicit P0 |
| Approval chain (441→639→437) | **88** | Correct order; nothing shipped yet |
| Infra tickets (637/638) | **58** | Over-prioritized vs current prod proof |
| Shoot taxonomy (184/643/645) | **72** | Work largely done; tickets not updated |
| Export / advanced (640/448/447) | **85** | Correctly deferred |
| Scope discipline | **90** | Issues rewritten to avoid duplicate systems |

### Best-practices todos (Cloudinary + Supabase)

- [ ] **Signed upload only** — keep `ipix-signed-upload` (`unsigned:false`, `type:authenticated`); never expose API secret ([upload presets](https://cloudinary.com/documentation/upload_presets))
- [ ] **Widget over custom uploader** — IPI-433 must use `CldUploadWidget` / next-cloudinary, not bespoke upload UI
- [ ] **Ready = Supabase** — poll `cloudinary_assets.status=ready`; never treat widget `onSuccess` as library-ready
- [ ] **Global triggers additive** — MCP confirms `additive:true` on upload/delete; keep preset free of conflicting `notification_url` ([notifications](https://cloudinary.com/documentation/notifications))
- [ ] **Verify notification signatures** — `X-Cld-Timestamp` replay window + `verifyNotificationSignature` (already in webhook)
- [ ] **Supabase SoT** — authz, approval, search, audit in Postgres; Cloudinary for delivery/transform only
- [ ] **RLS before Realtime** — do not publish `assets` until SHOOT-ARCH-002 + org isolation proof ([RLS](https://supabase.com/docs/guides/database/postgres/row-level-security))
- [ ] **Append-only audit** — `asset_events` table, not JSONB history arrays (IPI-441)
- [ ] **Delete with invalidate** — Admin destroy uses `invalidate:true`; soft-delete UI (440) must not move assets to Cloudinary trash folder
- [ ] **upload-sign org auth** — brand check must use Bearer session + `is_org_member`, not cookie-only + `brands.user_id`
- [ ] **Legacy backfill decision** — 5/6 mirrors still null provider id; record forward-only vs Admin backfill
- [ ] **Env docs (IPI-642)** — document `CLOUDINARY_API_SECRET`, `CLOUDINARY_NOTIFICATION_API_SECRET` server-only

---

## Linear updates applied (2026-07-18)

| Issue | Change |
| --- | --- |
| [IPI-433](https://linear.app/amo100/issue/IPI-433) | **Urgent**; upload-sign blocker + efficiency table |
| [IPI-435](https://linear.app/amo100/issue/IPI-435) | Efficiency: extend `listAssets`, no Cloudinary Search |
| [IPI-436](https://linear.app/amo100/issue/IPI-436) | Slim scope + blocked by 435 |
| [IPI-441](https://linear.app/amo100/issue/IPI-441) | **Todo**; minimal `asset_events` migration |
| [IPI-639](https://linear.app/amo100/issue/IPI-639) | **Todo**; extend existing `approval` column |
| [IPI-437](https://linear.app/amo100/issue/IPI-437) | Blocked by 441+639 |
| [IPI-637](https://linear.app/amo100/issue/IPI-637) | **Urgent→Medium**, Backlog, rescoped inbox |
| [IPI-638](https://linear.app/amo100/issue/IPI-638) | **Urgent→Medium**, Backlog, drift report only |
| [IPI-643](https://linear.app/amo100/issue/IPI-643) | **Done** (49 taxonomy rows) |
| [IPI-645](https://linear.app/amo100/issue/IPI-645) | **Done** (lookupShotReferences wired) |
| [IPI-434](https://linear.app/amo100/issue/IPI-434) | Low priority; blocked by 433 |
| [IPI-438–440, 642, 184, 281](https://linear.app/amo100/issue/IPI-438) | Efficiency sections + defer/rescope |

### Refinements applied (2026-07-18 v2)

| Issue | Change |
| --- | --- |
| [IPI-433](https://linear.app/amo100/issue/IPI-433) | Resilience AC: timeout, retry, cancel, refresh recovery; Wave 1 sequence |
| [IPI-435](https://linear.app/amo100/issue/IPI-435) | `EXPLAIN ANALYZE` done gate; blocks IPI-436 |
| [IPI-441](https://linear.app/amo100/issue/IPI-441) | v1 event types locked in first migration |
| [IPI-639](https://linear.app/amo100/issue/IPI-639) | Identity binding AC: `cloudinary_asset_id` + version |
| [IPI-281](https://linear.app/amo100/issue/IPI-281) | Blocked by IPI-433 + SHOOT-ARCH-002; Realtime Phase B |
| [IPI-436–440, 638, 642](https://linear.app/amo100/issue/IPI-436) | Full execution sequence + blocker graph |

**Approved sequence (final validated — 2026-07-18 v3):**

```text
Step 0   Fix upload-sign org auth (bundle into IPI-433 PR)

Wave 1   IPI-433 ∥ IPI-435 ∥ IPI-642     — operator upload foundation

Wave 2   IPI-436                          — asset detail workspace

Wave 3   IPI-441 → IPI-639 → IPI-437 → IPI-438   — approval + audit chain

Wave 4   IPI-638 → IPI-440                — drift report, then Trash

Later    IPI-444, IPI-439, IPI-640, IPI-448, IPI-637, IPI-434,
         IPI-281 (needs SHOOT-ARCH-002), IPI-80
```

**Immediate rule:** Complete one real app upload (IPI-433), confirm it appears in library (IPI-435), before opening advanced Cloudinary work.

### Foundation complete (do not rebuild)

| Issue | Status |
| --- | --- |
| IPI-430 CLD-000 | 🟢 Complete |
| IPI-636 CLD-WEBHOOK-001 | 🟢 Complete — prod webhook proven |
| IPI-641 CLD-ID-001 | 🟢 Complete |
| IPI-643 SHOOT-DATA-002A | 🟢 Complete — 49 rows |
| IPI-645 SHOOT-DATA-002B | 🟢 Complete — lookupShotReferences |

### Active status corrections

| Issue | Status | Note |
| --- | --- | --- |
| IPI-433 | 🔴 P0 | Main blocker — upload-sign org auth |
| IPI-435 | 🟡 Partial | listAssets exists; filters/URL state pending |
| IPI-638 | 🟡 Narrow | Delete works; drift report only |
| IPI-637 | ⚪ Deferred | Until metrics justify inbox |
| IPI-281 | 🔴 Blocked | IPI-433 + SHOOT-ARCH-002 |

### Roadmap score (final validated — v4 audit)

| Area | Score |
| --- | ---: |
| Dependency accuracy | 98/100 |
| MVP focus | 98/100 |
| Scope efficiency | 97/100 |
| Production sequencing | 97/100 |
| Over-engineering risk | 96/100 |
| **Overall** | **97/100** |

| Issue audit | Score |
| --- | ---: |
| IPI-433 CLD-101 | 92/100 — ready to implement |
| IPI-435 CLD-102 | 93/100 — blocker fix applied |
| IPI-281 SHOOT-AI-004A | 95/100 — phased A→D |

**Next execution target:** IPI-433 (upload-sign org auth + widget + poll by `cloudinary_asset_id`) → verify upload appears in IPI-435 library.

### SHOOT-ARCH-002 (deferred — create when gallery scheduled)

Scope when created:

- Resolve `shoot_id` during upload or ingestion
- Persist asset-to-shoot relationship
- Enforce org + brand ownership
- Prove one uploaded asset appears under correct shoot
- **No** Realtime · **no** gallery UI

### Wave 1 blocker fix (2026-07-18 v4)

- **IPI-433 does NOT block IPI-435** — parallel development; verification dependency only
- **IPI-433 blocks IPI-436 + IPI-281** (wave completion / shoot foundation)
- **IPI-435 blocks IPI-436** (library filters first)

### Per-task efficiency cheat sheet

| Issue | Most efficient path | Avoid |
| --- | --- | --- |
| **433** | `CldUploadWidget` → existing sign route → poll Supabase | Custom uploader, Realtime, backend queue table |
| **435** | Extend `listAssets` + URL params on indexed columns | Cloudinary Search API, new search route |
| **436** | Reuse AssetCard + one signed preview | Six channel previews, relationship graph |
| **441** | One append-only migration + webhook writes | JSONB history, event-sourcing framework |
| **639** | Extend `cloudinary_assets.approval`; migration-only PR | Duplicate approval in Cloudinary |
| **437** | Brand-scoped queue; bind exact version | Media Library embed, approve by public_id |
| **638** | Dashboard SQL drift report → optional script | Rebuild delete webhook |
| **637** | Wait for 503 metrics; Postgres inbox before Queues | Queues before product upload ships |
| **642** | Single `.env.example` docs PR | Monitoring platform, R2 mirror |
| **434** | Widget `multiple` / `upload_large` when needed | Custom chunk protocol |
| **440** | Soft-delete columns + 30d purge Cron | Cloudinary trash folder |
| **448/640** | Named transforms + archive API + manifest rows | Browser ZIP as SoT |
| **281** | One query + one Realtime sub after SHOOT-ARCH-002 | Realtime on library; second assets UI |
