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
      const message = err instanceof Error ? err.message : String(err);
      return Response.json(
        { error: "gateway_error", message },
        { status: 500 },
      );
    }
  },
};
