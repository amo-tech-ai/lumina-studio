/**
 * IPI-771 · CF-MIG-230-W1 — Workers AI dual-format SSE text pick.
 *
 * Cloudflare AI Gateway streams Workers AI chunks with BOTH:
 *   - native: `response: "We"`
 *   - OpenAI-shaped: `choices[0].delta.content: "We"`
 *
 * `workers-ai-provider@3.3.1` used to emit a `text-delta` for each field →
 * AG-UI `TEXT_MESSAGE_CONTENT` doubles (`WeWe offer offer…`).
 *
 * Prefer native `response` when present; otherwise OpenAI delta content.
 * Vendor patch: `app/patches/workers-ai-provider+3.3.1.patch` (mirrors this rule).
 */
export type WorkersAiStreamChunk = {
  response?: unknown;
  choices?: Array<{ delta?: { content?: unknown } }>;
};

export function pickWorkersAiChunkText(chunk: WorkersAiStreamChunk): string | undefined {
  const native = chunk.response;
  if (native != null && String(native).length > 0) {
    return String(native);
  }
  const delta = chunk.choices?.[0]?.delta?.content;
  if (typeof delta === "string" && delta.length > 0) {
    return delta;
  }
  return undefined;
}

/** Reconstruct assistant text from dual-format SSE chunks (one emit per chunk). */
export function reconstructWorkersAiStreamText(chunks: WorkersAiStreamChunk[]): string {
  let out = "";
  for (const chunk of chunks) {
    const piece = pickWorkersAiChunkText(chunk);
    if (piece) out += piece;
  }
  return out;
}
