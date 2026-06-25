---
parent: ipix-supabase
title: Edge Functions Inventory (iPix)
description: Canonical iPix edge functions — names, verify_jwt, auth, Gemini models. Updated post-PR#3 (2026-06-14).
load_when: edge function list, verify_jwt, deploy, brand-intelligence, audit-asset-dna
verified_at: 2026-06-24
---

# Edge functions — iPix (as-built + target)

**Status:** PLT-003 ✅ — functions exist under `supabase/functions/`.  
**Do not** treat Medellín/mde functions in Supabase MCP as iPix scope.

**Drift check:**

```bash
.claude/skills/ipix-supabase/scripts/verify-edge-inventory.sh
npm run supabase:verify-edge
```

Each deployed function needs a `[functions.<name>]` block in `supabase/config.toml`.

---

## Shipped (2026-06-14)

| Function | Model(s) | `verify_jwt` | Auth / notes |
|----------|----------|--------------|--------------|
| `health` | — | false | Public liveness |
| `edge-test` | `gemini-2.5-flash` | true | Authenticated Gemini smoke (replaces legacy `gemini-ping`) |
| `brand-intelligence` | `gemini-2.5-flash` | true | URL analysis + `responseSchema`; writes `brands`, `brand_scores`, `ai_agent_logs` |
| `capture-lead` | — | false | Public lead capture from chatbot (WEB-015.2, IPI2-161). Writes `chatbot_conversations`, `chatbot_messages`, `chatbot_events`, `lead_intake_drafts`. Rate-limited by anon_id + IP. |
| `start-brand-crawl` | — | true | IPI-24 — Firecrawl v2 crawl start; idempotent `brand_crawls` job; `ai_agent_logs` |
| `firecrawl-webhook` | — | false | IPI-24 — HMAC `X-Firecrawl-Signature`; `EdgeRuntime.waitUntil`; page upserts + job metrics |

**Shared modules:** `_shared/auth.ts`, `_shared/cors.ts`, `_shared/env.ts`, `_shared/response.ts`, `_shared/agent-log.ts`, `_shared/supabase-client.ts`, `_shared/firecrawl.ts`  
**Pending AI-009:** `_shared/gemini.ts` (central model registry + `generateStructured`)

**Secrets (edge only):** `GEMINI_API_KEY`, `FIRECRAWL_API_KEY`, `FIRECRAWL_WEBHOOK_SECRET`

**Slug note:** Docs/issues may say `enrich-brand` — **canonical slug is `brand-intelligence`**.

---

## MVP target (not shipped)

| Function | Spec | Model (target) | Notes |
|----------|------|----------------|-------|
| `audit-asset-dna` | AI-010, DNA-001 | `gemini-2.5-flash` → 3.5 at AI-018 | Vision + DNA pillars |
| `match-product-links` | AI-011 | tools + structured output | Mercur integration |

---

## Planned (post-MVP)

| Function | Spec | Notes |
|----------|------|-------|
| Mercur webhook receiver | COM-031 | Signature in-handler |
| Product link sync | COM-030 | Cron or manual |

---

## CORS (MVP)

Allow origins: `http://localhost:8080`, production Vite URL from env.

---

## When updating this file

1. Add `supabase/functions/<name>/index.ts`
2. Register in `supabase/config.toml`
3. Deploy: `supabase functions deploy <name> --linked`
4. Run `npm run supabase:verify-edge`
