-- IPI-441 CLD-118 — Asset Activity Timeline (minimal v1 — unblocks 639)
-- Keep now: asset_id, cloudinary_asset_id, version, kind, request_id, created_at, RLS
-- Defer: resource_metadata_changed, restore, timeline UI, Realtime, MediaFlows, broad event-sourcing
-- Security v1: SELECT authenticated org-aware, INSERT service_role only, no UPDATE/DELETE

create table public.asset_events (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  cloudinary_asset_id text,
  version bigint,
  kind text not null check (kind in ('upload','moderated','approved','rejected')),
  request_id text not null unique,
  created_at timestamptz not null default now()
);

create index asset_events_asset_id_created_at_idx on public.asset_events (asset_id, created_at desc);
create index asset_events_cloudinary_asset_id_idx on public.asset_events (cloudinary_asset_id) where cloudinary_asset_id is not null;
create index asset_events_request_id_idx on public.asset_events (request_id);

alter table public.asset_events enable row level security;

-- SELECT: authenticated users through org-aware RLS (same as cloudinary_assets)
-- Uses assets.brand_id -> brands.org_id -> is_org_member
create policy asset_events_select on public.asset_events
  for select to authenticated
  using (
    exists (
      select 1 from public.assets a
      join public.brands b on b.id = a.brand_id
      where a.id = asset_events.asset_id
      and (
        (b.org_id is null and b.user_id = auth.uid())
        or public.is_org_member(b.org_id)
      )
    )
  );

-- INSERT: service_role only (trusted webhook/backend). No authenticated insert for v1.
-- Service role bypasses RLS, so no policy needed for service_role; explicitly allow service_role via permissive policy
-- To keep RLS enabled and allow service_role, create a permissive policy for service_role (or rely on bypass). For explicitness:
create policy asset_events_insert_service on public.asset_events
  for insert to service_role
  with check (true);

-- No UPDATE / DELETE grants — append-only. No policies = denied.

comment on table public.asset_events is 'IPI-441 minimal — append-only audit for upload (v1); moderated/approved/rejected added by IPI-64. Defer metadata/restore. request_id is idempotency key from Cloudinary request_id header.';
comment on column public.asset_events.request_id is 'Idempotency key from Cloudinary X-Cld-Request-Id / notification request_id; unique prevents duplicate on retry.';
