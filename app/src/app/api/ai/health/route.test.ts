import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "./route";

describe("GET /api/ai/health", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.stubEnv("AI_GATEWAY_URL", "http://localhost:8787");
    vi.stubEnv("AI_GATEWAY_API_KEY", "test-key");
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns ok when gateway /health responds", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: "healthy", version: "0.1.0" }),
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.gatewayUrl).toBe("http://localhost:8787");
    expect(body.hasApiKey).toBe(true);
    expect(body.adapterAvailable).toBe(true);
    expect(body.gateway).toEqual({ status: "healthy", version: "0.1.0" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://localhost:8787/health",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("returns 502 when gateway /health is non-ok", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.status).toBe("gateway_error");
    expect(body.adapterAvailable).toBe(true);
  });

  it("returns 503 when gateway is unreachable", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.status).toBe("gateway_unreachable");
    expect(body.error).toContain("ECONNREFUSED");
    expect(body.adapterAvailable).toBe(true);
  });
});
