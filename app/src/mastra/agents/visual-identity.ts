import { Agent } from "@mastra/core/agent";
import { createTool } from "@mastra/core/tools";
import { generateObject } from "ai";
import type { UserContent, ImagePart, TextPart } from "ai";
import { createClient } from "@supabase/supabase-js";
import { v2 as cloudinary } from "cloudinary";
import { z } from "zod";
import { resolveModel, resolveProviderOptions } from "@/mastra/models";

const MODEL = resolveModel();

const HexColor = z.string().regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Expected hex color");

const VisualIdentitySchema = z.object({
  primaryColors: z.array(HexColor).describe("Primary hex colors"),
  secondaryColors: z.array(HexColor).describe("Secondary/accent hex colors"),
  typographyStyle: z.string().describe("e.g. serif, sans-serif, mixed, decorative"),
  logoDescription: z.string().describe("Brief logo description"),
  layoutStyle: z.string().describe("e.g. minimal, editorial, grid, asymmetric"),
  imageAesthetic: z.string().describe("e.g. lifestyle, product, editorial, flat"),
  brandMood: z.string().describe("e.g. luxury, playful, professional, edgy"),
  designPatterns: z.array(z.string()).describe("Visual motifs or recurring patterns"),
  colorTemperature: z.string().describe("warm, cool, neutral, or mixed"),
  visualPersonality: z.string().describe("One sentence brand visual summary"),
});

type VisualIdentity = z.infer<typeof VisualIdentitySchema>;

const FETCH_TIMEOUT_MS = 30_000;

function withTimeout(ms: number): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, cancel: () => clearTimeout(timer) };
}

async function captureScreenshot(homepageUrl: string): Promise<Buffer | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return null;
  const { signal, cancel } = withTimeout(FETCH_TIMEOUT_MS);
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ url: homepageUrl, formats: ["screenshot"] }),
      signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { data?: { screenshot?: string } };
    const b64 = data?.data?.screenshot;
    if (!b64) return null;
    const stripped = b64.replace(/^data:image\/\w+;base64,/, "");
    return Buffer.from(stripped, "base64");
  } catch {
    return null;
  } finally {
    cancel();
  }
}

let cloudinaryConfigured = false;

function ensureCloudinaryConfigured(): boolean {
  if (cloudinaryConfigured) return true;
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud_name || !api_key || !api_secret) return false;
  cloudinary.config({ cloud_name, api_key, api_secret });
  cloudinaryConfigured = true;
  return true;
}

async function uploadToCloudinary(image: Buffer, brandId: string): Promise<string | null> {
  if (!ensureCloudinaryConfigured()) {
    console.warn("visual-identity: Cloudinary env vars absent, skipping upload");
    return null;
  }
  try {
    return await new Promise<string | null>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: `brands/${brandId}/screenshots/homepage`,
          overwrite: true,
          timeout: FETCH_TIMEOUT_MS,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result?.secure_url ?? null);
        },
      );
      uploadStream.on("error", reject);
      uploadStream.end(image);
    });
  } catch (error) {
    console.error("visual-identity: Cloudinary upload failed:", error);
    return null;
  }
}

const extractVisualIdentityTool = createTool({
  id: "extractVisualIdentity",
  description:
    "Extract visual identity from a brand's homepage via screenshot + Gemini vision",
  inputSchema: z.object({
    brandId: z.string().uuid(),
    homepageUrl: z.string().url(),
  }),
  outputSchema: z.object({
    visualIdentity: VisualIdentitySchema,
    homepageScreenshotUrl: z.string().nullable(),
    merged: z.boolean(),
  }),
  execute: async (input) => {
    const { brandId, homepageUrl } = input;
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // ponytail: service-role used here because this tool runs server-side in the Mastra
    // runtime, gated by withOperatorAuth. Verify org_id presence as ownership sanity check.
    const { data: brand, error: readError } = await supabase
      .from("brands")
      .select("ai_profile, org_id")
      .eq("id", brandId)
      .maybeSingle();

    if (readError) throw new Error(`Failed to load brand: ${readError.message}`);
    if (!brand) throw new Error(`Brand not found: ${brandId}`);
    if (!brand.org_id) throw new Error(`Brand ${brandId} has no org — cannot verify ownership`);

    const screenshot = await captureScreenshot(homepageUrl);

    let userContent: UserContent;
    if (screenshot) {
      const parts: Array<TextPart | ImagePart> = [
        { type: "text", text: `Analyze the visual identity of this brand homepage (${homepageUrl}). Return structured visual identity data.` },
        { type: "image", image: screenshot as unknown as Uint8Array, mediaType: "image/png" },
      ];
      userContent = parts;
    } else {
      userContent = `Analyze the visual identity of this brand: ${homepageUrl}. Infer from the URL and brand context. Return structured visual identity data.`;
    }

    const { object: visualIdentity } = await generateObject({
      model: MODEL,
      schema: VisualIdentitySchema,
      messages: [{ role: "user", content: userContent }],
      providerOptions: resolveProviderOptions(),
    });

    const screenshotUrl = screenshot ? await uploadToCloudinary(screenshot, brandId) : null;

    // ponytail: read-modify-write is not atomic. Concurrent agents for the same brand
    // would race; acceptable at current scale. Atomic jsonb_set RPC deferred to IPI-32 workflow.
    const existing = (brand.ai_profile as Record<string, unknown>) ?? {};
    const merged: Record<string, unknown> = {
      ...existing,
      visualIdentity: visualIdentity as VisualIdentity,
      ...(screenshotUrl ? { homepageScreenshotUrl: screenshotUrl } : {}),
    };

    const { error } = await supabase
      .from("brands")
      .update({ ai_profile: merged })
      .eq("id", brandId);

    if (error) throw new Error(`Failed to merge visual identity: ${error.message}`);

    return {
      visualIdentity: visualIdentity as VisualIdentity,
      homepageScreenshotUrl: screenshotUrl,
      merged: true,
    };
  },
});

export { extractVisualIdentityTool, uploadToCloudinary };

export const visualIdentityAgent = new Agent({
  id: "visual-identity",
  name: "Visual Identity",
  model: MODEL,
  tools: { extractVisualIdentity: extractVisualIdentityTool },
  instructions:
    "You are the iPix visual identity agent. Extract visual design properties from brand homepages using screenshots and Gemini vision. Use the extractVisualIdentity tool when given a brandId and URL.",
});
