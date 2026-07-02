/**
 * @vitest-environment jsdom
 */
import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CommandCenterBrandSync } from "@/components/command-center/command-center-brand-sync";
import {
  __resetCommandCenterHeroBrandSyncForTests,
  registerCommandCenterHeroBrandSync,
} from "@/lib/active-brand/command-center-hero-sync";

describe("CommandCenterBrandSync", () => {
  afterEach(() => {
    __resetCommandCenterHeroBrandSyncForTests();
  });

  it("syncs hero brand id after mount without useActiveBrand", async () => {
    const handler = vi.fn();
    registerCommandCenterHeroBrandSync(handler);

    render(<CommandCenterBrandSync heroBrandId="942ed871-932f-44a2-a377-9c404cb82400" />);

    await waitFor(() => {
      expect(handler).toHaveBeenCalledWith("942ed871-932f-44a2-a377-9c404cb82400");
    });
  });

  it("clears pending hero id on unmount", async () => {
    const handler = vi.fn();
    const unsubscribe = registerCommandCenterHeroBrandSync(handler);

    const { unmount } = render(
      <CommandCenterBrandSync heroBrandId="942ed871-932f-44a2-a377-9c404cb82400" />,
    );

    await waitFor(() => {
      expect(handler).toHaveBeenCalledWith("942ed871-932f-44a2-a377-9c404cb82400");
    });

    handler.mockClear();
    unmount();
    expect(handler).toHaveBeenCalledWith(null);

    unsubscribe();
    const lateHandler = vi.fn();
    registerCommandCenterHeroBrandSync(lateHandler);
    expect(lateHandler).toHaveBeenCalledWith(null);
  });
});
