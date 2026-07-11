# Cloudinary Media Operating System — iPix/FashionOS

**Status:** Draft plan, verified against code/schema/account state 2026-07-11. **Corrected 2026-07-11 (same-day follow-up pass):** replaced the `update_access_mode`-based approval design with the documented `access_control` mechanism throughout (§1, §5, §8, §14, §16); made command-response-first (not webhook-first) confirmation explicit; added version-bound approvals and a rights-expiration gate (§8); softened the Mastra/DNA-scoring move from required to optional (§3, §11); corrected the "no migration needed" framing and required a quarantine step before deleting orphaned `cloudinary_assets` rows (§20); added webhook inbox/outbox + dead-letter handling (§14) and a new §21 covering immutable publishing manifests and an original-asset backup/vendor-exit strategy. Nothing in this pass touched Cloudinary account settings, production data, migrations, or Linear — doc-only, per instruction.
**Restores:** This file was referenced as canonical by `linear/issues/IPI-257-cloudinary-pipeline.md` and other docs but had been deleted — `tasks/cloudinary/` was an empty directory before this write. Broken cross-references to `MEDIA-MAP.md` and `cloudinary-architecture.md` (also missing) are noted where relevant rather than silently assumed fixed.

**Method:** Three parallel research passes (codebase audit, Linear/repo-docs audit, Cloudinary official-docs research) plus direct verification against the live Supabase DB and the live Cloudinary account (Admin API `usage()` call). Every claim below is either a file:line citation, a SQL query result, or a fetched-and-read Cloudinary doc page — not an assumption. Where something couldn't be verified, it's marked ⚪ and named as an open question, not guessed.

---

## 1. Executive summary

iPix has a **working core upload pipeline** (signed upload → Cloudinary → webhook → dual Supabase write → auto DNA scoring) that is genuinely solid — signature-verified webhooks, replay protection, shared transform-preset definitions, real end-to-end tested this session with a live upload. But three things are true simultaneously:

1. **The pipeline that exists is currently broken on `main`.** The `next.config.ts` fix that lets `next/image` render a signed Cloudinary URL, the org-aware RLS policy, and a Cloudinary-URL-transform helper all shipped this week — on **unmerged branches**. Today, on `main`, any real (non-fixture) asset throws a Next.js image error and non-owner org members see an empty asset library.
2. **Everything past "upload and see a thumbnail" is schema-scaffolded but code-dark.** `cloudinary_assets.approval` and `cloudinary_assets.moderation_status` are real, constrained, non-null database columns — and zero lines of application code ever write anything to them but their default value. The webhook explicitly acknowledges and discards Cloudinary moderation notifications today (`route.ts:276-277`). No metadata is read back. No duplicate detection. No versioning consumer. `<CldImage>`, the actual reason `next-cloudinary` is installed, is used nowhere — every delivery URL is hand-built.
3. **A detailed, 18-issue Linear plan for exactly this problem already exists** (CLD-101 through CLD-118, created 2026-07-07), disconnected from both the completed IPI-257 pipeline epic and this session's new findings, and itself possibly duplicating an older CLD-004/CLD-009 pair. **This document's job is as much reconciliation as it is new planning** — Section 17 maps every proposed task against what already exists in Linear rather than re-inventing it.

**Cloudinary account reality check:** iPix is on the **Free plan** (verified via `cloudinary.api.usage()`: 0.05/25 credits used, 480 objects, 261 resources). This matters architecturally: **Creative Approval Proofs/Flows and EasyFlow are Enterprise-only** — not accessible on the current account, no self-serve upgrade path. **PowerFlow is not tier-gated** (metered by "touchpoints" instead) and is the one MediaFlows product actually usable today. Ongoing/automatic moderation requires Advanced plan or higher; Free caps at 500 total moderation actions. Any plan section proposing Cloudinary-native approval UI must be read against this — the pragmatic path (and the one IPI-437 already independently proposed) is a **self-built approval layer using the `access_control` parameter** (`access_type:"anonymous"|"token"` + `start`/`end`, set via the standard `upload`/`explicit`/`update` calls — see §8's correction), not Cloudinary's native Enterprise reviewer UI, and **not** the older bulk `update_access_mode` endpoint, which current Cloudinary docs (`control_access_to_media`, `admin_api`) no longer document or recommend for new work as of this session's research (2026-07-11) — treat it as legacy/unverified rather than deprecated-but-safe.

---

## 2. Current-state audit (verified findings)

### What's real and working
| Capability | Evidence |
|---|---|
| Signed upload signing | `app/src/app/api/assets/upload-sign/route.ts` — `cloudinary.utils.api_sign_request`, folder/context/eager-transform param construction |
| Webhook signature verification | `webhook/route.ts:218-254` — HMAC via `verifyNotificationSignature`, 300s replay window |
| Dual-table sync on upload | `webhook/route.ts:59-136` — upserts `assets` (find-by-`cloudinary_public_id`) then `cloudinary_assets` (upsert `onConflict:"public_id"`) |
| DNA auto-scoring trigger | `webhook/route.ts:172-207` — fires `audit-asset-dna` edge function via `after()`, 35s timeout, non-blocking |
| Shared transform presets | `lib/cloudinary/url.ts` `CLOUDINARY_PRESETS` — same preset used for eager pregeneration (`upload-sign/route.ts:131`) and signed/public delivery (`cropTransformString`) — no drift-prone duplication |
| Real signed-URL rendering (this session) | Live-tested: real `type:"authenticated"` upload → `cloudinarySignedPresetUrl()` → curl confirmed `200 image/jpeg`, transform correctly applied (1267×1900 → 600×900, 42952→30309 bytes) |

### What's schema-scaffolded but code-dark
| Field/table | Reality |
|---|---|
| `cloudinary_assets.approval` (pending/approved/rejected) | Written once at row creation (implicit default), never updated by any code path |
| `cloudinary_assets.moderation_status` (pending/approved/rejected/skipped, CHECK-constrained) | Same — plus the webhook explicitly discards `notification_type:"moderation"` events (`route.ts:276-277`, confirmed by its own test) |
| `cloudinary_assets.delivery_type` (default `"authenticated"`, comment says flips to `"upload"` post-approval) | No code reads or writes it after insert. The "flip to public after approval" described in `upload-sign/route.ts:121-123`'s own comment **is not implemented anywhere** |
| `cloudinary_assets.version` | Captured from webhook payload, never read back — no revision UI, no "newer version exists" logic |
| `<CldImage>` (next-cloudinary) | Package installed (`^6.17.5`), zero component usages found — the only import is `getCldImageUrl`, used as a plain string-builder |
| Metadata `context` param | Written on upload, never read back by any Admin API call — no round-trip |

### What's missing entirely
Duplicate detection, tag sync (`add_tag`/`resources_by_tag`), any moderation add-on config on upload, any ecommerce-to-asset code path (table `commerce_product_links` exists, zero references from `lib/cloudinary`/`api/assets`), Postiz (zero code, PRD-only), Chatwoot (zero code in this Next.js app — its own PRD was written for a *different, Vite-based* codebase).

### The three unmerged fixes (this session, real risk today)
1. `next.config.ts` `images.remotePatterns` missing `/image/authenticated/**` — **`main` will 500 `next/image` on any real signed asset.** (Branch: `ipi/404-next-image-cloudinary-config`, PR #324.)
2. `assets_select_via_brand` RLS not org-aware — non-owner org members see zero assets. (Branch: `ipi/499-assets-org-rls`, PR #321.)
3. `withCloudinaryPreset()` (URL-transform injection for legacy/public URLs) — exists only on the IPI-404 feature branch, PR #320.

**These three should merge before anything in this plan's "Core" phase starts** — building governance features on top of a broken rendering path compounds the debt.

---

## 3. Verified architecture (as it exists today, not aspirational)

```
Client upload flow (only real path — no CldUploadWidget exists):
  Browser → POST /api/assets/upload-sign (signs params, always type:"authenticated")
  Browser → PUT directly to Cloudinary (client never touches API secret)
  Cloudinary → POST /api/assets/cloudinary/webhook (signed notification)
    → upsert public.assets (by cloudinary_public_id)
    → upsert public.cloudinary_assets (by public_id, richer metadata mirror)
    → after(): POST /functions/v1/audit-asset-dna (Deno edge fn, Gemini-based DNA scoring)
      → writes assets.dna_score / dna_status / dna_pillars

Delivery flow (fragmented — two independent code paths, no shared component):
  Public/legacy URL → isDeliverableCover() check → next/image (direct)
  Signed/authenticated URL → cloudinarySignedPresetUrl() (server, SDK) → next/image
  (next-cloudinary's <CldImage> — installed, unused, both paths hand-roll instead)
```

Two Mastra-adjacent facts worth naming: the **only** Mastra file touching Cloudinary (`agents/visual-identity.ts`) does so for an unrelated concern (brand homepage screenshots → `brands.ai_profile`), and the actual asset DNA-scoring — an AI-reasoning task that *could* fit Mastra's ownership rule (§4) — happens in a **Deno edge function outside Mastra entirely**. This is a real architectural inconsistency, but **moving it is optional, not a required fix**: the edge function works today, has no reported correctness problem, and moving it only pays off once something concrete needs it inside Mastra's orchestration (HITL, composition with other tools). Revisit in the Advanced phase (§16) only if such a concrete need shows up — don't schedule the migration for its own sake.

---

## 4. Source-of-truth boundaries

Per the requested ownership model, refined against what's actually verified:

```
Cloudinary   → media bytes, transformations, delivery URLs, Cloudinary-native metadata/tags,
               moderation execution, MediaFlow automation triggers
Supabase     → business entities (assets, cloudinary_assets, brands, shoots), org access,
               approval STATE (not execution), audit records, RLS
Mastra       → AI reasoning/scoring/recommendations, HITL orchestration
               (today: only visual-identity's screenshot analysis — DNA scoring should move here)
MediaFlows   → low-code automation + external HTTP calls out to Supabase Edge Functions/Mastra
               (PowerFlow only — EasyFlow/Creative-Approval are Enterprise-gated, unavailable)
```

**Concrete rule to stop the duplication already found in §2:** the **approval decision** (who approved, when, why, at what asset version) is a **Supabase-owned business record** — it belongs in a new `asset_approval_events` table (§8, §10), not solely inferred from Cloudinary state. Cloudinary owns the **enforcement** of that decision (the actual `access_control`/delivery-type change) plus its own moderation execution and results. `cloudinary_assets.approval`/`moderation_status`/`delivery_type` are a Supabase-side *cache* of Cloudinary-side enforcement state — updated from the **API command's own response** first (§5, §8 correction — do not wait on an unconfirmed webhook), with any later webhook/notification treated as a secondary reconciliation signal, not the primary source of truth. No UI or agent should hand-write these three columns to reflect a decision that was never actually sent to Cloudinary. `assets.dna_status` is the inverse — a Supabase/Mastra-owned judgment about content, Cloudinary never sees it. This closes the exact gap IPI-437 already scoped but never built.

---

## 5. Lifecycle state model

Real, current lifecycle (not proposed) — this is what today's code actually implements:

```
upload-sign called → signed params issued (no DB row yet)
  → Cloudinary receives file, type:"authenticated" always
    → webhook "upload"/"eager" notification
      → assets row created/updated (cloudinary_public_id linked)
      → cloudinary_assets row upserted (status:"ready", approval:"pending", moderation_status:"pending")
      → [image only] DNA audit fired async → assets.dna_score/dna_status/dna_pillars populated
    → webhook "delete" notification
      → cloudinary_assets.status → "archived"  (⚠ public.assets row is NOT touched — real gap, §8)
```

Proposed lifecycle addition (Core phase, §16) — the missing "approval" half, **corrected** to use the currently-documented `access_control` mechanism instead of the undocumented `update_access_mode` bulk endpoint (see §1, §8):

```
cloudinary_assets.approval:"pending" (as today), version pinned at upload time (§8 version-bound rule)
  → brand guardian reviews in a real approval queue UI (not built — IPI-437/CLD-104)
  → Approve action → server calls Cloudinary's `explicit`/`update` API with
    access_control:[{ access_type:"anonymous" }] (or a token/date-scoped rule for
    rights-expiring assets, §8) → **the synchronous API response is the confirmation**;
    write cloudinary_assets.approval:"approved", delivery_type:"upload" (or equivalent)
    directly from that response, in the same request/transaction as the approval-event
    row (§8, §10) — do not wait on a webhook (no Cloudinary notification_type for an
    access_control change is documented; treat one as absent, §14)
  → Reject action → reason required → cloudinary_assets.approval:"rejected" (Supabase-direct write
    is acceptable here since there's no corresponding Cloudinary-side state to desync from —
    a rejected asset just never gets its access_control relaxed)
```

---

## 6. Metadata model

**Today:** one write-only string (`context = brand_id=|shoot_id=|campaign_id=`), never read back. No Cloudinary Structured Metadata fields are defined on the account (verify via Console — not checked by this pass, Admin API `usage()` doesn't expose metadata field definitions; ⚪ open question, needs an Admin API `metadata_fields()` call to confirm zero exist).

**Proposed (matches the already-written IPI-430/CLD-000 spec — do not re-derive, just build it):** controlled-vocabulary Structured Metadata fields for `brand_id`, `shoot_id`, `season`, `sku`, `approval_status`, `asset_type`, `dna_score`, `orientation`, `usage_rights`, defined once via the Admin API, referenced by a single `ipix-signed-upload` preset name exported from `lib/cloudinary/url.ts` (`CLOUDINARY_UPLOAD_PRESET`). IPI-430 already has this exact AC list — this plan endorses it as-is rather than rewriting it (see §17 reconciliation).

---

## 7. Webhook design

**Current, working:** signature+replay verification, non-fatal error handling (always 200s to avoid Cloudinary retry storms), `upload`/`eager`/`delete` handled, everything else acked-and-dropped.

**Gaps to close (Core phase):**
- **Moderation notifications are silently discarded.** Add a `notification_type === "moderation"` branch that writes `cloudinary_assets.moderation_status` from the payload.
- **Delete doesn't touch `public.assets`.** A deleted Cloudinary asset leaves a live, unarchived `assets` row — `/app/assets` would still show it. Decide: cascade the archive, or add an `assets.archived_at` the read query filters on.
- **No dead-letter/alerting on write failure.** `route.ts:279-283` deliberately swallows processing errors to avoid retry storms — correct for Cloudinary's sake, but means a failed DB write today has zero operator-facing signal beyond a `console.error`. Add an `ai_agent_logs`-style failure row (the pattern already exists at `logNonFatal`, `route.ts:42-57` — extend it to failure paths too, not just success).
- **`brand_id` resolution only works for brand-folder uploads.** Shoot/campaign-folder uploads get `brand_id: null` by explicit design (documented gap, `route.ts:33-37`) — resolve via a `shoot.shoots` lookup once that FK ambiguity (flagged in this session's IPI-499 work) is settled.

---

## 8. Approval architecture

Given the Free-plan constraint (§1) and IPI-437's own scoping, the recommended architecture is a **self-built approval layer**, not Cloudinary's native Creative Approval product:

1. Asset lands as `cloudinary_assets.approval:"pending"`, `type:"authenticated"` (invisible to public delivery — this is already true today). **Record the Cloudinary `version` at this point** — this is the version the approval will be bound to (item 7).
2. A real approval queue UI (does not exist yet) lists pending assets, scoped by brand/org RLS.
3. **Approve** → server action calls Cloudinary's `explicit`/`update` API with an `access_control` rule (§1, §5) — **not** the undocumented `update_access_mode` bulk endpoint. **Correction from this plan's earlier draft:** do not design this around `update_access_mode`; current Cloudinary docs (`control_access_to_media`, `admin_api`, fetched 2026-07-11) document `access_control` as the supported mechanism for public/restricted/token/time-windowed delivery and do not mention `update_access_mode` at all. **Before committing to this architecture, run one real, non-destructive `access_control` update against a disposable test asset on the live account and confirm the resulting delivery URL behavior** — this plan has not yet done that live test (§14 open question #1 replaces the old "verify webhook exists" question with this one).
4. **Confirmation model:** the synchronous API response from step 3 is the **primary** confirmation — write `cloudinary_assets.approval:"approved"` (and the approval-event row, item 5) from that response directly, in the same request. Do **not** design the write to depend on an async webhook: no Cloudinary `notification_type` for an `access_control`/access-mode change is documented, so a webhook-first design would leave approvals permanently stuck if that notification never arrives. A best-effort reconciliation job (§14) may later cross-check via a scheduled Admin API read, but it is secondary, not the trigger.
5. **Reject** → reason required, comment optional, direct Supabase write (no Cloudinary-side change needed — the asset simply keeps its restrictive `access_control` rule).
6. Approval history — `who/when/action/comment/asset_version` — needs a new table (`asset_approval_events` or similar); does not exist today (§10).
7. **Version-bound approvals:** an approval is only valid for the exact Cloudinary `version` it was granted against. If the underlying asset is replaced (new `version` via re-upload/overwrite), `cloudinary_assets.approval` must reset to `"pending"` and the prior approval-event row stays as history, not as a still-valid approval for the new bytes — otherwise a re-upload could silently inherit approval it never earned.
8. **Rights-expiration gate:** for assets with a licensing/usage-rights end date, use `access_control`'s `end` field (or a Supabase-side `rights_expires_at` checked before rendering, if the licensing window is shorter than what should stay live on Cloudinary) so an expired asset stops being deliverable without a manual follow-up action.
9. SLA tracking (24h breach warning) — computed client-side from `cloudinary_assets.created_at` vs now; no new column needed.

This is IPI-437/CLD-104's own AC list, refined with three corrections this plan makes beyond the original issue: (a) `access_control`, not `update_access_mode`, per the live-doc research above; (b) command-response-first confirmation, not a webhook that isn't confirmed to exist; (c) version-bound approval + rights-expiration gate (items 7–8), neither of which the original issue scoped.

---

## 9. MediaFlows architecture

**Usable today (Free plan doesn't block PowerFlow):**
- `On Webhook Received` — a PowerFlow can be triggered from iPix's own backend (e.g., "re-run moderation on this asset")
- `Send HTTP Request` — a PowerFlow step can call an iPix Supabase Edge Function or a Mastra agent endpoint directly, meaning Cloudinary-side events (moderation complete, access-mode changed) can push into iPix without iPix polling
- `Manual Moderation` / `Amazon Image Moderation` (Rekognition) / `AI Vision Moderate By Prompts` — usable moderation blocks; Free plan caps at 500 total moderation actions, worth monitoring (§15)
- `Trigger Another Flow` — composable sub-flows for e.g. "on upload → moderate → if clean, notify approval queue"

**Not usable on current plan:** `On Proof Status Change` (ties to Enterprise-only Creative Approval), EasyFlow builder itself.

**Recommended first PowerFlow** (Advanced phase): upload → `Manual Moderation` or `Amazon Image Moderation` → `Send HTTP Request` to a new `/api/assets/cloudinary/moderation-webhook` route (separate from the upload/delete webhook above, since MediaFlows' outbound call shape likely differs from Cloudinary's native upload notification payload — verify payload shape before building, §14) → writes `cloudinary_assets.moderation_status`.

---

## 10. Supabase schema changes

No new tables needed for the Core phase — `cloudinary_assets` already has the columns (`approval`, `moderation_status`, `delivery_type`) this plan's approval/moderation flows need; they just need code that writes to them. New schema needed:

- `asset_approval_events` (approval history — who/when/action/comment/SLA) — Advanced phase, needed for §8 step 5.
- `assets.archived_at` (or equivalent) — Core phase, closes the delete-doesn't-cascade gap (§7).
- Structured-metadata-backed columns are **not** needed in Supabase if Cloudinary's own Structured Metadata API is used as the source of truth for `season`/`sku`/`usage_rights`/etc. — avoid the duplication trap named in §4 by deciding this explicitly rather than silently mirroring both places.

All of the above are additive, RLS-required, single-concern migrations per this repo's own hard rule — never bundle with application code (this session paid the cost of getting that wrong once already, on IPI-499/PR #321).

---

## 11. Mastra tools and workflows

Two changes, both Advanced phase (not blocking Core):

1. **(Optional — not required)** Move DNA scoring into a Mastra tool, replacing the direct `audit-asset-dna` edge-function HTTP call from the webhook. Today it's a webhook → Deno edge function → (presumably) Gemini call, entirely outside Mastra's agent registry — meaning it can't participate in HITL orchestration or be composed with other Mastra tools. This is an architectural inconsistency against §4's ownership rule, but the edge function is working code with no correctness issue; only do this migration once a real feature needs DNA scoring inside Mastra's orchestration (e.g. an HITL approval flow that reasons over the score) — moving it purely for architectural purity is not worth the churn on its own.
2. **A `cloudinary-asset-tool`** for Mastra agents to query asset state (approval/moderation/DNA) when reasoning about a brand's readiness — e.g., a future "campaign readiness" agent that needs to know how many assets are still pending approval.

---

## 12. Postiz / Chatwoot / ecommerce integrations

All three are **Future phase, not Core or Advanced** — confirmed zero code today, and in Chatwoot's case the existing PRD (`docs/prd/prd-chatwoot.md`) was written for a different (Vite/React Router) app tree than the current Next.js `app/`, so "integrate it" is actually "port a PRD to a different stack + then integrate," not a small task. Don't schedule either until the approval/moderation Core+Advanced phases are real, since publishing an unapproved or unmoderated asset to a social channel or storefront is a worse failure mode than a missing feature.

Ecommerce: `commerce_product_links` table exists with zero wiring to assets. Cloudinary's own ecommerce workflow docs (§ web research) have no Medusa integration (only Shopify/Salesforce/commercetools) — confirms the generic PowerFlow + webhook pattern this plan already recommends elsewhere is the right approach here too, not a Cloudinary out-of-box connector.

---

## 13. Security and RLS requirements

- **Merge the three unmerged fixes first** (§2) — PR #320/#321/#324. Until then, this is the standing security/correctness gap, not anything proposed here.
- `CLOUDINARY_API_SECRET`/`CLOUDINARY_API_KEY` are server-only by *convention* (never appear in a client-importable file) but not enforced by a lint rule — `scripts/check-client-env.mjs` (used elsewhere in this repo) should add these to its forbidden-literal list the same way it already covers `SUPABASE_SERVICE_ROLE_KEY`.
- Webhook signature verification is solid; **add rate-limiting** on `/api/assets/cloudinary/webhook` (not currently present) since it's an unauthenticated-by-design public endpoint (auth is the HMAC signature, but nothing stops a flood of invalid-signature requests from consuming compute).
- RLS on `cloudinary_assets` itself — verify it mirrors `assets`' org-aware policy once #321 merges (not independently checked in this pass; ⚪ open question).
- Approval-bypass risk: once the approval UI exists, the **only** legitimate path to `access_mode:"public"` must be the approve action → Cloudinary API call → notification-confirmed DB write (§8). Any code path that writes `cloudinary_assets.approval:"approved"` without a corresponding verified Cloudinary state change is a bypass.

---

## 14. Observability and failure recovery — plus open questions requiring verification

**Failure recovery gaps (§7):** no dead-letter queue for failed webhook writes, no alerting, `console.error` only. **Required addition (this session's correction):** treat every inbound Cloudinary webhook call as an event that must be durably recorded before processing — an `webhook_events` (or reuse `ai_agent_logs`-style) **inbox** row written first (raw payload + signature-verified flag + received_at), processed, then marked `processed_at`/`error`. Failed processing retries from the inbox row (bounded retry count) instead of relying on Cloudinary's own retry behavior, and a row that exhausts retries becomes a visible dead-letter entry an operator can inspect — not a silent `console.error`. The same inbox/outbox pattern applies to any outbound Cloudinary API command this plan proposes (§5, §8 approve/reject) that must survive a mid-request crash: log the intent before calling Cloudinary, log the result after, so a crash between the two is detectable and retriable rather than silently lost.

**Open questions this plan could not resolve from documentation alone — verify before building §8/§9:**
1. **Resolved by this session's live-doc research (2026-07-11):** Cloudinary's `control_access_to_media` and `admin_api` documentation does not mention any webhook `notification_type` for an `access_control` or access-mode change — only `On Proof Status Change` exists, and that's Enterprise-only Creative Approval, not the `access_control` mechanism this plan now uses (§1, §5, §8). **Treat this notification as not existing.** §5/§8 already correct for this: the API command's synchronous response is the primary confirmation, not a webhook. This should still be spot-checked once against the live account (send one real `access_control` update to a disposable test asset and watch for 60s whether *any* webhook notification arrives) before Core-phase build starts, but the architecture must not be designed to depend on the answer being yes.
2. What's the exact payload shape MediaFlows' `Send HTTP Request` block sends for a moderation-result callback? (Not documented in the fetched pages — needs a live PowerFlow test.)
3. Does the current Cloudinary account have any Structured Metadata fields already defined via Console, independent of code? (Admin API `metadata_fields()` call not made this pass.)
4. IPI-257's own sub-task `074f` (bulk tag/replace) status is ambiguous — the epic is marked Done but this sub-item isn't checked off in its own tracking table. Confirm before assuming it's built.
5. **New, from this session's correction:** has a real, disposable-asset `access_control` update been tested against the live account yet? Not done as of this pass — flagged rather than assumed (§1, §8 item 3). Do this before writing any approve-action code, not after.

---

## 15. Cost and performance controls

Free plan, 0.05/25 credits used (0.2%), 480 objects, 261 resources, 219 derived resources — **enormous headroom today**, but zero monitoring exists. Recommend:
- A weekly `cloudinary.api.usage()` check (cron or scheduled Mastra tool) alerting if credit usage crosses 50%/80% thresholds, before it becomes a production incident.
- Before committing to *ongoing* moderation (Advanced phase) or any Enterprise-tier feature, get an explicit cost quote — Advanced-plan moderation and Enterprise Creative Approval are not currently budgeted, per this account's plan tier.
- PowerFlow "touchpoints" metering (§9) — Premium blocks cost 100 touchpoints/action; before building a PowerFlow that runs on every upload, get real touchpoint pricing from Cloudinary, not assumed.

---

## 16. Phased implementation roadmap

### Core (do now — production-blocking + foundational)
- Merge PR #320, #321, #324 (the three unmerged fixes) — nothing else in Core matters if these aren't in.
- Wire the webhook's moderation-notification handling (§7) — stop silently discarding real signal.
- Fix delete-doesn't-cascade-to-`assets` (§7).
- Webhook inbox/outbox with bounded retries + visible dead-letter state (§14) — currently zero durability on a failed write.
- CLD-000/IPI-430 — structured metadata fields + upload preset (already fully scoped, just build it).
- A real signed-upload smoke test in CI (browser-level, not just curl) — this session found the `next.config.ts` gap only via a real signed browser upload; a CI check should catch this class of bug going forward.
- **One real, disposable-asset `access_control` test call against the live account** (§8 item 3, §14 open question #5) — must happen before any approve-action code is written, since the whole approval architecture depends on confirming this behaves as documented.

### Advanced (after Core ships)
- Approval queue UI with version-bound approval + rights-expiration gate + `access_control` flip (IPI-437/CLD-104, corrected mechanism per §8 — command-response-first, no webhook dependency).
- First real PowerFlow: moderation → webhook → `cloudinary_assets.moderation_status`.
- `asset_approval_events` history table + SLA breach UI + immutable publishing-manifest fields (§10, §21).
- Original-asset R2 backup (vendor exit strategy, §21) — async, best-effort, off the upload webhook.
- (Optional, only if a concrete Mastra-orchestration need arises) Move DNA scoring into a Mastra tool (§11) — not scheduled by default.
- Duplicate detection, version-aware UI, `<CldImage>` adoption (replace hand-rolled URL construction where it doesn't need the signed-URL server-only path).

### Future (do not schedule yet)
- Postiz publishing integration.
- Chatwoot/WhatsApp notifications (requires porting a Vite-scoped PRD to Next.js first).
- Ecommerce marketplace sync (Shopify/Amazon export beyond what already exists).
- Client-facing approval portal, AI hero-image recommendations, engagement prediction, cross-brand media analytics, PowerFlow-based batch workflows at scale.

---

## 17. Dependency-ordered task reconciliation (not new tasks — mapped against what already exists)

**Do not create new Linear issues for any of the below — they already exist.** This plan's contribution is sequencing and flagging duplication, not re-authoring specs that are already written and, in several cases, better-scoped than this document could redo from scratch.

| Order | Task | Status found | Action |
|---|---|---|---|
| 1 | Merge PR #320, #321, #324 | Open, this session | Merge — blocks everything else |
| 2 | `IPI-430 · CLD-000 — Cloudinary Structured Metadata Fields, Upload Preset & Governance` | Backlog, Urgent, fully scoped | Start immediately, no rewrite needed |
| 3 | Webhook moderation handling + delete-cascade fix | **Not tracked in Linear at all** | **New issue needed** — file as `IPI-XXX · CLD-00X — Webhook moderation event handling + delete cascade`, blocks CLD-104 |
| 4 | `IPI-437 · CLD-104 — Media Approval Workflow (Comments + SLA)` | Backlog, High, fully scoped, depends on CLD-000/CLD-101 | Proceed after #2 and #3 — resolve §14 open question #1 before implementation, not during |
| 5 | `IPI-64 · CLD-009 — Moderation Workflow` (older) vs newer CLD-101–118 moderation-adjacent items | **Likely duplicate/stale** — created 2026-06-14, predates the 2026-07-07 CLD-101–118 series by 3 weeks | **Reconcile**: close IPI-64 in favor of whichever CLD-1xx issue actually covers moderation, or explicitly re-scope it to just "wire the webhook" (item 3 above) if the newer series covers the rest |
| 6 | `IPI-60 · CLD-004 — DAM Structure` (older) | Same staleness pattern as IPI-64 | **Reconcile** against CLD-101–118's asset-library/collections issues the same way |
| 7 | `IPI-493 — Backfill assets.brand_id` | Backlog, this session | Independent of this plan, but blocks any real QA of the approval queue UI (nothing to approve if nothing has a real brand) |
| 8 | `IPI-499 — assets_select_via_brand RLS org-aware + shoot.shoot_assets union` | In Review (PR #321, #322) | Part of item 1 |
| 9 | `IPI-276 · SUPA-ORG-RLS` | Backlog | Verify overlap with IPI-499 before starting — may already be substantially covered |
| 10 | CLD-101–118 (Upload Workspace, AI Asset Library, Brand Asset Collections, Product Asset Sets, Metadata Manager, Channel Export Center, Saved Searches, Bulk Asset Actions, Asset Relationships, Smart Collections, Media Trash, Asset Activity Timeline) | All Backlog | Sequence *after* Core phase (items 1-3) and CLD-104 (item 4) — these are all Advanced/Future-phase UI on top of a foundation that doesn't fully exist yet |
| 11 | `IPI-257 §074f` (bulk tag/replace) | Ambiguous status (§14 open question #4) | Verify actual status before assuming done or re-scoping into CLD-1xx's "Bulk Asset Actions" issue |
| 12 | Fix broken cross-references | `linear/issues/IPI-257-cloudinary-pipeline.md` cites `tasks/cloudinary/cloudinary-plan.md` (this file, now restored), `MEDIA-MAP.md`, `cloudinary-architecture.md` (both still missing) | Either restore those two files or update IPI-257's doc to stop citing them |

---

## 18. Acceptance criteria (Core phase only — Advanced/Future ACs live in their own existing Linear issues)

- [ ] PR #320, #321, #324 merged; a real signed Cloudinary upload renders in `/app/assets` in a live browser session (not just `curl`)
- [ ] A Cloudinary moderation-type webhook notification results in a written `cloudinary_assets.moderation_status`, verified via a real test event (Cloudinary supports sending test notifications from Console)
- [ ] Deleting a Cloudinary asset results in the corresponding `public.assets` row no longer appearing in `/app/assets` (either archived-and-filtered or removed)
- [ ] `IPI-430` fully shipped: metadata fields visible in Cloudinary Console, upload preset in use, `lib/cloudinary/url.ts` exports `CLOUDINARY_UPLOAD_PRESET`
- [ ] CI includes a real signed-upload-and-render smoke test (not just `tsc`/lint) — this exact class of bug (missing `remotePatterns` entry) was invisible to every existing check until a human signed in

---

## 19. Browser and integration test plan

- **Unit**: extend `webhook/route.test.ts` with a real moderation-notification-type test case (currently only tests that it's ignored — add a test proving it's *handled* once §7's fix lands).
- **Integration**: extend `scripts/verify-rls.mjs` (already the established pattern this session used for IPI-499) with a `cloudinary_assets` RLS probe once that table's policy is confirmed/fixed (§13 open question).
- **Browser (manual or Playwright)**: sign in as a real user → upload a real image → confirm it renders with the correct transform (repeat this session's verification, but from the actual UI, not `curl`) → confirm it appears in the approval queue once built → approve → confirm it becomes publicly deliverable.
- **Cost/quota**: a scheduled check (§15) counts as an "integration test" against the live Cloudinary account, not just application code.

---

## 20. Migration plan from the current setup

**Correction from this plan's earlier draft:** "no migration needed" was too strong and only true for *data backfill* — §10 already lists real, additive **schema** migrations this plan requires (`asset_approval_events`, `assets.archived_at`, plus the RLS additions in §13). The accurate statement: **no data-backfill migration is needed for `approval`/`moderation_status`** — new assets get real state going forward under the corrected §5/§8 flow — but **additive schema migrations are required** before Core-phase code can land, each as its own single-concern PR per this repo's hard rule (§10 already states this correctly; this section previously contradicted it).

On the 4 existing `cloudinary_assets` rows (verified stale/inconsistent test artifacts — `status:"processing"` doesn't match the webhook code's `status:"ready"`, and none link back to a `public.assets` row with a matching `cloudinary_public_id`): **do not delete them outright.** Before any deletion, run a reconciliation pass — (1) re-query both `cloudinary_assets` and `public.assets` for a match by `cloudinary_public_id` one more time immediately before acting, in case a race or a partial migration since this audit changed the picture; (2) if still unmatched, move the rows to a quarantine state (a `status:"orphaned"` value, or a separate `cloudinary_assets_orphaned` audit table) rather than a hard `DELETE`, with the original row data preserved; (3) only hard-delete after a human has reviewed the quarantined rows and confirmed none reference real, needed Cloudinary assets. This avoids losing evidence if the "orphaned" classification turns out to be wrong.

---

## 21. Resilience additions (this session's correction — items not in the original draft)

Four requirements missing from earlier drafts of this plan, added per explicit review instruction:

**Immutable publishing manifests.** Once an asset is approved and becomes deliverable (§8), the exact state that was approved — `public_id`, `version`, the `access_control` rule applied, transform preset(s) used, approver, timestamp — should be captured as an immutable record (a row in `asset_approval_events`, §8 item 6/§10, is sufficient if it stores enough of this; a separate `publishing_manifests` table is only needed if a single approval can fan out to multiple channels/transforms that each need independent tracking). The point: "what did we actually approve and ship" must be reconstructable later without depending on Cloudinary's current live state, which can change (re-upload, manual Console edit, access_control expiry) after the fact.

**Original-asset backup and vendor exit strategy.** Today, the original uploaded bytes exist only on Cloudinary — there is no independent copy. This is a real vendor lock-in risk beyond the URL/webhook-convention lock-in already noted in the Audit table: if the Cloudinary account were ever lost, suspended, or migrated away from, the original assets (not just derived/transformed versions) would be unrecoverable from iPix's own infrastructure. Recommend an R2 (or equivalent object storage already in this stack, per `cloudflare` skill) async backup of original uploads — triggered from the webhook's `upload` handler (§7), storing the original bytes keyed by `cloudinary_public_id`, best-effort/non-blocking like the existing DNA-scoring trigger. This is an **exit-strategy** requirement, not a Core-phase blocker — schedule it in the Advanced phase, but do schedule it; every day without it is a day of irreproducible originals.

These four items (version-bound approvals and rights-expiration gates are in §8; webhook inbox/outbox with retries/dead-letter is in §14; the two above) were the explicit gap this correction pass was asked to close — see §16 for where they land in the roadmap.

---

## Audit — errors, red flags, and risks

| Category | Finding | Severity |
|---|---|---|
| **Production correctness** | `main` 500s `next/image` on any real signed asset (§2) | 🔴 Critical — merge PR #324 |
| **Security** | No RLS org-awareness merged yet on `assets_select_via_brand` (§2, §13) | 🔴 Critical — merge PR #321 |
| **Missing RLS protection** | `cloudinary_assets` RLS not independently re-verified post-#321 (§13) | 🟡 Open question |
| **Duplicated media state** | `approval`/`moderation_status`/`delivery_type` on `cloudinary_assets` vs `dna_status` on `assets` — no single "is this ready" answer today (§4, §9) | 🟡 Real, addressed by §4's ownership rule |
| **Secret exposure risk** | Server-only-by-convention, not lint-enforced (§13) | 🟡 Low-effort fix |
| **Broken signed-URL flow** | Confirmed and fixed this session (PR #320/#324) — flag as resolved-pending-merge | 🟢 Resolved pending merge |
| **Webhook replay risk** | Mitigated (300s window, HMAC) — no gap found | 🟢 |
| **Approval bypass risk** | Not yet buildable-around since approval doesn't exist yet — but the architecture in §4/§8 must be followed when it is built, or it will be bypassable | ⚪ Design-time risk, not current |
| **Missing audit logs** | Webhook failures aren't logged to `ai_agent_logs` today, only successes (§7) | 🟡 |
| **Unsupported Cloudinary assumptions** | Upload-sign route's own comment describes a "flip to public after approval" flow that has zero implementing code anywhere (§2) | 🔴 Documentation-code mismatch, actively misleading to future readers |
| **Unavailable plan/account features** | Creative Approval Proofs/Flows and EasyFlow are Enterprise-only; current account is Free (§1) | 🔴 Blocks naive "just use Cloudinary's approval UI" plans |
| **Vendor lock-in** | Moderate — heavy reliance on Cloudinary-specific URL/webhook/transform conventions, but abstracted behind `lib/cloudinary/url.ts` reasonably well | 🟡 |
| **Performance bottleneck** | None found at current scale (480 objects); revisit once real volume arrives | ⚪ |
| **Cost risk** | None today (0.2% credit usage), but zero monitoring exists and several proposed features require a plan upgrade not yet budgeted (§15) | 🟡 |
| **Missing rollback/recovery** | No dead-letter queue for failed webhook writes (§7, §14) | 🟡 |
| **Duplicate Linear planning** | Old CLD-004/CLD-009 vs new CLD-101–118 series likely overlapping (§17) | 🟡 Needs a human reconciliation decision, not an automated merge |
| **Broken doc cross-references** | `tasks/cloudinary/` was fully empty; `MEDIA-MAP.md`/`cloudinary-architecture.md` still missing, cited by IPI-257's own spec | 🟡 Partially fixed by this file's restoration |

---

## Scoring

| Area | Score | Note |
|---|--:|---|
| Upload security | 🟡 75 | Solid signing + webhook verification; no dead-letter queue |
| Delivery architecture | 🔴 55 *(🟡 70 once #320/#324/#321 merge)* | Broken on `main` today; fragmented once fixed |
| Transformations | 🟢 80 | Genuinely well-designed shared presets |
| Metadata | 🔴 30 | Write-only, never read back, no Structured Metadata API usage |
| Moderation | 🔴 10 | Schema exists, actively discarded by the webhook |
| Approval workflows | 🔴 20 | Two dormant Cloudinary-side fields, one working-but-different DNA status, no UI |
| Supabase synchronization | 🟡 55 | Upload path solid; delete doesn't cascade; brand_id resolution partial |
| Mastra integration | 🟡 45 | Functional via a boundary-violating edge function, not Mastra itself |
| Publishing integration | ⚪ 0 | Correctly deferred, zero code |
| Ecommerce readiness | 🔴 15 | Table exists, zero wiring |
| Observability | 🟡 40 | Success-path logging only, no alerting |
| Cost control | 🟡 50 | Fine today, no guardrails |
| Production readiness | 🔴 42 *(🟡 58 once the 3 PRs merge)* | Real breakage today, not hypothetical |
| **Overall** | 🔴 **42** *(🟡 **58** post-merge)* | Core pipeline is real and good; governance layer is schema-only |

---

## Final report

| Area | Result |
|---|---|
| Existing setup score | 🔴 42/100 on `main` today, 🟡 58/100 once PR #320/#321/#324 merge |
| Production-ready | No — not until the 3 unmerged PRs land; even then, only the upload/delivery pipeline is production-ready, not approval/moderation/governance |
| Critical blockers | (1) `next/image` 500s on real signed assets on `main`, (2) RLS org-awareness unmerged, (3) webhook silently discards moderation events, (4) upload-sign route's "flip to public" behavior is a comment with no code |
| Highest-value improvement | Merge the 3 pending PRs, then wire the already-provisioned `cloudinary_assets.moderation_status`/`approval` columns to real events (§7, §8) — highest leverage because the schema work is already paid for and sitting idle |
| Files reviewed | `app/src/lib/cloudinary/url.ts`, `app/src/app/api/_lib/cloudinary-signed-url.ts`, `app/src/app/api/assets/upload-sign/route.ts`, `app/src/app/api/assets/cloudinary/webhook/route.ts` (+test), `app/src/mastra/agents/visual-identity.ts`, `next.config.ts`, `supabase/migrations/*cloudinary_assets*`, `docs/media/*`, `docs/prd/prd-chatwoot.md`, `linear/issues/IPI-257-cloudinary-pipeline.md`, `linear/audit/july-7/07-cloudinary-audit.md`, plus live Supabase (`assets`, `cloudinary_assets`, `shoot.shoot_assets`, `event_assets`) and live Cloudinary Admin API (`usage()`) queries |
| Documents created or updated | This file (`tasks/cloudinary/cloudinary-plan.md`, restored from deletion) |
| New Linear tasks proposed | One: webhook moderation-handling + delete-cascade fix (§17, item 3) — everything else already exists and is reconciled, not re-created, per the explicit instruction not to modify Linear without being asked |
| Existing tasks to close, merge, or rewrite | `IPI-64`/`IPI-60` (CLD-009/CLD-004) — likely superseded by CLD-101–118, needs a human decision, not an automated close |
| Core phase | Merge 3 PRs; webhook moderation handling; delete-cascade fix; CLD-000/IPI-430; CI signed-upload smoke test |
| Advanced phase | Approval queue UI (CLD-104); first PowerFlow; DNA scoring into Mastra; `<CldImage>` adoption; duplicate detection; approval history table |
| Overall recommendation | Don't start any new Cloudinary feature work until the 3 unmerged PRs from this session land — the plan's own "Core" phase is entirely about making the existing, already-built pipeline actually work in production, not adding scope. The 18-issue CLD-101–118 series is a reasonable Advanced/Future roadmap already written; this document's value is sequencing it correctly and flagging where it duplicates older, stale issues. |
