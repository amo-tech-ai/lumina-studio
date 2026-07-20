import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const getCloudflareContext = vi.hoisted(() => vi.fn());

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext,
}));

import { GET } from "./route";

describe("GET /api/ai/health", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.stubEnv("AI_GATEWAY_URL", "http://localhost:8787");
    vi.stubEnv("AI_GATEWAY_API_KEY", "test-key");
    getCloudflareContext.mockRejectedValue(new Error("not on workers"));
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns ok via URL fallback when no service binding", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: "healthy", version: "0.1.0" }),
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.probeVia).toBe("url");
    expect(body.gatewayUrl).toBe("http://localhost:8787");
    expect(body.hasApiKey).toBe(true);
    expect(JSON.stringify(body)).not.toContain("test-key");
  });

  it("prefers AI_GATEWAY service binding when present", async () => {
    const bindingFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: "ok", service: "ai-gateway" }),
    });
    getCloudflareContext.mockResolvedValue({
      env: { AI_GATEWAY: { fetch: bindingFetch } },
    });
    globalThis.fetch = vi.fn();

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.probeVia).toBe("service_binding");
    expect(body.hasApiKey).toBe(true);
    expect(body.gateway).toEqual({ status: "ok", service: "ai-gateway" });
    expect(bindingFetch).toHaveBeenCalled();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("returns 502 when service binding /health is non-ok", async () => {
    const bindingFetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    getCloudflareContext.mockResolvedValue({
      env: { AI_GATEWAY: { fetch: bindingFetch } },
    });
    globalThis.fetch = vi.fn();

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.status).toBe("gateway_error");
    expect(body.probeVia).toBe("service_binding");
    expect(body.httpStatus).toBe(500);
    expect(body.hasApiKey).toBe(true);
    expect(globalThis.fetch).not.toHaveBeenCalled();
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
    expect(body.httpStatus).toBe(500);
  });

  it("returns 503 when gateway is unreachable", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.status).toBe("gateway_unreachable");
    expect(body.error).toContain("ECONNREFUSED");
  });
});
