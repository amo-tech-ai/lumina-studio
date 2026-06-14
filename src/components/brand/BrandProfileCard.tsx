import { ExternalLink } from "lucide-react";

import { BrandScoreBars } from "@/components/brand/BrandScoreBars";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BrandScoreRow } from "@/types/brand-intelligence";

export type BrandProfileDisplay = {
  name?: string;
  tagline?: string;
  category?: string;
  targetAudience?: string;
  sourceUrl?: string;
  analyzedAt?: string;
  visualIdentity?: {
    colors?: string[];
    mood?: string;
  };
};

type BrandProfileCardProps = {
  brandName: string;
  brandUrl: string | null;
  profile: BrandProfileDisplay;
  scores: BrandScoreRow[];
  lastAnalyzedAt: string | null;
};

function formatAnalyzedAt(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function BrandProfileCard({
  brandName,
  brandUrl,
  profile,
  scores,
  lastAnalyzedAt,
}: BrandProfileCardProps) {
  const displayName = profile.name ?? brandName;
  const colors = profile.visualIdentity?.colors ?? [];
  const mood = profile.visualIdentity?.mood;
  const analyzedIso =
    (typeof profile.analyzedAt === "string" ? profile.analyzedAt : null) ?? lastAnalyzedAt;
  const link = profile.sourceUrl ?? brandUrl;

  return (
    <Card className="border-border bg-card">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="font-serif text-2xl">{displayName}</CardTitle>
          {profile.category ? (
            <Badge variant="secondary" className="font-sans">
              {profile.category}
            </Badge>
          ) : null}
        </div>
        {profile.tagline ? (
          <p className="font-sans text-sm text-muted-foreground">{profile.tagline}</p>
        ) : null}
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-sans text-xs text-primary hover:underline"
          >
            {link}
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        ) : null}
        <p className="font-sans text-xs text-muted-foreground">
          Last analyzed: {formatAnalyzedAt(analyzedIso)}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {profile.targetAudience ? (
          <div>
            <p className="mb-1 font-sans text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Target audience
            </p>
            <p className="font-sans text-sm">{profile.targetAudience}</p>
          </div>
        ) : null}

        {colors.length > 0 || mood ? (
          <div>
            <p className="mb-2 font-sans text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Visual identity
            </p>
            {mood ? <p className="mb-2 font-sans text-sm">{mood}</p> : null}
            {colors.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <Badge key={color} variant="outline" className="font-sans font-normal">
                    {color}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {scores.length > 0 ? (
          <div>
            <p className="mb-3 font-sans text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Brand DNA scores
            </p>
            <BrandScoreBars scores={scores} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
