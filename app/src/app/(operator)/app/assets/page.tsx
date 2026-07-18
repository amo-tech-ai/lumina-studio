import { AssetsWorkspace } from "@/components/assets/assets-workspace";
import type { UploadBrandOption } from "@/components/assets/asset-upload-panel";
import { listAssets } from "@/lib/assets/get-assets";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** SCR-08 / IPI-433 — asset library + brand-scoped upload workspace. */
const AssetsPage = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <AssetsWorkspace assets={[]} brands={[]} isAuthenticated={false} />;
  }

  const { data: brandRows } = await supabase
    .from("brands")
    .select("id, name")
    .order("name");

  const brands: UploadBrandOption[] = (brandRows ?? []).map((b) => ({
    id: b.id,
    name: b.name,
  }));

  try {
    const assets = await listAssets(supabase);
    return <AssetsWorkspace assets={assets} brands={brands} isAuthenticated />;
  } catch (error) {
    console.error("[app/assets] listAssets failed:", error);
    return (
      <AssetsWorkspace
        assets={[]}
        brands={brands}
        isAuthenticated
        fetchError="Unable to load assets. Try again in a moment."
      />
    );
  }
};

export default AssetsPage;
