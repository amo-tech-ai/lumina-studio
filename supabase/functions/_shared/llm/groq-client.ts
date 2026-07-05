import { getOptionalSecret } from "../env.ts";
import {
  assertNoDeprecatedToolApi,
  assertStructuredRequestOptions,
  normalizeCompletionTokenLimit,
  orderPromptMessages,
  type GroqChatRequest,
} from "./constraints.ts";
import { parseGroqRateLimitHeaders, withGroqRetry } from "./retry.ts";
import type { GroqRateLimitHeaders } from "./types.ts";

function resolveBaseUrl(): string {
  return (getOptionalSecret("GROQ_BASE_URL") ?? "https://api.groq.com/openai/v1")
    .replace(/\/$/, "");
}

export type GroqStructuredCallResult = {
  text: string;
  model: string;
  xGroqRequestId?: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  rateLimits: GroqRateLimitHeaders;
};

export async function groqStructuredCompletion(
  request: GroqChatRequest,
): Promise<GroqStructuredCallResult> {
  assertNoDeprecatedToolApi(request);
  assertStructuredRequestOptions(request);
  const body = normalizeCompletionTokenLimit(request, 4096);
  const apiKey = getOptionalSecret("GROQ_API_KEY");
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured for Groq requests.");
  }

  const response = await withGroqRetry(() =>
    fetch(`${resolveBaseUrl()}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
  );

  const rateLimits = parseGroqRateLimitHeaders(response.headers);

  const payload = await response.json();
  if (!response.ok) {
    const message =
      typeof payload?.error?.message === "string"
        ? payload.error.message
        : `Groq HTTP ${response.status}`;
    throw new Error(message);
  }

  const text = payload?.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) {
    throw new Error("Empty structured response from Groq");
  }

  const usage = payload?.usage;
  return {
    text,
    model: payload?.model ?? body.model,
    xGroqRequestId: response.headers.get("x-groq-id") ??
      response.headers.get("x-request-id") ?? undefined,
    usage: usage
      ? {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
      }
      : undefined,
    rateLimits,
  };
}

export function buildStrictJsonRequest(
  model: string,
  systemPrompt: string,
  userContent: string,
  schema: Record<string, unknown>,
  schemaName = "response",
  maxCompletionTokens = 4096,
): GroqChatRequest {
  return normalizeCompletionTokenLimit(
    {
      model,
      messages: [...orderPromptMessages(systemPrompt, userContent)],
      stream: false,
      temperature: 0.2,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: schemaName,
          strict: true,
          schema,
        },
      },
    },
    maxCompletionTokens,
  );
}
