-- IPI-924 · AGENT-RAG-001 — org-scope search_brands
--
-- Guards migration 20260806010000. search_brands is security definer +
-- service_role-only, so RLS does not apply; the org filter must be enforced
-- inside the function itself. Properties under test:
--   1. the unscoped 3-arg overload is gone (no service-role path can bypass)
--   2. p_org_id is required (omitting it fails closed)
--   3. results are restricted to the caller org (cross-tenant isolation)
--   4. p_limit is validated (NULL/0/101 rejected, 100 accepted)
--   5. the exclude guard fails closed for foreign / NULL-org brands
--   6. grants: anon + authenticated denied, service_role allowed
--
-- Pre-merge CI strategy (approach B — transactional apply + assert + rollback):
--   supabase-verify-rls runs `supabase test db --db-url $DATABASE_URL` against the
--   linked remote. This file applies the same DDL as 20260806010000 at the top of
--   its BEGIN…ROLLBACK session (idempotent drop + create or replace + revoke/grant),
--   so it passes both before and after supabase:push lands the real migration.
--
-- pgTAP 1.2.0 is already installed on the remote, so no create extension here.
--
-- Fixtures live inside the transaction and are discarded by the rollback.
-- auth.users needs `email` as well as `id`: the on_auth_user_created trigger runs
-- handle_new_user, which inserts into public.profiles where email is NOT NULL.
--
-- Plan math: 1 (old overload gone) + 1 (new signature exists) + 3 (grants) +
--            2 (org isolation) + 1 (omitted org fails) + 4 (p_limit) +
--            2 (exclude guard) + 1 (shared_nodes) = 15
--
-- Note: brands.org_id is NOT NULL on the live schema (ipi16_org_layer:139), so
-- NULL-org brands cannot exist and no NULL-org fixture/test is needed.

begin;
select plan(15);

-- ── Mirror 20260806010000 (idempotent; runs as the DB owner role) ─────────────
drop function if exists public.search_brands(vector, int, uuid);

create or replace function public.search_brands(
  p_embedding        vector(768),
  p_org_id           uuid,
  p_limit            int     default 20,
  p_exclude_brand_id uuid    default null
)
returns table (
  brand_id     uuid,
  brand_name   text,
  similarity   real,
  shared_nodes jsonb
)
language plpgsql stable security definer
set search_path = public
as $$
begin
  perform set_config('hnsw.ef_search', '400', true);

  if p_limit is null or p_limit < 1 or p_limit > 100 then
    raise exception 'p_limit must be between 1 and 100';
  end if;

  if p_exclude_brand_id is not null and not exists (
    select 1 from public.brands eb where eb.id = p_exclude_brand_id and eb.org_id = p_org_id
  ) then
    raise exception 'excluded brand is not in the caller organization';
  end if;

  return query
  select
    b.id,
    b.name,
    (1 - (b.embedding <=> p_embedding))::real as similarity,
    (
      select jsonb_agg(jsonb_build_object(
        'node_type', n.node_type,
        'label', n.label
      ) order by n.node_type, n.label)
      from (
        select gn.node_type, gn.label
        from public.brand_graph_nodes gn
        where gn.brand_id = b.id
          and gn.label in (
            select g2.label
            from public.brand_graph_nodes g2
            where (p_exclude_brand_id is null or g2.brand_id = p_exclude_brand_id)
          )
        order by gn.node_type, gn.label
        limit 10
      ) n
    ) as shared_nodes
  from public.brands b
  where b.embedding is not null
    and (p_exclude_brand_id is null or b.id != p_exclude_brand_id)
    and b.org_id = p_org_id
  order by b.embedding <=> p_embedding
  limit p_limit;
end;
$$;

revoke execute on function public.search_brands(vector(768), uuid, int, uuid) from public, anon, authenticated;
grant  execute on function public.search_brands(vector(768), uuid, int, uuid) to service_role;

-- ── Fixtures ───────────────────────────────────────────────────────────────────
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-000000000a01', 'ipi924-owner@test.local'),
  ('00000000-0000-4000-8000-000000000a02', 'ipi924-stranger@test.local');

insert into public.organizations (id, name, slug, owner_id, type)
values
  ('00000000-0000-4000-8000-000000000b01', 'IPI924 Org A', 'ipi924-org-a',
   '00000000-0000-4000-8000-000000000a01', 'brand'),
  ('00000000-0000-4000-8000-000000000b02', 'IPI924 Org B', 'ipi924-org-b',
   '00000000-0000-4000-8000-000000000a02', 'brand');

insert into public.brands (id, user_id, org_id, name, embedding) values
  ('00000000-0000-4000-8000-000000000c01', '00000000-0000-4000-8000-000000000a01',
   '00000000-0000-4000-8000-000000000b01', 'IPI924 Brand A1', array_fill(0.1::real, array[768])::vector(768)),
  ('00000000-0000-4000-8000-000000000c02', '00000000-0000-4000-8000-000000000a01',
   '00000000-0000-4000-8000-000000000b01', 'IPI924 Brand A2', array_fill(0.5::real, array[768])::vector(768)),
  ('00000000-0000-4000-8000-000000000c03', '00000000-0000-4000-8000-000000000a02',
   '00000000-0000-4000-8000-000000000b02', 'IPI924 Brand B', array_fill(0.1::real, array[768])::vector(768));

insert into public.brand_graph_nodes (brand_id, node_type, label) values
  ('00000000-0000-4000-8000-000000000c01', 'color', 'warm'),
  ('00000000-0000-4000-8000-000000000c01', 'color', 'neutral'),
  ('00000000-0000-4000-8000-000000000c01', 'venue', 'studio'),
  ('00000000-0000-4000-8000-000000000c02', 'color', 'warm'),
  ('00000000-0000-4000-8000-000000000c02', 'venue', 'outdoor');

-- ── 1) The unscoped 3-arg overload is gone ─────────────────────────────────────
select is(
  (select count(*)::int
     from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'search_brands'
      and p.pronargs = 3),
  0,
  'the unscoped 3-arg search_brands overload is dropped'
);

-- ── 2) The org-scoped signature exists ─────────────────────────────────────────
select is(
  (select count(*)::int
     from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'search_brands'
      and p.pronargs = 4),
  1,
  'the org-scoped 4-arg search_brands overload exists'
);

-- ── 3–5) Grants: anon + authenticated denied, service_role allowed ────────────
select is(
  has_function_privilege('anon', 'public.search_brands(vector(768), uuid, int, uuid)', 'EXECUTE'),
  false,
  'anon cannot execute search_brands'
);

select is(
  has_function_privilege('authenticated', 'public.search_brands(vector(768), uuid, int, uuid)', 'EXECUTE'),
  false,
  'authenticated cannot execute search_brands'
);

select is(
  has_function_privilege('service_role', 'public.search_brands(vector(768), uuid, int, uuid)', 'EXECUTE'),
  true,
  'service_role can execute search_brands'
);

-- ── 6) Org isolation: only the caller org''s brands are returned ───────────────
select is(
  (select count(*)::int
     from public.search_brands(
       array_fill(0.1::real, array[768])::vector(768),
       '00000000-0000-4000-8000-000000000b01',
       100
     )),
  2,
  'search_brands returns only brands from the caller org (A1 + A2)'
);

-- ── 7) Cross-org brand is never returned ───────────────────────────────────────
select is(
  (select count(*)::int
     from public.search_brands(
       array_fill(0.1::real, array[768])::vector(768),
       '00000000-0000-4000-8000-000000000b01',
       100
     )
    where brand_id = '00000000-0000-4000-8000-000000000c03'),
  0,
  'a brand from another org is excluded from results'
);

-- ── 8) Omitted p_org_id fails closed ───────────────────────────────────────────
select throws_ok(
  $$ select * from public.search_brands(array_fill(0.1::real, array[768])::vector(768)) $$,
  '42883',
  NULL,
  'omitting p_org_id fails closed (no 1-arg overload)'
);

-- ── 9–12) p_limit validation ───────────────────────────────────────────────────
select throws_ok(
  $$ select * from public.search_brands(array_fill(0.1::real, array[768])::vector(768),
       '00000000-0000-4000-8000-000000000b01', null) $$,
  'P0001',
  'p_limit must be between 1 and 100',
  'NULL p_limit is rejected'
);

select throws_ok(
  $$ select * from public.search_brands(array_fill(0.1::real, array[768])::vector(768),
       '00000000-0000-4000-8000-000000000b01', 0) $$,
  'P0001',
  'p_limit must be between 1 and 100',
  'p_limit 0 is rejected'
);

select throws_ok(
  $$ select * from public.search_brands(array_fill(0.1::real, array[768])::vector(768),
       '00000000-0000-4000-8000-000000000b01', 101) $$,
  'P0001',
  'p_limit must be between 1 and 100',
  'p_limit 101 is rejected'
);

select lives_ok(
  $$ select * from public.search_brands(array_fill(0.1::real, array[768])::vector(768),
       '00000000-0000-4000-8000-000000000b01', 100) $$,
  'p_limit 100 (documented maximum) is accepted'
);

-- ── 13) Exclude guard: same-org exclude works ──────────────────────────────────
select is(
  (select count(*)::int
     from public.search_brands(
       array_fill(0.1::real, array[768])::vector(768),
       '00000000-0000-4000-8000-000000000b01',
       100,
       '00000000-0000-4000-8000-000000000c02'
     )),
  1,
  'excluding a same-org brand works (A2 excluded, A1 returned)'
);

-- ── 14) Exclude guard: cross-org exclude raises ────────────────────────────────
select throws_ok(
  $$ select * from public.search_brands(array_fill(0.1::real, array[768])::vector(768),
       '00000000-0000-4000-8000-000000000b01', 100,
       '00000000-0000-4000-8000-000000000c03') $$,
  'P0001',
  'excluded brand is not in the caller organization',
  'excluding a cross-org brand raises (no cross-tenant inference)'
);

-- ── 15) shared_nodes only contains labels shared with the excluded brand ───────
select is(
  (select shared_nodes
     from public.search_brands(
       array_fill(0.1::real, array[768])::vector(768),
       '00000000-0000-4000-8000-000000000b01',
       100,
       '00000000-0000-4000-8000-000000000c02'
     )
    where brand_id = '00000000-0000-4000-8000-000000000c01'),
  '[{"node_type":"color","label":"warm"}]'::jsonb,
  'shared_nodes contains only labels shared with the excluded brand'
);

select * from finish();
rollback;