import type { GenerateContentResponse } from "npm:@google/genai@2.8.0";

import { insertAgentLog } from "../_shared/agent-log.ts";
import { isAuthFailure, resolveAuth } from "../_shared/auth.ts";
import {
  type CrawlRawData,
  formatCrawlForPrompt,
  isCrawlThin,
} from "../_shared/crawl-context.ts";
import { handleCors } from "../_shared/cors.ts";
import { getOptionalSecret } from "../_shared/env.ts";
import {
  generateContextPass,
  generateStructuredContent,
  resolveGeminiModel,
} from "../_shared/gemini.ts";
import {
  brandProfileResponseSchema,
  buildAiProfileFromPayload,
  clampScore,
  type BrandProfilePayload,
  validateBrandProfilePayload,
} from "../_shared/schemas/brand-profile.ts";
import { createUserClient } from "../_shared/supabase-client.ts";
import {
  errorResponse,
  jsonResponse,
  safeErrorMessage,
} from "../_shared/response.ts";

// Private/internal IP ranges — block to prevent SSRF
const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
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

function buildUrlList(baseUrl: string): string[] {
  const origin = new URL(baseUrl).origin;
  return [baseUrl, `${origin}/about`, `${origin}/collections`, `${origin}/lookbook`].slice(0, 4);
}

function buildCrawlPrompt(params: {
  url: string;
  brandName?: string;
  shellProfile: Record<string, unknown>;
  crawlText: string;
  pageCount: number;
}): string {
  const shell = JSON.stringify(params.shellProfile, null, 2);
  return `
You are a fashion brand intelligence analyst for iPix, a creative production platform.

Analyze the brand using the Firecrawl website crawl below (${params.pageCount} pages). Extract a complete brand profile and four readiness scores (0-100).

Brand URL: ${params.url}
${params.brandName ? `Brand name hint: ${params.brandName}` : ""}

Onboarding metadata (preserve industry, goal, instagram_handle when merging):
${shell}

Example 1 — DTC apparel:
Input: Clean beauty site with minimal palette, sustainability copy, shop grid.
Output: tagline "Skincare for real life", category "DTC beauty", contentPillars ["clean ingredients","inclusivity","education"], brandVoice "friendly, minimal, science-forward", scores visual 78 audience 82 consistency 75 commerce_readiness 88.

Example 2 — Luxury fashion:
Input: Editorial lookbook, heritage story, high-price catalog.
Output: tagline "Modern heritage tailoring", category "Luxury apparel", brandPersonality "refined, confident", scores visual 90 audience 70 consistency 85 commerce_readiness 72.

Crawl content:
${params.crawlText}

Return ONLY valid JSON matching the schema. Set sourceUrl to ${JSON.stringify(params.url)}.
Use google search grounding for competitor and press signals when crawl is thin on those topics.
`.trim();
}

function buildUrlFallbackPrompt(url: string, contextText: string): string {
  return `
Based on this brand analysis from live URLs, return ONLY valid JSON matching the required schema.

Pages analyzed:
${buildUrlList(url).map((u) => `- ${u}`).join("\n")}

Analysis:
${contextText}

Set sourceUrl to ${JSON.stringify(url)}.
`.trim();
}

async function loadCrawlRow(
  client: ReturnType<typeof createUserClient>,
  brandId: string,
  crawlResultId: string | null,
) {
  if (crawlResultId) {
    const { data, error } = await client
      .from("brand_crawls")
      .select("id, brand_id, raw_data, pages_crawled, job_status")
      .eq("id", crawlResultId)
      .maybeSingle();
    if (!error && data && data.brand_id === brandId) return data;
  }

  const { data, error } = await client
    .from("brand_crawls")
    .select("id, brand_id, raw_data, pages_crawled, job_status")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

async function markIntakeStatus(
  client: ReturnType<typeof createUserClient>,
  brandId: string,
  status: "analysis_running" | "scores_complete" | "failed",
) {
  await client
    .from("brands")
    .update({ intake_status: status })
    .eq("id", brandId);
}

console.info("brand-intelligence function started");

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const started = performance.now();
  let failureBrandId: string | null = null;
  let failureClient: ReturnType<typeof createUserClient> | null = null;
  let draftPersisted = false;

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
    if (contentLength > 16384) {
      return errorResponse("payload_too_large", "Payload too large", 413);
    }

    let body: {
      url?: string;
      brandId?: string;
      brand_name?: string;
      crawlResultId?: string;
      draft_mode?: boolean;
    };
    try {
      body = await req.json();
    } catch {
      return errorResponse("invalid_json", "Request body must be JSON", 422);
    }

    const brandId =
      typeof body.brandId === "string" && body.brandId.length > 0
        ? body.brandId
        : null;

    if (!brandId) {
      return errorResponse(
        "validation_error",
        "brandId is required",
        422,
      );
    }

    failureBrandId = brandId;

    const url = typeof body.url === "string" ? body.url.trim() : "";
    if (!url || !isValidHttpUrl(url)) {
      return errorResponse(
        "validation_error",
        "A valid http(s) url is required",
        422,
      );
    }

    const crawlResultId =
      typeof body.crawlResultId === "string" && body.crawlResultId.length > 0
        ? body.crawlResultId
        : null;

    const brandName =
      typeof body.brand_name === "string" ? body.brand_name.trim() : undefined;
    const draftMode = body.draft_mode === true;

    const client = createUserClient(auth.accessToken);
    failureClient = client;

    const { data: existing, error: fetchErr } = await client
      .from("brands")
      .select("id, name, ai_profile")
      .eq("id", brandId)
      .maybeSingle();

    if (fetchErr || !existing) {
      return errorResponse("not_found", "Brand not found", 404);
    }

    const priorProfile =
      existing.ai_profile &&
        typeof existing.ai_profile === "object" &&
        !Array.isArray(existing.ai_profile)
        ? (existing.ai_profile as Record<string, unknown>)
        : {};

    await markIntakeStatus(client, brandId, "analysis_running");

    const crawlRow = await loadCrawlRow(client, brandId, crawlResultId);
    const rawData = (crawlRow?.raw_data ?? null) as CrawlRawData | null;
    const crawlText = formatCrawlForPrompt(rawData);
    const useCrawl = !isCrawlThin(rawData);
    const model = resolveGeminiModel();

    const geminiStarted = performance.now();
    let structuredResponse: GenerateContentResponse;
    let contextResponse: GenerateContentResponse | null = null;
    let responseText: string;

    if (useCrawl && crawlText) {
      const prompt = buildCrawlPrompt({
        url,
        brandName,
        shellProfile: priorProfile,
        crawlText,
        pageCount: rawData?.pages?.length ?? crawlRow?.pages_crawled ?? 0,
      });

      const result = await generateStructuredContent({
        apiKey,
        model,
        contents: prompt,
        responseSchema: brandProfileResponseSchema,
        tools: [{ googleSearch: {} }],
        thinkingLevel: "low",
        temperature: 0.1,
        timeoutMs: 45_000,
      });
      structuredResponse = result.response;
      responseText = result.text;
    } else {
      const urlList = buildUrlList(url);
      const contextPrompt = `
Analyze this fashion or DTC brand from these pages for a creative production platform.

Pages:
${urlList.map((u) => `- ${u}`).join("\n")}

Extract brand name, tagline, category, visual identity, audience, content themes, voice, and commerce signals.
Use URL content AND web search for press, social, and competitor signals.
`.trim();

      const contextPass = await generateContextPass({
        apiKey,
        model,
        contents: contextPrompt,
        timeoutMs: 55_000,
      });
      contextResponse = contextPass.response;

      const structurePrompt = buildUrlFallbackPrompt(url, contextPass.text);
      const result = await generateStructuredContent({
        apiKey,
        model,
        contents: structurePrompt,
        responseSchema: brandProfileResponseSchema,
        thinkingLevel: "low",
        temperature: 0.1,
        timeoutMs: 50_000,
      });
      structuredResponse = result.response;
      responseText = result.text;
    }

    const geminiMs = Math.round(performance.now() - geminiStarted);

    let profile: BrandProfilePayload;
    try {
      profile = JSON.parse(responseText) as BrandProfilePayload;
    } catch {
      throw new Error("Model returned invalid JSON");
    }

    const validationError = validateBrandProfilePayload(profile);
    if (validationError) {
      await markIntakeStatus(client, brandId, "failed");
      return errorResponse("validation_error", validationError, 422);
    }

    const aiProfile = buildAiProfileFromPayload(profile, url);

    // Build score rows unconditionally — in draft mode they're embedded in the draft JSONB;
    // in live mode they're upserted directly to brand_scores.
    const v2ScoreEntries: { score_type: string; score: number }[] = [
      { score_type: "visual", score: clampScore(profile.scores.visual) },
      { score_type: "audience", score: clampScore(profile.scores.audience) },
      { score_type: "consistency", score: clampScore(profile.scores.consistency) },
      { score_type: "commerce_readiness", score: clampScore(profile.scores.commerce_readiness) },
    ];

    const extendedDimensions = [
      "brand_clarity", "content_strength", "social_presence",
      "digital_experience", "sustainability_signal", "photography_readiness",
    ] as const;
    for (const dim of extendedDimensions) {
      const val = (profile.scores as Record<string, unknown>)[dim];
      if (typeof val === "number") {
        v2ScoreEntries.push({ score_type: dim, score: clampScore(val) });
      }
    }

    const sharedEvidence = Array.isArray(profile.scores.evidence)
      ? profile.scores.evidence.filter((e): e is string => typeof e === "string").slice(0, 10)
      : [];
    const overallConfidence = typeof profile.scores.confidence === "number"
      ? clampScore(profile.scores.confidence)
      : null;

    const scoreRows = v2ScoreEntries.map((row) => ({
      score_type: row.score_type,
      score: row.score,
      score_version: 1,
      source: "edge_fn" as const,
      details: {
        source: "brand-intelligence",
        url,
        crawlResultId: crawlRow?.id ?? null,
        crawlPages: rawData?.pages?.length ?? 0,
        ...(overallConfidence !== null && { confidence: overallConfidence }),
        ...(sharedEvidence.length > 0 && { evidence: sharedEvidence }),
      },
    }));

    const mergedProfile = {
      ...priorProfile,
      ...aiProfile,
      _lifecycle: "scores_complete",
      // In draft mode, embed scores so applyDraft can upsert them when the draft is approved
      ...(draftMode && { _draft_scores: scoreRows }),
    };

    const brandUpdate = draftMode
      ? { ai_profile_draft: mergedProfile, intake_status: "draft_ready" as const }
      : { name: aiProfile.name as string, brand_url: url, ai_profile: mergedProfile, intake_status: "scores_complete" as const };

    const { data: updated, error: updateErr } = await client
      .from("brands")
      .update(brandUpdate)
      .eq("id", brandId)
      .select("id, name")
      .single();

    if (updateErr || !updated) {
      throw new Error(updateErr?.message ?? "Failed to update brand");
    }

    // Track that draft was persisted so the catch block doesn't overwrite draft_ready → failed
    if (draftMode) draftPersisted = true;

    let scores: { id: string; score_type: string; score: number }[] | null = null;

    if (!draftMode) {
      const liveScoreRows = scoreRows.map((r) => ({ ...r, brand_id: brandId }));
      const { data: scoresData, error: scoresErr } = await client
        .from("brand_scores")
        .upsert(liveScoreRows, { onConflict: "brand_id,score_type" })
        .select("id, score_type, score");

      if (scoresErr) throw new Error(scoresErr.message);
      scores = scoresData;
    }

    const usage = structuredResponse.usageMetadata;
    const contextUsage = contextResponse?.usageMetadata;
    const durationMs = Math.round(performance.now() - started);

    let logId: string | undefined;
    try {
      const result = await insertAgentLog(client, {
        agentName: "brand-intelligence",
        userId: auth.user.id,
        brandId,
        input: {
          url,
          brandId,
          crawlResultId: crawlRow?.id ?? crawlResultId,
          usedCrawl: useCrawl,
        },
        output: {
          brandId,
          scoreCount: scores?.length ?? 0,
          urlRetrieval:
            contextResponse?.candidates?.[0]?.urlContextMetadata ?? null,
          grounding:
            structuredResponse.candidates?.[0]?.groundingMetadata ?? null,
        },
        model,
        tokensIn:
          (usage?.promptTokenCount ?? 0) +
            (contextUsage?.promptTokenCount ?? 0) || null,
        tokensOut:
          (usage?.candidatesTokenCount ?? 0) +
            (contextUsage?.candidatesTokenCount ?? 0) || null,
        durationMs,
      });
      logId = result.id;
    } catch (logErr) {
      console.warn("brand-intelligence agent log insert failed (non-fatal):", logErr);
    }

    return jsonResponse({
      brandId,
      brand: updated,
      profile: aiProfile,
      scores: scores ?? [],
      ...(logId ? { logId } : {}),
      durationMs,
      geminiMs,
      usedCrawl: useCrawl,
      crawlResultId: crawlRow?.id ?? null,
    });
  } catch (err) {
    console.error("brand-intelligence error:", err);
    // If draft was already persisted successfully, don't overwrite draft_ready → failed.
    // The operator can still apply or discard the draft; the error is in a later step (e.g. logging).
    if (failureBrandId && failureClient && !draftPersisted) {
      try {
        await markIntakeStatus(failureClient, failureBrandId, "failed");
      } catch (statusErr) {
        console.error("failed to set intake_status=failed:", statusErr);
      }
    }
    return errorResponse("internal_error", safeErrorMessage(err), 500);
  }
});
