/**
 * Classifies provider errors as retryable or not.
 *
 * Retryable: 429, 500–504, timeout, connection reset, DNS failure
 * Non-retryable: 4xx (except 429), schema/tool validation, auth errors
 */

export class ProviderError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

export function isRetryableProviderError(error: unknown): boolean {
  if (error instanceof ProviderError) {
    return isRetryableStatus(error.status, error.code);
  }

  if (error instanceof Error) {
    return isRetryableMessage(error.message);
  }

  return false;
}

function isRetryableStatus(status?: number, code?: string): boolean {
  if (!status) {
    // Unknown status (network error, timeout) → retryable
    return true;
  }

  // Retryable HTTP status codes
  if (status === 429) return true; // Rate limit
  if (status >= 500 && status < 600) return true; // Server errors

  // Non-retryable 4xx errors
  if (status >= 400 && status < 500) return false;

  // Unknown status → don't retry
  return false;
}

function isRetryableMessage(message: string): boolean {
  const lowerMsg = message.toLowerCase();

  // HTTP status codes in error message (e.g. "Workers AI error 503: ...")
  if (lowerMsg.includes(" 429") || lowerMsg.includes("429:")) return true; // Rate limit
  if (/\s50\d\s/.test(message) || / 50\d:/.test(message)) return true; // 500–509 server errors

  // Timeout errors (network timeouts, Cloudflare timeout, AWS timeout)
  if (lowerMsg.includes("timeout")) return true;
  if (lowerMsg.includes("timed out")) return true;
  if (lowerMsg.includes("deadline exceeded")) return true;

  // Connection errors
  if (lowerMsg.includes("econnrefused")) return true;
  if (lowerMsg.includes("econnreset")) return true;
  if (lowerMsg.includes("connection reset")) return true;
  if (lowerMsg.includes("connection refused")) return true;
  if (lowerMsg.includes("connection timed out")) return true;

  // DNS errors
  if (lowerMsg.includes("enotfound")) return true;
  if (lowerMsg.includes("dns")) return true;
  if (lowerMsg.includes("getaddrinfo")) return true;

  // Network-level errors
  if (lowerMsg.includes("enetunreach")) return true;
  if (lowerMsg.includes("ehostunreach")) return true;
  if (lowerMsg.includes("broken pipe")) return true;

  // Non-retryable errors
  if (lowerMsg.includes("authentication")) return false;
  if (lowerMsg.includes("unauthorized")) return false;
  if (lowerMsg.includes("forbidden")) return false;
  if (lowerMsg.includes("invalid")) return false;
  if (lowerMsg.includes("schema")) return false;
  if (lowerMsg.includes("validation")) return false;

  // Unknown error → don't retry by default (safer)
  return false;
}

/**
 * Extract HTTP status from error response.
 * Used when catching fetch() responses.
 */
export function extractErrorStatus(response: Response): number | undefined {
  return response.status >= 400 ? response.status : undefined;
}

/**
 * Helper to throw a ProviderError with context.
 */
export function throwProviderError(
  message: string,
  status?: number,
  originalError?: unknown,
): never {
  const code =
    originalError instanceof Error ? originalError.name : undefined;
  throw new ProviderError(message, status, code);
}
