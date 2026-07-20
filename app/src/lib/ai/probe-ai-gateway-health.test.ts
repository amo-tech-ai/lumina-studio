import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  AI_GATEWAY_HEALTH_REQUEST_URL,
  probeAiGatewayHealth,
} from "./probe-ai-gateway-health";

describe("probeAiGatewayHealth", () => {
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

  it("uses service binding when gatewayFetcher is provided", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: "ok", service: "ai-gateway" }),
    });

    const result = await probeAiGatewayHealth({
      gatewayFetcher: { fetch: fetchMock },
    });

    expect(result.httpStatus).toBe(200);
    expect(result.body.status).toBe("ok");
    expect(result.body.probeVia).toBe("service_binding");
    expect(result.body.gateway).toEqual({ status: "ok", service: "ai-gateway" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const req = fetchMock.mock.calls[0][0] as Request;
    expect(req).toBeInstanceOf(Request);
    expect(req.url).toBe(AI_GATEWAY_HEALTH_REQUEST_URL);
    expect(JSON.stringify(result.body)).not.toContain("test-key");
  });

  it("falls back to AI_GATEWAY_URL when no binding", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: "healthy", version: "0.1.0" }),
    });

    const result = await probeAiGatewayHealth();

    expect(result.httpStatus).toBe(200);
    expect(result.body.probeVia).toBe("url");
    expect(result.body.gatewayUrl).toBe("http://localhost:8787");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://localhost:8787/health",
      expect.objectContaining({ signal: undefined }),
    );
  });

  it("uses DEFAULT_AI_GATEWAY_URL when env unset and no binding", async () => {
    vi.stubEnv("AI_GATEWAY_URL", undefined);
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: "ok" }),
    });

    const result = await probeAiGatewayHealth();

    expect(result.body.gatewayUrl).toBe("http://localhost:8787");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://localhost:8787/health",
      expect.any(Object),
    );
  });

  it("returns 502 with upstream status on gateway 404", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 404 });

    const result = await probeAiGatewayHealth({
      gatewayFetcher: { fetch: fetchMock },
    });

    expect(result.httpStatus).toBe(502);
    expect(result.body.status).toBe("gateway_error");
    expect(result.body.httpStatus).toBe(404);
    expect(result.body.probeVia).toBe("service_binding");
  });

  it("returns 502 on upstream 500 via URL path", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

    const result = await probeAiGatewayHealth();

    expect(result.httpStatus).toBe(502);
    expect(result.body.status).toBe("gateway_error");
    expect(result.body.httpStatus).toBe(500);
    expect(result.body.probeVia).toBe("url");
  });

  it("returns 503 when gateway is unreachable", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));

    const result = await probeAiGatewayHealth();

    expect(result.httpStatus).toBe(503);
    expect(result.body.status).toBe("gateway_unreachable");
    expect(result.body.error).toContain("ECONNREFUSED");
  });

  it("never includes API key material in the body", async () => {
    vi.stubEnv("AI_GATEWAY_API_KEY", "sk-super-secret-value");
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: "ok" }),
    });

    const result = await probeAiGatewayHealth();
    const serialized = JSON.stringify(result.body);

    expect(result.body.hasApiKey).toBe(true);
    expect(serialized).not.toContain("sk-super-secret");
    expect(serialized).not.toMatch(/AI_GATEWAY_API_KEY/);
  });
});
