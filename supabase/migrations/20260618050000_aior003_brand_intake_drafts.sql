-- AIOR-003 Phase 1: brand intake drafts + profile OAuth fields + auth trigger verification
-- Linear: IPI-83
-- Remote verification (2026-06-18): no handle_new_user trigger on auth.users — create if absent

-- ---------------------------------------------------------------------------
-- profiles — OAuth + onboarding columns
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists auth_provider text,
  add column if not exists provider_user_id text,
  add column if not exists onboarding_status text not null default 'pending';

alter table public.profiles
  drop constraint if exists profiles_onboarding_status_check;

alter table public.profiles
  add constraint profiles_onboarding_status_check
  check (onboarding_status in ('pending', 'brand_draft', 'complete'));

comment on column public.profiles.auth_provider is 'Primary auth provider slug (email, google, facebook, etc.)';
comment on column public.profiles.provider_user_id is 'OAuth subject / provider user id when available';
comment on column public.profiles.onboarding_status is 'Operator onboarding: pending | brand_draft | complete';

-- ---------------------------------------------------------------------------
-- brands — intake lifecycle (HITL)
-- ---------------------------------------------------------------------------
alter table public.brands
  add column if not exists intake_status text not null default 'none',
  add column if not exists approved_profile_at timestamptz;

alter table public.brands
  drop constraint if exists brands_intake_status_check;

alter table public.brands
  add constraint brands_intake_status_check
  check (intake_status in ('none', 'draft', 'approved'));

comment on column public.brands.intake_status is 'Brand intake lifecycle: none | draft | approved';
comment on column public.brands.approved_profile_at is 'Timestamp when operator approved intake profile';

-- ---------------------------------------------------------------------------
-- brand_intake_drafts — analyze-only staging before commit
-- ---------------------------------------------------------------------------
create table if not exists public.brand_intake_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  brand_id uuid references public.brands (id) on delete set null,
  source_url text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'expired')),
  draft_profile jsonb not null default '{}'::jsonb,
  draft_scores jsonb not null default '[]'::jsonb,
  url_retrieval jsonb not null default '{}'::jsonb,
  citations jsonb not null default '[]'::jsonb,
  approved_at timestamptz,
  rejected_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists brand_intake_drafts_user_id_idx
  on public.brand_intake_drafts (user_id);

create index if not exists brand_intake_drafts_status_idx
  on public.brand_intake_drafts (status)
  where status = 'pending';

comment on table public.brand_intake_drafts is
  'HITL staging for brand URL analysis — pending until operator approves or rejects';

drop trigger if exists brand_intake_drafts_set_updated_at on public.brand_intake_drafts;
create trigger brand_intake_drafts_set_updated_at
  before update on public.brand_intake_drafts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS — brand_intake_drafts (owner-scoped)
-- ---------------------------------------------------------------------------
alter table public.brand_intake_drafts enable row level security;

drop policy if exists "brand_intake_drafts_select_own" on public.brand_intake_drafts;
create policy "brand_intake_drafts_select_own"
  on public.brand_intake_drafts for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "brand_intake_drafts_insert_own" on public.brand_intake_drafts;
create policy "brand_intake_drafts_insert_own"
  on public.brand_intake_drafts for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "brand_intake_drafts_update_own" on public.brand_intake_drafts;
create policy "brand_intake_drafts_update_own"
  on public.brand_intake_drafts for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "brand_intake_drafts_delete_own" on public.brand_intake_drafts;
create policy "brand_intake_drafts_delete_own"
  on public.brand_intake_drafts for delete to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- handle_new_user — map OAuth metadata into profiles
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    auth_provider,
    provider_user_id,
    onboarding_status
  )
  values (
    new.id,
    coalesce(new.email, new.raw_user_meta_data->>'email'),
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name'
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    ),
    coalesce(new.raw_app_meta_data->>'provider', 'email'),
    coalesce(
      new.raw_user_meta_data->>'sub',
      new.raw_user_meta_data->>'provider_id'
    ),
    'pending'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, profiles.full_name),
        avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
        auth_provider = coalesce(excluded.auth_provider, profiles.auth_provider),
        provider_user_id = coalesce(excluded.provider_user_id, profiles.provider_user_id),
        updated_at = now()
  where profiles.email is distinct from excluded.email
     or profiles.full_name is distinct from excluded.full_name
     or profiles.avatar_url is distinct from excluded.avatar_url
     or profiles.auth_provider is distinct from excluded.auth_provider
     or profiles.provider_user_id is distinct from excluded.provider_user_id;

  return new;
exception
  when others then
    raise warning 'handle_new_user failed: %', sqlerrm;
    return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- auth.users trigger — create only if missing (verified absent on remote 2026-06-18)
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1
    from pg_trigger t
    join pg_proc p on p.oid = t.tgfoid
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'auth'
      and c.relname = 'users'
      and p.proname = 'handle_new_user'
      and not t.tgisinternal
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function public.handle_new_user();
  end if;
end;
$$;
