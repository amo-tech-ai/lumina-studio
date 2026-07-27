/**
 * IPI-833 — sales channel marks for screen 5.
 *
 * These hex values are third-party BRAND colours (Instagram's gradient, Shopify
 * green, and so on). They are deliberately not design tokens: aliasing someone
 * else's brand mark into our palette would be wrong, and re-theming them would
 * make the logos unrecognisable.
 *
 * This file is the single documented exception to the "no raw hex under
 * onboarding" rule, and the token test allowlists it by path. Adding a colour
 * here should be a deliberate act a reviewer questions.
 *
 * Source: Universal-design-prompt-4/Pages/Onboarding.v2.zeely.dc.html line 530.
 */
export type SalesChannel = {
  id: string;
  label: string;
  glyph: string;
  /** CSS background for the mark — a brand colour or gradient, never a token. */
  background: string;
};

export const SALES_CHANNELS: readonly SalesChannel[] = [
  {
    id: "ig",
    label: "Instagram",
    glyph: "◎",
    background: "linear-gradient(45deg,#f9ce34,#ee2a7b,#6228d7)",
  },
  { id: "fb", label: "Facebook", glyph: "f", background: "#1877F2" },
  { id: "shopify", label: "Shopify", glyph: "S", background: "#95BF47" },
  { id: "web", label: "My own website", glyph: "◍", background: "#6B7280" },
  { id: "tiktok", label: "TikTok", glyph: "♪", background: "#000000" },
  { id: "etsy", label: "Etsy", glyph: "E", background: "#F1641E" },
  { id: "amazon", label: "Amazon", glyph: "a", background: "#232F3E" },
  { id: "ebay", label: "eBay", glyph: "e", background: "#E53238" },
] as const;
