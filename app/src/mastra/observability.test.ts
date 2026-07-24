import { describe, expect, it, beforeAll } from "vitest";
import { Observability, MastraStorageExporter, SensitiveDataFilter } from "@mastra/observability";

// Lazily loaded — same cold-import pattern as agent-workflow-bindings.test.ts
let getMastra: typeof import("./index").getMastra;

describe("Mastra observability wiring (IPI-781)", () => {
  beforeAll(async () => {
    ({ getMastra } = await import("./index"));
  }, 15_000);

  it("wires an Observability instance (not a plain config object)", () => {
    const mastra = getMastra();
    const entry = mastra.observability;
    expect(entry).toBeInstanceOf(Observability);
  });

  it("default config uses MastraStorageExporter + SensitiveDataFilter", () => {
    const mastra = getMastra();
    const instance = mastra.observability?.getDefaultInstance();
    expect(instance).toBeDefined();

    const exporters = instance!.exporters ?? [];
    expect(exporters.some((e) => e instanceof MastraStorageExporter)).toBe(true);
    expect(exporters.some((e) => e.name === "mastra-storage-exporter")).toBe(true);

    const processors = instance!.spanOutputProcessors ?? [];
    expect(processors.some((p) => p instanceof SensitiveDataFilter)).toBe(true);
  });
});
