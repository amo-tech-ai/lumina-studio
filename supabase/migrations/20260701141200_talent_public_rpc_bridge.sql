-- IPI-308 · MODEL-P2 — thin public-schema RPC bridge to the `talent` schema.
--
-- `talent` is deliberately not in supabase/config.toml's exposed Data API
-- schemas (same isolation as `shoot` — see 20260622120000_shoot_core_schema.sql's
-- own rationale). This repo's standard client (createSupabaseAdminClient(),
-- used by every existing Mastra tool) goes through PostgREST, so it cannot
-- reach talent.* tables directly. Matches the shoot_portfolio_view /
-- get_shoot_detail_rpc precedent: a narrow public-schema surface, not
-- exposing the whole schema.
--
-- No new tables — everything here reads/writes tables IPI-307 already created.
--
-- Rollback:
--   drop function if exists public.search_talent(text,text,date,date,text,uuid);
--   drop function if exists public.get_or_create_shortlist(uuid);
--   drop function if exists public.toggle_shortlist_item(uuid,uuid,boolean);
--   drop function if exists talent.compute_rate_tier(uuid);

-- ---------------------------------------------------------------------------
-- Coarse rate-tier bucket — reads the private `rates` jsonb inside the schema,
-- never returns raw numbers to a caller. Defensive against missing/malformed
-- data (rates shape isn't fixed yet) — returns null tier rather than erroring.
-- ---------------------------------------------------------------------------
create or replace function talent.compute_rate_tier(p_talent_profile_id uuid)
returns text
language plpgsql
stable
set search_path = talent
as $$
declare
  v_half_day numeric;
begin
  select nullif(rates->>'half_day', '')::numeric into v_half_day
  from talent.talent_profiles where id = p_talent_profile_id;

  if v_half_day is null then return null; end if;
  if v_half_day < 500 then return '$';
  elsif v_half_day < 1500 then return '$$';
  else return '$$$';
  end if;
exception
  when others then return null; -- malformed rates jsonb never breaks search
end;
$$;

-- ---------------------------------------------------------------------------
-- search_talent — filtered browse for the Talent tab. Any authenticated brand
-- may call this (talent_profiles_public is intentionally marketplace-browsable,
-- not org-scoped) — no is_org_member check here, only an auth check.
-- p_only_shortlist_id folds "view my shortlist" into the same function instead
-- of a 4th RPC.
-- ---------------------------------------------------------------------------
create or replace function public.search_talent(
  p_shoot_type text default null,
  p_budget_tier text default null,
  p_date_start date default null,
  p_date_end date default null,
  p_representation text default null,
  p_only_shortlist_id uuid default null
)
returns setof jsonb
language plpgsql
security definer
set search_path = public, talent
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  return query
  select to_jsonb(t) || jsonb_build_object(
    'rate_tier', talent.compute_rate_tier(t.id),
    'is_available', not exists (
      select 1 from talent.talent_availability a
      where a.talent_profile_id = t.id
        and a.status in ('blocked', 'tentative', 'booked')
        and (
          p_date_start is null or p_date_end is null
          or a.date_range && daterange(p_date_start, p_date_end, '[]')
        )
    )
  )
  from talent.talent_profiles_public t
  where (
      p_representation is null
      or (p_representation = 'independent' and not t.is_agency_represented)
      or (p_representation = 'agency' and t.is_agency_represented)
    )
    and (p_budget_tier is null or talent.compute_rate_tier(t.id) = p_budget_tier)
    and (
      p_only_shortlist_id is null
      or exists (
        select 1 from talent.talent_shortlist_items i
        where i.shortlist_id = p_only_shortlist_id and i.talent_profile_id = t.id
      )
    )
  order by t.created_at desc
  limit 50;
end;
$$;

revoke all on function public.search_talent(text, text, date, date, text, uuid) from public, anon;
grant execute on function public.search_talent(text, text, date, date, text, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- get_or_create_shortlist — one shortlist per org for MVP (per-brand-org
-- default list, matching the "minimal list, not a board" scope). Enforces
-- org membership before any read/write.
-- ---------------------------------------------------------------------------
create or replace function public.get_or_create_shortlist(p_org_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, talent
as $$
declare
  v_id uuid;
begin
  if not public.is_org_member(p_org_id) then
    raise exception 'not a member of this organization';
  end if;

  select id into v_id
  from talent.talent_shortlists
  where owner_org_id = p_org_id
  order by created_at asc
  limit 1;

  if v_id is null then
    insert into talent.talent_shortlists (owner_org_id, name)
    values (p_org_id, 'Shortlist')
    returning id into v_id;
  end if;

  return v_id;
end;
$$;

revoke all on function public.get_or_create_shortlist(uuid) from public, anon;
grant execute on function public.get_or_create_shortlist(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- toggle_shortlist_item — add/remove. Re-derives the real owner org from the
-- shortlist row itself before checking membership — never trusts a
-- client-supplied org id, only the shortlist_id's actual owner.
-- ---------------------------------------------------------------------------
create or replace function public.toggle_shortlist_item(
  p_shortlist_id uuid,
  p_talent_profile_id uuid,
  p_add boolean
)
returns void
language plpgsql
security definer
set search_path = public, talent
as $$
declare
  v_owner_org_id uuid;
begin
  select owner_org_id into v_owner_org_id
  from talent.talent_shortlists
  where id = p_shortlist_id;

  if v_owner_org_id is null then
    raise exception 'shortlist not found';
  end if;

  if not public.is_org_member(v_owner_org_id) then
    raise exception 'not a member of this organization';
  end if;

  if p_add then
    insert into talent.talent_shortlist_items (shortlist_id, talent_profile_id)
    values (p_shortlist_id, p_talent_profile_id)
    on conflict (shortlist_id, talent_profile_id) do nothing;
  else
    delete from talent.talent_shortlist_items
    where shortlist_id = p_shortlist_id and talent_profile_id = p_talent_profile_id;
  end if;
end;
$$;

revoke all on function public.toggle_shortlist_item(uuid, uuid, boolean) from public, anon;
grant execute on function public.toggle_shortlist_item(uuid, uuid, boolean) to authenticated;
