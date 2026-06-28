import type { SupabaseClient } from "@supabase/supabase-js";

export const SUPPORTED_SOCIAL_PLATFORMS = new Set([
  "instagram",
  "tiktok",
  "youtube",
  "pinterest",
  "linkedin",
  "facebook",
  "x",
]);

export type SocialDiscoveryChannel = {
  platform: string;
  url: string | null;
  handle: string | null;
  verified: boolean;
  verification_reason: string;
  content_themes: string[];
  posting_frequency: string | null;
};

export type PersistSocialDiscoveryInput = {
  brandId: string;
  channels: SocialDiscoveryChannel[];
  startedAt?: string;
  status?: "complete" | "failed";
  error?: string;
};

export type PersistSocialDiscoveryResult =
  | { ok: true; count: number; status: "complete" }
  | { ok: false; status: "failed"; error: string; count: number };

export async function persistSocialDiscovery(
  admin: SupabaseClient,
  input: PersistSocialDiscoveryInput,
): Promise<PersistSocialDiscoveryResult> {
  const { brandId, channels = [], startedAt, status: upstreamStatus, error: upstreamError } =
    input;

  if (!brandId || typeof brandId !== "string") {
    return { ok: false, status: "failed", error: "brandId is required", count: 0 };
  }

  const completedAt = new Date().toISOString();

  const dedupedChannels = Array.from(
    new Map(
      channels
        .filter((ch) => SUPPORTED_SOCIAL_PLATFORMS.has(ch.platform))
        .map((ch) => [ch.platform, ch] as const),
    ).values(),
  );

  const rows = dedupedChannels.map((ch) => ({
    brand_id: brandId,
    platform: ch.platform,
    url: ch.url,
    handle: ch.handle,
    verified: ch.verified,
    bio: ch.verification_reason,
    content_themes: ch.content_themes ?? [],
    posting_frequency: ch.posting_frequency,
    discovered_at: completedAt,
  }));

  let status: "complete" | "failed" = upstreamStatus ?? "complete";
  let errorMessage: string | undefined = upstreamError;

  if (rows.length > 0) {
    const { error: upsertErr } = await admin
      .from("brand_social_channels")
      .upsert(rows, { onConflict: "brand_id,platform" });

    if (upsertErr) {
      status = "failed";
      errorMessage = `brand_social_channels upsert failed: ${upsertErr.message}`;
    }
  }

  const { error: logErr } = await admin.from("brand_agent_results").insert({
    brand_id: brandId,
    agent_name: "social-discovery",
    status,
    output: {
      channels_found: rows.length,
      ...(errorMessage ? { error: errorMessage } : {}),
    },
    started_at: startedAt ?? completedAt,
    completed_at: completedAt,
  });

  if (logErr) {
    console.warn("brand_agent_results insert failed:", logErr.message);
  }

  if (status === "failed") {
    return {
      ok: false,
      status: "failed",
      error: errorMessage ?? "upsert failed",
      count: rows.length,
    };
  }

  return { ok: true, count: rows.length, status: "complete" };
}
