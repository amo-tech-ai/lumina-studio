import { Type } from "npm:@google/genai@2.8.0";

export const brandProfileResponseSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Brand display name" },
    tagline: { type: Type.STRING, description: "Short brand tagline" },
    category: {
      type: Type.STRING,
      description: "Fashion or retail category, e.g. DTC apparel",
    },
    visualIdentity: {
      type: Type.OBJECT,
      properties: {
        colors: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Hex or descriptive color names",
        },
        mood: { type: Type.STRING, description: "Visual mood, e.g. minimal luxe" },
      },
      required: ["colors", "mood"],
    },
    targetAudience: { type: Type.STRING },
    sourceUrl: { type: Type.STRING },
    contentPillars: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3-5 recurring content themes",
    },
    brandVoice: {
      type: Type.STRING,
      description: "Tone descriptors e.g. playful, minimal, editorial",
    },
    recommendedServices: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "iPix service slugs: fashion-photography, ecommerce, instagram, video, shopify, amazon, jewellery, location, clothing",
    },
    productionReadiness: {
      type: Type.NUMBER,
      description: "0-100 readiness for professional content shoot",
    },
    mission: { type: Type.STRING },
    vision: { type: Type.STRING },
    values: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    uvp: { type: Type.STRING, description: "Unique value proposition" },
    positioning: { type: Type.STRING },
    brandPersonality: { type: Type.STRING },
    confidenceScore: {
      type: Type.NUMBER,
      description: "0-100 confidence in extracted profile",
    },
    evidenceSources: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Page titles or URLs supporting key claims",
    },
    competitorSignals: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Named competitors or adjacent brands mentioned",
    },
    scores: {
      type: Type.OBJECT,
      properties: {
        visual: { type: Type.NUMBER, description: "Visual identity clarity 0-100" },
        audience: { type: Type.NUMBER, description: "Audience clarity 0-100" },
        consistency: { type: Type.NUMBER, description: "Cross-page consistency 0-100" },
        commerce_readiness: {
          type: Type.NUMBER,
          description: "E-commerce readiness 0-100",
        },
      },
      required: ["visual", "audience", "consistency", "commerce_readiness"],
    },
  },
  required: [
    "name",
    "tagline",
    "category",
    "visualIdentity",
    "targetAudience",
    "sourceUrl",
    "scores",
  ],
};

export type BrandProfilePayload = {
  name: string;
  tagline: string;
  category: string;
  visualIdentity: { colors: string[]; mood: string };
  targetAudience: string;
  sourceUrl: string;
  contentPillars?: string[];
  brandVoice?: string;
  recommendedServices?: string[];
  productionReadiness?: number;
  mission?: string;
  vision?: string;
  values?: string[];
  uvp?: string;
  positioning?: string;
  brandPersonality?: string;
  confidenceScore?: number;
  evidenceSources?: string[];
  competitorSignals?: string[];
  scores: {
    visual: number;
    audience: number;
    consistency: number;
    commerce_readiness: number;
  };
};

export function clampScore(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n * 100) / 100));
}

export function buildAiProfileFromPayload(
  profile: BrandProfilePayload,
  sourceUrl: string,
): Record<string, unknown> {
  return {
    name: profile.name.trim(),
    tagline: profile.tagline.trim(),
    category: profile.category.trim(),
    visualIdentity: {
      colors: profile.visualIdentity.colors.slice(0, 12),
      mood: profile.visualIdentity.mood.trim(),
    },
    targetAudience: profile.targetAudience.trim(),
    sourceUrl,
    analyzedAt: new Date().toISOString(),
    ...(profile.contentPillars?.length
      ? { contentPillars: profile.contentPillars.slice(0, 8) }
      : {}),
    ...(profile.brandVoice?.trim() ? { brandVoice: profile.brandVoice.trim() } : {}),
    ...(profile.recommendedServices?.length
      ? { recommendedServices: profile.recommendedServices.slice(0, 10) }
      : {}),
    ...(typeof profile.productionReadiness === "number"
      ? { productionReadiness: clampScore(profile.productionReadiness) }
      : {}),
    ...(profile.mission?.trim() ? { mission: profile.mission.trim() } : {}),
    ...(profile.vision?.trim() ? { vision: profile.vision.trim() } : {}),
    ...(profile.values?.length ? { values: profile.values.slice(0, 12) } : {}),
    ...(profile.uvp?.trim() ? { uvp: profile.uvp.trim() } : {}),
    ...(profile.positioning?.trim() ? { positioning: profile.positioning.trim() } : {}),
    ...(profile.brandPersonality?.trim()
      ? { brandPersonality: profile.brandPersonality.trim() }
      : {}),
    ...(typeof profile.confidenceScore === "number"
      ? { confidenceScore: clampScore(profile.confidenceScore) }
      : {}),
    ...(profile.evidenceSources?.length
      ? { evidenceSources: profile.evidenceSources.slice(0, 20) }
      : {}),
    ...(profile.competitorSignals?.length
      ? { competitorSignals: profile.competitorSignals.slice(0, 12) }
      : {}),
  };
}

export function validateBrandProfilePayload(
  profile: BrandProfilePayload,
): string | null {
  if (!profile.name?.trim()) return "Could not extract a brand name";
  if (
    !profile.tagline ||
    !profile.category ||
    !profile.targetAudience ||
    !profile.visualIdentity?.mood ||
    !Array.isArray(profile.visualIdentity?.colors)
  ) {
    return "Incomplete brand profile returned";
  }
  if (
    !profile.scores ||
    typeof profile.scores.visual !== "number" ||
    typeof profile.scores.audience !== "number" ||
    typeof profile.scores.consistency !== "number" ||
    typeof profile.scores.commerce_readiness !== "number"
  ) {
    return "Incomplete scores returned";
  }
  return null;
}
