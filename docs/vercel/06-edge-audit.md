> **Status: ALL CRITICAL ISSUES FIXED — 2026-06-24.** `capture-lead` v3 deployed. See resolution column below.

## Audit verdict

Good foundation, but **not production-safe yet**.

### Critical blockers

| # | Red flag                                         | Why it matters                                                                      | Fix                                                                  |
| - | ------------------------------------------------ | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 1 | `claimToken` returned by public edge fn          | `verify_jwt=false` means anyone can call the edge fn directly and receive the token | Only return `claimToken` when request has a server-only proxy secret |
| 2 | No idempotency / upsert                          | Re-submit creates duplicate drafts                                                  | Upsert by `conversation_id`, `anon_id`, or normalized `email`        |
| 3 | `conversation_id` not verified against `anon_id` | User could attach lead to another conversation if ID leaks                          | Check `chatbot_conversations.anon_id === payload.anon_id`            |
| 4 | Rate limit is in-memory                          | Serverless instances reset; easy to bypass                                          | Use DB-backed rate limit or Supabase table/RPC                       |
| 5 | `ALLOWED_ORIGINS` optional defaults open         | If env missing, any origin can call it                                              | Require allowed origins in production                                |
| 6 | Token stored plaintext                           | DB leak = claim tokens usable                                                       | Store hashed token; cookie holds raw token                           |

### Important fixes

```ts
// Require proxy secret before returning claimToken
const proxySecret = req.headers.get("x-ipix-proxy-secret");
const isTrustedProxy =
  proxySecret && proxySecret === Deno.env.get("CAPTURE_LEAD_PROXY_SECRET");

return jsonResponse({
  draftId: draft.id,
  status: draft.status,
  ...(isTrustedProxy ? { claimToken } : {}),
});
```

Also reject direct public calls in production if this function is only meant to be called by `/api/marketing-lead`:

```ts
if (!isTrustedProxy) {
  return errorResponse("forbidden", "Use marketing lead proxy", 403);
}
```

### Missing pieces

| Missing                         | Needed                                                      |
| ------------------------------- | ----------------------------------------------------------- |
| `brand_url` validation          | Must be valid URL                                           |
| `lead_answers` value validation | Ensure object values are strings / safe JSON                |
| Email normalization             | `email.trim().toLowerCase()`                                |
| Payload size fallback           | If no `content-length`, still enforce max after reading     |
| Event failure handling          | Decide if `lead_captured` event failure should block or not |
| Tests                           | Direct edge call must **not** expose `claimToken`           |

### Best next fixes

1. Add `CAPTURE_LEAD_PROXY_SECRET`.
2. Make `/api/marketing-lead` send that header.
3. Edge returns `claimToken` only to trusted proxy.
4. Add idempotent upsert.
5. Validate `conversation_id` belongs to `anon_id`.
6. Deploy edge function again.
