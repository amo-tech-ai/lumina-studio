-- IPI-924 · AGENT-RAG-001 — org-scope search_brands
-- search_brands is security definer + service_role-only, so RLS does not apply.
-- Add an explicit p_org_id filter so the BI similar-brand tool only returns
-- brands from the operator's own organization (cross-tenant safety).
-- Drop the previous unscoped overload so no service-role path can bypass the
-- org filter.
drop function if exists public.search_brands(vector, int, uuid);

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
begin
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
grant  execute on function public.search_brands(vector(768), int, uuid, uuid) to service_role;

comment on function public.search_brands is
  'Semantic brand search via pgvector cosine similarity (GRAPH-004), org-scoped (IPI-924)';