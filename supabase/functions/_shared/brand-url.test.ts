import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

import fixtures from "./brand-url.fixtures.json" with { type: "json" };
import { normalizeBrandUrl, sameBrandWebsite } from "./brand-url.ts";

Deno.test("normalizeBrandUrl accepts public origins (shared matrix)", () => {
  for (const row of fixtures.accepts) {
    assertEquals(
      normalizeBrandUrl(row.raw),
      row.origin,
      `${row.raw} — ${row.why}`,
    );
  }
});

Deno.test("normalizeBrandUrl rejects unsafe/malformed URLs (shared matrix)", () => {
  for (const row of fixtures.rejects) {
    assertEquals(normalizeBrandUrl(row.raw), null, `${row.raw} — ${row.why}`);
  }
});

Deno.test("sameBrandWebsite agrees with the shared matrix", () => {
  for (const row of fixtures.sameWebsite) {
    assertEquals(
      sameBrandWebsite(row.a, row.b),
      row.same,
      `${row.a} vs ${row.b}`,
    );
  }
});

Deno.test("two unusable URLs are never the same website", () => {
  assertEquals(sameBrandWebsite(null, null), false);
  assertEquals(sameBrandWebsite("http://localhost", "http://localhost"), false);
});
