import { insertAgentLog } from "../_shared/agent-log.ts";
import { isAuthFailure, resolveAuth } from "../_shared/auth.ts";
import { handleCors } from "../_shared/cors.ts";
import { createUserClient } from "../_shared/supabase-client.ts";
import {
  errorResponse,
  jsonResponse,
  safeErrorMessage,
} from "../_shared/response.ts";

console.info("edge-test function started");

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const started = performance.now();

  try {
    if (req.method !== "POST" && req.method !== "GET") {
      return errorResponse("method_not_allowed", "Use GET or POST", 405);
    }

    const auth = await resolveAuth(req, { required: true });
    if (isAuthFailure(auth)) return auth.response;

    const client = createUserClient(auth.accessToken);
    const durationMs = Math.round(performance.now() - started);

    const { id: logId } = await insertAgentLog(client, {
      agentName: "edge-test",
      userId: auth.user.id,
      input: { source: "edge-test", method: req.method },
      output: { status: "ok" },
      durationMs,
    });

    return jsonResponse({
      status: "ok",
      function: "edge-test",
      userId: auth.user.id,
      logId,
      durationMs,
    });
  } catch (err) {
    console.error("edge-test error:", err);
    return errorResponse("internal_error", safeErrorMessage(err), 500);
  }
});
