import { Loader2, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { BrandProfileCard, type BrandProfileDisplay } from "@/components/brand/BrandProfileCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { analyzeBrandFromUrl } from "@/services/brandIntelligenceService";
import { fetchBrandScores, fetchLatestBrand, type BrandRecord } from "@/services/brandService";
import type { BrandIntelligenceResponse, BrandScoreRow } from "@/types/brand-intelligence";

type ViewState = "idle" | "loading" | "error" | "success";

function isValidUrl(value: string): boolean {
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

const BrandPage = () => {
  const [url, setUrl] = useState("");
  const [brandId, setBrandId] = useState<string | null>(null);
  const [brandRecord, setBrandRecord] = useState<BrandRecord | null>(null);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [scores, setScores] = useState<BrandScoreRow[]>([]);
  const [viewState, setViewState] = useState<ViewState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);

  const applyResult = useCallback((result: BrandIntelligenceResponse) => {
    setBrandId(result.brandId);
    setProfile(result.profile);
    setScores(result.scores);
    setBrandRecord({
      id: result.brandId,
      name: result.brand.name,
      brand_url: typeof result.profile.sourceUrl === "string" ? result.profile.sourceUrl : url.trim(),
      ai_profile: result.profile,
      updated_at: new Date().toISOString(),
    });
    setViewState("success");
  }, [url]);

  const loadExistingBrand = useCallback(async () => {
    try {
      const brand = await fetchLatestBrand();
      if (!brand) return;

      const brandScores = await fetchBrandScores(brand.id);
      setBrandId(brand.id);
      setBrandRecord(brand);
      setProfile(brand.ai_profile);
      setScores(brandScores);
      if (brand.brand_url) {
        setUrl(brand.brand_url);
      }
      if (brandScores.length > 0 || Object.keys(brand.ai_profile).length > 0) {
        setViewState("success");
      }
    } catch (err) {
      console.error("Failed to load brand:", err);
    } finally {
      setInitialLoad(false);
    }
  }, []);

  useEffect(() => {
    void loadExistingBrand();
  }, [loadExistingBrand]);

  const handleAnalyze = async () => {
    const trimmed = url.trim();
    if (!isValidUrl(trimmed)) {
      setErrorMessage("Enter a valid http(s) brand URL.");
      setViewState("error");
      return;
    }

    setViewState("loading");
    setErrorMessage(null);

    try {
      const payload = brandId ? { url: trimmed, brandId } : { url: trimmed };
      const result = await analyzeBrandFromUrl(payload);
      applyResult(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Brand analysis failed";
      setErrorMessage(message);
      setViewState("error");
    }
  };

  const isLoading = viewState === "loading";
  const showSuccess = viewState === "success" && profile && brandRecord;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Brand</h1>
        <p className="mt-1 font-sans text-sm text-muted-foreground">
          Paste your brand site — Gemini analyzes the URL and saves your DNA profile to Supabase.
        </p>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-xl">
            <Sparkles className="h-5 w-5 text-primary" aria-hidden />
            Brand URL intake
          </CardTitle>
          <CardDescription className="font-sans">
            Analysis takes about 10–20 seconds. Requires GEMINI_API_KEY on the edge function.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="brand-url" className="font-sans">
              Website URL
            </Label>
            <Input
              id="brand-url"
              type="url"
              inputMode="url"
              placeholder="https://yourbrand.com"
              value={url}
              disabled={isLoading || initialLoad}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isLoading) {
                  void handleAnalyze();
                }
              }}
              aria-describedby="brand-url-hint"
            />
            <p id="brand-url-hint" className="font-sans text-xs text-muted-foreground">
              Example: https://www.glossier.com
            </p>
          </div>

          <Button
            type="button"
            className="w-full sm:w-auto"
            disabled={isLoading || !url.trim() || initialLoad}
            onClick={() => void handleAnalyze()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Analyzing brand…
              </>
            ) : (
              "Analyze brand"
            )}
          </Button>

          {viewState === "error" && errorMessage ? (
            <Alert variant="destructive">
              <AlertTitle className="font-sans">Analysis failed</AlertTitle>
              <AlertDescription className="font-sans">{errorMessage}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      {isLoading ? (
        <Card className="border-dashed border-border bg-surface-warm">
          <CardContent className="flex items-center gap-3 py-8 font-sans text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden />
            Fetching URL context and scoring brand DNA…
          </CardContent>
        </Card>
      ) : null}

      {showSuccess ? (
        <BrandProfileCard
          brandName={brandRecord.name}
          brandUrl={brandRecord.brand_url}
          profile={profile as BrandProfileDisplay}
          scores={scores}
          lastAnalyzedAt={brandRecord.updated_at}
        />
      ) : null}
    </div>
  );
};

export default BrandPage;
