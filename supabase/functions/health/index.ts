import { handleCors } from "../_shared/cors.ts";
import { jsonResponse, errorResponse, safeErrorMessage } from "../_shared/response.ts";

console.info("health function started");

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    if (req.method !== "GET" && req.method !== "POST") {
      return errorResponse("method_not_allowed", "Use GET or POST", 405);
    }

    return jsonResponse({
      status: "ok",
      function: "health",
      ts: new Date().toISOString(),
    });
  } catch (err) {
    console.error("health error:", err);
    return errorResponse("internal_error", safeErrorMessage(err), 500);
  }
});
