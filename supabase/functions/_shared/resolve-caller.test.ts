import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

import { isCallerFailure, resolveCaller } from "./resolve-caller.ts";

function withEnv(fn: () => Promise<void> | void) {
  Deno.env.set("SUPABASE_URL", "https://test.supabase.co");
  Deno.env.set("SUPABASE_ANON_KEY", "test-anon-key");
  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");
  return fn();
}

Deno.test("resolveCaller authorizes a matching service-role bearer token", async () => {
  await withEnv(async () => {
    const req = new Request("http://localhost/audit-asset-dna", {
      method: "POST",
      headers: { Authorization: "Bearer test-service-role-key" },
    });

    const result = await resolveCaller(req);

    if (isCallerFailure(result)) throw new Error("expected a caller, got a failure response");
    assertEquals(result.userId, null);
  });
});

Deno.test("resolveCaller falls back to user-JWT auth and rejects when no token is present", async () => {
  await withEnv(async () => {
    const req = new Request("http://localhost/audit-asset-dna", { method: "POST" });

    const result = await resolveCaller(req);

    if (!isCallerFailure(result)) throw new Error("expected a 401 failure response, got a caller");
    assertEquals(result.response.status, 401);
  });
});
