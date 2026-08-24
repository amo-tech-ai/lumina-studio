-- IPI-V2-000 · SB-FIX-001 — Remove unnecessary anonymous EXECUTE from brand assets RPC.
-- Live function: public.get_brand_assets(uuid, uuid) SECURITY DEFINER.
-- Body already rejects null auth.uid() and checks brand/org membership.
-- App calls this with the authenticated user client only.
--
-- Rollback:
--   grant execute on function public.get_brand_assets(uuid, uuid) to anon;

revoke execute
on function public.get_brand_assets(uuid, uuid)
from public, anon;

grant execute
on function public.get_brand_assets(uuid, uuid)
to authenticated;
