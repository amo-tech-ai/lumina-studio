import { BrandListWorkspace } from "@/components/brand-hub/brand-list-workspace";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BASE_SCORE_TYPES, computeDnaScore } from "@/lib/brand-scores";

export const dynamic = "force-dynamic";

type BrandRow = {
  id: string;
  name: string;
  brand_url: string | null;
  intake_status: string | null;
  created_at: string;
};

const BrandsPage = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <BrandListWorkspace brands={[]} isAuthenticated={false} />;
  }

  const { data: brands, error } = await supabase
    .from("brands")
    .select("id, name, brand_url, intake_status, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <BrandListWorkspace
        brands={[]}
        isAuthenticated
        fetchError="Unable to load brands. Try again in a moment."
      />
    );
  }

  const rows = (brands ?? []) as BrandRow[];

  if (rows.length === 0) {
    return <BrandListWorkspace brands={[]} isAuthenticated />;
  }

  const brandIds = rows.map((b) => b.id);
  const { data: scoreRows, error: scoresError } = await supabase
    .from("brand_scores")
    .select("brand_id, score_type, score")
    .in("brand_id", brandIds);

  if (scoresError) {
    return (
      <BrandListWorkspace
        brands={[]}
        isAuthenticated
        fetchError="Unable to load brand scores. Try again in a moment."
      />
    );
  }

  const scoresByBrand = new Map<string, { score_type: string; score: number }[]>();
  for (const row of scoreRows ?? []) {
    const list = scoresByBrand.get(row.brand_id) ?? [];
    list.push({ score_type: row.score_type, score: row.score });
    scoresByBrand.set(row.brand_id, list);
  }

  const workspaceBrands = rows.map((brand) => {
    const scoreList = scoresByBrand.get(brand.id) ?? [];
    const pillars = BASE_SCORE_TYPES.flatMap((type) => {
      const row = scoreList.find((s) => s.score_type === type);
      return row ? [{ score_type: type, score: row.score }] : [];
    });

    return {
      id: brand.id,
      name: brand.name,
      brandUrl: brand.brand_url,
      intakeStatus: brand.intake_status,
      dnaScore: computeDnaScore(scoreList),
      pillars,
    };
  });

  return <BrandListWorkspace brands={workspaceBrands} isAuthenticated />;
};

export default BrandsPage;
