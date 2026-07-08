# IPI-291 · CC-IMG-001 — Cloudinary sample-images module

**Linear:** https://linear.app/amo100/issue/IPI-291  
**Parent:** [IPI-290](https://linear.app/amo100/issue/IPI-290)  
**Plan:** `tasks/design-docs/implementation/command-center.md` § Cloudinary rules · Image priority  
**Visual target:** `tasks/design-docs/implementation/command.png`  
**Estimate:** 2 points

---

## Skills to run

| Order | Skill | Purpose |
|-------|-------|---------|
| 1 | `worktrees` | Branch `ipi/17-command-center-dc-polish` |
| 2 | `ipix-task-lifecycle` | Phase 3 implement · verify matrix |
| 3 | `cloudinary` | URL transforms · **Cloudinary MCP `list-images`** for 8-id pool |
| 4 | `vercel-react-best-practices` | Hoist static URL pool · cache URL builder |
| 5 | `gen-test` | `sample-images.test.ts` |
| 5 | `gen-test` | `sample-images.test.ts` |
| 6 | `lean` | No new abstractions beyond URL helper |
| 7 | `graphify` | Optional — blast radius if touching queries |

**Before Done:** `@task-verifier` probes in `verifier-probes-ipix.md` § IPI-290–295.

---

## The problem this solves

Hero and recent-work tiles have no `coverUrl` / `imageUrl` types or URL builder. DC prototype uses `ph()` map → `Universal design prompt/images/{n}-fashionos.jpeg` and Cloudinary `services/` folder on `dzqy2ixl0`.

**Fix:** Central `sample-images.ts` with curated DC-aligned public_ids + deterministic fallbacks per image priority chain (plan § Image priority rules).

---

## Scope guard

**In scope:** `lib/command-center/sample-images.ts` · type extensions · `.env.local` cloud name  
**Out of scope:** React component rewrites · OperatorShell · NavSidebar · IntelligencePanel · mobile · schema

---

## Cloudinary rules

- Cloud: `dzqy2ixl0`
- Transforms: `f_auto,q_auto,c_fill,g_auto`
- Hero: `w_208,h_208` · Recent: `w_276,h_345`
- No API secrets in client bundle

---

## Image priority (implement in helper)

Brand cover → approved asset → shoot image → Cloudinary sample → local design JPG → neutral placeholder

---

## User stories

### Story 1: Dev preview shows real photos
**As a** developer, **I want** `?skip=1` to use Cloudinary JPGs, **so that** layout QA matches DC without live brand assets.

**Acceptance:** Dev fixture URLs resolve to 200 OK images.

### Story 2: Live users get graceful fallbacks
**As an** operator, **I want** fashion imagery even when DB has no cover, **so that** the dashboard never shows grey-only tiles.

**Acceptance:** `heroFallbackForBrand(id)` returns stable URL per brand.

### Story 3: Env hygiene
**As an** engineer, **I want** `CLOUDINARY_CLOUD_NAME=dzqy2ixl0`, **so that** transforms don't 404.

---

## Design reference

| DC | `Command Center.v2.image-first.dc.html` L497–498 (`IMG` + `ph()`) |
| Local | `Universal design prompt/images/5-fashionos.jpeg` … `24-fashionos.jpeg` |
| Cloudinary | `5-fashionos_wc2p1c`, `9-fashionos_ddj5jx`, … (`asset_folder: services`) |

---

## Technical notes

**New file:** `app/src/lib/command-center/sample-images.ts`

- `cloudinaryImageUrl(publicId, { w, h })` — mirror `app/src/app/api/brands/[id]/assets/route.ts`
- `heroFallbackForBrand(brandId)` — hash → 8-id pool (DC keys: char, clay, denim, …)
- `recentFallbackForShoot(shootId, index)` — same pool, no adjacent duplicates
- Default cloud: `process.env.CLOUDINARY_CLOUD_NAME ?? "dzqy2ixl0"`

**Do NOT:** Commit `.env.local` · expose API secret in client · add migration · rewrite components (IPI-292+).

**Env fix (local only):** `CLOUDINARY_CLOUD_NAME=dzqy2ixl0` — current value has invalid suffix `/nvdlhrodvevgwdsneplk`.

**Extend types (prep for IPI-292/293):**

- `HeroBrand.coverUrl?: string | null`
- `RecentShoot.imageUrl?: string | null`

---

## API wiring

| Route | Status | Auth | Returns |
|-------|--------|------|---------|
| Server `page.tsx` KPI fetch | ✅ exists | Supabase session | `CommandCenterData` |
| New API route | ⚪ not needed | — | fallbacks client-safe URLs only |

No migration. Optional later join `cloudinary_assets` (IPI-271).

---

## Acceptance criteria

- [ ] **A** `sample-images.ts` exports URL builder + 8 curated public_ids aligned to DC `ph()` map
- [ ] **B** Unit test: URL shape + deterministic fallback for same brandId
- [ ] **C** `DEV_PREVIEW_COMMAND_CENTER_DATA` includes sample `coverUrl` + tile `imageUrl`s
- [ ] **D** `.env.local` documents `CLOUDINARY_CLOUD_NAME=dzqy2ixl0` (local fix only)
- [ ] **E** No secrets in client bundle · no new env vars beyond existing Cloudinary name

## Out of scope

- React component image wiring (IPI-292/293)
- OperatorShell · NavSidebar · IntelligencePanel
- Schema migration · new API routes

---

## Completion steps

#### A. Setup
- [ ] **A1** Worktree + branch — proof: `git branch --show-current` = `ipi/17-command-center-dc-polish`
- [ ] **A2** Fix `CLOUDINARY_CLOUD_NAME=dzqy2ixl0` in `.env.local` — proof: grep exact line

#### B. Implement
- [ ] **B1** `sample-images.ts` + 8 public_ids — proof: vitest green
- [ ] **B2** Extend `HeroBrand.coverUrl` · `RecentShoot.imageUrl` in types.ts
- [ ] **B3** Wire URLs into `DEV_PREVIEW_COMMAND_CENTER_DATA` (coverUrl + tile imageUrls)

#### C. Verify
- [ ] **C1** `cd app && npx vitest run src/lib/command-center/sample-images.test.ts`
- [ ] **C2** `curl -I` one hero URL → HTTP 200
- [ ] **C3** `cd app && npx tsc --noEmit`
- [ ] **C4** Linear → Done

---

## Test

```bash
cd app && npx vitest run src/lib/command-center/sample-images.test.ts
```
