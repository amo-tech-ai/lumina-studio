import { afterEach, describe, expect, it, vi } from "vitest";

import {
  __resetCommandCenterHeroBrandSyncForTests,
  registerCommandCenterHeroBrandSync,
  syncCommandCenterHeroBrand,
} from "@/lib/active-brand/command-center-hero-sync";

describe("command-center-hero-sync registry", () => {
  afterEach(() => {
    __resetCommandCenterHeroBrandSyncForTests();
  });

  it("forwards hero brand id to registered handler", () => {
    const handler = vi.fn();
    registerCommandCenterHeroBrandSync(handler);
    syncCommandCenterHeroBrand("brand-uuid");
    expect(handler).toHaveBeenCalledWith("brand-uuid");
  });

  it("notifies all registered listeners", () => {
    const first = vi.fn();
    const second = vi.fn();
    registerCommandCenterHeroBrandSync(first);
    registerCommandCenterHeroBrandSync(second);
    syncCommandCenterHeroBrand("brand-uuid");
    expect(first).toHaveBeenCalledWith("brand-uuid");
    expect(second).toHaveBeenCalledWith("brand-uuid");
  });

  it("unsubscribes a listener via returned cleanup", () => {
    const handler = vi.fn();
    const unsubscribe = registerCommandCenterHeroBrandSync(handler);
    unsubscribe();
    syncCommandCenterHeroBrand("brand-uuid");
    expect(handler).not.toHaveBeenCalled();
  });

  it("no-ops when no handler is registered", () => {
    expect(() => syncCommandCenterHeroBrand("brand-uuid")).not.toThrow();
  });

  it("replays pending hero id when handler registers after sync", () => {
    syncCommandCenterHeroBrand("late-hero-uuid");

    const handler = vi.fn();
    registerCommandCenterHeroBrandSync(handler);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith("late-hero-uuid");
  });

  it("does not replay when no sync ran before register", () => {
    const handler = vi.fn();
    registerCommandCenterHeroBrandSync(handler);
    expect(handler).not.toHaveBeenCalled();
  });
});
