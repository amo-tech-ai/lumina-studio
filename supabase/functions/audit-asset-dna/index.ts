import { GoogleGenAI, Type } from "npm:@google/genai@2.8.0";

import { insertAgentLog } from "../_shared/agent-log.ts";
import { isAuthFailure, resolveAuth } from "../_shared/auth.ts";
import { handleCors } from "../_shared/cors.ts";
import { getOptionalSecret } from "../_shared/env.ts";
import { errorResponse, jsonResponse, safeErrorMessage } from "../_shared/response.ts";
import { resolveGeminiModel } from "../_shared/gemini.ts";
import { createUserClient } from "../_shared/supabase-client.ts";

const MODEL = resolveGeminiModel();

type DnaStatus = "approved" | "review" | "blocked";

type RequestBody = {
  assetId?: string;
  assetUrl?: string;
};

type AssetRecord = {
  id: string;
  brand_id: string | null;
  url: string;
  mime_type: string | null;
};

type DnaResponse = {
  score: number;
  pillars: {
    brandConsistency: number;
    compositionQuality: number;
    channelReadiness: number;
    productClarity: number;
  };
  rationale: string;
};

const dnaSchema = {
  type: Type.OBJECT,
  properties: {
    score: {
      type: Type.NUMBER,
      description: "Overall asset DNA compliance score from 0 to 100",
    },
    pillars: {
      type: Type.OBJECT,
      properties: {
        brandConsistency: { type: Type.NUMBER },
        compositionQuality: { type: Type.NUMBER },
        channelReadiness: { type: Type.NUMBER },
        productClarity: { type: Type.NUMBER },
      },
      required: [
        "brandConsistency",
        "compositionQuality",
        "channelReadiness",
        "productClarity",
      ],
    },
    rationale: { type: Type.STRING },
  },
  required: ["score", "pillars", "rationale"],
};

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value * 100) / 100));
}

function statusFromScore(score: number): DnaStatus {
  if (score >= 80) return "approved";
  if (score >= 60) return "review";
  return "blocked";
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

async function fetchImagePart(assetUrl: string, fallbackMimeType: string | null) {
  const response = await fetch(assetUrl);
  if (!response.ok) {
    throw new Error(`Asset image fetch failed with status ${response.status}`);
  }

  const mimeType = response.headers.get("content-type")?.split(";")[0] ||
    fallbackMimeType ||
    "image/jpeg";

  if (!mimeType.startsWith("image/")) {
    throw new Error("DNA audit requires an image asset");
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  return {
    inlineData: {
      mimeType,
      data: bytesToBase64(bytes),
    },
  };
}

console.info("audit-asset-dna function started");

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

    const assetId = typeof body.assetId === "string" ? body.assetId.trim() : "";
    const assetUrl = typeof body.assetUrl === "string" ? body.assetUrl.trim() : "";

    if (!assetId && !assetUrl) {
      return errorResponse(
        "validation_error",
        "assetId or assetUrl is required",
        422,
      );
    }
    if (assetUrl && !isValidHttpUrl(assetUrl)) {
      return errorResponse(
        "validation_error",
        "assetUrl must be a valid http(s) URL",
        422,
      );
    }

    const apiKey = getOptionalSecret("GEMINI_API_KEY");
    if (!apiKey) {
      return errorResponse("config_error", "DNA audit is not configured", 503);
    }

    const client = createUserClient(auth.accessToken);
    let query = client.from("assets").select("id, brand_id, url, mime_type");
    query = assetId ? query.eq("id", assetId) : query.eq("url", assetUrl);

    const { data: asset, error: assetErr } = await query.maybeSingle<AssetRecord>();
    if (assetErr) {
      throw new Error(assetErr.message);
    }
    if (!asset) {
      return errorResponse("not_found", "Registered asset not found", 404);
    }

    const imagePart = await fetchImagePart(asset.url, asset.mime_type);
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
Score this fashion commerce asset for iPix brand DNA compliance.

Return a 0-100 score and four pillar scores:
- brandConsistency: visual fit for a premium fashion/DTC brand
- compositionQuality: lighting, framing, focus, crop safety
- channelReadiness: readiness for PDP, social, and paid media use
- productClarity: how clearly the product is presented

Use the image only. Be strict with blurry, dark, cluttered, low-resolution, or off-brand assets.
`.trim(),
            },
            imagePart,
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: dnaSchema,
        temperature: 0.1,
      },
    });

    const responseText = response.text ?? "";
    if (!responseText.trim()) {
      throw new Error("Empty response from Gemini");
    }

    let parsed: DnaResponse;
    try {
      parsed = JSON.parse(responseText) as DnaResponse;
    } catch {
      throw new Error("Model returned invalid JSON");
    }

    const dnaScore = clampScore(parsed.score);
    const dnaStatus = statusFromScore(dnaScore);
    const dnaPillars = {
      brandConsistency: clampScore(parsed.pillars.brandConsistency),
      compositionQuality: clampScore(parsed.pillars.compositionQuality),
      channelReadiness: clampScore(parsed.pillars.channelReadiness),
      productClarity: clampScore(parsed.pillars.productClarity),
      rationale: parsed.rationale,
      auditedAt: new Date().toISOString(),
      model: MODEL,
    };

    const { data: updated, error: updateErr } = await client
      .from("assets")
      .update({
        dna_score: dnaScore,
        dna_status: dnaStatus,
        dna_pillars: dnaPillars,
      })
      .eq("id", asset.id)
      .select("id, brand_id, url, dna_score, dna_status, dna_pillars")
      .single();

    if (updateErr || !updated) {
      throw new Error(updateErr?.message ?? "Failed to update asset DNA score");
    }

    const durationMs = Math.round(performance.now() - started);
    const usage = response.usageMetadata;
    const { id: logId } = await insertAgentLog(client, {
      agentName: "audit-asset-dna",
      userId: auth.user.id,
      brandId: asset.brand_id,
      input: { assetId: asset.id, assetUrl: asset.url },
      output: { dnaScore, dnaStatus },
      model: MODEL,
      tokensIn: usage?.promptTokenCount ?? null,
      tokensOut: usage?.candidatesTokenCount ?? null,
      durationMs,
    });

    return jsonResponse({
      assetId: updated.id,
      brandId: updated.brand_id,
      assetUrl: updated.url,
      dnaScore: updated.dna_score,
      dnaStatus: updated.dna_status,
      dnaPillars: updated.dna_pillars,
      logId,
      durationMs,
    });
  } catch (err) {
    console.error("audit-asset-dna error:", err);
    return errorResponse("internal_error", safeErrorMessage(err), 500);
  }
});
