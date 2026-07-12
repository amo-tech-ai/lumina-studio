import { describe, expect, it } from "vitest";

import {
  ProviderError,
  isRetryableProviderError,
  extractErrorStatus,
} from "./retry-classifier";

describe("isRetryableProviderError", () => {
  describe("HTTP status codes", () => {
    it("retries 429 (rate limit)", () => {
      const error = new ProviderError("Rate limited", 429);
      expect(isRetryableProviderError(error)).toBe(true);
    });

    it("retries 500–504 (server errors)", () => {
      [500, 501, 502, 503, 504].forEach((status) => {
        const error = new ProviderError(`Server error ${status}`, status);
        expect(isRetryableProviderError(error)).toBe(true);
      });
    });

    it("does NOT retry 400 (bad request)", () => {
      const error = new ProviderError("Bad request", 400);
      expect(isRetryableProviderError(error)).toBe(false);
    });

    it("does NOT retry 401 (unauthorized)", () => {
      const error = new ProviderError("Unauthorized", 401);
      expect(isRetryableProviderError(error)).toBe(false);
    });

    it("does NOT retry 403 (forbidden)", () => {
      const error = new ProviderError("Forbidden", 403);
      expect(isRetryableProviderError(error)).toBe(false);
    });

    it("does NOT retry other 4xx", () => {
      [404, 405, 409, 422].forEach((status) => {
        const error = new ProviderError(`Client error ${status}`, status);
        expect(isRetryableProviderError(error)).toBe(false);
      });
    });
  });

  describe("Network errors (message-based)", () => {
    it("retries HTTP 5xx errors in message", () => {
      expect(isRetryableProviderError(new Error("Workers AI error 503: Service unavailable"))).toBe(true);
      expect(isRetryableProviderError(new Error("error 500: internal error"))).toBe(true);
      expect(isRetryableProviderError(new Error("Bedrock error 504: gateway timeout"))).toBe(true);
    });

    it("retries HTTP 429 (rate limit) in message", () => {
      expect(isRetryableProviderError(new Error("Workers AI error 429: rate limited"))).toBe(true);
      expect(isRetryableProviderError(new Error("429: too many requests"))).toBe(true);
    });

    it("retries timeout errors", () => {
      expect(isRetryableProviderError(new Error("Request timeout"))).toBe(true);
      expect(isRetryableProviderError(new Error("Timed out"))).toBe(true);
      expect(
        isRetryableProviderError(new Error("Deadline exceeded")),
      ).toBe(true);
    });

    it("retries connection errors", () => {
      expect(isRetryableProviderError(new Error("ECONNREFUSED"))).toBe(true);
      expect(isRetryableProviderError(new Error("ECONNRESET"))).toBe(true);
      expect(
        isRetryableProviderError(new Error("Connection reset by peer")),
      ).toBe(true);
      expect(isRetryableProviderError(new Error("Broken pipe"))).toBe(true);
    });

    it("retries DNS errors", () => {
      expect(isRetryableProviderError(new Error("ENOTFOUND"))).toBe(true);
      expect(isRetryableProviderError(new Error("DNS lookup failed"))).toBe(
        true,
      );
      expect(isRetryableProviderError(new Error("getaddrinfo error"))).toBe(
        true,
      );
    });

    it("retries network unreachable errors", () => {
      expect(isRetryableProviderError(new Error("ENETUNREACH"))).toBe(true);
      expect(isRetryableProviderError(new Error("EHOSTUNREACH"))).toBe(true);
    });
  });

  describe("Non-retryable errors", () => {
    it("does NOT retry validation errors", () => {
      expect(
        isRetryableProviderError(
          new Error("Schema validation failed for tools"),
        ),
      ).toBe(false);
      expect(
        isRetryableProviderError(new Error("Invalid request format")),
      ).toBe(false);
    });

    it("does NOT retry auth errors", () => {
      expect(isRetryableProviderError(new Error("Authentication failed"))).toBe(
        false,
      );
      expect(isRetryableProviderError(new Error("Unauthorized API key"))).toBe(
        false,
      );
    });

    it("does NOT retry unknown errors (fail-safe) — plain Error with non-retryable message", () => {
      expect(isRetryableProviderError(new Error("Some random error"))).toBe(
        false,
      );
    });
  });

  describe("ProviderError without HTTP status", () => {
    it("routes ProviderError with undefined status through isRetryableMessage — non-retryable message", () => {
      expect(isRetryableProviderError(new ProviderError("Invalid request format"))).toBe(false);
      expect(isRetryableProviderError(new ProviderError("Authentication failed"))).toBe(false);
      expect(isRetryableProviderError(new ProviderError("Schema validation error"))).toBe(false);
    });

    it("routes ProviderError with undefined status through isRetryableMessage — retryable message", () => {
      expect(isRetryableProviderError(new ProviderError("Request timeout"))).toBe(true);
      expect(isRetryableProviderError(new ProviderError("ECONNREFUSED"))).toBe(true);
      expect(isRetryableProviderError(new ProviderError("Connection reset by peer"))).toBe(true);
    });
  });

  describe("Unknown error types", () => {
    it("does NOT retry unknown plain Error (fail-safe)", () => {
      expect(isRetryableProviderError(new Error())).toBe(false);
      expect(isRetryableProviderError(new Error("Undefined error"))).toBe(
        false,
      );
    });

    it("does NOT retry non-Error objects (fail-safe)", () => {
      expect(isRetryableProviderError("string error")).toBe(false);
      expect(isRetryableProviderError({ message: "object error" })).toBe(
        false,
      );
      expect(isRetryableProviderError(null)).toBe(false);
    });
  });
});

describe("extractErrorStatus", () => {
  it("extracts status from 4xx/5xx responses", () => {
    const response = new Response("error", { status: 503 });
    expect(extractErrorStatus(response)).toBe(503);
  });

  it("returns undefined for 2xx/3xx responses", () => {
    const response = new Response("ok", { status: 200 });
    expect(extractErrorStatus(response)).toBeUndefined();
  });
});
