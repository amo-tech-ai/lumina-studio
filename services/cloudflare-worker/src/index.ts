import { gatewayErrorResponse } from "./gateway-errors";
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
      // Log the cause server-side; the client gets the sanitized envelope with a
      // requestId to correlate. Raw messages here can carry upstream bodies and
      // request URLs (which embed provider API keys).
      console.error("[gateway] unhandled error", err instanceof Error ? err.stack ?? err.message : String(err));
      return gatewayErrorResponse(500, "internal_error", "AI gateway encountered an unexpected error", {
        retryable: false,
      });
    }
  },
};
