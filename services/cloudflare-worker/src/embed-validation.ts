/**
 * Embed request validation + model allowlist (IPI-492).
 * Worker is the canonical contract; reject before any provider fetch.
 *
 * SSOT: iPix gateway supports Workers AI BGE for embeddings.
 * Gemini embedding *routing* is not implemented here.
 */

import {
  resolveModelEntry,
  type ModelEntry,
  type ModelRegistry,
} from "./model-registry";

/** Gateway policy — not a Cloudflare hard limit (docs: batch yes, no published max). */
export const MAX_EMBED_INPUTS = 100;

/** Explicit embedding-capable ids (tier alias + Workers AI model). No gemini-name heuristics. */
export const SUPPORTED_EMBEDDING_MODELS = new Set([
  "embedding",
  "@cf/baai/bge-base-en-v1.5",
]);

export type EmbedValidationOk = { ok: true; input: string | string[] };
export type EmbedValidationErr = { ok: false; message: string };
export type EmbedValidationResult = EmbedValidationOk | EmbedValidationErr;

export function validateEmbeddingInput(input: unknown): EmbedValidationResult {
  if (typeof input === "string") {
    if (!input.trim()) {
      return { ok: false, message: "input must contain at least one non-empty string" };
    }
    return { ok: true, input };
  }

  if (!Array.isArray(input)) {
    return { ok: false, message: "input must be a non-empty string or array of strings" };
  }

  if (input.length === 0) {
    return { ok: false, message: "input must contain at least one non-empty string" };
  }

  if (input.length > MAX_EMBED_INPUTS) {
    return {
      ok: false,
      message: `input may contain at most ${MAX_EMBED_INPUTS} items`,
    };
  }

  // Reject whole request if any element is invalid — do not silently filter (positional vectors).
  if (
    !input.every(
      (value) => typeof value === "string" && value.trim().length > 0,
    )
  ) {
    return {
      ok: false,
      message: "input must contain at least one non-empty string",
    };
  }

  return { ok: true, input: input as string[] };
}

/**
 * Resolve an embedding-capable registry entry.
 * Does NOT fall back to the default chat tier.
 *
 * Policy:
 * - Custom registry has a capable `embedding` tier → use it
 * - Custom registry missing / incapable `embedding` → canonical default BGE
 * - Explicit `@cf/baai/bge-base-en-v1.5` → always canonical default BGE
 */
export function resolveEmbeddingEntry(
  model: string,
  registry?: ModelRegistry,
): ModelEntry | undefined {
  // Explicit Workers AI BGE id — always the canonical default entry (ignore override alias).
  if (model === "@cf/baai/bge-base-en-v1.5") {
    return resolveModelEntry("embedding");
  }

  const byTier = resolveModelEntry(model, registry);
  if (byTier?.capabilities.includes("embedding")) {
    return byTier;
  }

  // Alias "embedding": override may replace the whole registry (getRegistry does not merge).
  // If the override omitted the tier, fall back to DEFAULT_REGISTRY — never re-query the same incomplete override.
  if (model === "embedding") {
    return resolveModelEntry("embedding");
  }

  return undefined;
}

export function isSupportedEmbeddingModel(
  model: string,
  registry?: ModelRegistry,
): boolean {
  return resolveEmbeddingEntry(model, registry) !== undefined;
}
