/**
 * @vitest-environment jsdom
 */
import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CommandCenterBrandSync } from "@/components/command-center/command-center-brand-sync";
import { registerCommandCenterHeroBrandSync } from "@/lib/active-brand/command-center-hero-sync";

describe("CommandCenterBrandSync", () => {
  afterEach(() => {
    registerCommandCenterHeroBrandSync(null);
  });

  it("syncs hero brand id after mount without useActiveBrand", async () => {
    const handler = vi.fn();
    registerCommandCenterHeroBrandSync(handler);

    render(<CommandCenterBrandSync heroBrandId="942ed871-932f-44a2-a377-9c404cb82400" />);

    await waitFor(() => {
      expect(handler).toHaveBeenCalledWith("942ed871-932f-44a2-a377-9c404cb82400");
    });
  });
});
