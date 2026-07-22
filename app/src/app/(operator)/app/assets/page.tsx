import { AssetsWorkspace } from "@/components/assets/assets-workspace";
import type { UploadBrandOption } from "@/components/assets/asset-upload-panel";
import { listAssets } from "@/lib/assets/get-assets";
import {
  buildAssetsLibraryUrl,
  parseAssetsLibraryParams,
  toListAssetsInput,
  type RawAssetsSearchParams,
} from "@/lib/assets/list-assets-params";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** SCR-08 / IPI-435 — asset library search + brand-scoped upload workspace. */
const AssetsPage = async ({
  searchParams,
}: {
  searchParams: Promise<RawAssetsSearchParams>;
}) => {
  const raw = await searchParams;
  const parsed = parseAssetsLibraryParams(raw);
  // Invalid sort/status/cursor/limit/brand fail safely — drop bad params.
  if (!parsed.ok) {
    redirect("/app/assets");
  }
  const filters = parsed.data;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <AssetsWorkspace
        assets={[]}
        brands={[]}
        filters={filters}
        nextCursor={null}
        isAuthenticated={false}
      />
    );
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
    const page = await listAssets(supabase, toListAssetsInput(filters));
    return (
      <AssetsWorkspace
        assets={page.items}
        brands={brands}
        filters={filters}
        nextCursor={page.nextCursor}
        isAuthenticated
      />
    );
  } catch (error) {
    console.error("[app/assets] listAssets failed:", error);
    // Malformed cursor that passed charset checks but failed at the DB layer —
    // fall back to page 1 with the same filters (mirrors Planner Hub).
    if (filters.cursor) {
      redirect(buildAssetsLibraryUrl({ ...filters, cursor: undefined }));
    }
    return (
      <AssetsWorkspace
        assets={[]}
        brands={brands}
        filters={filters}
        nextCursor={null}
        isAuthenticated
        fetchError="Unable to load assets. Try again in a moment."
      />
    );
  }
};

export default AssetsPage;
