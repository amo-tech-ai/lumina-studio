import { describe, expect, it } from "vitest";

import { validateUrl } from "./validate-url";

describe("validateUrl", () => {
  it("accepts valid HTTP and HTTPS URLs", () => {
    expect(validateUrl("http://example.com")).toBeNull();
    expect(validateUrl("https://example.com/path?q=1")).toBeNull();
  });

  it("rejects non-HTTP protocols and syntactically invalid URLs", () => {
    expect(validateUrl("ftp://example.com")).toMatch(/http:\/\/ or https:\/\//i);
    expect(validateUrl("https://example.com:99999")).toMatch(/valid url/i);
  });

  it("preserves the required-field response", () => {
    expect(validateUrl("   ")).toBe("Website URL is required");
  });
});
