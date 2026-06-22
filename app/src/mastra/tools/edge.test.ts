import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { agentTools } from "./index";
import {
  EdgeFunctionError,
  callEdgeFunction,
  resolveFunctionsUrl,
} from "./edge";

const ENV_KEYS = ["SUPABASE_FUNCTIONS_URL", "NEXT_PUBLIC_SUPABASE_URL"] as const;
const SAVED = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
afterEach(() => {
  for (const k of ENV_KEYS) {
    if (SAVED[k] === undefined) delete process.env[k];
    else process.env[k] = SAVED[k];
  }
});

function fakeResponse({
  ok,
  status,
  body,
}: {
  ok: boolean;
  status: number;
  body?: string;
}): Response {
  return {
    ok,
    status,
    text: async () => body ?? "",
    json: async () => JSON.parse(body ?? "null"),
  } as unknown as Response;
}

describe("agent tool registry (IPI2-84)", () => {
  it("exposes tools in one discoverable place", () => {
    expect(agentTools).toHaveProperty("weatherTool");
  });
});

describe("resolveFunctionsUrl", () => {
  it("builds the functions URL from NEXT_PUBLIC_SUPABASE_URL", () => {
    delete process.env.SUPABASE_FUNCTIONS_URL;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://proj.supabase.co/";
    expect(resolveFunctionsUrl()).toBe("https://proj.supabase.co/functions/v1");
  });

  it("prefers an explicit SUPABASE_FUNCTIONS_URL", () => {
    process.env.SUPABASE_FUNCTIONS_URL = "https://edge.example.com/fn/";
    expect(resolveFunctionsUrl()).toBe("https://edge.example.com/fn");
  });
});

describe("callEdgeFunction — the durable-write surface", () => {
  it("fails closed when no URL is configured (no silent writes)", async () => {
    for (const k of ENV_KEYS) delete process.env[k];
    await expect(
      callEdgeFunction("commit-approved-shoot", {}),
    ).rejects.toBeInstanceOf(EdgeFunctionError);
  });

  describe("HTTP behavior (mocked fetch)", () => {
    beforeEach(() => {
      delete process.env.SUPABASE_FUNCTIONS_URL;
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://proj.supabase.co";
    });
    afterEach(() => vi.unstubAllGlobals());

    it("returns parsed JSON on success", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () =>
          fakeResponse({ ok: true, status: 200, body: '{"shoot_id":"abc"}' }),
        ),
      );
      await expect(callEdgeFunction("commit-approved-shoot", {})).resolves.toEqual(
        { shoot_id: "abc" },
      );
    });

    it("returns undefined on 204 No Content (no JSON crash)", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => fakeResponse({ ok: true, status: 204 })),
      );
      await expect(callEdgeFunction("x", {})).resolves.toBeUndefined();
    });

    it("returns undefined on an empty 200 body", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => fakeResponse({ ok: true, status: 200, body: "" })),
      );
      await expect(callEdgeFunction("x", {})).resolves.toBeUndefined();
    });

    it("throws EdgeFunctionError with the status on a non-ok response", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () =>
          fakeResponse({ ok: false, status: 403, body: "forbidden" }),
        ),
      );
      await expect(
        callEdgeFunction("commit-approved-shoot", {}),
      ).rejects.toMatchObject({ name: "EdgeFunctionError", status: 403 });
    });

    it("sends the access token as a Bearer Authorization header", async () => {
      const fetchMock = vi.fn(
        async (_url: string, _init?: RequestInit) =>
          fakeResponse({ ok: true, status: 200, body: "{}" }),
      );
      vi.stubGlobal("fetch", fetchMock);
      await callEdgeFunction("x", { a: 1 }, { accessToken: "user-jwt" });
      const init = fetchMock.mock.calls[0][1] as RequestInit;
      const headers = init.headers as Record<string, string>;
      expect(headers.Authorization).toBe("Bearer user-jwt");
    });
  });
});
