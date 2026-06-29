import { describe, expect, it, vi } from "vitest";
import { mastraWorkflows } from "./agent-workflows";

describe("mastraWorkflows", () => {
  it("returns empty when mastra is not registered yet", () => {
    expect(mastraWorkflows("shoot-wizard")({ mastra: undefined })).toEqual({});
  });

  it("resolves workflows from the Mastra registry", () => {
    const shootWizard = { id: "shoot-wizard" };
    const mastra = {
      getWorkflow: vi.fn((id: string) => {
        if (id === "shoot-wizard") return shootWizard;
        throw new Error(`missing ${id}`);
      }),
    };
    expect(mastraWorkflows("shoot-wizard")({ mastra: mastra as never })).toEqual({
      "shoot-wizard": shootWizard,
    });
  });
});
