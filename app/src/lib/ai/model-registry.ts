// Typed model registry — file seed for MVP.
// KV-backed runtime config deferred until CF-000 (IPI-469) approves.
// No secrets stored here — API keys go in Cloudflare/Vercel secrets only.

import type { ModelRegistry } from "./types";

export const modelRegistry: ModelRegistry = {
  version: 1,
  updatedAt: "2026-07-07",
  defaultTier: "default",
  models: [
    // ── Workers AI (MVP default) ──
    {
      id: "@cf/meta/llama-3.1-8b-instruct-fp8-fast",
      provider: "workers-ai",
      tier: "default",
      capabilities: { chat: true, structured: false, streaming: true, vision: false, embeddings: false, toolUse: false },
      enabled: true,
      costPer1kInput: 0.045,
      costPer1kOutput: 0.384,
      notes: "Fast cheap chat — MVP default tier",
    },
    {
      id: "@cf/meta/llama-3.1-8b-instruct-fp8-fast",
      provider: "workers-ai",
      tier: "fast",
      capabilities: { chat: true, structured: false, streaming: true, vision: false, embeddings: false, toolUse: false },
      enabled: true,
      costPer1kInput: 0.045,
      costPer1kOutput: 0.384,
    },
    {
      id: "@cf/mistralai/mistral-small-3.1-24b-instruct",
      provider: "workers-ai",
      tier: "structured",
      capabilities: { chat: true, structured: true, streaming: true, vision: true, embeddings: false, toolUse: true },
      enabled: true,
      costPer1kInput: 0.35,
      costPer1kOutput: 0.56,
      notes: "Best mid-size structured output + tool use on Workers AI",
    },
    {
      id: "@cf/meta/llama-3.2-11b-vision-instruct",
      provider: "workers-ai",
      tier: "vision",
      capabilities: { chat: true, structured: false, streaming: true, vision: true, embeddings: false, toolUse: false },
      enabled: true,
      costPer1kInput: 0.049,
      costPer1kOutput: 0.676,
      notes: "Image understanding — limited structured output",
    },
    {
      id: "@cf/baai/bge-base-en-v1.5",
      provider: "workers-ai",
      tier: "embedding",
      capabilities: { chat: false, structured: false, streaming: false, vision: false, embeddings: true, toolUse: false },
      enabled: true,
      costPer1kInput: 0.067,
      notes: "768-dim embeddings, good quality/price balance",
    },

    // ── Gemini (fallback for quality-sensitive paths) ──
    {
      id: "gemini-3.1-flash-lite",
      provider: "gemini",
      tier: "default",
      capabilities: { chat: true, structured: true, streaming: true, vision: false, embeddings: false, toolUse: true },
      enabled: true,
      costPer1kInput: 0.075,
      costPer1kOutput: 0.30,
      notes: "Fallback when Workers AI quality insufficient",
    },
    {
      id: "gemini-3.1-flash-lite",
      provider: "gemini",
      tier: "fast",
      capabilities: { chat: true, structured: true, streaming: true, vision: false, embeddings: false, toolUse: true },
      enabled: true,
      costPer1kInput: 0.075,
      costPer1kOutput: 0.30,
    },
    {
      id: "gemini-3.1-pro-preview",
      provider: "gemini",
      tier: "structured",
      capabilities: { chat: true, structured: true, streaming: true, vision: true, embeddings: false, toolUse: true },
      enabled: true,
      costPer1kInput: 0.50,
      costPer1kOutput: 1.50,
      notes: "Heavy structured output — higher quality, higher cost",
    },
    {
      id: "gemini-3.5-flash",
      provider: "gemini",
      tier: "vision",
      capabilities: { chat: true, structured: true, streaming: true, vision: true, embeddings: false, toolUse: true },
      enabled: true,
      costPer1kInput: 0.15,
      costPer1kOutput: 0.60,
      notes: "Best vision quality — default for DNA scoring until eval decides",
    },
  ],
};
