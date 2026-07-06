import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

import { BASE_EDGE_ENV, withEnv } from "../_shared/test/mock-fetch.ts";

Deno.test("audit-asset-dna returns 501 when DNA provider resolves to Groq", async () => {
  await withEnv({
    ...BASE_EDGE_ENV,
    AI_PROVIDER: "groq",
    DNA_USE_GEMINI: "0",
  }, async () => {
    const { handleAuditAssetDnaRequest } = await import("./handler.ts");
    const res = await handleAuditAssetDnaRequest(new Request(
      "https://localhost/functions/v1/audit-asset-dna",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: "asset-test-1" }),
      },
    ));

    assertEquals(res.status, 501);
    const body = await res.json() as {
      ok: false;
      error: { code: string; message: string };
    };
    assertEquals(body.error.code, "not_implemented");
    assertEquals(
      body.error.message,
      "Groq vision DNA is deferred until golden eval (DNA_USE_GEMINI=1)",
    );
  });
});

Deno.test("audit-asset-dna allows Gemini path when DNA_USE_GEMINI default", async () => {
  await withEnv({
    ...BASE_EDGE_ENV,
    AI_PROVIDER: "groq",
    DNA_USE_GEMINI: undefined,
    GEMINI_API_KEY: undefined,
  }, async () => {
    const { handleAuditAssetDnaRequest } = await import("./handler.ts");
    const res = await handleAuditAssetDnaRequest(new Request(
      "https://localhost/functions/v1/audit-asset-dna",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer test-service-role-key",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ assetId: "asset-test-1" }),
      },
    ));

    // Past Groq guard — fails later on auth/config, not 501.
    assertEquals(res.status !== 501, true);
  });
});
