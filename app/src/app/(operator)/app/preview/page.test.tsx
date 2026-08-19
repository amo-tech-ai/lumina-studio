// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

vi.mock("@/lib/media/channel-specs.server", () => ({
  getAllChannelSpecs: vi.fn(),
}));

import { getAllChannelSpecs } from "@/lib/media/channel-specs.server";
import ChannelPreviewPage from "./page";
import { emptyChannelSpecs, type ChannelSpec } from "@/lib/media/channel-specs";

afterEach(() => cleanup());

describe("ChannelPreviewPage (async Server Component)", () => {
  it("awaits getAllChannelSpecs and renders the heading, back link, and studio", async () => {
    (getAllChannelSpecs as ReturnType<typeof vi.fn>).mockResolvedValue(
      emptyChannelSpecs(),
    );

    const element = await ChannelPreviewPage();
    render(element);

    expect(screen.getByRole("heading", { name: "Channel Preview" })).toBeDefined();
    const backLink = screen.getByRole("link", { name: /Command Center/ });
    expect(backLink.getAttribute("href")).toBe("/app");
    // Default platform is Instagram (3 placements), all null in this mock.
    expect(screen.getAllByText("No spec available")).toHaveLength(3);
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
      ...emptyChannelSpecs(),
      instagram_feed: populatedSpec,
    });

    const element = await ChannelPreviewPage();
    render(element);

    expect(screen.getAllByText("No spec available")).toHaveLength(2);
    expect(
      screen.getByText(
        (_, el) =>
          el?.tagName === "DIV" &&
          el.textContent === "4:5 · 1080×1350 · jpg · ≤30MB",
      ),
    ).toBeDefined();
  });
});
