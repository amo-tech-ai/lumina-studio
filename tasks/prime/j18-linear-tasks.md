# iPix Linear Forensic Cleanup — Audit v3 Report

**Pass date:** 2026-07-18 (audit v3 — Linear MCP description rewrites + forensic comments)  
**Prior passes:** second forensic pass + stale closes ([Linear stale task cleanup](4aa10f2c-380b-4b28-8044-0067e5fa7676))  
**Prompt SSOT:** [`j18-linear-prompt.md`](./j18-linear-prompt.md)  
**Queue SSOT:** [`todo`](./todo)

Do not trust prior audit scores without re-check. This file is the live SSOT after audit v3 corrections.

---

## 1. Final grading table

| Dimension | Score | Verdict |
| --- | ---: | --- |
| **Report correctness** | **90/100** | 🟢 Live Advisor + Linear + PR #470 evidence aligned |
| **Efficiency** | **82/100** | 🟢 Lean order clear; parallel 697∥693 after 692 deploy |
| **Public production readiness** | **58/100** | 🔴 Not production-ready — seven gates remain |

### Supporting area scores (unchanged live baseline)

| Area | Score | Notes |
| --- | ---: | --- |
| CI and automated testing | 86 | Edge Deno + inventory + RLS; linked-gates flake on open PRs |
| Edge harden wave | 82 | Mostly Done; **IPI-692** In Review, not deployed |
| Supabase security | 58 | GraphQL 79 anon + 107 auth; DEFINER EXECUTE 10+34 |
| Cloudflare Edge AI Phase A | 52 | Plan correct; **IPI-697/699** not runtime-proven |
| Monitoring / cost / recovery | 48 | Canary thresholds now specified; restore drill attached to **IPI-70**; spend metadata fields locked |
| Assets / media backlog hygiene | 72 | SCR-08 Done; umbrellas cleaned; CLD-004/012 held |

**Internal / controlled QA:** viable.  
**Public production:** blocked by the seven gates in §8.

---

## 2. Missing items closed by audit v3

| Gap | Resolution |
| --- | --- |
| Managed spend metadata (max 5 fields) | **IPI-460** — `organization_id`, `brand_id`, `environment`, `feature`, `request_type` |
| Canary thresholds | **IPI-699** measurable gates table |
| **IPI-690** exception fields | Formal checklist (owner, review date, restrictions, alert, evidence, emergency rotate) — status still Done |
| Restore drill | Attached to **IPI-70 · PLT-008** (no separate ticket existed) |

---

## 3. Efficient execution order (audit v3)

```text
 1. #470 / IPI-692 — fix supabase-linked-gates → merge when green (do not auto-merge)
 2. Ops — db push + deploy firecrawl-webhook (after merge)
 3. IPI-680 — GraphQL (verify usage → disable or revoke grants)
 4. IPI-684 — default EXECUTE revoke + NEW-fn regression
 5. IPI-697 — CF Gateway REST + BI (no custom Worker; no canary in same PR)
 6. IPI-693 — atomic crawl quota RPC (after 692 deploy; CF AI spend ≠ Firecrawl)
 7. IPI-699 — secrets + canary + rollback (ops-only; measurable gates)
 8. IPI-460 — managed spend limits + 5 metadata fields (no Supabase collector MVP)
 9. IPI-70 — documented backup restore drill
10. IPI-682 — Advisor ranking by frequency/p95/lock/tenant
11. IPI-502 — CF journey rerun after 699 (baseline now OK)
12. IPI-690 — fill formal exception checklist (status stays Done; human decision)
```

Parked / later: **IPI-698** DNA eval · **IPI-455** cancel-gate after 699 · **IPI-704** pgTAP (clean local OR disposable DB) · **IPI-675/676** CI hygiene.

---

## 4. Issues touched this pass (audit v3)

| Issue | What changed |
| --- | --- |
| **IPI-690 · SB-EDGE-007 — Assess GEMINI_API_KEY Exposure…** | Description + comment: formal exception checklist; **status unchanged Done** |
| **IPI-692 · SB-EDGE-008 — Make Firecrawl webhook…** | Comment only: PR #470 open; no merge until linked-gates green |
| **IPI-693 · SB-EDGE-009 — Add per-brand crawl quotas…** | Description + comment: one atomic RPC; CF AI spend ≠ Firecrawl |
| **IPI-680 · SB-SEC-002 — Disable or scope pg_graphql…** | Description + comment: verify GraphQL usage first; Approach order |
| **IPI-684 · SB-SEC-001b — Revoke default EXECUTE…** | Comment: NEW function without GRANT regression AC |
| **IPI-697 · CF-EDGE-003 — Add Cloudflare AI Gateway REST…** | Description + comment: REST / `cloudflare/ai` only; no custom Worker |
| **IPI-699 · CF-EDGE-005 — Edge secrets + canary…** | Description + comment: measurable canary thresholds table |
| **IPI-460 · CF-AI-010 — AI Cost Tracking…** | Description + comment: managed spend + 5 metadata fields first |
| **IPI-698 · CF-EDGE-004 — DNA vision evaluation…** | Comment: availability ≠ DNA parity |
| **IPI-502 · CF-UJ-002 — Journey test: AI Brand Intelligence** | Comment: baseline now; CF after 699 |
| **IPI-704 · SB-TEST-002 — pgTAP suite…** | Description + comment: clean local OR disposable DB (not PLT-010-only) |
| **IPI-675 · SB-CI-001c — Types-after-apply…** | Comment: disposable DB; never shared-prod apply-before-merge |
| **IPI-676 · SB-CI-001d — Orphan migration allowlist…** | Description + comment: permanent forbidden; owner + explanation + incident + auto expiry |
| **IPI-455 · CF-EDGE-B — Phase B Worker port…** | Comment: parked; cancel when 699 proves REST |
| **IPI-682 · SB-PERF-001 — Prioritize DB Advisor…** | Description + comment: rank by frequency/p95/lock/tenant |
| **IPI-70 · PLT-008 — Production Backup Strategy** | Description + comment: restore drill checklist; title normalized |

### Held (not changed)

| Item | Why held |
| --- | --- |
| Merge PR [#470](https://github.com/amo-tech-ai/lumina-studio/pull/470) | Explicit: do not merge; linked-gates must pass |
| Mark **IPI-692** Done | Not Production Verified |
| Cancel **IPI-680** / **IPI-684** | Open security work — do not cancel |
| Change **IPI-690** status | Human final Done (no-rotate) — only exception fields strengthened |
| Cancel **IPI-60 / IPI-67** Cloudinary | Insufficient evidence (prior hold) |

---

## 5. Red flags table

| # | Finding | Evidence | Severity |
| --- | --- | --- | --- |
| 1 | Gemini key exposed historically; Done no-rotate | **IPI-690** — exception checklist incomplete | 🔴 Exception |
| 2 | Anon GraphQL tables exposed | Advisor: **79** `pg_graphql_anon_table_exposed` | 🔴 |
| 3 | Authenticated GraphQL tables exposed | Advisor: **107** | 🔴 |
| 4 | DEFINER EXECUTE still wide | Advisor: anon **10** · auth **34** | 🔴 |
| 5 | Webhook resume not Production Verified | PR [#470](https://github.com/amo-tech-ai/lumina-studio/pull/470) open; `supabase-linked-gates` **FAILURE**; not deployed | 🔴 |
| 6 | Unbounded Firecrawl cost | **IPI-693** open; CF AI spend does not cap Firecrawl | 🔴 |
| 7 | CF canary / rollback unproven | **IPI-697** → **IPI-699** open | 🔴 |
| 8 | Backup restore unverified | Drill checklist now on **IPI-70**; not yet executed | 🔴 |
| 9 | Vercel preview rate-limit noise | #470 Vercel statuses FAILURE (upgradeToPro) | 🟡 Noise |
| 10 | Formal risk acceptance blanks | **IPI-690** owner / review date still human | 🟡 Ops |

---

## 6. Correct dependency graph

```text
CF Phase A
  IPI-694 (epic)
    → IPI-695 ADR ✅ Done
    → IPI-697 CF-EDGE-003 (REST + BI) ⚪
      → IPI-699 CF-EDGE-005 (canary/rollback) ⚪
        → IPI-502 Cloudflare rerun
        → IPI-698 DNA eval
        → IPI-455 cancel-gate
        → IPI-460 managed spend metadata (parallel-ok after Gateway traffic)

Edge harden
  IPI-667 ✅ → IPI-689 ✅
  IPI-685 ✅ → IPI-688 ✅
  IPI-686 ✅
  IPI-692 🔵 In Review (#470) → deploy → IPI-693 quotas

Security wave
  IPI-681 ✅ → IPI-680 (GraphQL High) — verify usage first
  IPI-679 ✅ → IPI-684 (default EXECUTE High) — NEW-fn regression

Recovery
  IPI-70 restore drill (PITR + isolated restore)

pgTAP
  clean local OR disposable DB → IPI-704 (parked; PLT-010 optional)
```

---

## 7. Official-first implementation table

| Concern | Managed / official first | Custom only if |
| --- | --- | --- |
| Edge LLM | Cloudflare AI Gateway REST + Workers AI (`/ai/v1/chat/completions`, `cf-aig-gateway-id`) or `cloudflare/ai` | Custom Worker after **IPI-699** gap evidence |
| Cost / observability | Gateway spend limits + analytics by ≤5 metadata fields | Supabase ledger only if permanent product need |
| DNA vision | Eval Workers AI multimodal vs Gemini after BI canary | Port DNA Edge only after quality proof |
| Webhook dedup | Atomic DB claim table + Edge handler | — |
| Crawl cost | Product limits + atomic RPC (not CF AI spend) | — |
| GraphQL | Verify usage → disable or revoke grants | Document residual Advisor WARNs |
| Function EXECUTE | `ALTER DEFAULT PRIVILEGES … REVOKE EXECUTE` + NEW-fn test | — |
| Types CI | Disposable branch/test project | Never shared-prod apply-then-types |
| Backup | Managed PITR + documented restore drill (**IPI-70**) | — |
| pgTAP | Clean local **or** disposable DB | PLT-010 squash optional |

---

## 8. Production-readiness percentage

**Public production readiness: 58/100 — not ready.**

Must remain unresolved-or-exceptioned before claiming ready:

1. Exposed credential: rotate **or** complete formal exception checklist — **IPI-690** (status Done; checklist incomplete)
2. Anonymous/authenticated GraphQL exposure — **IPI-680**
3. Unsafe default function execution — **IPI-684**
4. Duplicate webhook resume — **IPI-692** merge + migrate + deploy ([#470](https://github.com/amo-tech-ai/lumina-studio/pull/470))
5. Unbounded Firecrawl cost — **IPI-693**
6. Unverified backup restore — **IPI-70** drill not yet run
7. Cloudflare canary and rollback — **IPI-697** → **IPI-699**

---

## 9. Remaining security exception — IPI-690

### **IPI-690 · SB-EDGE-007 — Assess GEMINI_API_KEY Exposure…**

| Item | Status |
| --- | --- |
| Exposure occurred | ✅ Confirmed |
| Linear status | **Done (no-rotate)** — **unchanged this pass** |
| Formal risk acceptance | ⚠️ Checklist fields required (owner, review date, restrictions, billing alert, evidence absent, emergency rotate) |
| Framing | **Accepted risk, not a completed security fix** |
| Google best practice | Still rotate + delete old key |
| Choice A | Rotate + revoke + update Edge/Infisical secrets |
| Choice B | Accept risk with full checklist filled |

Do not paste keys into Linear, logs, commits, or this file.

---

## 10. GitHub PR plan (one concern each)

| Order | Concern | Issue | Notes |
| ---: | --- | --- | --- |
| 1 | Fix linked-gates / merge webhook dedup | **IPI-692** | [#470](https://github.com/amo-tech-ai/lumina-studio/pull/470) — do not auto-merge |
| 2 | Ops: `db push` + deploy `firecrawl-webhook` | **IPI-692** | After merge |
| 3 | GraphQL anon scope/disable | **IPI-680** PR1 | Verify usage first |
| 4 | GraphQL authenticated wave | **IPI-680** PR2 | Same issue, separate PR |
| 5 | Default EXECUTE revoke + NEW-fn regression | **IPI-684** | |
| 6 | Gateway REST client + BI wire | **IPI-697** | No prod canary in same PR |
| 7 | Secrets + canary + rollback | **IPI-699** | Measurable gates |
| 8 | Crawl quotas RPC | **IPI-693** | After 692 deploy |
| 9 | Docs-only: preserve `tasks/prime/**` | — | Separate from code |

---

## 11. Verification evidence and commands

```bash
# Advisor (MCP already: 272 lints — GraphQL + DEFINER dominant)
npm run supabase:verify-edge
npm run supabase:verify-edge-unit
infisical run --env=dev -- npm run supabase:verify-rls

# PR #470 — do not merge until supabase-linked-gates passes
gh pr view 470 --json state,statusCheckRollup,url

# After IPI-692 merge
supabase db push
supabase functions deploy firecrawl-webhook --linked
```

| Task | Verification level now |
| --- | --- |
| **IPI-692** | Unit Verified (Deno); CI partial; **not** Remote/Production |
| **IPI-697/699** | Spec + canary gates defined; not runtime-proven |
| **IPI-680/684** | Advisor baseline; open High |
| **IPI-70** | Drill checklist documented; not executed |

---

## 12. Canceled / duplicate / parked (prior + hold)

| Issue | Disposition | Into / notes |
| --- | --- | --- |
| **IPI-456 / 61 / 282** | Duplicate / Canceled | **IPI-698** |
| **IPI-239** | Canceled | **IPI-667** + **IPI-689** |
| **IPI-683** | Duplicate / Canceled | **IPI-680** |
| **IPI-69** | Duplicate / Canceled | **IPI-682** |
| **IPI-248** | Duplicate / Canceled | **IPI-404** |
| **IPI-250** | Duplicate / Canceled | **IPI-405 · SCR-09** |
| **IPI-455** | Parked · Low | Cancel if **IPI-699** proves REST |
| **IPI-698** | Parked (eval) | After **IPI-699** |
| **IPI-704** | Parked | Clean local **or** disposable DB |
| **IPI-690** | Done (exception) | No-rotate; formal checklist incomplete |

---

## Live inventory snapshot (2026-07-18)

| Source | Fact |
| --- | --- |
| Supabase Advisor | 272 lints: GraphQL anon 79 · auth 107 · DEFINER anon 10 · auth 34 |
| Edge inventory CI | **IPI-689** Done (#463) |
| Webhook idempotency | **IPI-692** In Review [#470](https://github.com/amo-tech-ai/lumina-studio/pull/470) |
| Assets `/app/assets` | Real workspace (**IPI-404** Done) |
| CF Phase A | **IPI-694** epic; implement **IPI-697** → prove **IPI-699** |
| Restore drill | Checklist on **IPI-70 · PLT-008** |

---

## Next actions (ordered — matches §3)

```text
1. Babysit #470 — fix linked-gates → merge when green → push + deploy firecrawl-webhook
2. IPI-680 GraphQL (verify usage first)
3. IPI-684 default EXECUTE + NEW-fn regression
4. IPI-697 CF Gateway REST+BI (no custom Worker)
5. IPI-693 quotas after 692 deploy
6. IPI-699 canary (measurable gates)
7. IPI-460 managed spend metadata (5 fields)
8. IPI-70 restore drill
9. IPI-682 Advisor ranking
10. IPI-502 CF journey after 699
11. Fill IPI-690 exception checklist (status stays Done)
12. Docs-only PR for untracked tasks/prime/** when ready
```
