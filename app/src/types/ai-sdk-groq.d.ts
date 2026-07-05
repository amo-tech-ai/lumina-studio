declare module "@ai-sdk/groq" {
  import type { LanguageModelV3 } from "@ai-sdk/provider";

  export function createGroq(options: {
    apiKey: string;
    baseURL?: string;
  }): (modelId: string) => LanguageModelV3;
}
