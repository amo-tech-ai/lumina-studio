import { ShootDetailWorkspace } from "@/components/shoot/shoot-detail-workspace";
import { getShootDetail } from "@/lib/shoot/get-shoot-detail";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ shootId: string }> };

const ShootDetailPage = async ({ params }: Props) => {
  const { shootId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <ShootDetailWorkspace data={null} fetchError="Sign in to view this shoot." />;
  }

  const result = await getShootDetail(supabase, shootId);

  if (!result.ok) {
    // Don't swallow the failure — the user sees a generic message, the server keeps the cause.
    return (
      <ShootDetailWorkspace
        data={null}
        fetchError={
          result.status === 404
            ? "This shoot doesn't exist or you don't have access to it."
            : "Unable to load this shoot. Try again in a moment."
        }
      />
    );
  }

  return <ShootDetailWorkspace data={result.data} fetchError={null} />;
};

export default ShootDetailPage;
