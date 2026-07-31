---
title: "iPix Tech Stack — Master Summary & Progress Tracker"
version: "1.0"
lastUpdated: "2026-07-31"
status: Active
purpose: "One-page truth for every tech stack layer: what is live, what percent of the platform's features we actually use, what is missing, and the exact prompt to re-verify each one."
scoringModel: "Overall = (Core × 0.6) + (Advanced × 0.4). Measures FEATURE ADOPTION, not product completeness."
verifiedAgainst: "app/package.json · app/src/mastra/** · app/wrangler.jsonc · Supabase project nvdlhrodvevgwdsneplk (live SQL) · .github/workflows/*"
verifiedAt: "2026-07-31"
relatedTrackers:
  - ../../tasks/plan/todo.md   # execution SSOT — priority & blockers
  - ../../tasks/todo.md        # design parity mirror
  - ../../mvp.md               # what ships in MVP
---

# iPix Tech Stack — Master Summary

> **What this doc is.** One scorecard for every layer of the stack, scored on **how much of each platform we actually use** — not how finished the product is. A stack can score 🔴 while the feature it powers works fine; it means we hand-rolled what the platform gives free.
>
> **What this doc is not.** It is not the execution master. Priority, blockers, and sprint order live in [`tasks/plan/todo.md`](../../tasks/plan/todo.md). When this doc and code disagree, **code wins** — re-run the verify prompt in [`PROMPTS.md`](./PROMPTS.md).

**Legend:** 🟢 ≥80 healthy · 🟡 40–79 partial · 🔴 <40 needs work · ⚪ 0 not started

---

## 1. Summary scorecard

| # | Stack | Core % | Adv % | Overall | Grade | Status | The one-line problem | Report |
|---|-------|------:|------:|--------:|:-----:|:------:|----------------------|--------|
| 1 | **Supabase** | 90 | 45 | **72** | B− | 🟡 | 37 tables have RLS on with **zero policies** — locked shut, not secured | [→](./reports/04-supabase.md) |
| 2 | **Linear process** | 70 | 40 | **58** | C+ | 🟡 | No cycles, no MVP labels — order lives in a markdown file, not Linear | [→](./reports/08-linear-process.md) |
| 3 | **Mastra** | 75 | 15 | **51** | C | 🟡 | Zero scorers, zero evals — no way to prove an agent got better | [→](./reports/01-mastra.md) |
| 4 | **Cloudinary** | 70 | 20 | **50** | C | 🟡 | Custom upload/transform code where MediaFlows + presets would do | [→](./reports/05-cloudinary.md) |
| 5 | **Dev system** (Claude/Cursor) | 55 | 30 | **45** | C− | 🟡 | Skills describe process but don't *block* the error before it ships | [→](./reports/09-dev-system.md) |
| 6 | **Sentry** | 75 | 30 | **57** | C | 🟡 | Errors, traces and replay all captured — the agent layer is dark | [→](./reports/06-observability.md) |
| 7 | **CopilotKit** | 65 | 10 | **43** | C− | 🟡 | HITL is hand-built — the framework's HITL primitives are unused | [→](./reports/02-copilotkit.md) |
| 8 | **Cloudflare** | 40 | 25 | **34** | D | 🔴 | App still on Vercel; bindings configured but never cut over | [→](./reports/03-cloudflare.md) |
| 9 | **Stripe / payments** | 25 | 0 | **15** | F | 🔴 | Not present in `app/` at all — only in `b2c-storefront/` | [→](./reports/07-stripe-payments.md) |
| — | **AI Agents (9)** | 80 | 20 | **56** | C+ | 🟡 | All 9 exist and route correctly; none are measured | [→](./reports/00-agents.md) |

**Weighted stack adoption: 46 / 100 🟡**

> **Read that number correctly.** 46% means *we use about half of what our platforms already give us*. The repo's own trackers score product readiness separately — `tasks/plan/todo.md` frontmatter says `stackReadiness: 68/100`, `auditScore: 82/100`. Both can be true: the product is further along than our platform usage.

---

## 2. What's actually live right now

| Layer | Runs where | Live? | Evidence |
|-------|-----------|:-----:|----------|
| Operator app (`ipix.co/app`) | **Vercel** | 🟢 | `app/package.json` build script, no Workers deploy in CI |
| AI Gateway Worker | **Cloudflare** | 🟢 | `services/cloudflare-worker/wrangler.jsonc` → worker `ai-gateway` |
| Database | Supabase `fashionos` | 🟢 | 174 tables, 494 indexes, 353 policies, 67 triggers |
| Edge Functions | Supabase (Deno) | 🟢 | 8 deployed + `_shared` |
| Media | Cloudinary | 🟢 | `cloudinary_assets` table, `next-cloudinary` in app |
| B2C storefront | Next.js 15 | 🟡 | `b2c-storefront/` — Stripe wired here only |
| Marketplace | Mercur/Medusa | 🟡 | `my-marketplace/` — admin + vendor dashboards |
| OpenNext → Workers | Cloudflare | 🔴 | Built, bindings set, **never cut over** |

---

## 3. Live database facts (verified by SQL, 2026-07-31)

| Metric | Count | Status | Note |
|--------|------:|:------:|------|
| Tables (all app schemas) | 174 | 🟢 | `public` 115 · `mastra` 33 · `planner` 10 · `talent` 8 · `shoot` 8 |
| Indexes | 494 | 🟢 | ~2.8 per table |
| RLS policies | 353 | 🟢 | |
| Tables with RLS **off** | **0** | 🟢 | Nothing is publicly readable by accident |
| Tables with RLS on but **0 policies** | **37** | 🟢 | **Intentional** — 33 locked `public.mastra_*` shadows (IPI-801 Phase A) + 3 `chatbot_*` + 1 webhook dedupe. All service-role-only by design, with pgTAP coverage |
| Triggers | 67 | 🟢 | |
| Postgres functions (`public`) | 393 | 🟡 | 30 flagged `authenticated_security_definer_function_executable` |
| Realtime tables | **2** | 🟡 | Only `brand_crawls`, `brand_crawl_results` |
| pgvector | installed 0.8.0 | 🟡 | 4 embedding columns exist; **no semantic search ships on them** |
| Migrations | 277 files | 🟢 | |
| Security advisors | 38 WARN · 37 INFO | 🟡 | 0 ERROR |

**Plain English:** the database is well-built and locked down — the risk isn't a leak, it's 37 tables that are *sealed shut* and 4 embedding columns we pay to store but never query.

---

## 4. Progress tracker — by stack

**Columns:** `%` = feature adoption · `Examine` = where to look · `Verify` = the command that proves it · `Blocker` = what stops the next 20%

| ID | Stack | | % | Examine | Verify | Blocker |
|----|-------|:-:|--:|---------|--------|---------|
| **ST-01** | Supabase — schema, RLS, indexes | 🟢 | 88 | `supabase/migrations/` (277) | `npm run supabase:verify-rls` | — |
| **ST-02** | Supabase — grant re-drift root cause (IPI-876) | 🔴 | 0 | `public.mastra_*`, `chatbot_*` | pgTAP `004_public_mastra_shadow_lockdown` | ⚠️ Two re-revokes already needed |
| **ST-03** | Supabase — pgvector semantic search | 🔴 | 20 | 4 `vector(768)` columns | `\d brands` | No embedding write path |
| **ST-04** | Supabase — Realtime | 🟡 | 25 | 2 tables in publication | `pg_publication_tables` | Shoots/assets/bookings not subscribed |
| **ST-05** | Supabase Auth | 🟢 | 85 | `@supabase/ssr`, `org_members` | QA login `qa@ipix.test` | MFA + SSO unused |
| **ST-06** | Mastra — agents + tools + workflows | 🟢 | 85 | `app/src/mastra/` | `cd app && npm test` | — |
| **ST-07** | Mastra — memory | 🟡 | 40 | `memory.ts` — 1 of 9 agents typed | `memory.test.ts` | Semantic recall deferred (IPI-136) |
| **ST-08** | Mastra — scorers / evals | ⚪ | 0 | no matches in `app/src/mastra` | `grep -r createScorer` | Nothing to prove quality |
| **ST-09** | Mastra — observability exporter | 🟡 | 50 | `index.ts` — opt-in flag | `MASTRA_OBSERVABILITY_EXPORTER=1` | Not on in prod |
| **ST-10** | CopilotKit — chat shell | 🟢 | 85 | `operator-panel.tsx` | `npm run dev` :3002 | — |
| **ST-11** | CopilotKit — frontend tools | 🟢 | 80 | 3 tools, 10 call sites | `useFrontendTool` grep | — |
| **ST-12** | CopilotKit — HITL primitives | ⚪ | 0 | `useInterrupt` in **comments only** | `grep -rn useHumanInTheLoop` | Hand-built approval cards |
| **ST-13** | CopilotKit — generative UI / A2UI | ⚪ | 0 | not present | — | Not evaluated yet |
| **ST-14** | Cloudflare — AI Gateway Worker | 🟢 | 90 | `services/cloudflare-worker/` | `npm run verify:cloudflare-gateway` | — |
| **ST-15** | Cloudflare — app on Workers | 🔴 | 30 | `app/wrangler.jsonc` bindings set | `npm run preview` | Bundle size + cutover decision |
| **ST-16** | Cloudflare — Hyperdrive | 🟡 | 45 | binding `HYPERDRIVE_FRESH` | `ENABLE_HYPERDRIVE_PG_SMOKE=1` | Bind-only, no query path |
| **ST-17** | Cloudflare — KV / D1 / R2 / Queues / DO | ⚪ | 0 | **0 D1 databases**, KV commented out | CF API | Not needed until cutover |
| **ST-18** | Cloudinary — upload + delivery | 🟢 | 80 | `cloudinary_assets` (24 cols) | `npm run verify:cloudinary-pipeline` | — |
| **ST-19** | Cloudinary — MediaFlows / AI agents / MCP | ⚪ | 0 | not present | — | Custom code doing platform's job |
| **ST-20** | Stripe — operator app | ⚪ | 0 | **zero** `stripe` refs in `app/src` | `grep -ri stripe app/src` | STR-001–003 have no Linear issues |
| **ST-21** | Sentry | 🟡 | 45 | `@sentry/nextjs` ^10.65 | `NEXT_PUBLIC_SENTRY_DSN` | No tracing/replay/Seer |
| **ST-22** | CI | 🟢 | 85 | 9 workflows, 23 jobs | `gh run list` | No agent-quality gate |
| **ST-23** | Linear — cycles + MVP labels | 🔴 | 30 | order lives in `tasks/plan/todo.md` | Linear MCP | Not set up |
| **ST-24** | Docs organisation | 🟡 | 55 | 20 `docs/` dirs, 13 `tasks/` dirs | `docs/index-docs.md` (self-marked stale) | No archive policy |

---

## 5. Top 10 red flags, ranked

| # | Risk | Where | Impact | Fix |
|---|------|-------|--------|-----|
| 1 | **Table grants silently re-drift after lockdown** | `public.mastra_*` (33), `chatbot_*` (3) | `anon`/`authenticated` regained `SELECT` on deliberately-locked tables — **twice, on unrelated table groups**. Caught by pgTAP both times; root cause unknown | **IPI-876** — find the source. Re-revoke migrations are symptom fixes |
| 2 | **No agent evals** | all 9 agents | A prompt edit can silently make an agent worse. No signal | Add Mastra scorers to 2 agents + a CI gate |
| 3 | **Stripe absent from operator app** | `app/src` | Cannot charge for a shoot. Launch blocker if monetised | Create STR Linear issues; decide Stripe-in-`app/` vs storefront-only |
| 4 | **HITL is convention, not enforcement** | tool prompts | Only the *prompt* stops a silent write. A model that ignores it, writes | Move approvals to CopilotKit HITL primitives |
| 5 | **Cloudflare half-migrated** | `app/wrangler.jsonc` | Two mental models; docs constantly wrong about what's live | Decide: cut over or freeze and label it clearly |
| 6 | **pgvector paid for, unused** | 4 `vector(768)` columns | Storage + index cost with zero search benefit | Wire one query path (talent match) or drop the columns |
| 7 | **30 SECURITY DEFINER funcs executable by `authenticated`** | `public` | Privilege escalation surface | 🟡 **Half done** — IPI-809 covered org helpers + triggers (PR #681, pgTAP #682). Remaining RPCs need the same pass |
| 8 | **Realtime on 2 tables only** | `brand_crawls*` | Shoot/booking/asset screens poll or go stale | Add publication + subscribe on the 3 hot tables |
| 9 | **No Linear cycles / MVP labels** | Linear IPI | "What ships next" is a markdown file a human must read | Enable cycles, add `mvp`/`p0` labels |
| 10 | **`docs/index-docs.md` self-declares stale** | `docs/` | New contributors follow dead links | Adopt the archive policy in [`TEMPLATE.md`](./TEMPLATE.md) |
| **0** | **`main` has zero branch protection** | GitHub · IPI-763 | `CLAUDE.md`'s first hard rule ("never push to `main`") is enforced by nothing. Confirmed `gh api .../branches/main/protection` → 404 | One dashboard screen. **Do this first** |

> Row 0 was found by reading `tasks/cloudflare/todo.md` after the initial pass — see
> [`BUILD-VS-BUY.md`](./BUILD-VS-BUY.md) §0 for the two scorecard corrections that
> came out of the same read.

---

## 6. Launch-critical path (in order)

| Order | Task | Stack | Why it's before the next one |
|:-----:|------|-------|------------------------------|
| 1 | **IPI-876 — root-cause the grant re-drift** | Supabase | Two lockdowns already came undone. A third will too |
| 2 | Finish IPI-809 across the remaining SECURITY DEFINER RPCs | Supabase | Security gate before external users; half done |
| 3 | Decide Stripe scope + open STR issues | Stripe | Determines whether shoots are billable at launch |
| 4 | Add scorers to `production-planner` + `brand-intelligence` | Mastra | Gives every later prompt change a pass/fail |
| 5 | Move one HITL gate to CopilotKit primitives | CopilotKit | Proves the pattern before porting the rest |
| 6 | Realtime on shoots + bookings + assets | Supabase | Removes the "did it save?" refresh problem |
| 7 | Cloudflare go / no-go decision | Cloudflare | Unblocks a dozen docs that hedge on it |
| 8 | Linear cycles + `mvp` labels | Process | Makes order machine-readable, kills the markdown SSOT |
| 9 | Sentry tracing + Seer | Sentry | Turns "it broke" into "here's the span" |
| 10 | pgvector: wire talent search or drop | Supabase | Stop paying for unused storage |

---

## 7. Doc map

| Doc | What's in it |
|-----|--------------|
| **[README.md](./README.md)** (this file) | Scorecard, live facts, tracker, red flags, launch order |
| **[PROMPTS.md](./PROMPTS.md)** | Copy-paste multistep prompts — one per stack, plus the Linear verify prompt |
| **[BUILD-VS-BUY.md](./BUILD-VS-BUY.md)** | **Check before coding.** Per platform: what we hand-built vs what ships prebuilt (dashboard / CLI / MCP / template / sample repo), with links |
| **[TEMPLATE.md](./TEMPLATE.md)** | The template every new stack doc + tracker uses. Archive policy |
| **[CHANGELOG-PRACTICE.md](./CHANGELOG-PRACTICE.md)** | Why the changelog has a 41-commit gap, and the CI gate + weekly job that fix it |
| [reports/00-agents.md](./reports/00-agents.md) | 9 agents — use cases, scores, gaps |
| [reports/01-mastra.md](./reports/01-mastra.md) | Mastra core vs advanced, templates to steal |
| [reports/02-copilotkit.md](./reports/02-copilotkit.md) | CopilotKit features used vs available, examples to adapt |
| [reports/03-cloudflare.md](./reports/03-cloudflare.md) | Vercel → Workers migration, CLI/dashboard/MCP, extra services |
| [reports/04-supabase.md](./reports/04-supabase.md) | Tables, RLS, indexes, triggers, functions, realtime, pgvector, auth |
| [reports/05-cloudinary.md](./reports/05-cloudinary.md) | Core vs advanced, MediaFlows, Cloudinary Agents + MCP |
| [reports/06-observability.md](./reports/06-observability.md) | Sentry, Grafana, Mastra observability |
| [reports/07-stripe-payments.md](./reports/07-stripe-payments.md) | Stripe state, Supabase Sync Engine vs Wrapper, 2026 features |
| [reports/08-linear-process.md](./reports/08-linear-process.md) | Cycles, milestones, labels, task order, verify-against-code |
| [reports/09-dev-system.md](./reports/09-dev-system.md) | Claude/Cursor skills, hooks, agents — catching errors earlier |

---

## 8. External reference links

| Stack | Docs | GitHub | Templates / examples |
|-------|------|--------|----------------------|
| Mastra | [docs](https://mastra.ai/docs) · [memory](https://mastra.ai/docs/memory/overview) · [agents](https://mastra.ai/docs/agents/overview) | [mastra-ai/mastra](https://github.com/mastra-ai/mastra) | [templates](https://mastra.ai/templates) · [agent-builder](https://mastra.ai/agent-builder) |
| Mastra deploy | [Cloudflare deployer](https://mastra.ai/docs/deployment/cloud-providers/cloudflare-deployer) | [issue #14494 bundle size](https://github.com/mastra-ai/mastra/issues/14494) | [workers guide](https://mastra.ai/guides/deployment/cloudflare) |
| CopilotKit | [docs](https://docs.copilotkit.ai/) · [reference](https://docs.copilotkit.ai/reference) | [CopilotKit/CopilotKit](https://github.com/CopilotKit/CopilotKit) | [examples/](https://github.com/CopilotKit/CopilotKit/tree/main/examples) |
| Cloudflare | [Workers](https://developers.cloudflare.com/workers/) · [Workers AI](https://developers.cloudflare.com/workers-ai/) · [Next.js guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/) | [opennextjs-cloudflare](https://github.com/opennextjs/opennextjs-cloudflare) | [OpenNext get-started](https://opennext.js.org/cloudflare/get-started) |
| Supabase | [docs](https://supabase.com/docs) · [vector](https://supabase.com/modules/vector) · [Stripe wrapper](https://supabase.com/docs/guides/database/extensions/wrappers/stripe) | [supabase/supabase](https://github.com/supabase/supabase) | [Stripe Sync Engine](https://supabase.com/blog/stripe-sync-engine-integration) |
| Cloudinary | [docs](https://cloudinary.com/documentation) · [MCP + LLM](https://cloudinary.com/documentation/cloudinary_llm_mcp) | — | [Agents](https://cloudinary.com/agents) · [Integrations](https://cloudinary.com/integrations) |
| Stripe | [docs](https://stripe.com/docs) | — | [Sessions 2026 announcements](https://stripe.com/blog/everything-we-announced-at-sessions-2026) |

---

## 9. How to keep this doc alive

| When | Do |
|------|-----|
| After any PR that touches a stack | Update that stack's row + the mini-report's tracker |
| Weekly | Run `PROMPTS.md` §0 (the 15-minute full re-verify) |
| Before a launch gate | Run every prompt; every 🔴 needs an owner or an explicit "accepted" |
| When a doc goes stale | Follow the archive policy in [`TEMPLATE.md`](./TEMPLATE.md) — banner + move, never silently delete |

**Rule:** never edit a score without pasting the command that produced it into the `Verify` column. A score with no command is a guess.
