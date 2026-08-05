import { env, createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("./router", () => ({
  handleRequest: vi.fn(),
}));

import worker from "./index";
import { handleRequest } from "./router";

describe("AI Gateway Worker — unhandled error correlation", () => {
  beforeEach(() => {
    vi.mocked(handleRequest).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shares one request id across the log, response body, and x-request-id header, and keeps the client message sanitized", async () => {
    vi.mocked(handleRequest).mockRejectedValue(new Error("upstream secret detail"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const req = new Request("http://localhost/v1/chat/completions", { method: "POST" });
    const ctx = createExecutionContext();
    const res = await worker.fetch(req, env, ctx);
    await waitOnExecutionContext(ctx);

    const body: any = await res.json();
    const headerId = res.headers.get("x-request-id");

    expect(res.status).toBe(500);
    expect(body.error.code).toBe("internal_error");
    expect(body.error.requestId).toMatch(/^req_/);
    expect(body.error.requestId).toBe(headerId);

    const logCall = errorSpy.mock.calls.find((args) => args[0] === "[gateway] unhandled error");
    expect(logCall).toBeDefined();
    const logPayload = logCall![1] as { requestId: string; error: string };
    expect(logPayload.requestId).toBe(body.error.requestId);
    expect(logPayload.error).toContain("upstream secret detail");

    expect(body.error.message).toBe("AI gateway encountered an unexpected error");
    expect(body.error.message).not.toContain("boom");
    expect(JSON.stringify(body)).not.toContain("secret detail");
  });
});