import { env, createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import worker from "./index";

const INCOMING_REQUEST = (path: string, method = "GET", body?: unknown): Request => {
  return new Request(`http://localhost${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
};

describe("AI Gateway Worker", () => {
  it("returns health on GET /", async () => {
    const req = INCOMING_REQUEST("/");
    const ctx = createExecutionContext();
    const res = await worker.fetch(req, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(data.status).toBe("ok");
    expect(data.service).toBe("ai-gateway");
  });

  it("returns health on GET /health", async () => {
    const req = INCOMING_REQUEST("/health");
    const ctx = createExecutionContext();
    const res = await worker.fetch(req, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(data.status).toBe("ok");
  });

  it("returns 405 for non-POST on /v1/chat/completions", async () => {
    const req = INCOMING_REQUEST("/v1/chat/completions", "GET");
    const ctx = createExecutionContext();
    const res = await worker.fetch(req, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(405);
  });

  it("returns 404 for unknown endpoints", async () => {
    const req = INCOMING_REQUEST("/v1/unknown", "POST", { model: "test" });
    const ctx = createExecutionContext();
    const res = await worker.fetch(req, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(404);
  });

  it("includes gateway version header", async () => {
    const req = INCOMING_REQUEST("/");
    const ctx = createExecutionContext();
    const res = await worker.fetch(req, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.headers.get("X-AI-Gateway-Version")).toBe("0.1.0");
  });
});
