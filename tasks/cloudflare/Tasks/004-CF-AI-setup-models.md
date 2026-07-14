# IPI-586 · CF-AI-021 — Install Workers AI Provider

**Linear:** [IPI-586 · CF-AI-003 — Wire one Workers AI call through ipix-prod gateway](https://linear.app/amo100/issue/IPI-586)  
**Task ID:** CF-AI-021  
**Phase:** 1 — Core setup  
**Difficulty:** Easy  
**Risk:** Low  
**Estimated time:** 1 hour  
**Dependencies:** Task CF-AI-020 (AI binding must be added first)

---

## Purpose

Install the official Cloudflare Workers AI provider package and create a simple model resolver function that Mastra agents will call. This replaces 700 lines of custom provider code with 30 lines.

### Real-world iPix example

When the Production Planner agent needs to "schedule a shoot for the summer collection," it calls `resolveModel("default")` to get a language model. Today, that function routes through a custom adapter with 455 lines of HTTP client code. After this task, it calls the official `workers-ai-provider` package — one function call, maintained by Cloudflare engineers.

---

## Recommended Setup Method

**CLI — npm install the official package.**

The `workers-ai-provider` package is officially maintained by Cloudflare. It is compatible with AI SDK v6, which Mastra uses. This is the only package needed for model inference.

**Priority order confirmation:** This is option 3 (official prebuilt module) in the priority list. No dashboard or template applies.

---

## Official Links

| Resource | Link |
|----------|------|
| workers-ai-provider on npm | https://www.npmjs.com/package/workers-ai-provider |
| AI SDK integration guide | https://developers.cloudflare.com/workers-ai/configuration/ai-sdk/ |
| Agents using AI models | https://developers.cloudflare.com/agents/runtime/operations/using-ai-models/ |
| Cloudflare AI GitHub | https://github.com/cloudflare/ai |

---

## Commands

### Step 1: Install the package

Command: `cd app && npm install workers-ai-provider`

This adds the official Cloudflare Workers AI provider to the project. It is the package that creates the bridge between Mastra's AI SDK calls and the Workers AI binding.

### Step 2: Create the new provider file

Create or replace `app/src/lib/ai/provider.ts` with a simplified version.

### Step 3: Verify it resolves a model

Command: `npx tsc --noEmit`

This type-checks the new code to confirm it compiles correctly.

---

## Dashboard Steps

None required.

---

## Files Changed

### File 1: app/package.json

The `workers-ai-provider` dependency is added automatically by npm install.

### File 2: app/src/lib/ai/provider.ts (replaces existing 234-line version)

The new file contains approximately 30 lines. It defines four model IDs as constants (fast, default, structured, embedding), a type for the model tier, and a single function called `resolveModel` that takes a tier and the environment, and returns a language model from the Workers AI provider.

**Critical: `resolveModel` must route through `ipix-prod`, not call Workers AI directly.** Verified against the current `workers-ai-provider` README (`github.com/cloudflare/ai/packages/workers-ai-provider`): the gateway ID is configured once, at `createWorkersAI()` construction time, via a `gateway: { id }` option — this is a different call shape than the raw `env.AI.run()` binding's per-call gateway option used in `001`/`003`. Without this, every model call from this file bypasses `ipix-prod` entirely, silently defeating `001`/`002`'s caching, rate limiting, spend limits, and analytics.

```ts
import { createWorkersAI } from "workers-ai-provider";

const MODEL_IDS = {
  fast: "@cf/zai-org/glm-4.7-flash",
  default: "@cf/meta/llama-4-scout-17b-16e-instruct",
  structured: "@cf/google/gemma-4-26b-a4b-it",
  embedding: "@cf/baai/bge-base-en-v1.5",
} as const;

type ModelTier = keyof typeof MODEL_IDS;

export function resolveModel(tier: ModelTier, env: { AI: Ai }) {
  const workersai = createWorkersAI({
    binding: env.AI,
    gateway: { id: "ipix-prod" }, // <- every call from this provider instance routes through the gateway
  });
  return workersai(MODEL_IDS[tier]);
}
```

The four models are:

| Tier | Model ID | Used for |
|------|----------|----------|
| fast | @cf/zai-org/glm-4.7-flash | Marketing chat, quick responses |
| default | @cf/meta/llama-4-scout-17b-16e-instruct | General agent tasks, function calling |
| structured | @cf/google/gemma-4-26b-a4b-it | Brand DNA analysis, structured output |
| embedding | @cf/baai/bge-base-en-v1.5 | Asset DNA scoring, semantic search |

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Workers AI binding (Task CF-AI-020) | Must be complete | The binding is what the provider calls |
| Mastra framework | Already installed | Uses AI SDK v6 which is compatible |
| AI SDK (ai package) | Already installed | Mastra depends on it |

---

## Tests

### Test 1: Package installed

Verify the package is in package.json.

Command: `npm ls workers-ai-provider`

Pass criteria: The package version is listed.

### Test 2: Type check passes

Command: `npx tsc --noEmit`

Pass criteria: No type errors.

### Test 3: Model resolution works

Write a simple test that calls `resolveModel("fast", mockEnv)` and verifies it returns a language model object.

Pass criteria: The function returns without throwing.

### Test 4: Marketing agent responds locally

Start the preview server and ask the marketing agent a question.

Pass criteria: The agent returns a streamed response from a Workers AI model.

---

## Acceptance Criteria

- [ ] `workers-ai-provider` is in package.json
- [ ] The new provider.ts is approximately 30 lines (down from 234)
- [ ] `resolveModel()` constructs `createWorkersAI()` with `gateway: { id: "ipix-prod" }` — not a bare `{ binding: env.AI }`
- [ ] A test call made through `resolveModel()` shows up in `ipix-prod`'s Gateway Logs (not just a successful Workers AI response — the whole point is that it's gated through the gateway)
- [ ] `npx tsc --noEmit` passes
- [ ] The marketing agent returns a response locally
- [ ] No existing tests break
- [ ] The pull request is ready for review

---

## Rollback

1. Revert the provider.ts file to its previous version
2. Run `npm uninstall workers-ai-provider`
3. Commit the revert

The old custom provider code still exists in git history and can be restored.

---

## Evidence Required

1. Output of `npm ls workers-ai-provider` showing the installed version
2. Output of `npx tsc --noEmit` showing no errors
3. Screenshot of the marketing agent responding locally
4. Diff showing the provider.ts file shrank from 234 to approximately 30 lines
5. Screenshot or API response showing the test call in `ipix-prod`'s Gateway Logs (proves `gateway: { id: "ipix-prod" }` actually routed the request — not just that Workers AI responded)

---

## What Custom Code This Removes

This task prepares for the removal of:

- `app/src/lib/ai/provider-adapter.ts` (455 lines) — removed in Task 5
- `app/src/lib/ai/gemini-registry.ts` (29 lines) — removed in Task 5
- `app/src/lib/ai/groq-models.ssot.json` (124 lines) — removed in Task 5
- `app/src/lib/ai/groq-models-path.ts` (23 lines) — removed in Task 5
- `app/src/lib/ai/model-registry.ts` (103 lines) — removed in Task 5

The old provider.ts (234 lines) is replaced in this task.

---

## User Journey After This Task

> A user opens the iPix marketing page and types "What services do you offer?" The marketing agent calls resolveModel with the fast tier. The function returns a Workers AI model. The model generates a response about iPix's content planning and commerce platform. The response streams into the chat sidebar. No custom gateway code ran. No API key was transmitted. The entire round trip took under two seconds.
