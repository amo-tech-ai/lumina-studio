import { afterEach, describe, expect, it } from "vitest";
import { GEMINI_MODELS, resolveGeminiModel } from "./models";

const ORIGINAL = process.env.GEMINI_MODEL;
afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.GEMINI_MODEL;
  else process.env.GEMINI_MODEL = ORIGINAL;
});

describe("gemini model registry (IPI2-80)", () => {
  it("default is a stable GA id, never a preview", () => {
    expect(GEMINI_MODELS.default).toBe("gemini-3.5-flash");
    expect(GEMINI_MODELS.default).not.toMatch(/preview|exp|latest/i);
  });

  it("resolves to the default when env is undefined", () => {
    delete process.env.GEMINI_MODEL;
    expect(resolveGeminiModel()).toBe(GEMINI_MODELS.default);
  });

  it("resolves to the default when env is empty string", () => {
    process.env.GEMINI_MODEL = "";
    expect(resolveGeminiModel()).toBe(GEMINI_MODELS.default);
  });

  it("resolves to the default when env is whitespace", () => {
    process.env.GEMINI_MODEL = "  ";
    expect(resolveGeminiModel()).toBe(GEMINI_MODELS.default);
  });

  it("honors a known GEMINI_MODEL override", () => {
    process.env.GEMINI_MODEL = "gemini-3.5-flash";
    expect(resolveGeminiModel()).toBe("gemini-3.5-flash");
  });

  it("throws on an unknown GEMINI_MODEL (typo guard)", () => {
    process.env.GEMINI_MODEL = "gemini-9-imaginary";
    expect(() => resolveGeminiModel()).toThrow(/not in the registry/);
  });
});
