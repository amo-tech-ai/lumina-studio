// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";

vi.mock("./assets-workspace.module.css", () => ({
  default: new Proxy({}, { get: (_, k) => String(k) }),
}));

const pollUntilMirrorTerminal = vi.fn();

vi.mock("@/lib/assets/upload-poll", () => ({
  pollUntilMirrorTerminal: (...args: unknown[]) => pollUntilMirrorTerminal(...args),
}));

const widgetCallbacks = vi.hoisted(() => ({
  onSuccess: null as
    | ((result: { info: object }, ctx: { widget: { close: () => void } }) => void)
    | null,
  onUploadAdded: null as ((result: { info: object }) => void) | null,
  onQueuesEnd: null as ((result: unknown, ctx: { widget: { close: () => void } }) => void) | null,
}));

vi.mock("next-cloudinary", () => ({
  CldUploadWidget: ({
    onSuccess,
    onUploadAdded,
    onQueuesEnd,
    children,
  }: {
    onSuccess?: typeof widgetCallbacks.onSuccess;
    onUploadAdded?: typeof widgetCallbacks.onUploadAdded;
    onQueuesEnd?: typeof widgetCallbacks.onQueuesEnd;
    children: (args: { open: () => void }) => React.ReactNode;
  }) => {
    widgetCallbacks.onSuccess = onSuccess ?? null;
    widgetCallbacks.onUploadAdded = onUploadAdded ?? null;
    widgetCallbacks.onQueuesEnd = onQueuesEnd ?? null;
    return <div>{children({ open: vi.fn() })}</div>;
  },
}));

import { AssetUploadPanel } from "./asset-upload-panel";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_API_KEY", "test-public-key");
  vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", "test-cloud");
});

afterEach(() => {
  cleanup();
  pollUntilMirrorTerminal.mockReset();
  widgetCallbacks.onSuccess = null;
  widgetCallbacks.onUploadAdded = null;
  widgetCallbacks.onQueuesEnd = null;
  sessionStorage.clear();
  vi.unstubAllEnvs();
});

describe("AssetUploadPanel", () => {
  it("surfaces poll API errors instead of leaving processing stuck", async () => {
    pollUntilMirrorTerminal.mockRejectedValue(new Error("status poll failed: HTTP 401"));

    render(
      <AssetUploadPanel
        brands={[{ id: "brand-1", name: "Brand One" }]}
        defaultBrandId="brand-1"
      />,
    );

    widgetCallbacks.onUploadAdded?.({
      info: { id: "upload-1", file: { name: "file.jpg", lastModified: 1, size: 100 } },
    });

    widgetCallbacks.onSuccess?.(
      {
        info: {
          id: "upload-1",
          asset_id: "abcdef0123456789abcdef0123456789",
          public_id: "ipix/test/file",
          original_filename: "file.jpg",
        },
      },
      { widget: { close: vi.fn() } },
    );

    await waitFor(() => {
      expect(screen.getByText(/could not confirm upload status/i)).toBeTruthy();
    });
  });

  it("closes the widget onQueuesEnd, not after each onSuccess", () => {
    const close = vi.fn();

    render(
      <AssetUploadPanel
        brands={[{ id: "brand-1", name: "Brand One" }]}
        defaultBrandId="brand-1"
      />,
    );

    pollUntilMirrorTerminal.mockResolvedValue({
      outcome: "ready",
      response: { status: "ready", cloudinary_asset_id: "abc", version: 1, public_id: "x" },
    });

    widgetCallbacks.onUploadAdded?.({
      info: { id: "upload-1", file: { name: "file.jpg", lastModified: 1, size: 100 } },
    });

    widgetCallbacks.onSuccess?.(
      {
        info: {
          id: "upload-1",
          asset_id: "abcdef0123456789abcdef0123456789",
          public_id: "ipix/test/a",
          original_filename: "a.jpg",
        },
      },
      { widget: { close } },
    );

    expect(close).not.toHaveBeenCalled();

    widgetCallbacks.onQueuesEnd?.({}, { widget: { close } });
    expect(close).toHaveBeenCalledOnce();
  });

  it("resumes mirror polling after refresh when cloudinary_asset_id is persisted", async () => {
    sessionStorage.setItem(
      "ipix-asset-upload-queue-v1",
      JSON.stringify([
        {
          id: "item-1",
          filename: "a.jpg",
          cloudinary_asset_id: "abcdef0123456789abcdef0123456789",
          public_id: "ipix/test/a",
          state: "processing",
        },
      ]),
    );
    pollUntilMirrorTerminal.mockReturnValue(new Promise(() => {}));

    render(
      <AssetUploadPanel
        brands={[{ id: "brand-1", name: "Brand One" }]}
        defaultBrandId="brand-1"
      />,
    );

    await waitFor(() => {
      expect(pollUntilMirrorTerminal).toHaveBeenCalledWith(
        "abcdef0123456789abcdef0123456789",
        expect.any(AbortSignal),
        expect.any(Function),
      );
    });
    expect(screen.getByText(/waiting for supabase/i)).toBeTruthy();
  });

  it("shows queue item on onUploadAdded before Cloudinary upload completes", async () => {
    render(
      <AssetUploadPanel
        brands={[{ id: "brand-1", name: "Brand One" }]}
        defaultBrandId="brand-1"
      />,
    );

    widgetCallbacks.onUploadAdded?.({
      info: { id: "upload-1", file: { name: "big-video.mp4", lastModified: 1, size: 100 } },
    });

    await waitFor(() => {
      expect(screen.getByText("big-video.mp4")).toBeTruthy();
    });
    expect(screen.getByText(/uploading/i)).toBeTruthy();
  });

  it("hides the widget when the public API key is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_API_KEY", "");

    render(
      <AssetUploadPanel
        brands={[{ id: "brand-1", name: "Brand One" }]}
        defaultBrandId="brand-1"
      />,
    );

    expect(screen.getByTestId("upload-unconfigured")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Upload" })).toBeNull();
  });
});
