import { describe, it, expect } from "vitest";
import { handleRequest, type Env } from "./router";

const INCOMING_REQUEST = (
  path: string,
  method = "POST",
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

describe("Bearer token authentication", () => {
  const baseEnv: Env = {
    GEMINI_API_KEY: "test-key",
    CLOUDFLARE_API_TOKEN: "cf-token",
    CLOUDFLARE_ACCOUNT_ID: "account-id",
  };

  describe("when token is configured", () => {
    const envWithToken: Env = {
      ...baseEnv,
      AI_GATEWAY_AUTH_TOKEN: "secret-token-123",
    };

    it("rejects missing Authorization header with 401", async () => {
      const req = INCOMING_REQUEST("/v1/chat/completions", "POST", {
        model: "default",
        messages: [{ role: "user", content: "hi" }],
      });
      const res = await handleRequest(req, envWithToken);
      expect(res.status).toBe(401);
      const data: any = await res.json();
      expect(data.error).toContain("Missing Authorization header");
    });

    it("rejects wrong token with 401", async () => {
      const req = INCOMING_REQUEST(
        "/v1/chat/completions",
        "POST",
        { model: "default", messages: [{ role: "user", content: "hi" }] },
        { Authorization: "Bearer wrong-token" },
      );
      const res = await handleRequest(req, envWithToken);
      expect(res.status).toBe(401);
      const data: any = await res.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("rejects malformed Authorization header with 401", async () => {
      const req = INCOMING_REQUEST(
        "/v1/chat/completions",
        "POST",
        { model: "default", messages: [{ role: "user", content: "hi" }] },
        { Authorization: "Basic dXNlcjpwYXNz" },
      );
      const res = await handleRequest(req, envWithToken);
      expect(res.status).toBe(401);
      const data: any = await res.json();
      expect(data.error).toContain("Invalid Authorization header format");
    });

    it("rejects scheme without space (Bearer-token) with 401", async () => {
      const req = INCOMING_REQUEST(
        "/v1/chat/completions",
        "POST",
        { model: "default", messages: [{ role: "user", content: "hi" }] },
        { Authorization: "Bearertoken123" },
      );
      const res = await handleRequest(req, envWithToken);
      expect(res.status).toBe(401);
      const data: any = await res.json();
      expect(data.error).toContain("Invalid Authorization header format");
    });

    it("accepts valid Bearer token", async () => {
      const req = INCOMING_REQUEST(
        "/v1/chat/completions",
        "POST",
        { model: "default", messages: [{ role: "user", content: "hi" }] },
        { Authorization: "Bearer secret-token-123" },
      );
      const res = await handleRequest(req, envWithToken);
      // Will fail downstream (no real provider), but auth passes → not 401
      expect(res.status).not.toBe(401);
    });

    it("accepts case-insensitive Bearer scheme", async () => {
      const req = INCOMING_REQUEST(
        "/v1/chat/completions",
        "POST",
        { model: "default", messages: [{ role: "user", content: "hi" }] },
        { Authorization: "bearer secret-token-123" },
      );
      const res = await handleRequest(req, envWithToken);
      expect(res.status).not.toBe(401);
    });

    it("allows GET /health without auth", async () => {
      const req = new Request("http://localhost/health", { method: "GET" });
      const res = await handleRequest(req, envWithToken);
      expect(res.status).toBe(200);
    });

    it("allows GET / without auth", async () => {
      const req = new Request("http://localhost/", { method: "GET" });
      const res = await handleRequest(req, envWithToken);
      expect(res.status).toBe(200);
    });

    it("rejects POST /v1/embeddings without auth", async () => {
      const req = INCOMING_REQUEST("/v1/embeddings", "POST", {
        model: "embedding",
        input: ["test"],
      });
      const res = await handleRequest(req, envWithToken);
      expect(res.status).toBe(401);
    });

    it("accepts valid token on POST /v1/embeddings", async () => {
      const req = INCOMING_REQUEST(
        "/v1/embeddings",
        "POST",
        { model: "embedding", input: ["test"] },
        { Authorization: "Bearer secret-token-123" },
      );
      const res = await handleRequest(req, envWithToken);
      // Auth passes (may fail downstream), but not 401
      expect(res.status).not.toBe(401);
    });
  });

  describe("when token is not configured", () => {
    const envNoToken: Env = { ...baseEnv };

    it("rejects POST request with 401 when AI_GATEWAY_ALLOW_UNAUTHENTICATED is not set", async () => {
      const req = INCOMING_REQUEST("/v1/chat/completions", "POST", {
        model: "default",
        messages: [{ role: "user", content: "hi" }],
      });
      const res = await handleRequest(req, envNoToken);
      expect(res.status).toBe(401);
      const data: any = await res.json();
      expect(data.error).toContain("not configured");
    });

    it("rejects POST with Authorization header when token not configured", async () => {
      const req = INCOMING_REQUEST(
        "/v1/chat/completions",
        "POST",
        { model: "default", messages: [{ role: "user", content: "hi" }] },
        { Authorization: "Bearer any-token" },
      );
      const res = await handleRequest(req, envNoToken);
      expect(res.status).toBe(401);
      const data: any = await res.json();
      expect(data.error).toContain("not configured");
    });

    it("allows GET /health without configuration", async () => {
      const req = new Request("http://localhost/health", { method: "GET" });
      const res = await handleRequest(req, envNoToken);
      expect(res.status).toBe(200);
    });

    it("allows POST when AI_GATEWAY_ALLOW_UNAUTHENTICATED is true (dev mode)", async () => {
      const envDevMode: Env = {
        ...baseEnv,
        AI_GATEWAY_ALLOW_UNAUTHENTICATED: "true",
      };
      const req = INCOMING_REQUEST("/v1/chat/completions", "POST", {
        model: "default",
        messages: [{ role: "user", content: "hi" }],
      });
      const res = await handleRequest(req, envDevMode);
      // Auth bypassed in dev mode → will fail downstream, not 401
      expect(res.status).not.toBe(401);
    });

    it("rejects POST when AI_GATEWAY_ALLOW_UNAUTHENTICATED is false", async () => {
      const envNoBypass: Env = {
        ...baseEnv,
        AI_GATEWAY_ALLOW_UNAUTHENTICATED: "false",
      };
      const req = INCOMING_REQUEST("/v1/chat/completions", "POST", {
        model: "default",
        messages: [{ role: "user", content: "hi" }],
      });
      const res = await handleRequest(req, envNoBypass);
      expect(res.status).toBe(401);
    });
  });

  describe("auth gate placement (before body parsing)", () => {
    const envWithToken: Env = {
      ...baseEnv,
      AI_GATEWAY_AUTH_TOKEN: "secret-token",
    };

    it("rejects malformed JSON body with 401 on auth failure (not 400)", async () => {
      const req = new Request("http://localhost/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{invalid json}", // Invalid JSON
      });
      const res = await handleRequest(req, envWithToken);
      // Auth fails before body parse → 401, not 400
      expect(res.status).toBe(401);
    });

    it("parses body only after auth succeeds", async () => {
      const req = INCOMING_REQUEST(
        "/v1/chat/completions",
        "POST",
        { model: "default", messages: [{ role: "user", content: "hi" }] },
        { Authorization: "Bearer secret-token" },
      );
      const res = await handleRequest(req, envWithToken);
      // Auth succeeds → body parsed → downstream handling
      expect(res.status).not.toBe(401);
    });
  });
});
