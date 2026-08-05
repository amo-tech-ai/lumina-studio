import { gatewayErrorResponse, newRequestId } from "./gateway-errors";
import { handleRequest, type Env } from "./router";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const start = Date.now();
      const response = await handleRequest(request, env);
      const duration = Date.now() - start;

      response.headers.set("X-AI-Gateway-Version", "0.1.0");
      response.headers.set("X-AI-Gateway-Latency", String(duration));

      return response;
    } catch (err) {
      // Generate the request id before logging so the server log, the response
      // body, and the x-request-id header all share one correlation id.
      const requestId = newRequestId();
      // Log only a safe classification + requestId. Raw stacks/messages can carry
      // upstream bodies and request URLs (which embed provider API keys).
      console.error("[gateway] unhandled error", {
        requestId,
        error: err instanceof Error ? err.name : "unknown",
      });
      return gatewayErrorResponse(500, "internal_error", "AI gateway encountered an unexpected error", {
        retryable: false,
        requestId,
      });
    }
  },
};
