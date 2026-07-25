import { describe, expect, it } from "vitest";
import { makeMemoryResourceId, makeThreadId } from "./memory";
import { TenantContextError } from "@/lib/db/mastra-tenant-scope";

describe("memory", () => {
  it("makeThreadId produces correct format", () => {
    expect(makeThreadId("org_abc", "shoot", "brand_xyz")).toBe(
      "org_abc/shoot/brand_xyz",
    );
    expect(makeThreadId("org_abc", "brand-intake", "draft_1")).toBe(
      "org_abc/brand-intake/draft_1",
    );
  });

  it("makeThreadId encodes slashes in segments to prevent collisions", () => {
    const t1 = makeThreadId("org", "shoot", "shoot/foo");
    const t2 = makeThreadId("org/shoot", "shoot", "foo");
    expect(t1).not.toBe(t2);
  });
});

describe("makeMemoryResourceId — IPI-146 · MASTRA-GOV-002", () => {
  it("produces the documented org:{orgId}::user:{userId} format", () => {
    expect(makeMemoryResourceId("org_abc", "user_123")).toBe(
      "org:org_abc::user:user_123",
    );
  });

  it("is stable/deterministic for the same inputs", () => {
    expect(makeMemoryResourceId("org_abc", "user_123")).toBe(
      makeMemoryResourceId("org_abc", "user_123"),
    );
  });

  it("produces different ids for the same user in different orgs", () => {
    const a = makeMemoryResourceId("org_a", "user_123");
    const b = makeMemoryResourceId("org_b", "user_123");
    expect(a).not.toBe(b);
  });

  it("produces different ids for different users in the same org", () => {
    const a = makeMemoryResourceId("org_abc", "user_1");
    const b = makeMemoryResourceId("org_abc", "user_2");
    expect(a).not.toBe(b);
  });

  it("percent-encodes segments to prevent collisions across the ::/: delimiters", () => {
    const collision1 = makeMemoryResourceId("org", "abc::user:x");
    const collision2 = makeMemoryResourceId("org::user:abc", "x");
    expect(collision1).not.toBe(collision2);
  });

  it("fails closed on a blank orgId", () => {
    expect(() => makeMemoryResourceId("", "user_123")).toThrow(TenantContextError);
    expect(() => makeMemoryResourceId("   ", "user_123")).toThrow(TenantContextError);
  });

  it("fails closed on a blank userId", () => {
    expect(() => makeMemoryResourceId("org_abc", "")).toThrow(TenantContextError);
  });

  it("fails closed on non-string inputs", () => {
    // @ts-expect-error — intentionally invalid input for a runtime fail-closed check
    expect(() => makeMemoryResourceId(null, "user_123")).toThrow(TenantContextError);
    // @ts-expect-error — intentionally invalid input for a runtime fail-closed check
    expect(() => makeMemoryResourceId("org_abc", undefined)).toThrow(TenantContextError);
  });
});
