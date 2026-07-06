import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

import { resolveStructuredProviderFromEnv } from "./structured.ts";

Deno.test("resolveStructuredProviderFromEnv routes bi scope to Groq", () => {
  assertEquals(
    resolveStructuredProviderFromEnv({
      scope: "bi",
      aiProvider: "groq",
      biUseGemini: "0",
    }),
    "groq",
  );
});

Deno.test("resolveStructuredProviderFromEnv honors BI_USE_GEMINI on bi scope", () => {
  assertEquals(
    resolveStructuredProviderFromEnv({
      scope: "bi",
      aiProvider: "groq",
      biUseGemini: "1",
    }),
    "gemini",
  );
  assertEquals(
    resolveStructuredProviderFromEnv({
      scope: "bi",
      aiProvider: "groq",
      biUseGemini: "true",
    }),
    "gemini",
  );
  assertEquals(
    resolveStructuredProviderFromEnv({
      scope: "bi",
      aiProvider: "groq",
      biUseGemini: "yes",
    }),
    "gemini",
  );
});

Deno.test("resolveStructuredProviderFromEnv defaults dna scope to gemini", () => {
  assertEquals(
    resolveStructuredProviderFromEnv({
      scope: "dna",
      aiProvider: "groq",
    }),
    "gemini",
  );
});

Deno.test("resolveStructuredProviderFromEnv allows groq dna when DNA_USE_GEMINI=0", () => {
  assertEquals(
    resolveStructuredProviderFromEnv({
      scope: "dna",
      aiProvider: "groq",
      dnaUseGemini: "0",
    }),
    "groq",
  );
});

Deno.test("resolveStructuredProviderFromEnv honors DNA_USE_GEMINI truthy overrides", () => {
  assertEquals(
    resolveStructuredProviderFromEnv({
      scope: "dna",
      aiProvider: "groq",
      dnaUseGemini: "1",
    }),
    "gemini",
  );
  assertEquals(
    resolveStructuredProviderFromEnv({
      scope: "dna",
      aiProvider: "groq",
      dnaUseGemini: "true",
    }),
    "gemini",
  );
  assertEquals(
    resolveStructuredProviderFromEnv({
      scope: "dna",
      aiProvider: "groq",
      dnaUseGemini: "yes",
    }),
    "gemini",
  );
});

Deno.test("resolveStructuredProviderFromEnv default scope follows AI_PROVIDER", () => {
  assertEquals(
    resolveStructuredProviderFromEnv({ aiProvider: "groq" }),
    "groq",
  );
  assertEquals(
    resolveStructuredProviderFromEnv({ aiProvider: "gemini" }),
    "gemini",
  );
});

Deno.test("resolveStructuredProviderFromEnv rejects openai on default scope", () => {
  assertThrows(
    () => resolveStructuredProviderFromEnv({ aiProvider: "openai" }),
    Error,
    "openai",
  );
});
