import { describe, expect, it } from "vitest";

import { sanitizeCrmSearchTerm } from "./search";

describe("sanitizeCrmSearchTerm", () => {
  it("escapes ilike wildcards and strips postgrest or() separators", () => {
    expect(sanitizeCrmSearchTerm(" acme,%_() ")).toBe("acme\\%\\_");
  });
});
