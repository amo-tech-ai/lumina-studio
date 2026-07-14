# IPI-TBD · CF-101 — AI Gateway configuration (services/cloudflare-worker + app/src/lib/ai routing)

> **IPI-TBD**: no real Linear ticket exists yet. Assign an actual IPI number before implementation starts — do not invent one.

## Purpose

iPix hand-rolls the job Cloudflare's managed AI Gateway already does for free. Stop building more custom routing/fallback code and adopt the native `AI` binding + AI Gateway Universal endpoint instead.

## Current state

`services/cloudflare-worker` (wrangler name `"ai-gateway"`) is a custom Worker, **1,392 LOC of non-test TypeScript** (verified: `find services/cloudflare-worker/src -name "*.ts" -not -name "*.test.ts" | xargs wc -l`), that reimplements what the managed product provides:

- `model-registry.ts` — hand-rolled model registry
- `providers/{gemini,workers-ai,bedrock}.ts` — three hand-written provider adapters
- `router.ts` + `providers/retry-classifier.ts` — custom fallback/retry classifier, just extended by IPI-526 (merged 2026-07-12) to add AWS Bedrock fallback
- `gateway-errors.ts` — custom error envelope
- `embed-validation.ts` — manual embedding-input validation
- `console.log`-based observability (no dashboard, no `cf-aig-step` tracing)

Confirmed live (this audit, 2026-07-13):
- No `"ai"` binding in either `wrangler.jsonc` (`app/` or `services/cloudflare-worker/`) — `grep -n '"ai"'` on both files returns nothing.
- `AI_GATEWAY_URL` appears nowhere in production code (`app/src/lib/ai/`, `services/cloudflare-worker/src/`) — every hit is in `tasks/cloudflare/**` planning/notes docs, none in shipped code.
- `services/cloudflare-worker/src/providers/workers-ai.ts:21` hard-checks the base URL contains `api.cloudflare.com/client/v4` — the raw REST API, not `gateway.ai.cloudflare.com` (the managed gateway host).
- No `workers-ai-provider` package in any `package.json` in the repo.

Two **untracked** planning docs already reach this same conclusion independently:
- `tasks/cloudflare/pr/ARCHITECTURE-REDESIGN.md` — 16 components marked `REMOVE`, 5 marked `REPLACE` with a managed-product equivalent, including `AI_GATEWAY_URL` itself (row 18: "Binding replaces URL").
- `tasks/cloudflare/Tasks/053-CF-MIGRATION-cleanup-custom-code.md` — a ready-to-run cleanup task.
- `tasks/cloudflare/ai-provider-decision.md` (tracked, 2026-07-07) already states the original rationale for choosing Cloudflare: *"AI Gateway provides caching, rate limiting, logging, fallback out of the box"* — the shipped code never wired into it.

Work is trending the wrong way: IPI-526 (merged the day before this audit) added *more* custom logic into exactly the file (`router.ts`) the untracked redesign doc flags for deletion.

## Recommended setup method

**Prebuilt module** (Cloudflare-managed, not custom code): native `AI` binding + `workers-ai-provider` package + AI Gateway Universal endpoint for multi-provider fallback, configured in the dashboard. This is Cloudflare's documented recommended path — confirmed live via WebFetch of both source pages below.

## Official links

- Native Workers AI binding usage (`env.AI.run(model, input)`, `"ai": { "binding": "AI" }`): https://developers.cloudflare.com/workers-ai/configuration/bindings/ (fetched live)
- AI Gateway Universal endpoint automatic fallback across a provider array, tracked via `cf-aig-step` response header, plus dashboard-configured retry/caching/rate limiting/spend limits: https://developers.cloudflare.com/ai-gateway/configuration/fallbacks/ (fetched live)
- `workers-ai-provider` package: **TBD** — not independently verified live in this pass; confirm the npm package name/version before implementation.
- Internal migration plan (untracked, repo): `tasks/cloudflare/pr/ARCHITECTURE-REDESIGN.md`
- Internal cleanup task (untracked, repo): `tasks/cloudflare/Tasks/053-CF-MIGRATION-cleanup-custom-code.md`
- Original architecture decision (tracked, repo): `tasks/cloudflare/ai-provider-decision.md`

## Exact commands

```bash
# 1. Add the AI binding (edit wrangler.jsonc directly — see Files changed)

# 2. Install the AI-SDK-compatible provider package
cd app && npm install workers-ai-provider

# 3. Local dev — binding is available automatically via wrangler/OpenNext dev
npm run dev   # port 3002 per project convention

# 4. Verify the binding resolves in a local Worker script (no live gateway calls yet)
npx wrangler types   # regenerate types so `env.AI` is typed
```

Universal endpoint / fallback array config is dashboard-only (see below) — no CLI step for the fallback chain itself.

## Dashboard steps

1. Cloudflare dashboard → **AI** → **AI Gateway** → create (or select) the gateway that currently backs `ai-gateway` worker traffic.
2. **Gateway → Settings** → note the Universal endpoint URL (`https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}`).
3. **Gateway → Settings → Fallbacks** → configure the provider array (Workers AI → Gemini → Bedrock, matching current `router.ts` priority) so retries/fallback happen server-side, not in application code.
4. **Gateway → Settings → Caching / Rate Limiting / Spend Limits** → set the equivalents of what `gateway-errors.ts` / manual retry logic currently do by hand.
5. **Workers & Pages → ai-gateway (or successor worker) → Settings → Bindings** → confirm the `AI` binding shows up once `wrangler.jsonc` is deployed.

## Files changed

- `services/cloudflare-worker/wrangler.jsonc` — add `"ai": { "binding": "AI" }`
- `app/wrangler.jsonc` — add `"ai": { "binding": "AI" }` if `app/` also needs direct Workers AI access
- `app/src/lib/ai/provider.ts`, `provider-adapter.ts` — route through `workers-ai-provider` / Universal endpoint instead of the current `resolveModel()` → custom adapter path
- `services/cloudflare-worker/src/providers/workers-ai.ts` — remove raw `api.cloudflare.com/client/v4` base URL check; point at the managed gateway or delete if the binding replaces this file entirely
- `services/cloudflare-worker/src/router.ts`, `providers/retry-classifier.ts` — candidates for deletion once fallback moves to the AI Gateway dashboard config (per `ARCHITECTURE-REDESIGN.md` REMOVE list)
- `services/cloudflare-worker/src/model-registry.ts`, `gateway-errors.ts` — candidates for deletion (same list)
- `app/package.json` (or `services/cloudflare-worker/package.json`) — add `workers-ai-provider`
- `tasks/cloudflare/pr/ARCHITECTURE-REDESIGN.md`, `tasks/cloudflare/Tasks/053-CF-MIGRATION-cleanup-custom-code.md` — commit these (currently untracked) as the source-of-truth migration plan before deleting anything

## Dependencies

- A real Linear IPI number must be assigned first (see header) — this doc is the pre-ticket spec, not the ticket itself.
- Decision on migration timeline/scope: full `services/cloudflare-worker` deletion (per `ARCHITECTURE-REDESIGN.md` Phase 0-3) vs. incremental binding-first adoption. This doc only covers the first step (binding + gateway config); do not bundle the full deletion into the same PR (one concern per PR, per `CLAUDE.md`).
- Freeze further custom routing/provider additions to `services/cloudflare-worker/src/router.ts` until this decision is made — no more IPI-526-style additions to code slated for deletion.

## Tests / validation

- `npx wrangler types` succeeds and `env.AI` appears in generated Worker types.
- Manual: call `env.AI.run()` against a known model from a local `wrangler dev` session and confirm a real response (not a mock).
- Manual: trigger a provider failure (e.g. invalid model ID) and confirm the `cf-aig-step` header appears in the response when routed through the Universal endpoint, proving the managed fallback fired instead of the custom retry-classifier.
- `npm run typecheck` and `npm test` (per repo pre-push hook) still pass after the binding/package changes.

## Acceptance criteria

- [ ] `"ai": { "binding": "AI" }` present in `wrangler.jsonc` for the affected worker(s) — proof: diff of `wrangler.jsonc`.
- [ ] `workers-ai-provider` installed and imported in at least one live code path — proof: `package.json` diff + import in `provider.ts`/`provider-adapter.ts`.
- [ ] At least one real inference call in production traffic goes through `env.AI.run()` or the Universal endpoint, not the raw `api.cloudflare.com/client/v4` REST path — proof: updated `workers-ai.ts` (or its removal) + a captured `cf-aig-step` response header from a live/preview request.
- [ ] `tasks/cloudflare/pr/ARCHITECTURE-REDESIGN.md` and `tasks/cloudflare/Tasks/053-CF-MIGRATION-cleanup-custom-code.md` committed to the repo (docs-only commit, separate from this code change) — proof: `git log` shows the commit.
- [ ] No new custom routing/fallback/retry code added to `services/cloudflare-worker/src/router.ts` after this ticket lands unless explicitly justified against the migration plan — proof: PR review note.

## Rollback

- Revert the `wrangler.jsonc` binding + `workers-ai-provider` import commit; the existing `services/cloudflare-worker` custom router/provider code is untouched by this ticket (deletion is explicitly out of scope — see Dependencies) and continues to serve traffic as a fallback path.
- No data migration involved — this is routing/config only, safe to revert via standard `git revert`.

## Evidence required

Paste into the PR/ticket before marking done:
1. `wrangler.jsonc` diff showing the `ai` binding.
2. `npx wrangler types` output confirming `env.AI` is typed.
3. A captured response header (`cf-aig-step`) or dashboard screenshot proving a request routed through the Universal endpoint.
4. `npm run typecheck` and `npm test` passing output.
5. Confirmation the two untracked planning docs were committed (separate docs-only commit hash).
