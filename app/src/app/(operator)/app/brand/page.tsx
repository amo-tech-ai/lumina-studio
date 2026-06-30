import Link from "next/link";
import { BrandListContext } from "@/components/brand-hub/brand-list-context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
import { intakeStatusColor, intakeStatusLabel } from "@/lib/brand-hub";
import { computeDnaScore } from "@/lib/brand-scores";
import { scoreColor } from "@/lib/brand-utils";

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
    return (
      <div className="min-h-screen p-8" style={{ background: "#FBF8F5" }}>
        <Link
          href="/app"
          className="font-sans text-sm text-[#64748B] hover:underline"
        >
          ← Command Center
        </Link>
        <h1 className="mt-4 font-serif text-3xl text-[#1E293B]">Brands</h1>
        <p className="mt-2 font-sans text-[#64748B]">
          Sign in to view and manage your brand profiles.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/login?redirect=/app/brand"
            className="rounded-full px-5 py-2.5 font-sans text-sm font-medium text-white"
            style={{ background: "#E87C4D" }}
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const { data: brands } = await supabase
    .from("brands")
    .select("id, name, brand_url, intake_status, created_at")
    .order("created_at", { ascending: false });

  const rows = (brands ?? []) as BrandRow[];

  if (rows.length === 0) {
    return (
      <div className="min-h-screen p-8" style={{ background: "#FBF8F5" }}>
        <Link
          href="/app"
          className="font-sans text-sm text-[#64748B] hover:underline"
        >
          ← Command Center
        </Link>
        <h1 className="mt-4 font-serif text-3xl text-[#1E293B]">Brands</h1>
        <p className="mt-2 font-sans text-[#64748B]">
          No brands yet. Run intake to analyze your first brand with Gemini.
        </p>
        <Link
          href="/app/onboarding"
          className="mt-6 inline-block rounded-full px-5 py-2.5 font-sans text-sm font-medium text-white"
          style={{ background: "#E87C4D" }}
        >
          Start brand intake
        </Link>
      </div>
    );
  }

  const brandIds = rows.map((b) => b.id);
  const { data: scoreRows } = await supabase
    .from("brand_scores")
    .select("brand_id, score_type, score")
    .in("brand_id", brandIds);

  const scoresByBrand = new Map<string, { score_type: string; score: number }[]>();
  for (const row of scoreRows ?? []) {
    const list = scoresByBrand.get(row.brand_id) ?? [];
    list.push({ score_type: row.score_type, score: row.score });
    scoresByBrand.set(row.brand_id, list);
  }

  return (
    <div className="min-h-screen p-8" style={{ background: "#FBF8F5" }}>
      <BrandListContext
        brands={rows.map((brand) => ({
          id: brand.id,
          name: brand.name,
          dnaScore: computeDnaScore(scoresByBrand.get(brand.id)),
          intakeStatus: brand.intake_status,
        }))}
      />
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link
              href="/app"
              className="font-sans text-sm text-[#64748B] hover:underline"
            >
              ← Command Center
            </Link>
            <h1 className="mt-2 font-serif text-3xl text-[#1E293B]">Brands</h1>
            <p className="mt-1 font-sans text-sm text-[#64748B]">
              {rows.length} brand{rows.length === 1 ? "" : "s"} — open a hub to
              review intelligence and scores.
            </p>
          </div>
          <Link
            href="/app/onboarding"
            className="rounded-full border border-[#D1C9C0] px-4 py-2 font-sans text-sm text-[#64748B] hover:border-[#94A3B8]"
          >
            + New brand
          </Link>
        </header>

        <ul className="space-y-3">
          {rows.map((brand) => {
            const dna = computeDnaScore(scoresByBrand.get(brand.id));
            const status = brand.intake_status ?? "brand_created";

            return (
              <li key={brand.id}>
                <Link
                  href={`/app/brand/${brand.id}`}
                  className="flex items-center gap-4 rounded-2xl border border-[#E8E0D8] bg-white p-4 transition-shadow hover:shadow-md"
                >
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-sans text-sm font-semibold text-white"
                    style={{ background: scoreColor(dna) }}
                    title="DNA score"
                  >
                    {dna || "—"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-lg text-[#1E293B]">{brand.name}</p>
                    {brand.brand_url && (
                      <p className="truncate font-sans text-xs text-[#94A3B8]">
                        {brand.brand_url}
                      </p>
                    )}
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 font-sans text-[10px] font-medium uppercase tracking-wide text-white"
                    style={{ background: intakeStatusColor(status) }}
                  >
                    {intakeStatusLabel(status)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default BrandsPage;
