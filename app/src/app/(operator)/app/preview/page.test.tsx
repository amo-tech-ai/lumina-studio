// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

vi.mock("@/lib/media/channel-specs.server", () => ({
  getAllChannelSpecs: vi.fn(),
}));

import { getAllChannelSpecs } from "@/lib/media/channel-specs.server";
import ChannelPreviewPage from "./page";
import type { ChannelSpec } from "@/lib/media/channel-specs";

afterEach(() => cleanup());

const NULL_SPECS = {
  facebook: null,
  instagram_feed: null,
  instagram_story: null,
  tiktok: null,
};

describe("ChannelPreviewPage (async Server Component)", () => {
  it("awaits getAllChannelSpecs and renders the heading, back link, and studio", async () => {
    (getAllChannelSpecs as ReturnType<typeof vi.fn>).mockResolvedValue(NULL_SPECS);

    // page.tsx is an async Server Component — it has no client render
    // lifecycle, just a function that returns a Promise<JSX>. Awaiting it
    // directly and handing the resolved element to RTL's render() is the
    // standard way to test one; this is the first such test in this repo
    // (see the investigation note in the PR — 12 async Server Component
    // pages exist under app/(operator)/app/, none previously tested).
    const element = await ChannelPreviewPage();
    render(element);

    expect(screen.getByRole("heading", { name: "Channel Preview" })).toBeDefined();
    const backLink = screen.getByRole("link", { name: /Command Center/ });
    expect(backLink.getAttribute("href")).toBe("/app");
    // Studio rendered with the mocked (all-null) specs -> every channel shows the fallback
    expect(screen.getAllByText("No spec seeded for this channel")).toHaveLength(4);
  });

  it("passes real spec data through to the studio when getAllChannelSpecs resolves populated specs", async () => {
    const populatedSpec: ChannelSpec = {
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
      acceptedFormats: ["jpg"],
      maxFileSizeMb: 30,
      safeZone: { top: 0, bottom: 0, left: 0, right: 0 },
      organic: true,
      paid: false,
      shoppingSupport: true,
      cropNotes: null,
    };
    (getAllChannelSpecs as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...NULL_SPECS,
      instagram_feed: populatedSpec,
    });

    const element = await ChannelPreviewPage();
    render(element);

    // 3 of 4 channels still have no spec — the plumbing didn't silently
    // apply the one populated spec to every channel
    expect(screen.getAllByText("No spec seeded for this channel")).toHaveLength(3);
    expect(
      screen.getByText(
        (_, el) => el?.tagName === "DIV" && el.textContent === "4:5 · 1080×1350 · jpg · ≤30MB",
      ),
    ).toBeDefined();
  });
});
