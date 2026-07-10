# Cloudflare Infra Doc Reconciliation — Forensic Audit

**Date:** 2026-07-09 · **Scope:** `tasks/cloudflare/**` (26 files) · **Method:** every claim checked against `origin/main` (git), live GitHub PR state (unauthenticated REST API — `gh` CLI auth is broken in this sandbox, see Note below), and live Linear (MCP).

**Note on ground truth:** the local `main` ref in this working tree is **23 commits behind `origin/main`**. An earlier pass of this audit checked file existence against local `main` and wrongly concluded CF-MIG-110 was unmerged and the Workers AI URL bug (PR #279) was still present. Both are **wrong** — re-verified directly against `origin/main` below, both are merged and fixed. Anyone re-running this audit must `git fetch origin main` first or check `origin/main`, not local `main`.

## Executive summary

The Cloudflare docs are in better shape than a first pass suggests, but there are two real, fixable problems worth acting on. First, `deep-architecture-review.md` (60KB, Draft) claims to supersede `cf-000-platform-architecture.md` (12KB, Approved) but was never actually wired into `CLOUDFLARE-EPIC.md`'s task list — it's a large unreferenced fork, not a duplicate to delete outright, since it holds genuinely unique content (Linear issue audit, 24-agent catalog, screen-impact matrix, cost table) that the compact doc never had. Second, `09-gemini-groq-audit.md` is factually stale: it treats the Groq track (GROQ-005/006/007) as a live "prod blocker" a day after Linear shows IPI-355/360/361 were **Canceled** (2026-07-07) — this is a real, verifiable contradiction, not a matter of opinion. Everything else — `todo.md`'s 10-task tracker, `CLOUDFLARE-EPIC.md`'s progress numbers, and 5 of 8 `migration/*.md` notes files — check out as accurate or are self-evidently superseded scratch material with no unique content left. The 12-file `migration/` folder and 8-file `audits/` folder are both candidates for a light prune (roughly half of each), not a rewrite.

## Per-document verdict table

Status-dot legend (matches `CLOUDFLARE-EPIC.md`/`todo.md`): 🟢 accurate/keep · 🟡 needs a fix · 🔴 wrong/superseded · ⚪ no action needed either way

| Document | Verdict | Evidence |
|---|---|---|
| `CLOUDFLARE-EPIC.md` | 🟡 **UPDATE** | Internally contradicts itself on IPI-469 status (🟢 in §5 P0 table vs 🟡 in §5 P1c table, same doc) and on IPI-471. Otherwise its 86%/55%/93% headline numbers and Service Decision Table are accurate against `origin/main` + Linear as checked below. |
| `todo.md` | 🟡 **UPDATE** | States "~58%" overall while declaring `CLOUDFLARE-EPIC.md` its own SSOT, which says "~55%" — a 3-point self-contradiction against its stated source of truth. Every per-task evidence line (PR #282 merged, PR #286 open/CI green, model-registry.ts missing on main, hono/vercel present) is **independently confirmed accurate** against `origin/main` and the GitHub API (below). |
| `plan/cf-000-platform-architecture.md` | 🟢 **KEEP AS-IS** | Approved 2026-07-07, narrow decision doc (15-row Service Decision Table), still what `CLOUDFLARE-EPIC.md`'s ADRs trace back to. Its only "gap" (no Rate Limiting/Secrets/Deployments/Preview/Rollback/DR/HA/Cost rows) is explicitly out-of-scope by its own §7 — those live in `CLOUDFLARE-EPIC.md` §3.4/§12/§13 by design, not a defect. |
| `plan/deep-architecture-review.md` | 🟡 **MERGE (partial) / do not delete outright** | Status: Draft, claims (line 6) to "supersede scattered architecture decisions" but is never linked from `CLOUDFLARE-EPIC.md` or `todo.md` anywhere — the supersession never took effect. Contains real unique content (Linear issue audit of 70 issues, 23-screen impact matrix, cost-analysis table, 24-agent superset) not found in any other doc. Recommend: extract Linear-audit findings into Linear itself, fold agent-catalog additions into `ai-agent-architecture.md` only if actually greenlit, then archive the rest. |
| `plan/ai-agent-architecture.md` | 🟢 **KEEP AS-IS** | Approved 2026-07-07, IPI-471's actual gating doc, narrower/more implementation-ready than `deep-architecture-review.md`'s 24-agent draft superset of the same 7 agents. |
| `plan/ai-provider-decision.md` | 🔴 **MERGE INTO `cf-000-platform-architecture.md`** (as appendix) or delete | 32-line precursor; its one decision (Workers AI default, Groq removed) is fully absorbed into cf-000's Service Decision Table + Provider Strategy. |
| `plan/cf-ai-migration-research.md` | 🔴 **MERGE INTO `cf-000-platform-architecture.md`** | 31-line precursor; model catalog table is reproduced with more detail in `deep-architecture-review.md` Phase 9. No unique content survives independently. |
| `plan/intelligence-platform-plan.md` | 🔴 **MERGE INTO `cf-000-platform-architecture.md`** | 41-line precursor; task-count tally and 3 named risks are the only content, already absorbed into `CLOUDFLARE-EPIC.md`'s task tables and blocker list. |
| `migration/cloudflare-vercel.md` | 🔴 **ARCHIVE** | Self-labeled "supplementary" at line 1; fully absorbed into `plan-migrate.md` §3.1 which cites it. |
| `migration/Migrate-Vercel-to-Cloudflare-Workers.md` | 🔴 **ARCHIVE** | This is the *prompt template* used to generate `plan-migrate.md`, not a plan itself (its own line 3: "do not treat it as the execution tracker"). |
| `migration/notes-1.md` | 🟡 **ARCHIVE (keep for provenance)** | Dated 2026-07-08, self-labeled "reference only — too granular for Linear," already packaged as a collapsed `<details>` appendix inside `plan-migrate.md` §9. Holds the rejected 33-issue decomposition rationale — useful "why not" history, not day-to-day reference. |
| `migration/notes-2.md` | 🔴 **ARCHIVE/DELETE** | Dated status snapshot for IPI-454/457/462/463; explicitly points to `audits/ipi-454-457-462-463-verification.md` as "Full audit" — that file is canonical, this is a stale condensed duplicate. |
| `migration/notes-3.md` | 🔴 **DELETE** | Raw session transcript ("Say **commit and open PR** when you want...") — not authored documentation. PR #282's actual content lives in git/GitHub history already. |
| `migration/notes-4.md` | 🔴 **ARCHIVE/DELETE** | Point-in-time status ping ("0 commits, uncommitted") for CF-MIG-210, confirmed stale — that branch now has 3 commits and an open PR (#286). |
| `migration/plan-migrate.md` | 🟢 **KEEP AS REFERENCE (primary)** | Active SSOT-for-migration-mechanics: decision log, risk register, phased plan, cited by 5+ other files. **Flags one real cross-doc conflict** (see finding #5 below): its own decision log calls `cf-000-platform-architecture.md`'s "Vercel hosts Next.js" position "⚠️ Superseded — user direction is full CF migration." |
| `migration/startup.md` | 🟢 **KEEP AS REFERENCE** | Unique operational content: 10+ specific resolved Workers/OpenNext bugs (errors→fixes table), not duplicated elsewhere. Some checklist items are now stale (work has since progressed on `ipi/cf-mig-210-runtime-compat`) — needs a checklist refresh, not archiving. |
| `migration/docs/nextjs-cloudflare.md` | 🟢 **KEEP AS REFERENCE** | Official Cloudflare doc mirror, actually followed; embedded `dateModified: 2026-06-05` means it can silently drift from the live page over time — no action needed now, just a known staleness ceiling. |
| `migration/docs/migrate-vercel.md` | 🔴 **ARCHIVE** | Explicitly self-flagged (own banner + `plan-migrate.md`'s table) as "wrong guide for Next.js" (it's the static-site/SPA migration doc). Kept only so nobody re-follows it by mistake. |
| `migration/docs/existing.md` | 🟢 **KEEP AS REFERENCE** | Official "deploy existing project" (autoconfig) doc — the one doc mirror with a direct "we ran this exact procedure" trace in `startup.md`. |
| `migration/docs/open-next.md` | 🟢 **KEEP AS REFERENCE** | Compact, evergreen OpenNext adapter feature/limits reference. |
| `audits/09-gemini-groq-audit.md` | 🔴 **SUPERSEDED — DELETE** | Dated 2026-07-08, treats GROQ-005/006/007 as live "prod blockers." **Verified against live Linear: IPI-355, IPI-360, IPI-361 all show `canceledAt: 2026-07-07T20:15:4x`, status "Canceled."** The entire Groq epic was canceled the day *before* this audit's snapshot date. This audit is simply wrong/stale, not a matter of interpretation. |
| `audits/audit-2-linear.md` | 🟢 **KEEP AS-IS** | Dated 2026-07-07, claims Groq epic (IPI-354→361) canceled — **confirmed correct against live Linear** (see above). This resolves the apparent contradiction with `09-gemini-groq-audit.md` in favor of `audit-2-linear.md`. |
| `audits/audit-3-cloudflare-skill.md` | 🟢 **KEEP AS-IS** | Dated 2026-07-07, narrow MCP/skill-infra scope, still actively cited as valid by `jul-8-linear-audit.md`; no successor doc covers this ground. |
| `audits/audit-design.md` | 🟢 **KEEP AS-IS** | Dated today (2026-07-09), most granular Design-V2 × Cloudflare cross-reference, declared SSOT output by `july-9-audit-plan.md`. Its 5 named blockers (hono/vercel, readFileSync groq-models, no OpenNext CI gate, no preview smoke, AI Gateway unwired) all independently reconfirmed below. |
| `audits/audit-jul-9.md` | 🟢 **KEEP AS-IS** | Dated today, legitimate different altitude (leadership snapshot) over `audit-design.md`'s detail — not redundant. PR #286 status line ("OPEN · CI green · not on main") independently reconfirmed via GitHub API below. |
| `audits/ipi-454-457-462-463-verification.md` | 🟢 **KEEP AS-IS** | Only doc with per-issue composite scoring and the concrete Workers-AI-URL account-ID bug finding (now fixed by merged PR #279 — the finding served its purpose and the code is now correct on `origin/main`). |
| `audits/jul-8-linear-audit.md` | 🟡 **UPDATE (partial)** | Its `todo.md`-staleness findings (L6/L4/L23/L27) are dated/already patched, safe to drop. Its PR-split plan (PR1–4) and env build-vs-runtime matrix are not restated anywhere newer and are still load-bearing — do not delete, trim the resolved parts. |
| `audits/july-9-audit-plan.md` | 🟢 **KEEP AS-IS** | Live checklist, not a report — has an unchecked item ("re-run after CF-MIG-210 PR #286 merges") that is still pending as of this audit (PR #286 is open, not merged). |
| `cursor-mcp-cloudflare.json` | 🟢 **KEEP AS-IS** | Configures Cursor's MCP client against Cloudflare's official remote MCP servers with a documented stdio-bridge workaround (`scripts/cf-mcp-bridge.sh`, confirmed present on disk) for broken OAuth. Endpoints match Cloudflare's current documented server list. Consistent with `audit-3-cloudflare-skill.md`'s "MCP config 40%" finding (manual OAuth still required). |

## The 5 numbered answers

### 1. Is `todo.md`'s ~58% and its 10-task percentages still accurate?

**Yes — every specific evidence claim independently verified against `origin/main` and the GitHub API:**

| Task | todo.md claim | Verified |
|---|---|---|
| CF-MIG-110 (100%) | "PR #282 merged; wrangler.jsonc, open-next.config.ts on main" | **Confirmed.** `gh`-equivalent (GitHub REST API): PR #282 `merged: true`, `merged_at: 2026-07-09T02:40:56Z`. `git show origin/main:app/wrangler.jsonc` and `app/open-next.config.ts` both resolve — present. |
| CF-MIG-210 (85%) | "PR #286 open · CI green · not on main" | **Confirmed.** PR #286 `state: open`, `mergeable_state: clean`. Check-runs on head SHA: `app-build`, `booking-gate`, `booking-gate-check`, `supabase-web015` all `completed/success`. `origin/main`'s `copilotkit/[[...slug]]/route.ts:13` still imports `hono/vercel` (the pre-fix state) — confirms not yet merged. |
| CF-MIG-111 (0%) | "No OpenNext job in ci.yml" | **Confirmed.** `git show origin/main:.github/workflows/ci.yml` — zero matches for opennext/wrangler/cloudflare. |
| CF-MIG-220 (0%) | "Blocked on CF-MIG-210 merge" | Consistent — CF-MIG-210 confirmed unmerged. |
| CF-MIG-810 (0%) | "Vercel still prod" | Not independently re-verified (DNS/hosting state is external to this repo) but consistent with no Cloudflare deploy step in CI. |
| IPI-457 (60%) | "model-registry.ts missing on main; work on branch, PR #271" | **Confirmed.** `git ls-tree origin/main -- app/src/lib/ai/` shows only `gemini-registry.ts`, `provider.ts`, `provider.test.ts`, `types.ts` — no `model-registry.ts`. (It exists only under the separate `services/cloudflare-worker/src/model-registry.ts`.) Live Linear: IPI-457 status is **"In Progress"** (not "Complete" as one older audit claimed) as of 2026-07-09T03:27. |
| IPI-454 (45%) | "AC-C done via PR #279; AC-F/I open" | **Confirmed, and the AC-C fix is verifiably good.** PR #279 `merged: true` (2026-07-09T01:23:21Z). `origin/main`'s `workers-ai.ts` now uses `config.accountId` for the URL path (not `apiKey`) — the account-ID bug flagged in `ipi-454-457-462-463-verification.md` is fixed. Live Linear: IPI-454 "In Progress." |
| IPI-485/462/463 (0% each) | "Linear Backlog" | **Confirmed** — live Linear shows IPI-462 and IPI-463 both "Backlog"; IPI-485 "Backlog." |

**The one real discrepancy:** `todo.md` states overall progress "~58%" while naming `CLOUDFLARE-EPIC.md` as its SSOT, which states "~55%." Both numbers are in a defensible range given the verified per-task evidence, but the two docs disagree with each other by 3 points despite one declaring the other authoritative — pick one number and update the other file to match, or make clear the two are measuring slightly different scopes (todo.md = 10-task lean tracker; EPIC = broader migration-progress score including AI-platform sub-scores) and label them differently rather than let both read as "overall migration %."

### 2. Which of the 8 `migration/*.md` notes files are genuinely still useful?

**Keep as reference (5):** `plan-migrate.md` (the actual SSOT plan — decisions, risk register, phased roadmap), `startup.md` (unique errors→fixes runbook, needs a checklist refresh not archiving), `docs/nextjs-cloudflare.md`, `docs/existing.md`, `docs/open-next.md` (official doc mirrors actually followed, each with direct traceability to a step someone ran).

**Archive/delete (7):** `cloudflare-vercel.md` and `Migrate-Vercel-to-Cloudflare-Workers.md` (both fully absorbed precursors — one is early research, the other is literally the prompt template, not a plan), `notes-1.md` (rejected 33-issue decomposition, already self-labeled as an archived appendix inside `plan-migrate.md`), `notes-2.md` (superseded snapshot — canonical version lives in `audits/ipi-454-457-462-463-verification.md`), `notes-3.md` (raw conversational transcript, no authored content, delete outright), `notes-4.md` (confirmed stale by disk check — the branch it describes has moved on), `docs/migrate-vercel.md` (official doc but explicitly the wrong guide for this Next.js app — keep only if there's a real risk someone finds it via search and follows it blind; otherwise safe to cut since the banner already warns).

Net: 12 → 5 active files, ~65KB of scratch/duplicate content removed, nothing genuinely lost (rejected-approach rationale in `notes-1.md` is worth one archived copy for "why we didn't do it this way," not day-to-day reading).

### 3. Does `deep-architecture-review.md` overlap with `cf-000-platform-architecture.md`? Which survives?

**Yes, partial/asymmetric overlap — `cf-000-platform-architecture.md` should be the one architecture doc that survives.** Reasons:
- `cf-000` is **Approved** (2026-07-07); `deep-architecture-review.md` is still **Draft**, one day newer, never promoted.
- `CLOUDFLARE-EPIC.md`'s ADR-001 through ADR-005 and its §3.1 resource matrix trace back to `cf-000`/IPI-469 by name. `deep-architecture-review.md` is never linked from `CLOUDFLARE-EPIC.md` or `todo.md` anywhere, despite its own line 6 claiming to supersede exactly those docs — **the supersession claim was never executed.**
- `cf-000` is a compact 169-line decision table; `deep-architecture-review.md` is 1233 lines of narrative research that mostly re-derives the same conclusions (Workers AI default, pgvector over Vectorize, Mastra stays, defer Queues/Workflows/DO) at far greater length.
- `deep-architecture-review.md` does hold real unique material not in `cf-000` or anywhere else: a 70-issue Linear audit (Phase 2), a 23-screen impact matrix (Phase 7), a model-cost comparison table (Phase 9: "$20.09 Workers AI vs $55.50 Gemini/month"), and a 24-agent catalog (Phase 5) that is a speculative superset of the 7 agents `ai-agent-architecture.md` (Approved) already defines.

**Recommendation:** don't delete `deep-architecture-review.md` wholesale — its Linear-audit and cost-table findings never made it into Linear or `CLOUDFLARE-EPIC.md`'s task list despite being 2 days old. Either action those specific findings now (cheap, since they're already written) or explicitly mark the doc `Status: Draft — not adopted, kept for reference only` so nobody mistakes its "supersedes" claim for something that actually happened.

### 4. Genuine gaps in `cf-000-platform-architecture.md`'s Service Decision Table vs the original Phase-4 ask

Of the 15 topics named in the original ask (KV, Queues, Workflows, Durable Objects, Vectorize, Browser Rendering, R2, Analytics, Rate Limiting, Secrets, Deployments, Preview environments, Rollback, DR, HA, Cost optimization):

- **Covered directly** by `cf-000`'s table: KV, Queues, Workflows, Durable Objects, Vectorize (+ AI Search), Browser Rendering, R2, Analytics Engine.
- **Not in `cf-000` but already covered elsewhere** (not a real gap — just not co-located): Deployments/CI pipeline, Rollback, DR/HA → all live in `CLOUDFLARE-EPIC.md` §3.4 (deployment environments), §12 (production cutover checklist), §13 (rollback plan). Secrets handling is implicit in the env-var migration table in `plan-migrate.md`. This is by design — `cf-000`'s own §7 "Out of Scope" explicitly excludes hosting/ops topics.
- **Genuinely thin, worth a short addition (not a new doc):** **Rate Limiting** has no dedicated row anywhere — it's folded into the AI Gateway rationale in `cf-000` with no explicit policy (per-provider limits? per-tenant? burst behavior?), and **Cost optimization** has no dedicated row in `cf-000` either — the only cost figures that exist live in the unadopted Draft (`deep-architecture-review.md` Phase 9's $20.09-vs-$55.50 comparison). These two topics are the only real gaps: everything else is answered, just not in the same file.

**Recommendation:** add two short rows/paragraphs to `cf-000-platform-architecture.md` (Rate Limiting policy, one-paragraph cost-optimization pointer to the existing Phase 9 table) rather than write a new document — this is a 20-minute edit, not a gap that needs its own doc.

### 5. Direct contradictions between docs (highest priority findings)

1. **`09-gemini-groq-audit.md` vs live Linear** — the audit (dated 2026-07-08) treats GROQ-005/006/007 as active "prod blockers" requiring completion before cutover. Live Linear shows IPI-355, IPI-360, IPI-361 (the entire Groq epic, GROQ-001 through GROQ-007's parent chain) were **Canceled on 2026-07-07**, a day before this audit's snapshot. This is a factual error, not stale phrasing — the audit describes a track that no longer exists. **`audit-2-linear.md`** (also dated 2026-07-07) correctly states the epic was canceled — use that one.
2. **`todo.md` vs its own declared SSOT `CLOUDFLARE-EPIC.md`** — 58% vs 55% overall migration progress, despite `todo.md` naming `CLOUDFLARE-EPIC.md` as the source of truth it derives from.
3. **`CLOUDFLARE-EPIC.md` internal self-contradiction** — IPI-469 (CF-000) is marked 🟢 Done in the §5 P0 table and 🟡 not-yet-Done in the §5 P1c table of the *same document*. Same pattern for IPI-471 (AGENT-001).
4. **`plan-migrate.md` vs `cf-000-platform-architecture.md`** — `plan-migrate.md`'s own decision log explicitly flags this: `cf-000`'s stated position "Vercel hosts Next.js" (§3) is marked "⚠️ Superseded — user direction is full CF migration" inside `plan-migrate.md` itself. Since `cf-000` is the Approved architecture doc and this contradiction is self-flagged rather than hidden, it just needs a one-line resolution recorded in `cf-000` (or a short addendum) confirming which hosting target is current — right now two "current" docs disagree on where Next.js runs long-term.
5. **`jul-8-linear-audit.md` vs `ipi-454-457-462-463-verification.md`** on IPI-457's Linear status: one calls it "In Review 🟡" (Jul 8), the other calls it "Complete" (Jul 9), with the verification file noting "Linear 'Complete' is fake-done on main." Live Linear as of this audit shows **"In Progress"** — neither older snapshot matches current state, which is expected drift, not a real conflict, but flagging so nobody cites either stale snapshot as current.

## Genuine gaps worth a new doc (short, as expected)

This audit found almost nothing that needs a brand-new document — that's the intended outcome. The only items that don't already have a home:

1. **A single-paragraph Rate Limiting policy and Cost Optimization pointer added to `cf-000-platform-architecture.md`** (see answer #4) — an edit to an existing doc, not a new one.
2. **A one-line resolution of the Vercel-vs-Cloudflare hosting-target contradiction** (finding #4 above) recorded wherever `cf-000-platform-architecture.md`'s §3 lives — again an edit, not a new doc.
3. **Nothing else.** `deep-architecture-review.md`'s unique content (Linear audit, screen matrix, cost table, agent catalog) should be actioned into Linear/existing docs rather than spawn a new doc, and the `migration/` and `audits/` folders need pruning, not new material.
