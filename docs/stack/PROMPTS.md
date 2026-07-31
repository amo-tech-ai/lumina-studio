---
title: "iPix Stack Prompt Library"
version: "1.0"
lastUpdated: "2026-07-31"
purpose: "Copy-paste multistep prompts that re-verify each stack against the live app, and produce the mini-reports in ./reports/. Every prompt ends by writing its findings back to a tracked doc."
usage: "Paste one prompt per Claude session. Do not run two stack prompts in the same session — context bleed makes scores unreliable."
---

# Prompt Library

**How these are written.** Every prompt follows the same shape so results are comparable:

```
ROLE → SCOPE (files + live systems) → STEPS (numbered, verifiable) → OUTPUT (exact doc + table shape) → RULES (no guessing)
```

**The one rule in all of them:** *Never score a row without the command that produced it.*

---

## §0 — The 15-minute full re-verify (run weekly)

```
Re-verify the iPix stack scorecard in docs/stack/README.md against the live system.

1. Run these and record the raw numbers:
   - cd app && npm test                      → test count
   - npm run typecheck                        → pass/fail
   - gh run list --limit 5                    → CI state on main
2. Query Supabase project nvdlhrodvevgwdsneplk for: table count by schema, index
   count, policy count, tables with RLS enabled and zero policies, trigger count,
   realtime publication tables, vector columns.
3. Check what is deployed where: read app/wrangler.jsonc and
   services/cloudflare-worker/wrangler.jsonc. Confirm whether the operator app
   still builds for Vercel.
4. For each of the 24 rows in README.md §4, update % / dot / Verify column ONLY
   where your evidence differs from what is written. Leave unchanged rows alone.
5. Update the §1 scorecard totals and the `verifiedAt` frontmatter date.

Rules: no row changes without a command in the Verify column. If a check fails to
run, mark the row 🟡 with "unverified <date>" — never carry forward an old score
as if it were fresh.
```

---

## §1 — Mastra deep report

```
Produce a Mastra feature-adoption report for iPix. Write to
docs/stack/reports/01-mastra.md, replacing the file.

1. Inventory what we use: read app/src/mastra/{index,durable,memory,storage,
   models,agent-workflows}.ts, agents/*, tools/index.ts, workflows/*. List every
   Mastra API we call.
2. Inventory what exists: use the Mastra MCP knowledge tool (or WebSearch
   mastra.ai/docs) for the current feature surface — agents, tools, workflows,
   memory (working / semantic recall / observational), scorers, processors,
   networks, MCP client+server, task lists, Studio, Agent Builder, deployers.
3. Diff them. For every unused feature answer: would it replace custom code we
   already wrote? Name the file it would replace.
4. Review https://mastra.ai/templates and pick the 3 closest to iPix
   (fashion shoot planning, brand research, talent matching). Say what to copy.
5. Score Core % and Advanced %. Overall = Core×0.6 + Advanced×0.4.

Output: summary table at top (Feature | Available | We use | % | Dot | Replaces
which custom file), then Gaps, then a numbered "next 5 tasks" table with
estimated effort, then the source links.

Rules: every "we use X" must cite file:line. Do not claim a Mastra feature exists
without a docs link.
```

---

## §2 — CopilotKit deep report

```
Produce a CopilotKit feature-adoption report for iPix. Write to
docs/stack/reports/02-copilotkit.md.

1. Inventory usage: grep app/src for every @copilotkit import, every hook
   (useAgent, useFrontendTool, useCopilotReadable, useHumanInTheLoop,
   renderAndWaitForResponse, useCoAgent*), and every component (CopilotChat,
   CopilotSidebar, CopilotPopup, CopilotKit). Record file:line and call counts.
2. Read the reference at https://docs.copilotkit.ai/reference and the examples at
   https://github.com/CopilotKit/CopilotKit/tree/main/examples. List the feature
   surface: generative UI, shared state, HITL, suggestions, A2UI surfaces,
   channels (Slack), frontend actions, readables.
3. Critical check: iPix's whole UX principle #7 is "AI drafts, humans decide".
   Determine whether HITL is enforced by CopilotKit primitives or only by prompt
   text + custom approval cards. Cite the evidence either way.
4. Pick the 3 CopilotKit examples closest to iPix and say exactly which screen
   each maps to (/app/shoots/new, /app/brand/[id], /app/crm).
5. Score Core % and Advanced %.

Output: usage table, gap table, "3 examples to adapt" table, next-5-tasks table.

Rules: cite file:line for every usage claim. If a hook appears only in a comment,
say so explicitly — that is a finding, not a usage.
```

---

## §3 — Cloudflare migration + services report

```
Produce a Cloudflare report for iPix. Write to docs/stack/reports/03-cloudflare.md.
Load the cloudflare-workflow skill first (project rule).

1. Establish ground truth on what is live: read tasks/cloudflare/todo.md (the
   SSOT), app/wrangler.jsonc, services/cloudflare-worker/wrangler.jsonc, and the
   app build scripts. State plainly which pieces run on Cloudflare today.
2. List every configured binding and whether anything reads it at runtime
   (grep getCloudflareContext). A bind-only binding is 🟡, not 🟢.
3. Query the Cloudflare API via MCP for actual resources: workers list, D1
   databases, KV namespaces, R2 buckets, Hyperdrive configs. Compare to config.
4. Vercel → Workers migration: read
   https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/ and
   https://opennext.js.org/cloudflare/get-started. Produce a step table with the
   real blockers for THIS repo — start with worker bundle size
   (scripts/check-worker-bundle-size.mjs) and the 3 MiB free / 10 MiB paid limit.
5. Suggest additional Cloudflare services worth adopting (Workflows, Queues,
   Durable Objects, Vectorize, AI Search, Browser Rendering, Images). For each:
   which iPix problem it solves, and what custom code it deletes.
6. Cover the workflow surface: dashboard vs wrangler CLI vs MCP — say which to
   use for which task, and which is fastest.

Output: what's-live table, bindings table, migration-steps table, suggested-
services table, CLI-vs-dashboard-vs-MCP table, next-5-tasks.

Rules: do not say "Cloudflare is 0% live" — the AI Gateway Worker is production.
Do not say the app is on Workers — it is on Vercel. Cite config file lines.
```

---

## §4 — Supabase deep report

```
Produce a Supabase report for iPix. Write to docs/stack/reports/04-supabase.md.
Project id: nvdlhrodvevgwdsneplk.

1. Structure: count tables per schema, indexes, policies, triggers, functions,
   realtime publication tables, installed extensions. Use SQL, not guesses.
2. Security: run get_advisors(security) and get_advisors(performance). Group
   findings by lint name with counts. Call out every table with RLS enabled and
   zero policies BY NAME — that is a functional break, not a warning.
3. Auth: what is configured (providers, SSR client, org_members model, MFA, SSO)?
   Check app/src for @supabase/ssr usage and the org scoping pattern.
4. pgvector: list every vector column and its index. Then grep the codebase for a
   query that actually uses <=> or match_* — if none, the columns are dead weight.
   Say so.
5. Realtime: which tables are published, and which SHOULD be given the screens in
   app/src/app/(operator)? Name the screens.
6. Suggest additional Supabase features with a concrete iPix use case each:
   pg_cron, pgmq queues, Storage, Branching, Foreign Data Wrappers, Vault,
   pg_net, index_advisor.
7. Score Core % and Advanced %.

Output: structure table, security-findings table (grouped + named), auth table,
pgvector table, realtime table, suggested-features table, next-5-tasks.

Rules: name the 37 tables. A count without names is not actionable.
```

---

## §5 — Cloudinary report

```
Produce a Cloudinary report for iPix. Write to docs/stack/reports/05-cloudinary.md.

1. Inventory usage: grep app/src for next-cloudinary and the node SDK. Read the
   cloudinary_assets table shape (24 columns) and tasks/cloudinary/*.
2. Read the platform surface: https://cloudinary.com/documentation,
   https://cloudinary.com/agents, https://cloudinary.com/integrations,
   https://cloudinary.com/documentation/cloudinary_llm_mcp.
   Cover: named/responsive/AI transformations, upload presets, webhooks,
   structured metadata, MediaFlows, DAM, the 5 MCP servers, Cloudinary Agents.
3. The key question: for every piece of custom media code in this repo, is there
   a Cloudinary feature that replaces it? Name the file and the feature.
   Start with scripts/verify-cloudinary-pipeline.mjs and the upload path.
4. Assess whether Cloudinary MCP servers should be wired into our Mastra agents
   (visual-identity already screenshots → Cloudinary → vision model).
5. Score Core % and Advanced %.

Output: usage table, platform-feature table (Feature | Use for iPix | Replaces),
MCP table, next-5-tasks.

Rules: cite file:line for usage. Prefer platform feature over custom code and say
so explicitly when both exist.
```

---

## §6 — Stripe / payments report

```
Produce a payments report for iPix. Write to
docs/stack/reports/07-stripe-payments.md.

1. Establish the current state precisely: grep for stripe across app/,
   b2c-storefront/, my-marketplace/, supabase/. Report where it exists and where
   it does not. Read the payments and shoot_payments tables.
2. Decide the architectural question with a recommendation, not a survey:
   should the OPERATOR app charge for shoots, or does all money flow through the
   storefront/marketplace? Give one recommendation and the reason.
3. Supabase + Stripe: compare the Stripe Sync Engine
   (https://supabase.com/blog/stripe-sync-engine-integration) against the Stripe
   FDW Wrapper (https://supabase.com/docs/guides/database/extensions/wrappers/stripe).
   Say which fits iPix and why.
4. Web search Stripe's current feature set (Sessions 2026 onward). Filter to what
   a fashion-shoot marketplace would actually use: Connect, deposits/holds,
   Adaptive Pricing, Billing, Tax, Radar, agentic commerce. Ignore the rest.
5. List the tasks needed to launch payments, in dependency order, and flag which
   have no Linear issue today (STR-001..003 currently do not).

Output: current-state table, recommendation, sync-vs-wrapper table, relevant-
features table, ordered task table.

Rules: do not describe Stripe features we would not use. One recommendation, not
three options.
```

---

## §7 — Agents report

```
Produce an AI agent report for iPix. Write to docs/stack/reports/00-agents.md.

1. Read app/src/mastra/index.ts, durable.ts, agents/*, and lib/route-agent-map.ts.
   For each of the 9 agents record: id, display name, route that loads it, tools,
   model tier, memory, durable wrapper, workflow.
2. For each agent write a REAL use case — an actual operator sentence and the
   tool sequence it triggers. Not a description, a transcript sketch.
3. Best-practice audit against https://mastra.ai/docs/agents/overview:
   instruction quality, tool scoping, memory choice, error handling, evals.
   Score each agent 0-100 and grade it.
4. Identify the gaps that matter: no scorers, memory on 3 of 9, no agent network
   for the multi-agent handoffs the routes imply.
5. Propose the next 5 agent tasks in dependency order.

Output: summary table at top (Agent | Route | Tools | Memory | Durable | Score |
Grade | Dot), then one short section per agent with the real use case, then gaps,
then next-5-tasks.

Rules: cite file:line. If an agent has no memory, that is a finding — state
whether it needs one.
```

---

## §8 — Linear ↔ codebase verification (run in an interactive session)

> Linear MCP requires interactive approval. Run this in a normal Claude Code
> session, not a headless one.

```
Connect to Linear (team IPI) and verify the backlog against the live codebase.

1. List all non-Done issues in team IPI with: identifier, title, status, priority,
   labels, project, milestone, cycle.
2. For each issue that claims to be Done or In Review, find the code that proves
   it — file, PR number, or test. Mark each: VERIFIED / UNPROVEN / CONTRADICTED.
   An issue with no code evidence is UNPROVEN, not Done.
3. Cross-check against tasks/plan/todo.md and mvp.md: which issues are actually
   required to launch? Produce the launch-critical list in dependency order.
4. Audit the process itself:
   - Are cycles enabled and populated?
   - Do milestones exist per project and are issues attached?
   - Does every launch-critical issue carry an `mvp` and a priority label?
   - Are there issues in the markdown trackers with no Linear issue at all?
     (STR-001..003 are known examples.)
5. Propose the fix as a concrete list of Linear operations — labels to create,
   cycles to enable, issues to file — not as advice.

Output: one summary table (Issue | Title | Status | Evidence | Verdict | Launch?),
a process-gap table, and an ordered "do these in this order" table.

Rules: never mark an issue verified from its own description. Only code, PR, or a
passing test counts as evidence. Cite a bare issue number never — always pair it
with its title.
```

---

## §9 — Dev system / skills audit

```
Audit the iPix Claude Code development system. Write to
docs/stack/reports/09-dev-system.md.

1. Inventory: .claude/skills/*, .claude/agents/*, .claude/settings.json hooks,
   CLAUDE.md rules, and the scripts/ verify suite.
2. For each skill answer one question: does it PREVENT an error, or only DESCRIBE
   the right process? Prevention = a hook, a script, or a CI gate. Description
   alone is 🟡 at best.
3. Map each of the last 10 merged PRs' review comments to the skill that should
   have caught it earlier. Gaps in that mapping are the highest-value fixes.
4. Recommend where each check belongs, cheapest-first:
   editor → pre-commit hook → pre-push hook → CI → review.
   Moving a check left is the whole game.
5. Web search current Claude Code and Cursor features (hooks, subagents, skills,
   plan mode, MCP, rules) and name which would close our specific gaps.

Output: skill table (Skill | Prevents or Describes | Gap | Fix), a
check-placement table, and next-5-tasks.

Rules: "add a skill" is not a fix unless it comes with the hook or script that
enforces it.
```

---

## §10 — Docs reorganisation

```
Reorganise the iPix documentation using docs/stack/TEMPLATE.md.

1. Inventory every tracker: root *.md, docs/**, tasks/**. For each record: title,
   lastUpdated, whether it claims to be an SSOT, and whether it contradicts
   tasks/plan/todo.md.
2. Flag stale: no update in 30+ days, or self-declared stale (docs/index-docs.md
   already does). Apply the archive policy — banner + move to docs/archive/,
   never silent delete.
3. Ensure exactly ONE SSOT per concern and that every other doc links to it
   rather than restating it. Duplicated state is how the trackers drift.
4. Give every stack a todo tracker in the TEMPLATE.md shape.
5. Update docs/stack/README.md §7 doc map.

Output: inventory table (Doc | Role | Last updated | Verdict | Action), the new
tree, and the list of moves as concrete git mv commands.

Rules: docs-only PR — never mix with production files (repo hard rule).
```

---

## Prompt-writing rules for new prompts

| Rule | Why |
|------|-----|
| Number the steps | Ungrouped prose gets partially executed |
| Name the exact output file | Otherwise findings land in chat and evaporate |
| Specify the table columns | Comparable reports over time |
| Demand `file:line` citations | Kills confident guessing |
| Add one "do not" | e.g. "do not say Cloudflare is 0% live" — pre-empts the known wrong answer |
| End with next-5-tasks | A report with no next action is a essay |
| One stack per session | Context bleed makes scores unreliable |
