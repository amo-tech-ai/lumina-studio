import { afterEach, describe, expect, it, vi } from "vitest";
import { Observability, MastraStorageExporter, SensitiveDataFilter } from "@mastra/observability";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("Mastra observability wiring (IPI-781 · MASTRA-PG-005 — Wire MastraStorageExporter for observability traces)", () => {
  it("wires Observability + exporter when MASTRA_OBSERVABILITY_EXPORTER=1 and MASTRA_SCHEMA=mastra", async () => {
    vi.stubEnv("MASTRA_OBSERVABILITY_EXPORTER", "1");
    vi.stubEnv("MASTRA_SCHEMA", "mastra");
    const { getMastra } = await import("./index");

    const mastra = getMastra();
    expect(mastra.observability).toBeInstanceOf(Observability);

    const instance = mastra.observability?.getDefaultInstance();
    expect(instance).toBeDefined();

    const exporters = instance!.exporters ?? [];
    expect(exporters.some((e) => e instanceof MastraStorageExporter)).toBe(true);
    expect(exporters.some((e) => e.name === "mastra-storage-exporter")).toBe(true);

    const processors = instance!.spanOutputProcessors ?? [];
    expect(processors.some((p) => p instanceof SensitiveDataFilter)).toBe(true);
  }, 15_000);

  it("skips Postgres exporter when MASTRA_OBSERVABILITY_EXPORTER is unset (pre-cutover)", async () => {
    vi.stubEnv("MASTRA_SCHEMA", "public");
    const { getMastra } = await import("./index");

    const mastra = getMastra();
    const entry = mastra.observability;
    if (!entry) return;
    expect(entry).not.toBeInstanceOf(Observability);
    const instance = entry.getDefaultInstance?.();
    const exporters = instance?.exporters ?? [];
    expect(exporters.some((e) => e instanceof MastraStorageExporter)).toBe(false);
  }, 15_000);

  it("getMastra fails closed when exporter on and MASTRA_SCHEMA unset", async () => {
    vi.stubEnv("MASTRA_OBSERVABILITY_EXPORTER", "1");
    const { getMastra } = await import("./index");
    expect(() => getMastra()).toThrow(/MASTRA_SCHEMA=mastra/);
  }, 15_000);

  it("getMastra fails closed when exporter on and MASTRA_SCHEMA=public", async () => {
    vi.stubEnv("MASTRA_OBSERVABILITY_EXPORTER", "1");
    vi.stubEnv("MASTRA_SCHEMA", "public");
    const { getMastra } = await import("./index");
    expect(() => getMastra()).toThrow(/got "public"/);
  }, 15_000);
});

describe("assertMastraSchemaForObservabilityExporter (IPI-781 · MASTRA-PG-005 — Wire MastraStorageExporter for observability traces)", () => {
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

  it("isMastraObservabilityExporterEnabled latches only on \"1\"", async () => {
    const { isMastraObservabilityExporterEnabled } = await import("./storage");
    expect(isMastraObservabilityExporterEnabled({})).toBe(false);
    expect(isMastraObservabilityExporterEnabled({ MASTRA_OBSERVABILITY_EXPORTER: "true" })).toBe(
      false,
    );
    expect(isMastraObservabilityExporterEnabled({ MASTRA_OBSERVABILITY_EXPORTER: "1" })).toBe(
      true,
    );
  });
});
