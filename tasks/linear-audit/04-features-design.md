# Linear Audit — Brand, CRM, Shoot/Booking, Campaign, Assets/Cloudinary, Notifications, Design V2

## Stack 07 — Brand and onboarding (score 80/100 🟡)

### Priority issues (28)

| Dot | Task | Current status | Correct status | Action | Exact correction | Blocker |
|---|---|---|---|---|---|---|
| 🟢 | IPI-278 — MASTRA-CLEAN-001 Unregister Brand Approval Scaffold | Done | Done | keep | Confirmed unregistered (PR #155). Minor: `workflows/README.md:16` still shows the old example — update text only. | none |
| 🟢 | IPI-132 — AIOR-003 Brand intake workflow (suspend/resume) | Done | Done | keep | 7-step workflow, start/resume/approve routes, approval card, draft banner all present. | — |
| 🟢 | IPI-46 — IPI-BI-P0 Fix Brand Onboarding Orchestration | Done | Done | keep | Order + UNIQUE/UPDATE RLS fix both verified in code/migration. | — |
| 🟢 | IPI-29 — IPI-BI-006 Brand Scoring v2 | Done | Done | keep | `computeDnaScore()` confirmed AVG of the 4 base scores only. | — |
| 🟢 | IPI-26 — IPI-BI-003 Supabase Schema v2 | Done | Done | keep | All 5 named tables/migrations present. | — |
| 🟢 | IPI-25 — IPI-BI-002 Gemini Prompt v2 | Done | Done | keep | Profile fields flow through the workflow as claimed. | — |
| 🟢 | IPI-24 — IPI-BI-001 Firecrawl Integration | Done | Done | keep | Crawl steps + tables present. | — |
| 🟢 | IPI-19 — Brand Hub `/app/brand/[id]` route | Done | Done | keep | Route file live on `origin/main`. | — |
| ⚪ | IPI-340 — MODEL-GATE-02 Send booking request | Done | Done (wrong stack) | move | Talent-booking RPC (Model Booking MVP project), mis-tagged into Brand/onboarding by keyword match. Move — no code issue. | move only |
| 🔴 | **IPI-336 — DESIGN-053 Onboarding React Parity (13-screen Zeely funnel)** | **Done** | **Reopen** | **reopen** | `/app/onboarding/page.tsx` is 264 lines, `DOTS=[1,2,3]` — a 3-step wizard, not a 13-screen funnel. Zero commits/PRs reference IPI-336/DESIGN-053/zeely/13-screen anywhere in `git log --all`. Last file edit 2026-06-25 (IPI-25's PR), a week *before* this issue's claimed 2026-07-06 completion. **Highest-impact finding in this stack.** | actual funnel build |
| 🟢 | IPI-272 — DESIGN-052 Brand List React Parity | Done | Done | keep | PR #181 merged; legacy client removed. | — |
| 🟢 | IPI-271 — DESIGN-051 Brand Detail React Parity | Done | Done | keep | Same PR #181; renamed rather than preserved file, cosmetic only. | — |
| 🟢 | IPI-242 — IPI-218 Revert PR #127 to 3-panel shell | Done | Done | keep | 3-column grid confirmed, no 4th column. | — |
| 🟢 | IPI-130 — AIOR-014 brand-intelligence Mastra agent | Done | Done | keep | Registered + wired for `/app/brand` and `/app/onboarding`. | — |
| 🟢 | IPI-52 — DASH-006 Brand Approval Cards + Timeline | Done | Done | keep | `approval-card.tsx` exists. | — |
| 🟡 | IPI-123 — DASH-003 Brand Intelligence Report View | Done | Done | keep, refresh description | All remaining ACs shipped (PRs #80/#81/#83); description's progress table still shows them as outstanding — text refresh only. | — |
| 🟢 | IPI-33 — IPI-BI-010 MVP Integration Tests | Done | Done | keep | Test file present, confirmed Vite-clean. | — |
| 🟢 | IPI-32 — IPI-BI-009 Mastra Workflow | Done | Done | keep | Uses `PostgresStore`, not in-memory — matches issue's own "non-negotiable correction." | — |
| 🟢 | IPI-31 — IPI-BI-008 Analysis Progress UX | Done | Done | keep | `analysis-progress-banner.tsx` + tests present. | — |
| 🟢 | IPI-30 — IPI-BI-007 Brand Hub v2 Full Profile UI | Done | Done | keep | All 4 tabs present. | — |
| 🟢 | IPI-28 — IPI-BI-005 Visual Identity Agent | Done | Done | keep | Agent + test present, no image-generation usage. | — |
| 🟢 | IPI-27 — IPI-BI-004 Social Discovery Agent | Done | Done | keep | Agent, tool, migration all present. | — |
| 🟢 | IPI-16 — IPI2-189 multi-brand org layer schema | Done | Done | keep | Both migrations present. | — |
| 🟢 | IPI-11 — IPI2-176 Onboarding wizard (3-step) | Done | Done | keep | **This is the actual live onboarding wizard** — directly contradicts IPI-336's claim of a 13-screen upgrade to it. | — |
| 🟢 | IPI-260 — DESIGN-076 Brand Intelligence Agent Route Wiring | Done | Done | keep | Tools + tests present (PR #157). | — |
| 🟢 | IPI-219 — IPI-218B Asset grid in brand context panel | Done | Done | keep | Confirmed wired to real API route. | — |
| ⚪ | IPI-99 — WEB-015.9 Login redirect + draft claim + prefill | Done | Unverifiable | — | Sparse description, no file paths; couldn't independently confirm the specific draft-claim/prefill behavior from expected file names — flagged, not disproven. | n/a |
| 🟢 | IPI-114 — AIOR-002b Real auth in CopilotKit runtime | Done | Done | keep | Production-mode demo-user fallback correctly guarded and fails closed. | — |

### Close/cancel

None beyond reopening IPI-336 (see above — that's a reopen, not a close).

### Rewrite candidates

- **IPI-336** — the priority fix in this entire audit. Either re-plan the 13-screen funnel as real new work, or correct the AC to match the shipped 3-step wizard and close as unnecessary/superseded.
- **IPI-123** — refresh the stale progress table (all gaps it lists are actually closed).

### Move-to-another-epic

- **IPI-340** — move to Talent/Model-Booking stack.
- **IPI-412** (rest batch, SCR-24 Talent Onboarding) — same mis-tagging pattern, move to Talent/Model screens track.

### Rest batch (42 issues) — patterns

Epic IPI-20 itself still shows Backlog even though its own "definition of done" is fully satisfied by verified-Done children — flip to Done/Ready. Agent-build backlog (IPI-34–41) all correctly Backlog, well-specified, no code found (expected). UX-principle backlog (IPI-199-203, 206, 207) legitimately Backlog, maps cleanly to CLAUDE.md's UX principles — sequence IPI-203/206 rather than parallelize (both touch `brand_scores.details`). IPI-45 and IPI-14 have overlapping surface area — split ownership before either starts. Canceled/Duplicate housekeeping (IPI-4, 12, 15, 76, 108, 23, 165, 13) internally consistent. No `VITE_` references anywhere.

---

## Stack 09 — CRM (score 62/100 🟡)

**`prd.md`/`roadmap.md` both label CRM "🟢 Mature/MVP-complete, shipped, incremental work only" — this audit finds that optimistic:** Deal Detail is a 28-line stub, the Won/Lost HITL gate has zero code, and AI wave-2 hasn't started.

### Priority issues (21)

| Dot | Task | Current status | Correct status | Action | Exact correction | Blocker |
|---|---|---|---|---|---|---|
| 🟡 | IPI-396 — SCR-31 CRM Deal Detail | In Progress | In Progress | keep | Confirmed a 28-line stub (`id`/org validation + `CrmScreenGate` placeholder). Route is `/app/crm/pipeline/[id]`, not `/app/crm/deals/[id]` as IPI-373 lists — reconcile. | none outstanding (IPI-395 now Done) |
| 🟡 | IPI-373 — CRM-DESIGN-001 Claude Design screen prompts completion | In Progress | rewrite/close | rewrite | Its own gating premise already failed — 4 of 6 screens shipped without it closing. Its cited deliverables (`tasks/crm/design/02a`–`02f`, master doc, audit doc) don't exist in the repo. Rewrite to "sign off Deal Detail visual parity only" or close as superseded. | its own artifacts missing |
| 🔴 | IPI-363 — CRM-UX-001 Companies list + detail | In Progress | **Done — close** | close | 100% shipped under IPI-391 (PR #269) + IPI-388/389. `tasks/crm/todo.md` already says "tracked as IPI-391 now" — Linear status never flipped. | stale bookkeeping only |
| 🔴 | IPI-364 — CRM-UX-002 Contacts list + detail | In Progress | **Done — close** | close | Shipped under IPI-392 (PR #274) + IPI-388/390. | none |
| 🔴 | IPI-403 — BE-CRM-OPT convenience RPCs | In Progress | **Todo/Backlog** | rewrite (status) | Zero of the 4 proposed RPCs exist. "In Progress" at 0% is misleading; own text already says defer. | wrong status label only |
| ⚪ | IPI-367 — CRM-AI-001 Won/Lost HITL gate + brand conversion | Todo | Todo | keep | No `/api/crm/deals/[id]/convert` route exists. DB guard trigger already live, waiting. Description still cites a dead blocker (IPI-366) though the structured relation was repointed to IPI-396 — prose not updated. | IPI-396 |
| ⚪ | IPI-370 — CRM-QA-001 MVP acceptance verification | Todo | Todo | keep | Correctly blocked by IPI-367+369. Cites 3 plan docs that don't exist in the repo. | IPI-367, 369 + missing plan doc |
| ⚪ | IPI-375 — CRM-POST-006 AI Concierge daily briefing | Todo | Todo | keep | Correctly blocked by IPI-370. | IPI-370 |
| 🟡 | IPI-374 — CRM-AI-004 Route welcome + suggestion chips | Todo | Todo, ready to start | rewrite (blocker) | Soft blocker (companies list) is now fully shipped — not truly blocked anymore. | none remaining |
| 🟡 | IPI-369 — CRM-AI-003 crm-assistant wave 2 | Todo | Todo, ready to start | rewrite (blocker) | Cited blocker (IPI-365) is Duplicate/canceled; successor IPI-395 is now Done. | none remaining |
| 🟢 | IPI-387 — RF-02 EntityList template | Done | Done | keep | `entity-list.tsx` confirmed. | — |
| 🟢 | IPI-385 — RF-01 StatusChip + CRM status tokens | Done | Done | keep | Confirmed. | — |
| 🟡 | IPI-395 — SCR-30 CRM Pipeline React Parity | Done | Done (scope-reduced) | keep | Real (PR #275). Description falsely claims `risk_score`/`stage_entered_at` are "🟢 live" — neither column exists on `crm_deals`. Shipped read-only (no drag/stage-change). Correct the description. | — |
| 🟢 | IPI-392 — RF-04b Contact detail + Profile360 extract | Done | Done (scope-reduced) | keep | Real (PR #274, includes a real jsonb bug fix). Deliberately not the full Profile360 engine, documented as intentional. | — |
| 🟢 | IPI-391 — RF-04a CRM Company detail page | Done | Done (scope-reduced) | keep | Real (PR #269), scope cuts honestly noted in-code. | — |
| 🟢 | IPI-390 — SCR-28 CRM Contacts List | Done | Done | keep | PR #272 merged. | — |
| 🟢 | IPI-389 — SCR-26 CRM Companies List | Done | Done | keep | PR #270 merged. | — |
| 🟢 | IPI-388 — RF-03 CRM Companies + Contacts lists | Done | Done | keep | PR #253 merged. | — |
| 🟢 | IPI-368 — CRM-AI-002 crm-assistant wave 1 | Done | Done | keep | 4 tools registered; won/lost blocked at the type level, matching DB trigger. | — |
| 🟢 | IPI-362 — CRM-DATA-001 Schema + RLS | Done | Done | keep | 4 tables, RLS×4, 16 policies, won/lost guard trigger all confirmed. | — |
| ⚪ | IPI-95 — WEB-015.2 capture-lead edge function | Done | Done (wrong stack) | move | Website lead-capture (project "AI Platform — LLM Providers"), mis-tagged into CRM by this audit's own keyword categorization, not a Linear filing error. | none |

### Close/cancel

**IPI-363, IPI-364** — close as Done/superseded (see table).

### Rewrite candidates

- **IPI-373** — rewrite scope to Deal Detail sign-off only.
- **IPI-403** — status correction only (In Progress → Backlog).
- **IPI-395** description — strip the false `risk_score`/`stage_entered_at` "live" claims and "real-time move" framing.

### Missing tasks (verified gap)

CRM SSOT documentation is missing wholesale — nearly every priority issue cites plan docs (`tasks/crm/05-crm-prd.md`, `02-crm-architecture-brief.md`, 3 of 4 `docs/plan/tasks/2026-07-04-crm-*.md` plans, `docs/crm/PROFILE-360-template.md`) that don't exist in the repo (several worktree-recovery commits this week suggest loss during cleanup). Recommend one cleanup task: restore from history or strip the dead references from the still-open issues (367, 369, 370, 373, 374, 375).

### Rest batch (10 issues)

6 Backlog CRM-POST/ADV issues correctly blocked by IPI-370, sensibly sequenced. IPI-393/394/365/366 (Duplicate) all correctly parented to their real successors, matching `todo.md`'s documented dedup pass.

---

## Stack 08 — Shoot and Booking + Model Booking MVP (scores 90/100 🟢 and 74/100 🟡)

**Note:** Shoot/Booking (the production-scheduling feature) and Model Booking MVP (a separate talent-booking initiative, different Linear project) share the word "booking" but are distinct tracks — scored separately below.

### Priority issues — Shoot/Booking (32 of 33; 1 shown separately for Campaign in stack 10)

| Dot | Task | Current status | Correct status | Action | Exact correction | Blocker |
|---|---|---|---|---|---|---|
| 🟡 | IPI-233 — FIX Workflow runtime chains API→DB (V-005) | In Progress (since 06-30) | In Progress, overdue | flag | Both blockers (IPI-227, 228) Done since 06-26/06-28; SLA breach was 2026-06-29 — 10+ days overdue, no evidence the manual verification checklist was executed. | none remaining, needs execution |
| 🟡 | IPI-488 — BE-SD1b Booking QA seed data + E2E reliability | In Progress | In Progress | keep | Real, unmerged: open, mergeable PR #288 touches E2E spec + seed data. | none |
| 🟢 | IPI-228 — FIX Shoot commit via /api/shoots/commit → RPC | Done | Done | keep | PR #136 merged. | — |
| 🟢 | IPI-112 — SHOOT-UX-000 CopilotKit v2 + AG-UI chat foundation | Done | Done | keep | Foundational, no drift. | — |
| 🟢 | IPI-411 — SCR-22 Booking Detail | Done | Done | keep | PR #287 merged 2026-07-09 — was 0% a week ago, genuinely shipped since. | — |
| 🟢 | IPI-410 — SCR-21 Booking Wizard | Done | Done | keep | PR #281 merged (+ follow-up PR #285). | — |
| 🟢 | IPI-397 — BE-B0b Booking Agent Verification & Finalization | Done | Done | keep | Draft-only guard confirmed live — agent never auto-confirms a booking. | — |
| 🟢 | IPI-371 — DESIGN-054c Shoot Detail Remaining Tab Parity | Done | Done | keep | Merged. | — |
| 🟢 | IPI-372 — DESIGN-055b Shoots List React Parity Workspace | Done | Done | keep | Merged 2026-07-05. | — |
| 🟢 | IPI-348 — MODEL-GATE-10 AI booking helper | Done | Done | keep | Agent file real. | — |
| 🟢 | IPI-347 — MODEL-GATE-09 Booking backend QA gate | Done | Done | keep | CI jobs real in `ci.yml`. | — |
| 🟢 | IPI-344 — MODEL-GATE-06 Booking API routes | Done | Done | keep | All 4 route files confirmed. | — |
| 🟢 | IPI-342 — MODEL-GATE-04 List/view bookings | Done | Done | keep | Migration on disk. | — |
| 🟢 | IPI-341 — MODEL-GATE-03 Booking status changes | Done | Done | keep | Migration on disk. | — |
| 🟢 | IPI-339 — MODEL-GATE-01 Booking edit safety (revisions) | Done | Done | keep | Migration on disk. | — |
| 🟢 | IPI-308 — MODEL-P2 Matching Talent Tab, Swipe/List, Shortlist | Done | Done | keep | Components + test confirmed. | — |
| 🟢 | IPI-274 — DESIGN-056 Shoot Wizard React Parity | Done | Done | keep | Merged, mature. | — |
| 🟢 | IPI-209 — DESIGN-054 Shoot Detail Workspace | Done | Done | keep | Merged. | — |
| 🟢 | IPI-189 — MI-03w Required image sizes while planning | Done | Done | keep | — | — |
| 🟢 | IPI-183 — SHOOT-DATA-001 AI-ready shoot DB tables | Done | Done | keep | Core schema mature. | — |
| 🟢 | IPI-148 — SHOOT-AI-001 Shoot-planning agent | Done | Done | keep | — | — |
| 🟢 | IPI-150 — SHOOT-AI-003 HITL checkpoints | Done | Done | keep | PR #98 merged. | — |
| 🟢 | IPI-149 — SHOOT-AI-002 Shoot-planning engine | Done | Done | keep | PR #96 merged. | — |
| 🟢 | IPI-85 — SHOOT-UX-002 Shoots list + AI side panel | Done | Done | keep | Completed 2026-07-03 after follow-ups. | — |
| 🟢 | IPI-383 — SHOOTS-INTEL-PREVIEW Card select + right-panel preview | Done | Done | keep, attach project | Commits + PRs #222/#223 confirmed. Has no Linear project attached — attach one. | — |
| 🟢 | IPI-346 — MODEL-GATE-08 App TS types for booking APIs | Done | Done (low-confidence proof) | keep | No standalone types file — types folded into service/route files, functionally covered but not a discrete artifact. | — |
| 🟢 | IPI-84 — SHOOT-UX-001 Design review of shoot UX | Done | Done | keep | Design-only task, no code expected. | — |
| 🟢 | IPI-427 — DATA-AUDIT-001 public.shoots vs shoot.shoots investigation | Done | Done | keep | Pure investigation ("no orphan-drop bug"), no code diff expected. | — |
| 🟢 | IPI-426 — SHOOT-COVER-001 Wire real cover_url into Shoots List | Done | Done | keep | Commits confirmed. | — |
| 🟢 | IPI-188 — MI-03 Preview screen per platform frame | Done | Done | keep | — | — |
| 🟢 | IPI-185 — MI-01 Platform image size/format rules in DB | Done | Done | keep | Migration confirmed (also defines enums Campaign reuses). | — |
| 🟢 | IPI-187 — MI-02 AI looks up platform image specs | Done | Done | keep | — | — |
| 🟢 | IPI-186 — MI-01a Safety-check platform-spec DB changes | Done | Done | keep | — | — |

### Close/cancel — Shoot/Booking

None beyond already-correct IPI-312 (Canceled, scope redistributed to IPI-344/IPI-411, matches prior audit exactly).

### Rewrite candidates — Shoot/Booking

**IPI-233** — don't split (a prior repo audit already found this bundling defensible for a whole-system QA sweep); instead execute or explicitly reschedule it — it's neither done nor visibly worked, 10+ days past SLA.

### Move-to-another-epic — Shoot/Booking

**IPI-383** — attach to a Linear project (currently unattached, same pattern flagged for IPI-486/487).

### Missing tasks (verified gaps)

- **IPI-409 (SCR-20 Talent Profile)** — real, unstarted, non-trivial: `/app/matching/talent/[id]` has zero page file, yet the already-shipped Booking Wizard (IPI-410) assumes reaching booking *from* a talent profile. This is a genuine sequencing gap in what's shipped, not a documentation error.
- **IPI-412 (Talent Onboarding), IPI-413 (Availability Editor), IPI-414 (Role Dashboards)** — same situation, real Backlog issues, 0% code, complete the same screen set as IPI-409.

### Rest batch (61 issues) — patterns

Model Booking MVP post-MVP backlog (`BOOK-101`–`BOOK-212`, 21 issues) cleanly phased, no red flags. `MODEL-P3/P4/P6/P7` (IPI-309/310/311/313) may now duplicate scope already shipped under IPI-397/410 — worth a dedupe pass (cancel with scope-redistribution note, following IPI-312's precedent, if confirmed fully covered). Shoot Detail "edit inline" cluster (7 issues) correctly Canceled, consolidated into IPI-371/274. Duplicate cluster (IPI-87, 86, 56, 303) correctly marked. IPI-282 (DNA scoring via Cloudflare Worker, Backlog) will need Workers-runtime compatibility review once picked up.

### Model Booking MVP score note (74/100)

Backend (MODEL-GATE-01–10) and 2 of 5 screens (Wizard, Detail) are real and merged — see Shoot/Booking table above (shared numbering). The gap is the missing prerequisite screen (IPI-409) plus 3 more at 0% (412/413/414).

---

## Stack 10 — Campaign (score 15/100 🔴)

### Priority issues (1)

| Dot | Task | Current status | Correct status | Action | Exact correction | Blocker |
|---|---|---|---|---|---|---|
| 🟢 | IPI-268 — BE-D1 Campaigns schema migration | Done | Done | keep | PR #252 merged. `campaigns`/`campaign_deliverables` tables, `campaign_status` enum, 8 RLS policies, cross-tenant FK guard all confirmed. Genuinely schema-only — don't treat as "work started" on API/Agent/UI. | none — unblocks IPI-249/297 |

### Missing tasks (verified gap)

**Campaign API/Agent/UI/AI milestones have zero Linear issues.** `roadmap.md` §2 lists these as the next 4 milestones after Schema; none exist as `IPI-###` yet. No API routes, no Campaign Mastra agent (only an unrelated string mention inside `brand-intelligence-agent.ts`), and `/app/campaigns/page.tsx` renders a placeholder pointing at legacy issue ID `IPI2-119` (a dead cross-team reference, not a live `IPI-` issue) — correct that stub's pointer once the real issues exist.

---

## Stack 11 — Assets and Cloudinary (score 78/100 🟡)

### Priority issues (12)

| Dot | Task | Current status | Correct status | Action | Exact correction | Blocker |
|---|---|---|---|---|---|---|
| 🟢 | IPI-257 — DESIGN-074 Cloudinary Media Pipeline (074a–f) | Done | Done (scope footnote) | keep | 074a–e all verified merged (signed upload, RLS cols, webhook, DNA trigger, named presets). **074f (bulk tag/replace) never shipped** — fold into IPI-438 rather than opening a new issue. | none |
| 🔴 | **IPI-351 — Cloudinary Verification (acceptance gate)** | **Done** | **Reopen** | **reopen** | Live Supabase query: `cloudinary_assets` = 4 rows, all dated 7 months *before* the 074a–f build (migration-seed artifacts, not real webhook traffic). `assets.cloudinary_public_id` populated on 0/24 rows. The issue's own unchecked boxes are factually correct — don't mark Done until IPI-432 (E2E smoke test) actually runs and produces a passing row. | IPI-432 |
| 🟡 | IPI-349 — Cloudinary Config Cleanup | Done | Done | keep | Verified clean config, zero `VITE_CLOUDINARY_*` hits. Cited PR #194 is closed/unmerged — the actual fix landed via PR #196 — correct the citation. | none |
| 🟢 | IPI-353 — next-cloudinary URL builder consolidation | Done | Done | keep | All named call sites confirmed on the shared helper. | none |
| 🟢 | IPI-352 — Cloudinary Node SDK | Done | Done | keep | Confirmed via `uploader.upload_stream`, no raw fetch remains. | none |
| 🟢 | IPI-350 — Cloudinary SDK Installation | Done | Done | keep | Both SDKs present. | none |
| 🟢 | IPI-247 — DESIGN-070 Route-Agent Map Parity | Done | Done | keep | Matches claimed table; PR #147 merged. | none |
| 🟢 | IPI-243 — INTEL-001 IntelligencePanel Phase A | Done | Done | keep | Panel shell/hook/tests exist; Phase B correctly still missing (out of this issue's scope). | none |
| 🟢 | IPI-292 — CC-HERO-001 Hero MediaCard image-first | Done | Done | keep | Consistent with shipped dependency chain. | none |
| 🟢 | IPI-291 — CC-IMG-001 Cloudinary sample-images module | Done | Done | keep | Module exists exactly as speced. | none |
| 🔴 | IPI-155 — DNA-005 Asset approval flow | Todo | Todo | rewrite AC | AC claims "extends existing `ApprovalCard`" — no single shared component exists, 5 separate domain-specific cards do. Correct AC to "new `AssetApprovalCard` following the established per-domain pattern." | IPI-154 |
| 🔴 | IPI-154 — DNA-004 Asset compliance workflow | Todo | Todo | keep | No Mastra workflow with a DNA tool step exists; DNA color tokens genuinely exist. | IPI-152 |

### Rewrite candidates

- **IPI-155** — correct the AC's false shared-component assumption.
- **IPI-351** — split into (a) close already-verifiable checklist items, (b) hard-gate the rest on IPI-432 actually running.

### Missing tasks (verified gap)

074f (bulk tag/replace) — fold into IPI-438 (CLD-113), which already lists "Bulk Tag" in its own AC, rather than duplicating.

### Rest batch (32 issues) — patterns

19-issue CLD-0xx/1xx epic (IPI-430–449) is one large, zero-code, planned epic, all unattached to a Linear project (matches an existing `roadmap.md` action item — execute it, don't re-flag as new). Within it: **promote now** IPI-431 (Upload Sign Route Test — security-critical route, zero tests today) and IPI-432 (E2E Smoke Test, directly unblocks reopening IPI-351); defer the remaining ~17 post-MVP. Two individual status corrections found: **IPI-277 should flip Backlog→Done** (migration + PR #167 fully shipped, live `get_advisors` shows zero remaining findings) and **IPI-276/IPI-265** should have their stale "blocked by 074" notes updated (074 is Done now).

---

## Stack 12 — Notifications (score 86/100 🟢)

### Priority issues (4)

| Dot | Task | Current status | Correct status | Action | Exact correction | Blocker |
|---|---|---|---|---|---|---|
| 🟢 | IPI-345 — MODEL-GATE-07 Notification inbox API routes | Done | Done | keep | Both route files + tests confirmed. | none |
| 🟢 | IPI-343 — MODEL-GATE-05 Notification read receipts (per user) | Done | Done | keep | Migration + RPCs confirmed merged (PR #207). | none |
| 🟢 | IPI-335 — MODEL-FIX Tighten Notifications RLS Update Policy | Done | Done | keep | Migration confirmed merged; `verify-rls.mjs` has an explicit probe block for it. | none |
| 🟢 | IPI-307 — MODEL-P1 Core Schema, RLS, Notifications, Confirm RPC | Done | Done | keep | Migration confirmed merged (PR #175). | none |

### Rest batch (4 issues) — patterns

IPI-407 (inbox UI) and IPI-401 (Realtime wiring) both correctly Backlog — no `NotificationCenter` component exists in code, no `supabase_realtime` publication statement for `notifications` (only `brand_crawls` is published). IPI-315 (full notification architecture) correctly Backlog as post-MVP. IPI-208 correctly Canceled, superseded by IPI-407.

---

## Stack 13 — Design V2 and React parity (score 70/100 🟡)

Scope discipline applied per the audit brief: Design V2 should be strictly visual design/React parity/responsive/accessibility/interaction work. Anything else found here is a **move** finding, not a design finding.

### Priority issues (16 shown; full 16-row detail)

| Dot | Task | Current status | Correct status | Action | Exact correction | Blocker |
|---|---|---|---|---|---|---|
| 🟢 | IPI-386 — RF-A7b EmptyState + ErrorState | Done | Done | keep | Verified shipped. | none |
| 🟢 | IPI-17 — DESIGN-050 Command Center React Parity | Done | Done | keep | PR #168 merged; path citation wrong dir name — cosmetic. | none |
| 🟢 | IPI-306 — CC-INT-001 Intelligence Panel Parity | Done | Done | keep | PR #171 merged; all 6 claimed sections exist. | none |
| 🟢 | IPI-305 — CC-OP-001 Command Center Operator Experience (Epic) | Done | Done | keep | Rollup of #168-171, all merged; "Remaining" table stale (IPI-244 now Done) — text refresh only. | none |
| 🟢 | IPI-290 — DESIGN-050b CC DC Visual Polish (Epic) | Done | Done | keep | PR #169 merged. | none |
| 🟢 | IPI-294 — CC-HITL-001 Approval preview/empty state polish | Done | Done | keep | Folded into #169/#171. | none |
| 🟢 | IPI-293 — CC-RECENT-001 Recent work moodboard photos | Done | Done | keep | Folded into #169. | none |
| 🟢 | IPI-295 — CC-SHIP-001 Verify + evidence + PR ship gate | Done | Done | keep | All merged. | none |
| 🟢 | IPI-270 — DESIGN-010 Sync tokens.css v3 Zeely → app | Done | Done | keep | Diffed against source, genuinely in sync; path citation wrong — cosmetic. | none |
| 🟡 | IPI-246 — DESIGN-046 EvidenceBlock component | Done | **Partial — reopen "5 screens" AC line** | rewrite (AC) | Component real (PR #148 merged). AC claimed 5 screens wired; only **2 of 5** actually import it (Assets/Campaigns are placeholders, Channel Preview has no import). Keep component Done; split a follow-up AC for the remaining 3. | Assets/Campaigns still placeholder |
| 🟢 | IPI-255 — DESIGN-071 Live Intelligence Data Integration | Done | Done | keep | PR #161 merged; correctly self-scopes and defers thumbnail grid/SWR. | none |
| 🟡 | IPI-264 — DESIGN Mobile Verification Pass/Fail Matrix | Done | Done (design-track only) | keep, add scope note | Verified the DC prototype, not shipped React routes — add a clarifying note to avoid misreading as live-route-verified. | none blocking |
| 🟢 | IPI-244 — INTEL-002 ApprovalQueue + HITL write actions | Done | Done | keep | Confirmed calling the real approve route; no PR # cited — add one for auditability. | none |
| 🔴 | IPI-286 — Intelligence Panel: Route-Aware Context Sections | Done | **Partial — overstated Done** | rewrite AC | Designated PR #164 is **closed, unmerged**. A lighter real mechanism exists (`route-briefing.ts`, headline + action chips), but the actual richer AC (DNA Criteria/Asset Recommendations/Budget Warnings/Campaign Performance sections) has zero code and no backing API. Keep Done for the headline mechanism only; split/reopen for the rest. | rich section data has no backing API |
| 🟢 | IPI-288 — Claude Design System Sync (Phase 0+1) | Done | Done | keep | Docs/tooling-only, verified. | none |
| 🟢 | IPI-269 — DESIGN-060 Channel Preview React Parity | Done | Done | keep | `/app/preview` renders real component; path citation wrong — cosmetic. | none |

### Rewrite candidates

- **IPI-246** — split a follow-up AC for the 3 remaining EvidenceBlock screens.
- **IPI-286** — rewrite AC to match the shipped `route-briefing.ts` mechanism, or reopen a new issue for the original richer sections.
- **IPI-304** (rest batch, de-fork ApprovalCard) — undercounted: 5 ApprovalCard-shaped components exist, not 4 (`intel-approval-card.tsx` missing from its own AC).

### Move-to-another-epic (the meaningful section for this stack)

| Issue | Filed under | Actual content | Correct destination |
|---|---|---|---|
| IPI-398 · BE-ACT1 Org activity log + RPC | DESIGN V2 | 100% backend, zero React component | Supabase/data stack |
| IPI-399 · BE-D2 Analytics views + RPCs | DESIGN V2 | Pure SQL, no frontend | Supabase/data stack |
| IPI-400 · BE-ST1 Storage buckets | DESIGN V2 | Storage config only | Supabase/data stack |
| IPI-402 · BE-B4 `set_availability_batch` RPC | DESIGN V2 | Pure RPC/migration | Supabase/data stack |
| IPI-262 · DESIGN-078 Visual Identity Agent — Channel Preview Wiring | DESIGN V2 | ~11 of 12 AC bullets are Mastra/Gemini/Cloudflare provider plumbing | AI Platform/Agents stack |
| IPI-263 · DESIGN-079 Social Discovery Agent — Creator Matching Wiring | DESIGN V2 | Same pattern, provider/Gateway boilerplate | AI Platform/Agents stack |

Not move candidates: IPI-296 and IPI-269/338 each have their own named screen deliverable and correctly stay.

### Rest batch — patterns

Largest single pattern across this stack: nearly every issue cites a literal `Universal design prompt/` path (with a space) that doesn't exist — the real, canonical directory is `Universal-design-prompt-new/`. A second pattern: several issues (IPI-17, 244, 269, 270, 285, 306) cite a nonexistent `tasks/design-docs/handoff/` directory. Both are cosmetic path-hygiene issues, not functional gaps. MOB-* mobile primitive family (IPI-415-424) is the strongest-quality cluster — cleanly sequenced, no flags. `tasks/todo.md` is one week stale relative to current `main` and contains at least two now-false claims (says IntelligencePanel/EvidenceBlock "not in app" — both exist and are merged) — treat as superseded wherever it conflicts with direct disk verification.

### Unverifiable this pass

IPI-256's "RPC fails silently" finding (may be resolved by subsequent Booking PRs, not re-checked); IPI-244's merging PR # (functionality verified, provenance not); the a11y "68/100" scorecard cited by IPI-253 (would require a direct CI/package.json check not performed this pass).
