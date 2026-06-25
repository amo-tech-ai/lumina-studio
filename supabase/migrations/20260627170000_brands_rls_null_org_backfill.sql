-- CRIT-2: brands with org_id IS NULL are invisible to RLS (is_org_member(NULL) is always false).
-- Fix A: backfill org_id for brands created before the org layer (IPI-16).
-- Fix B: update SELECT policy to allow creator access when org_id is still NULL.

-- Backfill: assign each ownerless brand to the owner's org.
UPDATE public.brands
SET org_id = (
  SELECT o.id
  FROM public.organizations o
  JOIN public.org_members m ON m.org_id = o.id
  WHERE m.user_id = brands.user_id
    AND m.role = 'owner'
  LIMIT 1
)
WHERE org_id IS NULL;

-- Update SELECT policy: legacy brands (org_id still NULL after backfill) visible to creator only.
DROP POLICY IF EXISTS "brands_select_org" ON public.brands;
CREATE POLICY "brands_select_org"
  ON public.brands FOR SELECT TO authenticated
  USING (
    (org_id IS NULL AND user_id = (SELECT auth.uid()))
    OR
    (org_id IS NOT NULL AND public.is_org_member(org_id))
  );
