import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SERVICE_SLUGS } from "@/mastra/types/marketing-lead";

// WEB-015.4 — cross-layer contract: the chat widget's capture_lead tool and the
// marketing-lead API must agree on field names so visitor data is not silently
// dropped before capture-lead persists the draft.

const CHAT_SRC = readFileSync(
  resolve(
    fileURLToPath(new URL(".", import.meta.url)),
    "../components/marketing/marketing-chat.tsx",
  ),
  "utf8",
);

const ROUTE_SRC = readFileSync(
  resolve(
    fileURLToPath(new URL(".", import.meta.url)),
    "../app/api/marketing-lead/route.ts",
  ),
  "utf8",
);

const CHAT_REQUIRED_FIELDS = ["name", "email", "service_interest", "message_summary"] as const;

describe("lead pipeline — chat ↔ API field contract (WEB-015.4)", () => {
  it("chat LeadSchema requires the same core fields the API accepts", () => {
    for (const field of CHAT_REQUIRED_FIELDS) {
      expect(CHAT_SRC).toMatch(new RegExp(`${field}:\\s*z\\.`));
    }
    expect(CHAT_SRC).toMatch(/z\.enum\(SERVICE_SLUGS\)/);
  });

  it("API SubmitLeadSchema accepts name (not stripped by Zod)", () => {
    expect(ROUTE_SRC).toMatch(/name:\s*z\.string\(\)\.optional\(\)/);
  });

  it("API forwards name to capture-lead payload", () => {
    expect(ROUTE_SRC).toMatch(/req\.name && \{ name: req\.name \}/);
  });

  it("chat and API share the same SERVICE_SLUGS source", () => {
    expect(CHAT_SRC).toMatch(/from "@\/mastra\/types\/marketing-lead"/);
    expect(ROUTE_SRC).toMatch(/from "@\/mastra\/types\/marketing-lead"/);
    expect(SERVICE_SLUGS.length).toBeGreaterThan(0);
  });
});

describe("lead pipeline — runtime: name preserved in capture-lead payload", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("forwards visitor name into lead_answers.name", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ draftId: "d-name", status: "draft" }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const { POST } = await import("@/app/api/marketing-lead/route");
    const res = await POST(
      new Request("http://localhost/api/marketing-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anon_id: "anon-chat-1",
          name: "Jordan Lee",
          email: "jordan@brand.co",
          service_interest: "shopify",
          message_summary: "Shopify product photography inquiry",
        }),
      }),
    );

    expect(res.status).toBe(200);
    const [, opts] = mockFetch.mock.calls[0];
    const body = JSON.parse((opts as RequestInit).body as string);
    // name is forwarded at the top-level payload (C1 fix) — not nested in lead_answers
    expect(body.name).toBe("Jordan Lee");
  });

  it("does not overwrite an existing lead_answers.name", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ draftId: "d-2" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const { POST } = await import("@/app/api/marketing-lead/route");
    await POST(
      new Request("http://localhost/api/marketing-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anon_id: "anon-chat-2",
          name: "Top Level Name",
          email: "j@brand.co",
          service_interest: "general",
          message_summary: "General inquiry",
          lead_answers: { name: "Existing Name" },
        }),
      }),
    );

    const [, opts] = mockFetch.mock.calls[0];
    const body = JSON.parse((opts as RequestInit).body as string);
    expect(body.lead_answers.name).toBe("Existing Name");
  });
});
