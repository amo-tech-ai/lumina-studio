# IPI-590 · CF-GW-002 — Configure AI Gateway Features

**Linear:** [IPI-590 · CF-GW-002 — Configure AI Gateway managed features](https://linear.app/amo100/issue/IPI-590)  
**Task ID:** CF-GW-002  
**Phase:** 2 — Gateway setup  
**Difficulty:** Easy  
**Risk:** Low  
**Estimated time:** 30 minutes  
**Dependencies:** Task CF-GW-001 (gateway must exist)

---

## Purpose

**Correction (2026-07-14 audit):** this file originally duplicated the step-by-step content of `013`-`019` (one bundled task covering five features that are now individually specified, fixed, and gateway-header-corrected as their own files) and repeated an unverified "300 requests per minute" Workers AI rate-limit claim that could not be confirmed against current Neuron-based pricing/limits docs. Rather than maintain two versions, this file is now the overview/index — **the per-feature step-by-step instructions live in `013`-`019`, not here.**

Enable the managed features of the AI Gateway: caching, rate limiting, spend limits, retries, and dynamic routing for fallbacks. Each feature replaces custom code or custom tasks that were planned but never built.

### Real-world iPix example

During a busy fashion week, fifty iPix users simultaneously ask agents to analyze different brands. Without caching and rate limiting, this could overwhelm Workers AI and incur significant cost. With the AI Gateway configured, repeated requests are cached, abusive users are rate-limited, the daily spend is capped at a budget the team sets, and if the primary model fails, the gateway automatically falls back to a cheaper model. All of this happens without any code changes.

---

## Recommended Setup Method

**Dashboard — toggle features in the gateway settings.** Every feature is a dashboard configuration, no code changes needed.

---

## Per-feature tasks (do these, not the removed sections below)

| Feature | File | Status |
|---|---|---|
| Caching | `013-CF-GW-enable-caching.md` | Fixed — gateway header added, dashboard tab name corrected |
| Rate limiting | `014-CF-GW-enable-rate-limiting.md` | Fixed — gateway header added |
| Spend limits | `015-CF-GW-configure-spend-limits.md` | Fixed — gateway header added, eventual-consistency note added |
| Auto-retry | `017-CF-GW-configure-auto-retry.md` | Fixed — gateway header added, platform ceilings noted |
| Custom metadata | `018-CF-GW-tag-custom-metadata.md` | Fixed — gateway header added |
| Dynamic routing (fallback) | `016-CF-GW-configure-dynamic-routing.md` | Fixed — bad model ID `@cf/openai/gpt-5` corrected to `openai/gpt-5` |
| Guardrails | `019-CF-GW-enable-guardrails.md` | Fixed — blocked-response shape corrected (real: error codes 2016/2017, not "400/451 moderation_blocked") |

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| AI Gateway exists (`001-CF-GW-create-gateway.md`) | Must be complete | The features are configured on the gateway |

---

## What Custom Code This Removes

**Correction (2026-07-14, Linear sync):** the table below previously marked IPI-531, IPI-460, and IPI-463 as "canceled." Verified live against Linear on 2026-07-14 — **none of the three are canceled** (IPI-531 is Todo, IPI-460 is Backlog, IPI-463 is Backlog), and none has been touched this session. Corrected below with real status and honest overlap, not full replacement.

| Feature | Custom code or task it relates to |
|---------|-------------------------------|
| Caching | No equivalent existed — new capability |
| Rate limiting | No equivalent existed — new capability |
| Auto-retry | Partial overlap with IPI-531 (CF-AI-016, Todo, not canceled) — that issue also covers AbortController timeout enforcement and structured JSON logging, which this dashboard feature does not provide. Do not close IPI-531 on this task's completion alone. |
| Dynamic routing fallback | Partial overlap with IPI-463 (CF-AI-012a, Backlog, not canceled) and the already-built, tested `services/cloudflare-worker/src/providers/bedrock.ts` fallback (98/98 tests passing as of 2026-07-14) — that custom fallback is still the live production path and stays in place until `053-CF-MIGRATION-cleanup-custom-code.md` (Linear: IPI-592 · CF-MIG-820) is unblocked and executed. |
| Cost tracking | Related to IPI-460 (CF-AI-010, Backlog, not canceled) — Gateway Spend Limits caps total dollar spend; IPI-460's per-brand cost attribution into Supabase `ai_agent_logs` is a distinct, still-open product need this dashboard feature does not cover. |
| Custom retry-classifier.ts / router.ts fallback logic | Deleted only in `053-CF-MIGRATION-cleanup-custom-code.md` (Linear: IPI-592 · CF-MIG-820), gated on the native path being proven in production — not by this task. |

This task configures native gateway features that will eventually let IPI-592 delete the custom fallback/retry code, but does not itself cancel or complete any of the three related Linear issues.

---

## User Journey After This Task

> A fashion brand signs up for iPix and immediately starts analyzing twenty competitor brands. The Brand Intelligence agent sends twenty requests to Workers AI. The AI Gateway caches two requests that were identical (two competitors had the same website structure), rate-limits are not triggered (twenty is well under 200 per minute), retries one request that hit a transient 503, and tracks the total cost at $0.40. The spend dashboard shows the usage. The daily cap of $50 is nowhere near reached. The team has full visibility into what happened, with zero custom monitoring code.
