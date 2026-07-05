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
