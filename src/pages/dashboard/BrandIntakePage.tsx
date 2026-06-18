import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { BrandIntakeForm } from "@/components/brand/BrandIntakeForm";
import { BrandProfileResult } from "@/components/brand/BrandProfileResult";
import { Button } from "@/components/ui/button";
import type { BrandIntelligenceResponse } from "@/types/brand-intelligence";

export default function BrandIntakePage() {
  const [searchParams] = useSearchParams();
  const brandId = searchParams.get("brandId") ?? undefined;
  const initialUrl = searchParams.get("url") ?? "";

  const [result, setResult] = useState<BrandIntelligenceResponse | null>(null);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Operator workspace
        </p>
        <h1 className="mt-1 font-serif text-3xl tracking-tight">Brand intake</h1>
        <p className="mt-2 max-w-2xl font-sans text-muted-foreground">
          Paste your brand URL — Gemini analyzes the site and saves your profile and readiness
          scores to Supabase.
        </p>
      </header>

      {!result ? (
        <BrandIntakeForm
          brandId={brandId}
          initialUrl={initialUrl}
          onSuccess={setResult}
        />
      ) : (
        <>
          <BrandProfileResult response={result} />
          <div className="flex flex-wrap gap-3">
            <Button asChild className="font-sans">
              <Link to="/dashboard/brand">View brand hub</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="font-sans"
              onClick={() => setResult(null)}
            >
              Analyze another URL
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
