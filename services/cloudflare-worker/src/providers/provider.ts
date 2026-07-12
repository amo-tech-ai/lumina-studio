export interface JsonSchema {
  [key: string]: unknown;
}

/** OpenAI-compatible function declaration used by Workers AI chat completions. */
export interface ToolDeclaration {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: JsonSchema;
    strict?: boolean;
  };
}

export type ToolChoice =
  | "none"
  | "auto"
  | "required"
  | {
      type: "function";
      function: { name: string };
    };

export interface ChatToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  /** Required on tool-result messages so the model can match the result to a call. */
  tool_call_id?: string;
  /** Returned on assistant messages when the model selects one or more tools. */
  tool_calls?: ChatToolCall[];
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  response_format?: { type: "json_object" } | { type: "text" };
  /** OpenAI-compatible tools forwarded unchanged to Workers AI. */
  tools?: ToolDeclaration[];
  /** Controls whether and which tool the model may call. */
  tool_choice?: ToolChoice;
  /** Allow supported models to request multiple tools in one turn. */
  parallel_tool_calls?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  model: string;
  choices: {
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface EmbeddingRequest {
  model: string;
  input: string | string[];
}

export interface EmbeddingResponse {
  model: string;
  data: { index: number; embedding: number[] }[];
  usage: { prompt_tokens: number; total_tokens: number };
}

export interface ProviderConfig {
  /** Bearer token (Workers AI API token or gateway auth). */
  apiKey: string;
  baseUrl: string;
  /** Cloudflare account ID — URL path segment for Workers AI OpenAI-compat API. */
  accountId?: string;
}

export interface AiProvider {
  chat(req: ChatCompletionRequest, config: ProviderConfig): Promise<ChatCompletionResponse>;
  chatStream(req: ChatCompletionRequest, config: ProviderConfig): Promise<Response>;
  embed?(req: EmbeddingRequest, config: ProviderConfig): Promise<EmbeddingResponse>;
}

export function createCompletionId(): string {
  return `chatcmpl-${crypto.randomUUID()}`;
}
