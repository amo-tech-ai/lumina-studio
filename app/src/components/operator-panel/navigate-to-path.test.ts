import { describe, expect, it } from "vitest";

import {
  HUB_SECTIONS,
  NAV_TARGETS,
  resolveNavigateToPath,
} from "./navigate-to-path";

describe("resolveNavigateToPath — IPI-731", () => {
  it("maps hub sections to /app/{section}", () => {
    for (const section of HUB_SECTIONS) {
      if (section === "crm") continue;
      expect(resolveNavigateToPath(section)).toBe(`/app/${section}`);
    }
  });

  it("maps crm to the companies hub", () => {
    expect(resolveNavigateToPath("crm")).toBe("/app/crm/companies");
  });

  it("maps shoot-wizard to the shoot planning wizard", () => {
    expect(resolveNavigateToPath("shoot-wizard")).toBe("/app/shoots/new");
  });

  it("includes shoot-wizard in NAV_TARGETS without putting it in HUB_SECTIONS", () => {
    expect(NAV_TARGETS).toContain("shoot-wizard");
    expect(HUB_SECTIONS).not.toContain("shoot-wizard");
  });
});
