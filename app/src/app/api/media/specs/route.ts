// IPI-189 — thin read route for shoot wizard channel specs
// Accepts: GET /api/media/specs?channels=instagram_feed,tiktok&publicId=<cloudinary-id>
// Returns: { results: Array<{ channel: string; spec: ChannelSpec | null; previewUrl: string | null }> }
import { NextResponse } from "next/server";
import { withOperatorAuth, OperatorAuthError } from "@/lib/operator-gate";
import { getChannelSpec } from "@/lib/media/channel-specs.server";
import { cloudinarySignedChannelUrl } from "@/lib/cloudinary/signed-url";

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
  // 074e — optional preview: when a publicId is supplied, include a channel-cropped
  // Cloudinary URL alongside the numeric spec (data-driven, not a per-channel preset).
  const publicId = searchParams.get("publicId");

  if (!channels.length) {
    return NextResponse.json({ results: [] });
  }

  // getChannelSpec returns null for unknown channels; throws on DB errors.
  // Propagate throws so frontend can distinguish "no spec" from "backend down".
  const results = await Promise.all(
    channels.map(async (channel) => {
      const spec = await getChannelSpec(channel as never);
      const previewUrl = publicId && spec ? cloudinarySignedChannelUrl(publicId, spec) : null;
      return { channel, spec, previewUrl };
    }),
  );

  return NextResponse.json({ results });
}
