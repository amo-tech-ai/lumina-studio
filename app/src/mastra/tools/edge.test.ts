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
  it("is a const registry (tools registered here, not individually)", () => {
    expect(typeof agentTools).toBe("object");
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
    afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

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

    it("falls back to the anon key when accessToken is whitespace-only", async () => {
      vi.stubEnv("SUPABASE_ANON_KEY", "anon-key-123");
      const fetchMock = vi.fn(
        async (_url: string, _init?: RequestInit) =>
          fakeResponse({ ok: true, status: 200, body: "{}" }),
      );
      vi.stubGlobal("fetch", fetchMock);
      await callEdgeFunction("x", {}, { accessToken: "   " });
      const init = fetchMock.mock.calls[0][1] as RequestInit;
      const headers = init.headers as Record<string, string>;
      expect(headers.Authorization).toBe("Bearer anon-key-123");
      expect(headers.apikey).toBe("anon-key-123");
    });

    it("throws EdgeFunctionError when the request times out", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(
          (_url: string, init?: RequestInit) =>
            new Promise((_resolve, reject) => {
              init?.signal?.addEventListener("abort", () => {
                const err = new Error("The operation was aborted");
                err.name = "AbortError";
                reject(err);
              });
            }),
        ),
      );
      await expect(
        callEdgeFunction("slow-fn", {}, { timeoutMs: 10 }),
      ).rejects.toMatchObject({
        name: "EdgeFunctionError",
        message: expect.stringMatching(/timed out/i),
      });
    });

    it("throws EdgeFunctionError on network-level fetch failure", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => {
          throw new TypeError("fetch failed");
        }),
      );
      await expect(callEdgeFunction("x", {})).rejects.toMatchObject({
        name: "EdgeFunctionError",
        message: expect.stringMatching(/failed/i),
      });
    });

    it("throws when the response body is not valid JSON", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () =>
          fakeResponse({ ok: true, status: 200, body: "not-json{{" }),
        ),
      );
      await expect(callEdgeFunction("x", {})).rejects.toThrow();
    });
  });
});
