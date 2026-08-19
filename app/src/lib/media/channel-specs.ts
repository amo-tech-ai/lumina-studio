// Client-safe channel spec types + constants. Server queries live in channel-specs.server.ts.
//
// SSOT for preview: every slug here must exist as recommendation_rules.condition_value
// where rule_type='channel_required'. Grouping is derived from CHANNEL_PLATFORM — do not
// duplicate platform→placement maps in UI components. Verified 2026-08-19 against live
// project nvdlhrodvevgwdsneplk: 9 rules, including instagram_reel; no facebook_story.

export const PREVIEW_CHANNELS = [
  "instagram_feed",
  "instagram_story",
  "instagram_reel",
  "facebook",
  "tiktok",
  "pinterest",
  "youtube",
  "amazon",
  "shopify",
] as const;

export type PreviewChannel = (typeof PREVIEW_CHANNELS)[number];

export const PREVIEW_PLATFORMS = [
  "instagram",
  "facebook",
  "tiktok",
  "pinterest",
  "youtube",
  "amazon",
  "shopify",
] as const;

export type PreviewPlatform = (typeof PREVIEW_PLATFORMS)[number];

export const CHANNEL_PLATFORM: Record<PreviewChannel, PreviewPlatform> = {
  instagram_feed: "instagram",
  instagram_story: "instagram",
  instagram_reel: "instagram",
  facebook: "facebook",
  tiktok: "tiktok",
  pinterest: "pinterest",
  youtube: "youtube",
  amazon: "amazon",
  shopify: "shopify",
};

export const PLATFORM_LABELS: Record<PreviewPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  pinterest: "Pinterest",
  youtube: "YouTube",
  amazon: "Amazon",
  shopify: "Shopify",
};

export const CHANNEL_LABELS: Record<PreviewChannel, string> = {
  instagram_feed: "Instagram Feed",
  instagram_story: "Instagram Story",
  instagram_reel: "Instagram Reel",
  facebook: "Facebook Feed",
  tiktok: "TikTok",
  pinterest: "Pinterest",
  youtube: "YouTube",
  amazon: "Amazon",
  shopify: "Shopify",
};

// "feed" = chrome wraps the media (FB/IG post); "fullscreen" = media fills the phone
// (story/reel/tiktok); "generic" = aspect-ratio frame, no bespoke platform chrome.
export type FrameLayout = "feed" | "fullscreen" | "generic";

export const CHANNEL_LAYOUT: Record<PreviewChannel, FrameLayout> = {
  instagram_feed: "feed",
  instagram_story: "fullscreen",
  instagram_reel: "fullscreen",
  facebook: "feed",
  tiktok: "fullscreen",
  pinterest: "generic",
  youtube: "generic",
  amazon: "generic",
  shopify: "generic",
};

// Visual box shape only when a spec row is missing. Ratios match the live image_specs
// seed — captions still say "No spec available" and never display these as spec data.
export const CHANNEL_FALLBACK_RATIO: Record<PreviewChannel, number> = {
  instagram_feed: 4 / 5,
  instagram_story: 9 / 16,
  instagram_reel: 9 / 16,
  facebook: 1,
  tiktok: 9 / 16,
  pinterest: 2 / 3,
  youtube: 16 / 9,
  amazon: 1,
  shopify: 1,
};

export type ChannelSpec = {
  channel: PreviewChannel;
  platformSlug: string;
  platformName: string;
  imageTypeSlug: string;
  imageTypeName: string;
  widthPx: number;
  heightPx: number;
  aspectRatioW: number | null;
  aspectRatioH: number | null;
  aspectRatioLabel: string | null;
  acceptedFormats: string[];
  maxFileSizeMb: number | null;
  safeZone: { top: number; bottom: number; left: number; right: number };
  organic: boolean;
  paid: boolean;
  shoppingSupport: boolean;
  cropNotes: string | null;
};

export function channelsForPlatform(
  platform: PreviewPlatform,
): PreviewChannel[] {
  return PREVIEW_CHANNELS.filter((c) => CHANNEL_PLATFORM[c] === platform);
}

export function emptyChannelSpecs(): Record<PreviewChannel, ChannelSpec | null> {
  return Object.fromEntries(PREVIEW_CHANNELS.map((c) => [c, null])) as Record<
    PreviewChannel,
    ChannelSpec | null
  >;
}
