# Verification report — IPI-454 · CF-AI-001 (corrected)

**Date:** 2026-07-10 · **Auditor:** task-verifier + cloudflare skill  
**Probe base:** `origin/main` @ fetch time + open [PR #310](https://github.com/amo-tech-ai/lumina-studio/pull/310)  
**Supersedes stale claims in:** `tasks/cloudflare/audits/ipi-454-457-462-463-verification.md` (2026-07-09) for IPI-454 / IPI-457 rows

---

## Scorecard

| Task | Linear | Spec /100 | Execution /100 | Skills /100 | Composite | Safe Done? |
|------|--------|----------:|---------------:|------------:|----------:|:----------:|
| **IPI-454 · CF-AI-001 — AI Gateway — Cloudflare Provider Routing** | In Progress | 90 | 52 | 85 | **72** | 🛑 No |

**Formula:** `0.35×spec + 0.40×execution + 0.25×skills`

> **Not ready for Done.** Blockers: merge PR #310 (IPI-461 runtime) → implement AC-F → AC-J E2E proof → AC-I via IPI-472.

---

## Corrections vs 2026-07-09 audit (must not re-assert)

| Old claim (2026-07-09) | Corrected (2026-07-10) | Probe |
|------------------------|------------------------|-------|
| AC-C Workers AI URL uses API token as account ID | ✅ **Fixed** — `workersAiOpenAiBaseUrl` uses `config.accountId` + Bearer | `origin/main:services/cloudflare-worker/src/providers/workers-ai.ts`; PR **#279** merged 2026-07-09 |
| IPI-457 types/registry absent on main | ✅ **On main** — `model-registry.ts`, expanded `AiProvider`, `ModelTier` | `git cat-file -e origin/main:app/src/lib/ai/model-registry.ts`; PR **#302** merged 2026-07-10 |
| `provider-adapter.ts` absent on main | ✅ **Present** (contract + singleton) | `origin/main:app/src/lib/ai/provider-adapter.ts` |
| Adapter default is fine / unused | 🔴 Default is **`http://localhost:4111` (Mastra)** — wrong for AI Gateway Worker (`:8787`) | `gatewayBaseUrl()` L40–41 on main |
| `createProviderAdapter` + `/api/ai/health` on main | 🔴 **Not on main** — only on PR #310 | `MISSING app/src/app/api/ai/health/route.ts` on `origin/main` |
| IPI-461 only in stale PR #271 | 🟡 **PR #310** open (In Review); #271 superseded by #302/#310 | Linear IPI-461 + gh pr 310 |
| CF-MIG-210 / groq FS break unconditional | ✅ **PR #286 merged** — static `groq-models.ssot.json` import | PR **#286** merged 2026-07-10 |
| Zero `AI_GATEWAY` references in `app/src` | ❌ Stale — adapter reads `AI_GATEWAY_URL` / `AI_GATEWAY_API_KEY` | `provider-adapter.ts` on main |

---

## AC matrix (IPI-454 only)

| AC | Claim | Probe | Result |
|----|--------|-------|--------|
| A | OpenAI-compatible `/v1/chat/completions` | `services/cloudflare-worker/src/router.ts` | ✅ |
| B | Gemini provider | `providers/gemini.ts` | ✅ |
| C | Workers AI provider URL modes | `workersAiOpenAiBaseUrl` + PR #279 | ✅ |
| D | Retry/fallback scaffolding | Tier→default only; **no** provider failover (IPI-463) | 🟡 |
| E | Worker integration tests | `index.test.ts` (5) + `workers-ai.test.ts` (9) = **14** on main | ✅ |
| **F** | Wire Mastra `resolveModel()` → openai-compatible → `AI_GATEWAY_URL` | `resolveModel()` only `gemini` \| `groq`; throws otherwise | 🔴 |
| G | KV model registry | Optional; not required for AC-F | ⚪ |
| H | Circuit breaker | IPI-463 | ⚪ |
| **I** | Prod deploy | IPI-472; no prod URL in repo | 🔴 |
| **J** | E2E gateway checklist | All unchecked in Linear | 🔴 |

---

## Dependency truth

| Dep | Status | Notes |
|-----|--------|-------|
| **IPI-457 · CF-AI-005** | ✅ Merged (#302) | Types + registry on main — **not** a blocker for AC-F anymore |
| **IPI-461 · CF-AI-004** | 🟡 PR #310 open | Runtime factory + health + `:8787` — **merge before / with AC-F** |
| **IPI-490 · CF-MIG-210** | ✅ Merged (#286) | Groq SSOT + OAuth/Hono — hosting path |
| **IPI-472 · INFRA-001** | 🔴 Open | Blocks AC-I only |
| **IPI-485 · MASTRA-CF-001** | Blocked by IPI-454 | Do not start until AC-F + AC-J |

---

## Critical remaining defects (execution)

1. **AC-F missing** — Mastra agents still call Gemini/Groq directly via `resolveModel()`.
2. **Main adapter default port wrong** — `:4111` vs Worker `:8787` (fixed on PR #310 branch).
3. **No `/api/ai/health` on main** — runtime proof route only on #310.
4. **Dual registries** — app vs Worker `model-registry` still diverge; Worker defaults most tiers to **Gemini** while product copy says Workers AI default.
5. **AC-J / AC-I unproven** — no E2E stream/tools/metrics through gateway; no prod deploy.

---

## Skills compliance (this audit)

| Skill | On disk | Loaded | MUST |
|-------|:-------:|:------:|------|
| task-verifier | ✅ | ✅ | Probe + scorecard |
| cloudflare | ✅ | ✅ | Workers AI URL vs CF docs |
| mastra | ✅ | cite only | AC-F not implemented |
| gemini | ✅ | cite only | Current live path |

**Skills /100:** 85

---

## Anti-fake-done (IPI-454)

| # | Gate | Result |
|---|------|--------|
| 1 | Full AC on disk | 🔴 F/I/J missing |
| 2–4 | Tests for AC-F | ⚪ N/A |
| 5 | Supabase | ⚪ |
| 6 | Skills | ✅ 85 |
| 7 | PR hygiene | 🟡 #310 open; AC-F not started |
| 8 | Evidence | 🔴 no AC-J pack |
| 9 | Linear sync | 🟡 was stale — corrected this run |
| 10 | No open 🔴 | 🔴 |

---

## Stop condition

🛑 **Not Done.** Fix order: merge #310 → AC-F PR → AC-J evidence → IPI-472 (AC-I). Optional G/H stay deferred.
