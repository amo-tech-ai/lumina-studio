import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { Agent } from "@mastra/core/agent";
import { createTool } from "@mastra/core/tools";
import { generateObject } from "ai";
import type { UserContent, ImagePart, TextPart } from "ai";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { resolveGeminiModel } from "@/mastra/models";

const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
const GEMINI_MODEL = resolveGeminiModel();

const VisualIdentitySchema = z.object({
  primaryColors: z.array(z.string()).describe("Primary hex colors"),
  secondaryColors: z.array(z.string()).describe("Secondary/accent hex colors"),
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

async function captureScreenshot(homepageUrl: string): Promise<Uint8Array | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ url: homepageUrl, formats: ["screenshot"] }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { data?: { screenshot?: string } };
    const b64 = data?.data?.screenshot;
    if (!b64) return null;
    const stripped = b64.replace(/^data:image\/\w+;base64,/, "");
    return Uint8Array.from(atob(stripped), (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

async function uploadToCloudinary(image: Uint8Array, brandId: string): Promise<string | null> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    console.warn("visual-identity: Cloudinary env vars absent, skipping upload");
    return null;
  }
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const publicId = `brands/${brandId}/screenshots/homepage`;
    const crypto = await import("crypto");
    const signature = crypto
      .createHash("sha1")
      .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
      .digest("hex");

    const form = new FormData();
    form.append("file", new Blob([image.buffer as ArrayBuffer], { type: "image/png" }), "screenshot.png");
    form.append("public_id", publicId);
    form.append("timestamp", String(timestamp));
    form.append("api_key", apiKey);
    form.append("signature", signature);
    form.append("overwrite", "true");

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) return null;
    const result = (await res.json()) as { secure_url?: string };
    return result.secure_url ?? null;
  } catch {
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

    const screenshot = await captureScreenshot(homepageUrl);

    let userContent: UserContent;
    if (screenshot) {
      const parts: Array<TextPart | ImagePart> = [
        { type: "text", text: `Analyze the visual identity of this brand homepage (${homepageUrl}). Return structured visual identity data.` },
        { type: "image", image: screenshot.buffer as ArrayBuffer, mediaType: "image/png" },
      ];
      userContent = parts;
    } else {
      userContent = `Analyze the visual identity of this brand: ${homepageUrl}. Infer from the URL and brand context. Return structured visual identity data.`;
    }

    const { object: visualIdentity } = await generateObject({
      model: google(GEMINI_MODEL),
      schema: VisualIdentitySchema,
      messages: [{ role: "user", content: userContent }],
    });

    const screenshotUrl = screenshot ? await uploadToCloudinary(screenshot, brandId) : null;

    const { data: brand } = await supabase
      .from("brands")
      .select("ai_profile")
      .eq("id", brandId)
      .maybeSingle();

    const existing = (brand?.ai_profile as Record<string, unknown>) ?? {};
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

export { extractVisualIdentityTool };

export const visualIdentityAgent = new Agent({
  id: "visual-identity",
  name: "Visual Identity",
  model: google(GEMINI_MODEL),
  tools: { extractVisualIdentity: extractVisualIdentityTool },
  instructions:
    "You are the iPix visual identity agent. Extract visual design properties from brand homepages using screenshots and Gemini vision. Use the extractVisualIdentity tool when given a brandId and URL.",
});
