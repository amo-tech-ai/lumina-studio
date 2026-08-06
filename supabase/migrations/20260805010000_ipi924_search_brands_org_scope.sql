-- IPI-924 · AGENT-RAG-001 — org-scope search_brands
-- search_brands is security definer + service_role-only, so RLS does not apply.
-- Add a required p_org_id filter so the BI similar-brand tool only returns
-- brands from the operator's own organization (cross-tenant safety).
-- Drop the previous unscoped overload so no service-role path can bypass the
-- org filter, and make p_org_id required so omitting it fails closed.
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
  set local hnsw.ef_search = 400;

  -- Fail closed: the excluded brand must belong to the caller org, otherwise
  -- shared_nodes would leak which labels of the caller's brands also exist on
  -- a foreign brand's graph (cross-tenant inference).
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
      ))
      from (
        select gn.node_type, gn.label
        from public.brand_graph_nodes gn
        where gn.brand_id = b.id
          and gn.label in (
            select g2.label
            from public.brand_graph_nodes g2
            where (p_exclude_brand_id is null or g2.brand_id = p_exclude_brand_id)
          )
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

comment on function public.search_brands is
  'Semantic brand search via pgvector cosine similarity (GRAPH-004), org-scoped (IPI-924)';