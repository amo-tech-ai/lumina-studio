import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  assertBrandProfile,
  brandProfileContractSchema,
  validateBrandProfilePayload,
} from "./brand-profile-contract";

const schemasDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../supabase/functions/_shared/schemas",
);
const fixturesDir = join(schemasDir, "fixtures");

function loadFixture(name: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8")) as Record<string, unknown>;
}

function loadCanonicalSchema(): {
  title?: string;
  $defs?: Record<string, unknown>;
  required?: string[];
  properties?: Record<string, unknown>;
} {
  return JSON.parse(
    readFileSync(join(schemasDir, "brand-profile.schema.json"), "utf8"),
  ) as ReturnType<typeof loadCanonicalSchema>;
}

describe("Brand DNA JSON Schema SSOT", () => {
  it("canonical Edge schema has claim/evidence defs", () => {
    const schema = loadCanonicalSchema();
    expect(schema.title).toBe("BrandProfile");
    expect(schema.$defs?.claim).toBeDefined();
    expect(schema.$defs?.evidence).toBeDefined();
    expect(schema.required).toContain("schemaVersion");
    expect(schema.required).not.toContain("evidenceSources");
    expect(schema.properties?.tagline).toEqual({
      $ref: "#/$defs/claim",
      description: "Short brand tagline",
    });
  });
});

describe("Brand DNA contract parity fixtures (Edge ↔ Mastra)", () => {
  it("accepts a well-formed profile with evidence", () => {
    const valid = loadFixture("brand-profile-valid.json");
    expect(validateBrandProfilePayload(valid)).toBeNull();
    expect(assertBrandProfile(valid).tagline.value).toBe("Clean essentials");
    expect(brandProfileContractSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects evidence: []", () => {
    const bad = loadFixture("brand-profile-empty-evidence.json");
    expect(validateBrandProfilePayload(bad)).toMatch(/at least one evidence/);
    expect(brandProfileContractSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a bad evidence URL", () => {
    const bad = loadFixture("brand-profile-bad-url.json");
    expect(validateBrandProfilePayload(bad)).toMatch(/valid http/);
  });

  it("rejects an empty evidence quote", () => {
    const bad = loadFixture("brand-profile-empty-quote.json");
    expect(validateBrandProfilePayload(bad)).toMatch(/non-empty quote/);
  });
});
