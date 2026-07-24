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

  it("returns the canonical trimmed tenant key", () => {
    expect(requireResourceId("  org-acme  ")).toBe("org-acme");
    expect(requireThreadId("\tthread-1\n")).toBe("thread-1");
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

  it("fail-closed: null after on rewrite uses Missing validation error", () => {
    expect(() => rejectTenantKeyRewrite("tenant-a", null)).toThrow(
      /Missing resourceId/,
    );
    expect(() => rejectTenantKeyRewrite("tenant-a", null)).toThrow(
      TenantContextError,
    );
  });

  it("fail-closed: blank after on rewrite uses Missing validation error", () => {
    expect(() => rejectTenantKeyRewrite("tenant-a", "")).toThrow(
      /Missing resourceId/,
    );
    expect(() => rejectTenantKeyRewrite("tenant-a", "   ")).toThrow(
      /Missing resourceId/,
    );
  });

  it("fail-closed: null/blank after with threadId name", () => {
    expect(() =>
      rejectTenantKeyRewrite("thread-a", null, "threadId"),
    ).toThrow(/Missing threadId/);
    expect(() =>
      rejectTenantKeyRewrite("thread-a", "  ", "threadId"),
    ).toThrow(/Missing threadId/);
    expect(() =>
      rejectTenantKeyRewrite("thread-a", "thread-b", "threadId"),
    ).toThrow(/threadId rewrite denied/);
  });

  it("padded after that trims to the same key is allowed", () => {
    expect(() =>
      rejectTenantKeyRewrite("tenant-a", "  tenant-a  "),
    ).not.toThrow();
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
    expect(bindTenantScope("  org-1  ", "  thread-1  ")).toEqual({
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
