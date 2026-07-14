# Cloudflare + AI Platform Task Audit

**Date:** 2026-07-10 · **Scope:** IPI-471, IPI-465, IPI-461, IPI-457, IPI-454, IPI-472, IPI-468 (7 issues, `iPix1` team, all under project "AI Platform — LLM Providers", all children of epic IPI-487)

**Method:** Every claim re-verified against `origin/main` (fetched fresh, HEAD `c7622907`) via `git show`/`git log origin/main`, not local worktree state. GitHub PR state checked live via `gh`. Two internal SSOT docs already exist and are current to within a day — `tasks/cloudflare/CLOUDFLARE-EPIC.md` and `tasks/cloudflare/mastra/mastra-audit.md` (both dated 2026-07-09). This audit does not repeat their content; it independently re-verifies their key claims and reports where reality has since diverged, and adds Linear-specific corrections neither doc covers.

**Nothing in this document has been applied to Linear or the codebase.** This is verification and proposal only.

---

## 1. Executive summary

### Executive verdict

| Score | Value | Basis |
|---|---:|---|
| **Overall task accuracy** | **62/100** 🟡 | Most descriptions are honestly hedged ("do not mark Done until…") rather than falsely claiming completion — better hygiene than the broader Linear audit found elsewhere. But IPI-471's own "Proof" line cites a file (`docs/architecture/ai-agent-architecture.md`, 322 lines) that has never existed anywhere — branch, PR, or `main` — and IPI-465/468 carry acceptance criteria written as if a shared registry/security layer will simply appear, without ever being decomposed into a build order that matches what already exists (Mastra tools) versus what doesn't (a Worker-callable tool registry). |
| **Cloudflare readiness** | **50/100** 🟡 | Hosting foundation (`wrangler.jsonc`, `open-next.config.ts`, `cf-typegen`) is real and merged (PR #282). Runtime compatibility (Hono adapter, OAuth allowlist) is not — and unlike the audit's assumption, a fix is already in flight on **open PR #286** (`CF-MIG-210`), which none of the 7 issues cite. |
| **AI platform readiness** | **38/100** 🔴 | Gateway Worker (`services/cloudflare-worker/`) is real, tested (14/14 across 2 files, not the 5 one issue claims), and merged. Zero wiring exists from Mastra's `resolveModel()` to that gateway — confirmed by direct inspection of `provider.ts`, not just Linear's own "AC-F pending" note. |
| **Security readiness** | **15/100** 🔴 | IPI-468 has zero PRs, zero branches, and zero related code anywhere in the repo — no Service Binding to the gateway Worker, no WAF, no rate-limiting code, no route-trust classification. Worse: the one auth mechanism that does exist (`middleware.ts`) defaults to **disabled** and its own comment references a `requireOperator()` function that **does not exist in the codebase** — this is a live gap in production code, not just an unstarted Linear task. |
| **Production readiness** | **27/100** 🔴 | Unchanged from the broader Linear audit's figure — consistent because these 7 issues are foundation/infra work that hasn't shipped a user-facing change either way. |
| **Will this plan succeed?** | **Yes, directionally** — the architecture in `CLOUDFLARE-EPIC.md`/`mastra-audit.md` is sound and matches official Cloudflare/Mastra docs. Every blocker below is "wire it up," not "redesign it." The main risk is Linear/PR hygiene (open PRs not cited, a doc path that never existed) obscuring the true state to anyone who trusts the issue text over the code. |

### Top 5 blockers (ranked)

1. **`AI_GATEWAY_URL` is wired nowhere.** `app/src/lib/ai/provider.ts` calls `@ai-sdk/google` and `@ai-sdk/groq` directly; `services/cloudflare-worker/src/router.ts` has an `AI_GATEWAY_URL` env var that nothing in the app ever sets or calls. This single wire-up (IPI-454 AC-F) unblocks IPI-461's "Mastra wire" line item and IPI-485 (MASTRA-CF-001) simultaneously.
2. **IPI-471's "Proof" line is fabricated-by-move, not just stale.** The architecture doc was written at `docs/architecture/ai-agent-architecture.md` (322 lines, commit `35f9dae0`), then moved to `tasks/cloudflare/cf-000-platform-architecture.md` (169 lines, commit `bf8c9a28`) — same branch, same open PR #271. The 169-line version is **already on `origin/main`**, landed via an unrelated commit (`docs: restore tasks/cloudflare from ai/ipi-471 branch`, merged inside PR #296 on 2026-07-10) — so the docs half of PR #271 is effectively shipped under a different path, while the code half (`model-registry.ts`, `provider-adapter.ts`, `types.ts`) is genuinely still unmerged. No one reading IPI-471 today would find the cited file.
3. **IPI-468 (Security architecture) is not just unstarted, it's silently assumed by production code that doesn't back it up.** `middleware.ts`'s own comment points at a `requireOperator()` function for API-route enforcement; that function doesn't exist anywhere in the repo, and the middleware itself is gated behind `OPERATOR_AUTH_ENABLED`, which defaults to `false`. Zero of the 26 routes under `app/src/app/api/` call `getUser`/`getSession` directly. This is a bigger production-readiness gap than IPI-468's "Todo" status suggests.
4. **`readFileSync(groq-models.json)` in `provider.ts` was actively reinforced, not deprecated, by the most recent commit touching it** (`c5e1d357`, IPI-428, "fail loudly instead of falling back to a fixed-depth guess"). This is unconditionally Workers-incompatible (no sync FS in the Workers runtime) and will hard-break `AI_PROVIDER=groq` the moment this code runs on a Worker — it directly blocks CF-MIG-210, which is open on **PR #286**, uncited by any of these 7 issues.
5. **IPI-465's "shared" tool registry doesn't exist as a shared concept at all.** `app/src/mastra/tools/index.ts` is a clean, Zod-typed, 20-tool Mastra-only registry (genuinely good hygiene). `services/cloudflare-worker/src/` has zero awareness of it — no shared interface, no common package, no cross-import. The issue's own acceptance criterion ("tools are declared once, used everywhere") describes a merge that has no design doc and no PR anywhere.

### Per-task summary

| Dot | Task | Linear status | Verified state | Score |
|:-:|---|---|---|---:|
| 🟡 | **IPI-471** AGENT-001 | In Progress | Architecture content real, already on `main` at a different path than cited; code half of PR #271 (`model-registry.ts` etc.) unmerged | 55 |
| 🔴 | **IPI-465** AGENT-002 | In Progress | Zero shared registry; Mastra-only tool set (good internally) with no cross-surface design or PR | 20 |
| 🟡 | **IPI-461** CF-AI-004 | In Progress | Gateway Worker adapter + tests genuinely on `main`; Mastra wire genuinely pending — description is accurate and self-aware | 65 |
| 🟡 | **IPI-457** CF-AI-005 | In Progress | `model-registry.ts` genuinely absent from `main`, confirmed only in PR #271 (open); description accurate | 60 |
| 🟡 | **IPI-454** CF-AI-001 | In Progress | AC-C genuinely merged (PR #279, 14/14 tests confirmed); AC-F/G/I genuinely open; description accurate | 62 |
| 🔴 | **IPI-472** INFRA-001 | Todo | Zero PRs, zero branches, zero code found anywhere — matches Linear status exactly | 40 (planning-only, not a false claim) |
| 🔴 | **IPI-468** SEC-001 | Todo | Zero PRs, zero code — but production code already assumes controls this issue would define, and they don't exist | 15 |

---

## 2. Task-by-task audit

Legend: 🟢 correct or shipped · 🟡 partial or needs rewriting · ⚪ planned or deferred · 🔴 incorrect, blocked, or falsely marked complete. All "verified" findings checked against `origin/main` HEAD `c7622907` (2026-07-10) and live PR state via `gh`, not local worktree or the issue's own prose.

### IPI-471 · AGENT-001 — AI Agent Architecture

| Dot | Linear status | Verified state | Score |
|:-:|---|---|---:|
| 🟡 | In Progress | Content real, shipped under a different path than cited; code half of its PR unmerged | 55 |

**Exact incorrect claim:** Description's "Proof" line reads `docs/architecture/ai-agent-architecture.md` — 322 lines, 7 agents defined (on PR #271)`.

**Evidence:**
- `git log --all --oneline -- docs/architecture/ai-agent-architecture.md` → two commits, both on branch `ai/ipi-471-agent-001-ai-agent-architecture`: `35f9dae0 feat(ipi-471): AI Agent Architecture — definitions for all 7 agents` (created the file at this path) then `bf8c9a28 fix(ipi-471): move agent architecture doc to tasks/cloudflare/` (moved it).
- The file **does not exist** at the cited path on `main`, on the branch, or in PR #271's diff. It now lives at `tasks/cloudflare/cf-000-platform-architecture.md`, **169 lines**, not 322.
- That 169-line file is **byte-identical between the PR #271 branch and `origin/main`** (`diff` returns empty) — it landed on `main` via a separate, unrelated commit `docs: restore tasks/cloudflare from ai/ipi-471 branch`, merged as part of PR #296 (2026-07-10). So the architecture content is genuinely shipped, just not through this issue's own cited path or PR.
- PR #271 itself is **still open** (`gh pr view 271`), CI green except Codacy, `mergeStateStatus` unresolved. It also carries `app/src/lib/ai/model-registry.ts`, `provider-adapter.ts`, `provider-adapter.test.ts`, `types.ts`, and `supabase/functions/_shared/llm/types.ts` — none of which are on `main` yet.

**Correct status:** Keep In Progress. The 7-agent architecture content is done and already visible on `main` (at `tasks/cloudflare/cf-000-platform-architecture.md`); the code payload of PR #271 (unified provider types, `model-registry.ts`) is not.

**Acceptance-criteria correction:** None of the 7 document sections need rewriting — content matches what's on `main`. Only the "Proof" citation is wrong.

**Dependency correction:** None found beyond what's already noted (`relatedTo: IPI-465`).

**Missing tests / security risk:** N/A — this is a docs deliverable, no runtime impact either way.

### IPI-465 · AGENT-002 — Shared AI Tool Registry

| Dot | Linear status | Verified state | Score |
|:-:|---|---|---:|
| 🔴 | In Progress | No shared registry exists in any form; Mastra-only tool set is solid but isolated | 20 |

**Exact incorrect claim:** None in the text itself (the issue correctly describes a not-yet-built target state) — the risk is that "In Progress" implies active construction of the *shared* part, when what's actually in progress is Mastra-only tooling that doesn't address the cross-surface requirement at all.

**Evidence:**
- `app/src/mastra/tools/index.ts` — 20 exported tools in `agentTools`, header comment: "the single discoverable place **agents** pull tools from." Every sampled tool (`approveShotList.ts`, `booking-tools.ts`, `crm/log-activity.ts`, `social-discovery.ts`) has Zod `inputSchema`/`outputSchema` — genuinely good hygiene on the Mastra side.
- `services/cloudflare-worker/src/` (`index.ts`, `router.ts`, `model-registry.ts`, `providers/*`) has **zero references** to `app/src/mastra/tools` or any tool-definition concept. It is a pure chat/embeddings proxy.
- No `requiresApproval`/`permission`/`classification` field exists on any tool object anywhere in the repo. `useInterrupt` appears once, as a comment, not implemented wiring.
- HITL is 5 separate domain-specific React components (`approval-card.tsx`, `intel-approval-card.tsx`, `BudgetApprovalCard.tsx`, `DeliverableApprovalCard.tsx`, `ShotListApprovalCard.tsx`), not a registry-driven generic gate.
- `ai_agent_logs` table exists (`supabase/migrations/20260614000000_ipix_platform_mvp.sql:70-82`) and is written to from 3 app files + 1 edge helper, but has no `request_id`/`gateway_request_id`/`tool_call` column — any such metadata is stuffed into the `output` jsonb blob, not a first-class column as the issue's "audit logging requirements" AC implies.
- No PR or branch anywhere references IPI-465, `tool-registry`, or `AGENT-002`.

**Correct status:** Keep In Progress, but the description should distinguish "Mastra tool set" (real, good) from "shared registry" (design not started, no PR).

**Acceptance-criteria correction:** "Every tool call is logged to Supabase `ai_agent_logs`" is only true for 3 of the ~10+ tool-adjacent write paths sampled — not tool-call-level, request-scoped logging. None of Mastra's 20 registered tools write to `ai_agent_logs` on invocation.

**Dependency correction:** `relatedTo` (IPI-472, IPI-468) is already correct — no changes needed.

**Security risk:** The "dangerous tools require human approval" AC is enforced only by developer discipline (5 hand-built approval components), not a registry-level gate — a new write tool added today has no structural mechanism forcing HITL review.

### IPI-461 · CF-AI-004 — AI Provider Adapter (sub-task of IPI-454)

| Dot | Linear status | Verified state | Score |
|:-:|---|---|---:|
| 🟡 | In Progress | Gateway Worker + tests on `main`; Mastra wire genuinely pending. Description is accurate and self-aware | 65 |

**Verification:**
- `services/cloudflare-worker/src/providers/` — ✅ exists, `gemini.ts` + `workers-ai.ts`, both imported by `router.ts`, which has `AI_GATEWAY_URL?: string` in its `Env` interface.
- "Unit tests in `services/cloudflare-worker/` (1 file, 5 tests — `src/index.test.ts`)" — **partially stale**: `index.test.ts` alone has 5, but `providers/workers-ai.test.ts` adds 9 more, for **14 total** across 2 files — matching IPI-454's own "14 tests" claim exactly.
- "Mastra `resolveModel()` → gateway" — confirmed still not wired: `provider.ts` has no `AI_GATEWAY_URL`, no `@ai-sdk/openai-compatible` import; `resolveModel()` branches directly to `createGeminiLanguageModel()` (`@ai-sdk/google`) or `createGroqLanguageModel()` (`@ai-sdk/groq`).
- `app/src/lib/ai/provider-adapter.ts` — confirmed "branch only" as the issue states; exists on PR #271's branch, not on `main`.

**Correct status:** Keep In Progress exactly as written — one of the more accurate issues in the set.

**Acceptance-criteria correction:** Update the test-count line from "1 file, 5 tests" to "2 files, 14 tests".

**Dependency / missing tests / security:** No changes; no integration test yet proving marketing-chat hits the gateway on `:8787` preview (already an open checkbox — accurate).

### IPI-457 · CF-AI-005 — Unified AI Provider Types & Registry

| Dot | Linear status | Verified state | Score |
|:-:|---|---|---:|
| 🟡 | In Progress | `model-registry.ts` genuinely absent from `main`; description accurate | 60 |

**Verification:**
- "`app/src/lib/ai/model-registry.ts` | tier registry | 🔴 **missing**" — confirmed: `git log origin/main --oneline -1 -- app/src/lib/ai/model-registry.ts` returns empty. The only `model-registry.ts` in the repo is `services/cloudflare-worker/src/model-registry.ts` — a divergent copy.
- "`app/src/lib/ai/types.ts` | partial (Groq-era)" — confirmed: exists (`079e0385`) but only defines `AiProvider`, `GroqModelTier`, `GroqModelEntry`, `GroqModelsConfig` — no `ModelTier` abstraction covering `default | fast | structured | vision | embedding`.
- "Status: NOT on `main` (branch `ai/ipi-471-agent-001-ai-agent-architecture`)" — confirmed accurate; same open PR #271.

**Correct status:** Keep In Progress exactly as written. AC list already matches the real gap. `blocks: IPI-485` is correct. No secrets found in either registry file.

### IPI-454 · CF-AI-001 — AI Gateway — Cloudflare Provider Routing

| Dot | Linear status | Verified state | Score |
|:-:|---|---|---:|
| 🟡 | In Progress | AC-C genuinely merged and tested; AC-F/G/I genuinely open; description accurate | 62 |

**Verification:**
- "Merged: AC-C Workers AI URL — PR #279 ✅" and "14 tests on main" — **confirmed exactly**: PR #279 merged `2026-07-09T01:23:21Z`; combined test count `index.test.ts` (5) + `workers-ai.test.ts` (9) = **14**.
- "AC-F — Wire Mastra `resolveModel()`" open — confirmed, see IPI-461 evidence above.
- PR #280 cited as an attachment — confirmed **still open**, `mergeStateStatus: UNSTABLE` (Codacy fails only), diff is ~90 files entirely under `.claude/skills/cloudflare/` — accurately described as open, not "Complete."
- Cross-check against PR #286: **CF-MIG-210 is now an open PR** (branch `ipi/cf-mig-210-runtime-compat`, touches `provider.ts`, `groq-models.ssot.json`, CopilotKit runtime routes, `marketing-chat`/`copilotkit` API routes, `auth/callback/route.ts`). This issue's table correctly names CF-MIG-210 as the #1 hosting blocker but predates PR #286 — worth a one-line update.

**Correct status:** Keep In Progress exactly as written. Add a note that PR #286 now exists, since it touches the same `provider.ts` file AC-F depends on — sequencing risk if both land independently.

### IPI-472 · INFRA-001 — Cloudflare Worker Deployment Pipeline

| Dot | Linear status | Verified state | Score |
|:-:|---|---|---:|
| 🔴 | Todo | Zero PRs, zero branches, zero code anywhere — matches Linear status exactly | 40 |

**Verification:** `gh pr list` keyword search (`465`, `468`, `472`, `tool-registry`, `sec-001`, `infra-001`, `deployment-pipeline`) returns **no matches**. No branch `ai/ipi-472*` exists remotely. `.github/workflows/ci.yml` (122 lines, 3 jobs: `app-build`, `booking-gate-check`, `booking-gate`) has **zero** occurrences of `opennext`, `wrangler`, or `cloudflare`. No rollback script exists anywhere. No observability config beyond a single `observability.enabled: true` boolean in `services/cloudflare-worker/wrangler.jsonc`.

**Correct status:** The one issue in the set where "Todo" is unambiguously correct. Score of 40 reflects a thorough, correct spec, not any implementation. Every AC checkbox is genuinely unchecked. No dependency corrections needed.

### IPI-468 · SEC-001 — Cloudflare AI Security Architecture

| Dot | Linear status | Verified state | Score |
|:-:|---|---|---:|
| 🔴 | Todo | Zero PRs, zero code — but production code already assumes controls this issue would define | 15 |

**Verification:**
- No PR, branch, or commit anywhere references IPI-468, `SEC-001`, or a Service Binding/WAF/rate-limit implementation.
- **Route classification does not exist.** Of 26 `route.ts` files under `app/src/app/api/`, **zero** call `getUser`/`auth.getSession`/`getClaims` directly.
- **`middleware.ts` — the one real auth mechanism — is disabled by default.** Gated behind `OPERATOR_AUTH_ENABLED`, which `.env.example` documents as defaulting to `false`. Its own comment references a `requireOperator()` function meant to enforce this "in the API route" — **that function does not exist anywhere in the codebase**. This is a live gap between what the code's own comments assume and what's actually implemented, not a Linear-status problem.
- 8 of 26 API routes use the service-role/admin Supabase client — none covered by any classification today.
- No Service Binding exists from `ipix-operator` to the `ai-gateway` Worker — `app/wrangler.jsonc`'s one `services` entry is a **self**-binding, not a binding to the gateway.
- No WAF config, no rate-limiting code anywhere (`error-envelope.ts` defines a `RATE_LIMITED` *error code* for passing through upstream 429s — not local throttling).
- Secret handling is otherwise clean: no `NEXT_PUBLIC_*` var exposes an AI provider key or service-role key; `redactSensitiveSubstrings()` exists in `supabase/functions/_shared/response.ts` and correctly strips Gemini/OpenAI-style keys — but **only in Edge Functions**, not in `app/src/` or `services/cloudflare-worker/src/`.
- No Sentry/Datadog/OpenTelemetry integration exists anywhere in the repo.

**Correct status:** Keep Todo, but flag as higher-urgency than its #8-of-10 position in `CLOUDFLARE-EPIC.md`'s lean roadmap suggests, given the `requireOperator()` gap is a documentation-vs-reality mismatch in *already-shipped* code.

**Acceptance-criteria correction:** Add an explicit AC item: "Resolve the `middleware.ts` → `requireOperator()` reference — either implement the function or remove the comment referencing it."

**Security risk:** 🔴 **Highest of the 7.** Public-facing API routes currently have no server-side auth enforcement beyond an opt-in, disabled-by-default middleware flag.

---

## 3. Code & runtime findings

### `app/wrangler.jsonc`

Exists (`caffef2b`). Bindings: `assets` (ASSETS), `services` (`WORKER_SELF_REFERENCE` — a **self**-binding, not a binding to `services/cloudflare-worker`), `images` (`IMAGES`). **No KV, R2, Durable Objects, or Queues.**

**Correction to internal docs:** the "KV binding is commented out" claim applies to **`services/cloudflare-worker/wrangler.jsonc`**, not `app/wrangler.jsonc` — `app/wrangler.jsonc` has never had a KV entry, commented or otherwise, in its two-commit history.

### `app/open-next.config.ts`

Exists, same commit. Empty `defineCloudflareConfig({})` call; R2 incremental cache explicitly noted as "optional (CF-MIG P1)" and unimplemented.

### `app/src/lib/ai/provider.ts` — no gateway wiring

- No `AI_GATEWAY_URL`, no `@ai-sdk/openai-compatible` reference anywhere.
- `resolveModel()` branches directly to `createGeminiLanguageModel()` (`@ai-sdk/google`) or `createGroqLanguageModel()` (`@ai-sdk/groq`, `require`'d at line 150).
- **Still uses `node:fs` `readFileSync`/`existsSync`** (line 1) inside `loadGroqModelsConfig()`, walking up to 8 ancestor directories to find `config/groq-models.json` at runtime — unconditionally incompatible with the Workers runtime.
- This path was **actively reinforced, not deprecated**, by the most recent commit touching the file: `c5e1d357 fix(ipi-428): fail loudly instead of falling back to a fixed-depth guess`.

### Model registry split — confirmed exactly as internal docs describe

- `app/src/lib/ai/model-registry.ts` — **does not exist** on `origin/main`.
- `app/src/lib/ai/types.ts` exists but only defines Groq-era types — no `ModelTier` abstraction.
- Full `app/src/lib/ai/` listing on `main`: `gemini-registry.ts`, `provider.test.ts`, `provider.ts`, `types.ts` — 4 files, no registry.
- The only `model-registry.ts` anywhere is `services/cloudflare-worker/src/model-registry.ts` — divergent, never imported by the app.

### `services/cloudflare-worker/` — real and tested, but disconnected

Tree: `AGENTS.md, package.json, package-lock.json, tsconfig.json, vitest.config.mts, worker-configuration.d.ts, wrangler.jsonc`, `src/index.ts, src/index.test.ts, src/model-registry.ts, src/router.ts`, `src/providers/{gemini.ts, provider.ts, workers-ai.ts, workers-ai.test.ts}`.

- `router.ts`'s `Env` interface declares `AI_GATEWAY_URL?: string` — the one place this env var exists in the whole repo; nothing calls into this Worker to use it.
- **Test count:** `index.test.ts` = 5 (health/route guards, no chat/embedding request-path coverage); `workers-ai.test.ts` = 9. **Total: 14 across 2 files** — matches IPI-454's claim, contradicts IPI-461's narrower "1 file, 5 tests."
- `wrangler.jsonc` (worker name `ai-gateway`) has KV genuinely commented out (`AI_MODEL_REGISTRY` binding); only `vars.MODEL_REGISTRY_OVERRIDE` is live; no `services` (Service Binding) entry at all.

### Operator CopilotKit route — confirmed `hono/vercel`

Path: `app/src/app/api/copilotkit/[[...slug]]/route.ts`, line 13: `import { handle } from "hono/vercel";` — not `hono/cloudflare-workers`.

**Already in flight, uncited by any of the 7 audited issues:** open **PR #286** (`[CF-MIG-210] Runtime Compatibility — Hono, OAuth & Groq Bundle`) touches this exact route plus `provider.ts`, `groq-models.ssot.json`, `runtime-v2-fetch.ts`, and `auth/callback/route.ts`.

### OAuth callback allowlist

`app/src/app/auth/callback/route.ts`, `isTrustedForwardedHost()`, line 27: `return host.endsWith(".vercel.app");` — only `.vercel.app` allowlisted; zero `workers.dev` hits elsewhere in `app/src`.

### CI — no OpenNext/Cloudflare build gate

`.github/workflows/ci.yml`: 122 lines, 3 jobs (`app-build`, `booking-gate-check`, `booking-gate`), zero `opennext`/`wrangler`/`cloudflare` occurrences.

*(Separately flagged, outside this audit's scope: CLAUDE.md's own CI description — "supabase-web015" + "app-build" — doesn't match the actual job names on `origin/main`. Docs-only fix, not part of this audit.)*

### `cf-typegen` / typed env

`app/package.json` line 19: `cf-typegen` script exists and runs `wrangler types`. `preview`/`deploy`/`upload` all run `opennextjs-cloudflare build`. `cloudflare-env.d.ts` is git-ignored — expected, not a gap.

### No direct provider-SDK imports in Mastra agents/tools — rule intact

`git grep "@ai-sdk/google\|@ai-sdk/groq" -- app/src/mastra/agents app/src/mastra/tools` returns only test-file mocks. No production file imports either SDK directly — real imports are correctly centralized in `gemini-registry.ts` and `provider.ts`. **No violation found.**

### PR ground truth

| PR | State | Contains | Note |
|---|---|---|---|
| **#271** | Open, CI green except Codacy | `app/src/lib/ai/{model-registry.ts, provider-adapter.ts, provider-adapter.test.ts, provider.ts, types.ts}`, `supabase/functions/_shared/llm/types.ts`, `tasks/cloudflare/cf-000-platform-architecture.md` (169 lines) | Docs half already landed on `main` via a separate commit; code half still open |
| **#279** | Merged `2026-07-09T01:23:21Z` | `services/cloudflare-worker/src/providers/{provider.ts, workers-ai.ts, workers-ai.test.ts}`, `router.ts` | Matches IPI-454 AC-C and IPI-461 citations exactly |
| **#280** | Open, `mergeStateStatus: UNSTABLE` (Codacy only) | ~90 files under `.claude/skills/cloudflare/` | Docs/skill-trim only, correctly described as open |
| **#282** | Merged `2026-07-09T02:40:56Z` | `wrangler.jsonc`, `open-next.config.ts`, `middleware.ts` + tests, `next.config.ts`, `package.json` | CF-MIG-110, matches claim exactly |
| **#286** | Open (not cited by any of the 7 issues) | `provider.ts`, `groq-models.ssot.json`, CopilotKit runtime routes, `marketing-chat`/`copilotkit` API routes, `auth/callback/route.ts` | CF-MIG-210 — directly overlaps IPI-454/457/461/468/472 scope; should be cross-linked |

No PR or branch found anywhere matching IPI-465, IPI-468, or IPI-472 by number, keyword, or branch-name search.

---

## 4. Security & deployment findings (IPI-468, IPI-472)

**Route classification does not exist.** No file classifies API routes as public/authenticated/operator-admin/internal-service/webhook. Zero of 26 `route.ts` files call `getUser`/`auth.getSession`/`getClaims` directly.

**`middleware.ts` — the one real gate, and it's off by default.** Checks JWT-cookie shape only (not signature), gated behind `OPERATOR_AUTH_ENABLED` (defaults `false` per `.env.example`). Its comment references `requireOperator()` — **that function does not exist anywhere in the codebase.** One route (`workflows/brand-intelligence/resume/route.ts`) uses a bespoke `X-Internal-Secret` header outside any documented scheme. 8/26 routes use the service-role/admin client, none covered by any classification.

**Worker-to-Worker auth — no Service Binding exists.** `app/wrangler.jsonc`'s `services` entry is a self-binding, not a binding to `ai-gateway`. `services/cloudflare-worker/wrangler.jsonc` has no `services` key at all.

**WAF / rate limiting — no implementation, only pass-through.** No WAF config. No local throttling logic anywhere — only a `RATE_LIMITED` error *code* relaying upstream 429s.

**Secrets handling — clean.** No `NEXT_PUBLIC_*` var exposes an AI-provider or service-role key; no `"use client"` file references `GEMINI_API_KEY`/`GROQ_API_KEY`/service-role. This part of IPI-468's scope is already satisfied.

**Logging / redaction — partial, edge-functions-only.** `redactSensitiveSubstrings()` in `supabase/functions/_shared/response.ts` strips provider keys from error output, but only in Edge Functions — `app/src/` and `services/cloudflare-worker/src/` have no equivalent. No Sentry/Datadog/OpenTelemetry anywhere in the repo.

**IPI-472 — genuinely zero-code, as Linear states.** No PR/branch/commit anywhere for it. No rollback script. `observability.enabled: true` is a single flag, not a dashboard or runbook. Every AC checkbox is genuinely unbuilt — the one issue of the 7 with zero Linear/reality discrepancy.

**Net assessment:** IPI-468 and IPI-472 are correctly both "Todo," and neither falsely claims progress. The finding worth escalating is a **production-code gap**, not a Linear-hygiene issue: `middleware.ts` references a function that was apparently planned but never written, and the controls IPI-468 would define are silently assumed absent everywhere else. None of this blocks the migration technically (Vercel remains production host until `CF-MIG-810`), but the security architecture task is covering ground that's currently unprotected in a real, running system, not merely "next in the queue."

---

## 5. Final outputs

### 5.1 Correct dependency-safe execution order

```text
1. Merge PR #271 (or split it) — lands app/src/lib/ai/{model-registry.ts, provider-adapter.ts, types.ts}
   → resolves IPI-457, half of IPI-471
2. Merge PR #286 (CF-MIG-210) — Hono adapter, OAuth allowlist, groq bundle fix
   → unblocks IPI-461's "Mastra wire" prerequisite and CF-MIG-220
3. IPI-454 AC-F — wire resolveModel() → AI_GATEWAY_URL (depends on 1)
   → resolves IPI-461's remaining checkbox
4. IPI-472 — deployment pipeline (CI OpenNext build, rollback runbook, observability)
5. IPI-468 — security architecture (route classification, Service Binding, WAF/rate-limit, requireOperator() gap)
6. IPI-465 — shared tool registry design (needs its own scoping pass before "In Progress" is meaningful)
7. IPI-485 (MASTRA-CF-001, downstream of all of the above) — agent-wide gateway cutover
```

Steps 4 and 5 have no code dependency on each other and can run in parallel; both should land before any Cloudflare production DNS cutover (`CF-MIG-810`, unchanged from `CLOUDFLARE-EPIC.md`).

### 5.2 Tasks to close, reopen, rewrite, split, or move

| Issue | Action | Reason |
|---|---|---|
| **IPI-471** | Rewrite "Proof" line | Remove `docs/architecture/ai-agent-architecture.md — 322 lines... (on PR #271)`. Replace with: "Architecture content (7 agents) is on `main` at `tasks/cloudflare/cf-000-platform-architecture.md` (169 lines) via commit `6eb689f9`/PR #296. Remaining PR #271 payload (`model-registry.ts`, `provider-adapter.ts`, `types.ts`) still open — see IPI-457." Status stays In Progress. |
| **IPI-461** | Correct test-count line | "1 file, 5 tests" → "2 files, 14 tests (`index.test.ts` + `providers/workers-ai.test.ts`)". No status change. |
| **IPI-454** | Add cross-link | Add "PR #286 (CF-MIG-210) is now open and touches `provider.ts` — coordinate merge order with AC-F" under the hosting critical-path table. No status change. |
| **IPI-457, IPI-461, IPI-472** | No change | Descriptions already match verified ground truth exactly. |
| **IPI-465** | Rewrite scope note | Add: "No shared-registry design or PR exists yet (2026-07-10 audit). Current `app/src/mastra/tools/index.ts` (20 tools, Zod-typed) is Mastra-only and has zero cross-import with `services/cloudflare-worker/`. Treat as pre-design, not in-progress-toward-shared, until a design doc exists." No status change. |
| **IPI-468** | Add AC item | "Resolve `middleware.ts`'s reference to `requireOperator()` — function does not exist in the codebase; either implement it or remove the comment." Recommend pulling this line item forward ahead of its current #8-of-10 position in `CLOUDFLARE-EPIC.md`'s lean roadmap. |

No cancellations proposed — all 7 issues describe real, still-relevant work.

### 5.3 Missing tasks — none proposed except one flagged for confirmation

Per this repo's established Linear-hygiene convention: only propose a new issue where a verified gap has **no existing owner**. Every gap found already has one (Mastra gateway wire → IPI-454/461; registry merge → IPI-457; CI/rollback/observability → IPI-472; route classification/Service Binding/WAF/`requireOperator()` → IPI-468; shared tool registry design → IPI-465, needs scope rewrite not a new issue).

**Proposed only, not created:** a Linear issue for `CF-MIG-210 · Runtime Compatibility` if one doesn't already exist, linking PR #286 directly — none of the 7 audited issues currently reference that PR, and `CLOUDFLARE-EPIC.md` itself notes CF-MIG-* tasks may have no Linear issue yet.

### 5.4 Exact Linear changes proposed for approval

| # | Issue | Field | Change |
|---|---|---|---|
| 1 | IPI-471 | Description | Replace stale "Proof" line per §5.2 |
| 2 | IPI-461 | Description | Correct test count "1 file, 5 tests" → "2 files, 14 tests" |
| 3 | IPI-454 | Description | Add PR #286 cross-link note |
| 4 | IPI-465 | Description | Add "no shared-registry design exists yet" scope clarification |
| 5 | IPI-468 | Acceptance criteria | Add `requireOperator()` resolution item; note priority should move up |
| 6 | (new, pending confirmation no issue exists) | — | Create `CF-MIG-210` issue if genuinely missing, link PR #286 |

Nothing above executed. Awaiting go-ahead before any Linear writes.

### 5.5 Files in the codebase that must change

| File | Change needed | Owning issue |
|---|---|---|
| `app/src/lib/ai/provider.ts` | Add `AI_GATEWAY_URL` / `@ai-sdk/openai-compatible` path; remove `readFileSync` groq-config loading in favor of a bundled import | IPI-454 AC-F, CF-MIG-210 |
| `app/src/lib/ai/model-registry.ts` | Create — currently only exists divergently in `services/cloudflare-worker/src/model-registry.ts` | IPI-457 |
| `app/src/app/api/copilotkit/[[...slug]]/route.ts` | `hono/vercel` → `hono/cloudflare-workers` | CF-MIG-210 (PR #286, open) |
| `app/src/app/auth/callback/route.ts` | Add `*.workers.dev` to `isTrustedForwardedHost()` | CF-MIG-210 (PR #286, open) |
| `app/src/middleware.ts` | Either implement `requireOperator()` or remove the dangling reference | IPI-468 |
| `.github/workflows/ci.yml` | Add an `opennextjs-cloudflare build` job | IPI-472 |
| `app/wrangler.jsonc` | Add a real Service Binding to `services/cloudflare-worker` (currently only a self-binding) | IPI-468 |
| `services/cloudflare-worker/` | Wire a shared tool-registry import point, or document that tools stay Mastra-only by design | IPI-465 |
