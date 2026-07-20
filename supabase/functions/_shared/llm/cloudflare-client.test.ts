import {
  assertEquals,
  assertRejects,
  assertThrows,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

import {
  buildGatewayHeaders,
  CloudflareGatewayError,
  CLOUDFLARE_GATEWAY_TIMEOUT_MS,
  extractRequestMeta,
  gatewayFetch,
  parseGatewayResponse,
  redactSecrets,
  resolveCloudflareCredentials,
} from "./cloudflare-client.ts";

Deno.test("buildGatewayHeaders sets privacy + timeout + gateway retry headers", () => {
  Deno.env.set("CLOUDFLARE_AI_GATEWAY_ID", "ipix-prod");
  const headers = buildGatewayHeaders("test-token", { timeoutMs: 12_000 });
  assertEquals(headers.Authorization, "Bearer test-token");
  assertEquals(headers["Content-Type"], "application/json");
  assertEquals(headers["cf-aig-gateway-id"], "ipix-prod");
  assertEquals(headers["cf-aig-collect-log-payload"], "false");
  assertEquals(headers["cf-aig-request-timeout"], "12000");
  assertEquals(headers["cf-aig-max-attempts"], "3");
  assertEquals(headers["cf-aig-backoff"], "exponential");
  Deno.env.delete("CLOUDFLARE_AI_GATEWAY_ID");
});

Deno.test("buildGatewayHeaders defaults timeout to CLOUDFLARE_GATEWAY_TIMEOUT_MS", () => {
  const headers = buildGatewayHeaders("t");
  assertEquals(
    headers["cf-aig-request-timeout"],
    String(CLOUDFLARE_GATEWAY_TIMEOUT_MS),
  );
});

Deno.test("redactSecrets strips Bearer and token-like substrings", () => {
  assertEquals(
    redactSecrets("Authorization Bearer abc.def.ghi failed"),
    "Authorization Bearer [REDACTED] failed",
  );
  assertEquals(
    redactSecrets("token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xx"),
    "token [REDACTED]",
  );
});

Deno.test("extractRequestMeta reads cf-ray and request-id headers", () => {
  const headers = new Headers({
    "cf-ray": "abc-DFW",
    "cf-aig-request-id": "req-1",
  });
  assertEquals(extractRequestMeta(headers), {
    cfRay: "abc-DFW",
    requestId: "req-1",
  });
});

Deno.test("resolveCloudflareCredentials prefers GATEWAY_TOKEN over API_TOKEN", () => {
  Deno.env.set("CLOUDFLARE_ACCOUNT_ID", "acct");
  Deno.env.set("CLOUDFLARE_AI_GATEWAY_TOKEN", "gateway-secret");
  Deno.env.set("CLOUDFLARE_API_TOKEN", "api-secret");
  const creds = resolveCloudflareCredentials();
  assertEquals(creds.credentialPath, "gateway_token");
  assertEquals(creds.token, "gateway-secret");
  assertEquals(creds.accountId, "acct");
  Deno.env.delete("CLOUDFLARE_ACCOUNT_ID");
  Deno.env.delete("CLOUDFLARE_AI_GATEWAY_TOKEN");
  Deno.env.delete("CLOUDFLARE_API_TOKEN");
});

Deno.test("resolveCloudflareCredentials falls back to API_TOKEN", () => {
  Deno.env.set("CLOUDFLARE_ACCOUNT_ID", "acct");
  Deno.env.set("CLOUDFLARE_API_TOKEN", "api-secret");
  Deno.env.delete("CLOUDFLARE_AI_GATEWAY_TOKEN");
  const creds = resolveCloudflareCredentials();
  assertEquals(creds.credentialPath, "api_token");
  assertEquals(creds.token, "api-secret");
  Deno.env.delete("CLOUDFLARE_ACCOUNT_ID");
  Deno.env.delete("CLOUDFLARE_API_TOKEN");
});

Deno.test("resolveCloudflareCredentials throws typed error when missing", () => {
  Deno.env.delete("CLOUDFLARE_ACCOUNT_ID");
  Deno.env.delete("CLOUDFLARE_AI_GATEWAY_TOKEN");
  Deno.env.delete("CLOUDFLARE_API_TOKEN");
  assertThrows(
    () => resolveCloudflareCredentials(),
    CloudflareGatewayError,
    "not configured",
  );
});

Deno.test("parseGatewayResponse maps 401 with cf-ray", async () => {
  const response = new Response(
    JSON.stringify({ error: { message: "Invalid API Token" } }),
    {
      status: 401,
      headers: {
        "content-type": "application/json",
        "cf-ray": "ray-401",
        "x-request-id": "rid-401",
      },
    },
  );
  await assertRejects(
    () => parseGatewayResponse(response, "api_token"),
    CloudflareGatewayError,
    "Invalid API Token",
  );
});

Deno.test("parseGatewayResponse maps 403 / 429 / 500 labels", async () => {
  for (const status of [403, 429, 500] as const) {
    const response = new Response(JSON.stringify({ error: {} }), {
      status,
      headers: { "content-type": "application/json", "cf-ray": `ray-${status}` },
    });
    try {
      await parseGatewayResponse(response);
      throw new Error(`expected throw for ${status}`);
    } catch (err) {
      assertEquals(err instanceof CloudflareGatewayError, true);
      const e = err as CloudflareGatewayError;
      assertEquals(e.status, status);
      assertEquals(e.cfRay, `ray-${status}`);
    }
  }
});

Deno.test("gatewayFetch aborts with typed 408 timeout", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (_input, init) =>
    new Promise((_resolve, reject) => {
      const signal = init?.signal;
      if (!signal) {
        reject(new Error("missing signal"));
        return;
      }
      signal.addEventListener("abort", () => {
        const err = new Error("Aborted");
        err.name = "AbortError";
        reject(err);
      });
    });

  try {
    await assertRejects(
      () =>
        gatewayFetch("https://example.invalid/chat", {
          headers: { "Content-Type": "application/json" },
          body: "{}",
          timeoutMs: 20,
        }),
      CloudflareGatewayError,
      "timed out",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("gatewayFetch returns response when fetch succeeds", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () =>
    Promise.resolve(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json", "cf-ray": "ok-ray" },
      }),
    );

  try {
    const res = await gatewayFetch("https://example.invalid/chat", {
      headers: buildGatewayHeaders("t"),
      body: "{}",
    });
    assertEquals(res.status, 200);
    assertEquals(res.headers.get("cf-ray"), "ok-ray");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
