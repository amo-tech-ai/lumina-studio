import { AssetDetailWorkspace } from "@/components/assets/asset-detail-workspace";
import { getAssetDetail } from "@/lib/assets/get-assets";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

/** IPI-436 · CLD-103 — slim asset detail (Supabase mirror only). */
const AssetDetailPage = async ({ params }: Props) => {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <AssetDetailWorkspace
        data={null}
        fetchError="Sign in to view this asset."
      />
    );
  }

  const result = await getAssetDetail(supabase, id);

  if (!result.ok) {
    return (
      <AssetDetailWorkspace
        data={null}
        fetchError={
          result.status === 404
            ? "This asset doesn’t exist or you don’t have access to it."
            : "Unable to load this asset. Try again in a moment."
        }
      />
    );
  }

  return <AssetDetailWorkspace data={result.data} fetchError={null} />;
};

export default AssetDetailPage;
