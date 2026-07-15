# 000 · Architecture Decision — Cloudflare-Native AI Gateway Migration

**Date:** 2026-07-13 · **Status: Accepted and partially executed** (corrected 2026-07-14 — this document previously said "nothing executed yet," which stopped being true the same day).

**Completed since this doc was written:**
- `ipix-prod` native AI Gateway created (dashboard-confirmed)
- Legacy `ai-gateway.sk-498.workers.dev` public `workers.dev` exposure disabled (was unauthenticated — confirmed via live curl, contained via Cloudflare API; see IPI-487 for the full incident record)
- Obsolete custom-gateway-path Linear issues canceled: IPI-525, 461, 457, 454, 530, 529, 528, 527, 531 (decision: stop investing further in `services/cloudflare-worker/`)
- PR #339 is no longer an active bridge strategy — closed unmerged, not fixed and merged as this document's Phase 3 originally planned

**Current gate:** [IPI-586 · CF-AI-003 — Wire one Workers AI call through ipix-prod gateway](https://linear.app/amo100/issue/IPI-586) — in progress, zero code shipped yet (no `ai` binding in `wrangler.jsonc`, nothing calls `env.AI.run()`). This is the actual next step; the phased plan below (Steps 4-9) is superseded in its specifics by IPI-586/590/591/592/594 but its sequencing principle (prove before deleting) still holds.

**Also stale, not yet corrected in the body below:** "AI Gateway does most of this for free" needs qualifying — Workers AI inference, third-party models, and plan limits have different pricing behavior. Dynamic Routing and Spend Limits are **not** Beta (verified multiple times against live docs this session, despite several audit documents repeatedly claiming otherwise) — that specific correction is the opposite direction from what an earlier version of this note assumed.

**Plain-English summary:** iPix hand-built ~2,300 lines of code to route AI requests (auth check, retry logic, fallback between providers, model registry). Cloudflare's AI Gateway already does most of this for free, and the homemade version already has real bugs (a security timing issue, an invalid config file, a deprecated model that shipped in a PR). This document decides what to keep custom, what to hand off to Cloudflare, and the exact order to do it in — proving each step works before deleting anything.

---

## Step 1 — Verification (fresh check against current docs/code/PRs, not assumptions)

| Finding | Correct? | Evidence | Required Change |
|---|---|---|---|
| PR states: #334/#340 closed, #339/#342 open | ✅ Confirmed | Live `gh pr view` on all 4 | None |
| **PR #339 has only 1 unresolved issue (the timing attack)** | ❌ **Incorrect — bigger than assumed** | 27 review threads total, **9 unresolved**: the timing-attack bug (HIGH), a **P1 invalid `wrangler.jsonc` `"[env.test]"` key** (test env vars never actually load), a **P1 scope violation** (an unrelated chat-error-remapping change bundled into the auth-only commit), plus 5 lower-priority test gaps | This is not a 1-line fix. Needs: constant-time comparison, fix the config key, split out the unrelated change into its own PR, and resolve or explicitly defer the remaining 5 |
| Authenticated Gateway tokens are account-wide, not per-gateway | ✅ Confirmed | developers.cloudflare.com/ai-gateway/configuration/authentication/ — any token with "AI Gateway Run" works on every gateway on the account | This is a real security-model downgrade vs. iPix's current per-Worker secret — needs a conscious yes/no, not a silent switch |
| Workers AI binding (`env.AI.run()`) is current | ✅ Confirmed | developers.cloudflare.com/workers-ai/configuration/bindings/ | None |
| Universal Endpoint fallback and Dynamic Routing are the same feature | ❌ **Incorrect — two different mechanisms** | Dynamic Routing = a dashboard-built named route with per-model timeouts/retries. Universal Endpoint fallback = an ordered provider list sent **in the request itself** | Pick one deliberately — dashboard-managed vs. code-managed — don't assume they're interchangeable |
| Retries and fallback are the same thing | ❌ **Incorrect** | Retry = same provider retried; fallback/Dynamic Routing = switch to a different provider. Retry headers: `cf-aig-max-attempts` (cap 5), `cf-aig-retry-delay` (cap 5000ms) | Configure both, understanding they solve different failure modes |
| AI Gateway does not execute application tools | ✅ Confirmed, in official docs **and** iPix's own code | No Cloudflare doc describes AI Gateway running a tool. In-repo: `app/src/mastra/agents/*.ts` declare tools, `app/src/mastra/tools/*.ts` execute them. The gateway Worker's `router.ts:121` only *logs* `hasTools: !!req.tools`, never runs one | None — this boundary is safe to rely on |
| Streaming works through AI Gateway | ✅ Confirmed | `stream: true` on the Workers AI binding; AI SDK v6 `streamText()` support confirmed current | None |
| Next.js/OpenNext setup is current | ✅ Confirmed, no change | Matches earlier verified findings this session | None |
| AI Gateway logging is metadata-only | ❌ **Incorrect — bigger consideration than assumed** | developers.cloudflare.com/ai-gateway/observability/logging/ — **full prompt and response bodies are logged by default**, can be turned off per-request with `cf-aig-collect-log-payload: false`. No Sentry/Datadog integration — it's a separate dashboard | Decide *before* enabling: is logging full AI conversations (including brand/client content) acceptable, or should payload logging be turned off? |
| Rolling back the migration is simple and documented | ⚠️ **Partially — not actually documented by Cloudflare** | No official page describes an AI Gateway rollback procedure. Removing the binding config *should* revert to direct calls (same pattern as existing task docs assume), but that's inference, not a guarantee | Test the actual rollback in staging — don't claim it works until it's been done once for real |
| AI Gateway auth replaces iPix's own user/tool authorization | ❌ **Incorrect, and important to say explicitly** | Authenticated Gateway only checks "does this caller hold a valid Cloudflare token" — it knows nothing about iPix's own Supabase user identity or Mastra's per-tool permission checks | State this boundary explicitly in this document (see below) so nobody assumes gateway auth is a substitute for real authorization |

---

## Step 2 — Audit of the existing 30+ task plan

**The single biggest problem found:** the `tasks/cloudflare/Tasks/` folder actually contains **two different, contradictory plans that were never reconciled** — not one plan with some overlap.

- **Plan A** (`TASKS-INDEX.md`, `COMPLETE-RESEARCH-SUMMARY.md`, files numbered `31`-`33`): claims a live Worker already exists, recommends **Qwen + Mistral + BGE** models, and links to files that don't exist on disk.
- **Plan B** (`MASTER-PLAN.md`, files numbered `001`-`054`): recommends a **completely different model set** (GLM-4.7-flash, llama-4-scout, gemma-4-26b), and matches what's actually in the repo today.

**Decision: Plan B (`MASTER-PLAN.md`'s numbering) is authoritative. Plan A is archived, not deleted, as superseded.**

Other things this audit found, verified against real code:
- Tasks `022`-`025` (install OpenNext) say "Ready to start" — but `app/wrangler.jsonc` **already has** the full OpenNext setup. These are done; their status is just stale.
- Task `007` claims secrets are "✅ COMPLETED" with `MODEL_REGISTRY_OVERRIDE=workers-ai-only` — but the live model registry actually supports Gemini, Workers AI, Bedrock, *and* Nvidia. This claim is stale and needs correcting.
- Tasks `029`-`034` and `054` assume Mastra gets deployed as its **own separate Cloudflare Worker**. Today, Mastra runs *inside* the Next.js app. **This is an open architecture question this document does not resolve on its own** — see "Open question" below.
- `013` and `31` (gateway caching) are true duplicates — merge into one.
- `014` (dashboard-only rate limiting, zero new code) does the same job as `32` (which adds new hand-written rate-limiting code) — keep `014`, cancel `32`, since adding new custom code contradicts the entire point of this migration.
- `039` (AI Search/RAG for brand PDFs) has no established need behind it yet — flagged as speculative, not part of this migration.

**Condensed classification** (full detail in the fork's findings, folded into Phase 1 below): **Keep ~14 · Merge ~6 · Cancel ~7 · Blocked ~4 · Rewrite ~2**.

### Open question this document flags but does not answer

Should Mastra move to its own deployed Cloudflare Worker, or stay embedded in the Next.js app as it is today? Nothing in this migration *requires* answering that now — **default: leave Mastra where it is, don't move it, until something concrete requires the move** (YAGNI). Tasks `029`-`034`/`054` stay **Blocked** until that changes.

---

## Step 3 — Architecture decision

**Why Cloudflare (not more custom code):** the custom gateway already has three real, found bugs — a timing-attack-vulnerable auth check, a deprecated model that shipped in a merged PR, and an invalid test config. Each of those already exists as a solved, maintained feature in Cloudflare's AI Gateway. Writing more custom code to fix these bugs means maintaining code that duplicates a free platform feature.

**What stays custom (Cloudflare cannot replace this):**
- Mastra's tool declarations and tool execution — confirmed nothing in AI Gateway runs a tool; this is iPix's own logic and stays that way.
- iPix's own end-user authentication and per-tool authorization (Supabase-based) — Authenticated Gateway only checks for a valid Cloudflare token, nothing about who the actual user is or what they're allowed to do.
- Business logic for what an agent does with a model's response.

**What becomes Cloudflare-native:**
- Model call routing and fallback between providers (via Dynamic Routing **or** Universal Endpoint — pick one, they are not the same thing).
- Automatic retries on transient failures.
- The coarse "is this caller allowed to hit the gateway at all" check (Authenticated Gateway) — as a *bridge/first layer*, not a replacement for real user auth.
- Basic rate limiting and spend limits.
- Observability — with an explicit decision needed on whether to log full prompt/response bodies (on by default) given they may contain client/brand content.

**What Cloudflare cannot replace at all:** anything requiring iPix's own user identity, and integration with iPix's existing Sentry-based error tracking — AI Gateway's dashboard is a separate, non-integrated observability surface, not a Sentry replacement.

**Final recommended architecture:**

```
Next.js/OpenNext app
  → Mastra (owns tool declarations, tool execution, business logic — unchanged)
    → Workers AI binding + AI Gateway (owns model routing, fallback, retries,
      coarse auth, rate/spend limits, logging — Cloudflare-managed)
      → actual model providers (Workers AI, Gemini, Bedrock)
```

The custom gateway Worker (`services/cloudflare-worker/`) is deleted **only after** this path is proven in staging — not before.

---

## Step 4 — The smallest replacement plan (required order)

Every phase has a gate (Step 5) that must pass before the next phase starts.

### Phase 1 — Save and audit existing plan docs
**`IPI-TBD · CF-PLAN-001 — Commit the migration plan, archive the superseded index`**
- Commit `tasks/cloudflare/Tasks/` (the `MASTER-PLAN.md` family) and `tasks/cloudflare/draft/` audit docs to git — they're currently unprotected.
- Move `TASKS-INDEX.md`, `COMPLETE-RESEARCH-SUMMARY.md`, `MASTRA-SETUP-SUMMARY.md`, `NEXTJS-QUICK-START.md` into a new `tasks/cloudflare/Tasks/archive/` folder with a one-line note: "superseded by MASTER-PLAN.md, 2026-07-13."
- Correct `022`-`025`'s status to "already done" and `007`'s status to reflect the real model registry.
- Merge `013`+`31`, and the `001`/`005`/`006`/`009`/`010`/`011` "already-done Worker setup" cluster into single authoritative docs each.
- Cancel `32` (superseded by `014`).

### Phase 2 — Close only confirmed obsolete PRs
Already done this session: #334 and #340 closed, confirmed still closed as of this pass's fresh check. No new action.

### Phase 3 — Preserve temporary security protection
**`IPI-TBD · CF-SEC-002 — Fix and land PR #339 as a bridge security fix`**
- Fix the timing-attack bug (constant-time token comparison, e.g. `crypto.subtle.timingSafeEqual()`).
- Fix the invalid `"[env.test]"` key in `wrangler.jsonc` so test env vars actually load.
- Split the unrelated chat-error-remapping change out into its own separate PR — do not bundle it into a security fix.
- Resolve or explicitly document a decision on the remaining 5 lower-priority threads.

### Phase 4 — Extract useful #342 fixes onto current main
**`IPI-TBD · CF-AI-003 — Rebase #342's Gemini tool-calling guard fixes onto current main`**
- Take only the 2 refined guard fixes (`req.tools?.length`, `tool_choice === "none"` handling) — do **not** carry over #342's model-registry.ts, which predates the already-shipped model upgrade.
- Open as a small, fresh PR. This will be the first time this content actually runs through CI.

### Phase 5 — Build one minimal proof of concept
**`IPI-TBD · CF-AI-004 — Wire one low-risk agent through Workers AI binding + AI Gateway, in parallel`**
- Add the `ai` binding and create the AI Gateway (per the merged Phase-1 task docs).
- Wire exactly one simple, low-stakes agent call through the new path — leave the existing custom gateway running untouched alongside it.

### Phase 6 — Test auth, chat, tools, streaming, fallback, logs, cost, rollback
**`IPI-TBD · CF-TEST-005 — Full scenario test matrix on the new path`**
Test, with evidence for each: Authenticated Gateway auth (and confirm Mastra's own per-user/tool auth still runs independently) · a normal chat completion · a tool-calling round trip (confirm Mastra still executes it, gateway only proxies) · streaming · provider fallback (pick Dynamic Routing **or** Universal Endpoint, not both, and test it) · logs appear in the gateway dashboard (and decide on full-payload logging on/off) · cost shows in the dashboard · rollback actually works (remove the config, confirm direct calls still succeed — test this for real, since Cloudflare doesn't document it).

### Phase 7 — Deploy to staging
**`IPI-TBD · CF-DEPLOY-006 — Run the new path in staging under real or synthetic load`**
Soak for an agreed period before touching production.

### Phase 8 — Roll out gradually
**`IPI-TBD · CF-DEPLOY-007 — Shift production traffic gradually, not all at once`**
Start with one low-risk agent, expand only if error rate/latency stay within tolerance of the current baseline at each step.

### Phase 9 — Delete custom gateway code last
**`053-CF-MIGRATION-cleanup-custom-code.md`** (already written, reuse as-is)
Only after Phase 8 reaches 100% of production traffic and stays stable for an agreed period. Removes ~2,300 lines.

---

## Step 5 — Gates

| Phase | Success criteria | Evidence required | Decision |
|---|---|---|---|
| 1. Save/audit docs | Plan committed, superseded docs archived (not deleted), stale statuses corrected | `git log` showing the commit, archive folder exists | Continue |
| 2. Close obsolete PRs | Already done | `gh pr view` shows CLOSED | Continue |
| 3. Fix PR #339 | All 9 threads resolved, CI (incl. Codacy) green | PR merged, thread resolution links | Continue / Hold if any thread unresolved |
| 4. Extract #342 fixes | New small PR, CI green, no model regression | CI run link, diff showing only the 2 guard fixes | Continue / Hold if model-registry drift reappears |
| 5. Proof of concept | One agent call works end-to-end via new path, locally | Local preview log/screenshot | Continue / Rollback (delete the parallel path, no harm — old path still running) |
| 6. Full test matrix | All 8 scenarios pass with evidence | Screenshots/logs per scenario | Continue / Hold on any failing scenario |
| 7. Staging | Soak period completes with no regression vs. baseline error rate/latency | Staging monitoring data | Continue / Rollback to custom gateway if regression found |
| 8. Gradual rollout | Each rollout step stays within agreed tolerance | Production monitoring per step | Continue to next % / Rollback that step if tolerance breached |
| 9. Delete custom code | 100% traffic on new path, stable for agreed period, all prior gates green | Production monitoring history | Proceed with deletion — only now |

---

## Step 6 — Summary

**Corrected architecture:** as described in Step 3 — Mastra keeps owning tools/logic; Cloudflare's AI Gateway takes over routing/retry/fallback/coarse-auth/observability; nothing is deleted until staging and gradual rollout both pass.

**Final verdict per PR:**
- **#334 — CLOSE** (done this session, confirmed still closed)
- **#339 — PRESERVE, but the fix is bigger than first thought** — 9 unresolved threads, not 1; needs the timing-attack fix, a config bug fix, and a scope split before it can merge
- **#340 — CLOSE** (done this session, confirmed still closed)
- **#342 — PRESERVE PARTS ONLY** — extract just the 2 Gemini guard fixes onto current main; do not reuse its stale model-registry content

**Tasks to keep / merge / rewrite / cancel:** ~14 keep, ~6 merge, ~7 cancel (including the entire superseded "Plan A" family), ~4 blocked (Mastra-deployment-architecture-dependent + speculative RAG task), ~2 need their stale status corrected. Full list in Step 2.

**Exact dashboard/CLI steps:** unchanged from the plain-language walkthrough already written in `tasks/cloudflare/pr/PR-AUDIT-2026-07-13-334-339-340-342.md` (create gateway → auto-retry → dynamic routing → AI binding → auth toggle → delete custom code last) — that sequence now maps directly onto Phases 5, 6, and 9 above.

**Tests required:** the 8-scenario matrix in Phase 6, run once against staging (Phase 7) and once per rollout step (Phase 8).

**Estimated code reduction:** ~2,300 lines (per the existing `053` task doc — confirmed still accurate).

**Estimated failure-point reduction:** eliminates 4 distinct hand-rolled failure surfaces already found to have real bugs — the timing-attack-vulnerable auth check, the retry/fallback classifier, the model registry (already shipped one deprecated model to production once), and the custom error-mapping code — all replaced by Cloudflare-maintained equivalents.

**Final verdict: PROCEED** — with these conditions attached, not as blanket approval:
1. Fix PR #339 properly (all 9 threads) before treating it as a safe bridge.
2. Resolve the Mastra-deployment-architecture question before touching Phases involving tasks `029`-`034`/`054` (default: don't move Mastra, no evidence requires it).
3. Decide on full-payload logging before Phase 6 (client/brand content may be in those logs).
4. Pick Dynamic Routing **or** Universal Endpoint deliberately — they are not interchangeable.
5. Do not delete any custom code before Phase 8 completes — cleanup is explicitly the last phase, not an early win.
