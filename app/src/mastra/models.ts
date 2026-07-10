export {
  GEMINI_MODELS,
  resolveGeminiModel,
  resolveModel,
  resolveProvider,
  resolveProviderOptions,
  resolveAiProvider,
  resolveAiRoutingMode,
  resolveGatewayModelId,
  resolveGroqModelId,
  assertGroqTierCapabilities,
  getGroqModelEntry,
} from "@/lib/ai/provider";
export type { AiProvider, GroqModelTier, AiRoutingMode } from "@/lib/ai/provider";
