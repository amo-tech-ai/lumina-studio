---
title: "Build-vs-Buy Plan — Use the Platform Before Writing Code"
version: "1.0"
lastUpdated: "2026-07-31"
status: Active
purpose: "For each platform: what we hand-built, what ships prebuilt (dashboard / CLI / template / example repo / MCP), and the decision. Check this before opening an editor."
ssot: ../../tasks/plan/todo.md
verifiedAgainst: "scripts/ (23 files, 10,564 LOC) · app/scripts/ (24 files) · tasks/{cloudflare,mastra,copilotkit,cloudinary,supabase}/todo.md · live app config"
verifiedAt: "2026-07-31"
---

# Build-vs-Buy Plan

> **The rule:** before writing code for a platform feature, check five places in order.
> Stop at the first hit.

| # | Check | Where | Cost |
|:-:|-------|-------|:----:|
| 1 | **Dashboard** | Can I click this instead of coding it? | minutes |
| 2 | **CLI** | Does `wrangler` / `supabase` / `stripe` / `mastra` already do it? | minutes |
| 3 | **MCP** | Can an agent do it without me writing a script? | minutes |
| 4 | **Template / example repo** | Has the vendor shipped this exact thing? | hours |
| 5 | **Custom code** | Only now. And check Linear first — someone may own it | days |

**Current state:** 47 custom scripts (23 root + 24 app), **10,564 LOC in root scripts
alone**. Every one below is measured against that ladder.

---

## 0. Corrections to the scorecard

Reading the per-stack task trackers changed two things I got wrong in
[`reports/03-cloudflare.md`](./reports/03-cloudflare.md):

| I said | Actually |
|--------|----------|
| "Bundle size number not published" | **It is published.** `tasks/cloudflare/todo.md` (2026-07-24): gzip bundle at **8.985 MiB against a 9.0 MiB hard-fail CI gate** — 0.015 MiB of headroom. Root cause traced to `@copilotkit/react-core → streamdown → mermaid/cytoscape/katex` plus `@copilotkit/web-inspector`, none used directly in `src` |
| "Cloudflare 34/100" | The **hosting lane is ~70%** — architecture and preview are proven. The 34 reflects overall service adoption, which is still fair, but the migration is much further along than that number implies |

And one thing the trackers surfaced that I missed entirely:

> 🔴 **`main` has zero branch protection** — confirmed via `gh api .../branches/main/protection` → 404 (`tasks/cloudflare/todo.md`, IPI-763). The `CLAUDE.md` rule "🚫 NEVER push directly to `main`" is enforced by nothing but good manners.

That is the highest-value one-click fix in this entire document. It is a dashboard
setting, not code.

---

## 1. Cloudflare

**Existing tasks:** IPI-706 (bundle 🟡) · IPI-708 rollback · IPI-709 observability ·
IPI-707 Playwright smoke · IPI-763 branch protection — **the last four are all at 0%
and 6+ days stale, and they block IPI-631 (DNS cutover).**

| What we hand-built | Prebuilt alternative | Verdict |
|--------------------|---------------------|---------|
| `app/scripts/cf-mermaid-stub.mjs`, `cf-katex-stub.mjs`, `cf-shiki-stub.mjs`, `cf-ast-grep-stub.mjs` — 4 stub files to strip unused deps from the bundle | `next/dynamic(..., {ssr:false})` + `serverExternalPackages`. The tracker already names this as the fix | 🔴 **Replace** — 4 files solving a config problem |
| `cf-mastra-pg-stub.mjs`, `cf-mastra-workers-pg-scope-stub.mjs` | Hyperdrive (already provisioned, `HYPERDRIVE_FRESH`) | 🟡 Revisit after IPI-620 |
| `check-worker-bundle-size.mjs` | No prebuilt equivalent — genuinely ours | ✅ Keep |
| `sync-wrangler-secrets-from-infisical.mjs`, `upload-opennext-with-secrets.mjs`, `cloudflare-secret-allowlist.mjs` | `wrangler secret bulk` + GitHub Actions OIDC | 🟡 Simplify |
| `verify-cloudflare-gateway.mjs` | AI Gateway dashboard analytics + logs | 🟡 Keep the CI gate, drop the reporting half |
| Rollback plan (IPI-708, unwritten) | **Wrangler `versions rollback`** — built in, instant | 🔴 **Use it.** Don't design a rollback process |
| Observability baseline (IPI-709, 0%) | Workers Logs — **already configured** at `head_sampling_rate: 1` | 🟢 Mostly done, needs the Sentry CI token |
| Playwright preview smoke (IPI-707, 0%) | [`cloudflare/templates`](https://github.com/cloudflare/templates) ships a Playwright E2E suite that validates templates in both local and live mode | 🔴 **Copy it** |
| Branch protection (IPI-763) | GitHub repo settings — one screen | 🔴 **Click it today** |

**Prebuilt to pull from:**

| Resource | Use for |
|----------|---------|
| [cloudflare/templates](https://github.com/cloudflare/templates) | Official starters + the Playwright E2E harness for IPI-707 |
| [cloudflare/workflows-starter](https://github.com/cloudflare/workflows-starter) | Replaces the `wait-for-crawl` polling step in `brand-intelligence-workflow.ts` |
| `npm create cloudflare@latest` (C3) | Scaffolds any new Worker correctly |
| [Workers templates in the dashboard](https://blog.cloudflare.com/cloudflare-workers-templates/) | Deploy without a local env |
| [Next.js framework guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/) · [OpenNext](https://opennext.js.org/cloudflare/get-started) | The migration itself |
| Cloudflare MCP (connected) | `workers_list`, `d1_databases_list`, `hyperdrive_configs_list`, `search_cloudflare_documentation` |

**Do this, in order:**

| # | Task | Tool | Effort |
|:-:|------|------|:------:|
| 1 | Enable branch protection on `main` | Dashboard | 5 min |
| 2 | Adopt `wrangler versions rollback` as the IPI-708 answer | CLI | 30 min |
| 3 | Fix the bundle with `next/dynamic`, then delete the 4 stub files | Config | M |
| 4 | Copy the Playwright harness from `cloudflare/templates` for IPI-707 | Template | M |
| 5 | Replace `wait-for-crawl` with a Cloudflare Workflow | `workflows-starter` | M |

---

## 2. Supabase

**Existing tasks:** `tasks/supabase/STATUS.md` + `tasks/supabase/todo/` queue.
Mastra storage chain IPI-628 → 629 → 630 all at **0%**, plus IPI-714
(connection-pool exhaustion, `EMAXCONNSESSION`).

| What we hand-built | Prebuilt alternative | Verdict |
|--------------------|---------------------|---------|
| `verify-rls.mjs`, `probe-anon-data-api.mjs`, `probe-anon-graphql-revoke.mjs`, `probe-definer-rpc-deny.mjs` | `get_advisors(security)` catches all three classes — it already found the 30 SECURITY DEFINER functions and 37 policy-less tables | 🟡 **Keep as CI gates, stop extending.** Add advisors to CI instead of writing probe #4 |
| `check-supabase-migration-drift.mjs` | `supabase migration list --linked` | 🟡 Thin wrapper — fine |
| `verify-supabase.mjs`, `verify-edge-functions.mjs`, `check-edge-inventory.mjs` | `supabase functions list` + MCP `list_edge_functions` | 🟡 Simplify |
| `setup-dev-users.mjs`, `seed-sample-brand.mjs` | `supabase/seed.sql` (exists) + **Branching** for per-PR databases | 🟡 Branching removes most of this |
| Semantic search (not built) | pgvector **already installed**, 4 columns, 3 indexes | 🔴 **Don't build a search service.** Write one query |
| Payment sync (not built) | **Stripe Sync Engine** — one click in the dashboard | 🔴 **Click, don't code** |
| IPI-714 connection-pool exhaustion | Supavisor pooler + Hyperdrive — both already available | 🔴 Config problem, not a code problem |

**Prebuilt to pull from:**

| Resource | Use for |
|----------|---------|
| [Vercel Supabase Next.js template](https://vercel.com/templates/next.js/supabase) | Canonical cookie-based SSR auth — compare against ours |
| [next-supabase-stripe-starter](https://github.com/KolbySisk/next-supabase-stripe-starter) | Reference for the Stripe + Supabase + Next wiring |
| [supabase-nextjs-template](https://github.com/Razikus/supabase-nextjs-template) | RLS policy patterns, file storage, user management |
| [Stripe Sync Engine](https://supabase.com/blog/stripe-sync-engine-integration) | One-click Stripe → Postgres |
| [Stripe FDW Wrapper](https://supabase.com/docs/guides/database/extensions/wrappers/stripe) | Live Stripe reads/writes from SQL |
| `index_advisor` extension | Which of our 494 indexes earn their keep |
| Supabase MCP (connected) | `get_advisors`, `list_tables`, `execute_sql`, `get_logs` |

**Do this, in order:**

| # | Task | Tool | Effort |
|:-:|------|------|:------:|
| 1 | Add `get_advisors` to CI as a gate | MCP / CLI | S |
| 2 | Resolve the 37 policy-less tables (check which `mastra_*` schema is live first) | SQL | S |
| 3 | Enable Stripe Sync Engine | Dashboard | 5 min |
| 4 | Fix IPI-714 with pooler config, not code | Dashboard | S |
| 5 | Enable `index_advisor`, prune dead indexes | Extension | M |

---

## 3. Stripe

**Existing tasks:** **none.** STR-001–003 are listed in `tasks/todo.md` with the
note *"No Linear issues."* This is the least-tracked area in the repo.

| What we'd hand-build | Prebuilt alternative | Verdict |
|----------------------|---------------------|---------|
| Connect onboarding UI | **Stripe-hosted onboarding** — Connect Onboarding for Standard | 🔴 Never build this |
| Checkout page | Stripe Checkout (hosted) | 🔴 Never build this |
| Customer billing portal | Stripe Customer Portal (hosted) | 🔴 Never build this |
| Payment data sync | Supabase Stripe Sync Engine | 🔴 One click |
| Webhook handler | `stripe listen` + sample handlers | 🟡 Thin glue only |
| Invoices / tax | Stripe Invoicing + Tax | 🔴 Never build this |

**The whole shape:** for a marketplace, Stripe hosts onboarding, checkout, and the
billing portal. The custom surface is small — a Payment Intent at shoot approval,
a capture at delivery, a transfer to talent. Everything else is configuration.

**Prebuilt to pull from:**

| Resource | Use for |
|----------|---------|
| [stripe-samples](https://github.com/stripe-samples) (36 repos) | The canonical starting point |
| [Connect Onboarding for Standard sample](https://github.com/stripe-samples) | Talent onboarding |
| [kavholm marketplace demo](https://github.com/stripe/stripe-demo-connect-kavholm-marketplace) | Two-sided marketplace with Connect — closest to iPix's shape |
| [Sessions 2026 announcements](https://stripe.com/blog/everything-we-announced-at-sessions-2026) | Adaptive Pricing, agentic commerce |
| Stripe CLI (`stripe listen`, `stripe trigger`) | Local webhook testing without ngrok |
| Stripe Dashboard test mode | Products, prices, tax, Radar rules — all clickable |

**Do this, in order:**

| # | Task | Tool | Effort |
|:-:|------|------|:------:|
| 1 | **Decide: does the operator app take money?** Write it into `mvp.md` | Decision | S |
| 2 | File STR-001–003 in Linear with real titles | Linear | S |
| 3 | Clone the kavholm marketplace demo, run it, map it to `shoots`/`bookings` | Sample repo | M |
| 4 | Enable Stripe Sync Engine in Supabase | Dashboard | 5 min |
| 5 | Payment Intent + manual capture at `saveApprovedShootDraft` | Code (small) | M |

---

## 4. Mastra

**Existing tasks:** IPI-486 epic (~40%) · IPI-628/629/630 storage chain (all 0%) ·
IPI-714 pool exhaustion · IPI-623 Hyperdrive workload.

| What we hand-built | Prebuilt alternative | Verdict |
|--------------------|---------------------|---------|
| 9 agents written by hand | [Mastra templates](https://mastra.ai/templates) + [Agent Builder](https://mastra.ai/agent-builder) | 🟡 Existing agents are fine — **use templates for the next one** |
| Raw `fetch` to Firecrawl in `visual-identity.ts:52` with hand-rolled `AbortController` | Mastra Firecrawl template / a proper tool with retry + schema | 🔴 Replace |
| Agent quality: nothing | **Built-in scorers** — correctness, faithfulness, tone, safety | 🔴 **Don't write an eval harness.** Use scorers |
| Guardrails: nothing | Input/output **processors** | 🔴 Use processors |
| `memory.ts` lazy proxy | Genuinely ours (IPI-803 Workers ALS scoping) | ✅ Keep |
| Observability pipeline | Built with `MastraStorageExporter` — **just switched off** | 🟢 Two env vars |
| Agent handoff (none — URL map does it) | Agent networks / sub-agents | 🟡 Evaluate |
| External tool access | **MCP client** — unlocks Cloudinary's 5 MCP servers | 🔴 Adopt |

**Prebuilt to pull from:**

| Resource | Use for |
|----------|---------|
| [mastra.ai/templates](https://mastra.ai/templates) | Research assistant, Firecrawl agent, database chat agent |
| [Agent Builder](https://mastra.ai/agent-builder) | Author agents in natural language / visually |
| `mastra dev` Studio | Already installed — inspect agents, traces, workflows locally |
| [mastra-ai/mastra](https://github.com/mastra-ai/mastra) | Source + the docs under `docs/src/content/en/docs/` |
| [Cloudflare deployer](https://mastra.ai/docs/deployment/cloud-providers/cloudflare-deployer) | For `public-marketing` only |
| Mastra MCP knowledge server | Docs search from inside an agent session |

⚠️ **Bundle-size warning:** Mastra's Cloudflare deployer is known to exceed Worker
limits ([issue #14494](https://github.com/mastra-ai/mastra/issues/14494)). Our app
bundle is already at 8.985 / 9.0 MiB. Do **not** attempt a wholesale Mastra→Workers
move; extract `public-marketing` only.

**Do this, in order:**

| # | Task | Tool | Effort |
|:-:|------|------|:------:|
| 1 | Turn on the observability exporter (2 env vars) | Config | S |
| 2 | Add a faithfulness scorer to `production-planner` | Built-in scorer | M |
| 3 | Replace the raw Firecrawl `fetch` with the template's tool | Template | S |
| 4 | Add the MCP client, point it at Cloudinary Analysis | Built-in | M |
| 5 | Unblock IPI-628/629/630 — they gate everything else in the epic | Existing tasks | L |

---

## 5. Cloudinary

**Existing tasks:** IPI-60 DAM structure ✅ Done · IPI-642 usage/cost monitoring ·
IPI-265 upload widget · IPI-639 approval schema · IPI-637 durable event inbox.

| What we hand-built | Prebuilt alternative | Verdict |
|--------------------|---------------------|---------|
| `media_size_specs` table + `lookupChannelSpecs` tool + URL construction | **Named transformations** — define `ipix_ig_feed` once, reference by name | 🔴 **Replace.** This is the cleanest win in the repo |
| `verify-cloudinary-pipeline.mjs` + `.test.mjs` | **Upload presets** make the contract declarative | 🟡 Shrinks a lot |
| `cloudinary-dry-run-audit.mjs` (+ its lib + tests) | DAM search + Admin API | 🟡 Simplify |
| `verify-cloudinary-webhook-live.mjs` | Webhook config in the dashboard | 🟡 Keep the CI gate only |
| IPI-637 durable event inbox (planned) | **MediaFlows** — event-driven workflow engine, template gallery | 🔴 **Check MediaFlows before building this** |
| IPI-639 approval schema (planned) | Structured Metadata + DAM approval states | 🔴 Check before building |
| IPI-642 usage/cost monitoring (planned) | Cloudinary dashboard usage reports | 🔴 Check before building |
| Asset analysis for DNA scoring | **Cloudinary Analysis MCP server** | 🔴 Adopt |

**Three of the four active Cloudinary tickets describe things the platform may
already ship.** That's the strongest build-vs-buy signal in this document — worth
a 30-minute dashboard review before any of them starts.

**Prebuilt to pull from:**

| Resource | Use for |
|----------|---------|
| [cloudinary-community/cloudinary-examples](https://github.com/cloudinary-community/cloudinary-examples) | Next.js integration patterns |
| [cloudinary-devs](https://github.com/cloudinary-devs) | Official demos and workshops |
| [React sample projects](https://cloudinary.com/documentation/react_sample_projects) | Upload widget, gallery |
| [MediaFlows templates](https://cloudinary.com/documentation/mediaflows_user_guide) · [EasyFlows](https://cloudinary.com/documentation/mediaflows_easyflows) | Start-with-a-template gallery for IPI-637 |
| [Cloudinary MCP servers](https://cloudinary.com/documentation/cloudinary_llm_mcp) (5) | Asset Management, Analysis, Structured Metadata, MediaFlows, Env Config |
| [Cloudinary Agents](https://cloudinary.com/agents) | Taxonomy, search, moderation, workflow automation |

**Do this, in order:**

| # | Task | Tool | Effort |
|:-:|------|------|:------:|
| 1 | Dashboard review of IPI-637 / 639 / 642 against MediaFlows + DAM | Dashboard | 30 min |
| 2 | Move channel specs to named transformations | Dashboard | M |
| 3 | Upload presets for the 3 upload paths | Dashboard | S |
| 4 | Spike the Analysis MCP server against `creative-director` | MCP | M |
| 5 | MediaFlows template for post-shoot triage | Template | L |

---

## 6. CopilotKit

**Existing tasks:** IPI-702 runtime `/info` (~60%) · IPI-127 prod config (~70%) ·
**IPI-128 · AIOR-012 — `useRenderToolCall` Gen UI registry (0%, backlog)**.

Correction to [`reports/02-copilotkit.md`](./reports/02-copilotkit.md): generative UI
is **not** unevaluated — it's a filed backlog item (IPI-128), currently blocked
behind the runtime restore.

| What we hand-built | Prebuilt alternative | Verdict |
|--------------------|---------------------|---------|
| Approval cards + `operatorConfirmed` flags | HITL primitives | 🔴 Replace |
| Hand-coded opening messages in every agent prompt | Suggestions | 🔴 Replace |
| `brand-context.tsx` custom provider | Readables (v2) | 🟡 Compare |
| `copilotkit-dev-infra.mjs`, `copilotkit-dev-env.mjs` (+ tests) | Standard dev setup | 🟡 Audit for over-engineering |

**Prebuilt:** [examples/](https://github.com/CopilotKit/CopilotKit/tree/main/examples)
— HITL, generative UI/state machine, shared state, Slack channel ·
[reference](https://docs.copilotkit.ai/reference)

⚠️ The bundle blocker traces straight through CopilotKit
(`@copilotkit/react-core → streamdown → mermaid/cytoscape/katex` +
`@copilotkit/web-inspector`). Any CopilotKit work should check bundle impact —
there is 0.015 MiB of headroom.

---

## 7. The plan, consolidated

### This week — clicks, not code

| # | Task | Platform | Tool | Time |
|:-:|------|----------|------|:----:|
| 1 | Branch protection on `main` | GitHub | Dashboard | 5 min |
| 2 | Stripe Sync Engine | Supabase | Dashboard | 5 min |
| 3 | Mastra observability exporter on | Mastra | 2 env vars | 15 min |
| 4 | `wrangler versions rollback` → close IPI-708 | Cloudflare | CLI | 30 min |
| 5 | Dashboard review: IPI-637/639/642 vs MediaFlows | Cloudinary | Dashboard | 30 min |
| 6 | `get_advisors` as a CI gate | Supabase | MCP | 1 hr |

**Total: under half a day.** Closes one 0% blocker, removes the single largest
process risk, and may cancel three Cloudinary tickets outright.

### Next — copy, don't write

| # | Task | Source |
|:-:|------|--------|
| 7 | Playwright preview smoke (IPI-707) | `cloudflare/templates` E2E suite |
| 8 | Bundle fix via `next/dynamic`, delete 4 stub files | Tracker already names the fix |
| 9 | Channel specs → named transformations | Cloudinary dashboard |
| 10 | Faithfulness scorer on `production-planner` | Mastra built-in |
| 11 | Firecrawl tool from the Mastra template | `mastra.ai/templates` |
| 12 | Clone the kavholm Connect demo, map to shoots | `stripe-samples` |

### Then — decisions that unblock everything

| # | Decision | Blocks |
|:-:|----------|--------|
| 13 | Does the operator app take money? | All of Stripe |
| 14 | Which `mastra_*` schema is authoritative? | 33 tables, IPI-628/629/630 |
| 15 | Cloudflare cutover: go or freeze? | A dozen hedging docs |

---

## 8. Before you open an editor

| ☐ | Check |
|:-:|-------|
| ☐ | Is there a Linear issue? Is someone on it? |
| ☐ | Is it in `tasks/<stack>/todo.md` already? |
| ☐ | Can the **dashboard** do it? |
| ☐ | Can the **CLI** do it? |
| ☐ | Can **MCP** do it? |
| ☐ | Is there an official **template or sample repo**? |
| ☐ | Would this add to the **8.985 / 9.0 MiB** bundle? |
| ☐ | Only now: write code |

---

## 9. Sources

**Cloudflare** — [templates](https://github.com/cloudflare/templates) · [workflows-starter](https://github.com/cloudflare/workflows-starter) · [Workers docs](https://developers.cloudflare.com/workers/) · [Next.js guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/) · [OpenNext](https://opennext.js.org/cloudflare/get-started) · [templates blog](https://blog.cloudflare.com/cloudflare-workers-templates/)

**Supabase** — [docs](https://supabase.com/docs) · [Next.js template](https://vercel.com/templates/next.js/supabase) · [Stripe Sync Engine](https://supabase.com/blog/stripe-sync-engine-integration) · [Stripe Wrapper](https://supabase.com/docs/guides/database/extensions/wrappers/stripe) · [next-supabase-stripe-starter](https://github.com/KolbySisk/next-supabase-stripe-starter) · [supabase-nextjs-template](https://github.com/Razikus/supabase-nextjs-template)

**Stripe** — [stripe-samples](https://github.com/stripe-samples) · [kavholm marketplace](https://github.com/stripe/stripe-demo-connect-kavholm-marketplace) · [docs](https://stripe.com/docs) · [Sessions 2026](https://stripe.com/blog/everything-we-announced-at-sessions-2026)

**Mastra** — [templates](https://mastra.ai/templates) · [Agent Builder](https://mastra.ai/agent-builder) · [docs](https://mastra.ai/docs) · [memory](https://mastra.ai/docs/memory/overview) · [Cloudflare deployer](https://mastra.ai/docs/deployment/cloud-providers/cloudflare-deployer) · [bundle issue #14494](https://github.com/mastra-ai/mastra/issues/14494) · [mastra-ai/mastra](https://github.com/mastra-ai/mastra)

**Cloudinary** — [cloudinary-examples](https://github.com/cloudinary-community/cloudinary-examples) · [cloudinary-devs](https://github.com/cloudinary-devs) · [React samples](https://cloudinary.com/documentation/react_sample_projects) · [MediaFlows](https://cloudinary.com/documentation/mediaflows_user_guide) · [EasyFlows](https://cloudinary.com/documentation/mediaflows_easyflows) · [MCP servers](https://cloudinary.com/documentation/cloudinary_llm_mcp) · [Agents](https://cloudinary.com/agents)

**CopilotKit** — [examples](https://github.com/CopilotKit/CopilotKit/tree/main/examples) · [reference](https://docs.copilotkit.ai/reference) · [docs](https://docs.copilotkit.ai/)

**Local** — `tasks/cloudflare/todo.md` (2026-07-24) · `tasks/mastra/todo.md` · `tasks/copilotkit/todo.md` · `tasks/cloudinary/todo.md` · `tasks/supabase/STATUS.md`
