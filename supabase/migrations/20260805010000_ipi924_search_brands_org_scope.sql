-- IPI-924 · SB-ORG-001 — add organization scope to search_brands
--
-- Extends the existing search_brands RPC (GRAPH-004) with:
--   • p_org_id parameter to scope results to caller's organization
--   • HNSW ef_search tuning for better recall on large indexes
--   • Reference-brand org guard so callers can only search from brands they own

create or replace function public.search_brands(
  p_embedding        vector(768),
  p_limit            int     default 20,
  p_exclude_brand_id uuid    default null,
  p_org_id           uuid    default null
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
declare
  v_ref_org_id uuid;
begin
  -- Tune HNSW recall for this transaction (function form works in STABLE functions)
  perform set_config('hnsw.ef_search', '400', true);

  -- If caller provided an org_id, verify the reference brand belongs to that org
  if p_org_id is not null and p_exclude_brand_id is not null then
    select org_id into v_ref_org_id
    from public.brands
    where id = p_exclude_brand_id;

    -- Allow NULL org_id on reference brand (legacy brands) — treat as accessible
    if v_ref_org_id is not null and v_ref_org_id != p_org_id then
      raise exception 'excluded brand is not in the caller organization';
    end if;
  end if;

  return query
  select
    b.id,
    b.name,
    1 - (b.embedding <=> p_embedding) as similarity,
    (
      select jsonb_agg(jsonb_build_object(
        'node_type', gn.node_type,
        'label', gn.label
      ))
      from public.brand_graph_nodes gn
      where gn.brand_id = b.id
        and gn.label in (
          select g2.label
          from public.brand_graph_nodes g2
          where (p_exclude_brand_id is null or g2.brand_id = p_exclude_brand_id)
        )
      limit 10
    ) as shared_nodes
  from public.brands b
  where b.embedding is not null
    and (p_exclude_brand_id is null or b.id != p_exclude_brand_id)
    and (p_org_id is null or b.org_id = p_org_id)
  order by b.embedding <=> p_embedding
  limit p_limit;
end;
$$;

revoke execute on function public.search_brands(vector(768), int, uuid, uuid) from public;
grant execute on function public.search_brands(vector(768), int, uuid, uuid) to service_role;

comment on function public.search_brands is
  'Semantic brand search via pgvector cosine similarity with optional org scope (IPI-924)';
