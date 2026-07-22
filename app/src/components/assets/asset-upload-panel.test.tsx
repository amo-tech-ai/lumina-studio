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

type WidgetOptions = Record<string, unknown>;

const widgetCallbacks = vi.hoisted(() => ({
  onSuccess: null as
    | ((result: { info: object }, ctx: { widget: { close: () => void } }) => void)
    | null,
  onUploadAdded: null as ((result: { info: object }) => void) | null,
  onQueuesEnd: null as ((result: unknown, ctx: { widget: { close: () => void } }) => void) | null,
  options: null as WidgetOptions | null,
}));

vi.mock("next-cloudinary", () => ({
  CldUploadWidget: ({
    onSuccess,
    onUploadAdded,
    onQueuesEnd,
    options,
    children,
  }: {
    onSuccess?: typeof widgetCallbacks.onSuccess;
    onUploadAdded?: typeof widgetCallbacks.onUploadAdded;
    onQueuesEnd?: typeof widgetCallbacks.onQueuesEnd;
    options?: WidgetOptions;
    children: (args: { open: () => void }) => React.ReactNode;
  }) => {
    widgetCallbacks.onSuccess = onSuccess ?? null;
    widgetCallbacks.onUploadAdded = onUploadAdded ?? null;
    widgetCallbacks.onQueuesEnd = onQueuesEnd ?? null;
    widgetCallbacks.options = options ?? null;
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
  widgetCallbacks.options = null;
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

  describe("prepareUploadParams", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    function prepareUploadParams():
      | ((cb: (result: unknown) => void, params: unknown) => void)
      | undefined {
      return (widgetCallbacks.options as Record<string, unknown>)
        ?.prepareUploadParams as
        | ((cb: (result: unknown) => void, params: unknown) => void)
        | undefined;
    }

    it("signs a single params object and calls cb with the result directly", async () => {
      const SIGNING_RESULT = { signature: "abc", apiKey: "key" };
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(SIGNING_RESULT), { status: 200 }),
      );

      render(
        <AssetUploadPanel
          brands={[{ id: "brand-1", name: "Brand One" }]}
          defaultBrandId="brand-1"
        />,
      );

      const cb = vi.fn();
      const fn = prepareUploadParams();
      expect(fn).toBeDefined();
      fn!(cb, { timestamp: 123 });

      await waitFor(() => {
        expect(cb).toHaveBeenCalledWith(SIGNING_RESULT);
      });
    });

    it("signs a batch of params and calls cb with the full array", async () => {
      vi.spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ signature: "abc" }), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ signature: "def" }), { status: 200 }),
        );

      render(
        <AssetUploadPanel
          brands={[{ id: "brand-1", name: "Brand One" }]}
          defaultBrandId="brand-1"
        />,
      );

      const cb = vi.fn();
      const fn = prepareUploadParams();
      expect(fn).toBeDefined();
      fn!(cb, [{ timestamp: 123 }, { timestamp: 456 }]);

      await waitFor(() => {
        expect(cb).toHaveBeenCalledWith([
          { signature: "abc" },
          { signature: "def" },
        ]);
      });
    });

    it("calls cb with { cancel: true } on HTTP 401 and fails queued uploading rows", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response("Unauthorized", { status: 401 }),
      );

      render(
        <AssetUploadPanel
          brands={[{ id: "brand-1", name: "Brand One" }]}
          defaultBrandId="brand-1"
        />,
      );

      widgetCallbacks.onUploadAdded?.({
        info: { id: "upload-auth", file: { name: "auth.jpg", lastModified: 1, size: 10 } },
      });
      await waitFor(() => {
        expect(screen.getByText("auth.jpg")).toBeTruthy();
        expect(screen.getByText(/uploading/i)).toBeTruthy();
      });

      const cb = vi.fn();
      const fn = prepareUploadParams();
      expect(fn).toBeDefined();
      fn!(cb, { timestamp: 123 });

      await waitFor(() => {
        expect(cb).toHaveBeenCalledWith({ cancel: true });
        expect(screen.getByText(/client failed/i)).toBeTruthy();
        expect(screen.getByText(/could not sign upload/i)).toBeTruthy();
      });
    });

    it("calls cb with { cancel: true } on HTTP 500 and fails queued uploading rows", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response("Internal Server Error", { status: 500 }),
      );

      render(
        <AssetUploadPanel
          brands={[{ id: "brand-1", name: "Brand One" }]}
          defaultBrandId="brand-1"
        />,
      );

      widgetCallbacks.onUploadAdded?.({
        info: { id: "upload-500", file: { name: "server.jpg", lastModified: 2, size: 20 } },
      });
      await waitFor(() => {
        expect(screen.getByText("server.jpg")).toBeTruthy();
      });

      const cb = vi.fn();
      prepareUploadParams()!(cb, { timestamp: 456 });

      await waitFor(() => {
        expect(cb).toHaveBeenCalledWith({ cancel: true });
        expect(screen.getByText(/client failed/i)).toBeTruthy();
        expect(screen.getByText(/could not sign upload/i)).toBeTruthy();
      });
    });

    it("does not fail queue rows when signing succeeds", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ signature: "ok", apiKey: "key" }), { status: 200 }),
      );

      render(
        <AssetUploadPanel
          brands={[{ id: "brand-1", name: "Brand One" }]}
          defaultBrandId="brand-1"
        />,
      );

      widgetCallbacks.onUploadAdded?.({
        info: { id: "upload-ok", file: { name: "ok.jpg", lastModified: 3, size: 30 } },
      });
      await waitFor(() => {
        expect(screen.getByText("ok.jpg")).toBeTruthy();
        expect(screen.getByText(/uploading/i)).toBeTruthy();
      });

      const cb = vi.fn();
      prepareUploadParams()!(cb, { timestamp: 789 });

      await waitFor(() => {
        expect(cb).toHaveBeenCalledWith({ signature: "ok", apiKey: "key" });
      });
      expect(screen.getByText(/uploading/i)).toBeTruthy();
      expect(screen.queryByText(/could not sign upload/i)).toBeNull();
      expect(screen.queryByText(/client failed/i)).toBeNull();
    });
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
