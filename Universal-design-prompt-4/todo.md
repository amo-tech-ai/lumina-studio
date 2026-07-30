# iPix / FashionOS — Build Priority Order

**Updated:** 2026-07-30 (pass 2) — added **Lane E · Mastra / Cloudflare** verified against live Linear ([AI Platform — LLM Providers](https://linear.app/amo100/project/ai-platform-llm-providers-8088f63224f2), [Supabase](https://linear.app/amo100/project/supabase-ef69e2ba931b), [DESIGN V2](https://linear.app/amo100/project/design-v2-operator-react-parity-e276f28e26a0)), `origin/main` @ `4f69f4f3`, live Supabase `nvdlhrodvevgwdsneplk`, and Cloudflare Workers account. Prior pass (Lane A–D) used `3e653702`. No status copied from a Linear field alone.

**Legend:** 🟢 done · 🟡 in progress/partial · 🔴 failed verification (marked Done but evidence fails) · ⚫ Backlog · ⚪ not started

> **Lane D** = Onboarding v2 · **Lane E** = Mastra / Cloudflare. Both use 🟢🟡🔴⚪ (failed vs not-started). `tasks/cloudflare/todo.md` is stale (last reviewed 2026-07-26) — Lane E below supersedes its "Next" table until that file is refreshed in a separate PR.

---

## ⭐ What is actually left to complete — read this first

**Verified 2026-07-30** against live Linear, `origin/main` @ `3e653702`, and live production/staging Supabase. **Lane A was 5 rows stale** — IPI-369, IPI-562, IPI-563, IPI-374 and IPI-566 all shipped 2026-07-20/21 while still listed here as Todo/Backlog. Lane B was 1 row stale (IPI-542). Those rows are corrected in place below and marked `[corrected 2026-07-30]`.

| Lane | Shipped | What is *actually* left | Consequence today |
|---|---|---|---|
| **A · CRM** | 🟢 **9 of 10 rows Done** | Two items, both already **In Progress**: [IPI-370](https://linear.app/amo100/issue/IPI-370) MVP acceptance QA · [IPI-572](https://linear.app/amo100/issue/IPI-572) phone layouts | CRM is feature-complete. It needs sign-off, not building |
| **B · Planner** | 🟡 **4 of 8 surfaces** | [IPI-579](https://linear.app/amo100/issue/IPI-579) Timeline → [IPI-580](https://linear.app/amo100/issue/IPI-580) Kanban+List → [IPI-581](https://linear.app/amo100/issue/IPI-581) Calendar → [IPI-582](https://linear.app/amo100/issue/IPI-582) Task Detail — **all four still Backlog** | `/app/planner/[id]` renders the literal string *"{label} view — content ships in a later Planner ticket"* (`planner-workspace-shell.tsx:25`, verified live). The Planner is a working shell around three empty tabs |
| **C · Cross-app mobile** | ⚪ not ticketed | Still unscoped as an initiative | No deliberate mobile strategy outside CRM |
| **D · Onboarding v2** | 🟡 **1 of 12 children** | 10 tickets at 0%. Full tracker below | A new brand cannot self-serve. `/onboarding` writes nothing to the database |
| **E · Mastra / Cloudflare** | 🟡 **~55% platform, 0% DNS cutover** | Durable Worker storage still `noop`; HD canary flag defaults `false`; agent-wave W2+ Backlog; DNS cutover blocked | App still on **Vercel**; custom `ai-gateway` Worker still carries prod AI; OpenNext preview exists but is not `ipix.co` |
| **— · Security** | 🔴 **half-shipped** | [IPI-809](https://linear.app/amo100/issue/IPI-809) PR 2 — **reopened to Todo** 2026-07-30; live grants still PUBLIC+anon EXECUTE | Do not let [IPI-836](https://linear.app/amo100/issue/IPI-836) gate #11 pass on Linear status alone |

### The single highest-leverage next move

**[IPI-809](https://linear.app/amo100/issue/IPI-809) PR 2 — the function-grant revokes.** One migration, closes a live security hole, and it is the only row in this file where the doc and the database disagree about whether something is finished. Everything else here is additive feature work.

### Then, in this order

```text
1. IPI-809 PR 2                          security · one migration · unblocks Lane D's production gate
2. IPI-579 → 580 → 581 → 582             Planner views · the biggest functional hole in the product
   ∥ IPI-829 ∥ 834 ∥ 837 ∥ 840/841/842   Onboarding day-0 work · no blockers, runs in parallel
3. IPI-832 → IPI-835                     Onboarding session RPC + real integration
4. IPI-370 · IPI-572                     CRM sign-off + phones (both already In Progress)
5. IPI-843 → IPI-836                     Onboarding QA → controlled production proof
```

**Do not** treat Lane A rows 3–6 or 10 as open work — they shipped 2026-07-20/21. **Do not** cite `IPI-528` for the Matching→Booking button; [`index.md`](../index.md) line 262 already records that as a miscitation (IPI-528 is a CI-linter / Gemini ticket, not a booking one).

---

## Resolved — the July-12 morning session plan (was "read first," now historical)

The original correction below named IPI-367 as the actual Deal Detail blocker, not IPI-396 (already Done). **IPI-367 is now Done too** — merged same day, PRs [#337](https://github.com/amo-tech-ai/lumina-studio/pull/337) (app code) + [#341](https://github.com/amo-tech-ai/lumina-studio/pull/341) (migration), plus three small follow-on PRs from a merge-readiness audit: [#345](https://github.com/amo-tech-ai/lumina-studio/pull/345) (doc-link fixes), [#346](https://github.com/amo-tech-ai/lumina-studio/pull/346) (Playwright regression test), and [#344](https://github.com/amo-tech-ai/lumina-studio/pull/344) (a small Deal Detail centering CSS fix found during real-browser verification, no ticket needed). Deal Detail now has a real, RLS-hardened, live-verified `won`/`lost` write path with brand-conversion handoff. See the full audit trail: [`tasks/AUDIT/crm-337=341-audt.md`](tasks/AUDIT/crm-337=341-audt.md), [`tasks/AUDIT/ipi-367-real-world-browser-workflow-audit.md`](tasks/AUDIT/ipi-367-real-world-browser-workflow-audit.md), [`tasks/AUDIT/pr-343-344-audit.md`](tasks/AUDIT/pr-343-344-audit.md).

Original reasoning (kept for traceability): the proposed order named **IPI-396 "CRM Deal Detail React Implementation"** as the biggest remaining piece. Checked Linear directly: **IPI-396 is already Done** (merged PR #311, 2026-07-10) — and it deliberately shipped a *narrow* slice (real reads, working non-terminal stage moves, Won/Lost dialog UI that always errors honestly). Won/Lost was **out of scope by design**, deferred to a separate ticket — IPI-367, now also Done.

Also confirmed correct, unchanged: your CRM percentages (Companies 80 / Company Detail 85 / Contacts 80 / Contact Detail 85 / Pipeline 85 / Hub 100-of-tiny-scope) — **Deal Detail moves from 15% to substantially complete** with IPI-367 shipped — and CRM-before-Planner (Planner has zero UI despite a done, tested 440-line backend engine — pure build-order fact, not a design gap).

---

## Lane A — CRM completion (do this first)

| # | Task | Ticket | Status | Why here |
|--:|---|---|:--:|---|
| 1 | Matching→Booking "Request booking" button re-enable | [IPI-528](https://linear.app/amo100/issue/IPI-528) | 🟡 **In Progress** | Unrelated to CRM but a one-toggle fix blocking a working flow. Already started (2026-07-12) — finish this first, it's nearly free. |
| 2 | ~~Won/Lost HITL gate + brand conversion route~~ | [IPI-367](https://linear.app/amo100/issue/IPI-367) | 🟢 **Done** (2026-07-12) | Shipped. PRs #337 + #341, all 12 acceptance criteria checked, live-verified via `verify-rls.mjs` + real browser journeys (won/lost, cross-org rejection, race conditions, retry). This was the real Deal Detail blocker — now cleared. |
| 3 | Companies + Contacts: enable New/Filter actions | [IPI-562](https://linear.app/amo100/issue/IPI-562) | 🟢 **Done** (2026-07-20) | **[corrected 2026-07-30]** — was listed ⚫ Backlog. Shipped 2026-07-20T17:35Z. |
| 4 | Pipeline UX polish — owner filter, keyboard/button move (a11y, flagged P1 in `crm/crm-audit.md`), mobile stage-accordion | [IPI-563](https://linear.app/amo100/issue/IPI-563) | 🟢 **Done** (2026-07-20) | **[corrected 2026-07-30]** — was listed ⚫ Backlog. Shipped 2026-07-20T17:37Z. See also [IPI-571](https://linear.app/amo100/issue/IPI-571) (pipeline colors/totals, Done 2026-07-21). |
| 5 | crm-assistant wave 2 — health scoring, relationship summaries, follow-up drafts, IntelligencePanel sections | [IPI-369](https://linear.app/amo100/issue/IPI-369) | 🟢 **Done** (2026-07-20) | **[corrected 2026-07-30]** — was listed 🔴 Todo and called "the actual next CRM ticket." It shipped 2026-07-20T17:38Z. This was the last real CRM feature blocker; nothing in Lane A is gated on it now. |
| 6 | CRM route welcome + suggestion chips | [IPI-374](https://linear.app/amo100/issue/IPI-374) | 🟢 **Done** (2026-07-21) | **[corrected 2026-07-30]** — was listed 🔴 Todo. Shipped 2026-07-21T22:26Z. |
| 7 | Notification Center UI (bell/panel) | [IPI-407](https://linear.app/amo100/issue/IPI-407) | 🟢 **Done** (2026-07-19) | **[corrected 2026-07-30]** — was listed against `IPI-527` as ⚫ Backlog with "zero UI consumers." The inbox shipped as **IPI-407 · SCR-15** (commit `47154523`); `/app/inbox` exists on `main` with `page.tsx` + `loading.tsx`. `IPI-527` could not be resolved in Linear this pass — treat that ID as suspect, same class as the IPI-528 miscitation. |
| 8 | CRM MVP acceptance verification | [IPI-370](https://linear.app/amo100/issue/IPI-370) | 🟡 **In Progress** | **[corrected 2026-07-30]** — was 🔴 Todo "blocked by #5." **Its blocker is gone** (IPI-369 Done) and the ticket is already started. Owns the cross-org RLS pen test + final 6-screen browser sign-off. **This is one of only two open items in Lane A.** |
| 9 | CRM Hub scope decision | — no ticket needed | 🟢 done | Keep the redirect (`/app/crm` → `/app/crm/companies`). No product ask for KPIs/recent-activity/AI-recommendations surface exists — building one now would be exactly the scope creep `crm-plan.md` §20 already ruled against. Revisit only if Product asks. |
| 10 | Regenerate `types/supabase.ts` for `crm_convert_deal` | [IPI-566](https://linear.app/amo100/issue/IPI-566) | 🟢 **Done** (2026-07-21) | **[corrected 2026-07-30]** — was listed ⚫ Backlog/Low. Shipped 2026-07-21T20:06Z, alongside [IPI-373](https://linear.app/amo100/issue/IPI-373) (Deal Detail design sign-off, also Done 2026-07-21 — the "paperwork" note below is now historical). |
| 11 | Make SCR-26–31 CRM usable on phones | [IPI-572](https://linear.app/amo100/issue/IPI-572) | 🟡 **In Progress** | **[added 2026-07-30]** — was missing from this table entirely. **The other of Lane A's two open items.** |

**Not on the critical path, no action needed:** IPI-373 (design sign-off for 02f) is paperwork tracking a screen that already shipped — don't let it block anything, same lesson as the cancelled Planner docs ticket. CRM-POST-*/CRM-ADV-* backlog items (journey replay, digital twin, relationship graph, market intelligence, etc.) are correctly sitting in Backlog, not Todo — leave them there; `crm-plan.md` §20 already triaged them as Future.

**Shipped this session, not separately ticketed (process/tooling, not product):** the `design-to-production` skill's Phase 0 now leads with a live-Supabase audit before trusting any local schema/migration file (PR #343) — direct outcome of catching the IPI-367 migration-ledger drift. `lessons.md` gained entry #9 documenting that drift as a reusable guard. See the [Linear lessons doc](https://linear.app/amo100/document/lessons-design-v2-scr-builds-2026-07-12-15594af0ea05) in DESIGN V2 for the summary.

---

## Lane B — Planner foundation (in parallel with Lane A)

Backend is done ([IPI-476](https://linear.app/amo100/issue/IPI-476), [IPI-477](https://linear.app/amo100/issue/IPI-477)) — 440-line tested `PlannerEngine`.

**Superseded 2026-07-18 — the table below replaces the 2026-07-12 version, which had drifted hard.** Re-checked live against Linear *and* against production (`ipix.co/app`, real operator login, not local dev): rows 1-2, 5, 7-9 of the old table were marked "Not started" but were actually Done days ago; rows 6 (IPI-555), 3-4 partially (old IPI-542/546/548/550) were citing ticket IDs that got Canceled/Duplicate/repurposed after a 2026-07-12→07-16 restructure into narrower `PLN-S1x` slices. Kept below for traceability; do not cite the old IDs going forward.

**Ticket count (2026-07-12 note, now historical):** the original roadmap draft planned ~54 tickets; 33 were created, ladder-reviewed to ~10 active + 23 cancelled. That "~10 active" set has itself since been split further into `PLN-S1A–G` slices (see table). AI/CopilotKit tools, Cloudflare presence/notifications, Analytics, and Reliability correctly remain unticketed for v1.

| # | Task | Ticket | Status | Evidence |
|--:|---|---|:--:|---|
| 1 | Foundation — routes, state-mgmt decision, core infra | [IPI-536](https://linear.app/amo100/issue/IPI-536) | 🟢 Done (2026-07-14) | Linear |
| 2 | Data — Dashboard & Hub reads | [IPI-538](https://linear.app/amo100/issue/IPI-538) | 🟢 Done (2026-07-14) | Linear |
| 3 | Data — Settings & member mutations | [IPI-575](https://linear.app/amo100/issue/IPI-575) | 🟢 Done (2026-07-14) | Linear |
| 4 | Security hardening (anon-EXECUTE cleanup on 9 Planner functions) | [IPI-544](https://linear.app/amo100/issue/IPI-544) | 🟢 Done (2026-07-15) | Linear |
| 5 | Hub | [IPI-526](https://linear.app/amo100/issue/IPI-526) | 🟢 Done (2026-07-16) | Linear + live: `/app/planner` shows 2 real plans, needs-attention banner, type/status filters |
| 6 | Dashboard | [IPI-576](https://linear.app/amo100/issue/IPI-576) | 🟢 Done (2026-07-16) | Linear + live: `/app/planner/dashboard` shows real KPI tiles (9% progress, 1 at risk), recent-plans cards |
| 7 | Workspace shell + view switching | [IPI-578](https://linear.app/amo100/issue/IPI-578) | 🟢 Done (2026-07-14) | Linear + live: `/app/planner/[id]` renders Timeline/Kanban/Calendar/List tab shell |
| 7b | Workspace data — reads (`getInstanceDetail`, `listDependencies`, `getViewConfig`) | [IPI-574](https://linear.app/amo100/issue/IPI-574) | 🟢 Done (2026-07-16), reads only | Linear. **Scope-corrected 2026-07-16 by its own description**: the mutation adapters it originally scoped (`updateTask`/`shiftTask`/`setViewConfig`) were never built — confirmed live against `app/src/lib/planner/mutations.ts`, zero task-level functions. Don't assume Done here means mutations exist; that work moved to row 9b. |
| 8 | Workspace — Timeline (read-only) | [IPI-579](https://linear.app/amo100/issue/IPI-579) | ⚪ Backlog | Live: tab shows literal "Timeline view — content ships in a later Planner ticket." |
| 9 | Workspace — Kanban + List | [IPI-580](https://linear.app/amo100/issue/IPI-580) | ⚪ Backlog | Live: same placeholder pattern confirmed on Kanban tab |
| 9b | Workspace mutation adapters (`updateTask`/`shiftTask`/`setViewConfig` RPCs + Server Actions) | [IPI-649](https://linear.app/amo100/issue/IPI-649) | 🟢 Done (2026-07-16) | Linear — **corrected 2026-07-18 pass 3**, wrongly marked Backlog in the prior pass (missed a direct lookup). PRs #418 (migration-only RPCs), #420 (application adapters + Server Actions), #423 (forensic audit evidence). Row 10b's blocker on this is now cleared. |
| 10 | Workspace — Calendar | [IPI-581](https://linear.app/amo100/issue/IPI-581) | ⚪ Backlog | Linear only, not re-clicked live this pass |
| 10b | Workspace — Task Detail + Safe Mutations (wires `ApprovalCard` to IPI-483's contract; 3 mutation classes, only `shiftTask` drag-based) | [IPI-582](https://linear.app/amo100/issue/IPI-582) | ⚪ Backlog, blocked by `IPI-579`/`IPI-580`/`IPI-581`/`IPI-483` only | Linear — added 2026-07-18 pass 2. **Corrected pass 3:** its mutation-foundation blocker (`IPI-649`, row 9b) is Done, not Backlog — the issue's own Linear description is stale on this point (still says "IPI-649 (Backlog...)"), worth a quick fix there too. This is the ticket that actually makes Timeline/Kanban/Calendar's cards editable once their read-only views (8/9/10) land. |
| 11 | Settings + Invite | [IPI-577](https://linear.app/amo100/issue/IPI-577) | 🟢 Done (2026-07-14) | Linear + live: `/app/planner/[id]/settings` — Members tab live with real member row; Notifications/Workflow/Danger-zone tabs visibly disabled |
| 12 | Mobile/tablet layouts | [IPI-557](https://linear.app/amo100/issue/IPI-557) | ⚪ Backlog | Linear |
| 13 | Staging deploy / rollback / production verification (release gate) | [IPI-542](https://linear.app/amo100/issue/IPI-542) | 🟢 **Done** (2026-07-20) | **[corrected 2026-07-30]** — was listed ⚫ Backlog "not yet run." Shipped 2026-07-20T06:45Z. |
| 14 | Also Done since this table was written, not previously listed | [IPI-535](https://linear.app/amo100/issue/IPI-535) engine integration · [IPI-551](https://linear.app/amo100/issue/IPI-551) adaptive context panel · [IPI-647](https://linear.app/amo100/issue/IPI-647) instance-assignment read policies · [IPI-650](https://linear.app/amo100/issue/IPI-650) create-instance flow · [IPI-653](https://linear.app/amo100/issue/IPI-653) instance creation service | 🟢 **Done** | **[added 2026-07-30]** — the Planner data + engine + security layers are complete. What is missing is purely the four workspace **views**, rows 8/9/10/10b. |

Note: old row 3 ("Shared components & hooks," previously cited as IPI-542) tracked a dead mapping — the actual component tickets (IPI-546 PlannerHeader/Toolbar, IPI-548 StatusChip, IPI-550 Empty/Loading/Error states, IPI-540 state-mgmt ADR) were Canceled 2026-07-12 and folded into Foundation (#1) instead of shipping standalone. IPI-542 was later repurposed to the release-gate ticket now in row 13.

**Correct build order for Workspace (corrected 2026-07-18 pass 3):**

```
✅ IPI-574 · PLN-DATA-001B — Planner Data Workspace Reads (Done)
✅ IPI-649 · PLN-DATA-001B-M — Complete Planner Workspace Mutation Adapters (Done)
Next, can run as separate concerns in parallel:
  IPI-579 · PLN-S1B — Planner Timeline Read-Only View (Backlog)
  IPI-580 · PLN-S1C — Planner Kanban and List Views (Backlog)
  IPI-581 · PLN-S1D — Planner Calendar View (Backlog)
  IPI-483 · Workflow Engine v2 — Dependencies and Approvals (status not re-checked this pass)
Then, once the above contracts exist:
  IPI-582 · PLN-S1E — Planner Task Detail and Safe Mutations (Backlog)
  → IPI-583 · Responsive/A11y QA (unblocked by 582, not yet added as its own row)
```

The mutation *foundation* (`IPI-649`) is already done — it's the read-only views (579/580/581) and the approvals engine (483) that gate `IPI-582`, not a missing data layer. Do not revive `IPI-552`/`IPI-553` — both dead (Duplicate/Canceled).

**Deferred, correctly not ticketed yet:** AI/CopilotKit tools, Cloudflare presence/notifications — gated on the unrelated Mastra/Cloudflare provider cutover epic (IPI-485), not a Planner-specific delay.

---

## Lane C — Cross-app mobile (future initiative, not yet ticketed)

Zero deliberate mobile-responsive strategy exists anywhere in the operator app today. Command Center, Brand, Shoots, and CRM are all untracked for mobile. Scope this as its own initiative once Lane A + B ship — don't assume it "comes along" with each screen ticket.

**[re-verified 2026-07-30]** — `useMediaQuery` **0 files**, `BottomSheet` **0 files**, but `matchMedia` is now in **2 files** (was 0). The "zero strategy" claim still holds directionally, but it is no longer literally zero — CRM's phone work ([IPI-572](https://linear.app/amo100/issue/IPI-572), In Progress) is introducing the first usages. Re-check before quoting this line as evidence.

---

## Lane D — Onboarding v2 progress tracker (DESIGN V2 · epic IPI-831)

**Verified:** 2026-07-30 against `origin/main` @ `3e653702`, live production Supabase `nvdlhrodvevgwdsneplk`, and live staging `wtuhdynujhszsbwxlbdi`. Every row below was re-proved this pass — no status was copied from a Linear field.

**Section legend (differs from this file's global legend above — the four dots the tracker was asked for):**

| Dot | Meaning |
|:---:|---|
| 🟢 | Complete — acceptance criteria met and proved |
| 🟡 | In progress — partially met, remainder identified |
| 🔴 | Failed — shipped or marked Done but does not hold up under verification |
| ⚪ | Not started — zero code, zero evidence |

### Headline

**1 of 12 tickets in this epic is genuinely complete.** The only onboarding v2 code that has ever shipped is **IPI-833 · ONB2-UI-001 (Standalone Onboarding Route, Screens, and Deterministic State Machine)** — one squashed commit, `02093876` (PR #657). It is the *only* commit that has ever touched `app/src/app/(onboarding)/`, `app/src/components/onboarding/`, or `app/src/lib/onboarding/`.

The `/onboarding` route is a **working, local-state-only prototype**. It writes nothing to the database, runs no crawl, and produces no Brand DNA. Every ticket that connects it to real data is at 0%.

### Tracker

| # | Task | Ticket | Dot | % | Verified evidence (re-runnable proof) |
|--:|---|---|:--:|--:|---|
| 1 | Standalone route, 13 screens, deterministic state machine | [IPI-833](https://linear.app/amo100/issue/IPI-833) | 🟢 | 100% | `app/src/app/(onboarding)/onboarding/page.tsx` + 20 files live on `main`. `npx vitest run src/components/onboarding src/lib/onboarding` green. Not in the review list but it is the epic's only shipped child |
| 2 | Organization tenant isolation (PR 1 of 2) | [IPI-809](https://linear.app/amo100/issue/IPI-809) | 🟡 | 50% | **PR 1 verified live:** `organizations_select` = `is_org_member(id) OR (select auth.uid()) = owner_id`; zero `USING (true)` SELECT policies. **PR 2 never landed** — see row 13 |
| 3 | Onboarding sessions + atomic materialization RPC | [IPI-832](https://linear.app/amo100/issue/IPI-832) | ⚪ | 0% | Live SQL: `onboarding_sessions` table = **0**, `%materialize%` functions = **0**. No migration, no `008_onboarding_sessions.sql`. `app/src/lib/onboarding.ts:79-92` still does 2 round trips with an unchecked `.delete()` undo; `:10` still ends the slug in `Math.random()` |
| 4 | Evidence-backed Brand DNA + Mastra contract enforcement | [IPI-834](https://linear.app/amo100/issue/IPI-834) | ⚪ | 0% | `brand-intelligence-workflow.ts:195` still `z.object({ ok: z.boolean() })`, `:269` `{ enriched: z.boolean() }`, `:288` `{ draftId: z.string() }` — the exact fail-open gap. `brand-profile.schema.json` has no `{value, evidence[]}` claim shape, no `schemaVersion`, no `quote`/`crawlResultId` |
| 5 | Real session, crawl, Realtime progress, approval, recovery | [IPI-835](https://linear.app/amo100/issue/IPI-835) | ⚪ | 0% | Live `pg_publication_tables`: only `brand_crawls` + `brand_crawl_results` — **`brands` is still unpublished**, so the `table: "brands"` subscription at `analysis-progress-banner.tsx:55` can never fire. `:84` still a bare `.subscribe()`, no status callback. `/onboarding` local state only; `/app/onboarding` still live |
| 6 | Playwright QA journeys + controlled production verification | [IPI-836](https://linear.app/amo100/issue/IPI-836) | ⚪ | 0% | No `e2e/14-onboarding.spec.ts` (highest is `13-operator-sign-out.spec.ts`). `git grep ONBOARDING_V2` → **zero hits**; the production gate flag is still fiction |
| 7 | Preserve safe post-login redirect through Google OAuth | [IPI-837](https://linear.app/amo100/issue/IPI-837) | ⚪ | 0% | `login-form.tsx:41` still `redirectTo: ${origin}/auth/callback` — no carrier. `auth/callback/route.ts` still hardcodes `successUrl = ${origin}/app`; all 4 failure paths return bare `/login?error=auth`. No `oauth_next` cookie anywhere |
| 8 | Provision QA Supabase project + wire `QA_DATABASE_URL` | [IPI-829](https://linear.app/amo100/issue/IPI-829) | ⚪ | 0% | Staging `wtuhdynujhszsbwxlbdi` live: **219 migrations, latest `20260720032827`, `pgtap` = 0** — byte-for-byte the "before" state in the ticket. Zero of the 11 steps executed |
| 9 | Sync address bar with clamped hash on invalid deep links | [IPI-840](https://linear.app/amo100/issue/IPI-840) | 🟡 | 75% | **Ticket premise is stale — 3 of 4 AC already pass.** Live jsdom probe on `main`: `#999`→screen 13 **and** `location.hash=#13`; `#abc`/`#0`/`#-1`→screen 1 **and** `#1`. `use-screen-history.ts:78-83` already replaces (not pushes) with the clamped value. **Remaining:** the regression test (AC 4) and the popstate branch at `:96`, which applies the clamp with no matching `replaceState` |
| 10 | Correct `COMPONENTS.md` onboarding claims | [IPI-841](https://linear.app/amo100/issue/IPI-841) | ⚪ | 0% | `COMPONENTS.md:25` and `:215` both still say WizardStep is "Used on Shoot Wizard, **Onboarding**". `StepIndicator` appears **0 times** in the file. ⚠️ AC 1 is unlocatable — no "interchangeable copy" claim about marketing screens exists in the file; rescope before working it |
| 11 | Regression cover for analysis timer resume after backgrounding | [IPI-842](https://linear.app/amo100/issue/IPI-842) | ⚪ | 0% | No `document.hidden` / `visibilitychange` reference in any onboarding test. Ticket self-cancels if IPI-835 deletes the placeholder timer first — decide that before writing coverage for dead code |
| 12 | Verify at 390×844 + `prefers-reduced-motion` on deployed preview | [IPI-843](https://linear.app/amo100/issue/IPI-843) | ⚪ | 0% | `docs/qa/evidence/` does not exist. No onboarding evidence directory anywhere. Only attachment on the issue is PR #657 |
| — | **Epic rollup** | [IPI-831](https://linear.app/amo100/issue/IPI-831) | 🟡 | **~20%** | 1.5 of 7 children complete (IPI-833 fully, IPI-809 half). 5 of 6 epic done-criteria unmet |

**How % was calculated:** verified acceptance criteria met ÷ total acceptance criteria in that ticket's own AC list. Not effort, not confidence, not lines of code.

### Needs attention — 3 findings that change what you do next

| # | Finding | Impact | Action |
|--:|---|---|---|
| 13 | 🔴 **IPI-809 PR 2 still open** (Linear reopened → Todo 2026-07-30). Live: eight org helpers/triggers still PUBLIC+anon EXECUTE | IPI-836 gate #11 must check live SQL, not Linear Done | Ship PR 2 from rewritten ticket Steps 0–4 |
| 14 | 🟡 **IPI-840 is describing a bug that no longer exists.** The QA note was taken against a pre-merge build; the fix is in the merged commit | A Low-priority ticket will send people hunting a fixed defect | Rescope to regression test + popstate `replaceState` (~10 lines) |
| 15 | ⚪ **Ledger drift (repo vs prod) largely cleared** on `main` @ `4f69f4f3` — migrations through `20260730032949` + follow-ups landed via IPI-861 | Staging (`wtuhdynujhszsbwxlbdi`) may still lag — re-baseline IPI-829 step 2 against staging, not "repo vs prod" | Re-probe staging before starting IPI-829 |

### Staged verification plan — prove each stage before starting the next

Each stage has an exit gate that is a **command or a query**, not a judgement. Do not advance on "looks right."

| Stage | Work | Exit gate — must return the stated result |
|:--:|---|---|
| **0** | Reconcile ledger drift (finding 15) · reopen IPI-809 PR 2 (finding 13) · rescope IPI-840 + IPI-841 (findings 14, row 10) | `has_function_privilege('anon','public.is_org_member(uuid)','EXECUTE')` → **false** · repo migration count == production `schema_migrations` count |
| **1** | Four day-0 tickets in parallel: **IPI-829**, **IPI-834**, **IPI-837**, and the rescoped **IPI-840 / IPI-841 / IPI-842** | 829: staging `select max(version) from supabase_migrations.schema_migrations` → `20260726220514` **and** `pgtap` extension count → 1 · 834: `npx vitest run src/mastra/workflows/brand-intelligence-workflow.test.ts` green with `evidence: []` **rejected** · 837: `npx vitest run src/app/auth src/components/marketing src/lib/safe-redirect.test.ts` green on success + all 4 failure paths |
| **2** | **IPI-832** — slices A (migration), B (code), C (tests) | `select count(*) from pg_proc where proname='materialize_onboarding_session'` → 1 · `supabase test db --db-url "$QA_DATABASE_URL" supabase/tests/database` green incl. all 11 new assertions · the `Promise.all` race test returns **identical** org+brand ids from both callers |
| **3** | **IPI-835** — slices A–D | `select attnames from pg_publication_tables where tablename='brands'` → exactly `{id,intake_status,updated_at}` · `npx vitest run src/components/brand-hub/analysis-progress-banner.test.tsx` green, incl. **test 5 (slow ≠ failed)** · `/app/onboarding` deleted in the same commit that proves the new route works |
| **4** | **IPI-843** then **IPI-836** slices A + B | 843: screenshots at 390×844 for screens 1, 5, 12, 13 committed under `docs/qa/evidence/<date>/onboarding/` · 836: `npx playwright test e2e/14-onboarding.spec.ts --project=chromium-desktop` green, SQL asserts exactly 1 session / 1 org / 1 brand / 1 crawl per attempt |
| **5** | **IPI-836** slice C — controlled production run. **No PR. Explicit human go-ahead required** | Re-run (do not quote) `select count(*) from pg_policy p join pg_class c on c.oid=p.polrelid where c.relname='organizations' and p.polcmd='r' and pg_get_expr(p.polqual,p.polrelid)='true'` → **0** · flag defaults **off** · rollback rehearsed before the flip, not after |

**Non-negotiable across every stage:** no test writes to production (`echo "$QA_DATABASE_URL" \| grep -c nvdlhrodvevgwdsneplk` → **0**, in CI, not in someone's memory) · every SQL fixture wrapped `begin; … rollback;` · a client-side timeout never marks a backend workflow failed.

---

## Lane E — Mastra / Cloudflare progress tracker (AI Platform · IPI-487)

**Verified:** 2026-07-30 against `origin/main` @ `4f69f4f3`, live Supabase `nvdlhrodvevgwdsneplk` (`mastra` schema = **33** tables, `public.mastra_*` shadows = **33**), Cloudflare Workers (`ipix-operator-preview`, `ai-gateway`, HD probes), and Linear projects above. Companion SSOT until refreshed: [`tasks/cloudflare/todo.md`](../tasks/cloudflare/todo.md) (stale as of 2026-07-26).

**Section legend:** 🟢 complete · 🟡 in progress · 🔴 failed verification · ⚪ not started

### Headline

Platform plumbing is largely built; **production operator app is still on Vercel**. OpenNext Worker preview exists; Mastra on that Worker still runs **`MASTRA_STORAGE_MODE=noop`** (InMemory) despite Linear marking durable-storage tickets Done. Custom Worker `ai-gateway` remains the live AI path. Native agent-wave migration stopped after marketing (W1).

### Tracker (implementation order)

| # | Task | Ticket | Dot | % | Verified evidence |
|--:|---|---|:--:|--:|---|
| 1 | OpenNext CI + deploy pipeline | [IPI-472](https://linear.app/amo100/issue/IPI-472) | 🟢 | 100% | Pipeline shipped; Worker `ipix-operator-preview` live in CF account |
| 2 | Worker bundle size gate | [IPI-490](https://linear.app/amo100/issue/IPI-490) · [IPI-706](https://linear.app/amo100/issue/IPI-706) · [IPI-844](https://linear.app/amo100/issue/IPI-844) | 🟢 | 100% | Linear Done; `cf-mastra-*-stub` + gzip headroom path on `main` |
| 3 | Workers AI via `ipix-prod` gateway (one call) | [IPI-586](https://linear.app/amo100/issue/IPI-586) | 🟢 | 100% | Native `env.AI` + gateway id path documented; Edge REST via [IPI-697](https://linear.app/amo100/issue/IPI-697) |
| 4 | Edge Deno → AI Gateway REST (Brand Intelligence) | [IPI-695](https://linear.app/amo100/issue/IPI-695) · [IPI-697](https://linear.app/amo100/issue/IPI-697) · [IPI-699](https://linear.app/amo100/issue/IPI-699) | 🟢 | 100% | CF-EDGE track Done |
| 5 | Mastra schema cutover `public` → `mastra` | [IPI-628](https://linear.app/amo100/issue/IPI-628) · [IPI-792](https://linear.app/amo100/issue/IPI-792) · [IPI-796](https://linear.app/amo100/issue/IPI-796) | 🟢 | 100% | Live: `mastra` = 33 tables |
| 6 | Mastra RLS / runtime grants | [IPI-629](https://linear.app/amo100/issue/IPI-629) · [IPI-621](https://linear.app/amo100/issue/IPI-621) | 🟢 | 100% | Linear Done; pgTAP path exists |
| 7 | Lock `public.mastra_*` shadows (Phase A) | [IPI-801](https://linear.app/amo100/issue/IPI-801) Phase A | 🟢 | 50% of ticket | Lock migrations on `main`; **33 shadow tables still present** |
| 8 | DROP `public.mastra_*` after soak (Phase B) | [IPI-801](https://linear.app/amo100/issue/IPI-801) | 🟡 | 50% | Linear **In Progress**; live `public` still has 33 `mastra_*` — **do not DROP yet** |
| 9 | Hyperdrive binding + helpers + canary wire | [IPI-619](https://linear.app/amo100/issue/IPI-619) · [IPI-620](https://linear.app/amo100/issue/IPI-620) · [IPI-622](https://linear.app/amo100/issue/IPI-622)–[IPI-624](https://linear.app/amo100/issue/IPI-624) · [IPI-822](https://linear.app/amo100/issue/IPI-822)–[IPI-828](https://linear.app/amo100/issue/IPI-828) | 🟢 | 100% | Flag + docs + allowlist tests on `main` |
| 10 | HD thread canary **enabled** in preview | [IPI-623](https://linear.app/amo100/issue/IPI-623) runtime AC | 🟡 | 75% | Code Done; `wrangler.jsonc` still `"ENABLE_HYPERDRIVE_THREAD_CANARY": "false"` (all envs) |
| 11 | Durable Mastra Postgres on CF Worker | [IPI-803](https://linear.app/amo100/issue/IPI-803) | 🔴 | 25% | Linear **Done** — but `app/wrangler.jsonc` still `MASTRA_STORAGE_MODE=noop` on every env. Storage is InMemory, not durable |
| 12 | Worker memory under concurrent load | [IPI-839](https://linear.app/amo100/issue/IPI-839) | ⚪ | 0% | Todo — blocks trusting Worker Mastra at scale |
| 13 | Migrate public marketing agent (W1) | [IPI-753](https://linear.app/amo100/issue/IPI-753) | 🟢 | 100% | Done |
| 14 | Agent-wave harness + W2/W3 operator agents | [IPI-769](https://linear.app/amo100/issue/IPI-769) · [IPI-751](https://linear.app/amo100/issue/IPI-751) · [IPI-752](https://linear.app/amo100/issue/IPI-752) | ⚪ | 0% | Todo / Backlog — next native-AI code after storage truth |
| 15 | Multi-turn tools + W4–W6 + zero-legacy soak | [IPI-591](https://linear.app/amo100/issue/IPI-591) · [IPI-609](https://linear.app/amo100/issue/IPI-609) | ⚪ | 0% | Backlog — after W2/W3 |
| 16 | Delete custom `ai-gateway` Worker | [IPI-592](https://linear.app/amo100/issue/IPI-592) | ⚪ | 0% | Blocked until zero-legacy; Worker still deployed |
| 17 | Preview smoke / rollback / branch rules / obs confirm | [IPI-707](https://linear.app/amo100/issue/IPI-707) · [IPI-708](https://linear.app/amo100/issue/IPI-708) · [IPI-794](https://linear.app/amo100/issue/IPI-794) · [IPI-709](https://linear.app/amo100/issue/IPI-709) | ⚪/🟡 | ~25% | 709 Done in Linear (ops confirm still needed); 707/708/794 Backlog |
| 18 | DNS cutover `ipix.co` → Workers + Vercel fallback | [IPI-631](https://linear.app/amo100/issue/IPI-631) | ⚪ | 0% | Backlog — **last**. App remains on Vercel today |
| 19 | Full integration convergence | [IPI-787](https://linear.app/amo100/issue/IPI-787) | ⚪ | 0% | After durable storage is *actually* on |
| 20 | Onboarding Brand DNA Mastra contract (product) | [IPI-834](https://linear.app/amo100/issue/IPI-834) | ⚪ | 0% | DESIGN V2 — see Lane D; fail-open `ok: boolean` still on `main` |
| — | **Lane E rollup** | [IPI-487](https://linear.app/amo100/issue/IPI-487) | 🟡 | **~55%** | Scaffold + HD + schema ✅ · durable Worker storage 🔴 · agent waves ⚪ · DNS ⚪ |

### Needs attention

| # | Finding | Impact | Action |
|--:|---|---|---|
| E1 | 🔴 **IPI-803 Done but Worker storage is still `noop`** | Claiming "durable Mastra on CF" is false; concurrent runs lose memory; IPI-839 is the symptom | Reopen or split "prove `MASTRA_STORAGE_MODE≠noop` on preview" AC; do not start IPI-631 |
| E2 | 🟡 **HD canary wired but off** (`false` in wrangler) | Code path unexercised in default deploys | Flip preview env only after soak checklist in `app/docs/hyperdrive-thread-canary-ops.md` |
| E3 | 🟡 **`tasks/cloudflare/todo.md` is 4+ days stale** | Engineers will start IPI-822/623 as if open | Separate docs PR to sync that file to Lane E |
| E4 | 🟡 **33/33 public shadows remain** (IPI-801) | Dual catalog drift risk | Finish soak → Phase B DROP; not a CF Worker change |

### Staged plan (exit gates = commands)

| Stage | Work | Exit gate |
|:--:|---|---|
| **0** | Reconcile IPI-803 truth · keep IPI-801 Phase B gated · refresh `tasks/cloudflare/todo.md` (own PR) | `rg 'MASTRA_STORAGE_MODE.: ."noop"' app/wrangler.jsonc` still documents reality · Linear IPI-803 AC matches wrangler |
| **1** | Prove HD canary on **preview only** (IPI-623 soak) ∥ fix Worker memory (IPI-839) ∥ agent harness (IPI-769) | Preview: canary `true` + one thread create/read via HD · memory repro closed or ticketed with evidence · harness tests green |
| **2** | Flip durable storage off `noop` on preview (real IPI-803 AC) | Preview wrangler/env `MASTRA_STORAGE_MODE` ≠ `noop` · Mastra thread survives Worker isolate recycle |
| **3** | W2 → W3 agent native path (IPI-751 → IPI-752) | Flags + contract tests; planner tools still work |
| **4** | Hosting gates: IPI-707 smoke · IPI-708 rollback · IPI-794 ruleset · IPI-709 alert proof | Each has a dated run log in PR/Linear |
| **5** | IPI-631 DNS cutover — **human go-ahead** · then IPI-609 → IPI-592 | `ipix.co` on Workers with tested Vercel fallback; custom Worker deleted only after zero legacy AI traffic |

**Parallel OK today:** Stage 1 three tracks (HD soak · IPI-839 · IPI-769) + Lane D day-0 tickets + IPI-809 PR 2 — separate PRs.

**Do not start:** IPI-631, IPI-592, IPI-801 DROP, global `AI_PROVIDER` / `BI_PROVIDER` flips.
