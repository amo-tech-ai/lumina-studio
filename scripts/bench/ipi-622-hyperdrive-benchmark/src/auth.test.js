/**
 * Security-focused route tests for IPI-622A benchmark Worker auth gate.
 * Proves /dataapi (and every route) cannot run without a matching Bearer token —
 * the P2 finding on #608 was an open workers.dev URL with service-role reads.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { authorizeBenchRequest, secretsEqual } from "./auth.js";
import worker from "./worker.js";

function req(path, headers = {}) {
  return new Request(`https://bench.test${path}`, { headers });
}

describe("authorizeBenchRequest", () => {
  it("rejects when BENCH_TOKEN is missing (misconfigured)", () => {
    const r = authorizeBenchRequest(req("/dataapi"), {});
    assert.equal(r.ok, false);
    assert.equal(r.status, 500);
  });

  it("rejects missing Authorization header", () => {
    const r = authorizeBenchRequest(req("/dataapi"), { BENCH_TOKEN: "secret-token" });
    assert.equal(r.ok, false);
    assert.equal(r.status, 401);
  });

  it("rejects wrong Bearer token", () => {
    const r = authorizeBenchRequest(req("/select", { Authorization: "Bearer wrong" }), {
      BENCH_TOKEN: "secret-token",
    });
    assert.equal(r.ok, false);
    assert.equal(r.status, 401);
  });

  it("accepts matching Bearer token", () => {
    const r = authorizeBenchRequest(req("/dataapi", { Authorization: "Bearer secret-token" }), {
      BENCH_TOKEN: "secret-token",
    });
    assert.equal(r.ok, true);
  });

  it("uses timing-safe equality for tokens", () => {
    assert.equal(secretsEqual("abc", "abc"), true);
    assert.equal(secretsEqual("abc", "abd"), false);
  });
});

describe("worker fetch auth gate (service-role exposure)", () => {
  const env = {
    BENCH_TOKEN: "bench-secret",
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-must-not-leak-to-anon",
    HYPERDRIVE_FRESH: { connectionString: "postgres://unused" },
  };

  it("returns 401 for /dataapi without Bearer — never reaches service role", async () => {
    const res = await worker.fetch(req("/dataapi"), env);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.ok, false);
    assert.equal(body.error, "unauthorized");
  });

  it("returns 401 for /select without Bearer", async () => {
    const res = await worker.fetch(req("/select"), env);
    assert.equal(res.status, 401);
  });

  it("returns 401 for /dataapi with wrong Bearer", async () => {
    const res = await worker.fetch(
      req("/dataapi", { Authorization: "Bearer not-it" }),
      env,
    );
    assert.equal(res.status, 401);
  });

  it("returns 500 misconfigured when BENCH_TOKEN unset even if service role present", async () => {
    const res = await worker.fetch(req("/dataapi", { Authorization: "Bearer x" }), {
      SUPABASE_SERVICE_ROLE_KEY: "svc",
      SUPABASE_URL: "https://example.supabase.co",
    });
    assert.equal(res.status, 500);
    const body = await res.json();
    assert.match(body.error, /BENCH_TOKEN/);
  });
});
