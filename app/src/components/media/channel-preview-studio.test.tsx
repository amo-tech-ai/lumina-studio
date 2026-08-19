// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ChannelPreviewStudio } from "./channel-preview-studio";
import {
  emptyChannelSpecs,
  type ChannelSpec,
} from "@/lib/media/channel-specs";

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

const MIXED_SPECS = {
  ...emptyChannelSpecs(),
  facebook: SPEC_ZERO_SAFE_ZONE,
  instagram_feed: SPEC_WITH_SAFE_ZONE,
};

describe("ChannelPreviewStudio", () => {
  it("defaults to Instagram and groups Feed, Story, and Reel under that platform", () => {
    render(<ChannelPreviewStudio specs={MIXED_SPECS} />);

    expect(screen.getByRole("checkbox", { name: "Instagram" })).toHaveProperty(
      "checked",
      true,
    );
    expect(screen.getByRole("checkbox", { name: "Facebook" })).toHaveProperty(
      "checked",
      false,
    );

    expect(screen.getByText("Instagram Feed")).toBeDefined();
    expect(screen.getByText("Instagram Story")).toBeDefined();
    expect(screen.getByText("Instagram Reel")).toBeDefined();
    expect(screen.queryByText("Facebook Feed")).toBeNull();
  });

  it("renders default field values", () => {
    render(<ChannelPreviewStudio specs={MIXED_SPECS} />);

    expect(screen.getByLabelText("Brand name")).toHaveProperty("value", "LaLueur");
    expect(screen.getByLabelText("Caption")).toHaveProperty(
      "value",
      "Introducing our revolutionary facial cleansing foam — hello to a fresh, glowing complexion.",
    );
    expect(
      (screen.getByLabelText("Asset URL (image or video)") as HTMLInputElement)
        .value.length,
    ).toBeGreaterThan(0);
  });

  it("shows only Facebook Feed when Facebook is the sole selected platform", async () => {
    const user = userEvent.setup();
    render(<ChannelPreviewStudio specs={MIXED_SPECS} />);

    await user.click(screen.getByRole("checkbox", { name: "Facebook" }));
    await user.click(screen.getByRole("checkbox", { name: "Instagram" }));

    expect(screen.getByText("Facebook Feed")).toBeDefined();
    expect(screen.queryByText("Instagram Feed")).toBeNull();
    expect(screen.queryByText("Facebook Story")).toBeNull();
  });

  it("switches the selected platform group from the tablist", async () => {
    const user = userEvent.setup();
    render(<ChannelPreviewStudio specs={MIXED_SPECS} />);

    await user.click(screen.getByRole("checkbox", { name: "Facebook" }));
    await user.click(screen.getByRole("tab", { name: "Facebook" }));

    expect(screen.getByText("Facebook Feed")).toBeDefined();
    expect(screen.queryByText("Instagram Feed")).toBeNull();
  });

  it("shows an empty state when every platform is unchecked", () => {
    render(<ChannelPreviewStudio specs={MIXED_SPECS} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Instagram" }));

    expect(
      screen.getByText("Select a platform to preview its placements."),
    ).toBeDefined();
    expect(screen.queryByRole("tab")).toBeNull();
  });

  it("shows the missing-spec fallback for a selected platform with no spec row", () => {
    render(<ChannelPreviewStudio specs={MIXED_SPECS} />);

    // Instagram Story/Reel are null in MIXED_SPECS; Feed has a real spec.
    expect(screen.getAllByText("No spec available")).toHaveLength(2);
  });

  it("editing the brand name updates every visible device frame that renders it", () => {
    render(<ChannelPreviewStudio specs={MIXED_SPECS} />);
    fireEvent.change(screen.getByLabelText("Brand name"), {
      target: { value: "Acme Co" },
    });

    expect(screen.getAllByText(/acmeco/i).length).toBeGreaterThan(0);
  });

  it("editing the caption updates the caption text in the visible Instagram frames", () => {
    render(<ChannelPreviewStudio specs={MIXED_SPECS} />);
    fireEvent.change(screen.getByLabelText("Caption"), {
      target: { value: "A brand new caption" },
    });

    expect(screen.getAllByText("A brand new caption")).toHaveLength(3);
  });

  it("toggling to video swaps every visible image element for a video element", () => {
    const { container } = render(<ChannelPreviewStudio specs={MIXED_SPECS} />);

    expect(screen.getAllByAltText("Asset preview")).toHaveLength(3);
    expect(container.querySelectorAll("video")).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "video" }));

    expect(screen.queryAllByAltText("Asset preview")).toHaveLength(0);
    expect(container.querySelectorAll("video")).toHaveLength(3);
  });

  it("safe-zone overlay only appears for a channel whose spec has a non-zero safe zone", () => {
    render(<ChannelPreviewStudio specs={MIXED_SPECS} />);

    expect(screen.queryByText("safe zone")).toBeNull();

    fireEvent.click(screen.getByLabelText("Show safe zones"));

    expect(screen.getAllByText("safe zone")).toHaveLength(1);
  });

  it("clearing the asset URL shows the spec-derived placeholder, with '—'/'?' fallback for null specs", () => {
    render(<ChannelPreviewStudio specs={MIXED_SPECS} />);
    fireEvent.change(screen.getByLabelText("Asset URL (image or video)"), {
      target: { value: "" },
    });

    expect(
      screen.getAllByText(
        (_, el) =>
          el?.tagName === "SPAN" &&
          el.textContent === "4:5 · 1080×1350Drop an asset URL",
      ),
    ).toHaveLength(1);
    expect(
      screen.getAllByText(
        (_, el) =>
          el?.tagName === "SPAN" && el.textContent === "— · ?×?Drop an asset URL",
      ),
    ).toHaveLength(2);
  });

  it("generic platforms render a spec frame without inventing Facebook Story", async () => {
    const user = userEvent.setup();
    render(<ChannelPreviewStudio specs={MIXED_SPECS} />);
    await user.click(screen.getByRole("checkbox", { name: "Pinterest" }));
    await user.click(screen.getByRole("checkbox", { name: "Instagram" }));

    expect(screen.getByRole("tab", { name: "Pinterest" })).toBeDefined();
    expect(screen.getByText("No spec available")).toBeDefined();
    expect(screen.queryByText("Facebook Story")).toBeNull();
  });
});
