import { afterEach, describe, expect, it, vi } from "vitest";
import { handleEmbed } from "./router";

describe("handleEmbed contracts (IPI-492)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns 400 invalid_request for empty input without calling provider", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const res = await handleEmbed(
      { model: "embedding", input: [] },
      {
        CLOUDFLARE_API_TOKEN: "tok",
        CLOUDFLARE_ACCOUNT_ID: "acct",
      },
    );

    expect(res.status).toBe(400);
    const body = (await res.json()) as {
      error: { code: string; message: string; requestId: string };
    };
    expect(body.error.code).toBe("invalid_request");
    expect(body.error.requestId).toMatch(/^req_/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 400 unsupported_embedding_model for chat models without calling provider", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const res = await handleEmbed(
      { model: "gemini-3.1-flash-lite", input: ["hello"] },
      {
        CLOUDFLARE_API_TOKEN: "tok",
        CLOUDFLARE_ACCOUNT_ID: "acct",
        GEMINI_API_KEY: "gem",
      },
    );

    expect(res.status).toBe(400);
    const body = (await res.json()) as {
      error: { code: string; message: string };
    };
    expect(body.error.code).toBe("unsupported_embedding_model");
    expect(body.error.message).toMatch(/not configured for embeddings/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 400 for default chat tier on embed path", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const res = await handleEmbed(
      { model: "default", input: ["hello"] },
      { CLOUDFLARE_API_TOKEN: "tok", CLOUDFLARE_ACCOUNT_ID: "acct" },
    );

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("unsupported_embedding_model");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps provider failure into sanitized envelope", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: () => Promise.resolve("rate limited"),
      }),
    );

    const res = await handleEmbed(
      { model: "embedding", input: ["hello"] },
      {
        CLOUDFLARE_API_TOKEN: "tok",
        CLOUDFLARE_ACCOUNT_ID: "acct",
      },
    );

    expect(res.status).toBe(429);
    const body = (await res.json()) as {
      error: {
        code: string;
        message: string;
        providerStatus?: number;
        retryable?: boolean;
        requestId: string;
      };
    };
    expect(body.error.code).toBe("provider_rate_limited");
    expect(body.error.providerStatus).toBe(429);
    expect(body.error.retryable).toBe(true);
    expect(body.error.message).toBe("Embedding provider rate limit exceeded");
    expect(body.error.message).not.toContain("tok"); // no secrets
    expect(body.error.requestId).toMatch(/^req_/);
  });
});
