/**
 * IPI-771 · CF-MIG-230-W1 — dual-format SSE text dedup, verified through the
 * real `workers-ai-provider` entry point (`createWorkersAI().chat(id).doStream()`)
 * against a fake Workers AI binding emitting real SSE bytes. This exercises the
 * exact `dist/index.mjs` code path that `app/patches/workers-ai-provider+3.3.1.patch`
 * patches in production — not a reimplementation of its logic in app code.
 */
import { describe, expect, it, vi } from "vitest";
import { createWorkersAI } from "workers-ai-provider";
import type { LanguageModelV3StreamPart } from "@ai-sdk/provider";

type WorkersAiBinding = Parameters<typeof createWorkersAI>[0] extends { binding: infer B }
  ? B
  : never;

function sseStreamFrom(chunks: unknown[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const lines = [...chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n`), "data: [DONE]\n"];
  return new ReadableStream({
    start(controller) {
      for (const line of lines) controller.enqueue(encoder.encode(line));
      controller.close();
    },
  });
}

async function streamWorkersAiChunks(chunks: unknown[]): Promise<LanguageModelV3StreamPart[]> {
  const binding = { run: vi.fn(async () => sseStreamFrom(chunks)) } as unknown as WorkersAiBinding;
  const workersai = createWorkersAI({ binding });
  const model = workersai.chat("@cf/meta/llama-3.1-8b-instruct");

  const result = await model.doStream({
    prompt: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
  } as Parameters<typeof model.doStream>[0]);

  const parts: LanguageModelV3StreamPart[] = [];
  const reader = result.stream.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    parts.push(value);
  }
  return parts;
}

function textDeltas(parts: LanguageModelV3StreamPart[]): string[] {
  return parts
    .filter((p): p is Extract<LanguageModelV3StreamPart, { type: "text-delta" }> => p.type === "text-delta")
    .map((p) => p.delta);
}

describe("IPI-771 workers-ai-provider dual-format stream dedup (real provider entry point)", () => {
  it("native-only chunk (`response`) emits exactly one text delta", async () => {
    const parts = await streamWorkersAiChunks([{ response: "We" }]);
    expect(textDeltas(parts)).toEqual(["We"]);
  });

  it("OpenAI-only chunk (`choices[0].delta.content`) emits exactly one text delta", async () => {
    const parts = await streamWorkersAiChunks([{ choices: [{ delta: { content: "We" } }] }]);
    expect(textDeltas(parts)).toEqual(["We"]);
  });

  it("chunk carrying both fields with the identical token emits exactly one delta (the dedup case)", async () => {
    const parts = await streamWorkersAiChunks([
      { response: "We", choices: [{ delta: { content: "We" } }] },
    ]);
    expect(textDeltas(parts)).toEqual(["We"]);
  });

  it("the same token repeated across two separate chunks is not deduped — both deltas survive", async () => {
    const parts = await streamWorkersAiChunks([{ response: "the" }, { response: "the" }]);
    expect(textDeltas(parts)).toEqual(["the", "the"]);
  });

  it("tool calls, usage, and finish events pass through unchanged alongside deduped text", async () => {
    const parts = await streamWorkersAiChunks([
      { response: "Sure", choices: [{ delta: { content: "Sure" } }] },
      {
        tool_calls: [
          {
            index: 0,
            id: "call_1",
            function: { name: "lookup", arguments: JSON.stringify({ q: "weather" }) },
          },
        ],
      },
      {
        usage: { prompt_tokens: 12, completion_tokens: 4 },
        choices: [{ finish_reason: "tool_calls" }],
      },
    ]);

    // Text still deduped despite the tool-call/usage/finish chunks around it.
    expect(textDeltas(parts)).toEqual(["Sure"]);

    const toolInputStart = parts.find((p) => p.type === "tool-input-start");
    expect(toolInputStart).toMatchObject({ type: "tool-input-start", toolName: "lookup" });

    const toolInputDelta = parts.find((p) => p.type === "tool-input-delta");
    expect(toolInputDelta).toMatchObject({
      type: "tool-input-delta",
      delta: JSON.stringify({ q: "weather" }),
    });

    const toolCall = parts.find((p) => p.type === "tool-call");
    expect(toolCall).toMatchObject({
      type: "tool-call",
      toolName: "lookup",
      input: JSON.stringify({ q: "weather" }),
    });

    const finish = parts.find((p) => p.type === "finish");
    expect(finish).toMatchObject({
      type: "finish",
      finishReason: { unified: "tool-calls", raw: "tool_calls" },
      usage: {
        outputTokens: { total: 4 },
        inputTokens: { total: 12 },
      },
    });
  });
});
