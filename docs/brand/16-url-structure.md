# Brand Hub URL Structure — Recommendation
**Date:** 2026-06-24  
**Context:** Current route is `/app/brand/[id]` (raw UUID). Three alternatives evaluated.

---

## Current state

```
/app/brand/00000000-0000-0000-0000-000000000000
```

- UUID exposes internals, unfriendly for sharing, no human-readable context.
- No org layer in the URL — blocks future multi-brand / multi-org routing.

---

## Options evaluated

### Option A — `/app/brands/[brandSlug]`

```
/app/brands/maison-lumiere-a3f2k
```

**Pros:** Clean, shareable, no UUID exposure.  
**Cons:** Slug must be globally unique (or scoped to user); slug renames require redirects; slug lookup adds a DB query on every request.  
**Schema change:** Add `slug` column to `brands`, unique constraint, index. `slugify()` already exists in `onboarding.ts`.  
**Migration risk:** Low — additive column, backfill with existing `name` + random suffix.

---

### Option B — `/app/brands/[brandId]-[slug]` (recommended)

```
/app/brands/b1a2c3d4-maison-lumiere
```

**Pros:** UUID is the authoritative key (no slug-rename pain), slug is cosmetic only (ignored or used for display). Works immediately with existing IDs — just pad a `-slug` suffix. No global uniqueness constraint needed.  
**Cons:** URL is longer; UUID still visible (acceptable — not a secret).  
**Schema change:** Add `slug` column to `brands` (nullable, non-unique). Route reads `params.brandId` (first segment before `-`) and ignores the rest.  
**Migration risk:** Very low — slug is purely cosmetic, existing `/app/brand/[id]` links redirect to `/app/brands/[id]-[slug]`.

---

### Option C — `/app/orgs/[orgSlug]/brands/[brandSlug]`

```
/app/orgs/maison-group/brands/maison-lumiere
```

**Pros:** Models the org layer explicitly; correct when one operator manages many brands.  
**Cons:** Requires org slug (must be unique); two slug lookups per request; current onboarding wires org invisibly — surfacing it changes UX. Premature for single-brand MVP.  
**Schema change:** Add `slug` to `organizations`, add `slug` to `brands`. Both unique within org.  
**Migration risk:** Medium — two new required slugs, org concept is not currently exposed in the UI.

---

## Recommendation: Option B

Use `/app/brands/[brandId]-[slug]`.

- Smallest diff: add a non-unique nullable `slug` to `brands`, backfill, update the route segment name from `brand` → `brands`.
- Existing links (`/app/brand/[id]`) become a simple redirect — Next.js `redirect()` in the old route file.
- No uniqueness constraint complexity.
- Slug is decorative; a brand rename just updates `slug` with no broken links.
- Option C (org layer) is the right destination when IPI-16 lands — this structure doesn't block it.

---

## Implementation plan (Option B)

### 1. DB migration

```sql
ALTER TABLE brands ADD COLUMN IF NOT EXISTS slug TEXT;
UPDATE brands SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'));
```

Regenerate types: `npm run supabase:types`.

### 2. Update `slugify` call

In `onboarding.ts` `createOrgAndBrand`, also write `slug` to the brands insert:

```ts
slug: slugify(form.brandName),  // already imported
```

### 3. New route

Rename `app/src/app/(operator)/app/brand/[id]/` → `app/src/app/(operator)/app/brands/[brandId]/`

`params.brandId` splits on first `-` to extract the UUID:

```ts
const id = (await params).brandId.split("-")[0]; // UUID prefix
```

Or — simpler — keep the full segment as the key, make it a UUID, keep slug separate:

```ts
// Route: /app/brands/[id]
// URL displayed: /app/brands/b1a2c3d4-maison-lumiere
// params.id = full segment; extract UUID:
const rawId = (await params).id;
const uuid = rawId.length === 36 ? rawId : rawId.slice(0, 36);
```

### 4. Redirect old route

```ts
// app/src/app/(operator)/app/brand/[id]/page.tsx
import { redirect } from "next/navigation";
const OldBrandRoute = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  redirect(`/app/brands/${id}`);
};
export default OldBrandRoute;
```

### 5. Nav links

Update any `href="/app/brand/${id}"` → `href="/app/brands/${brand.id}-${brand.slug ?? ""}"`

### 6. RLS impact

None — route change is client-side. Supabase RLS still filters by `user_id`; `id` (UUID) remains the key.

---

## When to do Option C (org layer)

When IPI-16 (`organizations` UI) ships: add `org_slug` to `organizations`, update route to `/app/orgs/[orgSlug]/brands/[brandSlug]`, keep `/app/brands/[id]` as a redirect for 6 months.
