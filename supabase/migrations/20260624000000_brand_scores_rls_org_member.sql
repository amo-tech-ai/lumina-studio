-- Align brand_scores SELECT policy with brands table:
-- use org-membership check so collaborators can read scores, not just the owner.
DROP POLICY IF EXISTS "brand_scores_select_via_brand" ON public.brand_scores;
CREATE POLICY "brand_scores_select_via_brand" ON public.brand_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.brands b
      WHERE b.id = brand_scores.brand_id
        AND is_org_member(b.org_id)
    )
  );
