import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const getCloudflareContext = vi.hoisted(() => vi.fn());

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext,
}));

import { POST } from "./route";

function req(headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/internal/cloudflare-ai-gateway-smoke", {
    method: "POST",
    headers,
  });
}

describe("POST /api/internal/cloudflare-ai-gateway-smoke", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    getCloudflareContext.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns 404 when ENABLE_CF_AI_SMOKE is not true", async () => {
    getCloudflareContext.mockResolvedValue({
      env: { ENABLE_CF_AI_SMOKE: "false" },
    });

    const res = await POST(req({ "X-Internal-Secret": "secret" }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("not_found");
    expect(body.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("keeps route dark when Wrangler flag is false even if process.env is true", async () => {
    vi.stubEnv("ENABLE_CF_AI_SMOKE", "true");
    getCloudflareContext.mockResolvedValue({
      env: {
        ENABLE_CF_AI_SMOKE: "false",
        INTERNAL_WEBHOOK_SECRET: "expected",
        AI: { run: vi.fn() },
      },
    });

    const res = await POST(req({ "X-Internal-Secret": "expected" }));
    expect(res.status).toBe(404);
  });

  it("returns 401 when secret is wrong", async () => {
    getCloudflareContext.mockResolvedValue({
      env: {
        ENABLE_CF_AI_SMOKE: "true",
        INTERNAL_WEBHOOK_SECRET: "expected",
        AI: { run: vi.fn() },
      },
    });

    const res = await POST(req({ "X-Internal-Secret": "wrong" }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("unauthorized");
  });

  it("returns 503 when AI binding is missing", async () => {
    getCloudflareContext.mockResolvedValue({
      env: {
        ENABLE_CF_AI_SMOKE: "true",
        INTERNAL_WEBHOOK_SECRET: "expected",
      },
    });

    const res = await POST(req({ "X-Internal-Secret": "expected" }));
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.error).toBe("ai_binding_missing");
  });

  it("returns 200 with correlation ids on success", async () => {
    const run = vi.fn().mockResolvedValue({ response: "ok" });
    const getLog = vi.fn().mockResolvedValue({ id: "log-1", status: 200 });
    getCloudflareContext.mockResolvedValue({
      env: {
        ENABLE_CF_AI_SMOKE: "true",
        INTERNAL_WEBHOOK_SECRET: "expected",
        AI: {
          run,
          aiGatewayLogId: "gw-log-abc",
          gateway: () => ({ getLog }),
        },
      },
    });

    const res = await POST(
      req({ "X-Internal-Secret": "expected", "cf-ray": "ray-test-1" }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.aiGatewayLogId).toBe("gw-log-abc");
    expect(body.cfRay).toBe("ray-test-1");
    expect(body.gatewayId).toBe("ipix-prod");
    expect(body.model).toBe("@cf/moonshotai/kimi-k2.6");
    expect(body.generatedTextLength).toBe(2);
    expect(typeof body.latencyMs).toBe("number");
    expect(body.logPoll).toEqual({ status: "ok", hasLog: true });
    expect(run).toHaveBeenCalledWith(
      "@cf/moonshotai/kimi-k2.6",
      { messages: [{ role: "user", content: "Fixed server smoke" }] },
      { gateway: { id: "ipix-prod", skipCache: true } },
    );
    expect(getLog).toHaveBeenCalledWith("gw-log-abc");
  });

  it("accepts OpenAI-shaped choices[].message.content (kimi-k2.6)", async () => {
    const run = vi.fn().mockResolvedValue({
      choices: [{ message: { content: "pong" } }],
    });
    const getLog = vi.fn().mockResolvedValue({ id: "log-1" });
    getCloudflareContext.mockResolvedValue({
      env: {
        ENABLE_CF_AI_SMOKE: "true",
        INTERNAL_WEBHOOK_SECRET: "expected",
        AI: {
          run,
          aiGatewayLogId: "gw-log-choices",
          gateway: () => ({ getLog }),
        },
      },
    });

    const res = await POST(req({ "X-Internal-Secret": "expected" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.generatedTextLength).toBe(4);
  });

  it("fails when model output is empty", async () => {
    const run = vi.fn().mockResolvedValue({ response: "   " });
    getCloudflareContext.mockResolvedValue({
      env: {
        ENABLE_CF_AI_SMOKE: "true",
        INTERNAL_WEBHOOK_SECRET: "expected",
        AI: {
          run,
          aiGatewayLogId: "gw-log-abc",
          gateway: () => ({ getLog: vi.fn() }),
        },
      },
    });

    const res = await POST(req({ "X-Internal-Secret": "expected" }));
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.ok).toBe(false);
    expect(body.error).toBe("empty_model_output");
  });

  it("fails when aiGatewayLogId is missing", async () => {
    const run = vi.fn().mockResolvedValue({ response: "ok" });
    getCloudflareContext.mockResolvedValue({
      env: {
        ENABLE_CF_AI_SMOKE: "true",
        INTERNAL_WEBHOOK_SECRET: "expected",
        AI: { run },
      },
    });

    const res = await POST(req({ "X-Internal-Secret": "expected" }));
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.ok).toBe(false);
    expect(body.error).toBe("gateway_log_missing");
  });

  it("fails when gateway() throws after a successful run", async () => {
    const run = vi.fn().mockResolvedValue({ response: "ok" });
    getCloudflareContext.mockResolvedValue({
      env: {
        ENABLE_CF_AI_SMOKE: "true",
        INTERNAL_WEBHOOK_SECRET: "expected",
        AI: {
          run,
          aiGatewayLogId: "gw-log-abc",
          gateway: () => {
            throw new Error("gateway boom");
          },
        },
      },
    });

    const res = await POST(req({ "X-Internal-Secret": "expected" }));
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.ok).toBe(false);
    expect(body.error).toBe("gateway_log_unconfirmed");
    expect(body.logPoll).toEqual({ status: "pending", reason: "gateway boom" });
  });

  it("returns 504 when AI.run times out", async () => {
    vi.useFakeTimers();
    const run = vi.fn().mockImplementation(
      () => new Promise(() => {}),
    );
    getCloudflareContext.mockResolvedValue({
      env: {
        ENABLE_CF_AI_SMOKE: "true",
        INTERNAL_WEBHOOK_SECRET: "expected",
        AI: { run },
      },
    });

    const pending = POST(req({ "X-Internal-Secret": "expected" }));
    await vi.advanceTimersByTimeAsync(15_000);
    const res = await pending;
    const body = await res.json();

    expect(res.status).toBe(504);
    expect(body.error).toBe("timeout");
    vi.useRealTimers();
  });
});
