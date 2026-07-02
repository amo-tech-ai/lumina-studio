import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const LAYOUT_SRC = readFileSync(
  resolve(fileURLToPath(new URL(".", import.meta.url)), "../app/(operator)/layout.tsx"),
  "utf8",
);

const PANEL_SRC = readFileSync(
  resolve(
    fileURLToPath(new URL(".", import.meta.url)),
    "../components/operator-panel/operator-panel.tsx",
  ),
  "utf8",
);

const SYNC_SRC = readFileSync(
  resolve(
    fileURLToPath(new URL(".", import.meta.url)),
    "../components/command-center/command-center-brand-sync.tsx",
  ),
  "utf8",
);

describe("ActiveBrandProvider boundary", () => {
  it("mounts ActiveBrandProvider in operator layout above OperatorPanel", () => {
    expect(LAYOUT_SRC).toMatch(/<ActiveBrandProvider>/);
    expect(LAYOUT_SRC).toMatch(/<OperatorPanel>\{children\}<\/OperatorPanel>/);
    expect(LAYOUT_SRC).toMatch(/<ActiveBrandProvider>\s*\n?\s*<OperatorPanel>/s);
  });

  it("does not nest a second ActiveBrandProvider in OperatorPanel", () => {
    expect(PANEL_SRC).not.toMatch(/<ActiveBrandProvider>/);
    expect(PANEL_SRC).toMatch(/registerCommandCenterHeroBrandSync/);
  });

  it("keeps CommandCenterBrandSync free of useActiveBrand (SSR-safe)", () => {
    expect(SYNC_SRC).not.toMatch(/useActiveBrand/);
    expect(SYNC_SRC).toMatch(/syncCommandCenterHeroBrand/);
  });
});
