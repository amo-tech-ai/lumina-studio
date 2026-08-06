-- IPI-767 · CLD-DATA-HYGIENE-001 — classification CTE (READ-ONLY)
-- Rerunnable. Run against linked remote (project nvdlhrodvevgwdsneplk).
--
-- Deterministic ownership evidence (only):
--   R1  exact valid brand UUID in Cloudinary folder path
--   R2  exact valid brand UUID in context or structured metadata
--   R3  unique shoot/campaign/product relationship (shoot -> leave per IPI-524;
--       legacy shoots table carries no brand_id)
--   R4  anything else -> leave / delete-needs-signoff (no weak heuristics)

with brand_ids as (
  select id from public.brands
),
ca as (
  select
    id,
    asset_id,
    public_id,
    folder,
    status,
    null::uuid as shoot_id,
    brand_id as current_brand,
    'cloudinary_assets' as source_table
  from public.cloudinary_assets
  where brand_id is null
),
a as (
  select
    a.id,
    null::uuid as asset_id,
    a.cloudinary_public_id as public_id,
    cm.folder as folder,
    a.status,
    a.shoot_id,
    a.brand_id as current_brand,
    'assets' as source_table
  from public.assets a
  left join public.cloudinary_assets cm on cm.asset_id = a.id
  where a.brand_id is null
),
unified as (
  select * from ca
  union all
  select * from a
),
evidence as (
  select
    u.*,
    (
      select bi.id
      from brand_ids bi
      where exists (
        select 1
        from regexp_matches(
          coalesce(u.folder, u.public_id, ''),
          '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}',
          'g'
        ) m
        where m[1]::uuid = bi.id
      )
      having count(*) = 1
    ) as proposed_brand,
    coalesce(u.folder, u.public_id, '') as evidence_source
  from unified u
)
select
  source_table,
  id as row_id,
  current_brand,
  proposed_brand,
  evidence_source,
  status,
  shoot_id,
  case
    when proposed_brand is not null then 'reconcile'
    when evidence_source ~ '11111111-1111-1111-1111-111111111111' then 'delete-needs-signoff'
    when shoot_id is not null then 'leave'
    when public_id is null and evidence_source like '%cloudinary.com/demo%' then 'leave'
    when public_id is null then 'leave'
    else 'leave'
  end as classification,
  case
    when proposed_brand is not null then 'R1: exact valid brand UUID in folder path'
    when evidence_source ~ '11111111-1111-1111-1111-111111111111' then 'R4: fake brand UUID (IPI-433 proof) — FK would fail; mirror only'
    when shoot_id is not null then 'R3: shoot-linked legacy seed — no brand on shoots (IPI-524)'
    when public_id is null then 'R4: no deterministic ownership evidence'
    else 'R4: no deterministic ownership evidence'
  end as reason
from evidence
order by source_table, classification, id;
