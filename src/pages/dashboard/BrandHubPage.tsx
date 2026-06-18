import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, RefreshCw } from "lucide-react";

import { BrandScoreGrid } from "@/components/brand/BrandScoreGrid";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getBrandScores, listUserBrands, type BrandSummary } from "@/services/brandService";
import type { BrandAiProfile, BrandScoreRow } from "@/types/brand-intelligence";

function parseProfile(raw: BrandSummary["ai_profile"]): BrandAiProfile | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  const profile = raw as Record<string, unknown>;
  const visual = profile.visualIdentity;

  return {
    name: typeof profile.name === "string" ? profile.name : "",
    tagline: typeof profile.tagline === "string" ? profile.tagline : "",
    category: typeof profile.category === "string" ? profile.category : "",
    visualIdentity: {
      colors:
        visual &&
        typeof visual === "object" &&
        !Array.isArray(visual) &&
        Array.isArray((visual as { colors?: unknown }).colors)
          ? ((visual as { colors: string[] }).colors ?? [])
          : [],
      mood:
        visual &&
        typeof visual === "object" &&
        !Array.isArray(visual) &&
        typeof (visual as { mood?: unknown }).mood === "string"
          ? (visual as { mood: string }).mood
          : "",
    },
    targetAudience:
      typeof profile.targetAudience === "string" ? profile.targetAudience : "",
    sourceUrl: typeof profile.sourceUrl === "string" ? profile.sourceUrl : "",
    analyzedAt: typeof profile.analyzedAt === "string" ? profile.analyzedAt : "",
  };
}

export default function BrandHubPage() {
  const [brand, setBrand] = useState<BrandSummary | null>(null);
  const [scores, setScores] = useState<BrandScoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const brands = await listUserBrands();
        const latest = brands[0] ?? null;

        if (cancelled) return;

        setBrand(latest);

        if (latest) {
          const brandScores = await getBrandScores(latest.id);
          if (!cancelled) {
            setScores(brandScores);
          }
        } else {
          setScores([]);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load brand");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const profile = brand ? parseProfile(brand.ai_profile) : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Operator workspace
          </p>
          <h1 className="mt-1 font-serif text-3xl tracking-tight">Brand hub</h1>
          <p className="mt-2 max-w-2xl font-sans text-muted-foreground">
            Your saved brand intelligence — profile, visual identity, and readiness scores.
          </p>
        </div>
        {brand ? (
          <Button asChild variant="outline" size="sm" className="font-sans">
            <Link
              to={`/dashboard/brand/intake?brandId=${brand.id}${brand.brand_url ? `&url=${encodeURIComponent(brand.brand_url)}` : ""}`}
            >
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
              Re-analyze
            </Link>
          </Button>
        ) : null}
      </header>

      {loading ? (
        <div className="flex items-center gap-2 font-sans text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading brand…
        </div>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {!loading && !error && !brand ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="font-serif text-xl">No brand yet</CardTitle>
            <CardDescription className="font-sans">
              Run brand intake to analyze your website and save your profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="font-sans">
              <Link to="/dashboard/brand/intake">Start brand intake</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!loading && !error && brand && profile ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-2xl">{brand.name}</CardTitle>
              {profile.tagline ? (
                <CardDescription className="font-sans text-base">
                  {profile.tagline}
                </CardDescription>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-4 font-sans text-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Category
                  </p>
                  <p className="mt-1">{profile.category || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Website
                  </p>
                  {brand.brand_url ? (
                    <a
                      href={brand.brand_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 block truncate text-primary underline-offset-4 hover:underline"
                    >
                      {brand.brand_url}
                    </a>
                  ) : (
                    <p className="mt-1">—</p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Target audience
                </p>
                <p className="mt-1 text-muted-foreground">
                  {profile.targetAudience || "—"}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Visual identity
                </p>
                <p className="mb-3 text-muted-foreground">{profile.visualIdentity.mood || "—"}</p>
                <div className="flex flex-wrap gap-2">
                  {profile.visualIdentity.colors.map((color) => (
                    <Badge key={color} variant="secondary">
                      {color}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-xl">Readiness scores</CardTitle>
            </CardHeader>
            <CardContent>
              <BrandScoreGrid scores={scores} />
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
