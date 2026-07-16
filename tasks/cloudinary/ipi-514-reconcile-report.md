# IPI-514 · CLD-DATA-002 — Deterministic brand reconciliation report

**Date:** 2026-07-16  
**Project:** fashionos (`nvdlhrodvevgwdsneplk`)  
**Method:** read-only classification CTE → human review → guarded transaction (no migration / no TS script)

## Classification summary

| Classification | Count | Action |
| --- | ---: | --- |
| preexisting_non_null | 12 | leave |
| candidate_folder_brand | **0** | none to approve |
| fixture (placehold/example) | 0 | — |
| ambiguous | 8 | leave (Cloudinary demo samples) |
| shoot_system_unresolved | 6 | leave for IPI-524 |

## Deterministic candidates

None. No `assets` row with `brand_id IS NULL` and `cloudinary_public_id ~ '^ipix/brands/<uuid>/'`.

## Ambiguous (not approved)

All 8 are `https://res.cloudinary.com/demo/...` sample URLs with null `cloudinary_public_id`. No safe brand UUID.

## Shoot-linked unresolved (IPI-524)

6 rows with `shoot_id` set. `public.shoots` has no `brand_id` column (designer-centric), so ownership cannot be deterministically inferred here.

## Approved proposed updates

Empty set. `approved_count = 0`.

## Guarded transaction

```sql
do $$
declare
  approved_count int := 0;
  updated_count int;
begin
  with proposed(asset_id, resolved_brand_id) as (
    select null::uuid, null::uuid where false
  ),
  updated as (
    update public.assets a
    set brand_id = p.resolved_brand_id
    from proposed p
    where a.id = p.asset_id
      and a.brand_id is null
    returning a.id
  )
  select count(*)::int into updated_count from updated;

  if updated_count is distinct from approved_count then
    raise exception 'IPI-514 abort: updated_count=% approved_count=%', updated_count, approved_count;
  end if;
end $$;
```

**Result:** committed successfully; `updated_count = 0`.

## Post-verify

| Metric | Value |
| --- | ---: |
| `brand_id IS NULL` | 14 |
| `brand_id IS NOT NULL` | 12 |
| total `assets` | 26 |

Org-member RLS: `qa@ipix.test` (editor on org `00000000-0000-0000-0000-000000000001`) sees only brand-owned rows via `assets_select_via_brand`; null-brand rows remain invisible to org members (expected).
