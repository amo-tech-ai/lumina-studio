# 06 — Campaigns / RLS audit

**Scope:** IPI-268 campaigns schema. Real auth-session RLS verification gap.

## Verdict: 🟡 88/100 — Schema solid, but RLS lacks real auth-session testing

## Key findings

| Area | Grade | Evidence |
|------|-------|----------|
| Campaigns table + enum | 🟢 | Created, verified on remote |
| Campaign deliverables | 🟢 | Created, FK to campaigns |
| RLS policies | 🟢 | 8 policies, TO authenticated |
| FK repair (crm_deals.campaign_id) | 🟢 | Composite FK (org_id, id) ON DELETE SET NULL |
| Triggers (updated_at, org consistency) | 🟢 | 3 triggers verified on remote |
| Indexes | 🟢 | 4 named indexes verified |
| verify-rls probes | 🟢 | All green |
| Type generation | 🟢 | 35 campaign references in types |
| **Real auth-session RLS test** | 🔴 | **No test with real JWT + auth.uid() session** |

## RLS gap

The IPI-268 verification used `supabase db query` with service-role, not a real user session. The RLS policies work correctly (tested via SQL), but there's no automated test that exercises them with an actual JWT-authenticated session.

## Recommended action

Add a user-scoped RLS test script that:
1. Creates a test auth user via Auth Admin API
2. Executes SELECT/INSERT/UPDATE via user-scoped client
3. Verifies cross-org isolation
4. Verifies brand-owner UPDATE gate on campaigns
