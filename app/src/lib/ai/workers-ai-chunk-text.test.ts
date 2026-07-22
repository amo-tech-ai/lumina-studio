import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  pickWorkersAiChunkText,
  reconstructWorkersAiStreamText,
  type WorkersAiStreamChunk,
} from "./workers-ai-chunk-text";

describe("IPI-771 workers-ai dual-format chunk text", () => {
  it("prefers native response when both fields are set (Gateway dual format)", () => {
    expect(
      pickWorkersAiChunkText({
        response: "We",
        choices: [{ delta: { content: "We" } }],
      }),
    ).toBe("We");
  });

  it("uses OpenAI delta when native response is empty", () => {
    expect(
      pickWorkersAiChunkText({
        response: "",
        choices: [{ delta: { content: " offer" } }],
      }),
    ).toBe(" offer");
  });

  it("uses native response when OpenAI delta is absent", () => {
    expect(pickWorkersAiChunkText({ response: "hi" })).toBe("hi");
  });

  it("reconstructs dual-format stream without doubled tokens", () => {
    const chunks: WorkersAiStreamChunk[] = [
      { response: "", choices: [{ delta: { content: "" } }] },
      { response: "We", choices: [{ delta: { content: "We" } }] },
      { response: " offer", choices: [{ delta: { content: " offer" } }] },
      { response: " a", choices: [{ delta: { content: " a" } }] },
    ];
    const text = reconstructWorkersAiStreamText(chunks);
    expect(text).toBe("We offer a");
    expect(text).not.toContain("WeWe");
    const words = text.split(/\s+/).filter(Boolean);
    const consecutiveDup = words.some((w, i) => i > 0 && w === words[i - 1]);
    expect(consecutiveDup).toBe(false);
  });

  it("vendor patch is applied to workers-ai-provider dist (mutual exclusion)", () => {
    const require = createRequire(import.meta.url);
    const pkgJson = require.resolve("workers-ai-provider/package.json");
    const dist = join(dirname(pkgJson), "dist", "index.mjs");
    const src = readFileSync(dist, "utf8");
    expect(src).toContain("emittedNativeText");
    expect(src).toContain("!emittedNativeText");
  });
});
