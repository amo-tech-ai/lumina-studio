import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  PREVIEW_CHANNELS,
  type ChannelSpec,
  type PreviewChannel,
} from "@/lib/media/channel-specs";

type SpecRow = {
  width_px: number;
  height_px: number;
  aspect_ratio_w: number | null;
  aspect_ratio_h: number | null;
  aspect_ratio_label: string | null;
  accepted_formats: string[];
  max_file_size_mb: number | null;
  safe_zone_top_px: number | null;
  safe_zone_bottom_px: number | null;
  safe_zone_left_px: number | null;
  safe_zone_right_px: number | null;
  organic: boolean;
  paid: boolean;
  shopping_support: boolean;
  crop_notes: string | null;
  platforms: { slug: string; name: string } | null;
  image_type_defs: { slug: string; name: string } | null;
};

// Resolve a channel → its image_spec via the recommendation_rules bridge (MI-02 read path).
export async function getChannelSpec(
  channel: PreviewChannel,
): Promise<ChannelSpec | null> {
  const supabase = await createSupabaseServerClient();

  const { data: rule, error: ruleError } = await supabase
    .from("recommendation_rules")
    .select("image_type_slugs, platform_slugs")
    .eq("rule_type", "channel_required")
    .eq("condition_value", channel)
    .maybeSingle();

  // Distinguish a real DB failure from "no rule seeded" — both yield null data otherwise.
  if (ruleError) {
    console.error(`[channel-specs] rule fetch (${channel}):`, ruleError);
    return null;
  }
  if (!rule?.image_type_slugs?.length || !rule?.platform_slugs?.length) {
    return null;
  }

  const { data: spec, error: specError } = await supabase
    .from("image_specs")
    .select(
      "width_px, height_px, aspect_ratio_w, aspect_ratio_h, aspect_ratio_label, accepted_formats, max_file_size_mb, safe_zone_top_px, safe_zone_bottom_px, safe_zone_left_px, safe_zone_right_px, organic, paid, shopping_support, crop_notes, platforms!inner(slug, name), image_type_defs!inner(slug, name)",
    )
    .in("platforms.slug", rule.platform_slugs)
    .in("image_type_defs.slug", rule.image_type_slugs)
    // Deterministic pick when multiple specs match: largest representative, id as final tiebreak.
    .order("width_px", { ascending: false })
    .order("height_px", { ascending: false })
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle<SpecRow>();

  if (specError) {
    console.error(`[channel-specs] spec fetch (${channel}):`, specError);
    return null;
  }
  if (!spec?.platforms || !spec?.image_type_defs) return null;

  return {
    channel,
    platformSlug: spec.platforms.slug,
    platformName: spec.platforms.name,
    imageTypeSlug: spec.image_type_defs.slug,
    imageTypeName: spec.image_type_defs.name,
    widthPx: spec.width_px,
    heightPx: spec.height_px,
    aspectRatioW: spec.aspect_ratio_w,
    aspectRatioH: spec.aspect_ratio_h,
    aspectRatioLabel: spec.aspect_ratio_label,
    acceptedFormats: spec.accepted_formats ?? [],
    maxFileSizeMb: spec.max_file_size_mb,
    safeZone: {
      top: spec.safe_zone_top_px ?? 0,
      bottom: spec.safe_zone_bottom_px ?? 0,
      left: spec.safe_zone_left_px ?? 0,
      right: spec.safe_zone_right_px ?? 0,
    },
    organic: spec.organic,
    paid: spec.paid,
    shoppingSupport: spec.shopping_support,
    cropNotes: spec.crop_notes,
  };
}

export async function getAllChannelSpecs(): Promise<
  Record<PreviewChannel, ChannelSpec | null>
> {
  const entries = await Promise.all(
    PREVIEW_CHANNELS.map(async (c) => [c, await getChannelSpec(c)] as const),
  );
  return Object.fromEntries(entries) as Record<
    PreviewChannel,
    ChannelSpec | null
  >;
}
