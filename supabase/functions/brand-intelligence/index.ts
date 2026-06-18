import { GoogleGenAI, Type } from "npm:@google/genai@2.8.0";

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
  scores: {
    visual: number;
    audience: number;
    consistency: number;
    commerce_readiness: number;
  };
};

type DraftScore = {
  score_type: string;
  score: number;
};

type UrlContextMetadata = {
  urlMetadata?: Array<{ urlRetrievalStatus?: string; retrievedUrl?: string }>;
};

type RequestBody = {
  action?: "analyze" | "commit";
  url?: string;
  brandId?: string;
  draftId?: string;
  decision?: "approve" | "reject";
};

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function clampScore(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n * 100) / 100));
}

function buildDraftScores(profile: BrandProfilePayload, url: string): DraftScore[] {
  return [
    { score_type: "visual", score: clampScore(profile.scores.visual) },
    { score_type: "audience", score: clampScore(profile.scores.audience) },
    {
      score_type: "consistency",
      score: clampScore(profile.scores.consistency),
    },
    {
      score_type: "commerce_readiness",
      score: clampScore(profile.scores.commerce_readiness),
    },
  ];
}

function buildScoreInsertRows(
  draftScores: DraftScore[],
  brandId: string,
  url: string,
) {
  return draftScores.map((row) => ({
    brand_id: brandId,
    score_type: row.score_type,
    score: row.score,
    details: { source: "brand-intelligence", url },
  }));
}

function isUrlRetrievalBlocked(metadata: UrlContextMetadata | null | undefined): boolean {
  const urls = metadata?.urlMetadata;
  if (!urls || urls.length === 0) return true;

  return !urls.some(
    (entry) => entry.urlRetrievalStatus === "URL_RETRIEVAL_STATUS_SUCCESS",
  );
}

function urlRetrievalFailureMessage(
  metadata: UrlContextMetadata | null | undefined,
): string {
  const statuses = metadata?.urlMetadata?.map((u) => u.urlRetrievalStatus) ?? [];
  if (statuses.length === 0) {
    return "Could not retrieve brand URL content for analysis";
  }
  if (statuses.every((s) => s === "URL_RETRIEVAL_STATUS_UNSAFE")) {
    return "Brand URL failed safety checks and cannot be analyzed";
  }
  return "Brand URL could not be retrieved for analysis";
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

    let body: RequestBody;
    try {
      body = await req.json();
    } catch {
      return errorResponse("invalid_json", "Request body must be JSON", 422);
    }

    const action = body.action === "commit" ? "commit" : "analyze";
    const client = createUserClient(auth.accessToken);

    if (action === "commit") {
      return await handleCommit(client, auth.user.id, body, started);
    }

    const apiKey = getOptionalSecret("GEMINI_API_KEY");
    if (!apiKey) {
      return errorResponse(
        "config_error",
        "Brand intelligence is not configured",
        503,
      );
    }

    return await handleAnalyze(client, auth.user.id, body, apiKey, started);
  } catch (err) {
    console.error("brand-intelligence error:", err);
    return errorResponse("internal_error", safeErrorMessage(err), 500);
  }
});

async function handleAnalyze(
  client: ReturnType<typeof createUserClient>,
  userId: string,
  body: RequestBody,
  apiKey: string,
  started: number,
): Promise<Response> {
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

  if (brandIdInput) {
    const { data: existing, error: fetchErr } = await client
      .from("brands")
      .select("id")
      .eq("id", brandIdInput)
      .maybeSingle();

    if (fetchErr || !existing) {
      return errorResponse("not_found", "Brand not found", 404);
    }
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
Analyze this fashion or DTC brand website and return structured brand intelligence for a creative production platform.

Brand URL: ${url}

Extract:
- Brand name and tagline
- Product category
- Visual identity (colors and mood)
- Target audience summary
- Readiness scores (0-100) for visual clarity, audience clarity, brand consistency, and commerce readiness

Use the URL content as primary evidence. Set sourceUrl to the analyzed URL.
`.trim();

  const geminiStarted = performance.now();

  const contextResponse = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      tools: [{ urlContext: {} }],
      temperature: 0.2,
    },
  });

  const urlRetrieval =
    contextResponse.candidates?.[0]?.urlContextMetadata ?? null;

  if (isUrlRetrievalBlocked(urlRetrieval as UrlContextMetadata)) {
    return errorResponse(
      "url_retrieval_failed",
      urlRetrievalFailureMessage(urlRetrieval as UrlContextMetadata),
      422,
    );
  }

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
  "sourceUrl": string (use ${JSON.stringify(url)}),
  "scores": {
    "visual": number 0-100,
    "audience": number 0-100,
    "consistency": number 0-100,
    "commerce_readiness": number 0-100
  }
}
`.trim();

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: structurePrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: brandProfileSchema,
      temperature: 0.1,
    },
  });

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

  const aiProfile = {
    name: profile.name,
    tagline: profile.tagline,
    category: profile.category,
    visualIdentity: profile.visualIdentity,
    targetAudience: profile.targetAudience,
    sourceUrl: profile.sourceUrl || url,
    analyzedAt: new Date().toISOString(),
  };

  const draftScores = buildDraftScores(profile, url);
  const citations = (urlRetrieval as UrlContextMetadata)?.urlMetadata ?? [];

  const { data: draft, error: draftErr } = await client
    .from("brand_intake_drafts")
    .insert({
      user_id: userId,
      brand_id: brandIdInput,
      source_url: url,
      status: "pending",
      draft_profile: aiProfile,
      draft_scores: draftScores,
      url_retrieval: urlRetrieval ?? {},
      citations,
    })
    .select("id, status, brand_id")
    .single();

  if (draftErr || !draft) {
    throw new Error(draftErr?.message ?? "Failed to create intake draft");
  }

  const usage = response.usageMetadata;
  const contextUsage = contextResponse.usageMetadata;
  const durationMs = Math.round(performance.now() - started);

  const { id: logId } = await insertAgentLog(client, {
    agentName: "brand-intelligence",
    userId,
    brandId: brandIdInput,
    input: { action: "analyze", url, brandId: brandIdInput },
    output: {
      draftId: draft.id,
      scoreCount: draftScores.length,
      urlRetrieval,
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
    action: "analyze",
    draftId: draft.id,
    status: draft.status,
    brandId: draft.brand_id,
    profile: aiProfile,
    scores: draftScores,
    urlRetrieval,
    logId,
    durationMs,
    geminiMs,
  });
}

async function handleCommit(
  client: ReturnType<typeof createUserClient>,
  userId: string,
  body: RequestBody,
  started: number,
): Promise<Response> {
  const draftId =
    typeof body.draftId === "string" && body.draftId.length > 0
      ? body.draftId
      : null;
  const decision = body.decision;

  if (!draftId) {
    return errorResponse("validation_error", "draftId is required", 422);
  }
  if (decision !== "approve" && decision !== "reject") {
    return errorResponse(
      "validation_error",
      "decision must be approve or reject",
      422,
    );
  }

  const { data: draft, error: draftErr } = await client
    .from("brand_intake_drafts")
    .select(
      "id, user_id, brand_id, source_url, status, draft_profile, draft_scores",
    )
    .eq("id", draftId)
    .maybeSingle();

  if (draftErr) {
    throw new Error(draftErr.message);
  }
  if (!draft || draft.user_id !== userId) {
    return errorResponse("not_found", "Draft not found", 404);
  }
  if (draft.status !== "pending") {
    return errorResponse(
      "invalid_state",
      `Draft is already ${draft.status}`,
      409,
    );
  }

  const now = new Date().toISOString();

  if (decision === "reject") {
    const { data: rejected, error: rejectErr } = await client
      .from("brand_intake_drafts")
      .update({ status: "rejected", rejected_at: now })
      .eq("id", draftId)
      .select("id, status")
      .single();

    if (rejectErr || !rejected) {
      throw new Error(rejectErr?.message ?? "Failed to reject draft");
    }

    const durationMs = Math.round(performance.now() - started);
    await insertAgentLog(client, {
      agentName: "brand-intelligence",
      userId,
      brandId: draft.brand_id,
      input: { action: "commit", draftId, decision: "reject" },
      output: { draftId, status: rejected.status },
      model: MODEL,
      durationMs,
    });

    return jsonResponse({
      action: "commit",
      decision: "reject",
      draftId: rejected.id,
      status: rejected.status,
      durationMs,
    });
  }

  const profile = draft.draft_profile as Record<string, unknown>;
  const name = typeof profile.name === "string" ? profile.name.trim() : "";
  if (!name) {
    return errorResponse("validation_error", "Draft profile missing brand name", 422);
  }

  const draftScores = Array.isArray(draft.draft_scores)
    ? (draft.draft_scores as DraftScore[])
    : [];

  let brandId = draft.brand_id as string | null;
  let brandRow: { id: string; name: string } | null = null;

  if (brandId) {
    const { data: updated, error: updateErr } = await client
      .from("brands")
      .update({
        name,
        brand_url: draft.source_url,
        ai_profile: profile,
        intake_status: "approved",
        approved_profile_at: now,
      })
      .eq("id", brandId)
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
        user_id: userId,
        name,
        brand_url: draft.source_url,
        ai_profile: profile,
        intake_status: "approved",
        approved_profile_at: now,
      })
      .select("id, name")
      .single();

    if (insertErr || !inserted) {
      throw new Error(insertErr?.message ?? "Failed to create brand");
    }
    brandRow = inserted;
    brandId = inserted.id;
  }

  const { error: deleteScoresErr } = await client
    .from("brand_scores")
    .delete()
    .eq("brand_id", brandId);

  if (deleteScoresErr) {
    throw new Error(deleteScoresErr.message);
  }

  const scoreRows = buildScoreInsertRows(
    draftScores,
    brandId,
    draft.source_url,
  );

  const { data: scores, error: scoresErr } = await client
    .from("brand_scores")
    .insert(scoreRows)
    .select("id, score_type, score");

  if (scoresErr) {
    throw new Error(scoresErr.message);
  }

  const { data: approved, error: approveErr } = await client
    .from("brand_intake_drafts")
    .update({
      status: "approved",
      brand_id: brandId,
      approved_at: now,
    })
    .eq("id", draftId)
    .select("id, status")
    .single();

  if (approveErr || !approved) {
    throw new Error(approveErr?.message ?? "Failed to approve draft");
  }

  const durationMs = Math.round(performance.now() - started);

  const { id: logId } = await insertAgentLog(client, {
    agentName: "brand-intelligence",
    userId,
    brandId,
    input: { action: "commit", draftId, decision: "approve" },
    output: {
      draftId,
      brandId,
      scoreCount: scores?.length ?? 0,
    },
    model: MODEL,
    durationMs,
  });

  return jsonResponse({
    action: "commit",
    decision: "approve",
    draftId: approved.id,
    status: approved.status,
    brandId,
    brand: brandRow,
    profile,
    scores: scores ?? [],
    logId,
    durationMs,
  });
}
