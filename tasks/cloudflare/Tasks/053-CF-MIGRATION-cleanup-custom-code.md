# IPI-592 · CF-MIG-820 — Delete Custom Gateway Worker

> **🛑 DO NOT EXECUTE YET — Phase 9 of 9, final production-gated cleanup.** `services/cloudflare-worker/` is still the live production AI path today. Running this before the required gates below are met would take down production AI traffic.

**Naming corrected 2026-07-14 (audit finding, confirmed still wrong on this branch until now):** was `CF-MIG-220`, which collides with the existing `CF-MIG-220 · Preview Smoke Testing` milestone already tracked in IPI-487. Was also mislabeled "Phase 3 — Cleanup"; it is Phase 9 of 9, the *last* step, not an early one.

**Linear:** [IPI-592 · CF-MIG-820 — Delete custom AI Gateway Worker (Phase 9 of 9, production-gated)](https://linear.app/amo100/issue/IPI-592)  
**Task ID:** CF-MIG-820  
**Phase:** 9 of 9 — Final production-gated cleanup  
**Difficulty:** Easy  
**Risk:** Medium  
**Estimated time:** 2 hours for the code deletion itself — the gates before it take far longer
**Dependencies:** IPI-586 (native call proven), IPI-591 (multi-turn tool calling proven), IPI-594 (all agents migrated) — **all in production, not staging**, plus the full entry gate below

---

## Purpose

Delete the custom gateway Worker at `services/cloudflare-worker/` and all related custom provider code in the application. This is the cleanup task that removes 2,300 lines of code that duplicated Cloudflare's managed products.

### Real-world iPix example

After this task, the iPix repository has no custom AI routing code, no custom model registries, no custom retry logic, and no custom error handling. When a user asks any agent a question, the request flows through the Workers AI binding and the AI Gateway — both managed by Cloudflare. If something breaks, the team no longer debugs custom gateway code; they check the AI Gateway dashboard or the Workers observability logs.

---

## Recommended Setup Method

**CLI — delete files and remove dependencies, across three separate PRs (corrected 2026-07-14, audit finding).**

This task removes code. There is no dashboard or template option.

**⚠️ Entry gate strengthened 2026-07-14 (audit finding) — "one marketing agent works" is not sufficient evidence to delete ~2,300 lines and multiple provider SDKs.** That alone doesn't prove tool calling, multi-turn continuation, structured output, embeddings, streaming, CRM authorization, external-provider fallback, staging deployment, production reliability, rollback, or cost controls. Required before starting this task:

| Gate | Required evidence |
|---|---|
| Native production traffic | 100% for an agreed soak period |
| Legacy Worker requests | Zero for an agreed observation period |
| Agent matrix | All required agents (IPI-594) green |
| Tool calling | IPI-591 green |
| Failover / Dynamic Routing | Verified |
| Rollback | Tested, not just documented |
| Error/latency/cost SLOs | Within target |
| Security | Authorization unchanged, verified |
| Secret inventory | Complete (see Step 5 below) |
| Approval | Named incident/rollback owner signs off |

**Use three separate PRs, not one destructive PR:**

| PR | Scope | Risk |
|---|---|---|
| A | Remove dead routing references and feature flags | Low |
| B | Remove legacy Worker and app provider code | Medium |
| C | Remove dependencies, secrets, and obsolete docs — only after an observation window post-B | Medium |

This keeps each review small, makes a regression traceable to one category of change, and keeps rollback safer than reverting one giant commit.

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

Before deleting anything, confirm every row in the entry-gate table above has evidence attached — a marketing-agent response alone does not satisfy this step and does not authorize proceeding to Step 2.

Command: `npm run preview`

Test that the marketing agent responds, then attach evidence for the *remaining* gates before proceeding: production soak %, zero-legacy-traffic observation window, the full IPI-594 agent matrix (not just marketing), IPI-591 tool-calling proof, tested (not just documented) rollback, SLO dashboards, unchanged-authorization confirmation, the complete secret inventory from Step 5, and the named owner's sign-off. Proceed to Step 2 only once all ten gates have attached evidence — one successful agent response is necessary, not sufficient.

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

**⚠️ Do not uninstall blindly (audit finding, 2026-07-14) — this belongs in PR C, after an observation window, not immediately after Steps 2-3.** `@ai-sdk/google`, `@ai-sdk/groq`, or `@ai-sdk/openai-compatible` may still be imported somewhere outside the deleted gateway code. Verify first:

```bash
rg '@ai-sdk/google|@ai-sdk/groq|@ai-sdk/openai-compatible' app
npm explain @ai-sdk/google
npm explain @ai-sdk/groq
npm explain @ai-sdk/openai-compatible
```

Only remove a dependency when zero required imports remain.

**Known current blocker (verified 2026-07-14):** `app/src/lib/ai/provider.ts` itself still imports `@ai-sdk/groq` (`createGroq`) and `@ai-sdk/openai-compatible` (`createOpenAICompatible`) directly, for `createGroqLanguageModel()` and `createGatewayLanguageModel()`. The `rg` check above will catch this, but don't rely on it silently blocking — the "Files updated" table below assumes provider.ts was "already simplified in Task CF-AI-021" before this step runs. Confirm that simplification actually happened (or that `resolveModel`'s Groq/gateway code paths are gone) before running Step 4; otherwise the uninstall breaks the remaining provider path.

Command: `cd app && npm uninstall @ai-sdk/google @ai-sdk/groq @ai-sdk/openai-compatible`

These packages were used by the custom provider code. The new path uses only `workers-ai-provider`.

### Step 5: Clean up environment variables

**⚠️ Do not delete secrets immediately (audit finding, 2026-07-14) — this makes emergency rollback harder and belongs in PR C, not alongside code deletion.** Correct sequence: mark deprecated → stop new usage → complete the rollback observation window → revoke the provider key → *then* remove the secret. Deleting a secret the moment code is removed leaves no path back if the deletion needs reverting.

Also classify each secret before deciding where it lives — not every secret needs the Worker runtime:

| Secret type | Where it belongs |
|---|---|
| Runtime application secret | Worker runtime |
| Deployment token | CI/Infisical only, not Worker runtime |
| Local developer credential | Infisical developer environment |
| Public configuration | Wrangler vars |
| Retired provider key | Revoke only after the rollback window |

**Note on `CLOUDFLARE_API_TOKEN` specifically:** the app usually does not need a general-purpose Cloudflare API token at runtime to call a Workers AI binding — build/deployment tokens should stay in CI/Infisical, not necessarily the Worker's runtime environment. Verify this rather than assume it belongs in "Keep."

Remove (only after the rollback window, per the sequence above): `GEMINI_API_KEY`, `GROQ_API_KEY`, `AI_GATEWAY_URL`, `AI_ROUTING_MODE`, `AI_GATEWAY_API_KEY`, `AI_GATEWAY_REQUEST_ID`, `AI_GATEWAY_ALLOW_TOOL_TIERS`, all `GROQ_MODEL_*` variables, `MODEL_REGISTRY_OVERRIDE`.

Keep: `CLOUDFLARE_ACCOUNT_ID`, `SUPABASE_*`, `DATABASE_URL`. `CLOUDFLARE_API_TOKEN`: classify per the table above before deciding — don't default to "keep in Worker runtime."

### Step 6: Verify the build

Command: `npx tsc --noEmit && npm run lint && npm test && npm run build`

All must pass. **Corrected 2026-07-14 (audit finding): "update or remove those tests" is too permissive.** Do not simply delete a test because its implementation was removed — replace implementation-specific tests with behavior/contract tests where the underlying behavior (e.g. "an agent call succeeds") still needs coverage on the new path. Only remove a test outright if the behavior it covered is genuinely gone, not just relocated.

### Step 7: Verify no references remain

**Expanded 2026-07-14 (audit finding) — the original grep only checked source filenames, not the broader surface area.** Search more than the codebase:

```bash
rg -i \
'ai-gateway|AI_GATEWAY_|MODEL_REGISTRY_OVERRIDE|provider-adapter|model-registry|retry-classifier|gateway-errors|workers-ai-only|workers\.dev' \
. \
--glob '!node_modules/**' \
--glob '!.git/**'
```

This should return no results (except documentation files being updated in this PR). Also manually check, since grep won't find these: GitHub Actions workflows, Vercel environment variables, Infisical, Linear/docs cross-references, Cloudflare Worker dashboard variables, dashboards/monitors, Sentry configuration, shell/deployment scripts.

---

## Dashboard Steps

### Step 1: Delete the deployed custom gateway Worker (not optional at final completion — corrected 2026-07-14, audit finding)

The public `workers.dev` route was already disabled (see IPI-487 migration gate), but disabling the route is not the same as completing this cleanup task. Task completion requires either:
- the Worker script actually deleted, or
- an explicit retained-for-forensics exception, with a named owner and an expiry date

Leaving the deployed Worker in an ambiguous "disabled but still there, nobody decided" state means this cleanup task isn't actually done.

1. Navigate to Workers and Pages in the dashboard
2. Select the `ai-gateway` Worker
3. Go to Settings
4. Scroll to the bottom and click Delete

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
| app/src/lib/ai/provider.ts | Must be simplified in Task CF-AI-021 before Step 4 runs — as of 2026-07-14 it still imports `@ai-sdk/groq` and `@ai-sdk/openai-compatible` directly; verify those imports are gone, not just assume it |
| app/src/lib/ai/types.ts | Remove unused types (Gemini, Groq) |
| app/package.json | Remove unused dependencies |
| .env.example | Remove unused variables |

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Workers AI binding works (Tasks CF-AI-020, CF-AI-021) | Must be verified | Cannot delete old code until new path is proven |
| AI Gateway created and configured (Tasks CF-GW-001, CF-GW-002) | Recommended | Gateway replaces the custom router and retry logic |
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

**Rewritten 2026-07-14 (audit finding) — the original list was entirely about the deletion mechanics, with none of the production-readiness gates that justify doing the deletion at all:**

- [ ] Native path has served 100% of production traffic for the agreed soak period
- [ ] Zero requests to the legacy Worker observed for the agreed observation period
- [ ] IPI-591 (multi-turn tool calling) passes
- [ ] All migrated-agent tests (IPI-594) pass
- [ ] Rollback was tested before cleanup started, not just documented
- [ ] Repository references audited (the expanded grep in Step 7, plus manual checks)
- [ ] Dashboard, CI, Vercel, and Infisical references audited
- [ ] The `services/cloudflare-worker/` directory no longer exists (PR B)
- [ ] The `app/src/lib/ai/provider-adapter.ts`, `gemini-registry.ts`, `groq-models.*`, `model-registry.ts` files no longer exist (PR B)
- [ ] Deployed legacy Worker deleted, or an explicit retained-for-forensics exception recorded with owner and expiry
- [ ] Behavior/contract tests retained where the old implementation-specific tests were removed
- [ ] The `@ai-sdk/google`, `@ai-sdk/groq`, and `@ai-sdk/openai-compatible` packages are uninstalled **only after the `rg`/`npm explain` audit confirms zero remaining imports** (PR C)
- [ ] Secrets revoked only after the rollback observation window, following the mark-deprecated → stop-new-usage → revoke → remove sequence (PR C)
- [ ] `npm run build`, `npm test`, `npm run preview` all pass
- [ ] Post-cleanup production smoke test passes
- [ ] Documentation and Linear updated to reflect completion

---

## Rollback

**⚠️ Corrected 2026-07-14 (audit finding) — `git revert HEAD` alone is incomplete.** Code revert does not restore: the deleted Worker deployment, removed secrets, revoked provider keys, removed dashboard variables, changed Dynamic Routes, changed production routing, or removed monitoring. A real rollback runbook needs infrastructure restoration, not just a git command:

1. `git revert HEAD` — reverts the deletion commit (code only)
2. Reinstall the old packages: `cd app && npm install @ai-sdk/google @ai-sdk/groq @ai-sdk/openai-compatible`
3. Restore the old environment variables in Infisical **and redeploy secrets to the Worker runtime** — Infisical alone doesn't push them
4. **If the deployed Worker was actually deleted (Dashboard Step 1), redeploy it from source** — this is not automatic from a code revert
5. **If provider keys were revoked, they need reissuing**, not just restoring the old secret reference — a revoked key doesn't come back
6. Redeploy: `npm run deploy`

The git history contains the deleted code and can always be restored *at the code level*. Infrastructure (deployed Workers, revoked keys, dashboard config) needs separate, deliberate restoration.

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
