# Lessons — DESIGN V2 / SCR builds

Captured from the IPI-404 (SCR-08 Assets) forensic review on 2026-07-10, cross-referenced with the same day's PR #311 (IPI-396 CRM Deal Detail) review cycle. Each entry: what happened, why it's a trap, the guard to add.

## 1. Written specs can mis-transcribe the DC HTML's actual layout mechanism — always re-derive from the `.dc.html` file itself

Both `Universal-design-prompt-new/tasks/screens/SCR-08-assets.md` and the Linear IPI-404 issue body describe the Assets grid as CSS Grid: `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`, gap 16px. The real `Universal-design-prompt-new/Pages/Assets.v2.image-first.dc.html` uses CSS **multi-column masonry** instead: `.masonry{column-count:4;column-gap:16px}` with breakpoints at 1280px (→3) and 880px (→2). Grid and multi-column are different layout primitives with different card-ordering and sizing behavior — building to the written spec would have shipped the wrong layout.

The implementer in this case got it right by reading the DC HTML directly and matching an established `.masonry` pattern already used in `shoot-detail.module.css`, not by trusting the prose spec. That's the correct instinct — codify it.

**Guard:** Per `design-to-production`'s own rule ("HTML wins for layout"), never treat a screen's `.md` task file or Linear issue body as ground truth for CSS mechanics — grep the actual `.dc.html` for the real rule (`grid-template-columns`, `column-count`, `display:flex`, etc.) before writing CSS. Written specs are a summary and can drift; the `.dc.html` file is the only SSOT. When a mismatch is found, fix the written spec too so the next reader isn't misled again.

## 2. A purpose-built utility can exist and still go unused — grep for it, don't just skim the reuse table

Both `Universal-design-prompt-new/tasks/screens/SCR-08-assets.md` and Linear IPI-404 explicitly call for `CldImage` (next-cloudinary) with Cloudinary thumbnails. `app/src/lib/cloudinary/url.ts` even has an `"asset-masonry"` preset (`width:600, crop:"limit"`, and `cropTransformString` appends `f_auto,q_auto`) built for exactly this screen. The shipped `asset-card.tsx` renders `asset.thumbnail_url ?? asset.url` through plain `next/image` — no transform applied, no `f_auto`/`q_auto`, unoptimized delivery.

**Guard:** When a skill's "Reuse audit" table lists a component/util as "✅ reuse," verify by grep (`rg "CLOUDINARY_PRESETS\|CldImage"`) that the file actually imports and calls it — not just that a plausible-looking import exists. A reuse table is a plan, not proof; task-verifier's Phase 2 disk probes exist precisely to catch this gap between planned and actual reuse.

*Fixed 2026-07-10 in [PR #320](https://github.com/amo-tech-ai/lumina-studio/pull/320): added `withCloudinaryPreset()` — not `CldImage` itself, since `assets.cloudinary_public_id` is null on every row (see #8) and `CldImage`'s `src` doesn't parse full delivery URLs; the fix injects the `asset-masonry` preset's transform string into the already-stored delivery URL instead.*

## 3. Work can be substantially complete (tests green, typecheck clean, lint clean) and still be nowhere near "Done" — commit + PR status is not optional evidence

SCR-08's implementation (worktree `/home/sk/wt-ipi-404-assets-masonry`, branch `ipi/404-assets-masonry`) has real, tested code — 60/60 tests, clean `tsc`, clean `eslint` — but is entirely uncommitted, never pushed, and has no PR. Linear still shows IPI-404 as **Backlog** (`startedAt: null`), which is honest given no commit exists, but is easy to lose track of once a worktree "feels" finished after a long session.

**Guard:** "Green local checks" is a necessary, not sufficient, signal. task-verifier's Phase 9 stop condition (any 🔴 → not ready) must include "no commit / no PR" as a hard blocker on its own, independent of code quality — don't let clean `tsc`/`test`/`lint` output read as "ready to call done."

## 4. A worktree can silently fall behind a merge that touches unrelated files — check `git status` / `gh pr list --head` before resuming, every session

The `ipi/404-assets-masonry` worktree was 1 commit behind `origin/main` — missing PR #311 (IPI-396, SCR-31 CRM Deal Detail), merged the same day. `git diff origin/main --stat` from inside the worktree showed ~1500 lines of CRM files as "deletions," which is alarming out of context but is just the normal signature of a stale branch missing an unrelated merge. `node scripts/worktree-health.mjs` correctly reported 🟢 (only 1 behind, well under the 30-commit threshold), so this wasn't a blocker — but it's exactly the kind of stale-branch trap `design-to-production`'s own regression guardrail #3 warns about.

**Guard:** Before resuming any existing worktree, run the mandatory health gate (`node scripts/worktree-health.mjs`), and rebase onto `origin/main` before opening the PR even when the gate passes — a same-day unrelated merge can make a `git diff` look like a regression to anyone reviewing later, and rebasing first avoids that confusion entirely.

## 5. Filter/facet sets in the DC mockup can encode data that doesn't exist yet in the real schema — that's a scope decision, not a bug, but it must be written down

DC's filter chips are `['All','Photo','Graphic','Logo','Video','Low match']` — including a DNA-match-score bucket. The `assets` table only has an `asset_type` column (`image`/`video`/`document`), so the shipped filter bar uses `['all','image','video','document']` instead — a reasonable, honest substitution given real data, but it silently diverges from both the DC chip labels and the task spec's own DoD line ("Filter by brand/type/date"), and neither brand nor date filtering was implemented.

**Guard:** When a DC facet requires data the schema doesn't have (or the written DoD lists filters that aren't implemented), don't let the substitution happen implicitly — call it out explicitly as a documented "Out of scope" or "Descoped" line in the PR/task file, the same way SCR-08 already explicitly descoped upload and bulk-select. Silent divergence from a stated AC is exactly what a reviewer (or task-verifier) should flag as a gap, even when the underlying engineering judgment was sound.

## 6. Stale `blockedBy` relations in Linear can look scarier than they are — always resolve them, don't just read the label

IPI-404 lists `blockedBy: [IPI-385, IPI-387]` in Linear. Both were completed and merged days earlier (IPI-385 → PR #237, IPI-387 → PR #246). Not a real blocker, but the relation was never cleared, so a naive read of the issue would incorrectly report SCR-08 as blocked.

**Guard:** Never take a Linear `blockedBy` list at face value — resolve each referenced issue's actual status before citing it as a blocker in a verification report. Clean up stale relations on completion so this stops recurring.

## 7. From the PR #311 (IPI-396) session the same day — an early "safe to merge, 90.4/100" verdict predated 5 CodeRabbit review threads that surfaced a real, confirmed bug

A first-pass verification scored PR #311 at 90.4/100 and said "safe to mark Done." Minutes later, CodeRabbit's review (which hadn't posted yet at verification time) found a genuinely serious bug: the "linked shoot" feature queried `shoot_portfolio_view` (backed by `shoot.shoots`), while the actual FK (`crm_deals_shoot_id_fkey`) points at an orphaned, unrelated `public.shoots` table — meaning the feature would silently 404/null for any deal with a real `shoot_id`. Seed data happened to have `shoot_id: null` everywhere, so browser verification never caught it.

**Guard:** A "safe to merge" verdict is only as good as the review surfaces that had actually reported by that point. Don't treat an early composite score as final — re-run the verdict after all configured bots (CodeRabbit, Seer, MatterAI, etc.) have posted, and specifically re-test any code path that seed/fixture data doesn't exercise (here: a non-null FK value). A field that's always null in test data is a blind spot, not a clean bill of health.

## 8. When a column is null on every row, the feature it powers is un-QA-able in the real app — check data distribution, not just schema, before promising live verification

While fixing #2 (2026-07-10), a direct query showed `assets.brand_id` is `NULL` on all 24 rows in the database, and `assets.cloudinary_public_id` is null on all 24 too — every `url`/`thumbnail_url` sampled was a non-Cloudinary placeholder (`placehold.co`, `example.com`, `storage.example.com`). Because `assets_select_via_brand` RLS scopes visibility through `brand_id`, this means **zero assets are visible to any user in the entire system**, not just in dev fixtures for one screen — the exact same class of blind spot as #7 (a field that's always null in test data hides whether the feature actually works), except this time it wasn't a code bug, it was that no browser verification of the "populated" state was possible *at all*, for anyone, until real data exists.

**Guard:** Before promising "browser-verified" for a state that depends on a nullable FK or join, run `select count(*), count(<fk_column>) from <table>` first. If the populated count is 0, say so explicitly and route around it (component tests with real-shaped fixtures, as PR #320 did) rather than silently skipping that line of the verification matrix or, worse, fabricating a screenshot. Filed [IPI-493](https://linear.app/amo100/issue/IPI-493) to backfill real data so future QA of this screen isn't blocked the same way.

## 9. A local migration file can match the live function body exactly and still be wrong — content parity isn't ledger parity

From the IPI-367 (CRM-AI-001 Won/Lost gate) PR #341 audit, 2026-07-12. During iterative fixing, `crm_convert_deal` was patched **four separate times directly against the live Supabase project** (`apply_migration`), each creating its own timestamped entry in `supabase_migrations.schema_migrations` (`20260712091149`, `91706`, `94357`, `100030`). Before opening the PR, those four fixes were squashed into one local file timestamped `20260712100000` — a version number that **never existed in the live ledger**. `pg_get_functiondef()` on the live function matched the squashed file byte-for-byte (only comments differed), so a first-pass review judged it safe and moved on.

That was the wrong signal to trust. Function-body parity says nothing about ledger parity: a future `supabase db push` from that repo state would see local version `20260712100000` as unapplied (not in the remote ledger) and try to apply it — harmlessly re-running an idempotent `create or replace`, but inserting a *sixth*, redundant ledger row and permanently diverging local file history from what Postgres actually recorded. Worse: this is **structurally invisible to CI**. This repo's `supabase-web015` CI job only replays one isolated migration against a fresh Docker Postgres — it has no remote ledger to diverge from, so a squash-vs-ledger mismatch can never turn a check red.

The fix required going one level below "does the function match" to "does the file list match the ledger": `list_migrations` against the live project, then `select version, name, statements from supabase_migrations.schema_migrations where version in (...)` to pull the **exact SQL Postgres recorded** for each drifted version, and rebuild one local file per version (base64 round-trip, not manual retyping, to guarantee lossless content) instead of one squashed file.

**Guard:** When any migration was iterated against a live project during development (not just written once and applied once), never trust "the live function matches my file" as sufficient proof the migration is safe to merge. Separately run `list_migrations` and diff the **version numbers**, not just the function body, against what's in `supabase/migrations/`. A squash that changes version history is a real, CI-invisible risk — one file per applied version, always, matching the ledger exactly. See the full audit: [`tasks/AUDIT/crm-337=341-audt.md`](tasks/AUDIT/crm-337=341-audt.md).
