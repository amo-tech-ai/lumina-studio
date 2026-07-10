# Proposed Linear Update Plan — Awaiting Approval

**Nothing in this file has been applied to Linear yet.** This is the concrete, issue-by-issue edit list derived from the audit in `01`–`06`. Grouped by action type, highest-impact first. Each row names the exact field to change and the new value — ready to execute via Linear MCP once approved.

## A. Reopen (Done → active status)

| Issue | Field | From | To | Note |
|---|---|---|---|---|
| IPI-336 | Status | Done | In Progress (or Backlog if not actively worked) | Description: replace "13-screen Zeely funnel shipped" claim with the real state (3-step wizard, IPI-11) and either re-scope as new work or close as superseded |
| IPI-351 | Status | Done | In Progress / Todo | Description: replace checked boxes with the real unchecked state; add "blocked by IPI-432" |
| IPI-286 | Status | Done | keep Done, but split | Split into: (1) "Route-aware headline/action-chips" — stays Done as-is; (2) new/reopened issue for the richer DNA/Asset/Budget/Campaign sections, which have no code or backing API |

## B. Close (already shipped, status stale)

| Issue | Field | From | To | Note |
|---|---|---|---|---|
| IPI-363 | Status | In Progress | Done | Scope fully covered by IPI-391 + IPI-388/389 |
| IPI-364 | Status | In Progress | Done | Scope fully covered by IPI-392 + IPI-388/390 |
| IPI-277 | Status | Backlog | Done | Migration + PR #167 shipped; `get_advisors` confirms zero remaining findings |

## C. Status correction (wrong bucket, not a close)

| Issue | Field | From | To | Note |
|---|---|---|---|---|
| IPI-403 | Status | In Progress | Todo / Backlog | 0% shipped; "In Progress" is misleading |
| IPI-486 | Status | Todo | In Progress | Has Done + active children |
| IPI-91 | Status | Backlog | In Progress | 4 of 7 children Done, feature confirmed live in prod |

## D. Description/title rewrite (status stays the same)

| Issue | Change |
|---|---|
| IPI-469 | Remove "✅ Complete," fix doc path to `tasks/cloudflare/plan/cf-000-platform-architecture.md`, note "awaiting merge of PR #271" |
| IPI-471 | Remove "✅ Complete — document delivered," note "awaiting merge of PR #271" |
| IPI-487 | Resync progress table against `tasks/cloudflare/todo.md` (currently ~30pt disagreement on CF-MIG-210) |
| IPI-465 | Add note: no implementation exists yet; add `ai_agent_logs` table as an explicit AC dependency (doesn't exist in any migration) |
| IPI-461 | Correct "14+ unit tests" → "1 file, 5 tests" (`services/cloudflare-worker/src/index.test.ts`) |
| IPI-113 | Correct "10 tools" → "20 tools" (`app/src/mastra/tools/index.ts`); link IPI-147 as the open governance item |
| IPI-97 | Retitle to remove "(tool → edge fn → draft)" — no Mastra tool is involved by design; correct to "(chat widget → proxy route → edge fn → draft)" |
| IPI-229 | Flip description's "Status: In Review" line to "Merged" (PR #139) |
| IPI-51 | Remove stale "Remaining gaps → IPI-247" table (that PR merged 2026-06-30) |
| IPI-475 | Remove "DC design files unavailable... confirmed absent" caveat — `Universal-design-prompt-new/` is now tracked in git |
| IPI-226 | Add PR number/link as proof (currently unverifiable — cites a branch name with no matching PR) |
| IPI-476 | Correct AC E: either implement a pure `createInstance` factory, or edit the AC to state instance creation happens at the edge-function layer, not in the pure engine |
| IPI-373 | Rewrite scope down to "Deal Detail visual-parity sign-off only" (or close as superseded — 4 of 6 screens shipped without it) |
| IPI-396 | Fix route citation: `/app/crm/pipeline/[id]`, not `/app/crm/deals/[id]` |
| IPI-395 | Remove false "`risk_score`/`stage_entered_at` live" claims; correct "real-time move" framing to "read-only, no drag/stage-change yet" |
| IPI-374 | Remove stale blocker note — companies list (soft blocker) already shipped |
| IPI-369 | Repoint blocker from dead/Duplicate IPI-365 to its real successor IPI-395 (now Done) |
| IPI-367 | Repoint blocker prose from dead IPI-366 to IPI-396 (already correct in the structured relation, just not in the text) |
| IPI-370 | Flag that its 3 cited plan docs (`docs/plan/tasks/2026-07-04-crm-*.md` etc.) don't exist in the repo — restore or strip references |
| IPI-155 | Correct AC: no shared `ApprovalCard` exists — change to "new `AssetApprovalCard` following the established per-domain pattern" |
| IPI-349 | Correct PR citation from #194 (closed) to #196 (the actual merge) |
| IPI-246 | Correct "wired on 5 screens" → "wired on 2 of 5 screens" (Assets/Campaigns/Channel Preview still missing) |
| IPI-264 | Add scope note: this verified the DC prototype, not live shipped routes |
| IPI-123 | Refresh stale progress table — all listed gaps are already shipped (PRs #80/#81/#83) |
| IPI-153 / IPI-181 | Resolve circular `blocked_by` — pick one direction |
| IPI-118 | Refresh vulnerability counts: 22 total (1 critical, 1 high, 9 moderate, 11 low), not the old 21/2/2 |
| IPI-224 | Narrow scope: `@playwright/test`/`test:e2e` now exist; only the `webServer` config in `playwright.config.ts` is still missing |

## E. Move to a different project/epic

| Issue | From | To |
|---|---|---|
| IPI-340 | Brand/onboarding (mis-tagged) | Model Booking MVP / Talent track |
| IPI-412 | Brand/onboarding (mis-tagged) | Model Booking MVP / Talent track |
| IPI-95 | CRM (mis-tagged by this audit's categorization only — verify if a real Linear move is even needed) | AI Platform — LLM Providers (website lead-capture) |
| IPI-398 | DESIGN V2 — Operator React Parity | Supabase/data-layer project |
| IPI-399 | DESIGN V2 — Operator React Parity | Supabase/data-layer project |
| IPI-400 | DESIGN V2 — Operator React Parity | Supabase/data-layer project |
| IPI-402 | DESIGN V2 — Operator React Parity | Supabase/data-layer project |
| IPI-262 | DESIGN V2 — Operator React Parity | AI Platform — Agents |
| IPI-263 | DESIGN V2 — Operator React Parity | AI Platform — Agents |
| IPI-383 | (unattached) | AI Platform — Agents or DESIGN V2 (its sibling Shoots-List work lives there) |
| IPI-486, IPI-487 | (unattached, per prior audit) | confirm/attach a project — carried over from earlier reconciliation pass, not new |

## F. New/adjusted dependency links

| Issue | Change |
|---|---|
| IPI-10 | Mark related-to/superseded-by IPI-465 (heavy scope overlap with the now-active Shared AI Tool Registry) |
| IPI-311 (and possibly 309/310/313) | Investigate for cancel-with-redistribution to IPI-397/IPI-410, following the IPI-312 precedent, if scope is confirmed fully covered |

## G. Fold into an existing issue (no new issue needed)

| Gap | Fold into |
|---|---|
| Cloudinary 074f (bulk tag/replace) | IPI-438 (CLD-113 Bulk Asset Actions) — already lists "Bulk Tag" in its own AC |

## H. Recommended new issues (only where a verified gap has no existing owner)

These are the *only* net-new issues this audit recommends — everything else above is a correction to something that already exists.

1. **Campaign API milestone** — `app/src/app/api/campaigns/*` routes, blocked by IPI-268 (Done).
2. **Campaign Agent milestone** — a real Campaign Mastra agent (currently only a stray string mention inside `brand-intelligence-agent.ts`).
3. **Campaign UI milestone** — replace the `/app/campaigns` `SectionPlaceholder` stub (currently points at a dead legacy issue ID `IPI2-119`).
4. **Assets-route agent tooling** — `creative-director` (shared by `/app/assets` and `/app/campaigns`) has zero tools; Campaigns' gap is implicitly covered by CAMP-001/IPI-156, Assets' isn't.
5. **Upload-sign route test coverage** — promote existing unattached IPI-431 rather than opening new; flagging here only so it isn't lost in the CLD-1xx pile.
6. **Observability/monitoring tooling** — zero Sentry/Datadog/OpenTelemetry anywhere in the repo; no existing issue owns this specifically (distinct from the rollback-script and OpenNext-CI gaps, which already have owners: CF-MIG-810 and CF-MIG-111).

## I. Housekeeping (low-effort, no scope change)

- **IPI-117** — recommend closing as moot; the Vite app it targets no longer exists in the repo.
- **19 CLD-1xx issues (IPI-430–449)** — attach to a Linear project (currently unattached); promote IPI-431/432 specifically, defer the rest.

---

**Next step:** once you approve some or all of the above, I'll execute the corresponding Linear MCP calls (`save_issue` for status/description/project changes) issue by issue and report back what actually changed. Nothing above has been touched yet.
