import { Type } from "npm:@google/genai@2.8.0";

export const brandProfileResponseSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Brand display name" },
    tagline: { type: Type.STRING, description: "Short brand tagline" },
    overview: { type: Type.STRING, description: "A brief overview of the brand" },
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
        brand_clarity: { type: Type.NUMBER, description: "Mission/values/UVP clarity 0-100" },
        content_strength: { type: Type.NUMBER, description: "Content pillar depth 0-100" },
        social_presence: { type: Type.NUMBER, description: "Social channels + follower signal 0-100" },
        digital_experience: { type: Type.NUMBER, description: "Site UX/mobile/speed 0-100" },
        sustainability_signal: { type: Type.NUMBER, description: "Eco/ethical indicators 0-100" },
        photography_readiness: { type: Type.NUMBER, description: "Product imagery quality 0-100" },
        confidence: { type: Type.NUMBER, description: "Overall confidence in scores 0-100" },
        evidence: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Supporting evidence snippets for scores",
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
  overview?: string;
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
    brand_clarity?: number;
    content_strength?: number;
    social_presence?: number;
    digital_experience?: number;
    sustainability_signal?: number;
    photography_readiness?: number;
    confidence?: number;
    evidence?: string[];
  };
};

export function clampScore(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n * 100) / 100));
}

function trimmedString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function optionalTrim(value: unknown): string | undefined {
  return trimmedString(value) ?? undefined;
}

function optionalStringArray(value: unknown, max: number): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return items.length > 0 ? items.slice(0, max) : undefined;
}

export function buildAiProfileFromPayload(
  profile: BrandProfilePayload,
  sourceUrl: string,
): Record<string, unknown> {
  const name = trimmedString(profile.name)!;
  const tagline = trimmedString(profile.tagline)!;
  const category = trimmedString(profile.category)!;
  const mood = trimmedString(profile.visualIdentity?.mood)!;
  const colors = Array.isArray(profile.visualIdentity?.colors)
    ? profile.visualIdentity.colors
        .filter((c): c is string => typeof c === "string")
        .map((c) => c.trim())
        .filter(Boolean)
        .slice(0, 12)
    : [];

  return {
    name,
    tagline,
    category,
    visualIdentity: { colors, mood },
    targetAudience: trimmedString(profile.targetAudience)!,
    sourceUrl,
    analyzedAt: new Date().toISOString(),
    ...(optionalStringArray(profile.contentPillars, 8)
      ? { contentPillars: optionalStringArray(profile.contentPillars, 8) }
      : {}),
    ...(optionalTrim(profile.overview) ? { overview: optionalTrim(profile.overview) } : {}),
    ...(optionalTrim(profile.brandVoice)
      ? { brandVoice: optionalTrim(profile.brandVoice) }
      : {}),
    ...(optionalStringArray(profile.recommendedServices, 10)
      ? { recommendedServices: optionalStringArray(profile.recommendedServices, 10) }
      : {}),
    ...(typeof profile.productionReadiness === "number"
      ? { productionReadiness: clampScore(profile.productionReadiness) }
      : {}),
    ...(optionalTrim(profile.mission) ? { mission: optionalTrim(profile.mission) } : {}),
    ...(optionalTrim(profile.vision) ? { vision: optionalTrim(profile.vision) } : {}),
    ...(optionalStringArray(profile.values, 12)
      ? { values: optionalStringArray(profile.values, 12) }
      : {}),
    ...(optionalTrim(profile.uvp) ? { uvp: optionalTrim(profile.uvp) } : {}),
    ...(optionalTrim(profile.positioning)
      ? { positioning: optionalTrim(profile.positioning) }
      : {}),
    ...(optionalTrim(profile.brandPersonality)
      ? { brandPersonality: optionalTrim(profile.brandPersonality) }
      : {}),
    ...(typeof profile.confidenceScore === "number"
      ? { confidenceScore: clampScore(profile.confidenceScore) }
      : {}),
    ...(optionalStringArray(profile.evidenceSources, 20)
      ? { evidenceSources: optionalStringArray(profile.evidenceSources, 20) }
      : {}),
    ...(optionalStringArray(profile.competitorSignals, 12)
      ? { competitorSignals: optionalStringArray(profile.competitorSignals, 12) }
      : {}),
  };
}

export function validateBrandProfilePayload(
  profile: BrandProfilePayload,
): string | null {
  if (!trimmedString(profile.name)) return "Could not extract a brand name";
  if (
    !trimmedString(profile.tagline) ||
    !trimmedString(profile.category) ||
    !trimmedString(profile.targetAudience) ||
    !trimmedString(profile.visualIdentity?.mood) ||
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
