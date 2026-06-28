// IPI-27 — Social Discovery tool (agentTools registry entry)
// READ: queries Supabase with service-role (server-side trusted context)
// WRITE: delegates to social-discovery edge function via callEdgeFunction (IPI2-84/116)

import { generateObject } from "ai";
import { createTool } from "@mastra/core/tools";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { resolveModel, resolveProviderOptions } from "@/mastra/models";
import { callEdgeFunction } from "./edge";

const MODEL = resolveModel();

const SUPPORTED_PLATFORMS = [
  "instagram",
  "tiktok",
  "youtube",
  "pinterest",
  "linkedin",
  "facebook",
  "x",
] as const;

const ChannelSchema = z.object({
  platform: z.enum(SUPPORTED_PLATFORMS),
  url: z
    .string()
    .url()
    .refine((u) => /^https?:\/\//i.test(u), { message: "Only http(s) URLs allowed" })
    .nullable(),
  handle: z.string().nullable(),
  verified: z.boolean(),
  verification_reason: z.string(),
  content_themes: z.array(z.string()),
  posting_frequency: z
    .enum(["daily", "weekly", "monthly", "unknown"])
    .nullable(),
});

const DiscoveryResultSchema = z.object({
  channels: z.array(ChannelSchema),
});

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars not set");
  return createClient(url, key, { auth: { persistSession: false } });
}

export const discoverSocialChannelsTool = createTool({
  id: "discoverSocialChannels",
  description:
    "Discover and verify a brand's official social channels from crawl data and search grounding.",
  inputSchema: z.object({ brandId: z.string().uuid() }),
  execute: async ({ brandId }) => {
    const supabase = getAdminClient();
    const startedAt = new Date().toISOString();

    // READ: load brand + latest crawl data (direct Supabase, no edge layer needed for reads)
    const [{ data: brand, error: brandErr }, { data: crawlRows, error: crawlErr }] =
      await Promise.all([
        supabase
          .from("brands")
          .select("id, name, brand_url, ai_profile")
          .eq("id", brandId)
          .maybeSingle(),
        supabase
          .from("brand_crawls")
          .select("job_status, pages_crawled, raw_data")
          .eq("brand_id", brandId)
          .order("created_at", { ascending: false })
          .limit(1),
      ]);

    if (brandErr || !brand) {
      throw new Error(`Brand ${brandId} not found: ${brandErr?.message}`);
    }
    if (crawlErr) {
      throw new Error(`Failed to load crawl data: ${crawlErr.message}`);
    }

    const crawlSummary = crawlRows?.[0]
      ? `Crawl status: ${crawlRows[0].job_status}, pages: ${crawlRows[0].pages_crawled}`
      : "No crawl data available";

    const aiProfile = brand.ai_profile as Record<string, unknown> | null;
    const profileSummary = aiProfile
      ? `Category: ${aiProfile.category ?? "unknown"}, Description: ${aiProfile.description ?? "unknown"}`
      : "No AI profile yet";

    const prompt = `You are a brand intelligence agent. Discover the official social media channels for the brand below.
Use Google Search to find and verify official accounts. Avoid fan pages, parody accounts, and resellers.

Brand: ${brand.name}
Website: ${brand.brand_url ?? "unknown"}
${profileSummary}
${crawlSummary}

For each supported platform (instagram, tiktok, youtube, pinterest, linkedin, facebook, x):
- Find the official account URL and handle if it exists
- Set verified=true only if you are confident it is the official brand account
- Give a brief verification_reason explaining your confidence
- List 2-4 content themes based on what you observe
- Estimate posting_frequency if detectable (daily/weekly/monthly/unknown)
- Only include platforms where you found a likely official account

Return URLs as full https:// URLs only.`;

    let channels: z.infer<typeof ChannelSchema>[] = [];
    let status: "complete" | "failed" = "complete";
    let errorMessage: string | undefined;

    try {
      const result = await generateObject({
        model: MODEL,
        schema: DiscoveryResultSchema,
        prompt,
        providerOptions: resolveProviderOptions(),
      });
      channels = Array.from(
        new Map(
          result.object.channels
            .filter(
              (ch) =>
                ch.verified &&
                (ch.url || ch.handle) &&
                // Strip non-https URLs even if Zod refine is bypassed (e.g. in tests)
                (ch.url === null || /^https?:\/\//i.test(ch.url)),
            )
            .map((ch) => [ch.platform, ch] as [string, typeof ch]),
        ).values(),
      );
    } catch (err) {
      status = "failed";
      errorMessage = err instanceof Error ? err.message : String(err);
    }

    // WRITE: always call edge fn so every run is auditable (even 0-channel runs).
    // Edge fn returns 500 when status="failed" (upsert error path) — catch so a
    // Gemini failure that already set status="failed" doesn't double-fault here.
    try {
      await callEdgeFunction(
        "social-discovery",
        { brandId, channels, startedAt, status, ...(errorMessage ? { error: errorMessage } : {}) },
        { accessToken: process.env.SUPABASE_SERVICE_ROLE_KEY },
      );
    } catch (edgeErr) {
      console.warn("social-discovery edge fn call failed:", edgeErr instanceof Error ? edgeErr.message : String(edgeErr));
    }

    return {
      brandId,
      channelsFound: channels.length,
      channels,
      status,
      ...(errorMessage ? { error: errorMessage } : {}),
    };
  },
});
