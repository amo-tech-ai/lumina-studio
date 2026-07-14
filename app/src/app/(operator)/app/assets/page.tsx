import { AssetsWorkspace } from "@/components/assets/assets-workspace";
import { listAssets } from "@/lib/assets/get-assets";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** SCR-08 — read-only asset library (IPI-404). Data: `assets` table, scoped
 *  by RLS (`assets_select_via_brand` — owner's brands only), same trust
 *  model brand/page.tsx already uses for the brand list. */
const AssetsPage = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <AssetsWorkspace assets={[]} isAuthenticated={false} />;
  }

  try {
    const assets = await listAssets(supabase);
    return <AssetsWorkspace assets={assets} isAuthenticated />;
  } catch (error) {
    console.error("[app/assets] listAssets failed:", error);
    return (
      <AssetsWorkspace
        assets={[]}
        isAuthenticated
        fetchError="Unable to load assets. Try again in a moment."
      />
    );
  }
};

export default AssetsPage;
