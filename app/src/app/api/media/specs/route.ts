// IPI-189 — thin read route for shoot wizard channel specs
// Accepts: GET /api/media/specs?channels=instagram_feed,tiktok
// Returns: { results: Array<{ channel: string; spec: ChannelSpec | null }> }
import { NextResponse } from "next/server";
import { withOperatorAuth, OperatorAuthError } from "@/lib/operator-gate";
import { getChannelSpec } from "@/lib/media/channel-specs.server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await withOperatorAuth(request);
  } catch (e) {
    if (e instanceof OperatorAuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw e;
  }

  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("channels") ?? "";
  const channels = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!channels.length) {
    return NextResponse.json({ results: [] });
  }

  // getChannelSpec returns null for unknown channels; throws on DB errors.
  // Propagate throws so frontend can distinguish "no spec" from "backend down".
  const results = await Promise.all(
    channels.map(async (channel) => ({
      channel,
      spec: await getChannelSpec(channel as never),
    })),
  );

  return NextResponse.json({ results });
}
