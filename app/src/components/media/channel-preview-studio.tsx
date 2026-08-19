"use client";

import { useState } from "react";
import { DeviceFramePreview } from "@/components/media/device-frame-preview";
import { PlatformBrandIcon } from "@/components/media/platform-icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cloudinaryImageUrl } from "@/lib/cloudinary/url";
import {
  PLATFORM_LABELS,
  PREVIEW_PLATFORMS,
  channelsForPlatform,
  type ChannelSpec,
  type PreviewChannel,
  type PreviewPlatform,
} from "@/lib/media/channel-specs";

const SAMPLE_IMAGE = cloudinaryImageUrl("5-fashionos_wc2p1c", { w: 1080, h: 1350 });
const DEFAULT_PLATFORMS: PreviewPlatform[] = ["instagram"];

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
  const [selectedPlatforms, setSelectedPlatforms] =
    useState<PreviewPlatform[]>(DEFAULT_PLATFORMS);
  const [activePlatform, setActivePlatform] =
    useState<PreviewPlatform>("instagram");

  const selectedInOrder = PREVIEW_PLATFORMS.filter((p) =>
    selectedPlatforms.includes(p),
  );
  const resolvedPlatform =
    selectedInOrder.find((p) => p === activePlatform) ?? selectedInOrder[0];

  function togglePlatform(platform: PreviewPlatform) {
    setSelectedPlatforms((current) =>
      current.includes(platform)
        ? current.filter((p) => p !== platform)
        : [...current, platform],
    );
  }

  return (
    <div className="max-w-full space-y-6 overflow-x-hidden">
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
                type="button"
                aria-pressed={kind === k}
                onClick={() => setKind(k)}
                className={
                  "min-h-10 px-3 py-1 capitalize " +
                  (kind === k
                    ? "bg-[var(--foreground)] text-[var(--background)]"
                    : "bg-[var(--background)]")
                }
              >
                {k}
              </button>
            ))}
          </span>
          <label className="flex min-h-10 items-center gap-1.5">
            <input
              type="checkbox"
              checked={showSafeZones}
              onChange={(e) => setShowSafeZones(e.target.checked)}
            />
            Show safe zones
          </label>
        </div>
      </div>

      <fieldset className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-4">
        <legend className="px-1 text-sm font-semibold">Platforms</legend>
        <p className="mb-3 text-xs text-[var(--muted-foreground)]">
          Pick a platform, then switch its tab to see every verified placement.
        </p>
        <div className="flex flex-wrap gap-2">
          {PREVIEW_PLATFORMS.map((platform) => {
            const count = channelsForPlatform(platform).length;
            const checked = selectedPlatforms.includes(platform);
            return (
              <label
                key={platform}
                className="flex min-h-10 cursor-pointer items-center gap-2 rounded-md border border-[var(--border)] px-3 py-1.5 text-sm"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => togglePlatform(platform)}
                />
                <span aria-hidden="true">
                  <PlatformBrandIcon platform={platform} className="size-4" />
                </span>
                {PLATFORM_LABELS[platform]}
                <span aria-hidden="true" className="text-xs text-[var(--muted-foreground)]">
                  {count}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {selectedInOrder.length === 0 || !resolvedPlatform ? (
        <p className="rounded-[var(--radius)] border border-dashed border-[var(--border)] p-6 text-sm text-[var(--muted-foreground)]">
          Select a platform to preview its placements.
        </p>
      ) : (
        <Tabs
          value={resolvedPlatform}
          onValueChange={(value) =>
            setActivePlatform(value as PreviewPlatform)
          }
        >
          <TabsList
            aria-label="Selected platforms"
            className="flex h-auto min-h-10 w-full flex-wrap justify-start gap-1"
          >
            {selectedInOrder.map((platform) => (
              <TabsTrigger
                key={platform}
                value={platform}
                className="min-h-10 gap-1.5"
              >
                <span aria-hidden="true">
                  <PlatformBrandIcon platform={platform} className="size-4" />
                </span>
                {PLATFORM_LABELS[platform]}
              </TabsTrigger>
            ))}
          </TabsList>
          {selectedInOrder.map((platform) => (
            <TabsContent key={platform} value={platform} className="mt-6">
              <div className="flex max-w-full flex-wrap justify-center gap-8">
                {channelsForPlatform(platform).map((channel) => (
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
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
