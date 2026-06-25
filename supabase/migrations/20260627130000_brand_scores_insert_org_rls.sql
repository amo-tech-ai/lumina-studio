-- IPI-25 follow-up: org members (editor+) can INSERT brand_scores for org brands.
-- UPDATE/SELECT were org-scoped in IPI-46; INSERT still required brands.user_id = auth.uid(),
-- which breaks brand-intelligence upsert for non-creator org members.

drop policy if exists "brand_scores_insert_via_brand" on public.brand_scores;

create policy "brand_scores_insert_via_brand"
  on public.brand_scores for insert to authenticated
  with check (
    exists (
      select 1 from public.brands b
      where b.id = brand_scores.brand_id
        and public.is_org_member(b.org_id)
    )
  );
