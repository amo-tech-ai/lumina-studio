// Client-safe channel spec types + constants. Server queries live in channel-specs.server.ts.

// MI-01 seeded channel slugs (recommendation_rules.condition_value, rule_type='channel_required').
export const PREVIEW_CHANNELS = [
  "facebook",
  "instagram_feed",
  "instagram_story",
  "tiktok",
] as const;

export type PreviewChannel = (typeof PREVIEW_CHANNELS)[number];

export const CHANNEL_LABELS: Record<PreviewChannel, string> = {
  facebook: "Facebook Feed",
  instagram_feed: "Instagram Feed",
  instagram_story: "Instagram Story",
  tiktok: "TikTok",
};

// "feed" = chrome wraps the media (FB/IG post); "fullscreen" = media fills the phone (story/reel).
export type FrameLayout = "feed" | "fullscreen";

export const CHANNEL_LAYOUT: Record<PreviewChannel, FrameLayout> = {
  facebook: "feed",
  instagram_feed: "feed",
  instagram_story: "fullscreen",
  tiktok: "fullscreen",
};

// Visual fallback (width/height) used until the live image_specs row loads. Mirrors MI-01 seed.
export const CHANNEL_FALLBACK_RATIO: Record<PreviewChannel, number> = {
  facebook: 1, // 1:1
  instagram_feed: 4 / 5,
  instagram_story: 9 / 16,
  tiktok: 9 / 16,
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

