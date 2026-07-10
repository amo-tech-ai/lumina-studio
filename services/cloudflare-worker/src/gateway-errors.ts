/**
 * Stable AI Gateway error envelope (IPI-492).
 * Client-facing messages are sanitized — never forward raw provider bodies.
 */

export type GatewayErrorCode =
  | "invalid_request"
  | "unsupported_embedding_model"
  | "provider_rate_limited"
  | "provider_timeout"
  | "provider_unavailable"
  | "provider_error"
  | "internal_error";

export type GatewayErrorBody = {
  error: {
    code: GatewayErrorCode;
    message: string;
    providerStatus?: number;
    retryable?: boolean;
    requestId: string;
  };
};

export function newRequestId(): string {
  return `req_${crypto.randomUUID()}`;
}

export function gatewayErrorResponse(
  status: number,
  code: GatewayErrorCode,
  message: string,
  opts: { providerStatus?: number; retryable?: boolean; requestId?: string } = {},
): Response {
  const requestId = opts.requestId ?? newRequestId();
  const body: GatewayErrorBody = {
    error: {
      code,
      message,
      requestId,
      ...(opts.providerStatus !== undefined ? { providerStatus: opts.providerStatus } : {}),
      ...(opts.retryable !== undefined ? { retryable: opts.retryable } : {}),
    },
  };
  return Response.json(body, {
    status,
    headers: { "Content-Type": "application/json", "x-request-id": requestId },
  });
}

/** Map upstream provider failures to gateway HTTP status + code (never blind passthrough). */
export function mapProviderFailure(err: unknown): {
  status: number;
  code: GatewayErrorCode;
  message: string;
  providerStatus?: number;
  retryable: boolean;
} {
  const raw = err instanceof Error ? err.message : String(err);
  const statusMatch = raw.match(/\b([45]\d{2})\b/);
  const providerStatus = statusMatch ? Number(statusMatch[1]) : undefined;

  if (providerStatus === 429) {
    return {
      status: 429,
      code: "provider_rate_limited",
      message: "Embedding provider rate limit exceeded",
      providerStatus,
      retryable: true,
    };
  }
  if (providerStatus === 408 || providerStatus === 504 || /timeout/i.test(raw)) {
    return {
      status: 504,
      code: "provider_timeout",
      message: "Embedding provider timed out",
      providerStatus,
      retryable: true,
    };
  }
  if (providerStatus === 503 || providerStatus === 502) {
    return {
      status: 503,
      code: "provider_unavailable",
      message: "Embedding provider is temporarily unavailable",
      providerStatus,
      retryable: true,
    };
  }
  return {
    status: 502,
    code: "provider_error",
    message: "Embedding provider returned an error",
    providerStatus,
    retryable: false,
  };
}
