"use client";

import { useState } from "react";
import { DeviceFramePreview } from "@/components/media/device-frame-preview";
import { cloudinaryImageUrl } from "@/lib/cloudinary/url";
import {
  PREVIEW_CHANNELS,
  type ChannelSpec,
  type PreviewChannel,
} from "@/lib/media/channel-specs";

const SAMPLE_IMAGE = cloudinaryImageUrl("5-fashionos_wc2p1c", { w: 1080, h: 1350 });

export function ChannelPreviewStudio({
  specs,
}: {
  specs: Record<PreviewChannel, ChannelSpec | null>;
}) {
  const [assetUrl, setAssetUrl] = useState(SAMPLE_IMAGE);
  const [kind, setKind] = useState<"image" | "video">("image");
  const [brandName, setBrandName] = useState("LaLueur");
  const [caption, setCaption] = useState(
    "Introducing our revolutionary facial cleansing foam — hello to a fresh, glowing complexion.",
  );
  const [showSafeZones, setShowSafeZones] = useState(false);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-medium sm:col-span-2">
          Asset URL (image or video)
          <input
            value={assetUrl}
            onChange={(e) => setAssetUrl(e.target.value)}
            placeholder="https://…"
            className="rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">
          Brand name
          <input
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            className="rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">
          Caption
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm"
          />
        </label>
        <div className="flex items-center gap-4 text-xs font-medium sm:col-span-2">
          <span className="inline-flex overflow-hidden rounded border border-[var(--border)]">
            {(["image", "video"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                className={
                  "px-3 py-1 capitalize " +
                  (kind === k
                    ? "bg-[var(--foreground)] text-[var(--background)]"
                    : "bg-[var(--background)]")
                }
              >
                {k}
              </button>
            ))}
          </span>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={showSafeZones}
              onChange={(e) => setShowSafeZones(e.target.checked)}
            />
            Show safe zones
          </label>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-8">
        {PREVIEW_CHANNELS.map((channel) => (
          <DeviceFramePreview
            key={channel}
            channel={channel}
            spec={specs[channel]}
            assetUrl={assetUrl || undefined}
            kind={kind}
            brandName={brandName}
            caption={caption}
            showSafeZones={showSafeZones}
          />
        ))}
      </div>
    </div>
  );
}
