import type { GenerateContentResponse } from "npm:@google/genai@2.8.0";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

import { insertAgentLog } from "../_shared/agent-log.ts";
import {
  type CrawlRawData,
  formatCrawlForPrompt,
  isCrawlThin,
} from "../_shared/crawl-context.ts";
import { handleCors } from "../_shared/cors.ts";
import { getOptionalSecret } from "../_shared/env.ts";
import {
  generateContextPass,
  generateStructuredContent as generateGeminiStructuredContent,
  resolveGeminiModel,
} from "../_shared/gemini.ts";
import { resolveBiProvider } from "../_shared/llm/allowlist.ts";
import {
  biUsedCrawlInRequest,
  groqEmptyCrawlError,
  missingBiProviderConfigError,
} from "../_shared/bi-groq-guards.ts";
import { generateStructuredContent as generateLlmStructuredContent } from "../_shared/llm/structured.ts";
import type {
  StructuredGenerationLog,
  StructuredGenerationOptions,
  StructuredGenerationResult,
} from "../_shared/llm/types.ts";
import {
  brandProfileResponseSchema,
  brandProfileStrictJsonSchema,
  buildAiProfileFromPayload,
  clampScore,
  type BrandProfilePayload,
  validateBrandProfilePayload,
} from "../_shared/schemas/brand-profile.ts";
import { isCallerFailure, resolveCaller } from "../_shared/resolve-caller.ts";
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
  /^0\.0\.0\.0$/i,
  /^0\./,
  /^::1$/,
  /^::ffff:/i,
  /^fc00:/i,
  /^fd[0-9a-f]{2}:/i,
  /^fe[89ab][0-9a-f]:/i,
  /\.local$/i,
  /\.internal$/i,
];

function normalizeHostname(host: string): string {
  const h = host.toLowerCase();
  if (h.startsWith("[") && h.endsWith("]")) {
    return h.slice(1, -1);
  }
  return h;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    const hostname = normalizeHostname(parsed.hostname);
    return !PRIVATE_HOST_PATTERNS.some((p) => p.test(hostname));
  } catch {
    return false;
  }
}

function normalizeBrandUrl(value: string): string {
  try {
    return new URL(value.trim()).origin.toLowerCase();
  } catch {
    return value.trim().toLowerCase();
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

const GROQ_BI_SYSTEM_PROMPT = `
You are a fashion brand intelligence analyst for iPix, a creative production platform.

Analyze brand website content and extract a complete brand profile with readiness scores (0-100).

Example 1 — DTC apparel:
Input: Clean beauty site with minimal palette, sustainability copy, shop grid.
Output: tagline "Skincare for real life", category "DTC beauty", contentPillars ["clean ingredients","inclusivity","education"], brandVoice "friendly, minimal, science-forward", scores visual 78 audience 82 consistency 75 commerce_readiness 88.

Example 2 — Luxury fashion:
Input: Editorial lookbook, heritage story, high-price catalog.
Output: tagline "Modern heritage tailoring", category "Luxury apparel", brandPersonality "refined, confident", scores visual 90 audience 70 consistency 85 commerce_readiness 72.

Return ONLY valid JSON matching the schema.
`.trim();

function buildGroqCrawlUserContent(params: {
  url: string;
  brandName?: string;
  shellProfile: Record<string, unknown>;
  crawlText: string;
  pageCount: number;
}): string {
  const shell = JSON.stringify(params.shellProfile, null, 2);
  return `
Brand URL: ${params.url}
${params.brandName ? `Brand name hint: ${params.brandName}` : ""}

Onboarding metadata (preserve industry, goal, instagram_handle when merging):
${shell}

Crawl content (${params.pageCount} pages):
${params.crawlText}

Set sourceUrl to ${JSON.stringify(params.url)}.
`.trim();
}

async function loadCrawlRow(
  client: SupabaseClient,
  brandId: string,
  crawlResultId: string | null,
  requestUrl: string,
) {
  const requestOrigin = normalizeBrandUrl(requestUrl);
  const crawlSelect =
    "id, brand_id, raw_data, pages_crawled, job_status, source_url";

  if (crawlResultId) {
    const { data, error } = await client
      .from("brand_crawls")
      .select(crawlSelect)
      .eq("id", crawlResultId)
      .maybeSingle();
    if (
      !error &&
      data &&
      data.brand_id === brandId &&
      normalizeBrandUrl(data.source_url) === requestOrigin
    ) {
      return data;
    }
  }

  const { data: rows, error } = await client
    .from("brand_crawls")
    .select(crawlSelect)
    .eq("brand_id", brandId)
    .eq("job_status", "complete")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error || !rows?.length) return null;
  return rows.find(
    (row) => normalizeBrandUrl(row.source_url) === requestOrigin,
  ) ?? null;
}

async function markIntakeStatus(
  client: SupabaseClient,
  brandId: string,
  status: "analysis_running" | "scores_complete" | "failed",
) {
  await client
    .from("brands")
    .update({ intake_status: status })
    .eq("id", brandId);
}

async function markIntakeFailedIfRunning(
  client: SupabaseClient,
  brandId: string,
) {
  await client
    .from("brands")
    .update({ intake_status: "failed" })
    .eq("id", brandId)
    .eq("intake_status", "analysis_running");
}

type LlmStructuredGenerate = typeof generateLlmStructuredContent;
let llmStructuredGenerateForTests: LlmStructuredGenerate | null = null;

/** Test seam — override shared LLM call in handler tests only. */
export function __setLlmStructuredGenerateForTests(
  fn: LlmStructuredGenerate | null,
): void {
  llmStructuredGenerateForTests = fn;
}

function runLlmStructuredContent<T>(
  options: StructuredGenerationOptions,
): Promise<StructuredGenerationResult<T>> {
  const generate = llmStructuredGenerateForTests ?? generateLlmStructuredContent;
  return generate<T>(options);
}

export async function handleBrandIntelligenceRequest(req: Request): Promise<Response> {
  const cors = handleCors(req);
  if (cors) return cors;

  const started = performance.now();
  let failureBrandId: string | null = null;
  let failureClient: SupabaseClient | null = null;
  let draftPersisted = false;

  try {
    if (req.method !== "POST") {
      return errorResponse("method_not_allowed", "Use POST", 405);
    }

    const caller = await resolveCaller(req);
    if (isCallerFailure(caller)) return caller.response;

    const biProvider = resolveBiProvider();
    // Same preference as resolveCloudflareCredentials; whitespace GATEWAY falls through to API.
    const configError = missingBiProviderConfigError(biProvider, {
      geminiApiKey: getOptionalSecret("GEMINI_API_KEY"),
      groqApiKey: getOptionalSecret("GROQ_API_KEY"),
      cloudflareApiToken:
        getOptionalSecret("CLOUDFLARE_AI_GATEWAY_TOKEN")?.trim() ||
        getOptionalSecret("CLOUDFLARE_API_TOKEN"),
      cloudflareAccountId: getOptionalSecret("CLOUDFLARE_ACCOUNT_ID"),
    });
    if (configError) {
      return errorResponse(
        configError.code,
        configError.message,
        configError.status,
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
      const parsed: unknown = await req.json();
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return errorResponse(
          "invalid_json",
          "Request body must be a JSON object",
          422,
        );
      }
      body = parsed as typeof body;
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

    const client = caller.client;
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

    const crawlRow = await loadCrawlRow(client, brandId, crawlResultId, url);
    const rawData = (crawlRow?.raw_data ?? null) as CrawlRawData | null;
    // IPI-741 — provider-neutral budget: a full 10-page crawl easily exceeds
    // rate/cost limits on smaller-tier models (e.g. Groq's openai/gpt-oss-20b
    // on_demand TPM cap). 24k chars / 6 pages is comfortably enough context
    // for brand analysis while keeping every provider's prompt bounded.
    const CRAWL_PROMPT_BUDGET = { maxChars: 24_000, maxPages: 6 } as const;
    let crawlText = formatCrawlForPrompt(rawData, CRAWL_PROMPT_BUDGET);
    if (
      (biProvider === "groq" || biProvider === "workers-ai") &&
      !crawlText.trim() &&
      rawData?.pages?.length
    ) {
      const pagesWithMarkdown = rawData.pages.filter(
        (page) => (page.markdown?.trim().length ?? 0) > 0,
      );
      if (pagesWithMarkdown.length > 0) {
        crawlText = formatCrawlForPrompt(
          { pages: pagesWithMarkdown },
          CRAWL_PROMPT_BUDGET,
        );
      }
    }
    const useCrawl = !isCrawlThin(rawData);
    const usedCrawlInRequest = biUsedCrawlInRequest(
      biProvider,
      rawData,
      crawlText,
    );

    const llmStarted = performance.now();
    let profile: BrandProfilePayload;
    let model: string;
    let llmLog: StructuredGenerationLog | null = null;
    let structuredResponse: GenerateContentResponse | null = null;
    let contextResponse: GenerateContentResponse | null = null;

    if (biProvider === "gemini") {
      const apiKey = getOptionalSecret("GEMINI_API_KEY")!;
      model = resolveGeminiModel();

      if (useCrawl && crawlText) {
        const prompt = buildCrawlPrompt({
          url,
          brandName,
          shellProfile: priorProfile,
          crawlText,
          pageCount: rawData?.pages?.length ?? crawlRow?.pages_crawled ?? 0,
        });

        const result = await generateGeminiStructuredContent({
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
        profile = JSON.parse(result.text) as BrandProfilePayload;
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
        const result = await generateGeminiStructuredContent({
          apiKey,
          model,
          contents: structurePrompt,
          responseSchema: brandProfileResponseSchema,
          thinkingLevel: "low",
          temperature: 0.1,
          timeoutMs: 50_000,
        });
        structuredResponse = result.response;
        profile = JSON.parse(result.text) as BrandProfilePayload;
      }
    } else {
      const crawlError = groqEmptyCrawlError(crawlText, rawData);
      if (crawlError) {
        await markIntakeFailedIfRunning(client, brandId);
        return errorResponse(
          crawlError.code,
          crawlError.message,
          crawlError.status,
        );
      }

      const structured = await runLlmStructuredContent<BrandProfilePayload>({
        scope: "bi",
        systemPrompt: GROQ_BI_SYSTEM_PROMPT,
        userContent: buildGroqCrawlUserContent({
          url,
          brandName,
          shellProfile: priorProfile,
          crawlText,
          pageCount: rawData?.pages?.length ?? crawlRow?.pages_crawled ?? 0,
        }),
        jsonSchema: brandProfileStrictJsonSchema as Record<string, unknown>,
        geminiResponseSchema: brandProfileResponseSchema,
        schemaName: "brand_profile",
        tier: "structured",
        temperature: 0.1,
        timeoutMs: 45_000,
      });
      profile = structured.data;
      llmLog = structured.log;
      model = structured.log.model;
    }

    const geminiMs = Math.round(performance.now() - llmStarted);

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

    const mergedProfileComplete = {
      ...priorProfile,
      ...aiProfile,
      _lifecycle: "scores_complete",
      // In draft mode, embed scores so applyDraft can upsert them when the draft is approved
      ...(draftMode && { _draft_scores: scoreRows }),
    };

    let scores: { id: string; score_type: string; score: number }[] | null = null;
    let updated: { id: string; name: string };

    if (draftMode) {
      const { data: draftUpdated, error: updateErr } = await client
        .from("brands")
        .update({
          ai_profile_draft: mergedProfileComplete,
          intake_status: "draft_ready" as const,
        })
        .eq("id", brandId)
        .select("id, name")
        .single();

      if (updateErr || !draftUpdated) {
        throw new Error(updateErr?.message ?? "Failed to update brand");
      }
      updated = draftUpdated;
      draftPersisted = true;
    } else {
      const liveScoreRows = scoreRows.map((r) => ({ ...r, brand_id: brandId }));
      const { data: scoresData, error: scoresErr } = await client
        .from("brand_scores")
        .upsert(liveScoreRows, { onConflict: "brand_id,score_type" })
        .select("id, score_type, score");

      if (scoresErr) throw new Error(scoresErr.message);
      scores = scoresData;

      const { data: liveUpdated, error: updateErr } = await client
        .from("brands")
        .update({
          name: aiProfile.name as string,
          brand_url: url,
          ai_profile: mergedProfileComplete,
          intake_status: "scores_complete" as const,
        })
        .eq("id", brandId)
        .select("id, name")
        .single();

      if (updateErr || !liveUpdated) {
        throw new Error(updateErr?.message ?? "Failed to update brand");
      }
      updated = liveUpdated;
    }

    const usage = structuredResponse?.usageMetadata;
    const contextUsage = contextResponse?.usageMetadata;
    const durationMs = Math.round(performance.now() - started);

    let logId: string | undefined;
    try {
      const result = await insertAgentLog(client, {
        agentName: "brand-intelligence",
        userId: caller.userId,
        brandId,
        input: {
          url,
          brandId,
          crawlResultId: crawlRow?.id ?? crawlResultId,
          usedCrawl: usedCrawlInRequest,
          provider: llmLog?.provider ?? biProvider,
        },
        output: {
          brandId,
          scoreCount: scores?.length ?? 0,
          provider: llmLog?.provider ?? biProvider,
          model,
          xGroqRequestId: llmLog?.xGroqRequestId ?? null,
          schemaRepairCount: llmLog?.schemaRepairCount ?? 0,
          urlRetrieval:
            contextResponse?.candidates?.[0]?.urlContextMetadata ?? null,
          grounding:
            structuredResponse?.candidates?.[0]?.groundingMetadata ?? null,
        },
        model,
        tokensIn:
          (llmLog?.usage?.promptTokens ??
            (usage?.promptTokenCount ?? 0) + (contextUsage?.promptTokenCount ?? 0)) ||
          null,
        tokensOut:
          (llmLog?.usage?.completionTokens ??
            (usage?.candidatesTokenCount ?? 0) +
              (contextUsage?.candidatesTokenCount ?? 0)) ||
          null,
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
      provider: llmLog?.provider ?? biProvider,
      usedCrawl: usedCrawlInRequest,
      crawlResultId: crawlRow?.id ?? null,
    });
  } catch (err) {
    console.error("brand-intelligence error:", err);
    // If draft was already persisted successfully, don't overwrite draft_ready → failed.
    // The operator can still apply or discard the draft; the error is in a later step (e.g. logging).
    if (failureBrandId && failureClient && !draftPersisted) {
      try {
        await markIntakeFailedIfRunning(failureClient, failureBrandId);
      } catch (statusErr) {
        console.error("failed to set intake_status=failed:", statusErr);
      }
    }
    return errorResponse("internal_error", safeErrorMessage(err), 500);
  }
}
