import { env, createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import worker from "./index";

const INCOMING_REQUEST = (
  path: string,
  method = "GET",
  body?: unknown,
  headers?: Record<string, string>,
): Request => {
  const defaultHeaders: Record<string, string> = { "Content-Type": "application/json" };
  return new Request(`http://localhost${path}`, {
    method,
    headers: { ...defaultHeaders, ...headers },
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
    const req = INCOMING_REQUEST(
      "/v1/unknown",
      "POST",
      { model: "test" },
      { Authorization: "Bearer test-token" },
    );
    const ctx = createExecutionContext();
    const res = await worker.fetch(req, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(404);
  });

  it("rejects empty embed input with 400 envelope", async () => {
    const req = INCOMING_REQUEST(
      "/v1/embeddings",
      "POST",
      {
        model: "embedding",
        input: [],
      },
      { Authorization: "Bearer test-token" },
    );
    const ctx = createExecutionContext();
    const res = await worker.fetch(req, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(400);
    const data: any = await res.json();
    expect(data.error.code).toBe("invalid_request");
    expect(data.error.requestId).toMatch(/^req_/);
  });

  it("rejects unsupported embed model with 400 envelope", async () => {
    const req = INCOMING_REQUEST(
      "/v1/embeddings",
      "POST",
      {
        model: "gemini-3.1-flash-lite",
        input: ["hello"],
      },
      { Authorization: "Bearer test-token" },
    );
    const ctx = createExecutionContext();
    const res = await worker.fetch(req, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(400);
    const data: any = await res.json();
    expect(data.error.code).toBe("unsupported_embedding_model");
  });

  it("includes gateway version header", async () => {
    const req = INCOMING_REQUEST("/");
    const ctx = createExecutionContext();
    const res = await worker.fetch(req, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.headers.get("X-AI-Gateway-Version")).toBe("0.1.0");
  });
});
