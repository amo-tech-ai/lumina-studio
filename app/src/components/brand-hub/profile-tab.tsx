import type { AiProfile } from "@/lib/brand-hub";
import {
  formatBrandHubDateTime,
  formatInstagramHandle,
  hasMeaningfulProfile,
  isNonEmptyStringArray,
} from "@/lib/brand-hub";
import { ChipList, ProfileField } from "@/components/brand-hub/profile-field";

type Props = {
  profile: AiProfile;
};

export const ProfileTab = ({ profile }: Props) => {
  if (!hasMeaningfulProfile(profile)) {
    return (
      <p className="font-sans text-sm text-[#94A3B8]">
        Brand profile not analyzed yet. Run Re-analyze to populate fields.
      </p>
    );
  }

  const analyzedLabel = profile.analyzedAt
    ? formatBrandHubDateTime(profile.analyzedAt)
    : null;

  return (
    <dl className="space-y-4">
      {profile.tagline && <ProfileField label="Tagline" value={profile.tagline} />}
      {profile.category && <ProfileField label="Category" value={profile.category} />}
      {profile.industry && <ProfileField label="Industry" value={profile.industry} />}
      {profile.goal && <ProfileField label="Goal" value={profile.goal} />}
      {profile.mission && <ProfileField label="Mission" value={profile.mission} />}
      {profile.vision && <ProfileField label="Vision" value={profile.vision} />}
      {profile.uvp && <ProfileField label="UVP" value={profile.uvp} />}
      {profile.positioning && (
        <ProfileField label="Positioning" value={profile.positioning} />
      )}
      {profile.brandPersonality && (
        <ProfileField label="Brand Personality" value={profile.brandPersonality} />
      )}
      {profile.targetAudience && (
        <ProfileField label="Target Audience" value={profile.targetAudience} />
      )}
      {profile.brandVoice && <ProfileField label="Brand Voice" value={profile.brandVoice} />}
      {profile.instagram_handle?.trim() && (
        <ProfileField
          label="Instagram"
          value={formatInstagramHandle(profile.instagram_handle)}
        />
      )}
      {profile.sourceUrl && <ProfileField label="Source URL" value={profile.sourceUrl} />}
      {typeof profile.productionReadiness === "number" && (
        <ProfileField
          label="Production Readiness"
          value={String(profile.productionReadiness)}
        />
      )}
      {typeof profile.confidenceScore === "number" && (
        <ProfileField label="Confidence" value={`${profile.confidenceScore}%`} />
      )}
      {profile.visualIdentity?.mood && (
        <ProfileField label="Visual Mood" value={profile.visualIdentity.mood} />
      )}
      {profile.visualIdentity?.typography && (
        <ProfileField label="Typography" value={profile.visualIdentity.typography} />
      )}
      {isNonEmptyStringArray(profile.visualIdentity?.colors) && (
        <ChipList label="Colors" items={profile.visualIdentity.colors} />
      )}
      {isNonEmptyStringArray(profile.values) && (
        <ChipList
          label="Values"
          items={profile.values}
          className="bg-[#FEF3E8] text-[#E87C4D]"
        />
      )}
      {isNonEmptyStringArray(profile.contentPillars) && (
        <ChipList
          label="Content Pillars"
          items={profile.contentPillars}
          className="bg-[#FEF3E8] text-[#E87C4D]"
        />
      )}
      {isNonEmptyStringArray(profile.recommendedServices) && (
        <ChipList
          label="Recommended Services"
          items={profile.recommendedServices}
          className="bg-[#F0FDF4] text-[#059669]"
        />
      )}
      {isNonEmptyStringArray(profile.evidenceSources) && (
        <ChipList label="Evidence Sources" items={profile.evidenceSources} />
      )}
      {isNonEmptyStringArray(profile.competitorSignals) && (
        <ChipList label="Competitor Signals" items={profile.competitorSignals} />
      )}
      {analyzedLabel && (
        <ProfileField label="Last analyzed" value={analyzedLabel} />
      )}
    </dl>
  );
};
