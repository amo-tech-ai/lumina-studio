import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { generateText } from "ai";
import { resolveModel } from "../models";

export const suggestShootBriefTool = createTool({
  id: "suggestShootBrief",
  description: "Generate a shoot brief from a pre-authorized brand context and target channels.",
  inputSchema: z.object({
    brandContext: z.string().optional(),
    channels: z.array(z.string()),
    shootName: z.string(),
    briefSeed: z.string().optional(),
    tone: z.string().optional(),
  }),
  outputSchema: z.object({ brief: z.string() }),
  execute: async ({ brandContext, channels, shootName, briefSeed, tone }) => {
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
