import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ─── Helpers ────────────────────────────────────────────────────────────────

const VALID_BODY = {
  anon_id: "anon-abc-123",
  email: "visitor@brand.co",
  service_interest: "shopify",
  message_summary: "Interested in Shopify product photography",
  lead_answers: { company: "Cool Brand" },
  budget: "$5k–$10k",
  timeline: "Q3 2026",
  website: "https://coolbrand.co",
};

function makeRequest(
  body: unknown,
  headers: Record<string, string> = {},
): Request {
  return new Request("http://localhost/api/marketing-lead", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

async function importRoute() {
  const mod = await import("./route");
  return mod;
}

// ─── Env + fetch setup ──────────────────────────────────────────────────────

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
  vi.stubEnv("CAPTURE_LEAD_PROXY_SECRET", "test-proxy-secret");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.resetModules();
});

// ─── Anonymous access ────────────────────────────────────────────────────────

describe("marketing-lead — anonymous access", () => {
  it("accepts valid payload without auth header", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response(
          JSON.stringify({ draftId: "d-123", status: "draft" }),
          { status: 200 },
        ),
      ),
    );
    const { POST } = await importRoute();
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.draftId).toBe("d-123");
  });
});

// ─── Payload validation ──────────────────────────────────────────────────────

describe("marketing-lead — payload validation", () => {
  it("rejects invalid JSON with 422", async () => {
    const { POST } = await importRoute();
    const req = new Request("http://localhost/api/marketing-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(422);
  });

  it("rejects missing anon_id with 422", async () => {
    const { POST } = await importRoute();
    const res = await POST(makeRequest({ ...VALID_BODY, anon_id: undefined }));
    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data.error).toMatch(/Validation/i);
  });

  it("rejects missing email with 422", async () => {
    const { POST } = await importRoute();
    const res = await POST(makeRequest({ ...VALID_BODY, email: undefined }));
    expect(res.status).toBe(422);
  });

  it("rejects malformed email with 422", async () => {
    const { POST } = await importRoute();
    const res = await POST(makeRequest({ ...VALID_BODY, email: "not-an-email" }));
    expect(res.status).toBe(422);
  });

  it("rejects unknown service_interest with 422", async () => {
    const { POST } = await importRoute();
    const res = await POST(
      makeRequest({ ...VALID_BODY, service_interest: "operator-dashboard" }),
    );
    expect(res.status).toBe(422);
  });

  it("rejects missing message_summary with 422", async () => {
    const { POST } = await importRoute();
    const res = await POST(
      makeRequest({ ...VALID_BODY, message_summary: undefined }),
    );
    expect(res.status).toBe(422);
  });

  it("strips non-UUID conversation_id before forwarding to capture-lead", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ draftId: "d-xyz" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const { POST } = await importRoute();
    const res = await POST(
      makeRequest({ ...VALID_BODY, conversation_id: "stale-not-a-uuid" }),
    );
    expect(res.status).toBe(200);
    const [, opts] = mockFetch.mock.calls[0];
    const body = JSON.parse(String((opts as RequestInit).body));
    expect(body.conversation_id).toBeUndefined();
  });
});

// ─── LeadPayload routing to capture-lead ────────────────────────────────────

describe("marketing-lead — capture-lead integration", () => {
  it("POSTs to the correct capture-lead URL", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ draftId: "d-xyz" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const { POST } = await importRoute();
    await POST(makeRequest(VALID_BODY));

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe("https://test.supabase.co/functions/v1/capture-lead");
  });

  it("passes Authorization: Bearer anon-key", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ draftId: "d-xyz" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const { POST } = await importRoute();
    await POST(makeRequest(VALID_BODY));

    const [, opts] = mockFetch.mock.calls[0];
    expect((opts as RequestInit).headers).toMatchObject({
      Authorization: "Bearer test-anon-key",
    });
  });

  it("sends x-ipix-proxy-secret header when env var is set", async () => {
    vi.stubEnv("CAPTURE_LEAD_PROXY_SECRET", "test-proxy-secret");
    const mockFetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ draftId: "d-xyz" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const { POST } = await importRoute();
    await POST(makeRequest(VALID_BODY));

    const [, opts] = mockFetch.mock.calls[0];
    expect((opts as RequestInit).headers).toMatchObject({
      "x-ipix-proxy-secret": "test-proxy-secret",
    });
  });

  it("forwards client IP to Edge for rate limiting", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ draftId: "d-xyz" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const { POST } = await importRoute();
    await POST(
      makeRequest(VALID_BODY, { "x-forwarded-for": "198.51.100.7, 10.0.0.1" }),
    );

    const [, opts] = mockFetch.mock.calls[0];
    expect((opts as RequestInit).headers).toMatchObject({
      "x-forwarded-for": "198.51.100.7",
      "x-real-ip": "198.51.100.7",
    });
  });

  it("returns 500 when CAPTURE_LEAD_PROXY_SECRET is not set", async () => {
    vi.stubEnv("CAPTURE_LEAD_PROXY_SECRET", "");
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);

    const { POST } = await importRoute();
    const res = await POST(makeRequest(VALID_BODY));

    expect(res.status).toBe(500);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("maps website → brand_url in the capture-lead payload", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ draftId: "d-xyz" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const { POST } = await importRoute();
    await POST(makeRequest(VALID_BODY));

    const [, opts] = mockFetch.mock.calls[0];
    const body = JSON.parse((opts as RequestInit).body as string);
    expect(body.brand_url).toBe("https://coolbrand.co");
    expect(body.website).toBeUndefined();
  });

  it("forwards name to capture-lead payload when provided (C1 regression guard)", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ draftId: "d-xyz" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const { POST } = await importRoute();
    await POST(makeRequest({ ...VALID_BODY, name: "Jordan Lee" }));

    const [, opts] = mockFetch.mock.calls[0];
    const body = JSON.parse((opts as RequestInit).body as string);
    expect(body.name).toBe("Jordan Lee");
  });

  it("omits name from capture-lead payload when absent or empty (C1 fix)", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ draftId: "d-xyz" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const { POST } = await importRoute();
    await POST(makeRequest({ ...VALID_BODY, name: "" }));

    const [, opts] = mockFetch.mock.calls[0];
    const body = JSON.parse((opts as RequestInit).body as string);
    expect(body).not.toHaveProperty("name");
  });

  it("returns only draftId (claimToken stripped from response)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response(
          JSON.stringify({ draftId: "d-99", status: "ready", claimToken: "secret-uuid" }),
          { status: 200 },
        ),
      ),
    );
    const { POST } = await importRoute();
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.draftId).toBe("d-99");
    // claimToken must never reach the browser
    expect(data.claimToken).toBeUndefined();
    expect(data.status).toBeUndefined();
  });

  it("sets claim_token as httpOnly cookie when edge fn returns claimToken", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response(
          JSON.stringify({ draftId: "d-99", status: "ready", claimToken: "tok-abc-123" }),
          { status: 200 },
        ),
      ),
    );
    const { POST } = await importRoute();
    const res = await POST(makeRequest(VALID_BODY));
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("claim_token=tok-abc-123");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Strict");
  });

  it("does not set cookie when edge fn omits claimToken", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify({ draftId: "d-99", status: "ready" }), { status: 200 }),
      ),
    );
    const { POST } = await importRoute();
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.headers.get("set-cookie")).toBeNull();
  });
});

// ─── Error handling ──────────────────────────────────────────────────────────

describe("marketing-lead — error handling", () => {
  it("returns 503 when capture-lead is unreachable (network error)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValueOnce(new Error("ECONNREFUSED")),
    );
    const { POST } = await importRoute();
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error).toMatch(/unavailable/i);
  });

  it("forwards capture-lead 422 back to caller", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: "validation_error", message: "anon_id required" }),
          { status: 422 },
        ),
      ),
    );
    const { POST } = await importRoute();
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(422);
  });

  it("forwards capture-lead 429 (rate limit) back to caller", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "rate_limited" }), { status: 429 }),
      ),
    );
    const { POST } = await importRoute();
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(429);
  });

  it("returns 500 when SUPABASE env vars are missing", async () => {
    vi.unstubAllEnvs();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    vi.resetModules();
    const { POST } = await importRoute();
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(500);
  });
});

// ─── Operator agent exposure (no operator routes) ────────────────────────────

describe("marketing-lead — no operator exposure", () => {
  it("route does not import withOperatorAuth", async () => {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const routePath = resolve(
      fileURLToPath(new URL(".", import.meta.url)),
      "route.ts",
    );
    const src = readFileSync(routePath, "utf8");
    expect(src).not.toMatch(/withOperatorAuth/);
    expect(src).not.toMatch(/resolveOperatorUser/);
    expect(src).not.toMatch(/service.?role/i);
  });
});
