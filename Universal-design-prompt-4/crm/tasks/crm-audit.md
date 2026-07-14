# CRM Lane — Forensic Ticket-Readiness Audit

**Date:** 2026-07-12 · **Auditor:** Claude (task-verifier protocol) · **Method:** every claim below was probed against live Linear + live disk (`app/src`, `supabase/migrations`, `Universal-design-prompt-4/Pages`) — memory and `status:` fields are not evidence, per protocol.

**Scope:** the 8 tickets in Lane A's execution order (IPI-528, 367, 562, 563, 369, 374, 527, 370). **None are Done or merged — all are pre-execution.** This is therefore a **readiness/DoR (Definition-of-Ready) audit**, not a DoD audit: the question answered per ticket is *"will this succeed if picked up as-written, and does the ticket accurately describe current reality?"* — not "was it built correctly," since nothing has been built yet.

**Dots:** 🟢 verified accurate/ready · 🟡 fix before starting, not a blocker · 🔴 blocker or materially wrong · ⚪ N/A / correctly blocked

---

## Headline finding

**IPI-374 is materially stale.** Its core ask — CRM branches in `use-route-welcome.ts`/`use-route-suggestions.ts` and CRM pathname wiring in `operator-panel.tsx` — **is already built and shipped**, verified on disk. Picking this ticket up as-written risks wasted work or an engineer silently skipping real remaining scope (dynamic per-record personalization) because the ticket implies nothing exists yet. This is the single highest-priority correction in this audit. Full detail in IPI-374's section below.

Everything else checks out close to as-written; the DB-level Won/Lost guard trigger IPI-367 depends on is not just present but implemented **twice** (defense-in-depth, both migrations independently enforce it), which is a strong positive signal for that ticket's success odds.

---

## Grading summary

| # | Ticket | Spec /100 | Exec-readiness /100 | Skills /100 | Composite | Blockers | Safe to start? |
|--:|---|--:|--:|--:|--:|--:|:--:|
| 1 | [IPI-528](https://linear.app/amo100/issue/IPI-528) Matching→Booking fix | 65 | 85 | 40 | 68 | 0🔴 / 1🟡 | 🟡 Yes, with correction |
| 2 | [IPI-367](https://linear.app/amo100/issue/IPI-367) Won/Lost HITL gate | 92 | 95 | 85 | 92 | 0🔴 | 🟢 Yes |
| 3 | [IPI-562](https://linear.app/amo100/issue/IPI-562) Companies/Contacts enable | 85 | 90 | 55 | 80 | 0🔴 / 1🟡 | 🟢 Yes |
| 4 | [IPI-563](https://linear.app/amo100/issue/IPI-563) Pipeline UX polish | 78 | 88 | 55 | 76 | 0🔴 / 1🟡 | 🟡 Yes, add one AC first |
| 5 | [IPI-369](https://linear.app/amo100/issue/IPI-369) CRM AI wave 2 | 88 | 85 | 90 | 87 | 0🔴 | 🟢 Yes |
| 6 | [IPI-374](https://linear.app/amo100/issue/IPI-374) Route welcome + chips | 35 | ⚪ | 70 | 48 | **1🔴** | 🔴 **No — rewrite first** |
| 7 | [IPI-527](https://linear.app/amo100/issue/IPI-527) Notification Center UI | 82 | 95 | 45 | 76 | 0🔴 / 1🟡 | 🟢 Yes |
| 8 | [IPI-370](https://linear.app/amo100/issue/IPI-370) CRM QA verification | 85 | ⚪ (correctly blocked) | 50 | 73 | 0🔴 | ⚪ Blocked by #2, #5 (correct) |

**Composite = 0.35×Spec + 0.40×Exec-readiness + 0.25×Skills**, per `task-verifier/references/task-spec-rubric.md`. Lane average (excluding the two ⚪-blocked/rewrite items): **80/100.**

---

## Per-ticket detail

### 1 · IPI-528 — Re-enable Talent Matching actions

**Status:** In Progress (flipped from Backlog at 07:55:26 today — confirm who/what started it before duplicating work; no corresponding commits found on disk as of this audit).

| Claim | Probe | Result |
|---|---|---|
| `talent-tab.tsx:186` disabled "Request booking" citing IPI-309 | `sed -n` on file | 🟢 exact match, verbatim |
| `talent-tab.tsx:189` disabled "View full profile" | same | 🟢 exact match |
| Booking Wizard live at `/app/matching/talent/[id]/book` | prior session probe (progress-tracker.md, 88%) | 🟢 confirmed real |
| Creator/Asset/Product tabs mis-cite IPI2-123 (AC-C) | `talent-match-tabs.tsx:1-8` | 🔴 **ticket premise contradicted by code** |

**Red flag:** `talent-match-tabs.tsx` carries its own authored comment: *"Talent is the only live tab; Creator/Asset/Product are disabled shells (**IPI2-123's own scope**)."* The ticket's AC-C assumes this citation is a copy-paste mistake. The code asserts it's deliberate. **Correction:** verify with whoever scoped IPI2-123 before "fixing" AC-C — it may not be a bug at all, and closing it as designed rather than shipping a code change would be the right outcome.

**Missing:** no `## Verify` section, no skills declared (labels: `prefix:INT` only). Trivial fix, but per Phase 5b/anti-fake-done gate this is a real gap, not just a nitpick — add `cd app && npm run typecheck && npm test` and cite `nextjs-developer` before marking Done.

**Correction for this ticket:** drop or downgrade AC-C to "confirm with IPI2-123 owner," add a Verify section.

---

### 2 · IPI-367 — Won/Lost HITL gate + brand conversion

**Status:** Todo, Urgent (verified state after this session's status-revert fix).

| Claim | Probe | Result |
|---|---|---|
| `deal-stage-control.tsx` exists (from IPI-396) | `ls -la` | 🟢 8901 bytes, real |
| `lib/crm/move-deal-stage.ts` + Mastra tool share one function | `find` | 🟢 both exist: `lib/crm/move-deal-stage.ts` and `mastra/tools/crm/move-deal-stage.ts` |
| `api/crm/deals/[id]/convert/route.ts` doesn't exist yet | `find` | 🟢 correctly absent — this ticket creates it |
| `api/crm/deals/[id]/stage/route.ts` (non-terminal PATCH) exists | `find` | 🟢 confirmed, + its own test file |
| DB trigger enforces `app.crm_convert` session flag | `grep` on migrations | 🟢 **confirmed live, in two independent migrations** — `crm_deals_guard_terminal_stage()` in `20260704085653_crm_core_schema.sql` AND a hardening pass in `20260704103223_crm_schema_hardening.sql`, both raising an exception unless `app.crm_convert='1'` |

**Bonus finding (not in the ticket, worth citing):** `20260705004146_crm_fk_cascade_indexes.sql` already defines `crm_deals_verify_convert_stage()`, a helper RPC explicitly marked *"verify-rls only... Not for app use — IPI-367 convert route owns production path."* This is test scaffolding already built for this exact ticket's RLS verification. **Correction:** add a line to IPI-367's Verify section citing this helper so the implementer doesn't hand-roll an equivalent.

**Verdict:** every prerequisite this ticket depends on is real and correctly described. Highest-confidence ticket in the lane.

---

### 3 · IPI-562 — Enable New/Filter on Companies + Contacts

**Status:** Backlog (I authored this ticket last turn).

| Claim | Probe | Result |
|---|---|---|
| `listCompanies`/`listContacts`/`getCompany`/`getContact` exist | `grep` on `lib/crm/queries.ts` | 🟢 all 4 confirmed, plus `getProfileNames`/`getCompanyNames`/`getDeal`/`listDeals`/`listActivities` |
| Companies page is real RSC, no gate stub | `Read` `crm/companies/page.tsx` | 🟢 real — real auth check, real `listCompanies` call, honest error/empty states (not fake data) |
| `FILTER_LABELS` constant exists in `companies-workspace.tsx` | `grep` | 🟢 `["Type", "Status", "Owner"]` present |
| Filters/New are actually disabled (not just unconfirmed) | `grep` for "New Company" / onClick wiring | 🟡 **inconclusive from grep alone** — no "New Company" string found anywhere (consistent with "not built" but not exhaustively proven); recommend the implementer's first step is a full read of `companies-workspace.tsx`, not just trust this ticket's premise |

**Skills gap (self-audit):** the ticket body doesn't cite `design-to-production` or `ipix-supabase` explicitly — both are clearly required (UI parity + RLS-scoped writes). **Correction:** add a Skills line before starting.

---

### 4 · IPI-563 — Pipeline UX polish

**Status:** Backlog (I authored this ticket last turn).

| Claim | Probe | Result |
|---|---|---|
| Pipeline board is read-only, no PATCH/drag code | `Read` `pipeline-workspace.tsx` | 🟢 confirmed — file's own comment: *"Won/Lost columns show a locked visual state only... no ApprovalCard wiring, no conversion logic"* |
| `risk_score`/`stage_entered_at` don't exist as columns | same file's comment | 🟢 confirmed by the code itself: *"crm_deals has no risk_score column (verified against the generated schema types)"* |
| `moveDealStage` shared write path exists for future move control | `find` | 🟢 confirmed, same shared function IPI-367 uses |
| "At risk" filter already works client-side | `Read` | 🟢 `AT_RISK_DAYS = 14` heuristic + `atRiskOnly` toggle already implemented — **not new scope**, don't re-build it |

**🔴→🟡 finding not anticipated when this ticket was written:** `pipeline-workspace.tsx`'s own header comment states: *"The raw DC source is unavailable in this checkout (`Universal-design-prompt-new/` was removed before this ticket started); built from the Linear issue's own transcribed grid spec instead."* Probed: **`Universal-design-prompt-4/Pages/SCR-30-CRM-Pipeline.dc.html` exists right now** (17,318 bytes, dated Jul 11). The Pipeline board was built from a hand-transcribed spec, never against the real HTML — its visual parity with the actual design has never been verified. Per `design-to-production`'s non-negotiable rule ("HTML wins for layout") and this session's explicit instruction that designs must match `Pages/`, this is real, previously-undocumented debt.

**Correction for this ticket:** add an acceptance criterion — *"Re-verify Pipeline board layout/spacing/cards against the real `SCR-30-CRM-Pipeline.dc.html` (now available) before or alongside the new polish work; log any parity gaps found, don't just add features on top of unverified layout."*

---

### 5 · IPI-369 — crm-assistant wave 2 (health scoring, summarization, drafting)

**Status:** Todo.

| Claim | Probe | Result |
|---|---|---|
| Wave-1 tools exist (search/log/move) | `ls mastra/tools/crm/` | 🟢 `search-companies.ts`, `search-contacts.ts`, `log-activity.ts`, `move-deal-stage.ts` all present |
| Wave-2 tools don't exist yet (`scoreDealHealth`, `summarizeRelationship`, `draftFollowUp`) | same listing | 🟢 confirmed absent — genuinely this ticket's scope |
| `resolveModel()`/`app/src/lib/ai/provider.ts` infra exists | `find` | 🟢 both present |
| `panel-contract.ts` exists (existing section order to slot into) | `find` | 🟢 present |
| `crm-assistant-agent.ts` tool-registration pattern | `grep` for tool imports | 🟡 grep returned no matches — worth a direct read of the agent file before starting, not a blocker |

**Verdict:** accurate, well-scoped, correctly sequenced after IPI-367 (whose `moveDealStage` this ticket's `focus:at_risk` filter will read against). Skills section (mastra/gemini/copilotkit/linear) already properly declared in the original ticket.

---

### 6 · IPI-374 — Route welcome + suggestion chips for `/app/crm/*`

**Status:** Todo. **🔴 Not safe to start as-written.**

| Claim (from the ticket) | Probe | Result |
|---|---|---|
| CRM branches need to be **added** to `use-route-welcome.ts` | `Read` lines 187–206 | 🔴 **already exist** — full copy for `/app/crm/companies`, `/app/crm/companies/[id]`, `/app/crm/contacts`, `/app/crm/contacts/[id]`, `/app/crm/pipeline`, `/app/crm/pipeline/[id]` |
| CRM branches need to be **added** to `use-route-suggestions.ts` | `Read` lines 185–228 | 🔴 **already exist** — full 2-3-chip suggestion sets for the same 6 routes, matching the ticket's own examples almost verbatim (e.g. "Log a note" / "Find contacts" / "View pipeline") |
| `operator-panel.tsx` needs to pass CRM context when pathname starts with `/app/crm` | `grep` | 🔴 **already wired** — `"crm"` is in `SECTIONS`, and there's already dedicated CRM path-building logic (`` `/app/crm/${page}/${recordId}` ``) |
| Route table lists `/app/crm/deals/[id]` | cross-check against IPI-367/396 | 🟡 **wrong route name** — the real route is `/app/crm/pipeline/[id]`, already correctly used by the shipped welcome/suggestions code |

**What's genuinely still missing** (the real remaining scope, buried under the false "not started" framing): the shipped copy is **static per-route text** ("Companies — search prospects and review relationship status"), not the **dynamic per-record personalization** the ticket's own table specifies (`companyName`, `dealStage`, `lastActivityDays`, `pipelineValue`, `atRiskCount` interpolated into the message — e.g. "Acme quiet 9 days"). That dynamic layer does not exist.

**Correction (required before this ticket is picked up):** rewrite the ticket. Scope A1/A2/B1/C1 as **verify-and-extend**, not build-from-zero. New scope: (1) confirm the existing 6 branches against the real routes (fix the `/deals/` → `/pipeline/` naming), (2) add the dynamic-field interpolation the static copy is missing, (3) confirm test coverage — `use-route-welcome.test.ts`/`use-route-suggestions.test.ts` each only have 2 CRM-related test references, likely not covering all 6 routes. Re-estimate effort down significantly; most of the ticket's stated work is done.

---

### 7 · IPI-527 — Wire Notification Center UI to existing backend

**Status:** Backlog.

| Claim | Probe | Result |
|---|---|---|
| `app/api/notifications/route.ts` (GET) + test exists | `find` | 🟢 confirmed, with `route.test.ts` |
| `app/api/notifications/read/route.ts` (POST) + test exists | `find` | 🟢 confirmed, with `route.test.ts` |
| Zero UI consumers anywhere | `grep -rl "api/notifications" --include="*.tsx"` across `app/src` | 🟢 **zero hits** — fully confirmed, no bell/dropdown/panel component found by name either |
| `SCR-15-Notification-Center.dc.html` exists as design source | `ls` | 🟢 confirmed, 20,824 bytes |

**Open, honestly-flagged scope decision (not a defect):** AC-C explicitly defers "full center view vs. compact dropdown" to the implementer. That's correct practice per this ticket, not a gap — just flagging it's a real decision, not a rubber stamp.

**Skills gap:** no skills cited in the ticket body (labels only: DESIGNV2/UX/prefix:INT/Feature). **Correction:** cite `design-to-production` (must match `SCR-15-Notification-Center.dc.html`) and `frontend-design` before starting.

---

### 8 · IPI-370 — CRM QA MVP acceptance verification

**Status:** Todo, correctly blocked by IPI-367 + IPI-369 (both still open) — ⚪, not a red flag, the dependency gate is working as intended.

| Claim | Probe | Result |
|---|---|---|
| `tasks/crm/audit/` evidence directory | `ls` | 🟡 **doesn't exist yet** — needs creating when this ticket executes, not a blocker now |
| Trim (2026-07-12) correctly removed duplicated won/lost tests | re-read of IPI-370 vs IPI-367 descriptions this session | 🟢 confirmed no overlap remains — Tasks 1/3 (no-silent-won-lost, no-orphaned-won-deals) now live only in IPI-367; IPI-370 owns cross-org RLS + agent-can't-send + sign-off |
| Dangling doc citation removed | re-read | 🟢 confirmed stripped |

**Skills gap:** no skills declared. **Correction:** cite `ipix-supabase` (RLS pen test) and `task-verifier` itself (this is literally a task-verifier-shaped ticket) before starting.

---

## Cross-cutting red flags (not specific to one ticket)

| Flag | Severity | Evidence |
|---|:--:|---|
| `probe-disk-ipix.sh`'s security check is a false positive | 🟡 | Flagged 🔴 "AI keys or SERVICE_ROLE in app/src" — every hit is either a `*.test.ts` env-var stub or a legitimate server-only file (`app/api/_lib/supabase-admin.ts`, `mastra/workflows/*`, `mastra/tools/*`). None are in client-bundled components. The script greps all of `app/src` rather than scoping to actual client bundles or excluding tests — recommend fixing the probe script itself, not the "violation." |
| IPI-527 and IPI-528 have no Linear Project/Milestone | 🟡 | Both created outside the "CRM — Relationship Layer" project, unlike the other 6 — harder to track alongside the rest of Lane A. Consider adding them to the project for visibility, not a functional blocker. |
| IPI-528 flipped to "In Progress" with no matching commits | 🟡 | `startedAt` timestamp is 07:55:26 today; no corresponding `git log`/diff evidence found. Confirm before assuming work has actually begun — same class of trap this audit exists to catch (status ≠ reality, in either direction). |
| 6 of 8 tickets don't declare skills in the ticket body | 🟡 | IPI-528, 562, 563, 527, 370 (partial), and IPI-374 (has some) — Phase 5b requires this before Done, cheaper to add now than reconstruct later. |

---

## Best-practices / production-readiness verdict

- **Will the lane succeed as currently ticketed?** 6 of 8 tickets: yes, with the noted corrections. IPI-374 needs a rewrite before anyone picks it up — as written it would waste effort or produce a confusing PR against code that already exists. IPI-370 is correctly gated and not actionable yet.
- **Is anything production-ready today?** No — all 8 are pre-implementation. The audit's job here was reachability/accuracy of the *plan*, not a build verification.
- **Single highest-leverage fix before anyone starts:** rewrite IPI-374's scope (15 minutes of Linear editing) — it's the only 🔴 in the set and the only one that risks real wasted engineering time if missed.
- **Second highest-leverage fix:** add the DC-parity re-verification AC to IPI-563 before its polish work starts, since the current Pipeline board's visual accuracy against the real design has never actually been checked.

## Stop condition

**Not a uniform "safe to execute."** Per-ticket:

- 🟢 Safe as-written: IPI-367, IPI-369, IPI-562, IPI-527
- 🟡 Safe with a small correction first: IPI-528 (AC-C), IPI-563 (add DC-reverify AC)
- 🔴 **Not ready — fix the ticket before starting:** IPI-374
- ⚪ Correctly blocked, not actionable yet: IPI-370
