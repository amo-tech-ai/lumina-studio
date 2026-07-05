// IPI-372 DESIGN-055b — Shoots List (restart, v2 image-first)
// Data source unchanged from IPI-85 (SHOOT-UX-002): shoot_portfolio_view, same columns.

import { ShootsListWorkspace } from "@/components/shoot/shoots-list-workspace";
import type { ShootRow } from "@/components/shoot/ShootCard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ShootsPage = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <ShootsListWorkspace shoots={[]} isAuthenticated={false} />;
  }

  // ponytail: query via public view — shoot.shoots is not in the exposed schema list;
  // migration 20260626000001_shoot_portfolio_view.sql adds this view.
  const { data, error } = await supabase
    .from("shoot_portfolio_view")
    .select("id, name, type, status, dna_score, target_channels, estimated_budget, updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    // Don't swallow the failure — the user sees a generic message, the server keeps the cause.
    console.error("[shoots] shoot_portfolio_view query failed", error);
    return (
      <ShootsListWorkspace
        shoots={[]}
        isAuthenticated
        fetchError="Unable to load shoots. Try again in a moment."
      />
    );
  }

  return <ShootsListWorkspace shoots={(data ?? []) as ShootRow[]} isAuthenticated />;
};

export default ShootsPage;
