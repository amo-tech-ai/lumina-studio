// IPI-189 — thin read route for shoot wizard channel specs
// Accepts: GET /api/media/specs?channels=instagram_feed,tiktok
// Returns: { results: Array<{ channel: string; spec: ChannelSpec | null }> }
import { NextResponse } from "next/server";
import { getChannelSpec } from "@/lib/media/channel-specs.server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("channels") ?? "";
  const channels = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!channels.length) {
    return NextResponse.json({ results: [] });
  }

  const results = await Promise.all(
    channels.map(async (channel) => ({
      channel,
      spec: await getChannelSpec(channel as never).catch(() => null),
    })),
  );

  return NextResponse.json({ results });
}
