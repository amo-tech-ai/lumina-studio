# PR #279 — Workers AI URL fix verification

**PR:** https://github.com/amo-tech-ai/lumina-studio/pull/279  
**Issue:** IPI-454 AC-C  
**HEAD:** `dcbdf25b48c3f48e1b723c9fd9e68d8e4d2649b3`  
**Status:** MERGED  
**Verified:** 2026-07-08 (local re-run on merged branch)

---

## Test command

```bash
cd services/cloudflare-worker
npm test
```

## Test result

```
✓ src/providers/workers-ai.test.ts (9 tests)
✓ src/index.test.ts (5 tests)

Test Files  2 passed (2)
     Tests  14 passed (14)
  Duration  ~1.3s
```

**CI on merge commit:** app-build, supabase-web015, booking-gate — all green.

---

## Files reviewed

| File | Role |
|------|------|
| `services/cloudflare-worker/src/providers/workers-ai.ts` | URL helper + chat/stream/embed fetch paths |
| `services/cloudflare-worker/src/providers/workers-ai.test.ts` | Unit + HTTP mock tests |
| `services/cloudflare-worker/src/router.ts` | Env → `ProviderConfig` wiring |
| `services/cloudflare-worker/src/providers/provider.ts` | `ProviderConfig.accountId` type |

---

## URL routing (evidence)

`workersAiOpenAiBaseUrl()` branches on `baseUrl`:

| Mode | `baseUrl` example | Base returned | Final chat URL |
|------|-------------------|---------------|----------------|
| **1. Managed AI Gateway** | `https://gateway.ai.cloudflare.com/v1/{acct}/{gw}/openai` | as-is | `{base}/chat/completions` |
| **2. Custom gateway worker** | `http://127.0.0.1:8787` | `{base}/v1` | `{base}/v1/chat/completions` |
| **3. Direct Workers AI API** | `https://api.cloudflare.com/client/v4` | `{base}/accounts/{accountId}/ai/v1` | `{base}/accounts/{id}/ai/v1/chat/completions` |

### Snippet — URL helper

```typescript
// workers-ai.ts — workersAiOpenAiBaseUrl()
if (base.includes("gateway.ai.cloudflare.com")) {
  return base;  // mode 1
}
if (!base.includes("api.cloudflare.com/client/v4")) {
  return base.endsWith("/v1") ? base : `${base}/v1`;  // mode 2
}
// mode 3 — requires accountId
return `${base}/accounts/${accountId}/ai/v1`;
```

### Snippet — auth (token never in path)

```typescript
// workers-ai.ts — authHeaders()
Authorization: `Bearer ${config.apiKey}`

// chat / chatStream / embed all use:
fetch(`${workersAiOpenAiBaseUrl(config)}/chat/completions`, { headers: authHeaders(config) })
fetch(`${workersAiOpenAiBaseUrl(config)}/embeddings`, { headers: authHeaders(config) })
```

### Snippet — router env wiring

```typescript
// router.ts — getProviderConfig("workers-ai")
return {
  apiKey: env.CLOUDFLARE_API_TOKEN ?? "",
  accountId: env.CLOUDFLARE_ACCOUNT_ID ?? "",
  baseUrl: env.AI_GATEWAY_URL ?? "https://api.cloudflare.com/client/v4",
};
```

---

## Pass/fail checklist

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | API token never in URL path | **PASS** | Test: `does not put the API token in the URL path`; chat mock asserts `url.not.toContain("cf-api-token-secret")` |
| 2 | `CLOUDFLARE_ACCOUNT_ID` used for direct API URLs | **PASS** | Test: `builds OpenAI-compat base with account ID in path`; chat/embed HTTP mocks assert full `/accounts/{id}/ai/v1/...` path |
| 3 | Managed AI Gateway URLs used as-is | **PASS** | Tests: `uses managed AI Gateway URL as-is`; `does not append /accounts/`; chat mock → `{gateway}/chat/completions` |
| 4 | Custom worker URLs append `/v1` | **PASS** | Test: `uses /v1 suffix for custom gateway worker base URL` → `http://127.0.0.1:8787/v1` |
| 5 | Chat builds correct path | **PASS** | HTTP mock — direct API + gateway cases |
| 6 | Streaming builds correct path | **PASS*** | Code: `chatStream` uses same helper + `/chat/completions` as `chat`; no dedicated stream mock test |
| 7 | Embeddings build correct path | **PASS** | HTTP mock — `/ai/v1/embeddings` on direct API |
| 8 | Missing account ID → clear config error | **PASS** | Test: throws `/CLOUDFLARE_ACCOUNT_ID/` when direct API base and no `accountId` |
| 9 | Gateway mode works without account ID | **PASS** | Test: managed gateway URL with no `accountId` field |

\*Streaming verified by code inspection only; recommend adding a `chatStream` fetch mock in a follow-up if desired.

---

## Test coverage map

| Test name | Mode covered |
|-----------|--------------|
| `builds OpenAI-compat base with account ID in path` | Direct API (3) |
| `throws when CLOUDFLARE_ACCOUNT_ID is missing…` | Direct API error |
| `uses managed AI Gateway URL as-is without accountId` | Managed gateway (1) |
| `does not append /accounts/ to managed AI Gateway URLs` | Managed gateway (1) |
| `uses /v1 suffix for custom gateway worker base URL` | Custom worker (2) |
| `does not put the API token in the URL path` | All (token isolation) |
| `chat uses account ID in path and token in Authorization` | Direct API HTTP |
| `chat uses managed AI Gateway URL without account path` | Managed gateway HTTP |
| `embed uses account ID in embeddings path` | Direct API HTTP |

---

## Remaining risks

1. **No live integration test** — all evidence is unit/mock; no call to real Cloudflare API or deployed gateway worker.
2. **`chatStream` untested at HTTP layer** — same code path as chat; low risk but gap in test suite.
3. **Direct API default requires `CLOUDFLARE_ACCOUNT_ID`** — fails fast with clear error; embedding tier (only Workers AI tier today) will 500 at runtime if unset when using default `client/v4` base.
4. **Gateway detection is substring match** — `gateway.ai.cloudflare.com` in hostname; custom domains proxying to gateway not covered (out of scope).
5. **AC-F/G/I still open** — Mastra wire, KV registry, prod deploy not in this PR.

---

## Final verdict

**PASS** — PR #279 correctly fixes Workers AI OpenAI-compatible URL construction for all three deployment modes. Automated tests (14/14) and code review confirm token-in-header / account-in-path separation, gateway URL passthrough, and custom-worker `/v1` suffix. Safe to treat IPI-454 **AC-C** as done; follow-up work remains for Mastra integration and prod deploy.
