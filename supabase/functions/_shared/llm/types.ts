export type AiProvider = "gemini" | "groq" | "openai";

export type GroqModelTier =
  | "default"
  | "fast"
  | "structured"
  | "structuredHeavy"
  | "vision"
  | "visionExperimental"
  | "compound"
  | "compoundMini"
  | "stt"
  | "safety";

export type GroqModelEntry = {
  id: string;
  tier: GroqModelTier;
  strictStructured: boolean;
  parallelTools: boolean;
  promptCaching: boolean;
  evaluationOnly: boolean;
  productionDefault: boolean;
  deprecatedAfter?: string;
  replacementModel?: string;
};

export type GroqModelsConfig = {
  version: number;
  updatedAt: string;
  envMapping: Record<GroqModelTier, string>;
  defaults: Record<GroqModelTier, string>;
  models: GroqModelEntry[];
};

export type GroqRateLimitHeaders = {
  retryAfterMs?: number;
  limitRequests?: number;
  remainingRequests?: number;
  limitTokens?: number;
  remainingTokens?: number;
};

export type StructuredGenerationLog = {
  provider: AiProvider;
  model: string;
  xGroqRequestId?: string;
  schemaRepairCount: number;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
};

export type StructuredGenerationScope = "bi" | "dna" | "default";

export type StructuredGenerationOptions = {
  /** Per-function provider override (BI / DNA env flags). */
  scope?: StructuredGenerationScope;
  systemPrompt: string;
  userContent: string;
  /** Groq strict JSON Schema object. */
  jsonSchema: Record<string, unknown>;
  /** Gemini `@google/genai` responseSchema — required for gemini provider path. */
  geminiResponseSchema?: object;
  schemaName?: string;
  tier?: GroqModelTier;
  maxCompletionTokens?: number;
  temperature?: number;
  timeoutMs?: number;
};

export type StructuredGenerationResult<T> = {
  data: T;
  text: string;
  log: StructuredGenerationLog;
};
