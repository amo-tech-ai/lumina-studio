# IPI-TBD · CF-100 — Workers AI model selection (chat/tool/embedding/vision/fallback) — services/cloudflare-worker

> **No Linear ticket exists yet.** Assign a real IPI number before implementation starts — do not invent one. File under the `services/cloudflare-worker` component once assigned.

## Purpose

Merge an already-built, better tool-calling model tier into the live model registry, and document (not reverse) why the worker intentionally bypasses Cloudflare's native `ai` binding in favor of a REST call.

## Current state

`services/cloudflare-worker/src/model-registry.ts` hand-rolls a tiered, multi-provider model registry (`default`, `fast`, `structured`, `vision`, `embedding`, `default-fallback`), overridable via a `MODEL_REGISTRY_OVERRIDE` env JSON. Verified live tiers on `ipi/525-model-registry`:

| Tier | Provider | Model |
|---|---|---|
| default / fast | workers-ai | `@cf/meta/llama-4-scout-17b-16e-instruct` |
| structured | gemini | `gemini-3.1-pro-preview` |
| vision | gemini | `gemini-3.5-flash` |
| embedding | workers-ai | `@cf/baai/bge-base-en-v1.5` |
| default-fallback | bedrock | `openai.gpt-oss-120b` |

No dedicated `tool-calling` tier exists on this branch — `default`/`fast` both reuse the general-purpose Llama model. No deprecated model ID is present (confirmed on disk; `llama-4-scout-17b-16e-instruct` is still active). This narrows a broader finding from `tasks/cloudflare/pr/MODEL-AUDIT-OFFICIAL-DOCS-2026-07-12.md`, which flagged a deprecated `@cf/meta/llama-3.1-8b-instruct` — that ID is **not** present in the current `model-registry.ts`; it referred to PR #340's proposed diff, a different code path, so it does not apply to the live state.

All three providers are called through one uniform HTTP interface (`services/cloudflare-worker/src/providers/workers-ai.ts`) hitting the OpenAI-compatible REST endpoint `/accounts/{accountId}/ai/v1/chat|embeddings`, authenticated with `CLOUDFLARE_ACCOUNT_ID` + an API-token Bearer header — confirmed on disk (`getWorkersAiBaseUrl` builds `${base}/accounts/${accountId}/ai/v1`). `wrangler.jsonc` has no active `ai` binding block; the only related content is a commented-out `kv_namespaces` block for a *different* purpose (`AI_MODEL_REGISTRY`), not the native Workers AI binding.

A dedicated tool-calling tier already exists, unmerged, on sibling branch `ipi/342-tool-routing-fix`, commit `75e2371d` (`feat(IPI-525): Add GLM-4.7-Flash tool model and registry validation`) — confirmed present via `git log --all`. It adds `@cf/zai-org/glm-4.7-flash` (131k context, explicit function-calling support), a `buildEffectiveRegistry()` validator replacing `registryOverride()`, and a P0 fix preventing tool-calling from silently falling back to Gemini. This work has not landed on the current branch (`ipi/525-model-registry`) despite the branch name suggesting registry work is in progress here.

## Recommended setup method

**Custom (required)** — no official prebuilt module exists for tiered multi-provider model routing with fallback; this orchestration is inherently custom app code per Cloudflare's own docs. Two concrete moves, not a rebuild:

1. Keep the REST/OpenAI-compatible approach — it is the documented alternative when a uniform HTTP interface across multiple AI providers (workers-ai, gemini, bedrock) is needed: https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/
2. Cherry-pick commit `75e2371d` from `ipi/342-tool-routing-fix` into this branch rather than re-deriving the tool-calling tier.

The native `ai` binding (https://developers.cloudflare.com/workers-ai/configuration/bindings/) remains the simplest *single-provider* path (`"ai": { "binding": "AI" }` + `env.AI.run(...)`) but is deliberately not used here because it doesn't extend to Gemini/Bedrock — add a code comment recording that tradeoff so a future reviewer doesn't "fix" it back to the binding.

## Official links

- Native `ai` binding config: https://developers.cloudflare.com/workers-ai/configuration/bindings/
- OpenAI-compatible endpoint (the path iPix actually uses): https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/
- `llama-4-scout-17b-16e-instruct` model page (confirms current/active status): https://developers.cloudflare.com/workers-ai/models/llama-4-scout-17b-16e-instruct/
- Repo-internal prior audit: `tasks/cloudflare/pr/MODEL-AUDIT-OFFICIAL-DOCS-2026-07-12.md` (2026-07-12)
- `@cf/zai-org/glm-4.7-flash` capability/pricing claims in commit `75e2371d`: TBD — verify against Cloudflare's live model catalog before merge (not independently re-checked as part of this doc; the commit message cites Cloudflare docs but the URL wasn't captured in the commit).

## Exact commands

```bash
# from a fresh worktree off origin/main (or rebased ipi/525-model-registry)
git fetch origin ipi/342-tool-routing-fix
git cherry-pick 75e2371d

# resolve conflicts in model-registry.ts if the branch has since diverged,
# then re-run the registry validation tests before committing
npm --prefix services/cloudflare-worker run typecheck
npm --prefix services/cloudflare-worker test
```

## Dashboard steps

Not applicable — this is a code-only change (registry tier definitions ship in the worker bundle). `MODEL_REGISTRY_OVERRIDE` remains dashboard-settable per the existing `keep_vars: true` convention in `wrangler.jsonc`, unchanged by this task.

## Files changed

- `services/cloudflare-worker/src/model-registry.ts` — add `tool-calling` tier (`@cf/zai-org/glm-4.7-flash`), replace `registryOverride()` with `buildEffectiveRegistry()`, export `DEFAULT_REGISTRY`
- `services/cloudflare-worker/src/providers/workers-ai.ts` (or wherever `selectProvider()` lives after the cherry-pick) — route tool-calling requests to the new tier instead of falling back to Gemini
- `services/cloudflare-worker/wrangler.jsonc` — add one comment line documenting why the native `ai` binding is intentionally unused (no functional change)
- New or updated test file covering `buildEffectiveRegistry()` validation (carried over from commit `75e2371d`)

## Dependencies

- Must land after: nothing blocking — `ipi/342-tool-routing-fix` is an independent, already-complete commit; this is a merge/cherry-pick, not new development.
- Should NOT block on: assignment of a real IPI number for the `ai`-binding-comment part; that can ship as a trivial follow-up if the tool-tier merge is more urgent.

## Tests / validation

```bash
npm --prefix services/cloudflare-worker run typecheck
npm --prefix services/cloudflare-worker test
```

Manual check: send a tool-calling request through the worker and confirm (via logs/observability, `wrangler.jsonc` already has `observability.enabled: true`) that it resolves to `@cf/zai-org/glm-4.7-flash`, not a silent fallback to `gemini-3.1-pro-preview`.

## Acceptance criteria

- [ ] `model-registry.ts` has a `tool-calling` tier resolving to `@cf/zai-org/glm-4.7-flash` — proof: `grep -n "tool-calling" services/cloudflare-worker/src/model-registry.ts` returns a match
- [ ] Tool-calling requests no longer fall back to Gemini when a tool-capable model is available — proof: unit test from commit `75e2371d` passes (`buildEffectiveRegistry` validation test)
- [ ] `wrangler.jsonc` carries a comment explaining the deliberate non-use of the native `ai` binding — proof: `grep -n "ai binding" services/cloudflare-worker/wrangler.jsonc` returns a match
- [ ] No deprecated `@cf/...` model IDs present — proof: CI grep guard (see Recommendation below) passes, or manual `grep -n "@cf/" services/cloudflare-worker/src/model-registry.ts` reviewed against Cloudflare's current model catalog
- [ ] `npm --prefix services/cloudflare-worker run typecheck` and `test` both pass

## Rollback

Revert the cherry-pick commit (`git revert <new-sha>`); the `tool-calling` tier and `buildEffectiveRegistry()` change are additive and isolated to `model-registry.ts` plus the provider-selection call site, so reverting restores the current `default`/`fast`-only behavior with no other side effects. The `wrangler.jsonc` comment is a no-op revert (comment-only).

## Evidence required

- Diff of `model-registry.ts` showing the new `tool-calling` tier
- Test run output for `npm --prefix services/cloudflare-worker test` (green)
- One captured worker log line showing a tool-calling request resolved to `glm-4.7-flash`
- Confirmation (screenshot or `curl` against Cloudflare's model catalog API) that `@cf/zai-org/glm-4.7-flash` capability/pricing claims from commit `75e2371d` are still accurate at merge time — flagged as unverified (TBD) in this doc's Official Links section

## Recommendation (highest-leverage next move)

Merge commit `75e2371d` from `ipi/342-tool-routing-fix` into `ipi/525-model-registry` — wiring an already-built, disconnected piece beats re-deriving it. Secondary, lower-effort: add a CI grep guard for known-deprecated `@cf/...` model IDs in `model-registry.ts` to prevent regressions like the one already caught in the PR #340 audit.

**Confidence: medium** — the registry-merge finding is fully verified on disk; the GLM-4.7-flash capability/pricing details are only verified as "present in the commit message," not independently re-confirmed against Cloudflare's live model catalog.
