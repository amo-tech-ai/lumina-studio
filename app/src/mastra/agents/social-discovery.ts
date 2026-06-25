import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { Agent } from "@mastra/core/agent";
import { createTool } from "@mastra/core/tools";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { resolveGeminiModel } from "@/mastra/models";

const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
const GEMINI_MODEL = resolveGeminiModel();

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
  url: z.string().url().nullable(),
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

export const discoverSocialChannels = createTool({
  id: "discoverSocialChannels",
  description:
    "Discover and verify a brand's official social channels from crawl data and search grounding.",
  inputSchema: z.object({ brandId: z.string().uuid() }),
  execute: async ({ brandId }) => {
    const supabase = getAdminClient();
    const startedAt = new Date().toISOString();

    // Load brand + latest crawl data
    const [{ data: brand, error: brandErr }, { data: crawlRows, error: crawlErr }] =
      await Promise.all([
        supabase
          .from("brands")
          .select("id, name, brand_url, ai_profile")
          .eq("id", brandId)
          .maybeSingle(),
        supabase
          .from("brand_crawl_results")
          .select("raw_data, status, pages_crawled")
          .eq("brand_id", brandId)
          .order("created_at", { ascending: false })
          .limit(1),
      ]);

    if (brandErr || !brand) {
      throw new Error(`Brand ${brandId} not found: ${brandErr?.message}`);
    }

    if (crawlErr) {
      throw new Error(`Failed to load crawl data for brand ${brandId}: ${crawlErr.message}`);
    }

    const crawlSummary = crawlRows?.[0]
      ? `Crawl status: ${crawlRows[0].status}, pages: ${crawlRows[0].pages_crawled}`
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
- If no account exists or cannot be found, omit that platform (do not include unverified guesses)

Return only platforms where you found a likely official account.`;

    let channels: z.infer<typeof ChannelSchema>[] = [];
    let status: "complete" | "failed" = "complete";
    let errorMessage: string | undefined;

    try {
      const result = await generateObject({
        // ponytail: search grounding via providerOptions when @ai-sdk/google v3 API is confirmed
        model: google(GEMINI_MODEL),
        schema: DiscoveryResultSchema,
        prompt,
      });
      // Deduplicate by platform, keep only verified entries with a URL or handle
      channels = Array.from(
        new Map(
          result.object.channels
            .filter((ch) => ch.verified && (ch.url || ch.handle))
            .map((ch) => [ch.platform, ch] as [string, typeof ch]),
        ).values(),
      );
    } catch (err) {
      status = "failed";
      errorMessage = err instanceof Error ? err.message : String(err);
    }

    const completedAt = new Date().toISOString();

    // Upsert channels (UNIQUE brand_id, platform)
    if (channels.length > 0) {
      const rows = channels.map((ch) => ({
        brand_id: brandId,
        platform: ch.platform,
        url: ch.url,
        handle: ch.handle,
        verified: ch.verified,
        bio: ch.verification_reason,
        content_themes: ch.content_themes,
        posting_frequency: ch.posting_frequency,
        discovered_at: completedAt,
      }));

      const { error: upsertErr } = await supabase
        .from("brand_social_channels")
        .upsert(rows, { onConflict: "brand_id,platform" });

      if (upsertErr) {
        status = "failed";
        errorMessage = `brand_social_channels upsert failed: ${upsertErr.message}`;
      }
    }

    // Log run to brand_agent_results
    const { error: resultErr } = await supabase.from("brand_agent_results").insert({
      brand_id: brandId,
      agent_name: "social-discovery",
      status,
      output: { channels_found: channels.length, channels, ...(errorMessage ? { error: errorMessage } : {}) },
      started_at: startedAt,
      completed_at: completedAt,
    });

    if (resultErr) {
      throw new Error(`brand_agent_results insert failed: ${resultErr.message}`);
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

export const socialDiscoveryAgent = new Agent({
  id: "social-discovery",
  name: "Social Discovery",
  model: google(GEMINI_MODEL),
  tools: { discoverSocialChannels },
  instructions:
    "You are the iPix social discovery agent. Given a brandId, call discoverSocialChannels to find the brand's official social media accounts and save them to the database.",
});
