# BE-RT2 — Extend `get_shoot_detail` RPC to include `resource_type`

> **Follow-up to** IPI-371 / PR #251 (Assets tab parity)
> **Linear:** [IPI-450](https://linear.app/amo100/issue/IPI-450)

## Purpose

PR #251 added an Assets tab that renders `shoot.shoot_assets` via `next/image`. The `get_shoot_detail` RPC doesn't select the table's own `resource_type` column, so the frontend has no reliable way to detect video vs image. A stopgap heuristic (`isVideoFormat()` in `shoot-detail-format.ts`) checks file extensions — works for common cases but isn't as reliable as the real `resource_type` column.

This task replaces the format heuristic with the database's `resource_type` field.

## Files to modify

| File | Action | Concern |
|------|--------|---------|
| `supabase/migrations/NNNNN_extend_get_shoot_detail_resource_type.sql` | 🔴 Create | Migration |
| `app/src/lib/shoot/get-shoot-detail.ts` | ✏️ Add `resource_type` to `ShootDetailAsset` | Types |
| `app/src/components/shoot/shoot-detail-tabs/assets-tab.tsx` | ✏️ Use `resource_type === 'video'` | UI |
| `app/src/components/shoot/shoot-detail-format.ts` | 🗑️ Remove `isVideoFormat()` + `VIDEO_FORMATS` set | Cleanup |

## Current RPC state (add `resource_type` to assets aggregate)

```sql
'assets', coalesce((
    select json_agg(json_build_object(
        'id', a.id,
        'url', a.url,
        'cloudinary_id', a.cloudinary_id,
        'format', a.format,
        'width', a.width,
        'height', a.height,
        'dna_score', a.dna_score,
        'status', a.status::text,
        'resource_type', a.resource_type,   -- ADD
        'created_at', a.created_at
    ) order by a.created_at desc)
    from shoot.shoot_assets a
    where a.shoot_id = p_shoot_id
), '[]'::json),
```

## AC

- [ ] **Migration:** `get_shoot_detail` RPC updated to select `a.resource_type`
- [ ] **Types:** `ShootDetailAsset` includes `resource_type: string | null`
- [ ] **UI:** `assets-tab.tsx` uses `a.resource_type === 'video'` instead of `isVideoFormat(a.format)`
- [ ] **Cleanup:** `isVideoFormat()` and `VIDEO_FORMATS` removed from `shoot-detail-format.ts`
- [ ] `npm run typecheck && npm test && npm run build` pass

## Out of scope

Video player UI, other RPCs, other RPCs querying `shoot.shoot_assets`.

## Skills

`ipix-supabase` · `task-verifier`
