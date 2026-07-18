// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

import { ChannelPreviewStudio } from "./channel-preview-studio";
import type { ChannelSpec, PreviewChannel } from "@/lib/media/channel-specs";

afterEach(() => cleanup());

const SPEC_WITH_SAFE_ZONE: ChannelSpec = {
  channel: "instagram_feed",
  platformSlug: "instagram",
  platformName: "Instagram",
  imageTypeSlug: "feed_post",
  imageTypeName: "Feed Post",
  widthPx: 1080,
  heightPx: 1350,
  aspectRatioW: 4,
  aspectRatioH: 5,
  aspectRatioLabel: "4:5",
  acceptedFormats: ["jpg", "png"],
  maxFileSizeMb: 30,
  safeZone: { top: 100, bottom: 200, left: 10, right: 20 },
  organic: true,
  paid: false,
  shoppingSupport: true,
  cropNotes: null,
};

const SPEC_ZERO_SAFE_ZONE: ChannelSpec = {
  ...SPEC_WITH_SAFE_ZONE,
  channel: "facebook",
  platformSlug: "facebook",
  platformName: "Facebook",
  widthPx: 1080,
  heightPx: 1080,
  aspectRatioW: 1,
  aspectRatioH: 1,
  aspectRatioLabel: "1:1",
  safeZone: { top: 0, bottom: 0, left: 0, right: 0 },
};

const MIXED_SPECS: Record<PreviewChannel, ChannelSpec | null> = {
  facebook: SPEC_ZERO_SAFE_ZONE,
  instagram_feed: SPEC_WITH_SAFE_ZONE,
  instagram_story: null,
  tiktok: null,
};

describe("ChannelPreviewStudio", () => {
  it("renders default field values and every channel's caption label", () => {
    render(<ChannelPreviewStudio specs={MIXED_SPECS} />);

    expect(screen.getByLabelText("Brand name")).toHaveProperty("value", "LaLueur");
    expect(screen.getByLabelText("Caption")).toHaveProperty(
      "value",
      "Introducing our revolutionary facial cleansing foam — hello to a fresh, glowing complexion.",
    );
    expect((screen.getByLabelText("Asset URL (image or video)") as HTMLInputElement).value.length).toBeGreaterThan(0);

    expect(screen.getByText("Facebook Feed")).toBeDefined();
    expect(screen.getByText("Instagram Feed")).toBeDefined();
    expect(screen.getByText("Instagram Story")).toBeDefined();
    expect(screen.getByText("TikTok")).toBeDefined();
  });

  it("editing the brand name updates every device frame that renders it", () => {
    render(<ChannelPreviewStudio specs={MIXED_SPECS} />);
    fireEvent.change(screen.getByLabelText("Brand name"), { target: { value: "Acme Co" } });

    // FacebookChrome renders the raw brand name directly
    expect(screen.getAllByText("Acme Co").length).toBeGreaterThan(0);
    // InstagramFeedChrome/FullscreenChrome render a lowercased, space-stripped handle
    expect(screen.getAllByText(/acmeco/i).length).toBeGreaterThan(0);
  });

  it("editing the caption updates the caption text in all 4 device frames", () => {
    render(<ChannelPreviewStudio specs={MIXED_SPECS} />);
    fireEvent.change(screen.getByLabelText("Caption"), { target: { value: "A brand new caption" } });

    // One device frame per channel (facebook/instagram_feed/instagram_story/tiktok) — all 4 render it
    expect(screen.getAllByText("A brand new caption")).toHaveLength(4);
  });

  it("toggling to video swaps every image element for a video element", () => {
    const { container } = render(<ChannelPreviewStudio specs={MIXED_SPECS} />);

    expect(screen.getAllByAltText("Asset preview")).toHaveLength(4);
    expect(container.querySelectorAll("video")).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "video" }));

    expect(screen.queryAllByAltText("Asset preview")).toHaveLength(0);
    expect(container.querySelectorAll("video")).toHaveLength(4);
  });

  it("safe-zone overlay only appears for a channel whose spec has a non-zero safe zone", () => {
    render(<ChannelPreviewStudio specs={MIXED_SPECS} />);

    // Unchecked by default — no overlay anywhere yet
    expect(screen.queryByText("safe zone")).toBeNull();

    fireEvent.click(screen.getByLabelText("Show safe zones"));

    // instagram_feed has a real safe zone; facebook's is all-zero (renders
    // null per SafeZoneOverlay's early return); instagram_story/tiktok have
    // no spec at all, so the overlay is never attempted for them either.
    expect(screen.getAllByText("safe zone")).toHaveLength(1);
  });

  it("shows the 'no spec seeded' fallback only for channels with a null spec", () => {
    render(<ChannelPreviewStudio specs={MIXED_SPECS} />);
    expect(screen.getAllByText("No spec seeded for this channel")).toHaveLength(2);
  });

  it("clearing the asset URL shows the spec-derived placeholder, with '—'/'?'/'?' fallback for null specs", () => {
    render(<ChannelPreviewStudio specs={MIXED_SPECS} />);
    fireEvent.change(screen.getByLabelText("Asset URL (image or video)"), { target: { value: "" } });

    // instagram_feed has a real spec (4:5 · 1080×1350)
    expect(
      screen.getAllByText(
        (_, el) => el?.tagName === "SPAN" && el.textContent === "4:5 · 1080×1350Drop an asset URL",
      ),
    ).toHaveLength(1);
    // instagram_story and tiktok have no spec — "—" and "?" fallbacks, one placeholder each
    expect(
      screen.getAllByText(
        (_, el) => el?.tagName === "SPAN" && el.textContent === "— · ?×?Drop an asset URL",
      ),
    ).toHaveLength(2);
  });
});
