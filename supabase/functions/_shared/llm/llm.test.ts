import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

import {
  assertNoDeprecatedToolApi,
  assertStructuredRequestOptions,
  normalizeCompletionTokenLimit,
  orderPromptMessages,
} from "./constraints.ts";
import {
  resolveBiProviderFromEnv,
  resolveDnaProviderFromEnv,
} from "./allowlist.ts";
import { resolveStructuredProvider } from "./structured.ts";
import { computeRetryDelayMs, isRetryableStatus, parseGroqRateLimitHeaders } from "./retry.ts";
import brandProfileStrictJsonSchema from "../schemas/brand-profile.schema.json" with {
  type: "json",
};

Deno.test("orderPromptMessages puts static system prompt before user crawl content", () => {
  const messages = orderPromptMessages("SYSTEM", "USER");
  assertEquals(messages[0]?.role, "system");
  assertEquals(messages[1]?.role, "user");
});

Deno.test("assertStructuredRequestOptions rejects strict JSON + stream", () => {
  assertThrows(
    () =>
      assertStructuredRequestOptions({
        model: "openai/gpt-oss-20b",
        messages: [],
        stream: true,
        response_format: {
          type: "json_schema",
          json_schema: { name: "x", strict: true, schema: { type: "object" } },
        },
      }),
    Error,
    "stream",
  );
});

Deno.test("assertStructuredRequestOptions rejects strict JSON + tools", () => {
  assertThrows(
    () =>
      assertStructuredRequestOptions({
        model: "openai/gpt-oss-20b",
        messages: [],
        tools: [{ type: "function", function: { name: "x" } }],
        response_format: {
          type: "json_schema",
          json_schema: { name: "x", strict: true, schema: { type: "object" } },
        },
      }),
    Error,
    "tools",
  );
});

Deno.test("assertNoDeprecatedToolApi rejects functions/function_call", () => {
  assertThrows(
    () =>
      assertNoDeprecatedToolApi({
        model: "llama-3.3-70b-versatile",
        messages: [],
        functions: [],
      }),
    Error,
    "deprecated",
  );
});

Deno.test("normalizeCompletionTokenLimit rejects max_tokens", () => {
  assertThrows(
    () =>
      normalizeCompletionTokenLimit(
        { model: "x", messages: [], max_tokens: 10 },
        100,
      ),
    Error,
    "max_completion_tokens",
  );
});

Deno.test("parseGroqRateLimitHeaders reads retry-after and x-ratelimit-*", () => {
  const headers = new Headers({
    "retry-after": "2",
    "x-ratelimit-limit-requests": "100",
    "x-ratelimit-remaining-requests": "99",
  });
  const parsed = parseGroqRateLimitHeaders(headers);
  assertEquals(parsed.retryAfterMs, 2000);
  assertEquals(parsed.limitRequests, 100);
  assertEquals(parsed.remainingRequests, 99);
});

Deno.test("computeRetryDelayMs prefers retry-after over exponential backoff", () => {
  assertEquals(computeRetryDelayMs(0, { retryAfterMs: 1500 }), 1500);
  assertEquals(computeRetryDelayMs(2, {}), 1000);
});

Deno.test("isRetryableStatus covers 429/502/503", () => {
  assertEquals(isRetryableStatus(429), true);
  assertEquals(isRetryableStatus(502), true);
  assertEquals(isRetryableStatus(503), true);
  assertEquals(isRetryableStatus(400), false);
});

Deno.test("brandProfileStrictJsonSchema is strict object schema", () => {
  assertEquals(brandProfileStrictJsonSchema.type, "object");
  assertEquals(brandProfileStrictJsonSchema.additionalProperties, false);
  assertEquals(Array.isArray(brandProfileStrictJsonSchema.required), true);
  assertEquals(
    brandProfileStrictJsonSchema.required.includes("scores"),
    true,
  );
});

Deno.test("resolveBiProviderFromEnv honors BI_USE_GEMINI override", () => {
  assertEquals(
    resolveBiProviderFromEnv({ aiProvider: "groq", biUseGemini: "1" }),
    "gemini",
  );
  assertEquals(
    resolveBiProviderFromEnv({ aiProvider: "groq", biUseGemini: "true" }),
    "gemini",
  );
  assertEquals(
    resolveBiProviderFromEnv({ aiProvider: "groq", biUseGemini: "yes" }),
    "gemini",
  );
  assertEquals(
    resolveBiProviderFromEnv({ aiProvider: "groq" }),
    "groq",
  );
  assertEquals(
    resolveBiProviderFromEnv({ aiProvider: "gemini" }),
    "gemini",
  );
});

Deno.test("resolveDnaProviderFromEnv defaults to gemini until golden eval", () => {
  assertEquals(
    resolveDnaProviderFromEnv({ aiProvider: "groq" }),
    "gemini",
  );
  assertEquals(
    resolveDnaProviderFromEnv({ aiProvider: "groq", dnaUseGemini: "0" }),
    "groq",
  );
});

Deno.test("resolveBiProviderFromEnv throws on invalid AI_PROVIDER", () => {
  assertThrows(
    () => resolveBiProviderFromEnv({ aiProvider: "openai" }),
    Error,
    "openai",
  );
  assertThrows(
    () => resolveBiProviderFromEnv({ aiProvider: "bogus" }),
    Error,
    "bogus",
  );
});

Deno.test("resolveDnaProviderFromEnv throws on invalid AI_PROVIDER", () => {
  assertThrows(
    () => resolveDnaProviderFromEnv({ aiProvider: "openai", dnaUseGemini: "0" }),
    Error,
    "openai",
  );
  assertThrows(
    () => resolveDnaProviderFromEnv({ aiProvider: "bogus", dnaUseGemini: "0" }),
    Error,
    "bogus",
  );
});

Deno.test("resolveStructuredProvider routes scope to BI/DNA env resolvers", () => {
  const priorAi = Deno.env.get("AI_PROVIDER");
  const priorBi = Deno.env.get("BI_USE_GEMINI");
  const priorDna = Deno.env.get("DNA_USE_GEMINI");
  try {
    Deno.env.set("AI_PROVIDER", "groq");
    Deno.env.delete("BI_USE_GEMINI");
    Deno.env.delete("DNA_USE_GEMINI");
    assertEquals(resolveStructuredProvider("bi"), "groq");
    assertEquals(resolveStructuredProvider("dna"), "gemini");

    Deno.env.set("BI_USE_GEMINI", "1");
    assertEquals(resolveStructuredProvider("bi"), "gemini");
  } finally {
    if (priorAi === undefined) Deno.env.delete("AI_PROVIDER");
    else Deno.env.set("AI_PROVIDER", priorAi);
    if (priorBi === undefined) Deno.env.delete("BI_USE_GEMINI");
    else Deno.env.set("BI_USE_GEMINI", priorBi);
    if (priorDna === undefined) Deno.env.delete("DNA_USE_GEMINI");
    else Deno.env.set("DNA_USE_GEMINI", priorDna);
  }
});
