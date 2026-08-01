# Claude Code — Project Instructions

## Mission

**The final application is what matters.** Nothing here is fixed. Treat every doc, diagram, schema, and component as a draft that can be made better. When a change serves a better end-product UX, propose it — even if it means rethinking something already built. Ship, learn, refine.

**Rule precedence:** `ponytail` governs **code volume** (YAGNI, shortest working solution). This file governs **prose** (plain-language explanations, tables, real examples). They are not in conflict: a short diff with a clear explanation satisfies both. When a user explicitly asks for a report, walkthrough, or audit, that prose is the deliverable — not debt.

## Communication style

Ground every explanation in something concrete from this repo — a real screen, ticket, table, file, or PR — that the reader can click into or grep for. Prefer plain language, short sentences, and tables over dense prose. When a finding is technical, add a one-line plain-English translation of why it matters.

- ❌ "A reusable filter component" → ✅ "the Owner filter button on the Pipeline board (`pipeline-workspace.tsx:128`) — already built, just disabled"
- ❌ "A foreign key without proper scoping" → ✅ "like `crm_deals.company_id` — a plain FK with no org check, which is how a mismatched cross-org company slipped through in PR #337"
- ❌ "The RPC has no authorization check" → ✅ "`commit_shoot_draft` (IPI-727) trusted `p_brand_id` with zero check of its own — safe today only because its one caller already checks `brands`' RLS first"

**Every PR description gets this treatment too.** Open with a plain-English summary and a real-world analogy for what changed and why it matters, *then* the technical before/after (versions, test counts, measured numbers). The analogy is in addition to the specifics, not instead of them.

❌ "Removed unused dependency `@morphllm/morphsdk`" → ✅ "Removed a package nobody uses — like returning a toolbox that was never opened, and it happened to have a rusty nail in it (a critical CVE). 41 vulnerabilities → 40, 1 critical → 0."

**Never cite a bare issue or PR number.** Pair it with the actual title on first mention: `IPI-582 (Task Detail and Safe Mutations)`, not `IPI-582`.

## UX principles (every user-facing change)

Shift from **Create → Check → Fix** to **Guide → Prevent → Confirm** — stop mistakes before they happen.

1. Remove waiting — stream progress, never a blank spinner.
2. Remove guessing — show the spec, the target, the next step.
3. Remove repetitive work — smart defaults, never ask twice.
4. Prevent mistakes — live validation before save, not error after.
5. Always show the next step — no dead-ends.
6. Keep users in context — preview/act inline.
7. AI drafts, humans decide — every AI write is a reversible draft behind a gate.
8. One click for common tasks — buttons over typed prompts.
9. Every AI recommendation is explainable — show the why + a confidence signal.
10. Everything is undoable.

**Golden rule — proactive teammate, not a chat box.** The assistant is page-context-aware (knows the current brand/campaign/shoot/selection — the user never re-states where they are) and opens with the next best action, e.g. *"You're planning the Spring Campaign. Next: generate deliverables for IG/TikTok/Amazon/Shopify — I can do that in one click,"* never a blank *"How can I help?"*

Product "personas" (Creative Director, Brand Guardian, …) are **hats on the existing Mastra agents**, not new agents — 8 in the operator registry plus `public-marketing` for the marketing-site widget. Verify against `app/src/mastra/index.ts` + `durable.ts` before quoting a count.

## Hard rules

- **🚫 NEVER push directly to `main`.** Create a worktree branch before writing a single line: `npm run worktree:add -- IPI-NNN short-name`. Commit, push, open a PR. Even a one-line fix — pushing to `main` means no PR can be created after the fact (`head == base`).

- **🚫 NEVER mix docs and production files, or two different concerns, in one PR or commit.** One concern per PR *and* per commit — docs-only, code-only, migration-only, CI/config-only. If a change set spans two, STOP and split before staging. This is the most-enforced rule here (see PR #99 fallout); violating it is a blocking error, not a style nit.

- **Never skip the pre-push hook** (`--no-verify`). Acceptable only for docs-only commits with no production code to typecheck. Never to bypass a real failure.

- No `VITE_` env vars — Vite is retired; `src/` at the repo root is dead, do not add code there.
- `NEXT_PUBLIC_` is fine for non-sensitive client config. AI keys are **server-only** — no `NEXT_PUBLIC_*_API_KEY` for any AI service. `GEMINI_API_KEY` is used only in `app/src/mastra/` and `supabase/functions/`.
- All Gemini/AI calls go through Mastra agents or Supabase Edge Functions.

## Stack

- **Frontend/API:** Next.js (`app/`)
- **AI runtime:** Mastra (`app/src/mastra/`) — server-side only
- **Database:** Supabase (Postgres + Edge Functions)
- **Infra:** Cloudflare Workers / OpenNext — see the Cloudflare note below

## Worktrees

```bash
npm run worktree:audit                          # Step 0 — MANDATORY before every new worktree
git worktree remove <path>                      # remove every ⚪ merged / 🔴 stale row with safeToDelete ✅
npm run worktree:add -- IPI-NNN short-name      # branch + worktree off origin/main, copies .env, runs npm ci
node scripts/worktree-health.mjs                # required before working in a worktree that already existed
```

Run `worktree:add` from the repo root, never from `app/` — a relative `../` from the wrong cwd nests the worktree inside the repo. The script refuses; raw `git worktree add` will not.

Branch naming: `ipi/<issue-number>-<short-name>`. For non-IPI work use `docs/…`, `chore/…`, `fix/…` with the raw `git worktree add ../wt-name -b branch origin/main` fallback, then copy `.env` per `.worktreeinclude` and run `npm ci` yourself.

Full details: the `worktrees` skill.

## Before pushing

The pre-push hook runs `typecheck → vitest run`. Don't duplicate it:

```bash
git fetch origin main
npm test -- --changed origin/main   # only tests touching files that differ from origin/main
npm run typecheck
npm run lint -- --cache --cache-location .cache/eslint
git commit ... && git push           # hook now runs the full suite once
```

`--changed` walks the **static** import graph, so a dynamically-loaded module (path built from a variable) can be missed — fall back to the full `npm test` for config, plugin-registry, or runtime-loaded changes. Calling Vitest directly? Use `npx vitest run --changed origin/main`; `vitest --changed` alone enters watch mode.

Run the full suite manually only when the change touches shared infrastructure, you're modifying the hook itself, you're debugging a flaky test, or the task asks for a local full-suite result as evidence.

Everything else is in `app/package.json`.

## Mastra gotchas

- **Never call `getMastra()` at module top-level** in route files — only inside the handler body. Top-level calls run at import time and break the build.
- **`DATABASE_URL` at build time:** Next.js imports Mastra modules during `next build` even for `force-dynamic` routes, and `getMastraStorage()` throws if `NODE_ENV=production` and `DATABASE_URL` is unset. Guard with `&& !process.env.CI`.
- **`mastra dev` CLI** requires `export const mastra` (named export) — the Proxy pattern in `app/src/mastra/index.ts` defers `getMastra()` until first property access.
- Storage prefers `MASTRA_DATABASE_URL` (transaction pooler `:6543`) over `DATABASE_URL` (session, kept for psql/CI). Any test asserting DB-absence must stub **both**.

## Graphify

`graphify-out/graph.json` is always present. Use it to orient before reading source for architecture questions:

```bash
graphify query "<question>"   ·   graphify explain "<concept>"   ·   graphify path "<A>" "<B>"
graphify update               # after adding or moving files; stale if >10 files are newer than the graph
```

Use `ripgrep` directly for an exact known file or string, and Context7 for official library docs — graphify is for "what connects to what."

## Cloudflare

Load the `cloudflare-workflow` skill (`/cloudflare-workflow`) for **any** Cloudflare work — Workers, OpenNext, AI Gateway, Workers AI, Durable Objects, Queues, KV, Vectorize, Hyperdrive, D1, R2, bindings, deployment, or anything crossing Cloudflare + Supabase/Mastra/CopilotKit.

**Runtime split — the single most misread fact in this repo.** `tasks/cloudflare/todo.md` is the live SSOT; check it before trusting any snapshot. As of the last verification: the Next.js operator app (`ipix.co/app`) runs on **Vercel** — the OpenNext/Workers cutover has not happened. But the custom `services/cloudflare-worker/` AI Gateway Worker, though frozen for new features, is **still the only real production AI path**. So don't say "Cloudflare is 0% live" — say "the whole-app migration hasn't cut over, but the AI-gateway piece already has."

Match verification cost to real risk: don't re-run a full local production build when CI's `app-build` job already does.

## CI

Jobs live in `.github/workflows/ci.yml`. No merge to `main` without green. `gh run list --limit 5` · `gh run view <id> --log-failed`.

No job carries a path filter, deliberately — a required check gated on changed paths can go permanently "pending" on PRs that never touch it and block merges. If path filtering ever becomes necessary, use `paths-ignore` on the workflow **trigger**, never a job-level `if:`.

## Efficiency self-check

Ask "is this still the leanest way to finish this?" *while* working, especially mid-way through a long stretch — not only when asked. This does not relax "verify before asserting"; it cuts wasted motion, not rigor.

- **Will this tool's output actually get used?** Don't run an expensive lookup as due-diligence theater when a cheaper check already answers the question. (Real case: calling Supabase `get_advisors` when `verify-rls.mjs` plus a `pg_policies` query had already settled it — the advisors output was never read.)
- **Trust the harness's signals.** An Edit/Write result saying the file state is already current means don't `Read` it back.
- **Batch discovery before editing.** Grep every affected location first, plan every edit, then apply — not grep → edit → grep → edit.
- **Don't guess an ID a tool is about to hand you.** Get the real Linear/GitHub number before naming a branch after it.
- **On a transient failure** (permission block, OOM, flaky network) retry once with a plan for the second failure — not a blind repeat, not silent abandonment.

## Auto-mode config — repo-scoped rules don't work, by design

If the auto-mode classifier blocks an action, do **not** add an `autoMode` block to this repo's `.claude/settings.json` or `.claude/settings.local.json` — the classifier ignores both. Confirmed against the official docs (PR [#586](https://github.com/amo-tech-ai/lumina-studio/pull/586), closed): `autoMode` is read only from `~/.claude/settings.json`, managed/org settings, or `--settings`. This is a deliberate security boundary — a checked-in repo file could otherwise pre-authorize dangerous actions for anyone who clones it. There is no way to make it both repo-scoped and shared via git. The real fix for a recurring team-wide block is managed/org settings.

## QA test credentials

Dev/preview server always on port **3002**. Free the port rather than falling back to another.

| Field | Value |
|-------|-------|
| Email | `qa@ipix.test` |
| Password | `.env.local` (`QA_PASSWORD`) or ask the team lead |

Test-only account, no real data. Safe for browser automation, Playwright, and MCP browser tools.
