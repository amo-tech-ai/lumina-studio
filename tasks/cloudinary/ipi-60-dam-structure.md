# IPI-60 — CLD-004 · DAM Structure

**Linear:** IPI-60
**Parent:** IPI-257 (Cloudinary Media Pipeline)
**Track:** Cloudinary
**State:** In Progress

---

## In plain terms

A shared folder/tag/metadata taxonomy that every Cloudinary upload in iPix follows. The taxonomy lives in one TypeScript module (`app/src/lib/cloudinary/taxonomy.ts`), consumed by `sign-upload.ts` and eventually by the Upload Widget. A governance doc records the rules so every future asset pipeline produces discoverable, sortable, org-safe assets.

---

## Baseline (before changes)

| Metric | Value |
|--------|-------|
| Cloud name | `dzqy2ixl0` |
| Folder mode | **Dynamic** (public ID path = asset folder) |
| Total images | 271 |
| Legacy `type:upload` (FashionOS / `services/`) | 260 |
| Current `type:authenticated` (iPix) | 11 |
| Root folder | `ipix/` |
| iPix brand UUIDs in folders | `11111111-1111-1111-1111-111111111111`, `03720393-7cf0-4b06-bb67-7bf7ee3bc1a9`, `db1f728d-bee1-430e-a3e7-0c601da74ce7` |
| Upload preset | `ipix-signed-upload` (signed, authenticated, overwrite:false) |
| Delivery type (current) | `authenticated` |
| Delivery type (legacy) | `upload` (public) |
| Context keys on current assets | `brand_id` (always), `shoot_id` (conditional), `campaign_id` (conditional) |
| Context keys on legacy assets | none |
| Structured metadata | `ipix_schema_version: "1"` |
| Tags on any asset | none |
| Allowed upload formats | `jpg,png,webp,mp4,mov` |
| Eager transforms | `asset-masonry` (w_600,c_limit), `asset-review` (w_1200,c_limit), `asset-detail` (w_1600,c_limit) |

### Folder tree (iPix-relevant)

```
ipix/
  brands/
    {brandId}/
      products/         ← default (assetFolderFor fallback)
      cld105-test/      ← dev/test only
      ipi636-test/      ← dev/test only
      qa-fixtures/      ← dev/test only
```

### What's missing

1. **No environment segment** — `ipix/{env}/` (dev / staging / prod) is absent. Every brand folder sits under `ipix/brands/` with no env separation.
2. **No org ID segment** — `ipix/{env}/{orgId}/` gap. In multi-org future, brand IDs alone are ambiguous.
3. **No tags** — zero assets have tags. Search is folder-path-only.
4. **Context is brand-only** — no `env`, `org_id`, `work_type`, `work_id` context keys.
5. **Wild card folder names** — `cld105-test`, `ipi636-test`, `qa-fixtures` are not namespaced work types.
6. **No `work_id` in folder** — `ipix/brands/{id}/products` lacks a shoot/campaign/asset UUID segment for per-project grouping.

---

## Taxonomy contract

### Folder pattern (target)

```
ipix/{env}/{orgId}/{brandId}/{workType}/{workId}
```

Segments:

| Segment | Required | Value | Source |
|---------|----------|-------|--------|
| `env` | yes | `dev` \| `staging` \| `prod` | Build-time env var or runtime detect |
| `orgId` | yes | UUID | Operator org membership |
| `brandId` | yes | UUID | Upload context |
| `workType` | yes | `shoots` \| `campaigns` \| `products` \| `dna-assets` \| `qc-snapshots` \| `qa-fixtures` | Upload context |
| `workId` | no | UUID (optional) | Specific shoot/campaign UUID |

### Context keys

Every upload must include these context key-value pairs:

| Key | Required | Example |
|-----|----------|---------|
| `env` | yes | `prod` |
| `org_id` | yes | `a1b2c3d4-e5f6-...` |
| `brand_id` | yes | `11111111-1111-...` |
| `work_type` | yes | `shoots` |
| `work_id` | no | `22222222-...` (shoot UUID) |
| `shoot_id` | conditional | when `work_type=shoots` |
| `campaign_id` | conditional | when `work_type=campaigns` |

### Delivery type

- **All current uploads:** `authenticated` (private-by-default, signed URL delivery)
- **Legacy assets:** `upload` (public) — remain as-is; not migrated
- **No change for legacy:** 260 FashionOS public images stay public

### Tags

Tags are **optional** for MVP uploads. When applied:

| Tag | Pattern | Example |
|-----|---------|---------|
| `env:{value}` | `env:prod` | Always, matches folder env |
| `work_type:{value}` | `work_type:shoots` | Always, matches folder work type |
| `status:{value}` | `status:raw` \| `status:review` \| `status:approved` | When known |

### Structured metadata

| External ID | Type | Value | Description |
|-------------|------|-------|-------------|
| `ipix_schema_version` | String | `1` | Schema version (already exists) |

No new metadata fields are required for MVP. Future fields (e.g. `ipix_brand_name`, `ipix_shoot_date`) are additive.

### Allowed formats

```
jpg, png, webp, mp4, mov
```

(Already defined as `ALLOWED_FORMATS` in sign-upload.ts.)

---

## Migration constraints

1. **No bulk moves.** Existing 271 assets stay at their current paths. The taxonomy applies **forward-only** to new uploads.
2. **No tag backfill.** Zero tags on existing assets is acceptable MVP state.
3. **`sign-upload.ts` contract change.** After merging, `ipix/{env}/{orgId}/{brandId}/{workType}/{workId}` applies to all new signed-upload params. Existing assets at old paths are unaffected.
4. **`env` context added.** Code must detect `VERCEL_ENV` or `NEXT_PUBLIC_VERCEL_ENV` (or a plain env var) at sign time. Fallback: assume `dev` if no env indicator present.
5. **`orgId` from auth.** Must come from the authenticated operator session (`organizations` / `org_members` join), not from a client-sent param. The `sanitizeWidgetParamsToSign` path already blocks client-injected params, so this is consistent.
6. **`workType` in the signer.** Both `buildUploadParamsToSign` and `sanitizeWidgetParamsToSign` must accept an optional `workType` parameter (default: `products`).
7. **`workId` optional.** Only included when the caller knows the specific shoot/campaign UUID. The folder segment is omitted entirely when absent.

---

## Wiring plan

| Action | Path |
|--------|------|
| **Create** | `app/src/lib/cloudinary/taxonomy.ts` — folder builder, context builder, tag builder, constants |
| **Modify** | `app/src/lib/cloudinary/sign-upload.ts` — import from taxonomy, add `workType` parameter, add `env`/`orgId` to folders and context |
| **Update tests** | `app/src/lib/cloudinary/sign-upload.test.ts` — add taxonomy-driven test cases |
| **Create tests** | `app/src/lib/cloudinary/taxonomy.test.ts` — unit tests for taxonomy module |
| **Create script** | `scripts/cloudinary-dry-run-audit.mjs` — read existing assets, report mismatches vs taxonomy |
| **No change** | `app/src/lib/cloudinary/url.ts` — transform presets stay; taxonomy re-exports `CLOUDINARY_PRESETS` but url.ts remains the canonical source |
| **No change** | Webhook `route.ts` — already persists `cloudinary_asset_id`; taxonomy doesn't change webhook logic |
| **No change** | `supabase/` — no schema migration required for this task |

## Verify

- `cd app && npm run lint`
- `cd app && npx tsc --noEmit`
- `cd app && npm run test`
- `cd app && npm run build`
- Run `node scripts/cloudinary-dry-run-audit.mjs` and confirm mismatches are expected (legacy assets + dev/test fixtures)

---

## Changes not made (explicit scope carve-out)

| Not in scope | Rationale |
|-------------|-----------|
| Upload Widget (IPI-433) | Separate issue; consumes taxonomy after this PR |
| Metadata field creation in Cloudinary console | No new fields for MVP; `ipix_schema_version` already exists |
| Legacy asset migration | 260 fashionos + 11 current assets stay at their paths |
| Supabase schema changes | No `env`/`org_id`/`work_type` columns added — taxonomy is Cloudinary-side only |
| Cloudinary console triggers | Upload/delete triggers already configured (IPI-641) |
| Org membership resolution (runtime) | The signer accepts `orgId` as a param; the caller (route handler) resolves it from session |

## Real-world fixture verification (plan item 9.7, completed 2026-07-20T16:48Z)

Executed via Cloudinary MCP + Supabase MCP — no custom script written. Full disposable cycle:
upload → read back → verify → delete → confirm deleted.

* **Cloudinary account:** `dzqy2ixl0` (matches app `CLOUDINARY_CLOUD_NAME`; confirmed via `search-assets` returning existing `ipix/cld105-test/*` fixtures on the same `secure_url` host before this run)
* **QA organization:** `00000000-0000-0000-0000-000000000001` ("Acme Corp" — seed/demo org)
* **QA brand:** `db1f728d-bee1-430e-a3e7-0c601da74ce7` ("QA Test Brand — IPI-404 parity check"); `brands.org_id` confirmed to match the org above via Supabase MCP `execute_sql`
* **Fixture public ID:** `ipi-60-realworld-fixture-20260720T164824Z`
* **Asset ID:** `280fb3148f9bba882110c31c6be0a50c`
* **Expected folder:** `ipix/dev/00000000-0000-0000-0000-000000000001/db1f728d-bee1-430e-a3e7-0c601da74ce7/qa-fixtures` — **observed:** identical
* **Expected context:** `env=dev`, `org_id=00000000-0000-0000-0000-000000000001`, `brand_id=db1f728d-bee1-430e-a3e7-0c601da74ce7`, `work_type=qa-fixtures` — **observed:** identical
* **Delivery type:** `authenticated` (requested and observed)
* **Upload result:** success (`mcp__claude_ai_Cloudinary__upload-asset`, 1×1 transparent PNG Data URI, 68 bytes, tags `ipi-60`/`qa-fixture`/`delete-after-verification`, `overwrite: false`)
* **Read-back result:** `mcp__claude_ai_Cloudinary__get-asset-details` by `asset_id` — `resource_type`, `type`, `asset_folder`, `context`, `public_id` all matched the taxonomy contract exactly
* **Delete result:** `mcp__claude_ai_Cloudinary__delete-asset` by `asset_id` → `{"result":"ok"}`
* **Post-delete confirmation:** `mcp__claude_ai_Cloudinary__search-assets` for the exact `public_id` → `total_count: 0` (not found in the live index; a subsequent `get-asset-details` call still returns backup metadata with `placeholder: true, bytes: 0`, which is Cloudinary's expected retained-backup behavior for a deleted asset, not a live record)
* No existing asset — including prior `cld105-test`/`ipi636-test` fixtures — was moved, renamed, or deleted. No credentials, signed URLs, or Data URI contents recorded here.

## Known regression — CldUploadWidget signature mismatch (confirmed 2026-07-20T17:15Z, tracked as IPI-749)

Live browser reproduction (QA operator, real `/app/assets` Upload button, Playwright) confirmed every `CldUploadWidget` upload currently fails with `401 Unauthorized` from Cloudinary. The widget signs and uploads with its own `context: {brand_id}` params; `sanitizeWidgetParamsToSign` (`app/src/lib/cloudinary/sign-upload.ts`) signs a taxonomy-rebuilt `context`/`folder` that the widget never actually sends, so Cloudinary's signature check rejects the real upload. Confirmed via installed `next-cloudinary@6.17.5` source: `signatureEndpoint` only ever extracts `result.signature`, nothing else comes back to the widget.

Pre-existing on `origin/main` before this branch (not a PR #543 regression) — see `git show origin/main:app/src/lib/cloudinary/sign-upload.ts`. Full reproduction, root cause, and preferred fix (`prepareUploadParams`) tracked in **[IPI-749 · CLD-101B](https://linear.app/amo100/issue/IPI-749/cld-101b-align-clduploadwidget-signed-parameters-with-server)**. PR #543 review thread on `sign-upload.ts:238` stays open, pointing to IPI-749.
