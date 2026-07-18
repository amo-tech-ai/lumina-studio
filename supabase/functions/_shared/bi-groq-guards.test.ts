import {
  assertEquals,
  assertNotEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

import {
  biUsedCrawlInRequest,
  dnaVisionDeferredError,
  geminiUsesCrawlAnalysis,
  groqEmptyCrawlError,
  groqHasRequiredCrawlContent,
  missingBiProviderConfigError,
} from "./bi-groq-guards.ts";
import { formatCrawlForPrompt, isCrawlThin } from "./crawl-context.ts";

Deno.test("missingBiProviderConfigError returns 503 when Gemini key missing", () => {
  const err = missingBiProviderConfigError("gemini", {
    geminiApiKey: null,
    groqApiKey: "groq-key",
  });
  assertEquals(err?.status, 503);
  assertEquals(err?.message, "Brand intelligence is not configured");
});

Deno.test("missingBiProviderConfigError returns 503 when Groq key missing", () => {
  const err = missingBiProviderConfigError("groq", {
    geminiApiKey: "gemini-key",
    groqApiKey: undefined,
  });
  assertEquals(err?.status, 503);
  assertEquals(err?.message, "Brand intelligence Groq is not configured");
});

Deno.test("missingBiProviderConfigError passes when required key present", () => {
  assertEquals(
    missingBiProviderConfigError("gemini", { geminiApiKey: "x" }),
    null,
  );
  assertEquals(
    missingBiProviderConfigError("groq", { groqApiKey: "x" }),
    null,
  );
});

Deno.test("groqEmptyCrawlError accepts raw pages when formatter returned empty", () => {
  const raw = {
    pages: [
      { markdown: "   " },
      { markdown: "B".repeat(120), metadata: { url: "https://example.com/about" } },
    ],
  };
  assertEquals(groqEmptyCrawlError("", raw), null);
});

Deno.test("groqEmptyCrawlError returns 422 only for empty formatted crawl text", () => {
  assertEquals(groqEmptyCrawlError(""), { code: "validation_error", message: "Groq brand analysis requires Firecrawl page content. Run a brand crawl first or set BI_USE_GEMINI=1.", status: 422 });
  assertEquals(groqEmptyCrawlError("   "), { code: "validation_error", message: "Groq brand analysis requires Firecrawl page content. Run a brand crawl first or set BI_USE_GEMINI=1.", status: 422 });
  assertEquals(groqEmptyCrawlError("page content"), null);
});

Deno.test("thin crawl: Gemini URL-fallback vs Groq crawl acceptance diverge", () => {
  const thinRaw = {
    pages: [{ markdown: "A".repeat(120), metadata: { url: "https://example.com" } }],
  };
  const crawlText = formatCrawlForPrompt(thinRaw);

  assertEquals(isCrawlThin(thinRaw), true);
  assertEquals(geminiUsesCrawlAnalysis(thinRaw, crawlText), false);
  assertEquals(groqHasRequiredCrawlContent(crawlText), true);
  assertEquals(groqEmptyCrawlError(crawlText), null);
  assertEquals(biUsedCrawlInRequest("gemini", thinRaw, crawlText), false);
  assertEquals(biUsedCrawlInRequest("groq", thinRaw, crawlText), true);
});

Deno.test("empty crawl: both Gemini and Groq lack crawl content", () => {
  const emptyText = formatCrawlForPrompt(null);
  assertEquals(emptyText, "");
  assertEquals(geminiUsesCrawlAnalysis(null, emptyText), false);
  assertEquals(groqHasRequiredCrawlContent(emptyText), false);
  assertNotEquals(groqEmptyCrawlError(emptyText), null);
});

Deno.test("dnaVisionDeferredError returns 501 for groq provider", () => {
  const err = dnaVisionDeferredError("groq");
  assertEquals(err?.status, 501);
  assertEquals(err?.code, "not_implemented");
  assertEquals(dnaVisionDeferredError("gemini"), null);
});
