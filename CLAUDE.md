# Claude Code — Project Instructions

## Mission

**The final application is what matters.** The goal is to be innovative — nothing here is set in stone. We are constantly experimenting, improving, and raising the quality of the user experience throughout the development process. Treat every doc, diagram, schema, and component as a draft that can be made better, not a fixed contract. When a change serves a better end-product UX, propose it — even if it means rethinking something already built. Ship, learn, refine.

## Communication style — plain language, real iPix examples, every response

Every response — not just audit findings — should be easy to follow on a first read and grounded in something concrete from this repo (a real screen, ticket, table, file, or PR) instead of a generic abstraction. Prefer plain language over jargon, short sentences over long ones, and tables/checklists over dense prose. When a finding is technical, add a one-line plain-English translation of why it matters. The reader should be able to click into or grep for the real thing, not imagine a hypothetical one.

- ❌ "A reusable filter component" → ✅ "the Owner filter button on the Pipeline board (`pipeline-workspace.tsx:128`) — already built, just disabled"
- ❌ "A foreign key without proper scoping" → ✅ "like `crm_deals.company_id` — a plain FK with no org check, which is exactly how a mismatched cross-org company slipped through in PR #337"
- ❌ "Improve error handling" → ✅ "stop string-matching the server's exception text in `convert-deal.ts` — a migration wording change silently turned a 403 into a 500"
- ❌ "A screen that hasn't been built yet" → ✅ "the Planner Hub (`/app/planner`, IPI-526) — designed, zero code, 404 today"
- ❌ "The RPC has no authorization check" → ✅ "`commit_shoot_draft` (IPI-727) trusted `p_brand_id` with zero check of its own — safe today only because its one caller, `/api/shoots/commit`, already checks `brands`' RLS before invoking it"
- ❌ "A migration fixed the RLS visibility gap" → ✅ "IPI-721 swapped `brands.user_id = auth.uid()` for `is_org_member(org_id)` on `shoot_portfolio_view` — the exact line that made `qa@ipix.test`'s own shoot invisible to them moments after creating it"

**Never cite a bare issue or PR number.** `IPI-582` or `#337` means nothing to a reader without Linear/GitHub open — always pair the number with its actual title on first mention, e.g. `IPI-582 (Task Detail and Safe Mutations)` or [PR #337](https://github.com/amo-tech-ai/lumina-studio/pull/337).

Organize long outputs (todos, audits, roadmaps, verification reports) so a new team member could follow them without prior context. This applies uniformly across every kind of output — explanations, audit findings, status summaries, PR descriptions, code comments, and casual replies alike — not just formal reports.

## UX principles (apply to every user-facing change)

Shift from **Create → Check → Fix** to **Guide → Prevent → Confirm** — stop mistakes before they happen, don't just help users recover.

1. Remove waiting — stream progress, never a blank spinner.
2. Remove guessing — show the spec, the target, the next step.
3. Remove repetitive work — smart defaults, never ask for the same info twice.
4. Prevent mistakes — live validation before save, not error after.
5. Always show the next step — no surface dead-ends.
6. Keep users in context — preview/act inline, don't bounce to another page.
7. AI drafts, humans decide — every AI write is a reversible draft behind a gate.
8. One click for common tasks — buttons over typed prompts.
9. Every AI recommendation is explainable — show the why + a confidence signal.
10. Everything is undoable — no destructive AI action without a way back.

**Golden rule — proactive teammate, not a chat box.** The assistant should guide, not wait. It is page-context-aware (knows the current brand/campaign/shoot/selection — the user never re-states where they are) and opens with the next best action, e.g. *"You're planning the Spring Campaign. Next: generate deliverables for IG/TikTok/Amazon/Shopify — I can do that in one click,"* never a blank *"How can I help?"*. The product "personas" (Creative Director, Brand Guardian, etc.) are hats on the **existing Mastra agents**, not new agents — 8 registered in the operator agent registry (`production-planner`/`default`, `creative-director`, `visual-identity`, `social-discovery`, `brand-intelligence`, `model-match`, `crm-assistant`, `booking`) plus a 9th, `public-marketing`, that powers the separate public marketing-site chat widget via its own route. (Verified against `app/src/mastra/index.ts` + `durable.ts` 2026-07-18 — previously miscounted as "5" here.)

## Skills in use

| Trigger | Skill | What it does |
|---|---|---|
| `/lean` | `lean` | Dev speed audit — scores repo, finds bottlenecks, gives ranked fixes |
| `/graphify` | `graphify` | Build/query knowledge graph for code exploration |
| `/ponytail` | `ponytail` | Enforce lean code — shortest working solution, no speculative abstractions |
| `/cloudflare` | `cloudflare-workflow` | 8-stage accuracy gate for all Cloudflare-related work — Workers, OpenNext, AI Gateway, OAuth, runtime integration |

## Plugins in use

10 plugins installed (user scope, `claude plugin list` to confirm). What each is actually for:

| Plugin | Provides | Use when |
|---|---|---|
| `ponytail` | `/ponytail`, `/ponytail-review`, `/ponytail-audit`, `/ponytail-debt`, `/ponytail-gain` | Every coding task (write/refactor/fix) — YAGNI ("You Aren't Gonna Need It"), shortest working solution. `-review` for a diff, `-audit` for a whole-repo sweep, `-debt` to collect deferred `ponytail:` shortcut comments |
| `pr-review-toolkit` | `/review-pr` + 6 subagents (code-reviewer, code-simplifier, comment-analyzer, pr-test-analyzer, silent-failure-hunter, type-design-analyzer) | Comprehensive pre-merge PR review — style, error-handling, test coverage, type design, comment rot, in one pass |
| `code-review` | `/code-review` (plugin's own) | See "Overlaps" below before reaching for this one |
| `supabase` | `supabase` + `supabase-postgres-best-practices` skills | Generic Postgres/Supabase patterns *not* already covered by this repo's own `ipix-supabase` skill — see "Overlaps" |
| `cloudinary` | `cloudinary-docs`, `cloudinary-transformations` | Narrow doc lookups / debugging a transformation URL — the project's own `cloudinary` skill is still the primary hub for asset/photography work here |
| `codspeed` | `codspeed-optimize`, `codspeed-setup-harness` | Only after benchmarks exist — repo has no `codspeed.yml` yet, so `-setup-harness` comes first, `-optimize` has nothing to act on until then |
| `github` | GitHub Copilot MCP (Model Context Protocol) server (issues/PRs as structured tool calls) | Prefer over shell `gh` output-parsing when you need structured JSON back. **Needs `GITHUB_PERSONAL_ACCESS_TOKEN` set + reload before it does anything** |
| `playwright` | Raw browser-automation MCP tools (navigate, click, snapshot, network requests) | Scripted end-to-end flows / QA runs — see "Overlaps" below |
| `chrome-devtools-mcp` | Guided skills: `a11y-debugging`, `debug-optimize-lcp`, `memory-leak-debugging`, `troubleshooting`, general `chrome-devtools` | Diagnosing a *specific* problem (accessibility, LCP (Largest Contentful Paint)/Core Web Vitals, memory leak) — these are playbooks, not just tool access |
| `claude-code-setup` | `claude-automation-recommender` | "What Claude Code tooling should this repo have" — periodic setup audits, not day-to-day work |

### Overlaps — pick one, don't run all

- **PR/code review — repo commands + plugins:**
  - **Orchestrator:** `/pr` (`.claude/commands/pr.md`) — auto-detect; ask before commit
  - **Before PR (author):** `/pr new` or `/review-pr` + `@pr-review-loop`
  - **After PR feedback:** `/pr fix` → `/pr ship` · `/pr resolve` · `/pr ready`
  - **Plugin breadth:** `pr-review-toolkit`'s `/review-pr` (6 subagents) — use for comprehensive pre-merge pass; repo command adds iPix path→agent matrix
  - **Bot findings:** Cursor Bugbot on PR — not a substitute for pre-PR `/review-pr`
  - **Default workflow:**
    1. Run repo `/review-pr` before `gh pr create`
    2. Run plugin `/review-pr all` before marking ready
    3. Use `@pr-fix` after bots comment
- **Supabase guidance — repo-specific skill wins:**
  Use `ipix-supabase` first. It knows this project's actual schema, RLS (Row-Level Security) conventions, and remote-only policy.
  The `supabase` plugin's two skills are generic Postgres/Supabase knowledge.
  Fall back to them only for patterns `ipix-supabase` doesn't cover.
- **Browser automation — 3 surfaces now exist:**
  The already-connected `chrome-devtools` MCP server.
  `chrome-devtools-mcp`'s guided skills.
  `playwright`'s raw MCP tools.
  Use `chrome-devtools-mcp` skills when diagnosing a named problem (a11y, LCP/memory leaks).
  Use `playwright` for scripted multi-step QA flows.
  Do not invoke more than one for the same task.

## Guiding principle — continuous improvement

We are in active development. Always leave the system better than you found it: when working in an area, look for the highest-leverage improvement to the **current** setup and surface it — even if the thing already "ships." "Already built" is not "finished."

- Bias toward improving what exists over adding new surface area. Prefer wiring two shipped-but-disconnected pieces together (e.g. specs → plan) over net-new features.
- Rank improvements by payoff per unit effort, not by how impressive they sound. Name the single highest-leverage next move.
- This does **not** override the one-concern-per-PR rule below. Spot an out-of-scope improvement → log it / flag it as its own task, don't bolt it onto the current change.

## Hard rules

- **🚫 NEVER push code directly to `main`.** Before writing a single line of code, create a worktree branch: `npm run worktree:add -- IPI-NNN short-name` (preferred — see Worktree workflow below) or `git worktree add ../wt-ipi-NNN-short-name -b ipi/NNN-short-name` as a fallback. Commit on the branch, push, open a PR with `gh pr create`. Even a one-line fix. Pushing direct to `main` means no PR can be created after the fact (`head == base` error). No exceptions.

- **🚫 NEVER mix docs and production files in one PR or commit. NEVER mix two different tasks/concerns in one PR or commit. EVER.** One concern per PR *and* per commit — docs-only, code-only, migration-only, CI/config-only, each separate. If a change set spans docs + code (or two tasks), STOP and split before staging. This is the most-enforced rule here (see PR #99 fallout); violating it is a blocking error, not a style nit.

- No `VITE_` env vars — Vite is retired.
- `NEXT_PUBLIC_` is fine for non-sensitive client config (e.g. `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
- AI keys are server-only — no `NEXT_PUBLIC_GEMINI_*`, no `NEXT_PUBLIC_*_API_KEY` for any AI service.
- All Gemini/AI calls go through Mastra agents or Supabase Edge Functions (server-side only).
- `GEMINI_API_KEY` is server-only — used exclusively in `app/src/mastra/` and `supabase/functions/`.
- **Never skip the pre-push hook** (`--no-verify`). If it fails, fix the underlying issue — don't bypass it.

## Graphify — mandatory before reading source files

`graphify-out/graph.json` is always present. Before reading any source file:

```bash
graphify query "<question>"    # scoped subgraph around a question
graphify explain "<concept>"   # explain a module or pattern
graphify path "<A>" "<B>"      # dependency path between two files
```

Only read raw files after graphify has oriented you, or to edit specific lines.

**Keep the graph fresh** — after adding or moving files, run:
```bash
graphify update
```
If >10 files are newer than `graphify-out/graph.json`, the graph is stale. Rebuild before querying.

## Worktree workflow (required for every task)

**Step 0 — clean up stale worktrees before creating a new one, every time:**

```bash
npm run worktree:audit
```

Any row marked ⚪ merged or 🔴 stale with `safeToDelete ✅` → remove it now, before running `git worktree add` for the new task:

```bash
git worktree remove <path>
```

This is not the same as the periodic "weekly ritual" in `.claude/commands/worktree.md` — it's a mandatory pre-check for *this* task, every time, not a background chore. Evidence this is a real failure mode, not a hypothetical: a single session on IPI-536 created `wt-ipi-536-foundation` (implementation) and later `wt-ipi-536-qa` (QA pass) without removing the first once its PR merged — two worktrees open for one ticket, unbounded growth across a long session if repeated.

```bash
# 1. Create branch + worktree before any code change — preferred: the repo script
npm run worktree:add -- IPI-NNN short-name
# Wraps scripts/worktree-add.mjs: creates the branch (ipi/NNN-short-name) + worktree
# (../wt-ipi-NNN-short-name) off origin/main, copies .env/.env.local per
# .worktreeinclude, and runs npm ci — one command instead of three manual steps.
# IMPORTANT: run this from the main /home/sk/ipix checkout, not from app/ or any
# other subdirectory — a relative `../` from the wrong cwd nests the new worktree
# inside the repo instead of as a sibling (the script itself refuses to do this;
# raw `git worktree add` will not stop you).

# Fallback (script failure, or a branch that doesn't fit ipi/NNN-slug, e.g. docs/... or fix/...):
git worktree add ../wt-ipi-NNN-short-name -b ipi/NNN-short-name origin/main
# then copy .env manually per .worktreeinclude and run npm ci yourself.

# 2. Work, commit, push
cd ../wt-ipi-NNN-short-name
# ... make changes ...
git add <files> && git commit -m "feat(ipi-NNN): ..."
git push -u origin ipi/NNN-short-name

# 3. Open PR — include "Fixes IPI-NNN" in the body so Linear's GitHub integration
#    auto-links the PR (confirm the GitHub app is installed on amo-tech-ai/lumina-studio
#    first if relying on this). Whether merge also auto-closes the issue depends on
#    the team's configured GitHub automation in Linear settings — don't assume it
#    always does. If this PR has a separate follow-up ticket, reference it as
#    "Related to IPI-MMM" (non-closing magic word) on its own line — never "Fixes" —
#    so merging this PR can't accidentally close the follow-up.
gh pr create --title "..." --body "Fixes IPI-NNN
Related to IPI-MMM

..."

# 4. Clean up after merge
git worktree remove ../wt-ipi-NNN-short-name
```

**Branch naming:** `ipi/<issue-number>-<short-name>` — e.g. `ipi/130-brand-agent`

## Worktree health gate (required before starting work in an existing worktree)

Before writing code in a worktree that already existed (i.e. not one you just created), run:

```bash
node scripts/worktree-health.mjs
```

IPI (Internal Project Issue) is this repo's Linear issue-ID prefix — e.g. IPI-428 below.

This fails (non-zero exit) for either documented reason below, or if an underlying check itself fails (`git fetch`, ahead/behind computation, or reading `provider.ts`) — any such failure is treated as unsafe rather than silently passing:

- **`app/src/lib/ai/provider.ts` still has the pre-IPI-428 static JSON import** (`"../../../../config/groq-models.json"`). This breaks `next build`/`next dev`. Never re-patch it locally — rebase onto `origin/main`, where it's already fixed.
- **The worktree is more than 30 commits behind `origin/main`** (`--max-behind=N` to override). Local state is too stale to trust. Run `git fetch origin && git rebase origin/main` first.

Two related commands, two different purposes:

- `npm run worktree:health:all` — audit every registered worktree at once. For cleanup, not for gating a single task.
- `npm run worktree:audit -- --write` — full human-facing worktree inventory report.

`worktree-health` is the fast machine-facing gate. `worktree-audit` is the periodic cleanup report.

## Pre-push hook (active)

A pre-push git hook runs automatically on every `git push`:

```bash
typecheck (tsc --noEmit) → tests (vitest run)
```

If it fails, fix the root cause. `--no-verify` is only acceptable for **docs-only commits** where there is no production code to typecheck (e.g. no `node_modules` in a fresh worktree). Never use it to bypass a real code failure.

**Switch to full gate** (before merge): `cp .git/hooks/pre-push-full .git/hooks/pre-push`

Full gate adds `npm run build` (~5min). Use before opening a PR.

**Before pushing — don't duplicate the hook.** Run focused checks, then let the hook run the full suite once:

```bash
git fetch origin main
npm test -- --changed origin/main   # runs only tests touching files that differ from origin/main
npm run typecheck
npm run lint
git commit ... && git push          # pre-push hook now runs typecheck + full test suite once
```

Don't also run the full `npm test` manually right before pushing — the hook runs the identical thing seconds later. Run the full suite manually (in addition to the hook) only when: the change touches shared infrastructure, you're modifying the pre-push hook itself, you're debugging a flaky test, you're assembling final evidence before a `--no-verify` bypass, or the task explicitly asks for a local full-suite result as evidence.

## Mastra — known gotchas

- **`DATABASE_URL` at build time:** Next.js imports Mastra modules during `next build` even for `force-dynamic` routes. `getMastraStorage()` throws if `NODE_ENV=production` and `DATABASE_URL` is unset. Fix: guard with `&& !process.env.CI` so the no-op stub is used during CI builds.
- **Never call `getMastra()` at module top-level** in route files — only inside the handler body. Top-level calls run at import time and break the build.
- **`mastra dev` CLI** requires `export const mastra` (named export). Use the Proxy pattern in `app/src/mastra/index.ts` — it defers `getMastra()` until first property access.

## Key scripts (app/)

```bash
npm run typecheck                                   # tsc --noEmit (~15s) — already incremental (tsconfig.json)
npm test                                            # vitest run (~30s)
git fetch origin main && npm test -- --changed origin/main  # only tests touching files that differ from origin/main
npm run build                                       # next build (~2-3min)
npm run lint                                        # eslint
npm run lint -- --cache --cache-location .cache/eslint  # skips files unchanged since the last cached run
npm run dev                                         # next dev --turbopack + mastra dev
```

`--changed` walks the static import graph via `vitest run` (the `test` script already runs in `run` mode, not watch) — a dynamically-loaded module (path built from a variable, not a literal import) can be missed, so fall back to the full `npm test` for config/plugin-registry/runtime-loaded changes. `git fetch origin main` first so the diff target is current. Calling Vitest directly instead of via `npm test`? Use `npx vitest run --changed origin/main` — `vitest --changed` alone (no `run`) enters watch mode.

`--cache-location .cache/eslint` needs `.cache/` added to `.gitignore`. Local-dev speedup only — GitHub Actions runners are ephemeral, so this cache doesn't help CI unless the directory is deliberately persisted with an Actions cache step.

## Stack

- **Frontend/API:** Next.js (`app/`) — Vite (`src/`) is retired, do not add code there
- **AI runtime:** Mastra (`app/src/mastra/`) — all AI calls are server-side only
- **Database:** Supabase (Postgres + Edge Functions)

## CI — GitHub Actions

- 2 parallel jobs: `supabase-web015` (Docker RLS tests), `app-build` (Next.js lint + build + typecheck + test)
- Workflow: `.github/workflows/ci.yml`
- No merge to main without all green

**Check CI status:**
```bash
gh run list --limit 5          # see recent runs
gh run view <id> --log-failed  # debug a failure
```

## Cloudflare / infrastructure task workflow

For **any** Cloudflare-related task (Workers, OpenNext, AI Gateway, Workers AI, Durable Objects,
Queues, KV, Vectorize, Hyperdrive, D1, R2, Workflows, AI provider integrations, CopilotKit,
Mastra wiring, OAuth/runtime compatibility, deployment, CI/CD, security), load the `cloudflare-workflow` skill
via `/cloudflare` or use it proactively when touching `services/cloudflare-worker/`, OpenNext builds, or
runtime integration paths. It enforces an 8-stage accuracy-first gate:
scope verification → evidence collection → focused implementation → right-sized testing → runtime
verification → documentation verification → architecture review → production readiness, with a
standard reporting table and closing quality gates.

Key discipline: match verification cost to actual risk — don't re-run a full local production
build on every change when CI's `app-build` job already does, and prefer Cloudflare's own
gradual-deployment/rollback/observability tooling over exhaustive pre-merge local verification
where it applies (see the skill's verification checklist for right-sizing guidance).

**Current production runtime (verified 2026-07-18, corrected 2026-07-18 pass 2 — see
`tasks/cloudflare/todo.md` as the live SSOT before trusting this snapshot):** the Next.js
operator app itself (`ipix.co/app`) runs on **Vercel** — the OpenNext/Workers migration is
scaffolded but not yet cut over (no `routes` binding for `ipix.co` in `app/wrangler.jsonc`;
`IPI-472`/`IPI-606` still In Progress, `IPI-631` DNS cutover still Backlog). **But the custom
`services/cloudflare-worker/` AI Gateway Worker is NOT idle** — despite being frozen for further
feature investment (2026-07-14 decision, no new work planned), it is explicitly documented as
**"still the only real production AI path today"** (`tasks/cloudflare/todo.md`), 98/98 tests
passing, still deployed. The dashboard-configured native `ipix-prod` AI Gateway is provisioned as
its eventual replacement but has zero production traffic yet (`IPI-586` still Todo). So: the app
is on Vercel, but Cloudflare is already carrying real production AI traffic today via the frozen
custom Worker — don't say "Cloudflare is 0% live," say "the whole-app migration hasn't cut over,
but the AI-gateway piece already has."

## QA test credentials

For automated browser testing (`npm run dev` on port 3002):

| Field | Value |
|-------|-------|
| Email | `qa@ipix.test` |
| Password | See `.env.local` (`QA_PASSWORD`) or ask the team lead |

These are test-only accounts with no real data. Safe to use in browser automation, Playwright, and MCP browser tools.
