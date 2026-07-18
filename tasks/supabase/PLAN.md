# Supabase — Domain plan (PRD + roadmap)

**Updated:** 2026-07-18  
**Authority:** Linear · progress [`todo.md`](./todo.md) · long-form supporting: [`../prime/supabase-plan.md`](../prime/supabase-plan.md) (when present)

## Linear (active)

| Surface | Link |
|---------|------|
| **Project** | [AI Platform — AI Infrastructure](https://linear.app/amo100/project/ai-platform-ai-infrastructure-7d08f8bb3ff2) |
| **Overview** | [Supabase — Overview](https://linear.app/amo100/document/supabase-overview-ffc91c6eb2d0) |
| **Product Plan and Roadmap** | [Supabase — Product Plan and Roadmap](https://linear.app/amo100/document/supabase-product-plan-and-roadmap-d0513138ffae) |
| **Progress Tracker** | [Supabase — Progress Tracker](https://linear.app/amo100/document/supabase-progress-tracker-7be6e298d8ff) |

### Related active issues

- [IPI-692 · SB-EDGE-008 — Make Firecrawl webhook workflow resume idempotent](https://linear.app/amo100/issue/IPI-692)
- [IPI-680 · SB-SEC-002 — Disable or scope pg_graphql](https://linear.app/amo100/issue/IPI-680)
- [IPI-684 · SB-SEC-001b — Revoke default EXECUTE](https://linear.app/amo100/issue/IPI-684)
- [IPI-693 · SB-EDGE-009 — Per-brand crawl quotas](https://linear.app/amo100/issue/IPI-693)


## Purpose

Keep the remote Supabase project (`nvdlhrodvevgwdsneplk`) correct, secure, and Edge-hardened for Brand Intelligence, CRM, assets, and Mastra-adjacent storage — while gradually routing Edge LLM calls through Cloudflare AI Gateway.

## Goals

1. Harden Edge functions (auth, idempotency, quotas, inventory).
2. Close security gaps (GraphQL exposure, default EXECUTE, JWT probes).
3. Keep CI linked gates green (migrations, RLS, types).
4. Hand LLM traffic to Cloudflare Gateway REST without a custom Worker rewrite.

## Scope

| In | Out |
|----|-----|
| Migrations, RLS, Edge Functions, CI verify scripts | OpenNext Worker hosting (cloudflare/) |
| BI crawl / Firecrawl webhook path | Mercur Postgres |
| Edge → AI Gateway REST canary | Design prototypes |

## Current state

- Platform MVP schema + CRM tables live on remote.
- Edge harden wave partially shipped (capture-lead, edge-test).
- **IPI-692** Firecrawl webhook idempotency is the critical next merge/deploy.
- Security: **IPI-680 / IPI-684** High — still open.
- **IPI-690** Done with **no-rotate** exception (document checklist, not “fixed”).

## Target architecture

```text
Operator app / Edge Functions
  → Supabase Auth + RLS (tenant isolation)
  → Edge: brand-intelligence, firecrawl-webhook, capture-lead, audit-asset-dna, …
  → (canary) Cloudflare AI Gateway REST → providers
```

## Workstreams

| Stream | Focus |
|--------|--------|
| Edge harden | SB-EDGE-* idempotency, quotas, inventory |
| Security | GraphQL, EXECUTE grants, JWT probes |
| CI / tests | Linked drift, Deno tests, RLS verify |
| CF handoff | IPI-694 / 697 / 699 (owned with cloudflare/) |

## Feature tables

### Core features

| Feature | Who / why | Real-world example | Related tasks |
|---------|-----------|-------------------|---------------|
| Firecrawl webhook idempotency | BI crawl resume safe | Duplicate webhook doesn't double-write | [IPI-692 · SB-EDGE-008 — Make Firecrawl webhook workflow resume idempotent](https://linear.app/amo100/issue/IPI-692) |
| capture-lead harden | Marketing lead form | Origin allowlist + rate limit | [IPI-685 · SB-EDGE-002](https://linear.app/amo100/issue/IPI-685) |
| RLS verification | Multi-tenant safety | Brand A can't see Brand B assets | [IPI-668 · SB-TEST-001](https://linear.app/amo100/issue/IPI-668) |
| Linked migration CI | Prevent schema drift | `supabase:verify` in CI | [IPI-665 · SB-CI-001](https://linear.app/amo100/issue/IPI-665) |

### Advanced features

| Feature | Who / why | Real-world example | Related tasks |
|---------|-----------|-------------------|---------------|
| Crawl quotas | Cost control | Per-brand daily page caps | [IPI-693 · SB-EDGE-009](https://linear.app/amo100/issue/IPI-693) |
| Edge LLM via Gateway | Unified AI ops | BI Gemini via `ipix-prod` | [IPI-694 · CF-EDGE-AI](https://linear.app/amo100/issue/IPI-694) |
| pgTAP suite | Stronger SQL tests | Disposable DB in CI | [IPI-704 · SB-TEST-002](https://linear.app/amo100/issue/IPI-704) (parked) |
| Backup restore drill | Ops resilience | Documented restore | [IPI-70 · PLT-008](https://linear.app/amo100/issue/IPI-70) |

## Dependencies

- Cloudflare domain for Gateway REST / canary (IPI-697/699).
- Prime domain for session ordering of the same tickets.
- Cloudinary webhooks hit Next.js routes (not Edge) for asset mirrors.

## Risks

| Risk | Mitigation |
|------|------------|
| Marking Edge Done without deploy | Require `supabase functions deploy` + verify-edge |
| GraphQL left open | IPI-680 before broad anon use |
| Rotating Gemini without need | IPI-690 exception checklist |

## Success criteria

- [ ] IPI-692 merged + deployed with linked-gates green
- [ ] IPI-680 / IPI-684 closed or accepted with evidence
- [ ] Edge inventory CI gate live
- [ ] Gateway REST canary path documented with rollback (IPI-699)

## Roadmap

```text
1. IPI-692 · SB-EDGE-008 — merge + deploy firecrawl-webhook
2. IPI-680 · SB-SEC-002 — GraphQL exposure
3. IPI-684 · SB-SEC-001b — default EXECUTE
4. IPI-693 · SB-EDGE-009 — quotas (after 692)
5. IPI-694 → IPI-697 → IPI-699 — Gateway REST + canary (with cloudflare/)
6. IPI-70 restore drill · IPI-682 advisor · parked DNA/pgTAP
```
