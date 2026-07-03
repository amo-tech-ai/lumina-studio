---
name: gemini
description: >
  Use when integrating Gemini AI models in Supabase Edge Functions or Deno — Gemini 3.1
  flash-lite, thinking levels, URL Context, Google Search grounding, structured output,
  function calling, image generation via generateContent. Use for AI enrichment, DNA scoring,
  product linking, and analysis tasks. Do NOT use for CopilotKit/Mastra client-side AI
  (use mastra/copilotkit), OpenAI/Anthropic direct integration, or Interactions API through MVP.
---

# Gemini AI Integration (iPix)

Build AI features using Gemini via **`generateContent()`** only — **never** `generateImages()`.

**Strategy (target):** [`docs/gemeni/gemeni-plan.md`](../../../docs/gemeni/gemeni-plan.md)  
**Runtime:** Supabase Edge Functions (Deno) · `@google/genai` · `GEMINI_API_KEY` server-only.

---

## As-built (2026-06-30 · `origin/main`)

| Layer | Default model | Registry |
|--|-------------------|---------------------------|
| Operator app (`app/`) | `gemini-3.1-flash-lite` | `app/src/mastra/models.ts` |
| Edge functions | `gemini-3.1-flash-lite` | `supabase/functions/_shared/gemini.ts` |

**Decision:** `gemini-3.1-flash-lite` is the approved default everywhere. Override via `GEMINI_MODEL` env (allowlist: `gemini-3.5-flash`, `gemini-3.1-pro-preview`).

---

## Quick Reference — Models

| Model | Use Case | Status |
|-------|----------|--------|
| **`gemini-3.1-flash-lite`** | **Approved default** — operator app + edge fns | Shipped |
| `gemini-3.5-flash` | Override via `GEMINI_MODEL` | Allowlist |
| `gemini-3.1-pro-preview` | Hard reasoning override | Allowed via `GEMINI_MODEL` |
| `gemini-3.1-flash-lite-preview` | Log summaries | Planned |
| Image models | Phase 2 (AI-016) | Planned |

## Shared client

`supabase/functions/_shared/gemini.ts` — `resolveGeminiModel()`, default `gemini-3.5-flash`.  
Target (AI-009): add `generateStructured()` wrapper.

**Today:** use pattern from `supabase/functions/brand-intelligence/index.ts` + `_shared/agent-log.ts`.

---

## Thinking Levels (Gemini 3.5+)

Use `thinkingConfig.thinkingLevel` — **not** legacy `thinkingBudget`.

| Level | Use Case |
|-------|----------|
| `minimal` | Trivial extraction (Flash) |
| `low` | Simple instruction following |
| **`medium`** | **Default on 3.5 Flash** |
| `high` | Brand scoring, DNA disputes, multi-tool synthesis |

```typescript
const response = await ai.models.generateContent({
  model: "gemini-3.5-flash",
  contents: prompt,
  config: {
    thinkingConfig: { thinkingLevel: "high" },
  },
});
```

**Temperature:** Keep **default 1.0** on Gemini 3 family. Lower only if structured extraction requires it and you accept 3.5 guidance.

---

## Built-in Tools

### URL Context

```typescript
config: { tools: [{ urlContext: {} }] }
// URLs in prompt text — max 20/request, 34MB/URL
const metadata = response.candidates?.[0]?.urlContextMetadata;
```

### Google Search

```typescript
config: { tools: [{ googleSearch: {} }] }
const gm = response.candidates?.[0]?.groundingMetadata;
// Persist webSearchQueries + groundingChunks in ai_agent_logs (AI-017)
```

### Brand Intelligence — two-pass pattern (do NOT combine urlContext + JSON)

Pass 1 — grounding only (no `responseMimeType: application/json`):

```typescript
config: { tools: [{ urlContext: {} }, { googleSearch: {} }] }
// Persist groundingMetadata + urlContextMetadata → ai_agent_logs (IPI-172)
```

Pass 2 — structured JSON only (no urlContext in same call):

```typescript
config: {
  responseMimeType: "application/json",
  responseSchema: brandProfileSchema,
  thinkingConfig: { thinkingLevel: "low" },
}
```

---

## Structured Output

**Deno Edge Functions — use Type enums + `responseSchema`:**

```typescript
import { GoogleGenAI, Type } from "npm:@google/genai@^0.21.0";

const schema = {
  type: Type.OBJECT,
  properties: {
    company_name: { type: Type.STRING },
    industry: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["company_name"],
};

config: {
  responseMimeType: "application/json",
  responseSchema: schema,
}
```

Parse: `JSON.parse(response.text || "{}")` + validate required fields.

---

## Function Calling (Product Linking — AI-011)

```typescript
config: {
  tools: [{ functionDeclarations: [searchMercurProducts, linkAssetToProduct] }],
}

// Execute calls server-side; return functionResponse with matching id + name (3.5 strict)
// Append full candidate content to preserve thought signatures
```

---

## Multimodal / Asset DNA (AI-010)

Pass Cloudinary delivery URL in prompt (optimized `w_2048,f_auto`) or `inlineData` for small tests:

```typescript
contents: [
  { text: "Score this asset against brand DNA rubric: ..." },
  { text: `Image URL: ${secureUrl}` },
],
config: {
  tools: [{ urlContext: {} }], // optional for brand guidelines URL
  responseMimeType: "application/json",
  responseSchema: assetDnaSchema,
}
```

---

## Image Generation (Phase 2 — AI-016)

```typescript
const response = await ai.models.generateContent({
  model: "gemini-3.1-flash-image-preview",
  contents: prompt,
  config: {
    responseModalities: ["IMAGE"],
    imageConfig: { aspectRatio: "16:9" },
  },
});

for (const part of response.candidates?.[0]?.content?.parts ?? []) {
  if (part.inlineData?.mimeType?.startsWith("image/")) {
    const base64 = part.inlineData.data;
  }
}
```

---

## Thought Signatures

Required for function calling + image edit chains. SDKs preserve signatures when you append full `response.candidates[0].content` to history.

Migration workaround: `"thoughtSignature": "context_engineering_is_the_way_to_go"`

---

## iPix agent map

| Agent | Edge function | Linear |
|-------|---------------|--------|
| Brand Intelligence | **`brand-intelligence`** | AI-001, AI-017 |
| Asset DNA | `audit-asset-dna` ✅ | AI-010, CLD-006 |
| Product Linking | `match-product-links` (planned) | AI-011 |
| SDK foundation | `_shared/gemini.ts` ✅ | AI-009, IPI-47 |
| Model registry | `models.ts` + `_shared/gemini.ts` ✅ | AI-018, IPI-107 |

---

## Checklist

- [ ] `npm:@google/genai@^0.21.0` in edge functions
- [ ] `GEMINI_API_KEY` via `Deno.env.get()` only
- [ ] Default model is **`gemini-3.1-flash-lite`** (via `_shared/gemini.ts` or `app/src/mastra/models.ts`)
- [ ] No Interactions API through MVP — use `generateContent` / `generateObject` only
- [ ] Brand Intelligence uses **two-pass** pattern (grounding pass → JSON pass)
- [ ] `generateContent()` — never `generateImages()`
- [ ] `responseSchema` + Type enums for JSON
- [ ] URL Context + verify `urlRetrievalStatus`
- [ ] Log every call via AI-004
- [ ] No Gemini keys in Vite client (`npm run check:env`)
- [ ] Run AI-018 registry check before ship

---

## References

- [references/gemini-3.md](references/gemini-3.md)
- [references/thinking.md](references/thinking.md)
- [references/url-context.md](references/url-context.md)
- [references/google-search.md](references/google-search.md)
- [references/structured-output.md](references/structured-output.md)
- [references/function-calling.md](references/function-calling.md)
- [references/tool-combination.md](references/tool-combination.md)
- [references/live-api.md](references/live-api.md) — Phase 3
