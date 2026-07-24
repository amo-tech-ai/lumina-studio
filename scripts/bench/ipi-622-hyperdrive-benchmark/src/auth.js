// Shared auth gate for the disposable IPI-622 benchmark Worker.
// All routes (including /dataapi with SUPABASE_SERVICE_ROLE_KEY) require
// Authorization: Bearer <BENCH_TOKEN> matching env.BENCH_TOKEN.
import { createHash, timingSafeEqual } from "node:crypto";

/**
 * @param {string} provided
 * @param {string} expected
 */
export function secretsEqual(provided, expected) {
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/**
 * @param {Request} request
 * @param {{ BENCH_TOKEN?: string }} env
 * @returns {{ ok: true } | { ok: false, status: number, error: string }}
 */
export function authorizeBenchRequest(request, env) {
  const expected = env?.BENCH_TOKEN;
  if (!expected) {
    return { ok: false, status: 500, error: "misconfigured: BENCH_TOKEN missing" };
  }
  const header = request.headers.get("Authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match) {
    return { ok: false, status: 401, error: "unauthorized" };
  }
  if (!secretsEqual(match[1], expected)) {
    return { ok: false, status: 401, error: "unauthorized" };
  }
  return { ok: true };
}
