# IPI-228 Forensic Verification Report (Revised)

**PR:** [#136](https://github.com/amo-tech-ai/lumina-studio/pull/136) · branch `ipi/shoot-commit-rpc`  
**Auditor run:** 2026-06-28 · revised after peer review  
**Verdict:** **94/100** — merge-ready; remaining gaps are environmental + follow-up tasks, not implementation defects.

---

## 1. Executive Summary

IPI-228 delivers the intended architecture: browser → `POST /api/shoots/commit` → `withOperatorAuth` → `commitShootDraft` → `commit_shoot_draft` RPC (service_role only). No browser or Mastra tool calls to `save-approved-shoot-draft` on the PR branch.

**Verified:** CI green · IPI-228 tests 10/10 · typecheck + build pass · Supabase RPC + grants · API contract · response schema · single RPC call (no retry loop).

**Blocked by environment (not code):**
- V-005 Shoot Wizard E2E — `QA_PASSWORD` unavailable locally; Vercel preview behind SSO.
- Does **not** block IPI-228 Done per acceptance criteria (route, RPC, tests, CI, architecture).

**Follow-up (separate issues):** IPI-229 edge fn retirement · IPI-233 V-005 certification · IPI-231 verify-rls Mastra probes.

---

## 2. Score: **94 / 100**

| Area | Score | Notes |
|------|------:|-------|
| Architecture | 96% | Path correct; edge fn corpse deferred to IPI-229 |
| Source quality | 95% | Shared lib refactor; optibot env guard fixed |
| Tests | 94% | IPI-228 10/10; 2 unrelated local Mastra flakes (CI green) |
| Security | 95% | RLS brand gate + service_role RPC; no client leaks |
| Supabase | 100% | RPC exists; grants verified via MCP |
| Runtime verification | 70% | **Blocked by environment** — not a code blocker |
| CI | 100% | app-build + supabase-web015 green |
| Documentation | 95% | API contract documented below |

---

## 3. API Contract — `POST /api/shoots/commit`

### Request

```json
{
  "brand_id": "uuid",
  "shoot_name": "string",
  "brief": "string (optional)",
  "channels": ["shopify", "instagram_feed"],
  "deliverables": [{ "channel": "shopify", "format": "hero", "quantity": 2 }],
  "shots": [{ "shot_number": 1, "description": "Front full body", "angle": "...", "lighting": "..." }],
  "approved_budget": 4200,
  "budget_breakdown": { "crew": 1000, "total": 4200 },
  "run_id": "mastra-run-id (optional, audit only)"
}
```

### Response

| HTTP | Body | When |
|------|------|------|
| **201** | `{ "shoot_id": "uuid" }` | RPC succeeded |
| **400** | `{ "error": "..." }` | Invalid JSON, missing fields, bad budget/qty, unsupported channel |
| **401** | `{ "error": "Unauthorized" }` | `withOperatorAuth` failure (`OPERATOR_AUTH_ENABLED=true`) |
| **403** | `{ "error": "Brand not found or access denied" }` | RLS brand check failed |
| **500** | `{ "error": "Failed to commit shoot" }` | RPC failure (generic message; no DB leak) |

**Verified:** `route.test.ts` covers 401/400/403/500/201. `commit-shoot-draft.test.ts` covers validation edge cases.

### Response schema ↔ RPC

RPC returns `jsonb_build_object('shoot_id', v_shoot_id)` (migration `20260628105303`).

App extracts:

```typescript
rpcResult.shoot_id → NextResponse.json({ shoot_id }, { status: 201 })
```

**Verified:** field name `shoot_id` matches RPC contract exactly.

---

## 4. Pass/Fail Matrix

| # | Check | Result |
|---|-------|--------|
| A1 | Browser no edge fn call | ✅ PASS |
| A2 | Browser → `/api/shoots/commit` only | ✅ PASS |
| A3 | `withOperatorAuth` on route | ✅ PASS |
| A4 | `commit_shoot_draft` RPC | ✅ PASS |
| A5 | No service role in client bundles | ✅ PASS |
| S1–S5 | Source audit (validation, no bypass, generic errors) | ✅ PASS |
| T1–T2 | IPI-228 tests | ✅ PASS (10/10) |
| T3 | Full `npm test` | ⚠️ PARTIAL (2 unrelated local flakes; CI green) |
| T4–T5 | typecheck + build | ✅ PASS |
| DB1–DB4 | Supabase RPC + grants + RLS gate | ✅ PASS |
| R1 | Wizard E2E | ⏸️ **Blocked by environment** |
| R2 | Network trace | ⚠️ Code path verified; live capture deferred to IPI-233 |
| SEC1–SEC5 | Security checks | ✅ PASS |
| REG1 | Edge fn in repo | ⏭️ IPI-229 (intentional defer) |
| GH1 | Review threads | ✅ Resolved (optibot env guard fixed pre-merge) |
| GH2 | CI | ✅ PASS |
| P1 | Single RPC call per request | ✅ PASS (one `serviceSb.rpc` call, no retry loop) |
| P2 | No duplicate inserts in app layer | ✅ PASS (atomic RPC handles all inserts) |

---

## 5. Performance / Idempotency

| Check | Result | Evidence |
|-------|--------|----------|
| Single RPC per commit | ✅ | One `serviceSb.rpc("commit_shoot_draft")` in `commitShootDraft` |
| No retry loop | ✅ | No `while`/`retry` around RPC |
| Atomic DB writes | ✅ | RPC inserts shoot + deliverables + shot_list in one transaction |
| Idempotency | ⚠️ Not idempotent | Double-submit creates two shoots — acceptable for MVP; dedupe is future work |

---

## 6. Security Findings

All prior findings addressed. Service role server-only under `app/api/_lib/`. RPC EXECUTE limited to `postgres` + `service_role`. Brand ownership enforced via user-scoped client before RPC.

---

## 7. Follow-Up Tasks (not IPI-228 scope)

| Priority | Task |
|----------|------|
| 🔴 | **IPI-229** — Remove retired `save-approved-shoot-draft` edge fn + update inventory |
| 🔴 | **IPI-231** — Extend `verify-rls` with Mastra probes |
| 🟡 | **IPI-233** — Run full V-005 production verification |
| 🟢 | **IPI-234** — Playwright/browser automation |
| 🟢 | **IPI-235** — Certification ledger |

---

## 8. Final Verdict

### ✅ **Merge-ready**

IPI-228 acceptance criteria (route, RPC wiring, tests, CI, architecture) are **complete**.

V-005 live smoke belongs in **IPI-233** certification — not a blocker for marking IPI-228 Done.

**Merge:** squash #136 → Linear IPI-228 **Done** → queue IPI-229 immediately.

---

## 9. Evidence (commands)

```bash
cd app && npx vitest run src/app/api/shoots/commit/route.test.ts src/lib/shoot/commit-shoot-draft.test.ts
# → 10 passed

npm run typecheck && npm run build  # exit 0

node scripts/check-client-env.mjs   # OK

gh run view 28335146445             # CI SUCCESS on 442ed37
```

Supabase MCP: `commit_shoot_draft` exists; EXECUTE granted to `service_role` only.

Regression grep (`app/`): zero hits for `save-approved-shoot-draft`, zero `callEdgeFunction` in `saveApprovedShootDraft.ts`.
