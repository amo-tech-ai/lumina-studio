## Verdict: **conditionally ready** — no critical code blockers for **IPI-492 · CF-AI-004c**

Merge after a **rebase onto `main`** (1 docs commit). Soft process noise (Codacy complexity) is the only CI red; required checks are green. Unresolved review threads: **0**.

**Percent correct (this PR’s concern): ~93%**  
**Gateway-wide error hygiene: ~78%** (chat + bad JSON still old shapes)

---

### Evidence (ran now)

| Check | Result |
|--------|--------|
| Worker vitest | **51/51** pass |
| Adapter vitest | **25/25** pass |
| Live `:8787` (this worktree) | empty → **400** `invalid_request`; bad model → **400** `unsupported_embedding_model`; happy → **768-d**; batch 2 → **768,768**; chat → **200** |
| Required CI | `app-build`, `supabase-web015`, booking gates **SUCCESS** |
| Unresolved threads | **0** |
| Behind `main` | **1** (`#318` docs-only) — trial merge **clean** |
| Codacy | **fail** — 1 medium **complexity** (not a functional bug) |

---

### Blockers vs soft gates

| Item | Severity | Action |
|------|----------|--------|
| Branch 1 commit behind `main` | Process | Rebase/update before merge |
| Codacy complexity → `mergeStateStatus: UNSTABLE` | Soft | Waive/dismiss if not required; no code defect found |
| No remote/prod Worker deploy | Out of scope | Expected for this PR — **Local Runtime Verified** only |

**No critical code fix required** for the embed contract itself.

---

### Red flags / failure points (not merge-blockers for IPI-492)

1. **Malformed JSON** still returns a different envelope (`500` `{error:"gateway_error", message:…}`), not the new `{ error: { code, message, requestId } }` shape. Live-confirmed.
2. **Chat errors unchanged** — missing `messages` → `502` with raw `"Cannot read properties of undefined…"` (sanitization is embed-only by design).
3. **Dead export** `SUPPORTED_EMBEDDING_MODELS` is never used (allowlist is via `resolveEmbeddingEntry`).
4. Worker `tsc --noEmit` still noisy (`cloudflare:test`, pre-existing provider typing) — **vitest is the real gate** and is green.

---

### What’s correct

- Empty / blank / mixed blank array → **400** before provider (no fake 502)
- Chat model on embed → **400** `unsupported_embedding_model` (no silent remap to chat `default`)
- Override missing `embedding` tier → falls back to canonical BGE
- Explicit `@cf/baai/bge-base-en-v1.5` → canonical default (override alias ignored)
- Sanitized provider map (429/5xx/timeout) + typed `AiGatewayError` on the adapter
- Scope stays one concern (no AC-F / Mastra / docs mix)

Cloudflare docs confirm BGE Base → **768-d** — matches live probe.

---

### Missing / improvements (follow-ups, not this PR)

| Improvement | Why |
|-------------|-----|
| Wrap `request.json()` → stable `invalid_request` | Align bad JSON with embed contract |
| Apply same envelope to `handleChat` | Kill chat/embed asymmetry |
| Drop unused `SUPPORTED_EMBEDDING_MODELS` or wire it | Dead code |
| Call-site handling of `AiGatewayError` (retry on `retryable`) | Adapter throws it; few callers use it yet |
| Docs note that empty/wrong embed is **400** not **502** | Already partly stale after #318/#319 |

---

### Scorecard

| Area | Score |
|------|------:|
| Scope / one concern | 96 |
| Embed validation + routing | 94 |
| Error envelope (embed) | 92 |
| Tests + local runtime | 95 |
| Chat / JSON parity | 55 |
| Prod / remote | N/A (out of scope) |
| **Overall for merge of IPI-492** | **~93** |

---

### Merge recommendation

**Yes — after rebase onto `main`.** Then merge. Do **not** wait on chat sanitization or Codacy complexity for this concern.

I did not merge. Say if you want me to rebase + push, or open follow-ups for chat/JSON envelope parity.

## Verdict: **real bug class — already fixed on PR #317**

The failure mode is valid in principle. On current HEAD (`dba12d1d`) it is **not** open anymore.

### Why the report was right (historically)

With `AI_ROUTING_MODE=gateway` + `AI_GATEWAY_ALLOW_TOOL_TIERS=1`:

- `resolveModel("default"|"structured"|…)` → openai-compatible **gateway** model
- Old `resolveProviderOptions()` (no tier / no gateway guard) → Gemini `{ google: { thinkingConfig… } }`
- Call sites like `social-discovery` / `suggestShootBrief` pass both → Worker can reject unknown Google fields

That mismatch is a real HIGH-severity footgun for the experimental tool-tier flag.

### Why it’s not valid against current code

```172:180:app/src/lib/ai/provider.ts
export function resolveProviderOptions(tier: GroqModelTier = "default") {
  // Gemini thinkingBudget applies to direct @ai-sdk/google models only.
  // When this tier is routed via openai-compatible gateway, return {} so
  // Google-specific fields are not forwarded to the Worker (rejects unknown options).
  if (shouldRouteTierViaGateway(tier)) {
    return {};
  }
  return resolveAiProvider() === "gemini" ? resolveGeminiProviderOptions() : {};
}
```

Same gate as `resolveModel()` (`shouldRouteTierViaGateway`), so options and transport stay aligned.

Call sites already pass the tier:

- `social-discovery.ts` → `resolveProviderOptions("structured")`
- `suggestShootBrief.ts` → `resolveProviderOptions("default")`
- `visual-identity.ts` → `"vision"` (never gateway → Gemini options still correct)

Regression covered in `provider.test.ts` (“omits Gemini provider options when the tier routes via gateway”). Ran: **15 related tests passed**.

PR #317 unresolved threads: **0**. Fix commit: `dba12d1d fix(ipi-454): omit Gemini providerOptions when tier uses AI Gateway`.

### Proposed fix

**None** — already landed. No `/pr-fix` code change needed for this finding.

If a bot thread still cites L172–177 as broken, reply with that SHA + the test name and resolve as already fixed.


## Verdict: **real bug class — already fixed on PR #317**

The failure mode is valid in principle. On current HEAD (`dba12d1d`) it is **not** open anymore.

### Why the report was right (historically)

With `AI_ROUTING_MODE=gateway` + `AI_GATEWAY_ALLOW_TOOL_TIERS=1`:

- `resolveModel("default"|"structured"|…)` → openai-compatible **gateway** model
- Old `resolveProviderOptions()` (no tier / no gateway guard) → Gemini `{ google: { thinkingConfig… } }`
- Call sites like `social-discovery` / `suggestShootBrief` pass both → Worker can reject unknown Google fields

That mismatch is a real HIGH-severity footgun for the experimental tool-tier flag.

### Why it’s not valid against current code

```172:180:app/src/lib/ai/provider.ts
export function resolveProviderOptions(tier: GroqModelTier = "default") {
  // Gemini thinkingBudget applies to direct @ai-sdk/google models only.
  // When this tier is routed via openai-compatible gateway, return {} so
  // Google-specific fields are not forwarded to the Worker (rejects unknown options).
  if (shouldRouteTierViaGateway(tier)) {
    return {};
  }
  return resolveAiProvider() === "gemini" ? resolveGeminiProviderOptions() : {};
}
```

Same gate as `resolveModel()` (`shouldRouteTierViaGateway`), so options and transport stay aligned.

Call sites already pass the tier:

- `social-discovery.ts` → `resolveProviderOptions("structured")`
- `suggestShootBrief.ts` → `resolveProviderOptions("default")`
- `visual-identity.ts` → `"vision"` (never gateway → Gemini options still correct)

Regression covered in `provider.test.ts` (“omits Gemini provider options when the tier routes via gateway”). Ran: **15 related tests passed**.

PR #317 unresolved threads: **0**. Fix commit: `dba12d1d fix(ipi-454): omit Gemini providerOptions when tier uses AI Gateway`.

### Proposed fix

**None** — already landed. No `/pr-fix` code change needed for this finding.

If a bot thread still cites L172–177 as broken, reply with that SHA + the test name and resolve as already fixed.

## Merge readiness — **IPI-492 · CF-AI-004c**

Rebased, re-verified, pushed (`9de69798`). **Not merged.**

| Item | Result |
|------|--------|
| Task | **IPI-492 · CF-AI-004c — Harden AI Gateway Embed & Error Contracts** |
| Rebased onto main | **Yes** (`4c0badb3` docs #318; conflicts: **None**) |
| Scope preserved | **Yes** — 8 files only (Worker + adapter); no docs / AC-F / Mastra |
| Worker tests | **Pass 51/51** |
| Adapter tests | **Pass 25/25** |
| Empty input 400 | **Pass** (`invalid_request`) |
| Wrong model 400 | **Pass** (`unsupported_embedding_model`) |
| Happy embed 768-d | **Pass** |
| Batch embed | **Pass** (768,768) |
| Chat regression | **Pass** (HTTP 200) |
| Required CI | **Green** (`app-build`, `supabase-web015`, booking gates) |
| Review threads | **0** open |
| Codacy | **Waived** — acceptable local complexity (documented on PR) |
| Remaining blocker | **None** (Codacy fail is non-functional; branch unprotected) |
| Merge recommendation | **Merge** |

PR: https://github.com/amo-tech-ai/lumina-studio/pull/319

### Codacy (Step 5)

**Acceptable local complexity** — intentional status→code branching in embed validation / `mapProviderFailure`. Not a functional defect; waived in PR body. No refactor for Codacy alone.

### Follow-ups filed (children of IPI-492)

| Issue | Title |
|-------|--------|
| [**IPI-494 · CF-AI-004d — Stable malformed JSON → 400**](https://linear.app/amo100/issue/IPI-494) | Wrap `request.json()` |
| [**IPI-495 · CF-AI-004e — Chat error-contract parity**](https://linear.app/amo100/issue/IPI-495) | Sanitize `handleChat` |
| [**IPI-496 · CF-AI-004f — SUPPORTED_EMBEDDING_MODELS**](https://linear.app/amo100/issue/IPI-496) | Remove or wire dead export |
| [**IPI-498 · CF-AI-004g — Adopt AiGatewayError**](https://linear.app/amo100/issue/IPI-498) | Call-site `retryable` / codes |
| [**IPI-497 · CF-AI-004h — Docs: 400 not 502**](https://linear.app/amo100/issue/IPI-497) | Docs-only sync |

Say the word if you want me to merge #319.

Those Wrangler restart attempts were aborted mid-start; a later start from the post-merge worktree succeeded. `:8787` is still healthy (`200`).

## Verdict: **conditionally ready** — merge after CI on rebased HEAD

**IPI-454 · CF-AI-001** AC-F (#317) is sound with default `AI_ROUTING_MODE=direct`. Rebased onto #319 (`f9c66c84`), pushed, threads **0**. Wait for `app-build` green; Codacy soft.

**Percent correct (AC-F code): ~92%** · **Tier C journey bar: ~78%** (browser UJ-OP/MKT waived)

### Blockers

| Item | Status |
|------|--------|
| Behind #319 | **Cleared** — rebase clean |
| Critical code (`resolveProviderOptions`) | **Already fixed** |
| Required CI on new HEAD | **In progress** — merge when green |
| Browser UJ-OP / UJ-MKT under gateway | **Not run** — waived with stand-in |

### Tests this audit

| Gate | Result |
|------|--------|
| `provider` + `provider-adapter` | **58/58** |
| Pre-push full suite | **1106 pass** |
| UJ-HEALTH Worker + `/api/ai/health` | **Pass** |
| UJ-EMBED 768 + empty 400 | **Pass** |
| `resolveModel("fast")` → gateway → **PONG** | **Pass** (~1.2s) |
| Vision / default stay direct (no tool flag) | **Pass** |

### Red flags (not merge-blockers if flag stays off)

- Agents bind `resolveModel()` at **module load** — set `AI_ROUTING_MODE` **before** app boot  
- Do **not** enable `AI_GATEWAY_ALLOW_TOOL_TIERS=1` (no Worker tool bridge)  
- Do **not** flip gateway on in prod until browser smoke  

### Docs audit

[`tasks/cloudflare/tests/pr-317-ac-f-merge-readiness-audit-2026-07-10.md`](tasks/cloudflare/tests/pr-317-ac-f-merge-readiness-audit-2026-07-10.md)

**Recommendation:** Merge when CI green; leave routing **`direct`** until marketing/operator chat is smoked with gateway on. Not merged by me.