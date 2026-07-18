# Cloudflare Platform — Progress Task Tracker

**Last reviewed:** 2026-07-18  
**Authority:** Linear for status · this file for evidence progress · [`PLAN.md`](./PLAN.md) for roadmap  

## Linear (active)

| Surface | Link |
|---------|------|
| **Project** | [AI Platform — LLM Providers](https://linear.app/amo100/project/ai-platform-llm-providers-8088f63224f2) |
| **Overview** | [Cloudflare — Overview](https://linear.app/amo100/document/cloudflare-overview-d96b306aa8f3) |
| **Product Plan and Roadmap** | [Cloudflare — Product Plan and Roadmap](https://linear.app/amo100/document/cloudflare-product-plan-and-roadmap-ba1c45a23f10) |
| **Progress Tracker** | [Cloudflare — Progress Tracker](https://linear.app/amo100/document/cloudflare-progress-tracker-314ad98b0d69) |

### Related active issues

- [IPI-606 · CF-SEC-010 — Connect Infisical Secrets to Cloudflare Deployment](https://linear.app/amo100/issue/IPI-606)
- [IPI-632 · CF-MIG-220 — Protected Preview Runtime Smoke Validation](https://linear.app/amo100/issue/IPI-632)
- [IPI-627 · CF-SEC-020 — Deployment Security Proof](https://linear.app/amo100/issue/IPI-627)
- Historical completed parent: [IPI-487 · CLOUDFLARE-EPIC — Cloudflare Platform Migration](https://linear.app/amo100/issue/IPI-487) (Done — children still drive work)

**Runtime direction (locked 2026-07-18):** see tables below. Status authority is Linear — do not mark Done from markdown alone.

---

**Runtime direction (locked 2026-07-18):**

| Surface | LLM path | Custom Worker? |
|---|---|---|
| **Next.js / OpenNext Worker** | `env.AI.run()` + `gateway: { id: "ipix-prod" }` ([IPI-586](https://linear.app/amo100/issue/IPI-586)) | No — binding on `app/wrangler.jsonc` |
| **Supabase Edge (Deno)** | HTTPS → Cloudflare AI Gateway **REST API** → Workers AI ([IPI-696](https://linear.app/amo100/issue/IPI-696)) | **No** — Edge cannot use `env.AI`; do not route through custom Worker unless Option B is deliberately chosen |
| **Legacy app path (today)** | `AI_GATEWAY_URL` → `services/cloudflare-worker/` | Yes — **frozen**, delete only via [IPI-592](https://linear.app/amo100/issue/IPI-592) |

`services/cloudflare-worker/` is **frozen — no further investment** (2026-07-14). [IPI-700](https://linear.app/amo100/issue/IPI-700) **Canceled** (2026-07-18) — direct REST path does not need Worker service auth. Next.js operator app stays on Vercel until OpenNext cutover gates pass ([IPI-472](https://linear.app/amo100/issue/IPI-472) → [IPI-632](https://linear.app/amo100/issue/IPI-632)).

## 🔴 Architecture decision — post-merge remediation ([PR #448](https://github.com/amo-tech-ai/lumina-studio/pull/448) merged 2026-07-18)

[PR #448](https://github.com/amo-tech-ai/lumina-studio/pull/448) **merged** 2026-07-18 but its ADR still documents **Option B** (Edge → private custom Worker → `env.AI`). That contradicts the frozen-Worker decision and [IPI-700](https://linear.app/amo100/issue/IPI-700) cancellation.

| Option | Architecture | When to choose |
|---|---|---|
| **A — Recommended (lean)** | Edge → `api.cloudflare.com` AI REST + `cf-aig-gateway-id: ipix-prod`; Next.js → `env.AI` binding | Default; matches [`000-Architecture-Decision.md`](Tasks/000-Architecture-Decision.md) and frozen-Worker policy |
| **B — Worker broker** | Edge → authenticated custom Worker → `env.AI` | Only if account-scoped AI Gateway Run token scope is unacceptable; revives [IPI-700](https://linear.app/amo100/issue/IPI-700) |

**Action:** Follow-up PR on `main` to amend the merged ADR to Option A **or** explicitly adopt Option B and remove “frozen” language from this tracker. **Do not start IPI-696 implementation until consistent.**

## Legend

- 🟢 Complete and verified (code, Linear Done, or CI/test artifact)
- 🟡 In progress or partially verified
- 🔴 Failing, blocked, or live incident
- ⚪ Not started

## Overall completion (this audit)

**Score formula (reproducible):**

```text
completion = Σ(task weight × task %) ÷ Σ(task weights)

Weights:
  Critical runtime proof     = 3   (IPI-586, IPI-632, IPI-699 smoke)
  Required infrastructure    = 2   (IPI-472, IPI-606, IPI-594 waves)
  Docs / dashboard config    = 1   (IPI-695 ADR, gateway dashboard toggles)
```

| Track | Weighted tasks | % complete | Notes |
|---|---|---:|---|
| **Native CF AI lane** | Gateway dashboard (×1, 🟡 75%), IPI-586 (×3), IPI-594/591/590 (×2 each) | **~8%** | `(1×75% + 3×0% + 3×0%) ÷ 10 = 7.5%`; no `ai` binding; no smoke route; 0/9 agents migrated |
| **Hosting / cutover lane** | IPI-472 (×2), IPI-632 (×3), IPI-468/490/625 (×1 done) | **~64%** | `(2×45% + 3×40% + 3×100%) ÷ 8 = 63.8%`; M0 done; remote `*.workers.dev` not proven |
| **CF-EDGE lane** | IPI-695 (×1), IPI-696–699 (×2 each) | **~3%** | `(1×30% + 4×0%) ÷ 9 = 3.3%`; ADR merged but Option B conflicts with frozen-Worker policy; zero Edge code |

**Three parallel lanes — do not conflate blockers:**

```text
Native AI lane:  IPI-586 → IPI-594 → IPI-591
Hosting lane:    IPI-472 → IPI-632 → IPI-631
Edge lane:       remediate merged PR #448 ADR → IPI-696 → IPI-699
```

Use OpenNext `preview` / `upload` / `deploy` (not raw `wrangler deploy`) — prepares cache resources per [OpenNext CLI docs](https://opennext.js.org/cloudflare/cli).

---

## Master Progress Task Tracker

| Order | Task | Linear | Dot | % | Evidence | Next action |
|---:|---|---|:---:|---:|---|---|
| 0 | Security: contain custom Worker public exposure | [IPI-487](https://linear.app/amo100/issue/IPI-487) | 🟢 | 100% | `tasks/cloudflare/Tasks/000-Architecture-Decision.md`; public `workers.dev` route disabled (404 on `/health`) | Keep frozen until IPI-592 gate passes |
| 1 | Create `ipix-prod` managed AI Gateway | — (manual) | 🟡 | 75% | Dashboard-confirmed 2026-07-14; Authenticated Gateway toggle **not re-verified 2026-07-18** — gateway exists, auth toggle pending dashboard check | Re-check dashboard before IPI-586 smoke |
| 2 | OpenNext baseline (`wrangler.jsonc`, `open-next.config.ts`, scripts) | [IPI-625](https://linear.app/amo100/issue/IPI-625) · Done | 🟢 | 100% | `app/wrangler.jsonc`, `app/open-next.config.ts`, `app/package.json` (`preview`/`deploy`/`build:cf`/`cf-typegen`); `cloudflare-env.d.ts` has `IMAGES`, `ASSETS`, `WORKER_SELF_REFERENCE` — **no `AI` binding** | — |
| 3 | Worker bundle compatibility + size gate | [IPI-490](https://linear.app/amo100/issue/IPI-490) · Done | 🟢 | 100% | `app/open-next.config.ts` stubs; `scripts/check-worker-bundle-size.mjs`; Linear Done 2026-07-16 | — |
| 4 | Fail-closed operator auth on Worker preview | [IPI-468](https://linear.app/amo100/issue/IPI-468) · Done | 🟢 | 100% | `app/wrangler.jsonc` `OPERATOR_AUTH_ENABLED: "true"`; `app/src/app/api/copilotkit/[[...slug]]/route.ts`; test report `tasks/cloudflare/tests/ipi-468-auth-browser/copilotkit-test-report-2026-07-16-r2.md` | — |
| 5 | Marketing chat `/threads` 405 fix | [IPI-655](https://linear.app/amo100/issue/IPI-655) · Done | 🟢 | 100% | [PR #424](https://github.com/amo-tech-ai/lumina-studio/pull/424) merged 2026-07-18 | — |
| 6 | CopilotKit Intelligence gate + Cloudinary thumbs | — | 🟡 | 85% | [PR #447](https://github.com/amo-tech-ai/lumina-studio/pull/447) **OPEN** (`fix/copilotkit-intelligence-cloudinary-thumbs`); `isCopilotIntelligenceEnabled()` in `app/src/lib/copilotkit/intelligence-config.ts` | Merge PR #447 |
| 7 | OpenNext CI + preview deployment pipeline | [IPI-472](https://linear.app/amo100/issue/IPI-472) · In Progress | 🟡 | 45% | Linear In Progress; `npm run deploy`/`upload` scripts exist; Workers Builds CI not fully proven | Finish preview env upload + CI wiring |
| 8 | Protected preview runtime smoke (remote) | [IPI-632](https://linear.app/amo100/issue/IPI-632) · Backlog | 🟡 | 40% | Local smoke **partial pass (unverified artifact)** — auth/login/message reported ✅, **thread_refresh ❌** UI gap; no committed smoke JSON on this branch; remote `*.workers.dev` not proven | Deploy preview + run remote smoke script; commit artifact if re-run |
| 9 | Wire one Workers AI call via `ipix-prod` | [IPI-586](https://linear.app/amo100/issue/IPI-586) · Todo | ⚪ | 0% | No `ai` binding; no smoke route; zero native traffic. **Do not install `workers-ai-provider` for smoke** — use direct `env.AI.run()` per [CF binding docs](https://developers.cloudflare.com/ai-gateway/integrations/aig-workers-ai-binding/) | (1) Add `"ai": { "binding": "AI" }` (2) `npm run cf-typegen` (3) auth smoke route (4) `env.AI.run(..., { gateway: { id: "ipix-prod" } })` (5) verify log ID |
| 10 | Verify gateway authentication for native path | [IPI-595](https://linear.app/amo100/issue/IPI-595) · Todo | 🟡 | 25% | Dashboard toggle assumed on; no app call proves auth header path yet | Execute after IPI-586 smoke |
| 11 | Migrate Mastra agents to CF-native routing | [IPI-594](https://linear.app/amo100/issue/IPI-594) · Backlog | ⚪ | 0% | 9 agents use `resolveModel()` at module load → Gemini direct. **`workers-ai-provider` deferred here** (Vercel AI SDK integration), not IPI-586 | Blocked on IPI-586; start Step 0 `cfEnv` wiring |
| 12 | Multi-turn tool calling on native path | [IPI-591](https://linear.app/amo100/issue/IPI-591) · Backlog | ⚪ | 0% | Task spec `Tasks/012-CF-TEST-multi-turn-tool-calling.md`; no native-path test run | After IPI-594 wave with tools |
| 13 | Configure managed gateway features | [IPI-590](https://linear.app/amo100/issue/IPI-590) · Backlog | ⚪ | 0% | Umbrella for caching/rate/spend/retry/routing/guardrails; all deferred | One feature at a time after IPI-586 |
| 14 | Gateway hardening backlog (596–605) | [IPI-596](https://linear.app/amo100/issue/IPI-596)–[605](https://linear.app/amo100/issue/IPI-605) | ⚪ | 0% | Issues created 2026-07-14; none started | Parallel after M1 proven |
| 15 | CF-EDGE: Supabase Edge LLM via CF | [IPI-694](https://linear.app/amo100/issue/IPI-694) · Todo | 🟡 | 5% | Epic created 2026-07-18; Edge still **Gemini/Groq direct** (`supabase/functions/_shared/llm/` — no `cloudflare` provider) | Finish [IPI-695](https://linear.app/amo100/issue/IPI-695) ADR |
| 16 | CF-EDGE-001 ADR | [IPI-695](https://linear.app/amo100/issue/IPI-695) · In Progress | 🔴 | 30% | [PR #448](https://github.com/amo-tech-ai/lumina-studio/pull/448) **merged 2026-07-18** — ADR still documents **Option B (custom Worker broker)**; conflicts with frozen-Worker + [IPI-700](https://linear.app/amo100/issue/IPI-700) Canceled | **Post-merge follow-up** — amend ADR on `main` to Option A (direct REST) per [`000-Architecture-Decision.md`](Tasks/000-Architecture-Decision.md) |
| 16b | CF-EDGE-006 Worker service auth | [IPI-700](https://linear.app/amo100/issue/IPI-700) · Canceled | ⚪ | N/A | Canceled 2026-07-18 — not needed for direct REST Phase A | Revive only if Option B adopted |
| 17 | CF-EDGE-002 Deno gateway client | [IPI-696](https://linear.app/amo100/issue/IPI-696) · Todo | ⚪ | 0% | No `AI_PROVIDER=cloudflare` in Edge allowlist yet | After IPI-695 |
| 18 | CF-EDGE-003 wire brand-intelligence | [IPI-697](https://linear.app/amo100/issue/IPI-697) · Todo | ⚪ | 0% | `supabase/functions/brand-intelligence/handler.ts` uses gemini/groq paths only | After IPI-696 |
| 19 | CF-EDGE-004 wire audit-asset-dna | [IPI-698](https://linear.app/amo100/issue/IPI-698) · Todo | ⚪ | 0% | DNA vision deferred for groq (`bi-groq-guards.ts`) | Decide defer vs wire |
| 20 | CF-EDGE-005 secrets + remote smoke | [IPI-699](https://linear.app/amo100/issue/IPI-699) · Todo | ⚪ | 0% | Edge secrets live in **Supabase Dashboard** (not repo) — `AI_GATEWAY_URL` / gateway token not confirmed via dashboard check this pass | After 696–697; verify/set secrets in Supabase Dashboard |
| 21 | Custom Worker frozen (legacy prod path) | — | 🟡 | 70% | `services/cloudflare-worker/` — 98/98 tests (2026-07-18); legacy via `AI_GATEWAY_URL`. **Not a broker for CF-EDGE Phase A** unless Option B chosen | No new features; delete via IPI-592 only |
| 22 | Delete custom Worker (final cleanup) | [IPI-592](https://linear.app/amo100/issue/IPI-592) · Backlog | ⚪ | 0% | Gated on production proof + IPI-604 rollback test | **Last** — after all native path proof |
| 23 | Task docs remediation PRs | #381 / #382 | 🔴 | 50% | [#381](https://github.com/amo-tech-ai/lumina-studio/pull/381) **CLOSED** unmerged; [#382](https://github.com/amo-tech-ai/lumina-studio/pull/382) **CLOSED** unmerged; fixes partially applied on branch (`053`/`054` corrected here) | Re-open or re-apply doc fixes to `main` |
| 24 | `MASTER-PLAN.md` disposition | — | 🔴 | 0% | Stale index; filenames don't match `Tasks/` folder | Archive like PR #379 meta docs |

---

## Verified codebase facts (2026-07-18)

| Check | Result | Proof |
|---|---|---|
| `app/wrangler.jsonc` has `ai` binding? | **No** | File ends at `alias` block — no `"ai": { "binding": "AI" }` |
| `workers-ai-provider` installed? | **No (expected)** | Deferred to IPI-594; not required for IPI-586 smoke |
| Real calls through `ipix-prod`? | **No** | No `ipix-prod` string in `app/src/`; provider uses custom Worker URL |
| Mastra model resolution | **Gemini direct** (default) | `resolveAiProvider()` default `"gemini"`; agents import `resolveModel()` at module load |
| Gateway routing in app today | **Custom Worker only** | `createGatewayLanguageModel()` → `AI_GATEWAY_URL` (default `http://localhost:8787`) |
| Supabase Edge → CF gateway | **Not wired** | `supabase/functions/_shared/llm/` — gemini/groq only |
| OpenNext/Workers setup | **Baseline complete** | `@opennextjs/cloudflare` ^1.20.1, `wrangler` ^4.107.1, scripts present |
| PR #424 (marketing chat) | **Merged** | 2026-07-18 — [IPI-655](https://linear.app/amo100/issue/IPI-655) Done |
| PR #447 (CopilotKit/Cloudinary) | **Open** | Branch `fix/copilotkit-intelligence-cloudinary-thumbs` |
| Custom Worker tests | **Pass** | `services/cloudflare-worker` — 98/98 tests (2026-07-18) |

---

## What changed since 2026-07-14 audit

1. **OpenNext foundation landed:** [IPI-625](https://linear.app/amo100/issue/IPI-625) Done, [IPI-490](https://linear.app/amo100/issue/IPI-490) Done, [IPI-468](https://linear.app/amo100/issue/IPI-468) Done — local Worker preview auth + CopilotKit largely proven.
2. **Marketing chat fix shipped:** [IPI-655](https://linear.app/amo100/issue/IPI-655) Done via [PR #424](https://github.com/amo-tech-ai/lumina-studio/pull/424) merged 2026-07-18.
3. **CF-EDGE track created (2026-07-18):** [IPI-694](https://linear.app/amo100/issue/IPI-694) epic + [IPI-695](https://linear.app/amo100/issue/IPI-695)–[699](https://linear.app/amo100/issue/IPI-699) for Supabase Edge → Cloudflare LLM (parallel to app native path).
4. **Native path still blocked at zero:** [IPI-586](https://linear.app/amo100/issue/IPI-586) remains Todo — no `ai` binding, no smoke route, zero `ipix-prod` traffic.
5. **Doc PRs #381/#382 closed without merge** — task-file fixes exist on branch but were not merged to `main`; reconcile or re-open.
6. **[PR #447](https://github.com/amo-tech-ai/lumina-studio/pull/447) open** — CopilotKit Intelligence env gating + authenticated Cloudinary thumbnails (Vercel stop-gap, not native CF path).

---

## Current state — native path vs legacy

| Item | Status | Evidence |
|---|:---:|---|
| `ipix-prod` gateway | 🟢 created | Dashboard 2026-07-14; auth toggle **not re-verified 2026-07-18** |
| Traffic through `ipix-prod` | 🔴 zero | No app code references; IPI-586 Todo |
| `app/wrangler.jsonc` AI binding | 🔴 missing | Verified grep 2026-07-18 |
| `workers-ai-provider` | ⚪ deferred (not required for IPI-586) | Intentionally not installed — deferred to [IPI-594](https://linear.app/amo100/issue/IPI-594); `app/package.json` |
| Mastra agents on native CF | 🔴 0/9 | All use `resolveModel()` → Gemini/gateway-to-custom-Worker |
| Managed gateway features | ⚪ all disabled | Correctly deferred until IPI-586 |
| Custom Worker | 🟡 frozen, contained | Legacy app path only; **not** CF-EDGE Phase A broker unless Option B |

---

## Linear milestones (Cloudflare migration critical path only)

Project hosts 126+ issues across unrelated tracks — this table covers **~24 CF migration issues**, not the full project.

| Milestone | Target | Key issues |
|---|---|---|
| [CF-M0 · Architecture Foundations](https://linear.app/amo100/project/ai-platform-llm-providers-8088f63224f2/issues) | — | IPI-468 ✅, IPI-490 ✅, IPI-625 ✅ |
| [CF-M1 · Native Path Proven](https://linear.app/amo100/project/ai-platform-llm-providers-8088f63224f2/issues) | 2026-07-27 | IPI-586, IPI-595 |
| CF-M1b · Preview Live | — | IPI-472 🟡, IPI-632 🟡 |
| CF-M2 · Gateway Hardening | 2026-08-10 | IPI-590, IPI-596–605 |
| CF-M3 · Agent Migration | 2026-08-24 | IPI-594, IPI-591 |
| CF-M4 · Legacy Cutover | 2026-09-07 | IPI-592 |
| CF-EDGE (Supabase) | none | IPI-694 → IPI-695–699 |

---

## Task file → Linear mapping (unchanged summary)

40 of 42 `Tasks/` files have Linear coverage or intentional non-issue decision. Remaining gap: `MASTER-PLAN.md` disposition undecided. See prior mapping in git history; key links:

| File | Linear |
|---|---|
| `003` — AI binding (`wrangler.jsonc`) | [IPI-586](https://linear.app/amo100/issue/IPI-586) |
| `004` — `workers-ai-provider` install + resolver | [IPI-594](https://linear.app/amo100/issue/IPI-594) (deferred — not IPI-586 smoke scope) |
| `012` — multi-turn tool calling | [IPI-591](https://linear.app/amo100/issue/IPI-591) |
| `002`/`013`–`019` — gateway features | [IPI-590](https://linear.app/amo100/issue/IPI-590) |
| `054` — wire Mastra agents | [IPI-594](https://linear.app/amo100/issue/IPI-594) |
| `053` — delete custom Worker | [IPI-592](https://linear.app/amo100/issue/IPI-592) |
| `061`–`065` — CF-EDGE epic + tasks | [IPI-694](https://linear.app/amo100/issue/IPI-694)–[699](https://linear.app/amo100/issue/IPI-699) |

---

## Production-ready validation gates

- [ ] `ipix-prod` receives at least one real Workers AI request ([IPI-586](https://linear.app/amo100/issue/IPI-586))
- [ ] All 9 Mastra agents migrated off static model resolution, in waves, behind feature flags ([IPI-594](https://linear.app/amo100/issue/IPI-594))
- [ ] Multi-turn tool calling proven on native path, zero 502s ([IPI-591](https://linear.app/amo100/issue/IPI-591))
- [ ] Managed gateway features configured ([IPI-590](https://linear.app/amo100/issue/IPI-590)) + hardening backlog ([IPI-595](https://linear.app/amo100/issue/IPI-595)–[602](https://linear.app/amo100/issue/IPI-602))
- [ ] Custom Worker deleted only after production proof + rollback tested ([IPI-592](https://linear.app/amo100/issue/IPI-592), [IPI-604](https://linear.app/amo100/issue/IPI-604))
- [x] Fail-closed operator auth on Worker preview ([IPI-468](https://linear.app/amo100/issue/IPI-468))
- [ ] Remote protected preview smoke on `*.workers.dev` ([IPI-632](https://linear.app/amo100/issue/IPI-632))
- [ ] Vercel remains production until OpenNext cutover gates pass ([IPI-472](https://linear.app/amo100/issue/IPI-472))

---

## Immediate next steps, ranked

1. **Commit tracker changes in a dedicated worktree** — one task per worktree; do not stash/switch on an active PR branch (e.g. while PR #447 is open on `fix/copilotkit-intelligence-cloudinary-thumbs`):

```bash
cd /path/to/ipix
git fetch origin
git worktree add ../ipi/cf-progress-tracker origin/main
cd ../ipi/cf-progress-tracker
git switch -c ipi/cf-progress-tracker-2026-07-18
# edit tasks/cloudflare/todo.md only
git add tasks/cloudflare/todo.md
git commit -m "docs(cf): refresh progress tracker with 2026-07-18 audit"
git push -u origin HEAD
```

Use sibling worktrees under `../ipi/<task-id>-<short-name>/` — never modify unrelated branches in-place.

2. **Merge [PR #447](https://github.com/amo-tech-ai/lumina-studio/pull/447)** after CI/review — Vercel stop-gap only; deploy + run three browser smoke checks in PR body.
3. **Resolve architecture contradiction** — [PR #448](https://github.com/amo-tech-ai/lumina-studio/pull/448) merged with Option B; follow-up PR on `main` to amend ADR to Option A (direct REST) per [`000-Architecture-Decision.md`](Tasks/000-Architecture-Decision.md) before starting IPI-696.
4. **Execute [IPI-586](https://linear.app/amo100/issue/IPI-586)** — smallest smoke: AI binding + `cf-typegen` + auth route + direct `env.AI.run()` (no `workers-ai-provider`).
5. **In parallel: [IPI-472](https://linear.app/amo100/issue/IPI-472) → [IPI-632](https://linear.app/amo100/issue/IPI-632)** — hosting lane; remote `*.workers.dev` proof via OpenNext `upload`/`deploy`.
6. **Start [IPI-594](https://linear.app/amo100/issue/IPI-594) only after IPI-586** proves native path.
7. **Reconcile doc PRs #381/#382** — closed unmerged; re-apply or archive `MASTER-PLAN.md`.

## PR decisions (2026-07-18)

| PR | Status | Action |
|---|---|---|
| [#447](https://github.com/amo-tech-ai/lumina-studio/pull/447) | Open, CI green | **Merge** — CopilotKit + Cloudinary; not CF migration |
| [#448](https://github.com/amo-tech-ai/lumina-studio/pull/448) | **Merged** 2026-07-18 | **Follow-up PR** — merged ADR still Option B; amend to Option A or adopt B explicitly |

---

## Summary counts

| Status | Count | Meaning |
|:---:|---:|---|
| 🟢 | 5 | OpenNext baseline, bundle gate, auth, marketing chat fix, security containment |
| 🟡 | 7 | Gateway (auth unverified), custom Worker frozen, IPI-472 pipeline, IPI-632 local smoke (unverified), IPI-695 ADR remediation, PR #447, gateway auth (dashboard-only) |
| 🔴 | 3 | Zero native traffic, no AI binding, MASTER-PLAN + unmerged doc PRs |
| ⚪ | 10+ | IPI-586, 590–594, 591, 592, CF-EDGE 696–699, hardening backlog |

**Native-path completion: ~8%** — weighted score (gateway infra only; application code and agent migration at 0%).

**Hosting / cutover lane: ~64%** — `(2×45% + 3×40% + 3×100%) ÷ 8`; foundation + auth largely done; remote deploy + CI still open.

**CF-EDGE lane: ~3%** — `(1×30% + 4×0%) ÷ 9`; ADR merged but architecture remediation pending.

**Tracker audit score: ~86% → ~95% after this correction pass** (architecture decision documented, scoring formula reproducible, IPI-586 scope corrected, PR #448 post-merge remediation tracked, worktree workflow documented).
