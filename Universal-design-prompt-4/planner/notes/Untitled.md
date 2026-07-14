



















Reviewed all 37 files in that folder against the live route tree in `app/src/app/(operator)/app/`. Here's the real conversion status — not from doc claims, from actual `page.tsx` files found on disk.

## 🟢 Converted (15 screens)

| Screen | Route |
|---|---|
| Command Center | `/app` |
| Shoots List | `/app/shoots` |
| Shoot Detail | `/app/shoots/[shootId]` |
| Shoot Wizard | `/app/shoots/new` |
| Brand List | `/app/brand` |
| Brand Detail | `/app/brand/[id]` |
| Assets | `/app/assets` |
| Onboarding (brand) | `/app/onboarding` |
| Matching (talent tab only) | `/app/matching` — Creator/Asset/Product tabs still disabled shells |
| CRM Companies List | `/app/crm/companies` |
| CRM Company Detail | `/app/crm/companies/[id]` |
| CRM Contacts List | `/app/crm/contacts` |
| CRM Contact Detail | `/app/crm/contacts/[id]` |
| CRM Pipeline | `/app/crm/pipeline` |
| CRM Deal Detail | `/app/crm/pipeline/[id]` |

## 🟡 Route exists, but it's a placeholder, not a real conversion

| Screen | What's actually there |
|---|---|
| Campaigns | `/app/campaigns` just shows "Coming soon" — no real screen built yet |

## 🔴 Not converted (13 screens, zero route exists)

| Screen | Note |
|---|---|
| Notification Center (SCR-15) | What we're already scoped to build next |
| Analytics | No route |
| Campaign Performance | No route |
| Channel Preview | No route |
| Talent Profile (SCR-20) | Part of the Talent Booking feature, currently on hold |
| Availability Editor (SCR-23) | Same feature, on hold |
| Talent Onboarding (SCR-24) | Same feature, on hold — different from Brand Onboarding, which **is** built |
| Role Dashboards (SCR-25) | No route |
| Collaboration Audit (SCR-18) | No route |
| Planner Workspace (SCR-32) | Backend is done, zero screen built |
| Planner Dashboard (SCR-33) | Same — zero screen |
| Planner Instance Settings (SCR-34) | Same — zero screen |
| Planner Hub (SCR-35) | Same — zero screen |

## 📱 Separate category: mobile versions (5 spec files, 0 built)
None of the phone-sized layouts exist anywhere in the app yet — not CRM's, not Bookings', not Planner's, not general. This isn't "screens to convert," it's a whole responsive layer that's missing across the board.

---

**Bottom line:** 15 of 29 real screens are converted (52%). The single biggest missing *finished feature* is **Planner** — 4 screens, fully designed, backend already built and tested, zero UI. Want me to switch focus there instead of Notification Center, or stick with Notification Center since it's smaller and self-contained?


Graphify's index doesn't have clean hits on this — falling back to direct grep + live Supabase checks, per the ticket's own cited files.

Verified against the live database and codebase (not just the ticket text). Here's what's actually needed:

## Backend — already done, nothing to build
✅ Database table `notifications` exists live (confirmed via Supabase).
✅ Both database functions (`list_notifications`, `mark_notifications_read`) exist and work.
✅ The two API endpoints already exist: `app/src/app/api/notifications/route.ts` and `.../read/route.ts`.
✅ The typed service layer (`notification-service.ts`) already wraps both functions — and it already returns a `deep_link` for each notification, so "click → go to the right page" is free, no routing logic to invent.

**One gotcha I found that the ticket doesn't mention:** the `notifications` table has no title/message text column — just `kind`, `payload` (a JSON blob), and a few ids. Whatever renders each row has to build its display text from `kind` + `payload`, not read a ready-made sentence. Worth knowing before writing the row component.

## Frontend — this is the actual work (5 steps)

**1. Build the page** — `/app/inbox` doesn't exist yet (confirmed, zero files). New route: `app/src/app/(operator)/app/inbox/page.tsx`.

**2. Build 3 small components** — none exist yet:
   - `inbox-workspace.tsx` — fetches notifications, groups them by date (Today/Yesterday/This Week), handles loading/empty/error
   - `notification-row.tsx` — one row: icon, title (built from `kind`+`payload`), timestamp, unread dot
   - Reuse existing `EmptyState`, `ErrorState`, `Skeleton` components (all three already exist in `app/src/components/ui/` — don't rebuild them)

**3. Wire "mark as read"** — clicking a row calls the existing `/api/notifications/read` endpoint, then follows that row's `deep_link`.

**4. Add the sidebar link** — `nav-sidebar.tsx` has a simple list of nav items (Home, Shoots, CRM, Brand...). Add "Inbox" to that list. Note: the sidebar has no unread-count badge today — that's a small new piece to add, not something to wire into existing code.

**5. Verify** — resize to 1280px and 390px, confirm all 5 states (populated/loading/empty/error/marking-read) look right, run `npm run typecheck && npm test`.

Want me to start on step 1?

## Production Planner — Plain-English Summary

**What it is:** A workspace where an operator can see every job in flight (shoots, campaigns, deals), what's assigned to them today, and what needs their sign-off — with an AI assistant that drafts moves but never executes anything without a human clicking approve.

## The gap in one sentence

**The engine is built and tested. The screens are fully designed. Nothing connects them yet — there isn't a single working page.**

|Layer|Score|Plain meaning|
|---|---|---|
|Backend (database, scheduling logic, AI agent)|96/100 🟢|Solid. 1,180 tests pass.|
|Design (the 4 screens, pixel-exact)|86/100 🟢|Fully designed, ready to build from.|
|Frontend (actual working pages)|5/100 🔴|Typing `/app/planner` into the browser gives a 404. There is no Planner in the app today.|

## The 4 screens

|Screen|What it does|Status|
|---|---|---|
|**Hub**|The homepage — a grid of every plan, filterable, shows which ones need attention|Designed, not built|
|**Dashboard**|"What's mine today" — your approvals, at-risk items, this week's tasks|Designed, not built|
|**Workspace**|The actual working screen — Timeline/Kanban/Calendar/List views of one plan, where approvals happen|Designed, not built|
|**Settings**|Who has access to this plan, invite people|Designed, not built|

## Why nothing is built yet — 2 pieces are missing first

1. **No pages exist at all** — not even empty placeholder pages. Nobody has created the `/app/planner` route.
2. **No way to save or load data** — even if the pages existed, there's no code connecting them to the database yet.

Everything else (all 4 screens) is blocked behind these two. This is why the plan calls them out as step 1 and step 2 before any screen work starts.

## Recommended build order (from the design team's own onboarding doc)

1. **Basic pages + data connection** — the two blockers above (~1 week combined)
2. **Dashboard** — simplest screen, good confidence-builder
3. **Hub** — reuses the existing Shoots-list pattern, low risk
4. **Workspace** — the big one; only genuinely new piece of UI in the whole feature (the Timeline view)
5. **Settings** — isolated, low risk
6. Mobile versions, then wiring the AI assistant in last

## Bottom line

Planner is **not a "which screen next" decision** the way CRM was — every screen is equally blocked on the same two missing pieces. The real next step is building the plumbing (pages + data layer), not picking a screen.

**One open item:** the Hub screen didn't have a Linear ticket at all until this was audited — it's since been opened as [IPI-526](https://linear.app/amo100/issue/IPI-526).

Want me to start on the plumbing (IPI-536 + IPI-538), or would you rather stay on Notification Center since that one's fully unblocked today?

I've been working directly in the main checkout — `/home/sk/ipix`, on branch `ipi/525-model-registry` — not in a separate worktree.

That's fine for what's actually happened this session: everything was either Linear ticket edits (via MCP, not local files) or local doc edits (`crm-linear-audit.md`, restoring `lessons.md`) — no app code was touched, so there was nothing requiring the worktree workflow.

**Worth flagging:** `ipi/525-model-registry` is an unrelated branch (model registry work) — none of today's CRM/Planner/Notification-Center work belongs there. If we start real code (like the Notification Center build), that needs its own worktree per the repo's rule, e.g.:
```bash
git worktree add ../wt-ipi-407-notification-center -b ipi/407-notification-center-inbox
```

Want me to set that up now, or hold off until we've picked the actual next task?

Verified via `gh pr list` against the actual GitHub history — here's the real CRM PR set, in build order:

## Foundation
| PR | Ticket | What it shipped |
|---|---|---|
| [#212](https://github.com/amo-tech-ai/lumina-studio/pull/212) | IPI-362 | The 4 CRM database tables + security rules |
| [#259](https://github.com/amo-tech-ai/lumina-studio/pull/259), [#262](https://github.com/amo-tech-ai/lumina-studio/pull/262), [#265](https://github.com/amo-tech-ai/lumina-studio/pull/265) | IPI-451 | Test/seed data for the CRM tables (3 follow-up fixes) |

## Shared building blocks (used across all CRM screens)
| PR | Ticket | What it shipped |
|---|---|---|
| [#237](https://github.com/amo-tech-ai/lumina-studio/pull/237) | IPI-385 | Status badges + CRM color tokens |
| [#238](https://github.com/amo-tech-ai/lumina-studio/pull/238) | IPI-386 | Reusable empty/error state components |
| [#246](https://github.com/amo-tech-ai/lumina-studio/pull/246) | IPI-387 | Reusable list-screen template |
| [#268](https://github.com/amo-tech-ai/lumina-studio/pull/268) | — | Shared detail-page helpers + activity timeline |

## The 6 screens
| PR | Ticket | Screen |
|---|---|---|
| [#215](https://github.com/amo-tech-ai/lumina-studio/pull/215), [#253](https://github.com/amo-tech-ai/lumina-studio/pull/253), [#270](https://github.com/amo-tech-ai/lumina-studio/pull/270) | IPI-363/388/389 | Companies List |
| [#269](https://github.com/amo-tech-ai/lumina-studio/pull/269) | IPI-391 | Company Detail |
| [#218](https://github.com/amo-tech-ai/lumina-studio/pull/218), [#272](https://github.com/amo-tech-ai/lumina-studio/pull/272) | IPI-364/390 | Contacts List |
| [#274](https://github.com/amo-tech-ai/lumina-studio/pull/274) | IPI-392 | Contact Detail |
| [#275](https://github.com/amo-tech-ai/lumina-studio/pull/275) | IPI-395 | Pipeline (kanban board) |
| [#311](https://github.com/amo-tech-ai/lumina-studio/pull/311) | IPI-396 | Deal Detail |
| [#344](https://github.com/amo-tech-ai/lumina-studio/pull/344) + [#346](https://github.com/amo-tech-ai/lumina-studio/pull/346) | — | Deal Detail layout fix + its regression test |

## The AI assistant (wave 1) + the safety-critical Won/Lost feature
| PR | Ticket | What it shipped |
|---|---|---|
| [#220](https://github.com/amo-tech-ai/lumina-studio/pull/220), [#221](https://github.com/amo-tech-ai/lumina-studio/pull/221) | IPI-368 | The CRM chat assistant — search, log notes, move deals |
| [#337](https://github.com/amo-tech-ai/lumina-studio/pull/337) + [#341](https://github.com/amo-tech-ai/lumina-studio/pull/341) | IPI-367 | The human-approval gate for marking a deal Won/Lost, plus auto-creating a Brand record on Won |
| [#343](https://github.com/amo-tech-ai/lumina-studio/pull/343) | — | Doc fix from that work — always check the live database before trusting a migration file |

**24 PRs total.** Everything above is merged and live. What's *not* in this list — because it hasn't been built yet — is the AI "wave 2" (health scores, AI summaries, draft follow-ups) and the mobile layouts, which is exactly the work the tickets we fixed today ([IPI-369](https://linear.app/amo100/issue/IPI-369), [IPI-572](https://linear.app/amo100/issue/IPI-572), etc.) are scoped to cover.

Now I have precise, PR-body-verified details (not relying on memory) for the genuinely new problems — none of which duplicate the 9 lessons already in the file. Appending 7 new entries.

Added 7 new lessons (#10–16) to `Universal-design-prompt-4/lessons.md`, all pulled from actual PR bodies, not memory — none duplicate the existing 9.

## What I found reviewing the 24 CRM PRs

| # | From PR | The real problem |
|---|---|---|
| 10 | #337 | `crm_convert_deal` had **never worked** since deployment — a `RETURNS TABLE` clause shadowed its own column names. Every automated check (typecheck/lint/test/build) stayed green the whole time because none of them execute SQL. Only found by actually running it against live Postgres — which itself needed Node 22, since Node 20 (the repo default) can't open the WebSocket supabase-js's realtime client needs |
| 11 | #337 | A plain foreign key (`crm_deals.company_id`) isn't an authorization guarantee — a mismatched cross-org company could silently create an orphaned brand record |
| 12 | #337 | Client code that string-matches a server error message broke silently the moment a migration changed the wording — a rejected user got a 500 instead of a 403 |
| 13 | #262→#265 | A stale, never-rebased branch would have **regressed already-shipped security hardening** if merged as-is |
| 14 | #265 | Seed script let a failed user lookup cascade `undefined` into every downstream foreign key instead of failing fast |
| 15 | #270 | The reduced-motion accessibility fix missed Tailwind's own `animate-pulse` utility — every loading skeleton **app-wide** ignored the user's motion preference, not just CRM's |
| 16 | #272 | A comment claiming "these two screens share behavior" was trusted and copy-pasted into the next screen without checking that screen's own design file — it was wrong |

Each entry follows the file's existing format: what happened, why it's a trap, and a concrete guard for next time.

Found something important while checking this — one of the tickets is actively lying about its status. Let me walk through what I found, worst issue first.

## 🔴 Critical: IPI-526 (Planner Hub) is marked Done, but it isn't

[IPI-526](https://linear.app/amo100/issue/IPI-526) shows **Done**, linked to PR #338. I checked that PR's actual file list — it's **100% AWS Bedrock provider fallback code in the Cloudflare Worker**, zero Planner files touched. The two tickets just happened to share the number "526" in their branch names, and Linear auto-linked the wrong PR to the wrong issue. The real Planner Hub route (`/app/planner`) still doesn't exist — confirmed by the audit doc *and* by this PR check. Reopening it now:

Both fixed and live. Here's the full picture on how to improve the plan:

## Fixed just now
1. **[IPI-526](https://linear.app/amo100/issue/IPI-526) reopened** — was falsely Done, linked to an unrelated Bedrock PR that happened to share its ticket number
2. **[IPI-538](https://linear.app/amo100/issue/IPI-538) → real "blocked by IPI-536" relation added** — text said it, the relation graph didn't (same bug class as [lesson #6](Universal-design-prompt-4/lessons.md))

## Still worth doing, in priority order

**1. Fix the confusing ticket hierarchy.** IPI-536 and IPI-538 are currently nested as *children* of IPI-478 in Linear — but both tickets block IPI-478, IPI-479, *and* IPI-526 equally. A child ticket "blocking" its own parent reads backwards to anyone browsing the epic. Re-parent 536 and 538 directly under the epic (IPI-484) as siblings of 478/479/526, and let the `blockedBy` relations (already correct on 538, needs the same on 478/479/526) carry the real dependency — not the parent/child nesting.

**2. Split the foundation work to unblock screens sooner.** IPI-538's repository classes (`TaskRepository`, `AssignmentRepository`, etc.) don't actually need IPI-536's routes to exist — only the *server actions* do. Right now the plan reads as a strict 3-4 days → then 5-6 days sequential (up to 10 days before any screen work starts). The 7 repository files could be written and unit-tested in parallel with IPI-536, cutting real wall-clock time.

**3. Fix the broken verification script before it's needed.** `scripts/verify-planner-scenario.mjs` is currently broken (`ERR_UNKNOWN_FILE_EXTENSION`). This is exactly the tool that would have caught the CRM bug from lesson #10 (an RPC that never actually worked, invisible to typecheck/lint/test). Fix it as part of IPI-538, not as an afterthought — it's the only thing that proves the repository layer actually talks to a live database correctly.

**4. Resolve the 5 open design questions before the tickets that need them start** (from `planner-react-onboarding.md` §2A) — right now they're just sitting in a doc, not written into any ticket's AC:
   - Calendar view: chips or status bars? → needs answering before IPI-478's `PlannerCalendar`
   - Exact per-role stat set on the Dashboard → needs answering before IPI-479
   - Nav active-state convention for Settings vs. Planner → needs answering before IPI-536's nav wiring
   
   This is lesson #5's guard — an undocumented scope decision left for the implementer to guess is exactly what caused silent divergence bugs before.

**5. Clean up ~10 old Planner worktrees before starting fresh** (`wt-ipi-476-*`, `wt-ipi-477-*` — I count 10 in the worktree list). Per lesson #13, a stale branch that's never been rebased since `main` moved on can silently reintroduce already-fixed bugs if someone accidentally works from one of these instead of a fresh worktree.

**One thing that's already good:** IPI-478 itself is well-hardened — it already has AC items F through I added from a design audit (component reuse, keyboard operability, mobile strategy, ApprovalCard props) that read like they were written *with* the lessons doc in mind. That's the bar the other tickets should match.

First, re-parenting both under the epic:

Re-parented — both now sit directly under [IPI-484](https://linear.app/amo100/issue/IPI-484) as siblings of 478/479/526, not nested inside 478.

Now reviewing the audit doc itself for errors — I already read it in full earlier. Found two real inaccuracies plus one staleness issue. Let me verify the exact wording before fixing.

Confirmed both errors precisely. Fixing them now, plus updating the two things that have changed since this audit was written.

Now the two staleness items — SCR-35's "no Linear issue" claim and the matching action item.

Adding a status banner at the top for discoverability, matching the pattern used on the CRM audit doc.

## Summary

**Linear structure fixed:**
- [IPI-536](https://linear.app/amo100/issue/IPI-536) and [IPI-538](https://linear.app/amo100/issue/IPI-538) re-parented from under IPI-478 to directly under the epic ([IPI-484](https://linear.app/amo100/issue/IPI-484)) — they were nested inside one of the tickets they block, which read backwards

**Audit doc (`planner-audit.md`) — 4 real problems found and fixed:**
1. A citation error — the reasoning for why IPI-479 (Dashboard + Settings) "will succeed" cited "SCR-30" (CRM Pipeline) as a reuse source. That screen has nothing to do with Dashboard or Settings — looks like cross-contamination from the CRM audit written the same day. Corrected to the real sources.
2. An internal contradiction — the doc's own scoring legend says 0-39 = ⚫, but 4 scores in that exact range (Foundation, Data Layer, Frontend, Production Readiness) were colored 🔴 instead. Fixed to match the stated scale.
3. Stale — the doc still said SCR-35 "has no backing Linear issue." [IPI-526](https://linear.app/amo100/issue/IPI-526) was opened that same day (and its own status wrinkle is now noted inline).
4. Added a correction banner at the top so anyone opening the doc sees the fixes without hunting for them.

**Nothing here changes the actual verdict** — Planner is still not production ready, still 42/100, foundation (IPI-536/538) is still the real next step. These were accuracy fixes to the report, not new findings about the codebase.

Good proposal — but before building any of this, I checked: **most of it already exists.** There's a mature `design-to-production` skill (v2.0.0) with a 6-phase workflow, Phase 0 gates, and a regression-guardrail table. Building your 8-stage process alongside it would mean two competing systems doing the same job. Better move: patch the real gaps into the skill that already runs, so it's one system, not two.

## What already covers your proposal

| Your stage | Already exists as |
|---|---|
| 1. Design extraction | Phase 0 + "1. Discover" — reads the `.dc.html`, fills a production-state table |
| 2. Data-readiness check | Phase 0's "Data-source table — Supabase MCP probe" |
| 3. Component reuse audit | "3. Plan" — Reuse/Create/Defer/Out-of-scope table |
| 4. Skeleton-first build order | "4. Implement" — RSC page → `loading.tsx` → CSS → wire data |
| 6. Verify every state | "5. Verify" — Playwright + browser QA + screenshot-per-state |
| 7. Release gates | "Checklist before merge" |

## 4 real gaps — found by diffing your proposal against what's live

1. **Reuse claims aren't required to be grep-verified.** The Plan phase lists a reuse table, but nothing forces proving the import actually landed — exactly lesson #2 (`CldImage` claimed reused, never actually called).
2. **No "one service layer" rule at the skill level.** CRM has `queries.ts`, Planner has `repositories/` — but that's per-feature discipline, not a rule the skill itself states for every future screen.
3. **No explicit rebase-before-merge gate.** Two of today's real bugs (lessons #4, #13) were exactly this — a stale branch silently reintroducing fixed code.
4. **The skill's own lessons table is disconnected from `lessons.md`.** The skill has a 10-item "Regression guardrails" table from IPI-383/372. `lessons.md` now has 16 entries + a Top 10. They don't reference each other — someone reading one has no idea the other exists.

Patching these into the skill now:

## What I changed (concrete, not a new process)

Three additions to the actual skill everyone already loads for this work:

1. **Reuse table → grep-proof requirement.** Added the exact `rg` command to the merge checklist. Closes lesson #2's gap directly.
2. **One typed data-access function per operation.** Added to Phase 3 (Plan) and the merge checklist — this is now a stated rule, not just something CRM/Planner happen to do independently.
3. **Rebase-before-review gate.** Added to the merge checklist, citing the two real bugs it would have caught today (lessons #4, #13).
4. **Linked `lessons.md` ↔ the skill's own guardrail table** so they reinforce each other instead of silently diverging (they'd drifted apart — 10 old items vs. 16 newer ones, no cross-reference).

## Where I'd push back on the proposal

Two pieces would add real process weight without matching how work has actually shipped here:

- **A separate `design-extraction.md` deliverable per screen** — the skill already gets this via inline tables in the Linear issue body (Phase 0's production-state table + data-source table). That pattern has shipped 24 CRM PRs. A new standalone doc per screen is a parallel format for the same information — skip it, keep using the issue body.
- **The screen-conversion task template file** — same reasoning. `screen-checklists.md` + Phase 0 tables already do this job; a second template risks becoming the thing nobody keeps in sync (exactly the "two divorced lesson lists" problem I just fixed).

Your **8-step build order** (Shell → shared components → Dashboard → Hub → Workspace → Settings) is good, but it's not new — it's the *same* order `planner-react-onboarding.md` §4 already froze, with reasoning per step. One risk to flag: your parallel-streams sketch put Members/Settings before Workspace; the frozen doc puts Hub before Workspace and Settings after. Don't merge a third ordering — the onboarding doc's order is the one to build against, since "frozen" there specifically means *don't redesign during implementation*.

## Net result
One skill, patched with your 4 real improvements, still the single thing to load before touching any `.dc.html` — instead of a second competing framework to keep in sync by hand.