/**
 * IPI-834 — Edge-side parity against the same fixtures Mastra/app uses.
 */
import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

import brandProfileStrictJsonSchema from "./brand-profile.schema.json" with {
  type: "json",
};
import {
  BRAND_PROFILE_SCHEMA_VERSION,
  validateBrandProfilePayload,
} from "./brand-profile.ts";

async function loadFixture(name: string): Promise<Record<string, unknown>> {
  const url = new URL(`./fixtures/${name}`, import.meta.url);
  return JSON.parse(await Deno.readTextFile(url)) as Record<string, unknown>;
}

Deno.test("JSON Schema SSOT includes claim/evidence defs (IPI-834)", () => {
  assertEquals(brandProfileStrictJsonSchema.type, "object");
  assertExists(brandProfileStrictJsonSchema.$defs?.claim);
  assertExists(brandProfileStrictJsonSchema.$defs?.evidence);
  assertEquals(
    brandProfileStrictJsonSchema.required.includes("schemaVersion"),
    true,
  );
  assertEquals(
    brandProfileStrictJsonSchema.required.includes("evidenceSources"),
    false,
  );
});

Deno.test("validateBrandProfilePayload accepts well-formed evidence-backed profile", async () => {
  const valid = await loadFixture("brand-profile-valid.json");
  assertEquals(valid.schemaVersion, BRAND_PROFILE_SCHEMA_VERSION);
  assertEquals(validateBrandProfilePayload(valid), null);
});

Deno.test("validateBrandProfilePayload rejects empty evidence array", async () => {
  const bad = await loadFixture("brand-profile-empty-evidence.json");
  const err = validateBrandProfilePayload(bad);
  assertExists(err);
  assertEquals(err.includes("at least one evidence"), true);
});

Deno.test("validateBrandProfilePayload rejects bad evidence URL", async () => {
  const bad = await loadFixture("brand-profile-bad-url.json");
  const err = validateBrandProfilePayload(bad);
  assertExists(err);
  assertEquals(err.includes("valid http"), true);
});

Deno.test("validateBrandProfilePayload rejects empty quote", async () => {
  const bad = await loadFixture("brand-profile-empty-quote.json");
  const err = validateBrandProfilePayload(bad);
  assertExists(err);
  assertEquals(err.includes("non-empty quote"), true);
});
