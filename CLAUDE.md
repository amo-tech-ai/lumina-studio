# Claude Code — Project Instructions

## Mission

**The final application is what matters.** The goal is to be innovative — nothing here is set in stone. We are constantly experimenting, improving, and raising the quality of the user experience throughout the development process. Treat every doc, diagram, schema, and component as a draft that can be made better, not a fixed contract. When a change serves a better end-product UX, propose it — even if it means rethinking something already built. Ship, learn, refine.

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

**Golden rule — proactive teammate, not a chat box.** The assistant should guide, not wait. It is page-context-aware (knows the current brand/campaign/shoot/selection — the user never re-states where they are) and opens with the next best action, e.g. *"You're planning the Spring Campaign. Next: generate deliverables for IG/TikTok/Amazon/Shopify — I can do that in one click,"* never a blank *"How can I help?"*. The product "personas" (Creative Director, Brand Guardian, etc.) are hats on the **existing 5 agents**, not new agents.

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
  - **Before PR (author):** `/pr new` or `/review-pr` + `@pr-workflow`
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

- **🚫 NEVER push code directly to `main`.** Before writing a single line of code, create a worktree branch: `git worktree add ../wt-ipi-NNN -b ipi/NNN-name`. Commit on the branch, push, open a PR with `gh pr create`. Even a one-line fix. Pushing direct to `main` means no PR can be created after the fact (`head == base` error). No exceptions.

- **🚫 NEVER mix docs and production files in one PR or commit. NEVER mix two different tasks/concerns in one PR or commit. EVER.** One concern per PR *and* per commit — docs-only, code-only, migration-only, CI/config-only, each separate. If a change set spans docs + code (or two tasks), STOP and split before staging. This is the most-enforced rule here (see PR #99 fallout); violating it is a blocking error, not a style nit.

- No `VITE_` env vars — Vite is retired.
- `NEXT_PUBLIC_` is fine for non-sensitive client config (e.g. `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
- AI keys are server-only — no `NEXT_PUBLIC_GEMINI_*`, no `NEXT_PUBLIC_*_API_KEY` for any AI service.
- All Gemini/AI calls go through Mastra agents or Supabase Edge Functions (server-side only).
- `GEMINI_API_KEY` is server-only — used exclusively in `app/src/mastra/` and `supabase/functions/`.
- **Never skip the pre-push hook** (`--no-verify`). If it fails, fix the underlying issue — don't bypass it.

- **Run `/review-pr all` before `gh pr create`.**
- Typecheck/lint/tests miss silent-failure patterns.
- `/review-pr` Critical/Important findings block merge.
- IPI (Internal Project Issue) is this repo's Linear issue-ID prefix.
- [IPI-536](https://linear.app/amo100/issue/IPI-536) — 5 bugs found post-merge after skipping `/review-pr`.

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

```bash
# 1. Create branch + worktree before any code change
git worktree add ../wt-ipi-NNN -b ipi/NNN-short-name

# 2. Copy .env (untracked files don't transfer automatically)
#    .worktreeinclude at repo root handles this automatically for listed files.
#    Check it includes .env and .env.local.

# 3. Work, commit, push
cd ../wt-ipi-NNN
# ... make changes ...
git add <files> && git commit -m "feat(ipi-NNN): ..."
git push -u origin ipi/NNN-short-name

# 4. Open PR
gh pr create --title "..." --body "..."

# 5. Clean up after merge
git worktree remove ../wt-ipi-NNN
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

## Mastra — known gotchas

- **`DATABASE_URL` at build time:** Next.js imports Mastra modules during `next build` even for `force-dynamic` routes. `getMastraStorage()` throws if `NODE_ENV=production` and `DATABASE_URL` is unset. Fix: guard with `&& !process.env.CI` so the no-op stub is used during CI builds.
- **Never call `getMastra()` at module top-level** in route files — only inside the handler body. Top-level calls run at import time and break the build.
- **`mastra dev` CLI** requires `export const mastra` (named export). Use the Proxy pattern in `app/src/mastra/index.ts` — it defers `getMastra()` until first property access.

## Key scripts (app/)

```bash
npm run typecheck   # tsc --noEmit (~15s)
npm test            # vitest run (~30s)
npm run build       # next build (~2-3min)
npm run lint        # eslint
npm run dev         # next dev --turbopack + mastra dev
```

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

## QA test credentials

For automated browser testing (`npm run dev` on port 3002):

| Field | Value |
|-------|-------|
| Email | `qa@ipix.test` |
| Password | See `.env.local` (`QA_PASSWORD`) or ask the team lead |

These are test-only accounts with no real data. Safe to use in browser automation, Playwright, and MCP browser tools.
