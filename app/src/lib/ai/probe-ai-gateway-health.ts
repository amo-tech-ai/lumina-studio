import { DEFAULT_AI_GATEWAY_URL } from "@/lib/ai/provider-adapter";

/**
 * Service-binding fetch target — hostname is a placeholder (never DNS-resolved);
 * Workers route by the `AI_GATEWAY` binding. Prefer `http://` per Cloudflare docs.
 * @see https://developers.cloudflare.com/workers/cache/cache-keys/#service-binding-url
 */
export const AI_GATEWAY_HEALTH_REQUEST_URL = "http://ai-gateway/health";

/** Response `gatewayUrl` when probing via binding and no AI_GATEWAY_URL is configured. */
export const AI_GATEWAY_BINDING_LABEL = "binding:AI_GATEWAY";

export type AiGatewayHealthBody = {
  status: "ok" | "gateway_error" | "gateway_unreachable";
  gatewayUrl: string;
  hasApiKey: boolean;
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
  const configuredUrl = (input.gatewayUrl ?? process.env.AI_GATEWAY_URL)?.trim() || undefined;
  const useBinding = Boolean(input.gatewayFetcher);
  // Binding path: never claim DEFAULT localhost — that was not the probe target.
  const gatewayUrl = useBinding
    ? (configuredUrl ?? AI_GATEWAY_BINDING_LABEL)
    : (configuredUrl ?? DEFAULT_AI_GATEWAY_URL);
  const hasApiKey = input.hasApiKey ?? Boolean(process.env.AI_GATEWAY_API_KEY);
  const probeVia = useBinding ? "service_binding" : "url";

  try {
    // Prefer string URL + init.signal (CF docs + Fetch convention). Request.signal
    // is also valid, but init is the clearer timeout path for binding Fetcher.
    const response = useBinding
      ? await input.gatewayFetcher!.fetch(AI_GATEWAY_HEALTH_REQUEST_URL, {
          signal: input.signal,
        })
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
        probeVia,
        error: message,
      },
    };
  }
}
