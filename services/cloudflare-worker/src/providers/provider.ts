export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  response_format?: { type: "json_object" } | { type: "text" };
}

export interface ChatCompletionResponse {
  id: string;
  model: string;
  choices: {
    index: number;
    message: { role: string; content: string };
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
  apiKey: string;
  baseUrl: string;
}

export interface AiProvider {
  chat(req: ChatCompletionRequest, config: ProviderConfig): Promise<ChatCompletionResponse>;
  chatStream(req: ChatCompletionRequest, config: ProviderConfig): Promise<Response>;
  embed?(req: EmbeddingRequest, config: ProviderConfig): Promise<EmbeddingResponse>;
}

export function createCompletionId(): string {
  return `chatcmpl-${crypto.randomUUID()}`;
}
