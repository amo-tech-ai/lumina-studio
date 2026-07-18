import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

import {
  BASE_EDGE_ENV,
  withEnv,
} from "../_shared/test/mock-fetch.ts";
import {
  ALLOWED_SERVICE_SLUGS,
  handleCaptureLead,
  RATE_LIMIT_MAX,
  resetRateLimitStoreForTests,
  validatePayload,
} from "./handler.ts";

const PROXY = "test-proxy-secret";

function leadBody(overrides: Record<string, unknown> = {}) {
  return {
    anon_id: "anon-test-1",
    email: "lead@example.com",
    service_interest: ALLOWED_SERVICE_SLUGS[0],
    message_summary: "Need fashion photography for SS26",
    lead_answers: { brand: "Lumina" },
    ...overrides,
  };
}

function captureRequest(
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
): Request {
  return new Request("https://localhost/functions/v1/capture-lead", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ipix-proxy-secret": PROXY,
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

async function parseError(res: Response) {
  return await res.json() as {
    ok: false;
    error: { code: string; message: string };
  };
}

Deno.test("validatePayload rejects overlong message_summary", () => {
  const result = validatePayload(leadBody({
    message_summary: "x".repeat(4_001),
  }));
  assertEquals(result.valid, false);
  assertEquals(result.errors.some((e) => e.includes("message_summary")), true);
});

Deno.test("missing CAPTURE_LEAD_PROXY_SECRET → 503", async () => {
  resetRateLimitStoreForTests();
  await withEnv({
    ...BASE_EDGE_ENV,
    CAPTURE_LEAD_PROXY_SECRET: undefined,
  }, async () => {
    const res = await handleCaptureLead(captureRequest(leadBody(), {
      "x-ipix-proxy-secret": "",
    }));
    assertEquals(res.status, 503);
    const body = await parseError(res);
    assertEquals(body.error.code, "misconfigured");
  });
});

Deno.test("invalid proxy secret → 401 (no write)", async () => {
  resetRateLimitStoreForTests();
  await withEnv({
    ...BASE_EDGE_ENV,
    CAPTURE_LEAD_PROXY_SECRET: PROXY,
  }, async () => {
    const res = await handleCaptureLead(captureRequest(leadBody(), {
      "x-ipix-proxy-secret": "wrong",
    }));
    assertEquals(res.status, 401);
    const body = await parseError(res);
    assertEquals(body.error.code, "unauthorized");
  });
});

Deno.test("absent proxy secret header → 401", async () => {
  resetRateLimitStoreForTests();
  await withEnv({
    ...BASE_EDGE_ENV,
    CAPTURE_LEAD_PROXY_SECRET: PROXY,
  }, async () => {
    const req = new Request("https://localhost/functions/v1/capture-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leadBody()),
    });
    const res = await handleCaptureLead(req);
    assertEquals(res.status, 401);
  });
});

Deno.test("disallowed Origin → 403 when ALLOWED_ORIGINS set", async () => {
  resetRateLimitStoreForTests();
  await withEnv({
    ...BASE_EDGE_ENV,
    CAPTURE_LEAD_PROXY_SECRET: PROXY,
    ALLOWED_ORIGINS: "https://ipix.ai",
  }, async () => {
    const res = await handleCaptureLead(captureRequest(leadBody(), {
      origin: "https://evil.example",
    }));
    assertEquals(res.status, 403);
    const body = await parseError(res);
    assertEquals(body.error.code, "forbidden");
  });
});

Deno.test("rate limit returns 429 after burst", async () => {
  resetRateLimitStoreForTests();
  let rpcCalls = 0;

  await withEnv({
    ...BASE_EDGE_ENV,
    CAPTURE_LEAD_PROXY_SECRET: PROXY,
  }, async () => {
    const original = globalThis.fetch;
    globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string"
        ? input
        : input instanceof URL
        ? input.href
        : input.url;
      if (url.includes("/rest/v1/rpc/capture_lead_write")) {
        rpcCalls++;
        return Promise.resolve(
          new Response(
            JSON.stringify({
              draft_id: "draft-1",
              conversation_id: "conv-1",
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
        );
      }
      return original(input, init);
    };

    try {
      for (let i = 0; i < RATE_LIMIT_MAX; i++) {
        const res = await handleCaptureLead(captureRequest(leadBody({
          anon_id: "rl-anon",
        })));
        assertEquals(res.status, 200);
      }
      const blocked = await handleCaptureLead(captureRequest(leadBody({
        anon_id: "rl-anon",
      })));
      assertEquals(blocked.status, 429);
      const body = await parseError(blocked);
      assertEquals(body.error.code, "rate_limited");
      assertEquals(rpcCalls, RATE_LIMIT_MAX);
    } finally {
      globalThis.fetch = original;
    }
  });
});

Deno.test("happy path via capture_lead_write RPC returns claimToken", async () => {
  resetRateLimitStoreForTests();
  let sawRpc = false;

  await withEnv({
    ...BASE_EDGE_ENV,
    CAPTURE_LEAD_PROXY_SECRET: PROXY,
  }, async () => {
    const original = globalThis.fetch;
    globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string"
        ? input
        : input instanceof URL
        ? input.href
        : input.url;
      if (url.includes("/rest/v1/rpc/capture_lead_write")) {
        sawRpc = true;
        return Promise.resolve(
          new Response(
            JSON.stringify({
              draft_id: "11111111-1111-1111-1111-111111111111",
              conversation_id: "22222222-2222-2222-2222-222222222222",
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
        );
      }
      return original(input, init);
    };

    try {
      const res = await handleCaptureLead(captureRequest(leadBody()));
      assertEquals(res.status, 200);
      const json = await res.json() as {
        draftId: string;
        status: string;
        claimToken?: string;
      };
      assertEquals(json.draftId, "11111111-1111-1111-1111-111111111111");
      assertEquals(json.status, "ready");
      assertEquals(typeof json.claimToken, "string");
      assertEquals(sawRpc, true);
    } finally {
      globalThis.fetch = original;
    }
  });
});

Deno.test("RPC failure does not return claimToken", async () => {
  resetRateLimitStoreForTests();
  await withEnv({
    ...BASE_EDGE_ENV,
    CAPTURE_LEAD_PROXY_SECRET: PROXY,
  }, async () => {
    const original = globalThis.fetch;
    globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string"
        ? input
        : input instanceof URL
        ? input.href
        : input.url;
      if (url.includes("/rest/v1/rpc/capture_lead_write")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              message: "simulated rollback",
              code: "P0001",
            }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          ),
        );
      }
      return original(input, init);
    };

    try {
      const res = await handleCaptureLead(captureRequest(leadBody({
        anon_id: "rpc-fail-anon",
      })));
      assertEquals(res.status, 500);
      const body = await parseError(res);
      assertEquals(body.ok, false);
    } finally {
      globalThis.fetch = original;
    }
  });
});
