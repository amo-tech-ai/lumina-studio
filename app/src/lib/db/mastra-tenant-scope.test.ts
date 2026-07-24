import { describe, expect, it } from "vitest";
import {
  bindTenantScope,
  rejectTenantKeyRewrite,
  requireResourceId,
  requireTenantKey,
  requireThreadId,
  TenantContextError,
} from "./mastra-tenant-scope";

describe("mastra-tenant-scope (IPI-621 · CF-DB-007)", () => {
  it("accepts a non-blank resourceId", () => {
    expect(requireResourceId("org-acme")).toBe("org-acme");
  });

  it("fail-closed: missing resourceId", () => {
    expect(() => requireResourceId(undefined)).toThrow(TenantContextError);
    expect(() => requireResourceId(null)).toThrow(/Missing resourceId/);
    expect(() => requireResourceId("")).toThrow(TenantContextError);
    expect(() => requireResourceId("   ")).toThrow(TenantContextError);
  });

  it("fail-closed: missing threadId", () => {
    expect(() => requireThreadId(undefined)).toThrow(/Missing threadId/);
    expect(() => requireThreadId("")).toThrow(TenantContextError);
  });

  it("fail-closed: forged/wrong-tenant key on rewrite", () => {
    expect(() => rejectTenantKeyRewrite("tenant-a", "tenant-b")).toThrow(
      /rewrite denied/,
    );
  });

  it("allows update that does not touch the tenant key", () => {
    expect(() => rejectTenantKeyRewrite("tenant-a", undefined)).not.toThrow();
  });

  it("allows rewrite that keeps the same resourceId", () => {
    expect(() => rejectTenantKeyRewrite("tenant-a", "tenant-a")).not.toThrow();
  });

  it("bindTenantScope requires resourceId and optional threadId", () => {
    expect(bindTenantScope("org-1", "thread-1")).toEqual({
      resourceId: "org-1",
      threadId: "thread-1",
    });
    expect(bindTenantScope("org-1")).toEqual({ resourceId: "org-1" });
    expect(() => bindTenantScope("", "thread-1")).toThrow(TenantContextError);
    expect(() => bindTenantScope("org-1", "")).toThrow(TenantContextError);
  });

  it("requireTenantKey names the missing field", () => {
    expect(() => requireTenantKey(undefined, "threadId")).toThrow(
      /Missing threadId/,
    );
  });
});
