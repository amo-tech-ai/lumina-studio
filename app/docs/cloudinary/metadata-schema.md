# Cloudinary Structured Metadata Schema

**SCHEMA_VERSION:** `1`  
**Issue:** IPI-430 · CLD-000  
**Verified:** 2026-07-16 via Cloudinary MCP

## Source of truth

| Domain | Owner |
| --- | --- |
| Approval, DNA, rights, activity, product links | **Supabase** (canonical) |
| Binary asset, transforms, delivery, searchable mirrors | **Cloudinary** |

Cloudinary structured metadata is a **searchable mirror** only. Do not treat it as the business system of record.

## iPix mirror fields

| external_id | type | mandatory | notes |
| --- | --- | --- | --- |
| `ipix_brand_id` | string | no | UUID of `public.brands.id` |
| `ipix_shoot_id` | string | no | Shoot id when applicable; shoot ownership blocked on IPI-524 |
| `ipix_asset_type` | enum | no | `product`, `editorial`, `campaign`, `lifestyle`, `detail`, `video`, `logo`, `document` |
| `ipix_season_code` | string | no | Free-form season code (avoid brittle fixed enums) |
| `ipix_schema_version` | string | no | Default `"1"`; bump when field set changes |

Account also retains Cloudinary default fields (`asset_type`, `usage_rights`, `status`, `expiration_date`, `sku`) — do not conflate those with iPix mirrors.

## Upload preset

| Setting | Value |
| --- | --- |
| Name | `ipix-signed-upload` |
| Signed | yes (`unsigned: false`) |
| Delivery type | `authenticated` |
| Eager | `asset-masonry` / `asset-review` / `asset-detail` (literal transforms) |
| Auto-tagging | **off** (paid / entitlement not assumed on Free) |

App constant: `CLOUDINARY_UPLOAD_PRESET` in `src/lib/cloudinary/url.ts`.

## Named transforms (Dashboard)

| Name | Transform |
| --- | --- |
| `asset-masonry` | `c_limit,w_600,f_auto,q_auto` |
| `asset-review` | `c_limit,w_1200,f_auto,q_auto` |
| `asset-detail` | `c_limit,w_1600,f_auto,q_auto` |

Upload-sign and signed delivery use the same strings via `presetTransformString` so they cannot drift.

## Not stored in Cloudinary as SoT

- approval state
- DNA score / status
- rights authorization
- activity history
- product relationships
