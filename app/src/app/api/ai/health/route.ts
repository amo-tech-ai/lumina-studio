import { NextResponse } from "next/server";
import {
  createProviderAdapter,
  DEFAULT_AI_GATEWAY_URL,
} from "@/lib/ai/provider-adapter";

export const dynamic = "force-dynamic";

/**
 * IPI-461 controlled runtime proof: app constructs the adapter and probes gateway /health.
 * Does not wire Mastra resolveModel() — that is IPI-454 AC-F.
 */
export async function GET() {
  const gatewayUrl = process.env.AI_GATEWAY_URL ?? DEFAULT_AI_GATEWAY_URL;
  const hasApiKey = Boolean(process.env.AI_GATEWAY_API_KEY);
  const adapter = createProviderAdapter({ baseUrl: gatewayUrl });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);

  try {
    const response = await fetch(`${gatewayUrl}/health`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          status: "gateway_error",
          gatewayUrl,
          hasApiKey,
          httpStatus: response.status,
          adapterAvailable: typeof adapter.chat === "function",
        },
        { status: 502 },
      );
    }

    const health = await response.json();
    return NextResponse.json({
      status: "ok",
      gatewayUrl,
      hasApiKey,
      gateway: health,
      adapterAvailable: typeof adapter.chat === "function",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        status: "gateway_unreachable",
        gatewayUrl,
        hasApiKey,
        error: message,
        adapterAvailable: typeof adapter.chat === "function",
      },
      { status: 503 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
