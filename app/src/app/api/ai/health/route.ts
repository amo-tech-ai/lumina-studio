import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { probeAiGatewayHealth } from "@/lib/ai/probe-ai-gateway-health";

export const dynamic = "force-dynamic";

type EnvWithAiGateway = {
  AI_GATEWAY?: { fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> };
};

async function resolveAiGatewayFetcher(): Promise<EnvWithAiGateway["AI_GATEWAY"] | undefined> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return (env as EnvWithAiGateway | undefined)?.AI_GATEWAY;
  } catch {
    // Node/Vitest / non-Worker runtimes — fall back to AI_GATEWAY_URL.
    return undefined;
  }
}

/**
 * IPI-461 / IPI-510: probe custom ai-gateway Worker /health.
 * Prefer `AI_GATEWAY` service binding on Workers (same-zone *.workers.dev fetch fails).
 * Does not wire Mastra resolveModel() — that is IPI-454 AC-F.
 * Never returns secret values (only hasApiKey boolean).
 */
export async function GET() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);

  try {
    const gatewayFetcher = await resolveAiGatewayFetcher();
    const { httpStatus, body } = await probeAiGatewayHealth({
      gatewayFetcher,
      signal: controller.signal,
    });
    return NextResponse.json(body, { status: httpStatus });
  } finally {
    clearTimeout(timeout);
  }
}
