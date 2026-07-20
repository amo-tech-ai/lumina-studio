import { getOptionalSecret } from "../env.ts";
import { resolveCloudflareGatewayId } from "./allowlist.ts";
import {
  assertNoDeprecatedToolApi,
  assertStructuredRequestOptions,
  orderPromptMessages,
} from "./constraints.ts";
import { withGroqRetry } from "./retry.ts";

/**
 * IPI-741 — Cloudflare's AI Gateway REST endpoint (not the Workers `env.AI`
 * binding, which only exists inside a deployed Cloudflare Worker's own
 * runtime and is unreachable from this Deno Edge Function).
 * @see https://developers.cloudflare.com/ai-gateway/get-started/
 */
function resolveBaseUrl(accountId: string): string {
  return `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1`;
}

/**
 * Workers AI's OpenAI-compat endpoint takes `max_tokens` (default 256 —
 * far too small for a Brand Profile JSON response), not Groq's
 * `max_completion_tokens`. Deliberately not sharing constraints.ts's
 * `normalizeCompletionTokenLimit`/`GroqChatRequest` — reusing it here would
 * silently emit a field Cloudflare ignores and truncate every response.
 */
export type CloudflareChatRequest = {
  model: string;
  messages: Array<{ role: string; content: string }>;
  stream?: boolean;
  tools?: unknown[];
  tool_choice?: unknown;
  functions?: unknown;
  function_call?: unknown;
  max_tokens?: number;
  temperature?: number;
  response_format?: {
    type: "json_schema";
    json_schema: {
      name: string;
      strict: boolean;
      schema: Record<string, unknown>;
    };
  };
};

export type CloudflareStructuredCallResult = {
  text: string;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
};

export async function cloudflareStructuredCompletion(
  request: CloudflareChatRequest,
): Promise<CloudflareStructuredCallResult> {
  assertNoDeprecatedToolApi(request);
  assertStructuredRequestOptions(request);
  const body: CloudflareChatRequest = {
    ...request,
    max_tokens: request.max_tokens ?? 4096,
  };

  const apiToken = getOptionalSecret("CLOUDFLARE_API_TOKEN");
  const accountId = getOptionalSecret("CLOUDFLARE_ACCOUNT_ID");
  if (!apiToken || !accountId) {
    throw new Error(
      "CLOUDFLARE_API_TOKEN/CLOUDFLARE_ACCOUNT_ID are not configured for Workers AI requests.",
    );
  }

  const response = await withGroqRetry(() =>
    fetch(`${resolveBaseUrl(accountId)}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "cf-aig-gateway-id": resolveCloudflareGatewayId(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
  );

  const payload = await readCloudflareJsonPayload(response);

  if (!response.ok) {
    const err = payload.error as { message?: string } | undefined;
    const message = typeof err?.message === "string"
      ? err.message
      : `Workers AI HTTP ${response.status}`;
    throw new Error(message);
  }

  const choices = payload.choices as
    | Array<{ message?: { content?: unknown } }>
    | undefined;
  const content = choices?.[0]?.message?.content;
  // Cloudflare's json_schema mode has been observed returning an
  // already-parsed object for `message.content` (unlike Groq/OpenAI, which
  // always return a JSON-encoded string) — normalize both shapes to text so
  // the shared repair-on-invalid-JSON pipeline in structured.ts can re-parse
  // it the same way regardless of provider.
  const text = typeof content === "string"
    ? content.trim()
    : content && typeof content === "object"
    ? JSON.stringify(content)
    : "";
  if (!text) {
    throw new Error("Empty structured response from Workers AI");
  }

  const usage = payload.usage as
    | { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
    | undefined;
  return {
    text,
    model: (payload.model as string | undefined) ?? body.model,
    usage: usage
      ? {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
      }
      : undefined,
  };
}

async function readCloudflareJsonPayload(
  response: Response,
): Promise<Record<string, unknown>> {
  const rawBody = await response.text();
  if (!rawBody) return {};

  const contentType = response.headers.get("content-type") ?? "";
  const looksJson = contentType.includes("json") || rawBody.trimStart().startsWith("{");
  if (!looksJson) {
    if (!response.ok) {
      throw new Error(rawBody.slice(0, 200) || `Workers AI HTTP ${response.status}`);
    }
    throw new Error("Workers AI response was not JSON");
  }

  try {
    const parsed = JSON.parse(rawBody);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    if (!response.ok) {
      throw new Error(rawBody.slice(0, 200) || `Workers AI HTTP ${response.status}`);
    }
    throw new Error("Workers AI response was not valid JSON");
  }
}

export function buildCloudflareStrictJsonRequest(
  model: string,
  systemPrompt: string,
  userContent: string,
  schema: Record<string, unknown>,
  schemaName = "response",
  maxTokens = 4096,
): CloudflareChatRequest {
  return {
    model,
    messages: [...orderPromptMessages(systemPrompt, userContent)],
    stream: false,
    temperature: 0.2,
    max_tokens: maxTokens,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: schemaName,
        strict: true,
        schema,
      },
    },
  };
}
