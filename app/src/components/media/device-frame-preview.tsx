"use client";

import { useMemo } from "react";
import {
  Heart,
  MessageCircle,
  Send,
  Share2,
  Bookmark,
  MoreHorizontal,
  X,
  Play,
  Home,
  Clapperboard,
  Users,
  Bell,
  Menu,
  Music2,
  BadgeCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CHANNEL_FALLBACK_RATIO,
  CHANNEL_LABELS,
  CHANNEL_LAYOUT,
  type ChannelSpec,
  type PreviewChannel,
} from "@/lib/media/channel-specs";

const DEVICE_WIDTH = 300; // px — inner screen width

type Props = {
  channel: PreviewChannel;
  spec: ChannelSpec | null;
  assetUrl?: string;
  kind?: "image" | "video";
  brandName?: string;
  caption?: string;
  showSafeZones?: boolean;
};

export function DeviceFramePreview({
  channel,
  spec,
  assetUrl,
  kind = "image",
  brandName = "Your Brand",
  caption = "Introducing our latest drop — crafted for the moment.",
  showSafeZones = false,
}: Props) {
  const layout = CHANNEL_LAYOUT[channel];
  const ratio = useMemo(() => {
    if (spec?.aspectRatioW && spec?.aspectRatioH) {
      return spec.aspectRatioW / spec.aspectRatioH;
    }
    if (spec?.widthPx && spec?.heightPx) return spec.widthPx / spec.heightPx;
    return CHANNEL_FALLBACK_RATIO[channel];
  }, [spec, channel]);

  return (
    <div className="flex flex-col items-center gap-3">
      <Phone>
        {layout === "fullscreen" ? (
          <FullscreenChrome
            channel={channel}
            ratio={ratio}
            asset={
              <Media
                assetUrl={assetUrl}
                kind={kind}
                ratio={ratio}
                spec={spec}
                showSafeZones={showSafeZones}
                fill
              />
            }
            brandName={brandName}
            caption={caption}
          />
        ) : channel === "facebook" ? (
          <FacebookChrome
            brandName={brandName}
            caption={caption}
            media={
              <Media
                assetUrl={assetUrl}
                kind={kind}
                ratio={ratio}
                spec={spec}
                showSafeZones={showSafeZones}
              />
            }
          />
        ) : (
          <InstagramFeedChrome
            brandName={brandName}
            caption={caption}
            media={
              <Media
                assetUrl={assetUrl}
                kind={kind}
                ratio={ratio}
                spec={spec}
                showSafeZones={showSafeZones}
              />
            }
          />
        )}
      </Phone>
      <SpecCaption channel={channel} spec={spec} />
    </div>
  );
}

function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative rounded-[2.5rem] border-[10px] border-neutral-900 bg-black shadow-xl"
      style={{ width: DEVICE_WIDTH + 20 }}
    >
      {/* notch */}
      <div className="absolute left-1/2 top-0 z-20 h-5 w-28 -translate-x-1/2 rounded-b-2xl bg-neutral-900" />
      <div
        className="relative overflow-hidden rounded-[1.9rem] bg-white"
        style={{ width: DEVICE_WIDTH, height: 600 }}
      >
        {children}
      </div>
    </div>
  );
}

function StatusBar({ dark = false }: { dark?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 pt-2 text-[11px] font-semibold",
        dark ? "text-white" : "text-neutral-900",
      )}
    >
      <span>2:04</span>
      <span className="tracking-tight">●●● ▮▮</span>
    </div>
  );
}

function Media({
  assetUrl,
  kind,
  ratio,
  spec,
  showSafeZones,
  fill = false,
}: {
  assetUrl?: string;
  kind: "image" | "video";
  ratio: number;
  spec: ChannelSpec | null;
  showSafeZones?: boolean;
  fill?: boolean;
}) {
  const style = fill
    ? { width: "100%", height: "100%" }
    : { width: "100%", aspectRatio: String(ratio) };

  return (
    <div className="relative bg-neutral-100" style={style}>
      {assetUrl ? (
        kind === "video" ? (
          <video
            src={assetUrl}
            className="h-full w-full object-cover"
            muted
            loop
            playsInline
            autoPlay
          />
        ) : (
          <img
            src={assetUrl}
            alt="Asset preview"
            className="h-full w-full object-cover"
          />
        )
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-200 to-neutral-300 text-center text-xs text-neutral-500">
          <span className="px-4">
            {spec?.aspectRatioLabel ?? "—"} · {spec?.widthPx ?? "?"}×
            {spec?.heightPx ?? "?"}
            <br />
            Drop an asset URL
          </span>
        </div>
      )}

      {kind === "video" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/40 text-white">
            <Play className="h-6 w-6 fill-white" />
          </span>
        </div>
      )}

      {showSafeZones && spec && (
        <SafeZoneOverlay spec={spec} />
      )}
    </div>
  );
}

// Scale spec safe-zone px (relative to spec.widthPx/heightPx) into the rendered box via %.
function SafeZoneOverlay({ spec }: { spec: ChannelSpec }) {
  const { top, bottom, left, right } = spec.safeZone;
  if (!top && !bottom && !left && !right) return null;
  return (
    <div
      className="pointer-events-none absolute border-2 border-dashed border-amber-400/80"
      style={{
        top: `${(top / spec.heightPx) * 100}%`,
        bottom: `${(bottom / spec.heightPx) * 100}%`,
        left: `${(left / spec.widthPx) * 100}%`,
        right: `${(right / spec.widthPx) * 100}%`,
      }}
    >
      <span className="absolute left-1 top-1 rounded bg-amber-400/90 px-1 text-[9px] font-medium text-black">
        safe zone
      </span>
    </div>
  );
}

function FacebookChrome({
  brandName,
  caption,
  media,
}: {
  brandName: string;
  caption: string;
  media: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col bg-white text-neutral-900">
      <StatusBar />
      <div className="flex items-center justify-around border-b border-neutral-100 py-1.5 text-[11px] text-neutral-500">
        <FbAction icon={<Heart className="h-3.5 w-3.5" />} label="Like" />
        <FbAction icon={<MessageCircle className="h-3.5 w-3.5" />} label="Comment" />
        <FbAction icon={<Send className="h-3.5 w-3.5" />} label="Send" />
        <FbAction icon={<Share2 className="h-3.5 w-3.5" />} label="Share" />
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2">
          <Avatar name={brandName} />
          <div className="flex-1 leading-tight">
            <div className="flex items-center gap-1 text-[12px] font-semibold">
              {brandName}
              <BadgeCheck className="h-3 w-3 fill-blue-500 text-white" />
            </div>
            <div className="text-[10px] text-neutral-500">Sponsored · 🌐</div>
          </div>
          <MoreHorizontal className="h-4 w-4 text-neutral-500" />
          <X className="h-4 w-4 text-neutral-500" />
        </div>

        <p className="px-3 pb-2 text-[11px] leading-snug">
          {caption} <span className="text-neutral-500">See more</span>
        </p>

        {media}

        <div className="flex items-center justify-between border-t border-neutral-100 bg-neutral-50 px-3 py-2">
          <div className="leading-tight">
            <div className="text-[9px] uppercase text-neutral-500">
              {brandName.toLowerCase().replace(/\s+/g, "")}.com
            </div>
            <div className="text-[11px] font-semibold">Featured product</div>
          </div>
          <button className="rounded bg-neutral-200 px-3 py-1 text-[11px] font-semibold">
            Shop now
          </button>
        </div>

        <div className="flex items-center justify-between px-3 py-1.5 text-[10px] text-neutral-500">
          <span>👍❤️😮 99</span>
          <span>9K comments</span>
        </div>
        <div className="flex items-center justify-around border-t border-neutral-100 py-1.5 text-[11px] text-neutral-600">
          <FbAction icon={<Heart className="h-4 w-4" />} label="Like" />
          <FbAction icon={<MessageCircle className="h-4 w-4" />} label="Comment" />
          <FbAction icon={<Share2 className="h-4 w-4" />} label="Share" />
        </div>
      </div>

      <BottomTabBar />
    </div>
  );
}

function FbAction({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-1">
      {icon}
      {label}
    </span>
  );
}

function BottomTabBar() {
  return (
    <div className="flex items-center justify-around border-t border-neutral-200 py-2 text-neutral-500">
      <Home className="h-5 w-5 text-blue-600" />
      <Clapperboard className="h-5 w-5" />
      <Users className="h-5 w-5" />
      <Bell className="h-5 w-5" />
      <Menu className="h-5 w-5" />
    </div>
  );
}

function InstagramFeedChrome({
  brandName,
  caption,
  media,
}: {
  brandName: string;
  caption: string;
  media: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col bg-white text-neutral-900">
      <StatusBar />
      <div className="flex items-center gap-2 px-3 py-2">
        <Avatar name={brandName} ring />
        <div className="flex-1 text-[12px] font-semibold">
          {brandName.toLowerCase().replace(/\s+/g, "")}
        </div>
        <MoreHorizontal className="h-4 w-4 text-neutral-500" />
      </div>

      {media}

      <div className="flex items-center gap-4 px-3 py-2">
        <Heart className="h-5 w-5" />
        <MessageCircle className="h-5 w-5" />
        <Send className="h-5 w-5" />
        <Bookmark className="ml-auto h-5 w-5" />
      </div>
      <div className="px-3 text-[11px] font-semibold">1,204 likes</div>
      <p className="px-3 pt-1 text-[11px] leading-snug">
        <span className="font-semibold">
          {brandName.toLowerCase().replace(/\s+/g, "")}
        </span>{" "}
        {caption}
      </p>
    </div>
  );
}

function FullscreenChrome({
  channel,
  asset,
  brandName,
  caption,
}: {
  channel: PreviewChannel;
  ratio: number;
  asset: React.ReactNode;
  brandName: string;
  caption: string;
}) {
  const isTikTok = channel === "tiktok";
  return (
    <div className="relative h-full w-full bg-black text-white">
      <div className="absolute inset-0">{asset}</div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />

      <div className="relative z-10 flex h-full flex-col">
        <StatusBar dark />
        {channel === "instagram_story" ? (
          <div className="flex gap-1 px-3 pt-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={cn(
                  "h-0.5 flex-1 rounded-full",
                  i === 0 ? "bg-white" : "bg-white/40",
                )}
              />
            ))}
          </div>
        ) : (
          <div className="flex justify-center gap-4 pt-2 text-[12px] font-semibold">
            <span className="text-white/60">Following</span>
            <span className="border-b-2 border-white pb-0.5">For You</span>
          </div>
        )}

        <div className="mt-2 flex items-center gap-2 px-3">
          <Avatar name={brandName} ring />
          <span className="text-[12px] font-semibold drop-shadow">
            {brandName.toLowerCase().replace(/\s+/g, "")}
          </span>
        </div>

        <div className="mt-auto flex items-end justify-between p-3">
          <div className="max-w-[70%]">
            <p className="text-[12px] font-medium drop-shadow">{caption}</p>
            {isTikTok && (
              <div className="mt-1 flex items-center gap-1 text-[11px] drop-shadow">
                <Music2 className="h-3 w-3" /> original sound
              </div>
            )}
          </div>
          <div className="flex flex-col items-center gap-3">
            <RailIcon icon={<Heart className="h-6 w-6" />} count="12.4k" />
            <RailIcon icon={<MessageCircle className="h-6 w-6" />} count="842" />
            <RailIcon icon={<Share2 className="h-6 w-6" />} count="Share" />
          </div>
        </div>
      </div>
    </div>
  );
}

function RailIcon({ icon, count }: { icon: React.ReactNode; count: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 drop-shadow">
      {icon}
      <span className="text-[10px]">{count}</span>
    </div>
  );
}

function Avatar({ name, ring = false }: { name: string; ring?: boolean }) {
  return (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-[11px] font-semibold text-white",
        ring && "ring-2 ring-pink-500 ring-offset-1",
      )}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function SpecCaption({
  channel,
  spec,
}: {
  channel: PreviewChannel;
  spec: ChannelSpec | null;
}) {
  return (
    <div className="text-center text-xs text-[var(--muted-foreground)]">
      <div className="font-semibold text-[var(--foreground)]">
        {CHANNEL_LABELS[channel]}
      </div>
      {spec ? (
        <div>
          {spec.aspectRatioLabel} · {spec.widthPx}×{spec.heightPx} ·{" "}
          {spec.acceptedFormats.join("/")}
          {spec.maxFileSizeMb ? ` · ≤${spec.maxFileSizeMb}MB` : ""}
        </div>
      ) : (
        <div className="text-amber-600">No spec seeded for this channel</div>
      )}
    </div>
  );
}
