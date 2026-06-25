import { GoogleGenAI, Type } from "npm:@google/genai@2.8.0";
import type { GenerateContentResponse } from "npm:@google/genai@2.8.0";

import { insertAgentLog } from "../_shared/agent-log.ts";
import { isAuthFailure, resolveAuth } from "../_shared/auth.ts";
import { handleCors } from "../_shared/cors.ts";
import { getOptionalSecret } from "../_shared/env.ts";
import { createUserClient } from "../_shared/supabase-client.ts";
import {
  errorResponse,
  jsonResponse,
  safeErrorMessage,
} from "../_shared/response.ts";

const MODEL = "gemini-2.5-flash";

const brandProfileSchema = {
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
      description: "3-5 recurring content themes e.g. sustainability, craftsmanship",
    },
    brandVoice: {
      type: Type.STRING,
      description: "Brand tone descriptors e.g. playful, minimal, editorial, bold",
    },
    recommendedServices: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "iPix service slugs relevant to this brand: fashion-photography, ecommerce, instagram, video, shopify, amazon, jewellery, location, clothing",
    },
    productionReadiness: {
      type: Type.NUMBER,
      description: "0-100 overall readiness for a professional content shoot",
    },
    scores: {
      type: Type.OBJECT,
      properties: {
        visual: {
          type: Type.NUMBER,
          description: "Visual identity clarity 0-100",
        },
        audience: {
          type: Type.NUMBER,
          description: "Audience clarity 0-100",
        },
        consistency: {
          type: Type.NUMBER,
          description: "Cross-page consistency 0-100",
        },
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

type BrandProfilePayload = {
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
  scores: {
    visual: number;
    audience: number;
    consistency: number;
    commerce_readiness: number;
  };
};

// Private/internal IP ranges — block to prevent SSRF
const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./, // AWS/GCP metadata
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
];

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    return !PRIVATE_HOST_PATTERNS.some((p) => p.test(parsed.hostname));
  } catch {
    return false;
  }
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Gemini timeout after ${ms}ms`)), ms)
    ),
  ]);
}

function buildUrlList(baseUrl: string): string[] {
  const origin = new URL(baseUrl).origin;
  return [baseUrl, `${origin}/about`, `${origin}/collections`, `${origin}/lookbook`].slice(0, 4);
}

function clampScore(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n * 100) / 100));
}

console.info("brand-intelligence function started");

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const started = performance.now();

  try {
    if (req.method !== "POST") {
      return errorResponse("method_not_allowed", "Use POST", 405);
    }

    const auth = await resolveAuth(req, { required: true });
    if (isAuthFailure(auth)) return auth.response;

    const apiKey = getOptionalSecret("GEMINI_API_KEY");
    if (!apiKey) {
      return errorResponse(
        "config_error",
        "Brand intelligence is not configured",
        503,
      );
    }

    const contentLength = parseInt(req.headers.get("content-length") ?? "0", 10);
    if (contentLength > 8192) {
      return errorResponse("payload_too_large", "Payload too large", 413);
    }

    let body: { url?: string; brandId?: string };
    try {
      body = await req.json();
    } catch {
      return errorResponse("invalid_json", "Request body must be JSON", 422);
    }

    const url = typeof body.url === "string" ? body.url.trim() : "";
    if (!url || !isValidHttpUrl(url)) {
      return errorResponse(
        "validation_error",
        "A valid http(s) url is required",
        422,
      );
    }

    const brandIdInput =
      typeof body.brandId === "string" && body.brandId.length > 0
        ? body.brandId
        : null;

    const ai = new GoogleGenAI({ apiKey });

    const urlList = buildUrlList(url);
    const prompt = `
Analyze this fashion or DTC brand from these pages and return structured brand intelligence for a creative production platform.

Pages to analyze:
${urlList.map((u) => `- ${u}`).join("\n")}

Extract:
- Brand name and tagline
- Product category
- Visual identity (colors and mood)
- Target audience summary
- Content pillars (3-5 recurring themes)
- Brand voice (tone descriptors)
- Recommended iPix services (from: fashion-photography, ecommerce, instagram, video, shopify, amazon, jewellery, location, clothing)
- Production readiness score (0-100)
- Readiness scores (0-100) for visual clarity, audience clarity, brand consistency, and commerce readiness

Use URL content AND web search for press coverage, social presence, and competitor signals.
Set sourceUrl to ${JSON.stringify(url)}.
`.trim();

    const geminiStarted = performance.now();

    // urlContext cannot be combined with responseMimeType application/json (API 400).
    // Combined with googleSearch for press/social/competitor signals.
    const contextResponse: GenerateContentResponse = await withTimeout(
      ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          tools: [{ urlContext: {} }, { googleSearch: {} }],
          temperature: 0.2,
        },
      }),
      30_000,
    );

    const contextText =
      contextResponse.text?.trim() ||
      "No textual analysis returned from URL context.";

    const structurePrompt = `
Based on this brand analysis, return ONLY valid JSON matching the required schema.

Analysis:
${contextText}

Required JSON shape:
{
  "name": string,
  "tagline": string,
  "category": string,
  "visualIdentity": { "colors": string[], "mood": string },
  "targetAudience": string,
  "sourceUrl": ${JSON.stringify(url)},
  "contentPillars": string[] (3-5 themes),
  "brandVoice": string (tone descriptors),
  "recommendedServices": string[] (iPix service slugs),
  "productionReadiness": number 0-100,
  "scores": {
    "visual": number 0-100,
    "audience": number 0-100,
    "consistency": number 0-100,
    "commerce_readiness": number 0-100
  }
}
`.trim();

    const response: GenerateContentResponse = await withTimeout(
      ai.models.generateContent({
        model: MODEL,
        contents: structurePrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: brandProfileSchema,
          thinkingConfig: { thinkingBudget: 4096 },
          temperature: 0.1,
        },
      }),
      20_000,
    );

    const geminiMs = Math.round(performance.now() - geminiStarted);
    const responseText = response.text ?? "";
    if (!responseText.trim()) {
      throw new Error("Empty response from Gemini");
    }

    let profile: BrandProfilePayload;
    try {
      profile = JSON.parse(responseText) as BrandProfilePayload;
    } catch {
      throw new Error("Model returned invalid JSON");
    }

    if (!profile.name?.trim()) {
      return errorResponse(
        "validation_error",
        "Could not extract a brand name from URL",
        422,
      );
    }
    if (!profile.tagline || !profile.category || !profile.targetAudience ||
        !profile.visualIdentity?.mood || !Array.isArray(profile.visualIdentity?.colors)) {
      return errorResponse("validation_error", "Incomplete brand profile returned", 422);
    }
    if (!profile.scores || typeof profile.scores.visual !== "number" ||
        typeof profile.scores.audience !== "number" ||
        typeof profile.scores.consistency !== "number" ||
        typeof profile.scores.commerce_readiness !== "number") {
      return errorResponse("validation_error", "Incomplete scores returned", 422);
    }

    const client = createUserClient(auth.accessToken);
    const aiProfile = {
      name: profile.name.trim(),
      tagline: profile.tagline.trim(),
      category: profile.category.trim(),
      visualIdentity: {
        colors: profile.visualIdentity.colors.slice(0, 12),
        mood: profile.visualIdentity.mood.trim(),
      },
      targetAudience: profile.targetAudience.trim(),
      sourceUrl: url, // always use submitted URL, never trust model-provided value
      analyzedAt: new Date().toISOString(),
      // v9: enriched fields (optional — gracefully absent if model omits)
      ...(profile.contentPillars?.length ? { contentPillars: profile.contentPillars } : {}),
      ...(profile.brandVoice?.trim() ? { brandVoice: profile.brandVoice.trim() } : {}),
      ...(profile.recommendedServices?.length ? { recommendedServices: profile.recommendedServices } : {}),
      ...(typeof profile.productionReadiness === "number"
        ? { productionReadiness: clampScore(profile.productionReadiness) }
        : {}),
    };

    let brandId = brandIdInput;
    let brandRow: { id: string; name: string } | null = null;

    if (brandId) {
      const { data: existing, error: fetchErr } = await client
        .from("brands")
        .select("id, name, ai_profile")
        .eq("id", brandId)
        .eq("user_id", auth.user.id)
        .maybeSingle();

      if (fetchErr || !existing) {
        return errorResponse("not_found", "Brand not found", 404);
      }

      const priorProfile =
        existing.ai_profile && typeof existing.ai_profile === "object" && !Array.isArray(existing.ai_profile)
          ? (existing.ai_profile as Record<string, unknown>)
          : {};

      const mergedProfile = {
        ...priorProfile,
        ...aiProfile,
        _lifecycle: "scores_complete",
      };

      const { data: updated, error: updateErr } = await client
        .from("brands")
        .update({
          name: aiProfile.name,
          brand_url: url,
          ai_profile: mergedProfile,
        })
        .eq("id", brandId)
        .eq("user_id", auth.user.id)
        .select("id, name")
        .single();

      if (updateErr || !updated) {
        throw new Error(updateErr?.message ?? "Failed to update brand");
      }
      brandRow = updated;
    } else {
      const { data: inserted, error: insertErr } = await client
        .from("brands")
        .insert({
          user_id: auth.user.id,
          name: profile.name,
          brand_url: url,
          ai_profile: aiProfile,
        })
        .select("id, name")
        .single();

      if (insertErr || !inserted) {
        throw new Error(insertErr?.message ?? "Failed to create brand");
      }
      brandRow = inserted;
      brandId = inserted.id;
    }

    const scoreRows = [
      { score_type: "visual", score: clampScore(profile.scores.visual) },
      { score_type: "audience", score: clampScore(profile.scores.audience) },
      { score_type: "consistency", score: clampScore(profile.scores.consistency) },
      { score_type: "commerce_readiness", score: clampScore(profile.scores.commerce_readiness) },
    ].map((row) => ({
      brand_id: brandId,
      score_type: row.score_type,
      score: row.score,
      details: { source: "brand-intelligence", url },
    }));

    // Upsert: idempotent re-analysis, no temporary data loss on insert failure
    const { data: scores, error: scoresErr } = await client
      .from("brand_scores")
      .upsert(scoreRows, { onConflict: "brand_id,score_type" })
      .select("id, score_type, score");

    if (scoresErr) {
      throw new Error(scoresErr.message);
    }

    const usage = response.usageMetadata;
    const contextUsage = contextResponse.usageMetadata;
    const durationMs = Math.round(performance.now() - started);

    const { id: logId } = await insertAgentLog(client, {
      agentName: "brand-intelligence",
      userId: auth.user.id,
      brandId,
      input: { url, brandId: brandIdInput },
      output: {
        brandId,
        scoreCount: scores?.length ?? 0,
        urlRetrieval:
          contextResponse.candidates?.[0]?.urlContextMetadata ?? null,
      },
      model: MODEL,
      tokensIn:
        (usage?.promptTokenCount ?? 0) +
        (contextUsage?.promptTokenCount ?? 0) || null,
      tokensOut:
        (usage?.candidatesTokenCount ?? 0) +
        (contextUsage?.candidatesTokenCount ?? 0) || null,
      durationMs,
    });

    return jsonResponse({
      brandId,
      brand: brandRow,
      profile: aiProfile,
      scores: scores ?? [],
      logId,
      durationMs,
      geminiMs,
    });
  } catch (err) {
    console.error("brand-intelligence error:", err);
    return errorResponse("internal_error", safeErrorMessage(err), 500);
  }
});
