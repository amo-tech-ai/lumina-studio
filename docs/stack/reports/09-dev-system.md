---
title: "Development System — Claude Code, Skills, Hooks, Agents"
version: "1.0"
lastUpdated: "2026-07-31"
status: Active
purpose: "Whether our AI development setup prevents errors or only describes how to avoid them, and where each check belongs."
ssot: ../../../CLAUDE.md
verifiedAgainst: ".claude/skills (46) · .claude/agents (5) · .claude/hooks (4) · .claude/settings.json · CLAUDE.md · scripts/"
verifiedAt: "2026-07-31"
scores: { core: 55, advanced: 30, overall: 45 }
---

# Dev System — 45/100 (C−) 🟡

**One-line problem:** 46 skills describe the right process. 4 hooks actually stop
you doing the wrong thing. The ratio is backwards.

---

## 1. Inventory

| Layer | Count | Enforcement |
|-------|------:|-------------|
| Skills (`.claude/skills/`) | **46** | Advisory — loaded on demand |
| Subagents (`.claude/agents/`) | 5 | Advisory — invoked manually |
| Claude hooks (`.claude/hooks/`) | **4** | **Blocking** |
| Verify scripts (`scripts/`) | ~16 | Blocking when run |
| CI workflows | 9 files, 23 jobs | **Blocking on merge** |
| Pre-push hook | 1 | **Blocking** — `typecheck → vitest run` |
| ESLint rules | incl. CopilotKit v1 guard | **Blocking** |

### The 4 hooks that actually prevent errors

| Hook | Trigger | Prevents |
|------|---------|----------|
| `guard-protected-writes.sh` | Edit/Write | Writing to protected paths |
| `shared-fn-advisory.sh` | Edit/Write | Duplicating a shared function |
| `block-local-supabase.sh` | Bash | Running against a local Supabase when linked is intended |
| `verify-before-stop.sh` | Stop | Ending a turn without verifying |

These four are the most valuable part of the setup — they are the only things that
fire without someone remembering to invoke them.

### The 5 subagents

| Agent | Catches | Enforced? |
|-------|---------|:---------:|
| `rls-policy-auditor` | Bad RLS policies | ❌ manual |
| `migration-reviewer` | Unsafe migrations | ❌ manual |
| `mastra-agent-reviewer` | Mastra gotchas | ❌ manual |
| `copilotkit-v1-guard` | v1 imports ESLint misses | 🟡 partly via ESLint |
| `vite-drift-auditor` | New code in dead `src/` | ❌ manual |
| `api-documenter` | Undocumented routes | ❌ manual |

**Four of these describe conditions a CI job could assert.** `vite-drift-auditor`
is the clearest: "did this PR add files under root `src/`?" is a two-line `git
diff` check, not a judgement call.

---

## 2. Prevents vs describes

| Skill / rule | Prevents | Describes | Gap |
|--------------|:--------:|:---------:|-----|
| Pre-push hook (typecheck + tests) | ✅ | | — |
| ESLint CopilotKit v1 guard | ✅ | | — |
| `block-local-supabase.sh` | ✅ | | — |
| `guard-protected-writes.sh` | ✅ | | — |
| "Never push to `main`" | | ✅ | No branch-protection check locally |
| "Never mix docs and code in one PR" | | ✅ | **Most-enforced rule in CLAUDE.md, zero automation** |
| "Never call `getMastra()` at module top-level" | | ✅ | Lint rule would catch it |
| "No `NEXT_PUBLIC_*_API_KEY`" | 🟡 | ✅ | `check:env` exists — not in CI |
| `worktree:audit` before new worktree | | ✅ | Human memory |
| `rls-policy-auditor` | | ✅ | Could gate on migrations touching `create policy` |
| `vite-drift-auditor` | | ✅ | Could be a `git diff` CI check |

**The docs/code mixing rule is the sharpest example.** `CLAUDE.md` calls it *"the
most-enforced rule here (see PR #99 fallout); violating it is a blocking error, not
a style nit."* It is enforced entirely by reading the instruction and remembering.
A CI job that fails when a PR touches both `docs/**` and `app/src/**` is about
eight lines of YAML.

---

## 3. Move checks left

Cost of catching a bug, cheapest first:

| Stage | Cost | What belongs here | What's there now |
|-------|:----:|-------------------|------------------|
| **Editor / hook** | ~0 | Protected paths, shared-fn dupes, local-Supabase | ✅ 4 hooks |
| **Pre-commit** | seconds | Lint changed files, `check:env`, docs/code mix | ❌ **nothing** |
| **Pre-push** | ~1 min | typecheck + full vitest | ✅ |
| **CI** | ~10 min | build, e2e, RLS, edge inventory | ✅ 23 jobs |
| **Review** | hours | Architecture, UX, naming | ✅ PR-Agent + humans |

**The pre-commit stage is empty.** That's the single biggest structural gap: every
cheap mechanical check currently waits for pre-push (slow) or CI (slower).

Three checks that belong there and cost seconds:

| Check | Implementation |
|-------|----------------|
| Docs/code mix | `git diff --cached --name-only` → fail if it spans `docs/` and `app/src/` |
| No `NEXT_PUBLIC_*_API_KEY` | `npm run check:env` |
| Lint changed files only | `eslint --cache $(git diff --cached --name-only)` |

---

## 4. Skill quality — improvements

| Issue | Example | Fix |
|-------|---------|-----|
| **46 skills, no routing test** | Which fires for "fix the brand DNA score"? `ipix`, `ipix-supabase`, `graphify`, `mastra` all plausibly match | Write 10 canonical prompts, assert which skill loads |
| **Advice without a command** | Skills say "verify before asserting" | Every skill should end with the exact command that verifies its domain |
| **Overlapping scope** | `nextjs-16` + `nextjs-developer`; `cloudflare` + `cloudflare-workflow` + `cloudflare-workers-testing` | Merge or make the split explicit in the description |
| **No skill catches its own failure mode** | `mastra` skill doesn't warn about top-level `getMastra()` | Each skill lists its top-3 known errors and how to detect them |
| **Archive folder inside skills** | `.claude/skills/archive` | Move out — it's loadable context nobody wants |

---

## 5. Additional Claude Code / Cursor features to adopt

| Feature | Closes which gap | Priority |
|---------|------------------|:--------:|
| **More PreToolUse hooks** | Docs/code mix; `main` push; `--no-verify` | 🔴 High |
| **PostToolUse hook** | Auto-run `check:env` after any `.env`/config edit | 🟡 Med |
| **Plan mode by default for multi-file work** | Prevents 200-line diffs from a one-line ask | 🟡 Med |
| **Subagents in CI** (headless) | `rls-policy-auditor` gates migration PRs automatically | 🔴 High |
| **Cursor rules mirroring `CLAUDE.md`** | Cursor users bypass every rule today | 🟡 Med |
| **MCP-first policy** | Cloudflare + Supabase MCP before writing custom scripts | 🟡 Med |
| **`/lean` on a schedule** | Catches repo bloat before it's painful | 🟢 Low |

---

## 6. What tests to run, and when

| When | Run | Why |
|------|-----|-----|
| While editing | Nothing — hooks handle it | Speed |
| Pre-commit | `check:env`, lint changed, docs/code-mix guard | Seconds |
| Pre-push | `typecheck` + `vitest run` (existing hook) | Catches 90% |
| Migration PR | `supabase:verify-rls` + `rls-policy-auditor` | RLS is the highest-blast-radius change |
| Mastra PR | `npm test` full — `--changed` misses dynamic imports | Registry is runtime-loaded |
| Edge function PR | `supabase:verify-edge-unit` (Deno) | Different runtime |
| Cloudflare PR | `check:worker-bundle` + `cf-typegen` | Bundle limit is a hard fail |
| UI PR | Playwright on the changed route | Design parity |
| Pre-launch | Everything + `supabase:verify-brand-intelligence` | Full integration |

⚠️ `CLAUDE.md` already warns that `npm test -- --changed` walks the **static**
import graph, so runtime-loaded modules get skipped. Any Mastra registry change
needs the full suite.

---

## 7. Progress tracker

| ID | Task | | % | Examine | Verify | Blocker |
|----|------|:-:|--:|---------|--------|---------|
| DV-01 | Pre-push hook | 🟢 | 90 | `typecheck → vitest` | `git push` | — |
| DV-02 | Claude hooks | 🟢 | 75 | `.claude/hooks/` (4) | trigger one | — |
| DV-03 | Pre-commit stage | ⚪ | 0 | — | — | **empty** |
| DV-04 | Docs/code-mix guard | ⚪ | 0 | `CLAUDE.md` rule | — | manual only |
| DV-05 | Subagents in CI | ⚪ | 0 | `.claude/agents/` (5) | — | manual only |
| DV-06 | Skill routing tests | ⚪ | 0 | 46 skills | — | not scoped |
| DV-07 | `check:env` in CI | 🔴 | 20 | `scripts/check-client-env.mjs` | `npm run check:env` | not wired |
| DV-08 | Cursor rules parity | ⚪ | 0 | — | — | not scoped |
| DV-09 | CI suite | 🟢 | 85 | 23 jobs | `gh run list` | — |

---

## 8. Next 5 tasks

| # | Task | Effort | Why |
|:-:|------|:------:|-----|
| 1 | Pre-commit hook: docs/code-mix + `check:env` + lint-changed | S | Fills the empty stage; automates the most-enforced rule |
| 2 | Run `rls-policy-auditor` + `migration-reviewer` in CI on migration PRs | M | Highest blast radius, currently manual |
| 3 | Convert `vite-drift-auditor` to a `git diff` CI check | S | It's a mechanical rule, not a judgement |
| 4 | Skill routing test — 10 prompts, assert the loaded skill | M | 46 skills with no routing evidence |
| 5 | Mirror `CLAUDE.md` hard rules into Cursor rules | S | Cursor users bypass all of it today |

---

## 9. Sources

- Local: `CLAUDE.md` · `.claude/skills/` (46) · `.claude/agents/` (5) · `.claude/hooks/` (4) · `.claude/settings.json`
- [Claude Code docs](https://code.claude.com/docs) · skills: `lean`, `pr-workflow`, `ipix-task-lifecycle`
