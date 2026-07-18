# ADR — IPI-524 · SHOOT-ARCH-001 — Canonical Shoot Asset Ownership

**Status:** Accepted (2026-07-16)  
**Type:** Architecture Decision Record only — **no production schema changes in this ticket**  
**Linear:** https://linear.app/amo100/issue/IPI-524

---

## Context (live probes 2026-07-16)

| Fact | Value |
| --- | --- |
| `assets` | 26 total · **14** null `brand_id` · **16** with `shoot_id` · **6** shoot+null-brand |
| `public.shoots` | **12** rows · has `designer_id` · **no** `brand_id` |
| `shoot.shoots` | **0** rows · has `brand_id NOT NULL` |
| `assets.shoot_id` FK | → **`public.shoots`** (legacy; webhook documents this) |
| Library RLS | `assets_select_via_brand` (brand-scoped) |
| Realtime | `assets` / `cloudinary_assets` **not** in `supabase_realtime` |
| Webhook | Brand + campaign folders resolve; shoot folders → null brand (`see_ipi524`) |

---

## Decision

**Chosen: Option B (with a follow-up additive shoot brand link)**

```text
Organization → Brand → Asset   (authorization source of truth)
                 ↘
                  Shoot (optional link on assets.shoot_id → public.shoots)
```

### Authoritative `brand_id`

* **`assets.brand_id`** is the authorization source of truth for the Assets library and Cloudinary mirror RLS.
* Shoot does **not** replace brand for RLS.

### Asset ↔ shoot cardinality

* **Many assets → one shoot** via nullable `assets.shoot_id` (current FK).
* Do **not** require `shoot.shoot_assets` for Core.
* M2M / `shoot.shoot_assets` stays deferred unless a product need appears.

### Write ownership

| Writer | May set |
| --- | --- |
| `/api/assets/upload-sign` + webhook | `assets.brand_id` (brand/campaign folders); **not** invent shoot→brand until follow-up |
| Operator UI (post–IPI-433) | Brand-required upload; shoot link only after follow-up migration |
| Service role | Ingest / backfill only |
| Clients | Never bypass RLS |

### Canonical Realtime table (for IPI-281 follow-up)

* Publish **`public.assets`** (filter by `shoot_id` / `brand_id` in the client).
* Prerequisites: add to `supabase_realtime` publication + confirm RLS; index already exists (`idx_assets_shoot`).
* Do **not** publish `cloudinary_assets` as the primary gallery feed.

### Legacy schema disposition

| Schema | Disposition |
| --- | --- |
| `public.shoots` | **Canonical** for `assets.shoot_id` |
| `shoot.shoots` (+ empty related tables) | **Read-only / deprecated for Core** — do not migrate gallery to it while row count is 0 |
| Follow-up | Prefer `alter public.shoots add brand_id` (nullable → backfill → tighten) over cutover to `shoot.shoots` |

---

## Why not Option A alone?

Option A (“shoot owns brand”) would require a reliable `shoots.brand_id` before ingest can resolve shoot folders. That is valuable, but **library RLS already keys off `assets.brand_id`**. Choosing B first avoids dual-schema migration risk while unblocking brand-only uploads and search.

---

## Follow-up implement ticket (not this ADR)

Suggested name: **SHOOT-ARCH-002 — Apply shoot brand link + ingest resolution**

1. **Backfill plan** for 14 null-brand / 6 shoot-unresolved (from IPI-514 leftovers).
2. Add nullable `public.shoots.brand_id` → deterministic backfill → optional NOT NULL later.
3. Webhook: resolve `ipix/shoots/{id}/…` → `public.shoots.brand_id` → set `assets.brand_id` + `assets.shoot_id`.
4. Validation queries + dual-read checks.
5. Cutover: enable shoot-linked upload in IPI-433; shoot filters in IPI-435.
6. Realtime: `alter publication supabase_realtime add table public.assets;` after RLS review.
7. **Rollback:** stop shoot-folder brand writes; leave `shoots.brand_id` nullable; keep `assets.brand_id` SoT.
8. **Stop legacy writes:** no new code paths targeting `shoot.shoots` for Core.

---

## Impact on dependents

| Issue | Impact |
| --- | --- |
| **IPI-281** | Remains blocked until follow-up apply + Realtime publication |
| **IPI-433** | Brand-only uploads **unblocked**; shoot-linked stays gated on SHOOT-ARCH-002 |
| **IPI-443** | Completeness may join shoot optionally; brand SoT stays `assets.brand_id` |
| **IPI-514** | Leftover null-brand / shoot-unresolved disposition owned by follow-up backfill |
| **IPI-435** | Search proceeds with null-brand = hidden; shoot filters after follow-up |

---

## Options scored

| Criterion | A Shoot owns brand | B Asset brand SoT (chosen) |
| --- | --- | --- |
| RLS simplicity | Needs new shoot→brand policies | Matches current policies |
| Upload / webhook | Needs shoots.brand_id first | Works today for brand folders |
| Realtime gallery | Needs shoot brand + publication | Publish `assets` |
| Migration risk | High if moving to `shoot.shoots` | Low — additive on `public.shoots` |
| Orphan nulls | Still need backfill | Same; policy = hidden until backfill |

---

## Success criteria (this ADR)

- [x] Canonical path selected (B)
- [x] Authoritative `brand_id` named (`assets.brand_id`)
- [x] Cardinality named (many assets → one shoot)
- [x] Write ownership named
- [x] Realtime target named (`public.assets`)
- [x] Legacy disposition named
- [x] Migration / cutover / rollback sketched for follow-up
- [x] Zero production schema changes in this ticket

## References

* Supabase RLS · Realtime Postgres Changes · Postgres FK constraints · supabase-js  
* Repo: `app/src/app/api/assets/cloudinary/webhook/route.ts` (shoot folder deferral)  
* `tasks/cloudinary/ipi-514-reconcile-report.md`
