-- IPI-26 — align brand_intake_drafts RLS with org ownership (table pre-exists on remote)

alter table public.brand_intake_drafts enable row level security;

drop policy if exists "brand_intake_drafts_select_own" on public.brand_intake_drafts;
drop policy if exists "intake_drafts_select_own" on public.brand_intake_drafts;
drop policy if exists "brand_intake_drafts_select" on public.brand_intake_drafts;
drop policy if exists "intake_drafts_select_org_or_owner" on public.brand_intake_drafts;

create policy "intake_drafts_select_org_or_owner"
  on public.brand_intake_drafts for select to authenticated
  using (
    user_id = (select auth.uid())
    or (
      brand_id is not null
      and exists (
        select 1 from public.brands b
        where b.id = brand_intake_drafts.brand_id
          and public.is_org_member(b.org_id)
      )
    )
  );
