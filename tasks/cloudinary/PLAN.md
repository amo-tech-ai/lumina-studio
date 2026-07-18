# Cloudinary — Domain plan (PRD + roadmap)

**Updated:** 2026-07-18  
**Cloud:** `dzqy2ixl0` · **Webhook:** `https://www.ipix.co/api/assets/cloudinary/webhook`

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


## Purpose

Signed uploads, structured metadata, and durable Supabase mirrors so Assets / DNA / shoots stay consistent for fashion operators.

## Goals

1. Secure webhook pipeline (signature, idempotency, version/stale guards).
2. Provider identity (`cloudinary_asset_id`) persisted on mirrors.
3. Operator upload UI (signed widget) + library search.
4. Ops: usage/cost, delete reconcile, approval versions.

## Current state

- Preset `ipix-signed-upload` + upload/delete triggers live.
- Webhook route hardened (PRs #421/#425); Vitest strong.
- Provider id path proven via direct upload; many legacy mirrors still null.
- **No** `CldUploadWidget` UI yet (IPI-433).
- Rename Console trigger not configured.

## Target

```text
Operator Assets → signed upload → Cloudinary
  → webhook → cloudinary_assets + assets (Supabase)
  → DNA / search / channel export (later)
```

## Feature tables

### Core

| Feature | Who / why | Example | Related |
|---------|-----------|---------|---------|
| Signed preset + webhook | Secure ingest | FashionOS brand upload | [IPI-430 · CLD-000](https://linear.app/amo100/issue/IPI-430) Done |
| Provider identity | Dedupe/overwrite | `cloudinary_asset_id` column | IPI-641 (verify Linear) |
| Delete sync | Cleanup | Destroy → archived mirror | Triggers live |
| SDK install | Maintainability | Official Node SDK | [IPI-350](https://linear.app/amo100/issue/IPI-350) / [IPI-352](https://linear.app/amo100/issue/IPI-352) Done |

### Advanced

| Feature | Example | Related |
|---------|---------|---------|
| Upload widget | Brand-only upload | [IPI-433 / IPI-265](https://linear.app/amo100/issue/IPI-265) |
| Metadata manager | Schema-driven fields | [IPI-439 · CLD-111](https://linear.app/amo100/issue/IPI-439) |
| Channel export | Named transforms | [IPI-448 · CLD-109](https://linear.app/amo100/issue/IPI-448) |
| Approval versions | Audit trail | [IPI-639 · CLD-APPROVAL-001](https://linear.app/amo100/issue/IPI-639) |
| Usage/cost monitoring | Ops | [IPI-642 · CLD-OPS-001](https://linear.app/amo100/issue/IPI-642) In Progress |
| Event inbox / retry | Durable webhooks | [IPI-637 · CLD-EVENT-001](https://linear.app/amo100/issue/IPI-637) |

## Dependencies

- Supabase `assets` / `cloudinary_assets` RLS.
- Infisical secrets for API + notification signing.
- Cloudflare DNS cutover must keep webhook URL valid.

## Risks

| Risk | Mitigation |
|------|------------|
| Upload-sign Bearer vs cookie mismatch | Fix ownership check (403 on live script) |
| Legacy null provider ids | Explicit backfill decision |
| Rename without Console trigger | Path A app rename vs Path B trigger |

## Success criteria

- [ ] Operator upload path green (widget + sign + webhook)
- [ ] Backfill decision recorded
- [ ] Rename path chosen and tested
- [ ] Usage monitoring decision (IPI-642)

## Roadmap

```text
1. Fix upload-sign auth for Bearer QA
2. IPI-433 / IPI-265 — upload widget
3. Backfill + rename decision
4. IPI-642 ops monitoring
5. Approval / export / event inbox (advanced)
```
