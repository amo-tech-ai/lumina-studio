import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { getMyBrand, type BrandWithScores } from "@/services/brandService";
import { analyzeBrandFromUrl } from "@/services/brandIntelligenceService";
import { BrandProfileCard } from "@/components/brand/BrandProfileCard";
import { BrandScorePanel } from "@/components/brand/BrandScorePanel";
import { filterScores } from "@/lib/brand-scores";
import { Button } from "@/components/ui/button";

function SkeletonCard() {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-4 animate-pulse">
      <div className="h-6 bg-muted rounded w-1/2" />
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="h-4 bg-muted rounded w-1/4" />
      <div className="h-20 bg-muted rounded" />
    </div>
  );
}

export default function BrandHubPage() {
  const { user } = useAuth();
  const [brand, setBrand] = useState<BrandWithScores | null | undefined>(undefined);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getMyBrand(user.id)
      .then(setBrand)
      .catch((e) => setError(e.message));
  }, [user]);

  async function handleReanalyze() {
    if (!brand?.brand_url) return;
    setReanalyzing(true);
    setError(null);
    try {
      await analyzeBrandFromUrl({ url: brand.brand_url, brandId: brand.id });
      const updated = await getMyBrand(user!.id);
      setBrand(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Re-analysis failed");
    } finally {
      setReanalyzing(false);
    }
  }

  const loading = brand === undefined;
  const profile = brand?.ai_profile ?? null;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl">Brand Hub</h1>
        {brand?.brand_url && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReanalyze}
            disabled={reanalyzing}
          >
            {reanalyzing ? "Analyzing…" : "Re-analyze"}
          </Button>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {!loading && !profile && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <Sparkles className="w-12 h-12 text-muted-foreground" />
          <h2 className="font-serif text-xl">No brand analysis yet</h2>
          <p className="text-muted-foreground text-sm max-w-sm">
            Complete Brand Intake to generate your brand intelligence report.
          </p>
          <Button asChild>
            <Link to="/app/brand/intake">Go to Brand Intake →</Link>
          </Button>
        </div>
      )}

      {!loading && profile && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BrandProfileCard profile={profile} />
            {filterScores(brand!.brand_scores).length >= 1 && (
              <BrandScorePanel
                scores={brand!.brand_scores}
                productionReadiness={profile.productionReadiness}
              />
            )}
          </div>
          <div className="flex justify-end pt-2">
            <Button asChild size="lg">
              <Link to="/app/assets">Start a shoot →</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
