import {
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

import type { BrandProfilePayload } from "../_shared/schemas/brand-profile.ts";
import type { StructuredGenerationOptions } from "../_shared/llm/types.ts";
import {
  BASE_EDGE_ENV,
  withEnv,
  withMockFetch,
} from "../_shared/test/mock-fetch.ts";

const BRAND_ID = "11111111-1111-1111-1111-111111111111";
const TEST_URL = "https://example.com";

function claim(value: string, quote = value): BrandProfilePayload["tagline"] {
  return {
    value,
    evidence: [{ sourceUrl: `${TEST_URL}/`, quote }],
  };
}

const mockProfile: BrandProfilePayload = {
  schemaVersion: 2,
  name: "Example Brand",
  tagline: claim("Clean essentials", "Clean essentials for modern living"),
  category: claim("DTC apparel", "apparel collections"),
  visualIdentity: { colors: ["#111111"], mood: "minimal" },
  targetAudience: claim("Urban professionals", "designed for urban professionals"),
  sourceUrl: TEST_URL,
  scores: {
    visual: 80,
    audience: 75,
    consistency: 70,
    commerce_readiness: 85,
  },
};

const crawlWithText = {
  id: "crawl-test-1",
  brand_id: BRAND_ID,
  source_url: TEST_URL,
  pages_crawled: 2,
  job_status: "complete",
  raw_data: {
    pages: [
      {
        markdown: "A".repeat(120),
        metadata: { url: `${TEST_URL}/` },
      },
      {
        markdown: "B".repeat(120),
        metadata: { url: `${TEST_URL}/about` },
      },
    ],
  },
};

function biRequest(body: Record<string, unknown>): Request {
  return new Request("https://localhost/functions/v1/brand-intelligence", {
    method: "POST",
    headers: {
      Authorization: "Bearer test-jwt",
      "Content-Type": "application/json",
      apikey: BASE_EDGE_ENV.SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });
}

async function parseError(res: Response) {
  const json = await res.json();
  return json as { ok: false; error: { code: string; message: string } };
}

async function parseSuccess(res: Response) {
  const json = await res.json();
  return json as { ok: true; data: Record<string, unknown> };
}

async function captureBiDiagnostics<T>(run: () => Promise<T>) {
  const original = console.info;
  const events: Array<Record<string, unknown>> = [];
  console.info = (...args: unknown[]) => {
    try {
      const event = JSON.parse(String(args[0])) as Record<string, unknown>;
      if (event.event === "brand_intelligence_diagnostic") events.push(event);
    } catch {
      original(...args);
    }
  };
  try {
    return { value: await run(), events };
  } finally {
    console.info = original;
  }
}

Deno.test("brand-intelligence terminates unauthenticated requests with BI_FAILED", async () => {
  await withEnv(BASE_EDGE_ENV, async () => {
    await withMockFetch({}, async () => {
      const { handleBrandIntelligenceRequest } = await import("./handler.ts");
      const request = new Request(
        "https://localhost/functions/v1/brand-intelligence",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brandId: BRAND_ID, url: TEST_URL }),
        },
      );
      const { value: res, events } = await captureBiDiagnostics(() =>
        handleBrandIntelligenceRequest(request)
      );
      assertEquals(res.status, 401);
      assertEquals(events.map((event) => event.checkpoint), [
        "REQUEST_RECEIVED",
        "BI_FAILED",
      ]);
      assertEquals(events[1]?.category, "orchestration/invocation");
      assertEquals(events[1]?.errorCode, "authentication_failed");
    });
  });
});

Deno.test("brand-intelligence accepts service-role bearer for workflow calls", async () => {
  await withEnv({
    ...BASE_EDGE_ENV,
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    AI_PROVIDER: "groq",
    BI_USE_GEMINI: "0",
    GROQ_API_KEY: undefined,
  }, async () => {
    await withMockFetch({}, async () => {
      const { handleBrandIntelligenceRequest } = await import("./handler.ts");
      const res = await handleBrandIntelligenceRequest(new Request(
        "https://localhost/functions/v1/brand-intelligence",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer test-service-role-key",
            "Content-Type": "application/json",
            apikey: BASE_EDGE_ENV.SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            brandId: BRAND_ID,
            url: TEST_URL,
            draft_mode: true,
          }),
        },
      ));
      assertEquals(res.status, 503);
      const body = await parseError(res);
      assertEquals(body.error.code, "config_error");
    });
  });
});

Deno.test("brand-intelligence classifies malformed Gemini JSON as schema failure", async () => {
  await withEnv({
    ...BASE_EDGE_ENV,
    BI_USE_GEMINI: "1",
    GEMINI_API_KEY: "gemini-test-key",
  }, async () => {
    await withMockFetch({ crawl: crawlWithText }, async () => {
      const {
        handleBrandIntelligenceRequest,
        __setGeminiStructuredGenerateForTests,
      } = await import("./handler.ts");
      __setGeminiStructuredGenerateForTests((() =>
        Promise.resolve({
          response: {} as never,
          text: "{malformed-json",
          model: "gemini-3.1-flash-lite",
        })) as typeof import("../_shared/gemini.ts").generateStructuredContent);
      try {
        const { value: res, events } = await captureBiDiagnostics(() =>
          handleBrandIntelligenceRequest(biRequest({
            brandId: BRAND_ID,
            url: TEST_URL,
            crawlResultId: crawlWithText.id,
            draft_mode: true,
          }))
        );
        assertEquals(res.status, 500);
        const failure = events.find((event) => event.checkpoint === "BI_FAILED");
        assertEquals(failure?.category, "schema");
        assertEquals(failure?.errorCode, "internal_error");
      } finally {
        __setGeminiStructuredGenerateForTests(null);
      }
    });
  });
});

Deno.test("brand-intelligence classifies brand lookup errors as database failure", async () => {
  await withEnv({
    ...BASE_EDGE_ENV,
    BI_PROVIDER: "cloudflare",
    CLOUDFLARE_API_TOKEN: "cf-test-token",
    CLOUDFLARE_ACCOUNT_ID: "cf-test-account",
  }, async () => {
    await withMockFetch({
      brandFetchError: { message: "database unavailable", code: "PGRST000" },
    }, async () => {
      const { handleBrandIntelligenceRequest } = await import("./handler.ts");
      const { value: res, events } = await captureBiDiagnostics(() =>
        handleBrandIntelligenceRequest(biRequest({
          brandId: BRAND_ID,
          url: TEST_URL,
        }))
      );
      assertEquals(res.status, 500);
      const body = await parseError(res);
      assertEquals(body.error.code, "database_error");
      const failure = events.find((event) => event.checkpoint === "BI_FAILED");
      assertEquals(failure?.category, "database read");
      assertEquals(failure?.errorCode, "database_error");
    });
  });
});

Deno.test("brand-intelligence keeps an empty successful lookup as not_found", async () => {
  await withEnv({
    ...BASE_EDGE_ENV,
    BI_PROVIDER: "cloudflare",
    CLOUDFLARE_API_TOKEN: "cf-test-token",
    CLOUDFLARE_ACCOUNT_ID: "cf-test-account",
  }, async () => {
    await withMockFetch({ brand: null }, async () => {
      const { handleBrandIntelligenceRequest } = await import("./handler.ts");
      const { value: res, events } = await captureBiDiagnostics(() =>
        handleBrandIntelligenceRequest(biRequest({
          brandId: BRAND_ID,
          url: TEST_URL,
        }))
      );
      assertEquals(res.status, 404);
      const body = await parseError(res);
      assertEquals(body.error.code, "not_found");
      const failure = events.find((event) => event.checkpoint === "BI_FAILED");
      assertEquals(failure?.category, "orchestration/invocation");
      assertEquals(failure?.errorCode, "not_found");
    });
  });
});

Deno.test("brand-intelligence returns 503 when Groq key missing", async () => {
  await withEnv({
    ...BASE_EDGE_ENV,
    AI_PROVIDER: "groq",
    BI_USE_GEMINI: "0",
    GROQ_API_KEY: undefined,
  }, async () => {
    await withMockFetch({}, async () => {
      const { handleBrandIntelligenceRequest } = await import("./handler.ts");
      const res = await handleBrandIntelligenceRequest(biRequest({
        brandId: BRAND_ID,
        url: TEST_URL,
      }));
      assertEquals(res.status, 503);
      const body = await parseError(res);
      assertEquals(body.error.code, "config_error");
      assertEquals(body.error.message, "Brand intelligence Groq is not configured");
    });
  });
});

Deno.test("brand-intelligence returns 503 when Gemini fallback key missing", async () => {
  await withEnv({
    ...BASE_EDGE_ENV,
    AI_PROVIDER: "groq",
    BI_USE_GEMINI: "1",
    GEMINI_API_KEY: undefined,
  }, async () => {
    await withMockFetch({}, async () => {
      const { handleBrandIntelligenceRequest } = await import("./handler.ts");
      const res = await handleBrandIntelligenceRequest(biRequest({
        brandId: BRAND_ID,
        url: TEST_URL,
      }));
      assertEquals(res.status, 503);
      const body = await parseError(res);
      assertEquals(body.error.code, "config_error");
      assertEquals(body.error.message, "Brand intelligence is not configured");
    });
  });
});

Deno.test("brand-intelligence Groq path returns 422 and marks intake failed without crawl", async () => {
  const intakeStatusUpdates: string[] = [];
  await withEnv({
    ...BASE_EDGE_ENV,
    AI_PROVIDER: "groq",
    BI_USE_GEMINI: "0",
    GROQ_API_KEY: "gsk_test_key",
  }, async () => {
    await withMockFetch({ crawl: null, intakeStatusUpdates }, async () => {
      const { handleBrandIntelligenceRequest } = await import("./handler.ts");
      const res = await handleBrandIntelligenceRequest(biRequest({
        brandId: BRAND_ID,
        url: TEST_URL,
      }));
      assertEquals(res.status, 422);
      const body = await parseError(res);
      assertEquals(body.error.code, "validation_error");
      assertEquals(intakeStatusUpdates.includes("failed"), true);
    });
  });
});

Deno.test("brand-intelligence Groq path calls shared LLM and returns 200", async () => {
  const llmCalls: StructuredGenerationOptions[] = [];

  await withEnv({
    ...BASE_EDGE_ENV,
    AI_PROVIDER: "groq",
    BI_USE_GEMINI: "0",
    GROQ_API_KEY: "gsk_test_key",
  }, async () => {
    await withMockFetch({ crawl: crawlWithText }, async () => {
      const { handleBrandIntelligenceRequest, __setLlmStructuredGenerateForTests } =
        await import("./handler.ts");
      __setLlmStructuredGenerateForTests(((options) => {
        llmCalls.push(options);
        return Promise.resolve({
          data: mockProfile,
          text: JSON.stringify(mockProfile),
          log: {
            provider: "groq" as const,
            model: "openai/gpt-oss-20b",
            schemaRepairCount: 0,
            xGroqRequestId: "req-test-1",
            usage: { promptTokens: 10, completionTokens: 20 },
          },
        });
      }) as typeof import("../_shared/llm/structured.ts").generateStructuredContent);
      try {
        const res = await handleBrandIntelligenceRequest(biRequest({
          brandId: BRAND_ID,
          url: TEST_URL,
        }));
        assertEquals(res.status, 200);
        const body = await parseSuccess(res);
        assertEquals(body.data.provider, "groq");
        assertEquals(body.data.usedCrawl, true);
        assertEquals(body.data.brandId, BRAND_ID);
        assertEquals(typeof body.data.correlationId, "string");
        assertEquals(llmCalls.length, 1);
        assertEquals(llmCalls[0]?.scope, "bi");
        assertEquals(llmCalls[0]?.tier, "structured");
      } finally {
        __setLlmStructuredGenerateForTests(null);
      }
    });
  });
});

Deno.test("brand-intelligence returns 503 when Workers AI credentials missing (IPI-741)", async () => {
  await withEnv({
    ...BASE_EDGE_ENV,
    BI_PROVIDER: "cloudflare",
    CLOUDFLARE_API_TOKEN: undefined,
    CLOUDFLARE_ACCOUNT_ID: undefined,
  }, async () => {
    await withMockFetch({}, async () => {
      const { handleBrandIntelligenceRequest } = await import("./handler.ts");
      const res = await handleBrandIntelligenceRequest(biRequest({
        brandId: BRAND_ID,
        url: TEST_URL,
      }));
      assertEquals(res.status, 503);
      const body = await parseError(res);
      assertEquals(body.error.code, "config_error");
      assertEquals(body.error.message, "Brand intelligence Workers AI is not configured");
    });
  });
});

Deno.test("brand-intelligence Workers AI path returns 422 and marks intake failed without crawl (IPI-741)", async () => {
  const intakeStatusUpdates: string[] = [];
  await withEnv({
    ...BASE_EDGE_ENV,
    BI_PROVIDER: "cloudflare",
    CLOUDFLARE_API_TOKEN: "cf-test-token",
    CLOUDFLARE_ACCOUNT_ID: "cf-test-account",
  }, async () => {
    await withMockFetch({ crawl: null, intakeStatusUpdates }, async () => {
      const { handleBrandIntelligenceRequest } = await import("./handler.ts");
      const res = await handleBrandIntelligenceRequest(biRequest({
        brandId: BRAND_ID,
        url: TEST_URL,
      }));
      assertEquals(res.status, 422);
      const body = await parseError(res);
      assertEquals(body.error.code, "validation_error");
      assertEquals(intakeStatusUpdates.includes("failed"), true);
    });
  });
});

Deno.test("brand-intelligence Workers AI path calls shared LLM and returns 200 (IPI-741)", async () => {
  const llmCalls: StructuredGenerationOptions[] = [];

  await withEnv({
    ...BASE_EDGE_ENV,
    BI_PROVIDER: "cloudflare",
    CLOUDFLARE_API_TOKEN: "cf-test-token",
    CLOUDFLARE_ACCOUNT_ID: "cf-test-account",
  }, async () => {
    await withMockFetch({ crawl: crawlWithText }, async () => {
      const { handleBrandIntelligenceRequest, __setLlmStructuredGenerateForTests } =
        await import("./handler.ts");
      __setLlmStructuredGenerateForTests(((options) => {
        llmCalls.push(options);
        return Promise.resolve({
          data: mockProfile,
          text: JSON.stringify(mockProfile),
          log: {
            provider: "workers-ai" as const,
            model: "@cf/meta/llama-4-scout-17b-16e-instruct",
            schemaRepairCount: 0,
            usage: { promptTokens: 10, completionTokens: 20 },
          },
        });
      }) as typeof import("../_shared/llm/structured.ts").generateStructuredContent);
      try {
        const { value: res, events } = await captureBiDiagnostics(() =>
          handleBrandIntelligenceRequest(biRequest({
            brandId: BRAND_ID,
            url: TEST_URL,
            draft_mode: true,
          }))
        );
        assertEquals(res.status, 200);
        const body = await parseSuccess(res);
        assertEquals(body.data.provider, "workers-ai");
        assertEquals(body.data.usedCrawl, true);
        assertEquals(body.data.brandId, BRAND_ID);
        assertEquals(llmCalls.length, 1);
        assertEquals(llmCalls[0]?.scope, "bi");
        assertEquals(events.map((event) => event.checkpoint), [
          "REQUEST_RECEIVED",
          "PROVIDER_SELECTED",
          "PROVIDER_STARTED",
          "PROVIDER_COMPLETED",
          "SCHEMA_VALID",
          "DRAFT_WRITTEN",
          "DRAFT_READY",
        ]);
        assertEquals(events[1]?.configurationSource, "BI_PROVIDER");
        assertEquals(events[3]?.provider, "workers-ai");
        assertEquals(typeof events[3]?.providerDurationMs, "number");
        assertEquals(events[3]?.brandId, BRAND_ID);
        assertEquals(events[3]?.crawlResultId, crawlWithText.id);
      } finally {
        __setLlmStructuredGenerateForTests(null);
      }
    });
  });
});

Deno.test("brand-intelligence records a redacted provider failure checkpoint (IPI-969)", async () => {
  await withEnv({
    ...BASE_EDGE_ENV,
    BI_PROVIDER: "cloudflare",
    CLOUDFLARE_API_TOKEN: "cf-test-token",
    CLOUDFLARE_ACCOUNT_ID: "cf-test-account",
  }, async () => {
    await withMockFetch({ crawl: crawlWithText }, async () => {
      const { handleBrandIntelligenceRequest, __setLlmStructuredGenerateForTests } =
        await import("./handler.ts");
      __setLlmStructuredGenerateForTests((() =>
        Promise.reject(new Error("raw provider response must not be logged"))) as typeof import("../_shared/llm/structured.ts").generateStructuredContent);
      try {
        const { value: res, events } = await captureBiDiagnostics(() =>
          handleBrandIntelligenceRequest(biRequest({
            brandId: BRAND_ID,
            url: TEST_URL,
            draft_mode: true,
          }))
        );
        assertEquals(res.status, 500);
        const failure = events.find((event) => event.checkpoint === "BI_FAILED");
        assertEquals(failure?.category, "provider");
        assertEquals(failure?.errorCode, "internal_error");
        assertEquals(typeof failure?.providerDurationMs, "number");
        assertEquals(failure?.brandId, BRAND_ID);
        assertEquals(failure?.crawlResultId, crawlWithText.id);
        assertEquals(JSON.stringify(failure).includes("raw provider response"), false);
      } finally {
        __setLlmStructuredGenerateForTests(null);
      }
    });
  });
});

Deno.test("brand-intelligence classifies exhausted structured output as schema failure", async () => {
  await withEnv({
    ...BASE_EDGE_ENV,
    BI_PROVIDER: "cloudflare",
    CLOUDFLARE_API_TOKEN: "cf-test-token",
    CLOUDFLARE_ACCOUNT_ID: "cf-test-account",
  }, async () => {
    await withMockFetch({ crawl: crawlWithText }, async () => {
      const {
        handleBrandIntelligenceRequest,
        __setLlmStructuredGenerateForTests,
      } = await import("./handler.ts");
      const { StructuredOutputValidationError } = await import(
        "../_shared/llm/structured.ts"
      );
      __setLlmStructuredGenerateForTests((() =>
        Promise.reject(
          new StructuredOutputValidationError("invalid structured payload"),
        )) as typeof import("../_shared/llm/structured.ts").generateStructuredContent);
      try {
        const { value: res, events } = await captureBiDiagnostics(() =>
          handleBrandIntelligenceRequest(biRequest({
            brandId: BRAND_ID,
            url: TEST_URL,
            crawlResultId: crawlWithText.id,
            draft_mode: true,
          }))
        );
        assertEquals(res.status, 500);
        const failure = events.find((event) => event.checkpoint === "BI_FAILED");
        assertEquals(failure?.category, "schema");
        assertEquals(failure?.brandId, BRAND_ID);
        assertEquals(failure?.crawlResultId, crawlWithText.id);
      } finally {
        __setLlmStructuredGenerateForTests(null);
      }
    });
  });
});

Deno.test("brand-intelligence thin crawl still reports usedCrawl true on Groq path", async () => {
  const thinCrawl = {
    ...crawlWithText,
    raw_data: {
      pages: [{
        markdown: "A".repeat(120),
        metadata: { url: `${TEST_URL}/` },
      }],
    },
  };

  await withEnv({
    ...BASE_EDGE_ENV,
    AI_PROVIDER: "groq",
    BI_USE_GEMINI: "0",
    GROQ_API_KEY: "gsk_test_key",
  }, async () => {
    await withMockFetch({ crawl: thinCrawl }, async () => {
      const { handleBrandIntelligenceRequest, __setLlmStructuredGenerateForTests } =
        await import("./handler.ts");
      __setLlmStructuredGenerateForTests((() =>
        Promise.resolve({
          data: mockProfile,
          text: JSON.stringify(mockProfile),
          log: {
            provider: "groq" as const,
            model: "openai/gpt-oss-20b",
            schemaRepairCount: 0,
          },
        })) as typeof import("../_shared/llm/structured.ts").generateStructuredContent);
      try {
        const res = await handleBrandIntelligenceRequest(biRequest({
          brandId: BRAND_ID,
          url: TEST_URL,
        }));
        assertEquals(res.status, 200);
        const body = await parseSuccess(res);
        assertEquals(body.data.usedCrawl, true);
      } finally {
        __setLlmStructuredGenerateForTests(null);
      }
    });
  });
});
