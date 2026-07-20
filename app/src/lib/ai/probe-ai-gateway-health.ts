import {
  createProviderAdapter,
  DEFAULT_AI_GATEWAY_URL,
} from "@/lib/ai/provider-adapter";

/** Service-binding fetch target — host is ignored; Worker routes by binding. */
export const AI_GATEWAY_HEALTH_REQUEST_URL = "https://ai-gateway/health";

export type AiGatewayHealthBody = {
  status: "ok" | "gateway_error" | "gateway_unreachable";
  gatewayUrl: string;
  hasApiKey: boolean;
  adapterAvailable: boolean;
  probeVia: "service_binding" | "url";
  gateway?: unknown;
  httpStatus?: number;
  error?: string;
};

export type ProbeAiGatewayHealthInput = {
  /** Prefer Cloudflare service binding Fetcher when present (preview/prod Workers). */
  gatewayFetcher?: { fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> };
  gatewayUrl?: string;
  hasApiKey?: boolean;
  signal?: AbortSignal;
};

/**
 * Probe custom `ai-gateway` Worker /health.
 * IPI-510: prefer service binding (same-zone workers.dev URL fetch returns 404).
 */
export async function probeAiGatewayHealth(
  input: ProbeAiGatewayHealthInput = {},
): Promise<{ httpStatus: number; body: AiGatewayHealthBody }> {
  const gatewayUrl = input.gatewayUrl ?? process.env.AI_GATEWAY_URL ?? DEFAULT_AI_GATEWAY_URL;
  const hasApiKey = input.hasApiKey ?? Boolean(process.env.AI_GATEWAY_API_KEY);
  const adapter = createProviderAdapter({ baseUrl: gatewayUrl });
  const adapterAvailable = typeof adapter.chat === "function";
  const useBinding = Boolean(input.gatewayFetcher);
  const probeVia = useBinding ? "service_binding" : "url";

  try {
    const response = useBinding
      ? await input.gatewayFetcher!.fetch(
          new Request(AI_GATEWAY_HEALTH_REQUEST_URL, { signal: input.signal }),
        )
      : await fetch(`${gatewayUrl.replace(/\/$/, "")}/health`, {
          signal: input.signal,
        });

    if (!response.ok) {
      return {
        httpStatus: 502,
        body: {
          status: "gateway_error",
          gatewayUrl,
          hasApiKey,
          adapterAvailable,
          probeVia,
          httpStatus: response.status,
        },
      };
    }

    const gateway = await response.json();
    return {
      httpStatus: 200,
      body: {
        status: "ok",
        gatewayUrl,
        hasApiKey,
        adapterAvailable,
        probeVia,
        gateway,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      httpStatus: 503,
      body: {
        status: "gateway_unreachable",
        gatewayUrl,
        hasApiKey,
        adapterAvailable,
        probeVia,
        error: message,
      },
    };
  }
}
