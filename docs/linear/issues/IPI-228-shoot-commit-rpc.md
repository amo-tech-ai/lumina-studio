## FIX · Phase 2.2 — Shoot commit via Next.js API + RPC (**Path B only**)

**Status:** ✅ **Done** — merged [PR #136](https://github.com/amo-tech-ai/lumina-studio/pull/136) @ `9de36a8` (2026-06-28)  
**Audit:** App F-003 · **Branch:** `ipi/shoot-commit-rpc`  
**Verification:** [docs/audit/june-28-audt.md](../../audit/june-28-audt.md) — **94/100**

**Locked path (shipped):**

```text
Browser → POST /api/shoots/commit → withOperatorAuth → commitShootDraft → service_role RPC commit_shoot_draft → shoot.*
```

**Follow-up (not IPI-228 scope):**
- Retire `supabase/functions/save-approved-shoot-draft/` → **IPI-231** edge inventory
- V-005 live wizard smoke → **IPI-233** (blocked by environment)

---

## Shipped evidence (2026-06-28, `main` @ `9de36a8`)

| Probe | Result |
| -- | -- |
| `app/src/app/api/shoots/commit/route.ts` | ✅ `withOperatorAuth`, validation, brand RLS, RPC |
| `app/src/lib/shoot/commit-shoot-draft.ts` | ✅ shared helper (route + Mastra) |
| `app/src/app/(operator)/app/shoots/new/page.tsx` | ✅ POST `/api/shoots/commit` |
| `app/src/mastra/tools/saveApprovedShootDraft.ts` | ✅ `commitShootDraft` — **no** `callEdgeFunction` |
| Route + lib tests | ✅ **10/10** (6 route + 4 lib) |
| CI | ✅ `app-build` + `supabase-web015` green on merge |
| Edge fn directory | ⏭️ corpse remains in repo → IPI-231 |

---

## RPC argument map (SSOT: `app/src/types/supabase.ts`)

| HTTP body field | RPC arg | Type |
| -- | -- | -- |
| `brand_id` | `p_brand_id` | uuid |
| `shoot_name` | `p_name` | text |
| `brief` | `p_brief` | text? |
| `channels` | `p_target_channels` | text[] |
| `approved_budget` | `p_estimated_budget` | numeric |
| `budget_breakdown` | `p_budget_breakdown` | jsonb? |
| (from operator) | `p_created_by` | uuid? |
| `deliverables[]` | `p_deliverables` | jsonb |
| `shots[]` | `p_shots` | jsonb |

RPC returns: `{ shoot_id: uuid }` (jsonb).

**Auth pattern:**
- Brand access → user-scoped Supabase client (RLS)
- `commit_shoot_draft` → service_role client only

---

## HTTP response contract

Success **201**: `{ "shoot_id": "<uuid>" }`

| Status | When |
| -- | -- |
| 401 | `withOperatorAuth` fails |
| 400 | invalid JSON / payload |
| 403 | brand not found or RLS denied |
| 500 | RPC failure |

---

## Acceptance criteria

- [x] Route handler with operator auth
- [x] Shared `commitShootDraft` lib (route + Mastra tool)
- [x] Wizard POSTs `/api/shoots/commit`
- [x] Mastra tool off edge fn
- [x] Unit tests 10/10
- [x] CI green on PR #136
- [ ] Edge fn directory deleted → IPI-231
- [ ] V-005 live smoke → IPI-233

**Blocked by:** IPI-225 ✅  
**Blocks:** IPI-231, IPI-232, IPI-233 (verification phase)
