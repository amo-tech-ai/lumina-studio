---
id: SHOOT-PRE-001
title: "D-1 Schema Decision — New AI-native tables vs migrate FashionOS shoots"
status: "SIGNED OFF — Option A (new AI-native tables)"
date: "2026-06-22"
owner: "Tech Lead / Backend"
blocks: IPI2-117 (SHOOT-UX-008 — Shoot Data Model + RLS)
---

# SHOOT-PRE-001 — Schema Decision

## Problem

The legacy FashionOS `shoots` table exists in the migration history. It uses `designer_id` as its primary FK, meaning it was designed around a freelance designer model, not the iPix operator/brand model.

iPix's operator app scopes everything through `brands.user_id`. The HITL spine (`brand_intake_drafts`, and now `shoot_intake_drafts`) uses `brand_id → brands.id`. There is no `brand_users` join table in the iPix platform schema.

**The conflict:** Reusing the FashionOS `shoots` table would either:
1. Require adding `brand_id` alongside `designer_id` — polluting the schema with two competing ownership semantics.
2. Require a destructive migration that wipes `designer_id` — risk if legacy data needs to be preserved.

---

## Options

### Option A — New AI-native tables (recommended)

Create fresh tables: `shoots(brand_id)`, `shoot_deliverables`, `shot_deliverable_links`, `shoot_intake_drafts`, `shoot_assets`, `shoot_crew`.

All tables use `brand_id → brands.id` as the ownership anchor. RLS policies scope through `brands.user_id = auth.uid()`. No legacy semantics.

**Pros:**
- Clean FK semantics from day one
- No risk of legacy data contamination
- Deliverables-first architecture baked in from the start
- RLS is consistent with `brand_intake_drafts` and the rest of the iPix platform

**Cons:**
- Any legacy FashionOS shoot data is not automatically migrated (may not matter for MVP)

### Option B — Extend FashionOS `shoots` table

Add `brand_id uuid references brands(id)` to the existing table; make `designer_id` nullable; backfill where possible.

**Pros:** Preserves any historical records.

**Cons:**
- Two ownership columns (`designer_id`, `brand_id`) with unclear priority
- RLS becomes ambiguous — which column gates access?
- New tables (`shoot_deliverables`, `shoot_intake_drafts`) must still be created fresh anyway
- Higher migration risk; `designer_id` semantics may bleed into new code

---

## Decision

**[x] Option A — New AI-native tables** ← Recommended

**[ ] Option B — Extend existing table**

**Decided by:** Sanjiv Khullar  
**Date:** 2026-06-22  
**Rationale:** iPix ownership is brand-scoped (`brands.user_id`); the FashionOS `designer_id` model is incompatible and would make RLS ambiguous. New `brand_id`-anchored tables give clean FK semantics consistent with `brand_intake_drafts`, with no legacy-data contamination risk. Legacy `shoots` table left read-only for a future cleanup migration.

---

## If Option A is chosen

Proceed to IPI2-111 with the schema in `docs/shoot/12-shoot-schema.md`. All new tables use `brand_id` FK. Legacy `shoots` table is left in place (read-only) and can be dropped in a future cleanup migration after confirming no active references.

## If Option B is chosen

Update `docs/shoot/12-shoot-schema.md` to reflect the backfill migration plan before IPI2-111 is started. Document which RLS policy wins and how `designer_id` is nulled.

---

## References

- `docs/shoot/12-shoot-schema.md` — full schema spec
- `docs/shoot/shoot-system-plan.md §2` — architecture summary
- `supabase/migrations/` — FashionOS-era `shoots` table history
- `docs/prd/shoot-prd.md §9` — canonical schema requirements
