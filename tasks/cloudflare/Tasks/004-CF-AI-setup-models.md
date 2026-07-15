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

Install the official Cloudflare Workers AI provider package and create a simple model resolver function that Mastra agents will call.

**Corrected 2026-07-14 (audit finding):** "replaces 700 lines with 30" is not proven by this task alone and shouldn't be stated as settled fact — the actual line-count reduction depends on how much of the existing `provider.ts` (single-arg `resolveModel(tier)`, ~230 lines, still serving production via the custom gateway) ends up deleted vs. kept as a fallback. "Maintained by Cloudflare engineers" is replaced below with a sourced claim.

### Real-world iPix example

When the Production Planner agent needs to "schedule a shoot for the summer collection," it calls `resolveModel("default")` to get a language model. Today, that function routes through a custom adapter with HTTP client code pointed at the custom gateway Worker. After this task, a **new, separate** resolver calls the official `workers-ai-provider` package — recommended in Cloudflare's official Workers AI integration documentation (`developers.cloudflare.com/workers-ai/configuration/ai-sdk/`).

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

### File 2: a new resolver, additive not a replacement (corrected 2026-07-14, audit finding)

**Do not replace the existing `app/src/lib/ai/provider.ts` in this task.** That file's `resolveModel(tier)` (single-arg) is what the custom gateway path — still the live production AI route — depends on today. Replacing it immediately removes the rollback path before the new gateway is proven. Correct order:

1. Install `workers-ai-provider`.
2. Add a **new**, separate resolver function alongside the existing one.
3. Wire only the isolated `IPI-586` smoke-test route to the new resolver (see that issue for the exact route spec).
4. Test chat, tools, structured output, and streaming on the new path.
5. Only after IPI-586 and the agent migration (`054`/IPI-594) are both proven does the old `provider.ts` get deleted — that's Task `053`/IPI-592, explicitly gated, not this task.

**Critical: `resolveModel` must route through `ipix-prod`, not call Workers AI directly.** Verified against the current `workers-ai-provider` README (`github.com/cloudflare/ai/packages/workers-ai-provider`): the gateway ID is configured once, at `createWorkersAI()` construction time, via a `gateway: { id }` option.

```ts
import { createWorkersAI } from "workers-ai-provider";

const MODEL_IDS = {
  fast: "@cf/zai-org/glm-4.7-flash",
  default: "@cf/meta/llama-4-scout-17b-16e-instruct",
  structured: "@cf/google/gemma-4-26b-a4b-it",
  embedding: "@cf/baai/bge-base-en-v1.5",
} as const;

type ModelTier = keyof typeof MODEL_IDS;

export function resolveWorkersAiModel(tier: ModelTier, env: { AI: Ai }) {
  const workersai = createWorkersAI({
    binding: env.AI,
    gateway: { id: "ipix-prod" }, // <- every call from this provider instance routes through the gateway
  });
  return workersai(MODEL_IDS[tier]);
}
```

**⚠️ Breaking-change warning:** this function's `env` parameter is not available at module top level in the Workers/Next.js runtime — only inside a request handler. Do not assign `const MODEL = resolveWorkersAiModel(tier, env)` as a module-level constant; see `054-CF-MIGRATION-wire-mastra-agents.md`'s "Step 0" for the correct per-request pattern (Mastra's dynamic `model: ({ requestContext }) => ...` resolution).

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

## Managed-First Verification & Definition of Done

*(Added 2026-07-14, per `tasks/cloudflare/Tasks/notes/04-improvements.md` — fill in at execution time, not in advance. A dashboard toggle alone does not satisfy "done.")*

| Verification gate | Result |
|---|---|
| Cloudflare dashboard feature available? | — |
| Wrangler command available? | — |
| Cloudflare API available? | — |
| Official package/module available? | — |
| Official GitHub repository checked? | — |
| Official example checked? | — |
| Official tutorial/recipe checked? | — |
| Existing iPix code already implements it? | — |
| Configuration-only solution possible? | — |
| Minimum integration code required | — |
| Custom implementation necessary? | — |
| Why custom code is unavoidable | — |
| Rollback method | — |
| Production evidence | — |

**Definition of done:** Configured + integrated + tested + observed in logs + failure tested + rollback tested + documented = complete.

---

## Acceptance Criteria

- [ ] `workers-ai-provider` is in package.json
- [ ] A new resolver function exists alongside (not replacing) the existing `provider.ts`
- [ ] `resolveWorkersAiModel()` constructs `createWorkersAI()` with `gateway: { id: "ipix-prod" }` — not a bare `{ binding: env.AI }`
- [ ] The new resolver is only called from the isolated IPI-586 smoke-test route — no production call site changed
- [ ] `npx tsc --noEmit` passes
- [ ] A test call shows up in `ipix-prod`'s Gateway Logs (not just a successful Workers AI response)
- [ ] Negative test: unknown tier fails closed, not silently
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

---

## What Custom Code This Removes

**Nothing, in this task** (corrected 2026-07-14). This task is purely additive — see "Files Changed" above. The custom `provider-adapter.ts`, `gemini-registry.ts`, `groq-models.ssot.json`, `groq-models-path.ts`, `model-registry.ts`, and the old `provider.ts` are only removed in `053-CF-MIGRATION-cleanup-custom-code.md` (Linear: IPI-592 · CF-MIG-820), explicitly gated on the new path being proven in production first.

---

## User Journey After This Task

> A user opens the iPix marketing page and types "What services do you offer?" The marketing agent calls resolveModel with the fast tier. The function returns a Workers AI model. The model generates a response about iPix's content planning and commerce platform. The response streams into the chat sidebar. No custom gateway code ran. No API key was transmitted. The entire round trip took under two seconds.
