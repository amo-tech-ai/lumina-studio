# IPI-753 · W1 PR2 — AI Gateway Dashboard prep (metrics SSOT)

**Date:** 2026-07-22  
**Issue:** [IPI-753 · CF-MIG-230-W1 — Migrate Public Marketing Agent](https://linear.app/amo100/issue/IPI-753)  
**Sibling code PR:** [#593](https://github.com/amo-tech-ai/lumina-studio/pull/593) (W1 PR1 — wires `model: ({ requestContext }) => resolveAgentModel({ agentId: "public-marketing", tier: "fast", requestContext })`; ships with flag **legacy**/unset)  
**Flag note:** `AI_ROUTING_AGENT_PUBLIC_MARKETING` is read by `resolveAgentModel` **after #593 merges**. On `origin/main` today the agent still uses static `resolveModel("fast")` — do not flip the flag until PR1 is live.  
**Code modified:** **No** — Dashboard / ops evidence only  
**Platform SSOT:** Cloudflare AI Gateway → `ipix-prod` → Logs / Analytics  
**Official:** [AI Gateway logging](https://developers.cloudflare.com/ai-gateway/observability/logging/) · [Auth — bindings pre-authenticated](https://developers.cloudflare.com/ai-gateway/configuration/authentication/)

---

## Verdict

**PR2 Dashboard prep: DONE.** Ready to watch the first native canary after #593 merges.  
Do **not** treat existing Kimi smoke rows as a public-marketing baseline.

---

## Checklist (completed 2026-07-22)

| Check | Evidence | Result |
|-------|----------|--------|
| Logging enabled on `ipix-prod` | Collect Logs = **ON** | ✅ |
| Automatic log deletion | Limit 100,000; **Delete oldest logs** | ✅ |
| Authenticated Gateway | Authenticated Gateway = **ON** | ✅ |
| Cache / rate / spend / retry | Left **OFF** (correct for W1 baseline) | ✅ |
| Log fields usable for canary | status, model, usage/tokens, cost, duration, user agent | ✅ |
| Existing smoke rows | 2× `@cf/moonshotai/kimi-k2.6` (~11.5s / ~12.3s) | ✅ smoke only |

---

## How to read the Dashboard after a flip

1. Cloudflare Dashboard → **AI** → **AI Gateway** → gateway **`ipix-prod`**
2. Open **Logs** (request-level) and **Analytics** (aggregates)
3. For each canary step, record:
   - **status** (2xx vs 4xx/5xx)
   - **model** (expect Workers AI id when native, e.g. `@cf/meta/llama-3.1-8b-instruct-fast`)
   - **tokens** (input/output if present)
   - **cost**
   - **duration** (use for rough p50 / error rate by eye — no custom metrics pipeline)

**Rollback signal:** error rate up or duration wildly worse vs the legacy prompt baseline → set `AI_ROUTING_AGENT_PUBLIC_MARKETING=legacy` and redeploy.

---

## Existing logs — classification

| Traffic | What it is | Use for W1 baseline? |
|---------|------------|----------------------|
| Two **Kimi** requests already in Logs | Smoke / prior gateway probes | **No** — not public-marketing |
| Marketing chat with flag **legacy**/unset | Gemini path (may not appear in AI Gateway) | Yes — run **after #593 merges** |
| Marketing chat with flag **native** | Workers AI via `ipix-prod` | Compare against legacy prompt set |

---

## Next (PR3 — not started)

```text
Wait for PR #593 to merge
→ keep AI_ROUTING_AGENT_PUBLIC_MARKETING legacy/unset
→ run a small legacy prompt baseline (same 3–5 golden prompts)
→ flip public-marketing to native (Infisical + redeploy)
→ repeat the same prompts
→ compare errors and durations in Dashboard Logs
```

**Still blocked / do not start:**

- [IPI-769](https://linear.app/amo100/issue/IPI-769) harness — after PR1 on `main`
- W2+ agent waves — after W1 canary looks healthy

---

## Non-goals (this note)

- No canary CLI, auto-rollback CLI, or custom metrics service  
- No flag flip in this PR  
- No agent / route code changes  
