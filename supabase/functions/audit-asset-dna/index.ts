import { GoogleGenAI, Type } from "npm:@google/genai@2.8.0";

import { insertAgentLog } from "../_shared/agent-log.ts";
import { handleCors } from "../_shared/cors.ts";
import { getOptionalSecret } from "../_shared/env.ts";
import { errorResponse, jsonResponse, safeErrorMessage } from "../_shared/response.ts";
import { resolveGeminiModel } from "../_shared/gemini.ts";
import { resolveDnaProvider } from "../_shared/llm/allowlist.ts";
import { isCallerFailure, resolveCaller } from "../_shared/resolve-caller.ts";

const MODEL = resolveGeminiModel();
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
const GEMINI_TIMEOUT_MS = 30_000; // 30 s

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
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    // Block private, link-local, and loopback ranges
    const isPrivate172 = (): boolean => {
      if (!host.startsWith("172.")) return false;
      const octet = parseInt(host.split(".")[1], 10);
      return octet >= 16 && octet <= 31;
    };
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host === "[::1]" ||
      host.startsWith("10.") ||
      isPrivate172() ||
      host.startsWith("192.168.") ||
      host.startsWith("169.254.") ||
      host.endsWith(".local") ||
      host.endsWith(".internal")
    ) return false;
    return true;
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

  const contentLength = response.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_IMAGE_BYTES) {
    throw new Error(`Asset image exceeds size limit (${MAX_IMAGE_BYTES} bytes)`);
  }

  const mimeType = response.headers.get("content-type")?.split(";")[0] ||
    fallbackMimeType ||
    "image/jpeg";

  if (!mimeType.startsWith("image/")) {
    throw new Error("DNA audit requires an image asset");
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length > MAX_IMAGE_BYTES) {
    throw new Error(`Asset image exceeds size limit (${MAX_IMAGE_BYTES} bytes)`);
  }

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

    if (resolveDnaProvider() !== "gemini") {
      return errorResponse(
        "not_implemented",
        "Groq vision DNA is deferred until golden eval (DNA_USE_GEMINI=1)",
        501,
      );
    }

    const caller = await resolveCaller(req);
    if (isCallerFailure(caller)) return caller.response;

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

    const client = caller.client;
    let query = client.from("assets").select("id, brand_id, url, mime_type");
    query = assetId ? query.eq("id", assetId) : query.eq("url", assetUrl);

    const { data: asset, error: assetErr } = await query.maybeSingle<AssetRecord>();
    if (assetErr) {
      throw new Error(assetErr.message);
    }
    if (!asset) {
      return errorResponse("not_found", "Registered asset not found", 404);
    }

    if (!isValidHttpUrl(asset.url)) {
      return errorResponse("validation_error", "Asset URL is not a valid external URL", 422);
    }

    const imagePart = await fetchImagePart(asset.url, asset.mime_type);
    const ai = new GoogleGenAI({ apiKey });

    const response = await Promise.race([
      ai.models.generateContent({
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
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Gemini request timed out")), GEMINI_TIMEOUT_MS)
      ),
    ]);

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

    if (
      typeof parsed.score !== "number" ||
      !parsed.pillars ||
      typeof parsed.pillars.brandConsistency !== "number" ||
      typeof parsed.pillars.compositionQuality !== "number" ||
      typeof parsed.pillars.channelReadiness !== "number" ||
      typeof parsed.pillars.productClarity !== "number" ||
      typeof parsed.rationale !== "string"
    ) {
      throw new Error("Model response missing required fields");
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
    let logId: string | undefined;
    try {
      const result = await insertAgentLog(client, {
        agentName: "audit-asset-dna",
        userId: caller.userId,
        brandId: asset.brand_id,
        input: { assetId: asset.id, assetUrl: asset.url },
        output: { dnaScore, dnaStatus },
        model: MODEL,
        tokensIn: usage?.promptTokenCount ?? null,
        tokensOut: usage?.candidatesTokenCount ?? null,
        durationMs,
      });
      logId = result.id;
    } catch (logErr) {
      console.warn("agent log insert failed (non-fatal):", logErr);
    }

    return jsonResponse({
      assetId: updated.id,
      brandId: updated.brand_id,
      assetUrl: updated.url,
      dnaScore: updated.dna_score,
      dnaStatus: updated.dna_status,
      dnaPillars: updated.dna_pillars,
      ...(logId ? { logId } : {}),
      durationMs,
    });
  } catch (err) {
    console.error("audit-asset-dna error:", err);
    return errorResponse("internal_error", safeErrorMessage(err), 500);
  }
});
