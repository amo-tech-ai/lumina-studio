import { recentFallbackForShoot } from "./sample-images";
import type { RecentShoot } from "./types";

const FALLBACK_DEFS = [
  { name: "Spring hero", channel: "IG", dnaScore: 94 },
  { name: "Carousel 02", channel: "IG", dnaScore: 88 },
  { name: "Story cut", channel: "Reel", dnaScore: 76 },
  { name: "Lookbook", channel: "IG", dnaScore: 91 },
  { name: "Try-on", channel: "Video", dnaScore: 82 },
] as const;

const DC_RECENT_WORK_COUNT = 5;

/** DC Command Center populated row when no shoots exist yet (visual placeholders only). */
export function commandCenterRecentFallbacks(brandId: string): RecentShoot[] {
  return FALLBACK_DEFS.map((item, index) => ({
    id: `fallback-${brandId}-${index}`,
    name: item.name,
    status: "preview",
    dnaScore: item.dnaScore,
    channel: item.channel,
    updatedAt: new Date(Date.now() - index * 86_400_000).toISOString(),
    imageUrl: recentFallbackForShoot(`${brandId}-${index}`, index),
  }));
}

export function resolveRecentWorkItems(
  recentShoots: RecentShoot[],
  heroBrandId: string | undefined,
): RecentShoot[] {
  if (!heroBrandId) return recentShoots.slice(0, DC_RECENT_WORK_COUNT);

  const fallbacks = commandCenterRecentFallbacks(heroBrandId);
  if (recentShoots.length === 0) return fallbacks;

  const merged = [...recentShoots];
  for (const tile of fallbacks) {
    if (merged.length >= DC_RECENT_WORK_COUNT) break;
    if (merged.some((row) => row.id === tile.id)) continue;
    merged.push(tile);
  }

  return merged.slice(0, DC_RECENT_WORK_COUNT);
}

export function isRecentWorkFallback(id: string): boolean {
  return id.startsWith("fallback-");
}
