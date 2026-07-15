# Cloudflare Platform — Progress Task Tracker

**Last verified:** 2026-07-14 (this pass — folded in Batch 4 audit findings + 11 new backlog issues)
**Source of truth:** Linear project "AI Platform — LLM Providers", `tasks/cloudflare/Tasks/`, `tasks/cloudflare/Tasks/000-Architecture-Decision.md`, live Cloudflare dashboard/API state, IPI-487 migration gate
**Runtime direction:** Full commitment to Cloudflare-native, dashboard-configured AI Gateway (`ipix-prod`) + Workers AI binding + `workers-ai-provider`. The custom `services/cloudflare-worker/` Worker path is **frozen — no further investment** (decision 2026-07-14). Next.js operator app stays on Vercel until the OpenNext/Workers cutover gates pass (unrelated track, see CF-MIG-110/210).

**⚠️ This file replaced a 2026-07-10 version built entirely around the old custom-Worker path. That plan is obsolete — see "What changed" below.**

## Legend

- 🟢 Complete and verified
- 🟡 In progress or partially verified
- 🔴 Failing, blocked, or a live incident
- ⚪ Not started

## What changed on 2026-07-14 (read this first)

1. **Decision: stop investing in the custom `services/cloudflare-worker/` gateway.** Full commit to native `ipix-prod` + Workers AI binding instead. Nine Linear issues canceled: [IPI-525](https://linear.app/amo100/issue/IPI-525), [IPI-461](https://linear.app/amo100/issue/IPI-461), [IPI-457](https://linear.app/amo100/issue/IPI-457), [IPI-454](https://linear.app/amo100/issue/IPI-454), [IPI-530](https://linear.app/amo100/issue/IPI-530), [IPI-529](https://linear.app/amo100/issue/IPI-529), [IPI-528](https://linear.app/amo100/issue/IPI-528), [IPI-527](https://linear.app/amo100/issue/IPI-527), [IPI-531](https://linear.app/amo100/issue/IPI-531) — all real work, none wasted (verified before canceling).
2. **P0 security incident found and closed same day.** The custom Worker (`ai-gateway.sk-498.workers.dev`) was live, public, and had zero incoming-request authentication. Contained by disabling its public `workers.dev` route via the Cloudflare API — verified `/health` now returns 404. Full record: [IPI-487](https://linear.app/amo100/issue/IPI-487) comments.
3. **PR remediation for `tasks/cloudflare/Tasks/`:** #379 (archive 20 superseded files) **merged**. #381 (fix the 11 surviving files) — **open**. #382 (Linear cross-links, ID collision fixes) — **open, stacked on #381**. None of this is reflected on this branch (`codex/IPIX`) — see "Branch note" below.
4. **New Linear issues for the native path (created 2026-07-14):** [IPI-586](https://linear.app/amo100/issue/IPI-586) (wire one real call — the actual next step), [IPI-590](https://linear.app/amo100/issue/IPI-590) (managed gateway features), [IPI-591](https://linear.app/amo100/issue/IPI-591) (multi-turn tool calling), [IPI-592](https://linear.app/amo100/issue/IPI-592) (delete the custom Worker, gated), [IPI-589](https://linear.app/amo100/issue/IPI-589) (stale `compatibility_date`), [IPI-594](https://linear.app/amo100/issue/IPI-594) (migrate all 9 Mastra agents).
5. **11 more backlog issues created from the "improvements" audit round:** [IPI-595](https://linear.app/amo100/issue/IPI-595) Gateway Auth, [IPI-596](https://linear.app/amo100/issue/IPI-596) DLP, [IPI-597](https://linear.app/amo100/issue/IPI-597) Logging/Retention Policy, [IPI-598](https://linear.app/amo100/issue/IPI-598) Versioned Config Record, [IPI-599](https://linear.app/amo100/issue/IPI-599) Central Error Mapping, [IPI-600](https://linear.app/amo100/issue/IPI-600) Reusable Capability Matrix, [IPI-601](https://linear.app/amo100/issue/IPI-601) Tool Idempotency Controls, [IPI-602](https://linear.app/amo100/issue/IPI-602) Monitoring/Alerts, [IPI-603](https://linear.app/amo100/issue/IPI-603) Failure-Injection Suite, [IPI-604](https://linear.app/amo100/issue/IPI-604) Bypass/Rollback Test, [IPI-605](https://linear.app/amo100/issue/IPI-605) Metadata/Log Privacy Audit (named `CF-SEC-011`, not `CF-SEC-010` — avoided a naming collision with a different already-proposed task of that ID).
6. **Batch 4 audit findings applied to `039`/`053`/`054` this pass** — `053` had a real, unfixed naming collision (`CF-MIG-220`) and a dangerously weak entry gate; `054` had a genuine internal contradiction (claimed old provider code "was already removed" while also describing rolling back to it — the classic delete-before-migrate ordering bug). Both fully corrected. `039` reclassified from "Production Hardening" to an optional discovery pilot, and its false "AI Search is Beta" assumption corrected (it's GA).

## Branch note (read before trusting file content elsewhere in the repo)

This working directory (`codex/IPIX`) has its **own divergent history** from `main` — introduced via a separate PR #361, not this session's work. None of PR #379/#381/#382's fixes exist here. Corrections made in this file's "what changed" section above were applied **directly on this branch**, independently of the `main`-branch PRs — the two need reconciling eventually, they are not currently the same content.

## Current state — native path

| Item | Status | Evidence |
|---|:---:|---|
| `ipix-prod` gateway | 🟢 created | Dashboard-confirmed; Authenticated Gateway on, logging on |
| Traffic through `ipix-prod` | 🔴 zero | 0 requests / 0 tokens / $0.00 cost as of last dashboard check |
| `app/wrangler.jsonc` AI binding | 🔴 not added | Confirmed via grep — no `ai` binding exists |
| Managed features (caching, rate limit, spend limit, retry, dynamic routing, guardrails) | ⚪ all disabled | Correctly deferred — IPI-586 must prove the basic path first |
| Custom Worker (`services/cloudflare-worker/`) | 🟡 frozen, contained | Still deployed, 98/98 tests pass, still the only real production AI path today — public route disabled, no further feature work planned |

## Have all `tasks/cloudflare/Tasks/` files been added to Linear? — Full mapping

| File | Linear issue | Status |
|---|---|---|
| `000-Architecture-Decision.md` | — | Architecture doc, not a task; no issue needed |
| `001-CF-GW-create-gateway.md` | — | Done manually via dashboard already; no issue needed retroactively |
| `002-CF-GW-configure-routing.md` | [IPI-590](https://linear.app/amo100/issue/IPI-590) | ✅ covered (umbrella for 013–019 too) |
| `003-CF-AI-add-workers-ai-binding.md` | [IPI-586](https://linear.app/amo100/issue/IPI-586) | ✅ covered (Step 1 of IPI-586's scope) |
| `004-CF-AI-setup-models.md` | [IPI-586](https://linear.app/amo100/issue/IPI-586) | ✅ covered |
| `005`–`011` (CF-WORKER dashboard/CI-CD, fabricated-endpoint docs) | — | **Archived** in PR #379 — superseded, intentionally no issue |
| `012-CF-TEST-*.md` | [IPI-591](https://linear.app/amo100/issue/IPI-591) | ✅ covered |
| `013`–`019` (CF-GW feature configs) | [IPI-590](https://linear.app/amo100/issue/IPI-590) | ✅ covered — plus [IPI-595](https://linear.app/amo100/issue/IPI-595)–[IPI-602](https://linear.app/amo100/issue/IPI-602) for the hardening backlog these files flagged (auth, DLP, logging policy, versioned config, error mapping, capability matrix, idempotency, monitoring) |
| `022`–`025` (CF-NEXTJS OpenNext/Wrangler setup) | — | ✅ **Corrected this pass.** Not duplicate scope, not archive candidates — verified `app/wrangler.jsonc`/`open-next.config.ts`/`package.json` already have this exact setup. Fixed to "Already complete" status with a "DO NOT RUN" banner over the stale executable body. No Linear issue needed (historical record). |
| `029`–`034` (CF-MASTRA standalone deployer) | — | **Archived** in PR #379 — superseded (Mastra stays in-process, confirmed via IPI-486) |
| `039-CF-STORAGE-setup-ai-search.md` | — | ⚪ **Correctly no issue yet — genuinely optional.** Reclassified this pass from "Production Hardening" to a discovery pilot (`CF-SEARCH-001`), not a migration dependency. Its "AI Search is Beta" assumption was wrong (confirmed GA) — but that doesn't change its priority; still not urgent, still not blocking IPI-586/590/591/592/594. |
| `053-CF-MIGRATION-cleanup-custom-code.md` | [IPI-592](https://linear.app/amo100/issue/IPI-592) | ✅ **File content actually fixed this pass** — previously the Linear issue existed but the file itself still had the unfixed `CF-MIG-220` naming collision and a dangerously weak "one agent works" entry gate. Now renamed to `CF-MIG-820`, Phase 9 of 9, full production-readiness gate table, 3-PR split, secrets-sequencing caution. |
| `054-CF-MIGRATION-wire-mastra-agents.md` | [IPI-594](https://linear.app/amo100/issue/IPI-594) | ✅ **File content actually fixed this pass** — had a real internal contradiction (claimed old provider code "already removed" while describing rollback to it, i.e. delete-before-migrate). Fixed: correct phase, migration waves, per-agent feature flags, the missing `requestContext.set("cfEnv")` env-access step, corrected rollback/removal logic. |
| `31`/`32`/`33` (old duplicate-numbered files) | — | **Archived** in PR #379 — duplicates of 013–019 under a different scheme |
| `COMPLETE-RESEARCH-SUMMARY.md`, `MASTRA-SETUP-SUMMARY.md`, `NEXTJS-QUICK-START.md`, `TASK-REFERENCES.md`, `TASKS-INDEX.md` | — | **Archived** in PR #379 — meta/index docs, not tasks |
| `MASTER-PLAN.md` | — | 🔴 **Still unresolved.** Stale index, linked filenames don't match any real file in this folder. A Batch 4 audit separately referenced a nonexistent `MASTER-PLAN(1).md` — confirmed that file doesn't exist on this branch, likely an artifact from wherever that audit was generated. Candidate for archival, not yet actioned. |

**Answer: 40 of 42 files now have Linear coverage or an intentional, evidenced non-issue decision.** Only real remaining gap: `MASTER-PLAN.md`'s disposition undecided.

## Master implementation table — order, Linear status, and managed-first method

**Every "Method" column value below was verified against live Cloudflare docs, the `cloudflare/ai`, `cloudflare/templates`, `cloudflare/agents-starter`, and OpenNext repos across four separate audit-verification rounds this session** — not re-checked again for this table, since re-verifying unchanged facts wastes effort. See the audit trail in `tasks/cloudflare/Tasks/notes/01`–`06` for the underlying evidence per claim.

**/task-verifier checklist** — ✅ = Linear issue exists AND file content matches it AND both were directly re-verified this session (not assumed from memory); 🟡 = Linear exists but file/Linear may still drift; ⚪ = intentionally no issue (documented reason in the mapping table above).

| Order | Task / File | Linear | Checklist | Managed-first method | Custom code needed? |
|---:|---|---|:---:|---|---|
| 1 | `001` — Create `ipix-prod` gateway | — (done manually) | ✅ | Dashboard (or REST API) — **already done** | None |
| 2 | `003`/`004` — Add `ai` binding + Workers AI resolver | [IPI-586](https://linear.app/amo100/issue/IPI-586) | ✅ | Wrangler config (`{"ai":{"binding":"AI"}}`) + official `workers-ai-provider` package | Minimal — one resolver function, additive not replacing |
| 3 | `054` Step 0 — per-request env access | [IPI-594](https://linear.app/amo100/issue/IPI-594) | ✅ | Mastra's built-in dynamic `model` resolution + `@opennextjs/cloudflare`'s `getCloudflareContext()` — both official, both already installed | One `.set()` call in one existing route file |
| 4 | `595` — Verify Gateway Authentication | [IPI-595](https://linear.app/amo100/issue/IPI-595) | ✅ | Dashboard toggle + REST cross-check | None |
| 5 | `054` waves 1–7 — migrate agents behind feature flags | [IPI-594](https://linear.app/amo100/issue/IPI-594) | ✅ | Official `workers-ai-provider` + Mastra dynamic model — custom code is only the feature-flag routing table | Small — flag lookup per agent |
| 6 | `012`/`591` — verify multi-turn tool calling | [IPI-591](https://linear.app/amo100/issue/IPI-591) | ✅ | Vitest (existing) + Playwright (existing) + AI Gateway logs (dashboard) | Test code only, no product code |
| 7 | `002`/`013`–`019` — configure managed gateway features | [IPI-590](https://linear.app/amo100/issue/IPI-590) | ✅ | Dashboard for caching/rate/spend/retry; Dynamic Routing needs one route-name call-site change (the one documented exception) | Small — route-name string at call sites, metadata helper |
| 8 | `600` — reusable model capability matrix | [IPI-600](https://linear.app/amo100/issue/IPI-600) | ✅ | Cloudflare's published model catalog — a doc, not code | None |
| 9 | `596`/`597` — DLP + payload logging/retention policy | [IPI-596](https://linear.app/amo100/issue/IPI-596), [IPI-597](https://linear.app/amo100/issue/IPI-597) | ✅ | Dashboard (DLP) + per-request header (`cf-aig-collect-log-payload`) | None |
| 10 | `599` — central gateway error mapping | [IPI-599](https://linear.app/amo100/issue/IPI-599) | ✅ | No managed equivalent — genuinely needs a small shared module | Yes, one module, documented why |
| 11 | `601` — tool-retry idempotency controls | [IPI-601](https://linear.app/amo100/issue/IPI-601) | ✅ | No managed equivalent (Mastra-layer concern) | Yes, small, documented why |
| 12 | `602` — monitoring and alerts | [IPI-602](https://linear.app/amo100/issue/IPI-602) | ✅ | Dashboard alerting where available; external channel wiring (Slack/PagerDuty) is integration, not infra rebuild | Small — webhook wiring |
| 13 | `598` — versioned gateway config record | [IPI-598](https://linear.app/amo100/issue/IPI-598) | ✅ | A doc file + manual-sync convention (or Cloudflare API dump if supported) | None to minimal |
| 14 | `008` — Workers Builds CI/CD | — (real bug fixed, no dedicated issue yet) | 🟡 | Dashboard Git integration — **has a confirmed, fixed bug** (`npm run build` ≠ OpenNext build; use `npm run deploy`) | None — pure config |
| 15 | `603` — failure-injection suite | [IPI-603](https://linear.app/amo100/issue/IPI-603) | ✅ | Staging + simulated failures against existing gateway config | Test code only |
| 16 | `604` — bypass/rollback test | [IPI-604](https://linear.app/amo100/issue/IPI-604) | ✅ | Staging config change, no code | None |
| 17 | `605` — metadata/log privacy audit | [IPI-605](https://linear.app/amo100/issue/IPI-605) | ✅ | Grep + dashboard log inspection | None |
| 18 | `053`/`820` — delete custom Worker | [IPI-592](https://linear.app/amo100/issue/IPI-592) | ✅ | `git rm` + `npm uninstall`, gated on production proof — the one task that's *supposed* to be custom-code-heavy, since it's deletion | Deletion only, 3-PR split |
| — | `039` — AI Search pilot | — (correctly no issue, optional) | ⚪ | Dashboard Playground → Workers namespace binding → official `ai-search-provider` | Minimal, only for tenant-isolation/upload-security layers managed features don't cover |
| — | `MASTER-PLAN.md` | — (undecided) | 🔴 | N/A — stale index, not a task | N/A |

**Is this the correct implementation order?** Yes, with one caveat: rows 4–13 (auth verify, agent waves, multi-turn test, gateway features, capability matrix, privacy/DLP, error mapping, idempotency, monitoring, config record) have some real parallelism — they don't have to be strictly sequential, several can run concurrently once IPI-586 (row 2) and Step 0 (row 3) land. The one **hard** sequencing rule, confirmed twice this session as a real bug when violated: **row 18 (`053`/cleanup) must be last, after everything else, with production proof** — that's the single most-violated rule across every audit reviewed this session.

## Linear milestones (created 2026-07-14 — this is the actual phase structure now)

**Scope note:** the "AI Platform — LLM Providers" Linear project hosts multiple unrelated initiatives (126 non-archived issues total) — a Groq migration (now abandoned, see below), a PR-Agent/Bedrock track, legacy Gemini/WEB-015 work, and this Cloudflare AI Gateway migration. This todo.md and these milestones cover **only the Cloudflare migration critical path** (~24 issues), not the full project. That's intentional, not a gap — the project's own summary field says as much ("27 backlog ≠ sprint queue").

**Groq milestones deprecated:** the project had 4 pre-existing milestones (GROQ-M1–M4) for a Groq migration. Per explicit user decision 2026-07-14 ("we are not using groq"), these were renamed to `DEPRECATED — ...` and their target dates cleared — their underlying issues (GROQ-001→007) were already Canceled. True deletion isn't possible via this session's Linear MCP connector (no delete-milestone or generic GraphQL tool available) — needs the Linear UI or an API-key-based call outside this session.

| Milestone | Target | Issues |
|---|---|---|
| [CF-M1 · Native Path Proven](https://linear.app/amo100/project/ai-platform-llm-providers-8088f63224f2/issues) | 2026-07-27 | IPI-586, IPI-595 |
| CF-M2 · Gateway Hardening Complete | 2026-08-10 | IPI-590, 596, 597, 598, 599, 600, 601, 602, 603, 604, 605, 606 |
| CF-M3 · Agent Migration Complete | 2026-08-24 | IPI-594, 607, 591 |
| CF-M4 · Legacy Cutover Complete | 2026-09-07 | IPI-609, 592 |
| CF-Search · AI Search Pilot (optional) | none | IPI-474, 608, 610, 611 |

Target dates above are proposed placeholders (spaced to match the master table's dependency order), not team-committed dates — real dates need a human decision, same as IPI-609's soak-window owner/duration.

**Cycles (sprints):** not created. This Linear MCP connector has no cycle-create capability (list-only). The `iPix1` team already runs 2-week cycles per other initiatives (`MODEL-S*`, `DESIGN-S*`, `BRAND-S*`) — an empty, unused `GROQ-S1` cycle (0 issues) also exists and is worth cleaning up separately if desired. If real sprint scheduling is wanted for this migration, it needs either the Linear UI directly or a CLI/API path this session doesn't have.

## Immediate next steps, ranked

1. **Merge PR #381, then #382** on `main` — separate from this branch's own now-fixed content; the two need reconciling.
2. **Execute IPI-586** — add the `ai` binding, build the isolated smoke-test route, prove one real request through `ipix-prod`. Still zero code written. Blocks IPI-590, 591, 592, 594 in practice.
3. **Decide on `MASTER-PLAN.md`** — archive as duplicate/stale, matching the treatment `029`–`034` and the other index docs got in PR #379.
4. **Fill in IPI-487's migration-gate TBDs** — smoke test owner, target cutover date, rollback duration. Needs a human decision.
5. **Reconcile this branch (`codex/IPIX`) with `main`** — both now have real, non-overlapping fixes to the same files (e.g. `053`/`054` were fixed independently on each). Needs a deliberate merge, not two divergent "correct" versions living separately.
6. **`039` (AI Search) stays unscheduled** until IPI-586/590/591/594 land — correctly deprioritized, not urgent.

## Production-ready validation gates (unchanged, still the bar)

- [ ] `ipix-prod` receives and routes at least one real Workers AI request (IPI-586)
- [ ] All 9 Mastra agents migrated off static model resolution, in waves, behind feature flags (IPI-594)
- [ ] Multi-turn tool calling proven on the native path, zero 502s (IPI-591)
- [ ] Managed gateway features configured and verified (IPI-590), including the auth/DLP/logging/monitoring backlog (IPI-595–602)
- [ ] Custom Worker deleted only after production proof + rollback tested + the full entry gate in `053` (IPI-592, explicitly gated, do not rush)
- [ ] Vercel remains production until the separate OpenNext/Workers cutover gates pass (CF-MIG-110/210/220/810 — unrelated track)

## Summary

| Status | Count | Meaning |
|:---:|---:|---|
| 🟢 | 1 | `ipix-prod` gateway created and dashboard-configured |
| 🟡 | 1 | Custom Worker frozen, contained, still the real production path |
| 🔴 | 4 | Zero native traffic, no app code wired, no managed features on, `MASTER-PLAN.md` still undecided |
| ⚪ | 5 | New-path Linear issues created, none started (IPI-586, 590, 591, 594, plus the 11-issue hardening backlog) |

**Native-path completion:** effectively **0%** on the application-code side (gateway exists, nothing calls it) — the honest number; do not average it with the abandoned old path's progress.
