// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
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
  onQueuesEnd: null as ((result: unknown, ctx: { widget: { close: () => void } }) => void) | null,
}));

vi.mock("next-cloudinary", () => ({
  CldUploadWidget: ({
    onSuccess,
    onQueuesEnd,
    children,
  }: {
    onSuccess?: typeof widgetCallbacks.onSuccess;
    onQueuesEnd?: typeof widgetCallbacks.onQueuesEnd;
    children: (args: { open: () => void }) => React.ReactNode;
  }) => {
    widgetCallbacks.onSuccess = onSuccess ?? null;
    widgetCallbacks.onQueuesEnd = onQueuesEnd ?? null;
    return <div>{children({ open: vi.fn() })}</div>;
  },
}));

import { AssetUploadPanel } from "./asset-upload-panel";

afterEach(() => {
  cleanup();
  pollUntilMirrorTerminal.mockReset();
  widgetCallbacks.onSuccess = null;
  widgetCallbacks.onQueuesEnd = null;
  sessionStorage.clear();
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

    widgetCallbacks.onSuccess?.(
      {
        info: {
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

    widgetCallbacks.onSuccess?.(
      {
        info: {
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
});
