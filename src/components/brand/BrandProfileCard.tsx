import type { AiProfile } from "@/services/brandService";

const SERVICE_LABELS: Record<string, string> = {
  "fashion-photography": "Fashion Photography",
  ecommerce: "Ecommerce Shoot",
  instagram: "Instagram Content",
  video: "Video Production",
  shopify: "Shopify Assets",
  amazon: "Amazon Listing",
  jewellery: "Jewellery",
  location: "Location Shoot",
  clothing: "Clothing",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type Props = { profile: AiProfile };

export function BrandProfileCard({ profile }: Props) {
  const colors = profile.visualIdentity.colors.slice(0, 6);

  return (
    <div className="rounded-lg border bg-card p-6 space-y-5">
      {/* Name + tagline */}
      <div>
        <h2 className="font-serif text-2xl">{profile.name}</h2>
        {profile.tagline && (
          <p className="text-muted-foreground italic mt-1">{profile.tagline}</p>
        )}
        {profile.category && (
          <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full border font-outfit">
            {profile.category}
          </span>
        )}
      </div>

      <div className="border-t" />

      {/* Visual identity */}
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Visual Identity
        </p>
        <div className="flex gap-2 flex-wrap">
          {colors.map((color, i) => (
            <span
              key={i}
              title={color}
              className="inline-block w-6 h-6 rounded-full border border-border"
              style={{ backgroundColor: color.startsWith("#") ? color : undefined }}
            />
          ))}
        </div>
        {profile.visualIdentity.mood && (
          <p className="text-sm text-muted-foreground">{profile.visualIdentity.mood}</p>
        )}
      </div>

      {/* Target audience */}
      {profile.targetAudience && (
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Target Audience
          </p>
          <p className="text-sm">{profile.targetAudience}</p>
        </div>
      )}

      {/* Content pillars (v9+) */}
      {profile.contentPillars?.length ? (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Content Pillars
          </p>
          <div className="flex flex-wrap gap-1.5">
            {profile.contentPillars.map((p) => (
              <span
                key={p}
                className="px-2 py-0.5 text-xs rounded-full border font-outfit"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {/* Brand voice (v9+) */}
      {profile.brandVoice && (
        <p className="text-sm italic text-muted-foreground">{profile.brandVoice}</p>
      )}

      {/* Recommended services (v9+) */}
      {profile.recommendedServices?.length ? (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Recommended for your brand
          </p>
          <ul className="space-y-1">
            {profile.recommendedServices.map((slug) => (
              <li key={slug} className="flex items-center gap-2 text-sm">
                <span className="text-[#059669]">✓</span>
                {SERVICE_LABELS[slug] ?? slug}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="border-t" />

      {/* Footer */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Analyzed {formatDate(profile.analyzedAt)}</span>
        {profile.sourceUrl && (
          <a
            href={profile.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            {new URL(profile.sourceUrl).hostname}
          </a>
        )}
      </div>
    </div>
  );
}
