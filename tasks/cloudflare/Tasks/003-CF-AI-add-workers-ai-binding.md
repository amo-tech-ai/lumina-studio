# IPI-XXX · CF-AI-020 — Add Workers AI Binding

**Linear:** [IPI-586 · CF-AI-003 — Wire one Workers AI call through ipix-prod gateway](https://linear.app/amo100/issue/IPI-586) (covers this step plus the model-resolver work in `004`)  
**Task ID:** CF-AI-020  
**Phase:** 1 — Core setup  
**Difficulty:** Easy  
**Risk:** Low  
**Estimated time:** 15 minutes  
**Dependencies:** None

---

## Purpose

The Workers AI binding lets the iPix Next.js Worker call AI models directly, with no API keys and no custom gateway. This is the foundational step that everything else builds on.

### Real-world iPix example

Today, when a user asks the Brand Intelligence agent to "analyze the brand DNA of a fashion retailer," the request goes through a custom gateway Worker that has bugs. After this task, the same request goes directly from the Next.js Worker to Workers AI — no middleman, no custom code, no 502 errors.

---

## Recommended Setup Method

**CLI — add one line to existing Wrangler configuration.**

This is the officially supported method for adding Workers AI to an existing Worker. No migration tool needed because we already have a wrangler.jsonc.

**Priority order confirmation:** This is option 2 (simple CLI command) in the priority list. Dashboard setup is not available for bindings. No prebuilt module or template applies.

---

## Official Links

| Resource | Link |
|----------|------|
| Workers AI binding config | https://developers.cloudflare.com/workers-ai/configuration/bindings/ |
| Get started with Wrangler | https://developers.cloudflare.com/workers-ai/get-started/workers-wrangler/ |
| Wrangler configuration | https://developers.cloudflare.com/workers/wrangler/configuration/ |

---

## Commands

### Step 1: Create a new branch

Create a branch so changes are isolated.

Command: `git checkout -b ipi/cf-ai-020-add-ai-binding`

### Step 2: Regenerate types after adding the binding

After editing the wrangler.jsonc (see Files Changed below), regenerate the TypeScript types so the AI binding appears in the environment interface.

Command: `npx wrangler types`

### Step 3: Preview locally

Run the preview server to verify the binding works in the Workers runtime.

Command: `npm run preview`

---

## Dashboard Steps

None required. The AI binding is configured in the wrangler.jsonc file, not in the dashboard. The binding is automatically available when the Worker deploys.

---

## Files Changed

### File 1: app/wrangler.jsonc

Add this block inside the main JSON object (verified against the current `app/wrangler.jsonc`, which has no `ai` key yet):

```jsonc
{
  "ai": { "binding": "AI", "remote": true }
}
```

That's the complete binding — no `gateway` sub-key here (see `001-CF-GW-create-gateway.md`, corrected: the gateway ID is passed per-call in application code, not in this file). `remote: true` is required, not optional: Workers AI has no local simulation, so it always calls the real backend, but Cloudflare issues a warning if `remote` is omitted and an error if it's set to `false` (verified against `developers.cloudflare.com/workers/local-development/` and two current official Cloudflare repos, `cloudflare/agents-starter` and `cloudflare/vinext-agents-example`). The binding name `AI` is what appears in Worker code as `env.AI`. This is the convention used in all Cloudflare documentation. Workers AI allows exactly one `ai` binding per Worker.

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Existing wrangler.jsonc | Already present | Verified by repository |
| Wrangler CLI | Already installed (v4.86.0) | Above the 4.68.0 minimum |
| OpenNext adapter | Already configured | Verified by repository |

---

## Tests

### Test 1: Type generation succeeds

After running `npx wrangler types`, the generated type file should include the AI binding.

Pass criteria: The CloudflareEnv interface includes `AI: Ai`.

### Test 2: Local preview starts

After running `npm run preview`, the Worker starts without errors.

Pass criteria: The preview URL loads and returns a response.

### Test 3: Binding is available at runtime

In the application code, reference `env.AI` and verify it is not undefined.

Pass criteria: The application logs confirm the AI binding is present.

### Test 4: A real protected call succeeds (added 2026-07-14, audit finding)

`env.AI !== undefined` only proves the binding exists, not that it works. Make one real, authenticated `env.AI.run()` call (via the isolated smoke route in IPI-586) and confirm a real model response comes back.

Pass criteria: The call returns an actual model response, not just a truthy binding reference.

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

- [ ] The wrangler.jsonc file contains the AI binding configuration
- [ ] `npx wrangler types` generates the AI binding type
- [ ] `npm run preview` starts successfully
- [ ] The AI binding is accessible in application code
- [ ] No existing functionality breaks
- [ ] The branch is pushed and a pull request is opened

---

## Rollback

To roll back this change:

1. Delete the AI binding block from wrangler.jsonc
2. Run `npx wrangler types` to regenerate types without the binding
3. Commit the revert

The change is purely additive — removing it restores the previous state exactly.

---

## Evidence Required

1. Screenshot or copy of the wrangler.jsonc with the AI binding added
2. Output of `npx wrangler types` showing the AI type generated
3. Output of `npm run preview` showing successful startup
4. Link to the pull request

---

## What Custom Code This Removes

None yet. This task is additive. The custom gateway code is removed in `053-CF-MIGRATION-cleanup-custom-code.md` (IPI-592 · CF-MIG-820, Phase 9 of 9) after the new path is verified working — not "Task 5 (CF-MIG-220)," which was this task's superseded name/ordering.

---

## User Journey After This Task

> A developer opens a terminal, adds one line to the wrangler configuration, runs the type generator, and starts the preview server. The Workers AI binding is now available. The marketing agent can be wired to call it directly. No API key was needed. No gateway was configured. The foundation is laid for the rest of the migration.
