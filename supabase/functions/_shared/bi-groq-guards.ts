import type { CrawlRawData } from "./crawl-context.ts";
import { isCrawlThin } from "./crawl-context.ts";

export type GuardedError = {
  code: string;
  message: string;
  status: number;
};

/** Returns 503 config_error when the active BI provider's API key is missing. */
export function missingBiProviderConfigError(
  provider: "gemini" | "groq",
  secrets: { geminiApiKey?: string | null; groqApiKey?: string | null },
): GuardedError | null {
  if (provider === "gemini" && !secrets.geminiApiKey) {
    return {
      code: "config_error",
      message: "Brand intelligence is not configured",
      status: 503,
    };
  }
  if (provider === "groq" && !secrets.groqApiKey) {
    return {
      code: "config_error",
      message: "Brand intelligence Groq is not configured",
      status: 503,
    };
  }
  return null;
}

/** Groq BI rejects when no crawl markdown exists in raw_data or formatted text. */
export function groqEmptyCrawlError(
  crawlText: string,
  raw?: CrawlRawData | null,
): GuardedError | null {
  if (crawlText.trim()) return null;
  const hasMarkdown = (raw?.pages ?? []).some(
    (page) => (page.markdown?.trim().length ?? 0) > 0,
  );
  if (hasMarkdown) return null;
  return {
    code: "validation_error",
    message:
      "Groq brand analysis requires Firecrawl page content. Run a brand crawl first or set BI_USE_GEMINI=1.",
    status: 422,
  };
}

/** DNA vision returns 501 until Groq golden eval when provider is not gemini. */
export function dnaVisionDeferredError(
  provider: "gemini" | "groq",
): GuardedError | null {
  if (provider === "gemini") return null;
  return {
    code: "not_implemented",
    message: "Groq vision DNA is deferred until golden eval (DNA_USE_GEMINI=1)",
    status: 501,
  };
}

/**
 * Gemini uses Firecrawl crawl analysis when crawl is not thin and text exists;
 * otherwise it falls back to URL context + search.
 */
export function geminiUsesCrawlAnalysis(
  raw: CrawlRawData | null | undefined,
  crawlText: string,
): boolean {
  return !isCrawlThin(raw) && crawlText.trim().length > 0;
}

/** Groq accepts any non-empty formatted crawl text, including thin crawls. */
export function groqHasRequiredCrawlContent(crawlText: string): boolean {
  return crawlText.trim().length > 0;
}

/** Whether crawl text was included in the BI LLM request (telemetry + API metadata). */
export function biUsedCrawlInRequest(
  provider: "gemini" | "groq",
  raw: CrawlRawData | null | undefined,
  crawlText: string,
): boolean {
  if (provider === "groq") {
    return groqHasRequiredCrawlContent(crawlText);
  }
  return geminiUsesCrawlAnalysis(raw, crawlText);
}
