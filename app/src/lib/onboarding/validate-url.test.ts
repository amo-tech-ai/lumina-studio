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

  // Found in browser QA on fff06ba2: Chrome parsed "https://exa mple.com" into
  // host "exa%20mple.com" and validation let it through, while Node threw. A
  // check that leans on the constructor throwing is therefore green here and
  // broken in front of a user.
  describe("whitespace (browser/Node parser divergence)", () => {
    // These three are ACCEPTED by both parsers without the explicit guard, so
    // they fail this suite if the guard is ever removed.
    it("rejects whitespace in the path, query or fragment", () => {
      expect(validateUrl("https://example.com/a b")).toMatch(/valid url/i);
      expect(validateUrl("https://example.com?q=a b")).toMatch(/valid url/i);
      expect(validateUrl("https://example.com#a b")).toMatch(/valid url/i);
    });

    // Node already throws on this one, so it cannot fail here — it is the case
    // the browser accepted, kept so the reported input stays covered by name.
    it("rejects whitespace in the host", () => {
      expect(validateUrl("https://exa mple.com")).toMatch(/valid url/i);
    });

    it("rejects tabs and newlines, which URL parsers strip silently", () => {
      expect(validateUrl("https://exa\tmple.com")).toMatch(/valid url/i);
      expect(validateUrl("https://exa\nmple.com")).toMatch(/valid url/i);
    });

    it("still accepts a surrounding-whitespace value after trimming", () => {
      expect(validateUrl("  https://example.com  ")).toBeNull();
    });
  });
});
