# Cloudflare Platform — Progress Task Tracker

**Last reviewed:** 2026-08-15 (live Linear CLOUDFLARE + `origin/main` + preview Worker probe + 373 local tests)  
**SSOT hierarchy:** **Linear status** → this file (**evidence + open work**) → dated audits  
**Do not use:** the 2026-07-24 rows in [`prime/j24-progress-tracker.md`](../../tasks/cloudflare/prime/j24-progress-tracker.md) as “do next”  
**Linear:** [CLOUDFLARE project](https://linear.app/amo100/project/cloudflare-66efa04f5133) · [Activity update 2026-08-15](https://linear.app/amo100/project/cloudflare-66efa04f5133/activity#project-update-ed64d0d8) · [Verified tracker doc](https://linear.app/amo100/document/progress-task-tracker-2026-08-15-verified-dd0b7bf00fb4)  
**Doc map:** [`index.md`](../../tasks/cloudflare/index.md) · **Changelog:** [`changelog.md`](../../tasks/cloudflare/changelog.md)

Maya can unlock the Cloudflare preview studio door. She still cannot run the Spring Campaign shot list on the new floor. Brand Hub crawl was stamped shipped while the garment is still on the cutting table. The live `ipix.co` front door stays on Vercel — HOLD.

| Lane | Linear raw | Verified | Bar |
|------|-----------:|---------:|-----|
| Native AI (M3) | 45% | **~20%** | `██░░░░░░░░` |
| Hosting / cutover (M1+M4) | ~80–100% | **~75–90%** | `████████░░` |
| Edge (Gateway REST) | Done | **~95%** | `█████████░` |
| `ipix.co` DNS (M5) | 0% | **HOLD** | `░░░░░░░░░░` |

**Linear census:** 66 Done / 121 active = **55%**. **Evidence-adjusted delivery: ~40%.** Not Production Verified. Signed-in SSE `RUN_STARTED` → `RUN_FINISHED` is **NOT VERIFIED**.

```text
Native:  586 ✅ → 607 ✅ → 769 ✅ → W1(753 ✅ + 771 ✅) → W2(751 ✅) → W0(750 🟡 #919 do not merge) → W3(752 🟡 #918 do not merge) → 591 ⚪ → W4(754 🔴 false Done) → 755 ⚪ → 756 ⚪ → 609 ⚪ → 592 ⚪ last
Hosting: 472 ✅ → 632 ✅ → 788 ✅ → 706 ✅ → 707 ✅ → 709 ✅ → 763 ✅ → 794 ✅ → 917 ✅ → 803 🟡 partial (wrangler still noop) → 708 ⚪ → 631 HOLD
Edge:    695 ✅ → 697 ✅ → 699 ✅ → 742 ✅ · 698 parked
```

---

## Do next (only)

| # | Task | Studio meaning | Why now |
|--:|------|----------------|---------|
| 1 | Restore `docs/docs.json` on [#918](https://github.com/amo-tech-ai/lumina-studio/pull/918) and [#919](https://github.com/amo-tech-ai/lumina-studio/pull/919) | Put the lookbook index back — both PRs delete it | Gate after #926 ignores deletes (`--diff-filter=AMR`) |
| 2 | Docs-json-gate include deletes (`AMRD`) | Catch a missing index, not only a new one | Separate CI/docs concern |
| 3 | Land **IPI-750 · CF-MIG-230-W0-HARDEN — Make Shared Cloudflare Model Resolution Resume-Safe** only with green preview | Shared lighting switch must work before any other room moves | #919 behind `main`; preview job failed (`/info` 200, Command Center perf failed) |
| 4 | Rebase **IPI-752 · CF-MIG-230-W3 — Move Production Planner to Cloudflare AI** to Planner-only | Move the shot-list rack, not the whole wardrobe | #918 is a 20-file copy of #919. `main` still `model: MODEL` |
| 5 | Reopen **IPI-754 · CF-MIG-230-W4 — Keep Brand Intelligence and Creative Recommendations Accurate on Cloudflare** | Brand Hub crawl is not shipped | Linear Done 2026-08-12. Code still `resolveModel("default")`. Linked PRs are IPI-751 docs #917 |
| 6 | [#938](https://github.com/amo-tech-ai/lumina-studio/pull/938) CI + sanitize · [#939](https://github.com/amo-tech-ai/lumina-studio/pull/939) lockfile — **separate PRs** | Preview error card and CopilotKit bump cannot share a merge | #938 BLOCKED (no Actions). #939 `npm ci` broken |
| 7 | **IPI-708 · CF-ROLLBACK-001 — Practice Emergency Recovery** | Rehearse moving back to Vercel | Blocks any honest **IPI-631 · CF-MIG-810 — Move the Live iPix Site to Cloudflare** talk |

Park: **IPI-698** DNA · **IPI-631** DNS · **IPI-592** delete Worker · M8 Workflows (IPI-978–988).

Keep `BI_PROVIDER` **ABSENT** until product flips Brand Hub crawl on purpose.

---

## Runtime (locked)

| Surface | Path today | Custom Worker? |
|---------|------------|----------------|
| Live operator app (`ipix.co/app`) | **Vercel** | No |
| Cloudflare preview Worker | Homepage **200**; `/api/copilotkit/info` **401** signed-out (fail-closed, not 502) | OpenNext Worker |
| Production AI for most agents | Frozen `services/cloudflare-worker/` (`ai-gateway`) still deployed | Yes — frozen, 111/111 tests, required CI job |
| Creative Director + public marketing | `resolveAgentModel` + per-agent flags (**IPI-607**, **IPI-751**, **IPI-753**) | Native path available; flag default stays legacy until canary |
| Production Planner + Brand Intelligence | `resolveModel("default")` / `model: MODEL` | Not moved |
| Supabase Edge | REST `…/ai/v1/chat/completions` + `cf-aig-gateway-id` (**IPI-697** ✅) | No |
| Mastra storage on Worker | `MASTRA_STORAGE_MODE=noop` in `app/wrangler.jsonc` (top-level, preview, **and** production) | **IPI-803** Linear Done = preview path only |

---

## Open work

| Order | Task | Studio meaning | Dot | % | Evidence |
|---:|------|----------------|:---:|---:|----------|
| 1 | [IPI-750 · W0](https://linear.app/amo100/issue/IPI-750) | Shared resume-safe model switch | 🟡 | 40 | In Progress. #919 MERGEABLE, **BEHIND**, deletes `docs/docs.json`, preview failed. Do not merge |
| 2 | [IPI-752 · W3](https://linear.app/amo100/issue/IPI-752) | Production Planner shot list | 🟡 | 15 | In Progress. #918 is a #919 superset. `app/src/mastra/agents/index.ts` still `model: MODEL` |
| 3 | [IPI-754 · W4](https://linear.app/amo100/issue/IPI-754) | Brand Hub crawl scoring | 🔴 | 5 | Linear **Done** — **false**. `brand-intelligence-agent.ts` still `resolveModel("default")`. **Reopen** |
| 4 | [IPI-591 · CF-TEST-010](https://linear.app/amo100/issue/IPI-591) | Multi-step tools keep results (shot refs → shot list) | ⚪ | 0 | Todo. After a real Planner move |
| 5 | [IPI-755 · W5](https://linear.app/amo100/issue/IPI-755) | CRM assistant | ⚪ | 0 | Todo. After a real IPI-754 |
| 6 | [IPI-756 · W6](https://linear.app/amo100/issue/IPI-756) | 100% native rollout | ⚪ | 0 | Todo |
| 7 | [IPI-609 · soak](https://linear.app/amo100/issue/IPI-609) | 48h live Cloudflare before dropping Vercel | ⚪ | 0 | Backlog. After W6 |
| 8 | [IPI-708 · rollback](https://linear.app/amo100/issue/IPI-708) | Practice moving back to Vercel | ⚪ | 0 | Todo. Required before DNS |
| 9 | [IPI-631 · DNS](https://linear.app/amo100/issue/IPI-631) | Move live `ipix.co` front door | ⚪ | 0 | Backlog. **HOLD** |
| 10 | [IPI-592 · CF-MIG-820](https://linear.app/amo100/issue/IPI-592) | Delete frozen `ai-gateway` Worker | ⚪ | 0 | Backlog. **Last** — after soak |
| — | [IPI-594 · parent](https://linear.app/amo100/issue/IPI-594) | Whole agent-migration epic | 🟡 | ~25 | In Progress (correct). Do children, not the parent |
| — | [IPI-803 · CF-DB-012](https://linear.app/amo100/issue/IPI-803) | Durable Mastra Postgres on the Worker | 🟡 | 50 | Linear Done. Wrangler still `noop` everywhere. Preview code path only |
| — | [IPI-937 · PERF-DEBT](https://linear.app/amo100/issue/IPI-937) | Command Center preview ~14s | 🟡 | 10 | Todo. Matches failed #919 preview perf |
| — | #938 preview 503 detail | Safe error card on preview | 🔴 | 20 | Open, BLOCKED, no GitHub Actions on `12a8d3a` |
| — | #939 CopilotKit 1.61.2 | Chat kit bump | 🔴 | 10 | Open, BLOCKED. `npm ci` EUSAGE (missing lockfile entries) |

Parent **IPI-594 · CF-MIG-230 — Migrate Mastra Agents to Cloudflare-Native AI Routing**: do **not** implement as one mega-issue.

---

## Per-agent dashboard (code on this tree / `origin/main`)

Wiring = can the hat call `resolveAgentModel` (flag-gated). Native 100% = product flipped the flag in production. That flip is **NOT VERIFIED** for any agent.

| Agent | Wave | Wiring | Native 100% | What Maya clicks |
|---|:---:|:---:|:---:|---|
| `public-marketing` | [W1 · IPI-753](https://linear.app/amo100/issue/IPI-753) ✅ + [IPI-771](https://linear.app/amo100/issue/IPI-771) ✅ | 🟢 `resolveAgentModel` | ⬜ | Public-site marketing chat |
| `creative-director` | [W2 · IPI-751](https://linear.app/amo100/issue/IPI-751) ✅ | 🟢 `resolveAgentModel` | ⬜ | Spring Campaign brief + Assets DNA |
| `production-planner` (+ `default`) | [W3 · IPI-752](https://linear.app/amo100/issue/IPI-752) 🟡 | 🔴 `model: MODEL` | ⬜ | Shot list / shoot wizard |
| `brand-intelligence` | [W4 · IPI-754](https://linear.app/amo100/issue/IPI-754) 🔴 | 🔴 `resolveModel("default")` | ⬜ | Brand Hub crawl after lookbook ingest |
| `crm-assistant` | [W5 · IPI-755](https://linear.app/amo100/issue/IPI-755) ⚪ | 🔴 `resolveModel("default")` | ⬜ | Deal stage / contact timeline |
| `visual-identity` | no landed wave | 🔴 `resolveModel("vision")` | ⬜ | Visual-identity screenshots |
| `social-discovery` | no landed wave | 🔴 `resolveModel` | ⬜ | Social discovery |
| `model-match` | no landed wave | 🔴 `resolveModel` | ⬜ | Matching |
| `booking` | no landed wave | 🔴 `resolveModel()` | ⬜ | Booking wizard |

Env keys exist for the flagged agents (`app/src/lib/ai/agent-routing-keys.mjs`, **IPI-607 · CF-MIG-230-FLAGS** ✅). Flipping a wired agent is `AI_ROUTING_AGENT_<NAME>=native` — not a code change. Do not flip Planner or Brand Hub until their wave actually lands.

---

## Verified facts (`origin/main` + live · 2026-08-15)

| Check | Result |
|-------|--------|
| Preview Worker homepage | 🟢 `https://ipix-operator-preview.sk-498.workers.dev/` → **200** |
| Preview Copilot `/info` signed-out | 🟢 **401** fail-closed (Worker up, not 502) |
| Signed-in preview SSE start→finish | ⚪ **NOT VERIFIED** |
| `ipix.co/app` hosting | 🟢 Vercel (cutover has not happened) |
| `wrangler` `ai` binding | 🟢 Present (top-level, preview, production) |
| `MASTRA_STORAGE_MODE` | 🟡 `noop` on top-level, preview, and production |
| Creative Director native wiring | 🟢 `resolveAgentModel` in `agents/index.ts` (IPI-751, PR #896) |
| Public marketing native wiring | 🟢 `resolveAgentModel` (IPI-753 / IPI-771) |
| Production Planner native wiring | 🔴 still `model: MODEL` |
| Brand Intelligence native wiring | 🔴 still `resolveModel("default")` |
| Routing harness | 🟢 **IPI-769** Done (29 contract tests) |
| Per-agent flags | 🟢 **IPI-607** Done 2026-07-22 |
| Custom Worker tests | 🟢 **111/111** local; required CI job `cloudflare-worker-tests` (**IPI-763** + **IPI-794**) |
| Protect main | 🟢 Ruleset requires `app-build`, `cloudflare-worker-tests`, `supabase-web015`, `supabase-verify-rls` |
| Bundle / smoke / observability | 🟢 **IPI-706**, **IPI-707**, **IPI-709** Linear Done (do not re-open from this file’s old 0% rows) |
| Private production Worker | 🟢 **IPI-917** Done — uploaded, not customer-facing |
| #918 / #919 / #938 / #939 | 🔴 None merge-ready |

**Level:** Unit Verified + thin Remote Preview. **Not** Production Verified.

---

## Decision log

| Date | Decision | Reason | Linear / PR |
|------|----------|--------|-------------|
| 2026-07-14 | Freeze custom AI Worker | No more features; delete later | IPI-592 gate |
| 2026-07-18 | Edge = official REST, not Worker broker | Deno cannot use `env.AI` | IPI-695 / IPI-700 canceled |
| 2026-07-21 | FLAGS before any agent flip | Fail-closed per-agent rollback | IPI-607 |
| 2026-08-12 | Creative Director native wiring | First operator hat on the shared harness | IPI-751 / #896 |
| 2026-08-15 | Do not trust Linear Done on IPI-754 | Crawl agent never moved | Reopen IPI-754 |
| 2026-08-15 | Do not merge #918 / #919 / #938 / #939 | Docs delete, mixed concern, no CI, broken lockfile | See Do next |
| 2026-08-15 | `ipix.co` DNS stays HOLD | Rollback rehearsal never run | IPI-708 before IPI-631 |

---

## Risk register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| This file drifts from Linear again | Wrong “next” work | High if manual | Linear first; re-probe before audits |
| Treat IPI-754 Linear Done as shipped | Brand Hub crawl “fixed” while lookbook scoring stays old | **Now** | Reopen; require `resolveAgentModel` in `brand-intelligence-agent.ts` |
| Merge #918 as Planner-only | Ships W0 + docs delete as one concern | High | Split; restore `docs/docs.json` |
| Merge #939 with broken lockfile | `npm ci` / `app-build` red; Vercel rollback target breaks | High | Fix lockfile on its own PR |
| Talk DNS before IPI-708 | No practiced path back to Vercel | Med | HOLD IPI-631 |
| Claim Production Verified from unit tests | Operators still on Vercel | Med | Name the verification level |

---

## Milestone success metrics

| Milestone | Linear | Verified | Maya |
|-----------|-------:|---------:|------|
| M1 Infrastructure | 100% | ~90% | Studio plumbing exists; long-chat memory still off (`noop`) |
| M2 Routing harness | 100% | 100% | Each hat can flip Cloudflare vs old path (**IPI-769**, **IPI-607**) |
| M3 Production AI | 45% | ~20% | Brief room wired. Shot-list room and Brand Hub crawl are not |
| M4 Cutover ready | 80% | ~75% | Private prod Worker uploaded. Rollback never rehearsed |
| M5 DNS `ipix.co` | 0% | HOLD | Do not move the live front door |
| M6–M8 soak / retire / Workflows | 0% | 0% | After cutover |

---

## Production gates

- [x] **IPI-586** smoke through `ipix-prod`
- [x] **IPI-472** / **IPI-632** preview path
- [x] **IPI-697** / **IPI-699** Edge BI path (switch ABSENT)
- [x] **IPI-607** FLAGS merged
- [x] At least one Mastra agent **wired** on native path (Creative Director, public marketing)
- [ ] Any agent **flipped** in production (canary/native flag) — **NOT VERIFIED**
- [ ] **IPI-752** Planner on `resolveAgentModel` on `main`
- [ ] **IPI-754** Brand Intelligence actually moved (reopen first)
- [ ] **IPI-591** multi-turn tools
- [ ] **IPI-708** rollback rehearsal
- [ ] **IPI-592** custom Worker deleted
- [ ] **IPI-631** DNS (not next)

Do not claim full production AI cutover until W6 + soak. Do not claim IPI-754 Done until `brand-intelligence-agent.ts` leaves `resolveModel`.

---

## Maintainability rules

1. **Linear owns status.** This file owns evidence for **open** CF work. When they disagree, say so (see IPI-754).
2. **One** “Do next” section (above). Do not invent a third ranked list in root `todo.md`.
3. Collapse Done hosting/Edge work; do not re-list IPI-706/707/709/763/794 as 0%.
4. Dated audits (`prime/j24-*`, `audit/j21-*`) are snapshots — not living SSOT.
5. One concern per PR. #918 mixing W0 + W3 is a blocking error, not a style nit.
