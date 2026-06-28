import { createTool } from "@mastra/core/tools";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { generateText } from "ai";
import { resolveModel } from "../models";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service-role env vars not set");
  return createClient(url, key, { auth: { persistSession: false } });
}

export const suggestShootBriefTool = createTool({
  id: "suggestShootBrief",
  description: "Generate a shoot brief from a brand's AI profile and target channels.",
  inputSchema: z.object({
    brandId: z.string().uuid().optional(),
    channels: z.array(z.string()),
    shootName: z.string(),
    briefSeed: z.string().optional(),
    tone: z.string().optional(),
  }),
  outputSchema: z.object({ brief: z.string() }),
  execute: async ({ brandId, channels, shootName, briefSeed, tone }) => {
    let brandContext = "";
    if (brandId) {
      const { data, error } = await adminClient()
        .from("brands")
        .select("name, brand_url, ai_profile")
        .eq("id", brandId)
        .single();
      if (error) throw new Error(`Brand lookup failed: ${error.message}`);
      if (data) {
        const profile = data.ai_profile as Record<string, unknown> | null;
        brandContext = [
          `Brand: ${data.name}`,
          data.brand_url ? `URL: ${data.brand_url}` : "",
          profile?.overview ? `Overview: ${profile.overview}` : "",
          profile?.tagline ? `Tagline: ${profile.tagline}` : "",
          profile?.targetAudience ? `Target audience: ${profile.targetAudience}` : "",
          profile?.brandVoice ? `Brand voice: ${profile.brandVoice}` : "",
          profile?.uvp ? `UVP: ${profile.uvp}` : "",
        ].filter(Boolean).join("\n");
      }
    }

    const channelList = channels.join(", ") || "unspecified channels";
    const taskLine = briefSeed
      ? `Expand and complete this partial brief into 3–5 polished sentences:\n"${briefSeed}"`
      : `Write a concise, inspiring shoot brief (3–5 sentences) for a photography/video shoot.`;
    const toneLine = tone ? `\nAdjust the tone to be: ${tone}.` : "";
    const { text } = await generateText({
      model: resolveModel(),
      prompt: `You are a creative director writing a shoot brief. ${taskLine}

${brandContext ? `Brand context:\n${brandContext}\n` : ""}Shoot name: ${shootName}
Target channels: ${channelList}
${toneLine}
Write in first person from the brand's perspective. Focus on vision, tone, products/subject matter, and campaign goals. Be specific and actionable. Output only the brief text, no headings or labels.`,
      maxOutputTokens: 300,
    });

    return { brief: text.trim() };
  },
});
