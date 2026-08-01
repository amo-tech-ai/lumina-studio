import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  assertBrandProfile,
  brandProfileContractSchema,
  brandProfileJsonSchema,
  validateBrandProfilePayload,
} from "./brand-profile-contract";

const fixturesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../supabase/functions/_shared/schemas/fixtures",
);

function loadFixture(name: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8")) as Record<string, unknown>;
}

describe("Brand DNA JSON Schema SSOT", () => {
  it("exports the canonical schema with claim/evidence defs", () => {
    expect(brandProfileJsonSchema.title).toBe("BrandProfile");
    expect(brandProfileJsonSchema.$defs?.claim).toBeDefined();
    expect(brandProfileJsonSchema.$defs?.evidence).toBeDefined();
    expect(brandProfileJsonSchema.required).toContain("schemaVersion");
    expect(brandProfileJsonSchema.required).not.toContain("evidenceSources");
    expect(brandProfileJsonSchema.properties?.tagline).toEqual({
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
