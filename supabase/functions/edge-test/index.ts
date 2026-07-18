import { isAuthFailure, resolveAuth } from "../_shared/auth.ts";
import { handleCors } from "../_shared/cors.ts";
import {
  errorResponse,
  jsonResponse,
  safeErrorMessage,
} from "../_shared/response.ts";

console.info("edge-test function started");

/**
 * Authenticated Edge runtime probe (read-only).
 * IPI-688 · SB-EDGE-005 — no ai_agent_logs writes; gated by ALLOW_EDGE_TEST=1.
 * Default production verify uses `health` only; opt-in via REQUIRE_AUTH_EDGE_SMOKE=1.
 */
Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const started = performance.now();

  try {
    if (req.method !== "POST" && req.method !== "GET") {
      return errorResponse("method_not_allowed", "Use GET or POST", 405);
    }

    // Opt-in only — unset/false means production default path skips this endpoint.
    if (Deno.env.get("ALLOW_EDGE_TEST") !== "1") {
      return errorResponse(
        "not_found",
        "edge-test is disabled (set ALLOW_EDGE_TEST=1 to enable)",
        404,
      );
    }

    const auth = await resolveAuth(req, { required: true });
    if (isAuthFailure(auth)) return auth.response;

    const durationMs = Math.round(performance.now() - started);

    // ponytail: read-only auth probe — no DB writes (was ai_agent_logs spam)
    return jsonResponse({
      status: "ok",
      function: "edge-test",
      userId: auth.user.id,
      durationMs,
    });
  } catch (err) {
    console.error("edge-test error:", err);
    return errorResponse("internal_error", safeErrorMessage(err), 500);
  }
});
