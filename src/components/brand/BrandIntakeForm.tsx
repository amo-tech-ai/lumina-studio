import { FormEvent, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isValidBrandUrl } from "@/lib/brand-url";
import { analyzeBrandFromUrl } from "@/services/brandIntelligenceService";
import type { BrandIntelligenceResponse } from "@/types/brand-intelligence";

type BrandIntakeFormProps = {
  brandId?: string;
  initialUrl?: string;
  onSuccess: (response: BrandIntelligenceResponse) => void;
};

export function BrandIntakeForm({ brandId, initialUrl = "", onSuccess }: BrandIntakeFormProps) {
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const trimmed = url.trim();
    if (!isValidBrandUrl(trimmed)) {
      setError("Enter a valid http(s) brand website URL.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await analyzeBrandFromUrl({
        url: trimmed,
        ...(brandId ? { brandId } : {}),
      });
      onSuccess(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Brand analysis failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-xl flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" aria-hidden />
          Analyze brand from URL
        </CardTitle>
        <CardDescription className="font-sans">
          We extract visual identity, audience, and readiness scores from your site. Analysis
          typically takes 15–30 seconds.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="brand-url" className="font-sans">
              Brand website URL
            </Label>
            <Input
              id="brand-url"
              type="url"
              inputMode="url"
              autoComplete="url"
              placeholder="https://yourbrand.com"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              disabled={submitting}
              required
            />
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <Button type="submit" disabled={submitting} className="font-sans">
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Analyzing…
              </>
            ) : (
              "Analyze my brand"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
