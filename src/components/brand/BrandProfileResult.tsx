import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandScoreGrid } from "@/components/brand/BrandScoreGrid";
import type { BrandIntelligenceResponse } from "@/types/brand-intelligence";

type BrandProfileResultProps = {
  response: BrandIntelligenceResponse;
};

export function BrandProfileResult({ response }: BrandProfileResultProps) {
  const { profile, scores, durationMs } = response;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-2xl">{profile.name}</CardTitle>
          {profile.tagline ? (
            <CardDescription className="font-sans text-base">{profile.tagline}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-6 font-sans text-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Category
              </p>
              <p className="mt-1">{profile.category || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Source URL
              </p>
              <a
                href={profile.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block truncate text-primary underline-offset-4 hover:underline"
              >
                {profile.sourceUrl}
              </a>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Target audience
            </p>
            <p className="mt-1 text-muted-foreground">{profile.targetAudience || "—"}</p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Visual identity
            </p>
            <p className="text-muted-foreground mb-3">{profile.visualIdentity?.mood || "—"}</p>
            <div className="flex flex-wrap gap-2">
              {(profile.visualIdentity?.colors ?? []).map((color) => (
                <Badge key={color} variant="secondary">
                  {color}
                </Badge>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Saved to Supabase · analyzed in {(durationMs / 1000).toFixed(1)}s
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl">Brand readiness</CardTitle>
          <CardDescription className="font-sans">
            Scores from Gemini URL analysis — used for DNA and commerce workflows.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BrandScoreGrid scores={scores} />
        </CardContent>
      </Card>
    </div>
  );
}
