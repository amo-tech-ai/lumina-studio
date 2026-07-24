import { describe, expect, it, beforeAll, vi } from "vitest";
import { Observability, MastraStorageExporter, SensitiveDataFilter } from "@mastra/observability";

// Lazily loaded — same cold-import pattern as agent-workflow-bindings.test.ts
let getMastra: typeof import("./index").getMastra;

describe("Mastra observability wiring (IPI-781)", () => {
  beforeAll(async () => {
    // Exporter fail-closed: getMastra() requires cutover schema (not public shadows).
    vi.stubEnv("MASTRA_SCHEMA", "mastra");
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

describe("assertMastraSchemaForObservabilityExporter (IPI-781)", () => {
  it("accepts MASTRA_SCHEMA=mastra", async () => {
    const { assertMastraSchemaForObservabilityExporter } = await import("./storage");
    expect(
      assertMastraSchemaForObservabilityExporter({ MASTRA_SCHEMA: "mastra" }),
    ).toBe("mastra");
    expect(
      assertMastraSchemaForObservabilityExporter({ MASTRA_SCHEMA: "  mastra  " }),
    ).toBe("mastra");
  });

  it("fails closed when schema is public or unset", async () => {
    const { assertMastraSchemaForObservabilityExporter } = await import("./storage");
    expect(() => assertMastraSchemaForObservabilityExporter({})).toThrow(
      /MASTRA_SCHEMA=mastra/,
    );
    expect(() =>
      assertMastraSchemaForObservabilityExporter({ MASTRA_SCHEMA: "public" }),
    ).toThrow(/got "public"/);
  });
});
