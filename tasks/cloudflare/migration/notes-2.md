# CF-AI verification snapshot + next tasks

**Date:** 2026-07-09  
**Linear:** [IPI-454](https://linear.app/amo100/issue/IPI-454) · [IPI-457](https://linear.app/amo100/issue/IPI-457) · [IPI-462](https://linear.app/amo100/issue/IPI-462) · [IPI-463](https://linear.app/amo100/issue/IPI-463)  
**Full audit:** [`../audits/ipi-454-457-462-463-verification.md`](../audits/ipi-454-457-462-463-verification.md)  
**Diagrams:** [`../../diagrams/02-ai-provider-flow.md`](../../diagrams/02-ai-provider-flow.md)

---

## Status summary

| Issue | Linear | Repo (`main`) | Next action |
|-------|--------|---------------|-------------|
| IPI-454 CF-AI-001 | In Progress | AC-C merged PR #279; Mastra wire + prod deploy pending | **Next:** AC-F → AC-I → AC-G |
| IPI-457 CF-AI-005 | Complete ⚠️ | Types/registry on branch only | Merge `ai/ipi-471-...` before Done |
| IPI-462 CF-AI-006 | Backlog | No harness | Build after AC-C + AC-F land |
| IPI-463 CF-AI-008 | Backlog | No failover | After IPI-462 eval gate |

**Verdict:** None Done-safe on `main` today.

---

## What `@app` does today

```
Marketing chat → resolveModel("fast") → Gemini (AI_PROVIDER=gemini default)
AI Gateway worker → not in Mastra path
```

| Probe | Result |
|-------|--------|
| `services/cloudflare-worker` tests | **14/14** (PR #279 — URL fix verified) |
| `app/src/lib/ai/provider.test.ts` | 19/19 (gemini/groq only) |

---

## IPI-454 AC-C — Workers AI URL ✅ (PR #279 merged)

**Evidence:** [`../tests/pr-279-workers-ai-url-verification.md`](../tests/pr-279-workers-ai-url-verification.md)  
**Commit:** `dcbdf25b` · **Tests:** 14/14 in `services/cloudflare-worker`

**Official OpenAI-compat base:**  
https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/

```text
# Direct API
https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/v1/chat/completions
Authorization: Bearer {API_TOKEN}

# Managed AI Gateway — use gateway URL as-is + /chat/completions
https://gateway.ai.cloudflare.com/v1/{acct}/{gw}/openai/chat/completions
```

**Fixed:** token-in-path bug + double `/accounts/` append on gateway URLs.

| Env var | Role |
|---------|------|
| `CLOUDFLARE_ACCOUNT_ID` | URL path segment (direct API only) |
| `CLOUDFLARE_API_TOKEN` | `Authorization: Bearer` |

**Follow-ups (separate PRs):**

| AC | Task | PR scope |
|----|------|----------|
| F | Mastra `@ai-sdk/openai-compatible` → gateway | `app/` only |
| G | KV model registry | `services/cloudflare-worker/wrangler.jsonc` |
| I | Prod deploy via IPI-472 | ops + worker deploy |
| Registry | Flip chat tiers to Workers AI default | after IPI-462 eval |

**Registry note:** `model-registry.ts` still defaults Gemini for chat tiers; only `embedding` is Workers AI. Align with CF-000 after eval — not part of AC-C PR.

---

## IPI-457 — fake Done on main

Linear proof path `app/src/lib/ai/model-registry.ts` **missing on `main`**.

Branch `ai/ipi-471-agent-001-ai-agent-architecture` (+706 LOC: `model-registry.ts`, `provider-adapter.ts`, tests). Retract Linear Done until merged.

---

## IPI-462 / IPI-463 — not started

| Deliverable | Path | Status |
|-------------|------|--------|
| Eval harness | `scripts/ai/run-provider-eval.mjs` (TBD) | 🔴 |
| Feature matrix | `docs/ai/provider-feature-matrix.md` | 🔴 |
| Eval report | `docs/ai/provider-eval-report.md` | 🔴 |
| Failover runbook | `docs/operations/ai-failover.md` | 🔴 |

IPI-360 Groq golden eval is related but **not** a substitute for Workers AI gateway eval.

---

## Execution order

```text
1. IPI-454 AC-C  — Workers AI URL + test        ✅ PR #279 merged
2. IPI-454 AC-F  — Mastra → gateway             ← NEXT (code PR)
3. IPI-454 AC-I  — prod deploy (IPI-472)        ← parallel ops
4. IPI-457       — merge unified types/registry
5. IPI-462       — eval suite (hard gate)
6. IPI-463       — failover + runbook
7. Cutover       — fast tier → @cf/meta/llama-3.1-8b-instruct-fp8
```

---

## Verify commands

```bash
# After AC-C PR
cd services/cloudflare-worker && npm test

# Live smoke (needs Infisical secrets)
infisical run -- npx wrangler dev
curl -s localhost:8787/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{"model":"embedding","input":"test"}'
```

---

## Out of scope for AC-C PR

- Cloudinary MCP (media only — verified toolchain OK)
- Mastra wiring, KV registry, prod deploy
- Model registry tier flip to Workers AI default
