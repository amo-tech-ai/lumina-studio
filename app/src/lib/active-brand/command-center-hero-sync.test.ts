import { afterEach, describe, expect, it, vi } from "vitest";

import {
  registerCommandCenterHeroBrandSync,
  syncCommandCenterHeroBrand,
} from "@/lib/active-brand/command-center-hero-sync";

describe("command-center-hero-sync registry", () => {
  afterEach(() => {
    registerCommandCenterHeroBrandSync(null);
  });

  it("forwards hero brand id to registered handler", () => {
    const handler = vi.fn();
    registerCommandCenterHeroBrandSync(handler);
    syncCommandCenterHeroBrand("brand-uuid");
    expect(handler).toHaveBeenCalledWith("brand-uuid");
  });

  it("no-ops when no handler is registered", () => {
    expect(() => syncCommandCenterHeroBrand("brand-uuid")).not.toThrow();
  });
});
