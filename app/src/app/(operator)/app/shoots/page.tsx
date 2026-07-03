import { ShootsListWorkspace } from "@/components/shoot/shoots-list-workspace";
import type { ShootListItem } from "@/components/shoot/ShootCard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const PORTFOLIO_SELECT =
  "id, name, type, status, dna_score, target_channels, estimated_budget, updated_at, start_date, end_date, location, shot_count, asset_count, cover_url, brand_id";

type PortfolioRow = {
  id: string;
  name: string;
  status: string;
  dna_score: number | null;
  updated_at: string;
  start_date: string | null;
  end_date: string | null;
  cover_url: string | null;
  brand_id: string | null;
  shot_count?: number | null;
};

const LEGACY_SELECT =
  "id, name, type, status, dna_score, target_channels, estimated_budget, updated_at, brand_id";

async function loadShoots(): Promise<{
  shoots: ShootListItem[];
  error: string | null;
}> {
  const supabase = await createSupabaseServerClient();

  let { data, error } = await supabase
    .from("shoot_portfolio_view")
    .select(PORTFOLIO_SELECT)
    .order("updated_at", { ascending: false });

  if (error && (error.message.includes("column") || error.code === "42703")) {
    const legacy = await supabase
      .from("shoot_portfolio_view")
      .select(LEGACY_SELECT)
      .order("updated_at", { ascending: false });
    data = legacy.data as typeof data;
    error = legacy.error;
  }

  if (error) {
    return { shoots: [], error: error.message };
  }

  const rows = (data ?? []) as PortfolioRow[];
  const brandIds = [...new Set(rows.map((r) => r.brand_id).filter(Boolean))] as string[];

  const brandNameById = new Map<string, string>();
  if (brandIds.length > 0) {
    const { data: brands } = await supabase.from("brands").select("id, name").in("id", brandIds);
    for (const brand of brands ?? []) {
      brandNameById.set(brand.id, brand.name);
    }
  }

  const shoots: ShootListItem[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    status: row.status,
    dna_score: row.dna_score,
    updated_at: row.updated_at,
    start_date: row.start_date,
    end_date: row.end_date,
    cover_url: row.cover_url,
    brandName: row.brand_id ? brandNameById.get(row.brand_id) ?? null : null,
    shot_count: row.shot_count ?? null,
  }));

  return {
    shoots,
    error: null,
  };
}

export default async function ShootsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <ShootsListWorkspace shoots={[]} isAuthenticated={false} />;
  }

  const { shoots, error } = await loadShoots();

  if (error) {
    return (
      <ShootsListWorkspace
        shoots={[]}
        isAuthenticated
        fetchError="Unable to load shoots. Try again in a moment."
      />
    );
  }

  return <ShootsListWorkspace shoots={shoots} isAuthenticated />;
}
