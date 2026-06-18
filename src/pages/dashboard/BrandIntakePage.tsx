import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { BrandIntakeForm } from "@/components/brand/BrandIntakeForm";
import { BrandProfileResult } from "@/components/brand/BrandProfileResult";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  commitBrandDraft,
} from "@/services/brandIntelligenceService";
import type {
  BrandIntelligenceAnalyzeResponse,
  BrandIntelligenceCommitApproveResponse,
} from "@/types/brand-intelligence";

export default function BrandIntakePage() {
  const [searchParams] = useSearchParams();
  const brandId = searchParams.get("brandId") ?? undefined;
  const initialUrl = searchParams.get("url") ?? "";

  const [draft, setDraft] = useState<BrandIntelligenceAnalyzeResponse | null>(null);
  const [committed, setCommitted] = useState<BrandIntelligenceCommitApproveResponse | null>(
    null,
  );
  const [committing, setCommitting] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCommit = async (decision: "approve" | "reject") => {
    if (!draft) return;
    setError(null);
    setCommitting(decision);
    try {
      const result = await commitBrandDraft({ draftId: draft.draftId, decision });
      if (result.decision === "approve") {
        setCommitted(result);
        setDraft(null);
      } else {
        setDraft(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Commit failed");
    } finally {
      setCommitting(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Operator workspace
        </p>
        <h1 className="mt-1 font-serif text-3xl tracking-tight">Brand intake</h1>
        <p className="mt-2 max-w-2xl font-sans text-muted-foreground">
          Paste your brand URL — Gemini analyzes the site and creates a draft for your review.
          Approve to save the profile and scores, or reject to discard.
        </p>
      </header>

      {committed ? (
        <>
          <Alert>
            <AlertDescription className="font-sans">
              Brand profile approved and saved as <strong>{committed.brand.name}</strong>.
            </AlertDescription>
          </Alert>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="font-sans">
              <Link to="/dashboard/brand">View brand hub</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="font-sans"
              onClick={() => {
                setCommitted(null);
                setDraft(null);
              }}
            >
              Analyze another URL
            </Button>
          </div>
        </>
      ) : !draft ? (
        <BrandIntakeForm
          brandId={brandId}
          initialUrl={initialUrl}
          onSuccess={setDraft}
        />
      ) : (
        <>
          <BrandProfileResult response={draft} />

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              className="font-sans"
              disabled={committing !== null}
              onClick={() => handleCommit("approve")}
            >
              {committing === "approve" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Approving…
                </>
              ) : (
                "Approve & save"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="font-sans"
              disabled={committing !== null}
              onClick={() => handleCommit("reject")}
            >
              {committing === "reject" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Rejecting…
                </>
              ) : (
                "Reject draft"
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="font-sans"
              disabled={committing !== null}
              onClick={() => setDraft(null)}
            >
              Analyze another URL
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
