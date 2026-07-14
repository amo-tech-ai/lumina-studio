# IPI-592 · CF-MIG-820 — Delete Custom Gateway Worker

> **🛑 DO NOT EXECUTE YET — Phase 9 of 9.** Per `000-Architecture-Decision.md`, this is the *last* step of the migration, only after native-gateway traffic works, staging succeeds, production rollout succeeds, fallback succeeds, and rollback has actually been tested — not right after the 4 "core setup" tasks below. `services/cloudflare-worker/` is still the live production AI path today (confirmed on disk, unchanged, 98/98 tests passing as of 2026-07-14) — running this now would take down production AI traffic.
>
> **Task ID corrected 2026-07-14 (Linear sync):** was `CF-MIG-220`, which collided with the pre-existing `CF-MIG-220 · Preview Smoke Testing & Validation` milestone already tracked in IPI-487's progress table (a different, earlier-phase item). Now `CF-MIG-820` — after `CF-MIG-810` cutover, since this is explicitly the last step.

**Linear:** [IPI-592 · CF-MIG-820 — Delete custom AI Gateway Worker (Phase 9 of 9, production-gated)](https://linear.app/amo100/issue/IPI-592)  
**Task ID:** CF-MIG-820  
**Phase:** 9 of 9 — Cleanup (not Phase 3 — corrected per `000-Architecture-Decision.md`)  
**Difficulty:** Easy  
**Risk:** Medium  
**Estimated time:** 2 hours  
**Dependencies:** `001-CF-GW-create-gateway.md` (CF-GW-001), `002-CF-GW-configure-routing.md` (CF-GW-002), `003-CF-AI-add-workers-ai-binding.md` (CF-AI-020), `004-CF-AI-setup-models.md` (CF-AI-021) — all four must be verified working in production, not just staging, before this task starts

---

## Purpose

Delete the custom gateway Worker at `services/cloudflare-worker/` and all related custom provider code in the application. This is the cleanup task that removes 2,300 lines of code that duplicated Cloudflare's managed products.

### Real-world iPix example

After this task, the iPix repository has no custom AI routing code, no custom model registries, no custom retry logic, and no custom error handling. When a user asks any agent a question, the request flows through the Workers AI binding and the AI Gateway — both managed by Cloudflare. If something breaks, the team no longer debugs custom gateway code; they check the AI Gateway dashboard or the Workers observability logs.

---

## Recommended Setup Method

**CLI — delete files and remove dependencies.**

This task removes code. There is no dashboard or template option. The priority is to verify the new path works — `001`, `002`, `003`, `004` all proven **in production**, not just staging — before deleting the old one. See the Phase 9 gate banner above.

---

## Official Links

| Resource | Link |
|----------|------|
| Workers AI bindings (replaces custom gateway) | https://developers.cloudflare.com/workers-ai/configuration/bindings/ |
| AI Gateway overview (replaces custom router) | https://developers.cloudflare.com/ai-gateway/ |
| workers-ai-provider (replaces custom adapter) | https://www.npmjs.com/package/workers-ai-provider |

---

## Commands

### Step 1: Verify the new path works

Before deleting anything, confirm that at least one agent works through the new Workers AI binding path.

Command: `npm run preview`

Test that the marketing agent responds. If it does, proceed.

### Step 2: Delete the custom gateway Worker directory

Command: `git rm -r services/cloudflare-worker/`

This removes the entire custom gateway Worker, including:
- The main entry point (index.ts)
- The router (router.ts)
- The model registry (model-registry.ts)
- The error handler (gateway-errors.ts)
- The embedding validator (embed-validation.ts)
- All provider implementations (gemini.ts, workers-ai.ts, bedrock.ts)
- The retry classifier (retry-classifier.ts)
- All tests

Total: approximately 1,392 lines of non-test code removed.

### Step 3: Delete the application-side custom provider files

Delete the files that duplicated the gateway's responsibilities:

Command: `git rm app/src/lib/ai/provider-adapter.ts`

Command: `git rm app/src/lib/ai/gemini-registry.ts`

Command: `git rm app/src/lib/ai/groq-models.ssot.json`

Command: `git rm app/src/lib/ai/groq-models-path.ts`

Command: `git rm app/src/lib/ai/model-registry.ts`

### Step 4: Remove unused npm packages

Remove the packages that are no longer needed:

Command: `cd app && npm uninstall @ai-sdk/google @ai-sdk/groq @ai-sdk/openai-compatible`

These packages were used by the custom provider code. The new path uses only `workers-ai-provider`.

### Step 5: Clean up environment variables

Remove the environment variables that are no longer needed from Infisical and from the `.env.example` file:

Remove: `GEMINI_API_KEY`, `GROQ_API_KEY`, `AI_GATEWAY_URL`, `AI_ROUTING_MODE`, `AI_GATEWAY_API_KEY`, `AI_GATEWAY_REQUEST_ID`, `AI_GATEWAY_ALLOW_TOOL_TIERS`, all `GROQ_MODEL_*` variables, `MODEL_REGISTRY_OVERRIDE`.

Keep: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `SUPABASE_*`, `DATABASE_URL`.

### Step 6: Verify the build

Command: `npx tsc --noEmit && npm run lint && npm test && npm run build`

All must pass. If any test references the deleted files, update or remove those tests.

### Step 7: Verify no references remain

Search the codebase for any remaining references to the deleted code:

Command: `grep -r "provider-adapter\|gemini-registry\|cloudflare-worker\|groq-models" app/ src/`

This should return no results (except possibly in documentation files that should be updated).

---

## Dashboard Steps

### Step 1: Delete the deployed custom gateway Worker (optional)

If the custom gateway Worker is still deployed at `ai-gateway.sk-498.workers.dev`, it can be deleted from the dashboard:

1. Navigate to Workers and Pages in the dashboard
2. Select the `ai-gateway` Worker
3. Go to Settings
4. Scroll to the bottom and click Delete

This is optional — the Worker can remain deployed but unused. However, deleting it avoids confusion and any ongoing request routing to the old code.

### Step 2: Remove unused secrets

In the dashboard, remove any secrets that were only used by the custom gateway:

1. Navigate to the ipix-operator Worker
2. Go to Settings, then Variables and Secrets
3. Remove: `GEMINI_API_KEY`, `GROQ_API_KEY` (if present)
4. Keep: `CLOUDFLARE_API_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`

---

## Files Changed

### Files deleted

| File | Lines |
|------|------:|
| services/cloudflare-worker/src/index.ts | 22 |
| services/cloudflare-worker/src/router.ts | 400 |
| services/cloudflare-worker/src/model-registry.ts | 95 |
| services/cloudflare-worker/src/gateway-errors.ts | 107 |
| services/cloudflare-worker/src/embed-validation.ts | 103 |
| services/cloudflare-worker/src/providers/provider.ts | 71 |
| services/cloudflare-worker/src/providers/workers-ai.ts | 113 |
| services/cloudflare-worker/src/providers/gemini.ts | 203 |
| services/cloudflare-worker/src/providers/bedrock.ts | 166 |
| services/cloudflare-worker/src/providers/retry-classifier.ts | 112 |
| services/cloudflare-worker/ (all other files) | ~200 |
| app/src/lib/ai/provider-adapter.ts | 455 |
| app/src/lib/ai/gemini-registry.ts | 29 |
| app/src/lib/ai/groq-models.ssot.json | 124 |
| app/src/lib/ai/groq-models-path.ts | 23 |
| app/src/lib/ai/model-registry.ts | 103 |
| **Total deleted** | **~2,300** |

### Files updated

| File | Change |
|------|--------|
| app/src/lib/ai/provider.ts | Already simplified in Task CF-AI-021 |
| app/src/lib/ai/types.ts | Remove unused types (Gemini, Groq) |
| app/package.json | Remove unused dependencies |
| .env.example | Remove unused variables |

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Workers AI binding works (`003-CF-AI-add-workers-ai-binding.md`, `004-CF-AI-setup-models.md`) | Must be verified **in production** | Cannot delete old code until new path is proven, not just staged |
| AI Gateway created and configured (`001-CF-GW-create-gateway.md`, `002-CF-GW-configure-routing.md`) | Required | Gateway replaces the custom router and retry logic |
| Full production rollout stable, fallback tested, rollback tested | Must be verified | Per `000-Architecture-Decision.md` Phase 9 gate — not satisfied by staging success alone |
| At least one agent works through the new path | Must be verified | Proves the new path before deleting the old one |

---

## Tests

### Test 1: Build passes after deletion

Command: `npm run build`

Pass criteria: Build completes successfully with no missing-import errors.

### Test 2: All tests pass

Command: `npm test`

Pass criteria: All tests pass. Tests that referenced deleted files have been updated or removed.

### Test 3: No dangling references

Command: `grep -r "provider-adapter\|gemini-registry\|cloudflare-worker\|groq-models\|retry-classifier\|gateway-errors" app/ src/ --include="*.ts" --include="*.tsx"`

Pass criteria: No results (or only results in documentation).

### Test 4: Application still serves

Command: `npm run preview`

Pass criteria: The application loads, routes work, and the marketing agent responds.

### Test 5: Deploy succeeds

Command: `npm run deploy`

Pass criteria: The Worker deploys without errors.

---

## Acceptance Criteria

- [ ] The `services/cloudflare-worker/` directory no longer exists
- [ ] The `app/src/lib/ai/provider-adapter.ts` file no longer exists
- [ ] The `app/src/lib/ai/gemini-registry.ts` file no longer exists
- [ ] The `app/src/lib/ai/groq-models.*` files no longer exist
- [ ] The `app/src/lib/ai/model-registry.ts` file no longer exists
- [ ] The `@ai-sdk/google`, `@ai-sdk/groq`, and `@ai-sdk/openai-compatible` packages are uninstalled
- [ ] Unused environment variables are removed
- [ ] `npm run build` passes
- [ ] `npm test` passes
- [ ] `npm run preview` serves the application
- [ ] No grep results for deleted file names in TypeScript files

---

## Rollback

If something breaks after deletion:

1. `git revert HEAD` — reverts the deletion commit
2. Reinstall the old packages: `cd app && npm install @ai-sdk/google @ai-sdk/groq @ai-sdk/openai-compatible`
3. Restore the old environment variables in Infisical
4. Redeploy: `npm run deploy`

The git history contains the deleted code. It can always be restored.

**Important:** Before reverting, investigate what actually broke. It is likely a missed reference that is easy to fix without reverting the entire deletion.

---

## Evidence Required

1. Output of `git diff --stat` showing the lines deleted
2. Output of `npm run build` passing
3. Output of `npm test` passing
4. Output of `npm run preview` serving successfully
5. Screenshot of the deployed application working
6. Output of the grep command showing no dangling references

---

## What Custom Code This Removes

This task removes all of it. The entire custom gateway stack is deleted:

- The custom gateway Worker (1,392 lines)
- The custom provider adapter (455 lines)
- The custom model registries (256 lines across 4 files)
- The custom Gemini and Groq integrations (included above)
- The custom retry classifier (112 lines)
- The custom error handling (107 lines)

Total: approximately 2,300 lines removed. This is the single largest code reduction in the migration.

---

## User Journey After This Task

> A new developer joins the iPix team and asks "where is the AI gateway code?" The answer is: there is none. The AI gateway is a managed Cloudflare product configured in the dashboard. The developer only needs to understand the 30-line provider.ts file and the Mastra agents. Onboarding is faster. Debugging is simpler. When something goes wrong, the team checks the AI Gateway dashboard, not a custom router. The codebase is smaller, the build is faster, and the test suite is smaller. The team ships features instead of maintaining infrastructure.
