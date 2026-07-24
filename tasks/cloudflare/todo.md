# Cloudflare Platform — Progress Task Tracker

**Last reviewed:** 2026-07-24 (Hosting lane re-verified live against Linear/GitHub/Cloudflare/code — see [`prime/j24-cloudflare-plan.md`](./prime/j24-cloudflare-plan.md) full audit and [`prime/j24-progress-tracker.md`](./prime/j24-progress-tracker.md) for the latest re-check. Native AI lane last re-probed 2026-07-22 during IPI-607 PR review — see [Verified facts](#verified-facts-origin-main--2026-07-22).)  
**SSOT hierarchy:** **Linear status** → this file (**evidence + open work**) → root [`todo.md`](../../todo.md) (pointer only) → dated audits  
**Doc map:** [`index.md`](./index.md) · **Audit:** [`audit/j21-todo-audit.md`](./audit/j21-todo-audit.md) · J22 token: [`audit/j22-cloudflare-token.md`](./audit/j22-cloudflare-token.md) · **Hosting migration:** [`prime/j24-cloudflare-plan.md`](./prime/j24-cloudflare-plan.md) + [`prime/j24-progress-tracker.md`](./prime/j24-progress-tracker.md) · **Changelog:** [`changelog.md`](./changelog.md)

| Lane | Progress | Bar |
|------|---------|-----|
| Native AI | Early implementation stage (~10–15%) — only the first milestone (IPI-586) is complete; treat the % as a rough estimate, not a measured value | `██░░░░░░░░` |
| Hosting (Vercel→Cloudflare cutover) | ~70% — architecture + preview proven; four cutover-safety gates (rollback, observability, automated smoke, branch protection) at 0% for 6 days. See `prime/j24-progress-tracker.md` for the row-by-row breakdown | `███████░░░` |
| Edge | ~95% | `█████████░` |

```text
Native:  586 ✅ → 607 🟡 → 750 → W1–W3 → 591 → W4–W6 → 609 → 592
Hosting: 472 ✅ → 632 ✅ → 788 ✅ (Vercel unblocked) → 706 🟡 (bundle, In Progress) → 708+709+707+763 (all 🔴 0%) → 631 (DNS, blocked on those four)
Edge:    695 ✅ → 697 ✅ → 699 ✅ → 742 ✅ · 698 parked
```

### Hosting lane — what changed 2026-07-24

- 🟢 **IPI-788 fixed** — the `main`-branch Vercel `npm ci` lockfile drift (PR #620, merged, production deployment confirmed `Ready`). This was blocking every Vercel deploy including the rollback target the DNS cutover plan depends on.
- 🟡 **IPI-706 (bundle size) In Progress** — gzip bundle hit **8.985 MiB**, 0.015 MiB from the 9.0 MiB hard-fail CI gate (was 8.799 MiB hours earlier, 8.25 MiB at last full audit). Root cause traced to `@copilotkit/react-core → streamdown → mermaid/cytoscape/katex` plus `@copilotkit/web-inspector`, none of which are directly used anywhere in `src` — being fixed via `next/dynamic(..., {ssr:false})` to move them out of the server SSR bundle.
- 🔴 **Still untouched, 6 days stale:** IPI-708 (rollback rehearsal), IPI-709 (observability baseline + Sentry CI token), IPI-707 (automated Playwright preview smoke), IPI-763's branch-protection residual (zero protection on `main`, confirmed via `gh api .../branches/main/protection` → 404). These four block IPI-631 (DNS cutover) — do not start 631 before they're Done.
- 🟡 **IPI-595 (AI Gateway auth)** — both acceptance criteria have live evidence (PR #616, Cloudflare Gateway logs) but Linear still shows `In Progress`. Needs a status flip, not more work.

---

## Do next (only)

| # | Task | Plain English | Why |
|--:|------|---------------|-----|
| 1 | [IPI-607 · FLAGS](https://linear.app/amo100/issue/IPI-607) 🟡 | Per-agent Cloudflare vs legacy switch | [PR #565](https://github.com/amo-tech-ai/lumina-studio/pull/565) — `mergeable: MERGEABLE`, `mergeStateStatus: CLEAN`, no failing checks (verified 2026-07-22). No technical blocker found in review; `reviewDecision` is empty (no formal GitHub "Approved" review recorded) — **needs an explicit approval, not just a merge click** |
| 2 | [IPI-750 · W0](https://linear.app/amo100/issue/IPI-750) ⚪ | Attach `cfEnv`; flip **zero** agents | After #565. ⚠️ Must pass `env: getCloudflareContext().env` explicitly to `resolveAgentRoutingOutcome`/`resolveAgentRoutingMode` — the default (`process.env`) is only guaranteed populated in local dev per OpenNext docs, not on the deployed Worker. Noted on [IPI-750](https://linear.app/amo100/issue/IPI-750) directly. |
| 3 | W1 → W2 → W3 → [IPI-591](https://linear.app/amo100/issue/IPI-591) | Canary → planner → tool proof | Serial; do not skip 591 |
| Park | [IPI-698](https://linear.app/amo100/issue/IPI-698) · [IPI-631](https://linear.app/amo100/issue/IPI-631) · IPI-730 | DNA / DNS / SSO | Not next |

Keep `BI_PROVIDER` **ABSENT** until product flips Brand Hub.

**Linear:** [AI Platform — LLM Providers](https://linear.app/amo100/project/ai-platform-llm-providers-8088f63224f2) · [Progress Tracker doc](https://linear.app/amo100/document/cloudflare-progress-tracker-314ad98b0d69)

---

## Runtime (locked)

| Surface | Path | Custom Worker? |
|---------|------|----------------|
| OpenNext / Next.js | `env.AI.run()` + `gateway: { id: "ipix-prod" }` ([IPI-586](https://linear.app/amo100/issue/IPI-586) ✅) | No |
| Supabase Edge | REST `…/ai/v1/chat/completions` + `cf-aig-gateway-id` ([IPI-697](https://linear.app/amo100/issue/IPI-697) ✅) | No |
| Legacy app today | `AI_GATEWAY_URL` → `services/cloudflare-worker/` | Frozen → delete via [IPI-592](https://linear.app/amo100/issue/IPI-592) |

---

## Open work (active only)

| Order | Task | Plain English | Dot | % | Evidence / next |
|---:|------|---------------|:---:|---:|-----------------|
| 1 | [IPI-607](https://linear.app/amo100/issue/IPI-607) FLAGS | Per-agent routing switches | 🟡 | 85 | PR #565 — merge |
| 2 | [IPI-750](https://linear.app/amo100/issue/IPI-750) W0 | `cfEnv` + resolver; no flips | ⚪ | 0 | After #565 |
| 3 | [IPI-753](https://linear.app/amo100/issue/IPI-753) W1 | Marketing canary | ⚪ | 0 | After W0 |
| 4 | [IPI-751](https://linear.app/amo100/issue/IPI-751) W2 | Four simple agents | ⚪ | 0 | After W1 |
| 5 | [IPI-752](https://linear.app/amo100/issue/IPI-752) W3 | Production Planner | ⚪ | 0 | Unblocks 591 |
| 6 | [IPI-591](https://linear.app/amo100/issue/IPI-591) tools | Multi-turn on CF | ⛔ | 0 | After W3 |
| 7 | [IPI-754](https://linear.app/amo100/issue/IPI-754) W4 | Structured output | ⛔ | 0 | After 591 |
| 8 | [IPI-755](https://linear.app/amo100/issue/IPI-755) W5 | CRM + privacy | ⚪ | 0 | Needs 596/605 |
| 9 | [IPI-756](https://linear.app/amo100/issue/IPI-756) W6 | 100% rollout | ⚪ | 0 | Unblocks 609 |
| 10 | [IPI-609](https://linear.app/amo100/issue/IPI-609) soak | Zero legacy | ⛔ | 0 | After W6 |
| 11 | [IPI-592](https://linear.app/amo100/issue/IPI-592) delete Worker | Remove frozen Worker | ⚪ | 0 | **Last** |
| — | [IPI-594](https://linear.app/amo100/issue/IPI-594) parent | Tracker only | 🟡 | ~12 | Do children, not parent |
| — | [IPI-595](https://linear.app/amo100/issue/IPI-595) gateway auth | Anon + account-auth-only rejected, full auth succeeds | 🟡 | 90 | Evidence complete (PR #616, live Gateway logs) — Linear status flip pending, not more work |
| — | [IPI-590](https://linear.app/amo100/issue/IPI-590)+ hardening | Cache / rate / spend | ⚪ | 0 | After canaries |
| — | [IPI-698](https://linear.app/amo100/issue/IPI-698) DNA | Vision eval | ⚪ | 0 | Parked |
| — | [IPI-788 · VERCEL-CI-001](https://linear.app/amo100/issue/IPI-788) | Repair `npm ci` lockfile drift blocking all Vercel deploys | 🟢 | 100 | Done 2026-07-24 — PR #620 merged, production `Ready`, `/` and `/app` smoke-tested |
| — | [IPI-706 · CF-BUNDLE-220](https://linear.app/amo100/issue/IPI-706) | Reduce Worker bundle ≤7.5 MiB | 🟡 | In progress | 8.985 MiB, 0.015 MiB from the 9.0 MiB hard-fail gate — fixing `streamdown`/mermaid/katex/cytoscape/web-inspector leaking into the server SSR bundle |
| — | [IPI-708 · CF-ROLLBACK-001](https://linear.app/amo100/issue/IPI-708) | Rollback rehearsal | 🔴 | 0 | Blocks IPI-631 — never run once, Backlog since 2026-07-18 |
| — | [IPI-709 · CF-OBS-001](https://linear.app/amo100/issue/IPI-709) | Observability baseline | 🔴 | 0 | Blocks IPI-631 — Sentry CI auth token still missing from `ci.yml`, confirmed 2026-07-24 |
| — | [IPI-707 · CF-SMOKE-001](https://linear.app/amo100/issue/IPI-707) | Automated Playwright preview smoke | 🔴 | 0 | Backlog since 2026-07-18, zero activity |
| — | [IPI-631](https://linear.app/amo100/issue/IPI-631) DNS | Production hostname | 🔴 | 0 | Blocked on IPI-708 + IPI-709 above — do not start early |
| — | [IPI-763 · CF-CI-001](https://linear.app/amo100/issue/IPI-763) | Run `services/cloudflare-worker` tests in CI | 🟡 | 90 | CI job Done (PR #577/#583) — branch-protection residual still open: `main` has zero protection rules (`gh api .../branches/main/protection` → 404, confirmed 2026-07-24), needs a repo-admin action |

Parent [IPI-594](https://linear.app/amo100/issue/IPI-594): do **not** implement as one mega-issue.

---

## Per-agent migration dashboard

Tracks each of the 9 agents individually through the wave chain. All 9 are on `legacy` today — [IPI-607](https://linear.app/amo100/issue/IPI-607) adds the switches (this table's columns), it does not flip any of them.

| Agent | Wave | Legacy | Native | Canary | 100% |
|---|:---:|:---:|:---:|:---:|:---:|
| `public-marketing` | [W1 · IPI-753](https://linear.app/amo100/issue/IPI-753) | ✅ | ⬜ | ⬜ | ⬜ |
| `visual-identity` | [W2 · IPI-751](https://linear.app/amo100/issue/IPI-751) | ✅ | ⬜ | ⬜ | ⬜ |
| `social-discovery` | [W2 · IPI-751](https://linear.app/amo100/issue/IPI-751) | ✅ | ⬜ | ⬜ | ⬜ |
| `model-match` | [W2 · IPI-751](https://linear.app/amo100/issue/IPI-751) | ✅ | ⬜ | ⬜ | ⬜ |
| `booking` | [W2 · IPI-751](https://linear.app/amo100/issue/IPI-751) | ✅ | ⬜ | ⬜ | ⬜ |
| `production-planner` (+ `default`) | [W3 · IPI-752](https://linear.app/amo100/issue/IPI-752) | ✅ | ⬜ | ⬜ | ⬜ |
| `creative-director` | [W4 · IPI-754](https://linear.app/amo100/issue/IPI-754) | ✅ | ⬜ | ⬜ | ⬜ |
| `brand-intelligence` | [W4 · IPI-754](https://linear.app/amo100/issue/IPI-754) | ✅ | ⬜ | ⬜ | ⬜ |
| `crm-assistant` | [W5 · IPI-755](https://linear.app/amo100/issue/IPI-755) | ✅ | ⬜ | ⬜ | ⬜ |

Env keys already exist for all 9 (`app/src/lib/ai/agent-routing-keys.mjs`, shipped in IPI-607) — flipping any one is a config change (`AI_ROUTING_AGENT_<NAME>=native`), not a code change, once its wave's PR lands.

## Rollback criteria (per wave)

Applies to every wave (W1–W6). Roll a wave's agent(s) back to `legacy` (unset or `=legacy` the flag — no deploy needed) if, during its canary window, **any** of:

| Trigger | Threshold |
|---|---|
| Error rate | Routing-related 5xx above baseline |
| Latency regression | p95 exceeds legacy baseline by more than 20% |
| Golden-eval quality | Worse than baseline tolerance (response-quality parity check) |
| Tenant isolation / privacy failure | Any occurrence — immediate rollback, not threshold-based |
| Canary duration | Minimum 50 requests or 24 hours before promoting past canary, whichever comes later |

Source: the standard canary gate already defined per-wave in [IPI-594](https://linear.app/amo100/issue/IPI-594) and [IPI-753](https://linear.app/amo100/issue/IPI-753) — consolidated here so it isn't re-derived per wave.

---

## ✓ Done (collapsed)

<details>
<summary><strong>Foundation + hosting + Edge — click for evidence</strong></summary>

| Done | Plain English | Evidence |
|------|---------------|----------|
| IPI-487 containment | Custom Worker not public | Architecture Decision |
| IPI-625 / 490 / 468 | OpenNext baseline, bundle, auth | Linear Done |
| IPI-655 | Marketing `/threads` 405 | PR #424 |
| **IPI-472** | OpenNext CI + preview pipeline | Linear Done 2026-07-18 |
| **IPI-632** | Remote preview smoke | Linear Done 2026-07-20 |
| **IPI-586** | One Workers AI call via `ipix-prod` | PR #550 · `ai` on `origin/main` |
| **IPI-695** | Edge ADR → REST (not Worker) | PR #448 |
| **IPI-697** | Edge REST client + BI wire | `cloudflare-client.ts` |
| **IPI-699** | Edge canary + rollback | Production Canary Verified |
| **IPI-742** | Edge deploy CI | Workflow + rollback runs |
| IPI-696 / 700 | Canceled / absorbed | Do not reopen |
| IPI-455 | Canceled | — |

</details>

---

## Verified facts (`origin/main` · 2026-07-22)

| Check | Result |
|-------|--------|
| `wrangler` `ai` binding | 🟢 Yes — confirmed live via `git show origin/main:app/wrangler.jsonc`, present ×3 (top-level, preview, production) |
| IPI-586 smoke route | 🟢 Gated internal route |
| Agents on native CF | 🔴 0% (still `resolveModel()` / legacy) |
| Edge `cloudflare-client.ts` | 🟢 Present |
| `BI_PROVIDER` | 🟢 ABSENT (post-canary) |
| Custom Worker (`services/cloudflare-worker/`) | 🟡 Frozen, still legacy path — **98/98 tests pass** (ran fresh 2026-07-22) but **not wired into CI** ([IPI-763](https://linear.app/amo100/issue/IPI-763)) |
| `www.ipix.co/app` hosting | 🟢 Confirmed Vercel (`curl -sI` → `server: Vercel`, `x-vercel-id`), correctly redirects unauthenticated requests to `/login` |
| PR #565 mergeability | 🟡 `mergeable: MERGEABLE`, `mergeStateStatus: CLEAN`, no failing checks — but `reviewDecision` empty, no formal approval recorded |

---

## Decision log

| Date | Decision | Reason | Linear / PR |
|------|----------|--------|-------------|
| 2026-07-14 | Freeze custom AI Worker | No more investment; delete later | IPI-592 gate |
| 2026-07-18 | Edge = official REST, not Worker broker | Deno cannot use `env.AI`; Option A | IPI-695 / #448 · IPI-700 canceled |
| 2026-07-18 | Hosting: OpenNext versions upload/deploy | Official Workers deploy path | IPI-472 |
| 2026-07-20 | BI canary via `BI_PROVIDER` only | Do not flip global `AI_PROVIDER` | IPI-699 |
| 2026-07-20 | Native smoke via `env.AI` + `ipix-prod` | Official binding recipe | IPI-586 / #550 |
| 2026-07-21 | FLAGS before any agent flip | Fail-closed per-agent rollback | IPI-607 / #565 |

---

## Risk register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Tracker drifts from Linear | Wrong “next” work | High if manual | Linear first; re-probe before audits |
| Flip agents before FLAGS merge | No per-agent rollback | Med | Merge #565 before W0 |
| Set `BI_PROVIDER` without product ask | Brand Hub on CF unexpectedly | Med | Keep ABSENT |
| Revive custom Worker for Edge | Architecture regression | Low | IPI-700 canceled |
| Jump to DNS / DNA early | Distracts from agent waves | Med | Park 631 / 698 |

---

## Milestone success metrics

| Milestone | Success | Verification | Evidence |
|-----------|---------|--------------|----------|
| CF-M1 Native proof | One `ipix-prod` call | Smoke + log id | IPI-586 ✅ |
| CF-M1b Preview | Remote SSE + agent turn | Preview smoke | IPI-632 ✅ |
| CF-EDGE-M1 | BI via Gateway + rollback ≤5 min | Canary suite | IPI-699 ✅ |
| CF-M3 Agent migration | Waves behind flags; tools work | 607→W6 + IPI-591 | In progress |
| CF-M4 Cutover | Zero legacy; Worker deleted | IPI-609 + 592 | Not started |

---

## Production gates

- [x] IPI-586 smoke through `ipix-prod`
- [x] IPI-472 / IPI-632 preview path
- [x] IPI-697 / IPI-699 Edge BI path (switch ABSENT)
- [ ] IPI-607 FLAGS merged
- [ ] Any Mastra agent on native path
- [ ] IPI-591 multi-turn tools
- [ ] IPI-592 custom Worker deleted
- [ ] IPI-631 DNS (not next)

**Do not claim production AI cutover** — foundation + Edge proven; agent flips still 0%.

---

## Maintainability rules (from J21 meta-audit)

1. **Do not** duplicate status in Linear + this file + root todo + audit — Linear owns status; this file owns evidence for **open** CF work.  
2. **One** “Do next” section (above). Root `todo.md` links here; do not invent a third ranked list.  
3. Manual `%` is approximate until a Linear child-count generator exists — prefer bars + child Done counts.  
4. Collapse Done rows; expand only for evidence.  
5. Audits are **dated snapshots** — do not treat them as living SSOT.
