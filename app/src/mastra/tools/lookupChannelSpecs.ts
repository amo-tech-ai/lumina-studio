// IPI-187 · MI-02 — lookupChannelSpecs Mastra tool
// Resolves channel slugs → exact image_spec rows via the recommendation_rules bridge.
// READ tool — uses service-role client directly (Mastra tools have no Next.js cookie context
// so createSupabaseServerClient() is unavailable; same pattern as lookupShotReferences).

import { createTool } from "@mastra/core/tools";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { PREVIEW_CHANNELS } from "@/lib/media/channel-specs";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars missing");
  return createClient(url, key, { auth: { persistSession: false } });
}

const SpecSchema = z.object({
  channel: z.string(),
  platformSlug: z.string(),
  platformName: z.string(),
  imageTypeSlug: z.string(),
  imageTypeName: z.string(),
  widthPx: z.number(),
  heightPx: z.number(),
  aspectRatioW: z.number().nullable(),
  aspectRatioH: z.number().nullable(),
  aspectRatioLabel: z.string().nullable(),
  acceptedFormats: z.array(z.string()),
  maxFileSizeMb: z.number().nullable(),
  safeZone: z.object({
    top: z.number().nullable(),
    bottom: z.number().nullable(),
    left: z.number().nullable(),
    right: z.number().nullable(),
  }),
  organic: z.boolean(),
  paid: z.boolean(),
  shoppingSupport: z.boolean(),
  cropNotes: z.string().nullable(),
});

const ResultSchema = z.object({
  channel: z.string(),
  spec: SpecSchema.nullable(),
  warning: z.string().optional(),
});

type SpecRow = {
  width_px: number; height_px: number;
  aspect_ratio_w: number | null; aspect_ratio_h: number | null; aspect_ratio_label: string | null;
  accepted_formats: string[]; max_file_size_mb: number | null;
  safe_zone_top_px: number | null; safe_zone_bottom_px: number | null;
  safe_zone_left_px: number | null; safe_zone_right_px: number | null;
  organic: boolean; paid: boolean; shopping_support: boolean; crop_notes: string | null;
  last_verified_at: string | null;
  platforms: { slug: string; name: string } | null;
  image_type_defs: { slug: string; name: string } | null;
};

const KNOWN_CHANNELS = new Set<string>(PREVIEW_CHANNELS);

export const lookupChannelSpecs = createTool({
  id: "lookupChannelSpecs",
  description:
    "Fetch exact image specs (dimensions, formats, file size limits) for one or more platform channels from the iPix spec database. " +
    `Known channels: ${PREVIEW_CHANNELS.join(", ")}. ` +
    "Unknown channels return null — never fabricates specs. " +
    "Use before recommending image sizes or flagging spec mismatches.",
  inputSchema: z.object({
    channels: z
      .array(z.string())
      .min(1)
      .describe(`Channel slugs to look up. Seeded values: ${PREVIEW_CHANNELS.join(", ")}`),
  }),
  outputSchema: z.object({
    results: z.array(ResultSchema),
  }),
  execute: async ({ channels }) => {
    const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
    // Instantiate once per execute call, and only when at least one known channel needs it.
    const supabase = channels.some((c) => KNOWN_CHANNELS.has(c)) ? getAdminClient() : null;

    const results = await Promise.all(
      channels.map(async (channel) => {
        if (!KNOWN_CHANNELS.has(channel)) {
          return { channel, spec: null, warning: `Unknown channel "${channel}" — not in seeded spec table` };
        }

        const { data: rule, error: ruleErr } = await supabase!
          .from("recommendation_rules")
          .select("image_type_slugs, platform_slugs")
          .eq("rule_type", "channel_required")
          .eq("condition_value", channel)
          .maybeSingle();

        if (ruleErr) throw new Error(`lookupChannelSpecs rule error for "${channel}": ${ruleErr.message}`);
        if (!rule?.image_type_slugs?.length || !rule?.platform_slugs?.length) {
          return { channel, spec: null, warning: `No recommendation rule found for "${channel}"` };
        }

        const { data: row, error } = await supabase!
          .from("image_specs")
          .select(
            "width_px, height_px, aspect_ratio_w, aspect_ratio_h, aspect_ratio_label, accepted_formats, max_file_size_mb, safe_zone_top_px, safe_zone_bottom_px, safe_zone_left_px, safe_zone_right_px, organic, paid, shopping_support, crop_notes, last_verified_at, platforms!inner(slug, name), image_type_defs!inner(slug, name)",
          )
          .in("platforms.slug", rule.platform_slugs)
          .in("image_type_defs.slug", rule.image_type_slugs)
          .maybeSingle<SpecRow>();

        if (error) throw new Error(`lookupChannelSpecs DB error for "${channel}": ${error.message}`);
        if (!row?.platforms || !row?.image_type_defs) {
          return { channel, spec: null, warning: `Spec row not found for "${channel}"` };
        }

        const stale =
          !row.last_verified_at ||
          Date.now() - new Date(row.last_verified_at).getTime() > NINETY_DAYS_MS;
        const warning = stale
          ? `Spec for "${channel}" may be outdated (last verified: ${row.last_verified_at ?? "never"})`
          : undefined;

        return {
          channel,
          spec: {
            channel,
            platformSlug: row.platforms.slug,
            platformName: row.platforms.name,
            imageTypeSlug: row.image_type_defs.slug,
            imageTypeName: row.image_type_defs.name,
            widthPx: row.width_px,
            heightPx: row.height_px,
            aspectRatioW: row.aspect_ratio_w,
            aspectRatioH: row.aspect_ratio_h,
            aspectRatioLabel: row.aspect_ratio_label,
            acceptedFormats: row.accepted_formats ?? [],
            maxFileSizeMb: row.max_file_size_mb,
            safeZone: {
              top: row.safe_zone_top_px,
              bottom: row.safe_zone_bottom_px,
              left: row.safe_zone_left_px,
              right: row.safe_zone_right_px,
            },
            organic: row.organic,
            paid: row.paid,
            shoppingSupport: row.shopping_support,
            cropNotes: row.crop_notes,
          },
          ...(warning ? { warning } : {}),
        };
      }),
    );

    return { results };
  },
});
