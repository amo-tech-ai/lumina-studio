# Cloudinary audit — PR #421 / IPI-641

**Auditor:** Cursor (task-verifier + cloudinary + ipix-supabase)  
**Updated (UTC):** 2026-07-18T01:17Z — **Done gate closed**  
**Linear:** [IPI-641](https://linear.app/amo100/issue/IPI-641) · **Done**  
**Supabase:** `nvdlhrodvevgwdsneplk` · Cloudinary `dzqy2ixl0`

---

## Executive verdict (easy English)

| Question | Answer |
| --- | --- |
| What did #421 do? | Store Cloudinary’s permanent file ID (`cloudinary_asset_id`) + version in Supabase |
| Deploy target? | **Vercel** project `ipix-operator` → `www.ipix.co` (proven) |
| Production identity? | ✅ **Proven live** — signed upload wrote matching `cloudinary_asset_id` + version |
| IPI-641 Done? | ✅ **Yes** |
| PR #425? | ✅ Merged (hardening follow-up) |

**Composite readiness (identity path):** **95 / 100**  
Remaining: optional Admin backfill of old null rows (explicitly deferred).

---

## What we completed

### 1. Deploy target
| Probe | Result |
| --- | --- |
| DNS | `www.ipix.co` → `cname.vercel-dns.com` |
| HTTP | `server: Vercel` |
| Project | `ipix-operator` (`prj_jor9hPS4Yq6LJTu8rAHyPMLms4e9`) |
| Not Cloudflare Workers | Confirmed |

### 2. Production deploy
- Redeployed **Vercel Production** from `main` (includes #421)
- Aliased to `https://www.ipix.co`
- Deployment example: `ipix-operator-75zsxqpdo-mdeai.vercel.app`

### 3. Live QA (PASS)
Script: `npm run verify:cloudinary-webhook-live`  
Report: `app/scripts/.cld636-report.json`  
Run: `ipi636-1784337307903-ba0ba825`

| Check | Result |
| --- | --- |
| Signed upload → Cloudinary | ✅ authenticated |
| Webhook → ready row | ✅ |
| `cloudinary_asset_id` | ✅ `5d291ae9e4f257ce98482c8754a87b00` |
| `version` | ✅ `1784337310` matches Cloudinary |
| Exactly one mirror | ✅ |
| Delete → archived | ✅ |
| Cleanup | ✅ fixture removed |

### 4. Backfill decision
**Forward-only.**  
5 legacy mirrors still null (expected). Do **not** Admin-backfill now. New uploads get identity. Revisit only if a rename/delete hits a legacy null in prod.

### 5. PR #425
Merged: https://github.com/amo-tech-ai/lumina-studio/pull/425  
(null `public_id` sync, rename URL synthesize, brand-only overwrite)

---

## Progress tracker

| Status | Item |
| --- | --- |
| 🟢 | Schema + index |
| 🟢 | PR #421 on main |
| 🟢 | Deploy target = Vercel |
| 🟢 | Production deploy with #421 |
| 🟢 | Live identity QA |
| 🟢 | Cleanup |
| 🟢 | Backfill decision (forward-only) |
| 🟢 | IPI-641 Done |
| 🟢 | PR #425 merged |
| ⚪ | Rename Console trigger (optional, not IPI-641) |
| ⚪ | Upload UI IPI-433 / Search IPI-435 |

---

## Next product work (not IPI-641)

1. Redeploy Production once more if needed so #425 tip is on `www.ipix.co` (in progress / follow deploy log).
2. **IPI-433** — brand upload widget + poll.
3. **IPI-435** — assets search/filters.

---

## Skills / evidence

| Probe | Result |
| --- | --- |
| Live report | `.cld636-report.json` · `ok: true` · `identity_ok: true` |
| Linear | Comment + Done on IPI-641 |
| PRs | #421 merged earlier · #425 merged 2026-07-18 |
