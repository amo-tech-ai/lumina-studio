/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CommandCenterBrandSync } from "@/components/command-center/command-center-brand-sync";
import { ActiveBrandProvider, useActiveBrand } from "@/context/active-brand-context";
import { useHeroBrandSync } from "@/lib/active-brand/use-hero-brand-sync";
import { __resetCommandCenterHeroBrandSyncForTests } from "@/lib/active-brand/command-center-hero-sync";

const HERO_ID = "942ed871-932f-44a2-a377-9c404cb82400";

function BrandIdProbe() {
  const { activeBrandId } = useActiveBrand();
  return <span data-testid="active-brand-id">{activeBrandId ?? "none"}</span>;
}

function ShellWithHeroRegistry({ children }: { children: React.ReactNode }) {
  useHeroBrandSync();
  return children;
}

describe("ActiveBrandProvider boundary", () => {
  afterEach(() => {
    cleanup();
    __resetCommandCenterHeroBrandSyncForTests();
  });

  it("provides active brand context to descendants", () => {
    render(
      <ActiveBrandProvider>
        <BrandIdProbe />
      </ActiveBrandProvider>,
    );
    expect(screen.getByTestId("active-brand-id").textContent).toBe("none");
  });

  it("throws when useActiveBrand is used outside provider", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<BrandIdProbe />)).toThrow(/ActiveBrandProvider/);
    errorSpy.mockRestore();
    cleanup();
  });

  it("syncs hero brand when page mount precedes shell registration", async () => {
    render(
      <ActiveBrandProvider>
        <ShellWithHeroRegistry>
          <BrandIdProbe />
          <CommandCenterBrandSync heroBrandId={HERO_ID} />
        </ShellWithHeroRegistry>
      </ActiveBrandProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("active-brand-id").textContent).toBe(HERO_ID);
    });
  });
});
