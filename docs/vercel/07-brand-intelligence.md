> **Status: ALL CRITICAL ISSUES FIXED — 2026-06-24.** `brand-intelligence` v8 deployed. Migration `brand_scores_brand_id_score_type_key` applied. See resolution column below.

## Audit verdict

`brand-intelligence` is useful and mostly well structured, but it has **several production red flags** around ownership safety, URL abuse, transaction consistency, and Gemini reliability.

### Critical blockers

| # | Issue                                             | Why it matters                                                            | Fix                                                            |
| - | ------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 1 | `brandId` update only checks `.eq("id", brandId)` | If RLS is wrong or weakened later, users could update another brand.      | Also filter by `user_id = auth.user.id`.                       |
| 2 | No SSRF/domain protection                         | User can submit internal/private URLs if Gemini URL context fetches them. | Block localhost, private IPs, metadata IPs, non-public hosts.  |
| 3 | Multi-step DB writes not transactional            | Brand can be updated, old scores deleted, then score insert fails.        | Use RPC transaction or upsert scores instead of delete/insert. |
| 4 | Deletes all scores before insert                  | Temporary data loss if insert fails.                                      | Use `upsert` with unique `(brand_id, score_type)`.             |
| 5 | No timeout/retry around Gemini calls              | Function can hang or fail hard under API slowness.                        | Add timeout + clean 504 error.                                 |

### High-priority improvements

| Area            | Problem                                           | Improvement                                              |
| --------------- | ------------------------------------------------- | -------------------------------------------------------- |
| Input size      | `req.json()` has no body size guard               | Enforce `Content-Length` max before parsing              |
| URL validation  | Allows any `http://` URL                          | Prefer `https://`; block IPs and private hostnames       |
| Model output    | Only checks `profile.name`                        | Validate all required fields + scores after parse        |
| Brand URL trust | Uses model-provided `sourceUrl` fallback          | Force `sourceUrl = url`; do not trust model              |
| Error handling  | Throws raw DB error to `safeErrorMessage`         | Return safer public error; log detailed error internally |
| Logging         | `input: { url }` may store sensitive/private URLs | Fine for normal use, but consider redaction rules        |
| Auth            | Good: required auth                               | Add explicit ownership filters anyway                    |
| Rate limiting   | None                                              | Add per-user rate limit, e.g. 10 analyses/hour           |

### Specific code fixes

#### 1. Safer brand ownership

```ts
const { data: existing, error: fetchErr } = await client
  .from("brands")
  .select("id, name")
  .eq("id", brandId)
  .eq("user_id", auth.user.id)
  .maybeSingle();
```

And update:

```ts
const { data: updated, error: updateErr } = await client
  .from("brands")
  .update({
    name: profile.name,
    brand_url: url,
    ai_profile: aiProfile,
  })
  .eq("id", brandId)
  .eq("user_id", auth.user.id)
  .select("id, name")
  .single();
```

#### 2. Force source URL

```ts
const aiProfile = {
  name: profile.name.trim(),
  tagline: profile.tagline?.trim() ?? "",
  category: profile.category?.trim() ?? "",
  visualIdentity: {
    colors: Array.isArray(profile.visualIdentity?.colors)
      ? profile.visualIdentity.colors.slice(0, 12)
      : [],
    mood: profile.visualIdentity?.mood?.trim() ?? "",
  },
  targetAudience: profile.targetAudience?.trim() ?? "",
  sourceUrl: url,
  analyzedAt: new Date().toISOString(),
};
```

#### 3. Upsert scores instead of delete + insert

Requires unique index:

```sql
create unique index if not exists brand_scores_brand_id_score_type_key
on public.brand_scores (brand_id, score_type);
```

Then:

```ts
const { data: scores, error: scoresErr } = await client
  .from("brand_scores")
  .upsert(scoreRows, { onConflict: "brand_id,score_type" })
  .select("id, score_type, score");
```

### Missing tests

Add tests for:

```text
- rejects non-POST
- rejects unauthenticated request
- rejects invalid URL
- rejects localhost / private IP URL
- verifies brand update requires user ownership
- model invalid JSON returns safe 500
- empty brand name returns 422
- scores are clamped to 0–100
- score update is idempotent
- agent log inserted with token counts
```

### Bottom line

**Do not block launch if this is internal-only behind auth**, but fix ownership + score writes before serious use.

Top 3 fixes:

```text
1. Add user_id ownership filters.
2. Replace delete/insert scores with upsert.
3. Add URL safety checks for localhost/private IPs.
```
