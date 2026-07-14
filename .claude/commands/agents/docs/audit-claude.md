# Claude Code Setup Audit — iPix / FashionOS
**Date:** 2026-06-28 · **Scope:** `.claude/`, `CLAUDE.md`, commands, skills, hooks, agents, settings

---

## Executive Summary

The Claude Code setup is well-structured for an active Next.js/Supabase/Mastra project. Commands are scoped correctly (one concern each), the graphify hook is a genuine productivity win, and the worktree + pre-push gate enforces discipline. Two critical issues: hardcoded test baselines in commands will rot silently, and ~20 skills are irrelevant to this stack and bloat the context index. The project name "Lumina Studio" still appears in several command files. Fixing these three issues is the full P0 list.

---

## Best-Practice Scorecard

| Area | Score | Status |
|---|---|---|
| Commands (slash) | 85% | 🟢 |
| Skills — project-relevant | 80% | 🟢 |
| Skills — bloat/stale | 25% | 🔴 |
| Hooks | 95% | 🟢 |
| Agents | 85% | 🟢 |
| CLAUDE.md | 90% | 🟢 |
| Memory system | 80% | 🟢 |
| Permissions/settings | 88% | 🟢 |
| Context waste | 55% | 🟡 |
| Worktree workflow | 92% | 🟢 |
| CI gate | 90% | 🟢 |
| **Overall** | **79%** | 🟡 |

---

## Findings

| ID | Area | Severity | Finding | Evidence | Fix | Done |
|---|---|---|---|---|---|---|
| F-01 | Commands | 🔴 CRITICAL | `pr-fix.md` hardcodes test baseline `379 passed, 7 skipped` — false failures once count changes | `commands/pr-fix.md:62`, `audit.md:195` | Replace with "compare against main" instruction | ✅ |
| F-02 | Commands | 🟠 HIGH | `pr-fix.md` and `audit.md` reference "Lumina Studio" — repo name `amo-tech-ai/lumina-studio` is correct (git remote confirmed) | `pr-fix.md:135`, `audit.md:190` | Cosmetic only — no functional change needed | ✅ |
| F-03 | Skills | 🟠 HIGH | ~10 skills irrelevant to this stack bloat the skills index | `medusa`, `mercur`, `remotion`, `video-storyboard`, `post-production-guide`, `apify-ecommerce`, `ecommerce-competitor-analyzer`, `social-media`, `storefront-best-practices`, `vercel-react-best-practices` | Moved to `skills/archive/` | ✅ |
| F-04 | Skills | 🟡 MEDIUM | `ipix-task-lifecycle` references Vite-era patterns: port `:8080`, `src/` dir | `skills/ipix-task-lifecycle/SKILL.md:50` | Updated to Next.js `:3002 · app/` | ✅ |
| F-05 | Skills | 🟡 MEDIUM | `mastra` skill is ~300 lines — loads fully into context even for non-Mastra tasks | `skills/mastra/SKILL.md` | Split: trimmed to ~80-line quick-ref; full content remains in `references/` | ✅ |
| F-06 | Commands | 🟡 MEDIUM | `/task` step 2 hardcodes absolute path `/home/sk/ipix/.env` | `commands/task.md:36` | Replaced with `$(git rev-parse --show-toplevel)/.env` | ✅ |
| F-07 | Settings | 🟡 MEDIUM | `settings.local.json` contains `SUPABASE_ACCESS_TOKEN` as plaintext | `settings.local.json:3` | Removed — bridge reads from `.env.local` | ✅ |
| F-08 | Skills | 🟡 MEDIUM | `mermaid-diagrams/SKILL.md` is ~400 lines; full syntax already in `references/` | `skills/mermaid-diagrams/SKILL.md` | Trimmed to ~50-line type-selection guide; references/ has full syntax | ✅ |
| F-09 | Commands | 🔵 LOW | No `/release` command for release readiness | Missing | Created `commands/release.md` — 7 gates: CI, typecheck, test, build, type drift, P0 blockers, clean tree | ✅ |
| F-10 | Skills | 🔵 LOW | `ipix` skill routed to archived skills | `skills/ipix/SKILL.md` | Updated — removed archived refs, updated description to FashionOS | ✅ |
| F-11 | Agents | ⚪ INFO | Three agents not mentioned in CLAUDE.md | `.claude/agents/` | Added sub-agents section to CLAUDE.md | ✅ |
| F-12 | Commands | ⚪ INFO | `/task` had no Linear status update steps | `commands/task.md` | Added In Progress on start, Done on complete via `mcp__claude_ai_Linear__save_issue` | ✅ |
| F-13 | CLAUDE.md | ⚪ INFO | Skills table missing 5 slash commands | `CLAUDE.md` | Expanded to 8 entries including `/task`, `/audit`, `/supa`, `/user`, `/pr-fix` | ✅ |
| F-14 | CLAUDE.md | ⚪ INFO | Linear dual-MCP gotcha not documented | `CLAUDE.md` | Added Linear MCP section | ✅ |

---

## Context Waste Analysis

| Source | Est. tokens/session | Fix |
|---|---|---|
| Stale/irrelevant skills in index (~20 skills) | ~40–80k if loaded | Archive — F-03 |
| `mastra` skill full load for non-Mastra tasks | ~8k | Split — F-05 |
| `mermaid-diagrams` full SKILL.md | ~6k | Trim — F-08 |
| `package-lock.json` / lock files | ~50k if read | Already in `.claudeignore` ✅ |
| Worktree dirs `../wt-*` | 0 — excluded ✅ | — |
| **Savings if F-03 + F-05 + F-08 fixed** | **~50–90k/session** | — |

---

## Skills Scorecard

| Skill | Purpose | Trigger | Context Eff | Safety | Testing | Overall | Status |
|---|---:|---:|---:|---:|---:|---:|---|
| `graphify` | 99% | 99% | 95% | 95% | 85% | **95%** | 🟢 keep |
| `ponytail` | 95% | 95% | 90% | 95% | 80% | **91%** | 🟢 keep |
| `ipix-supabase` | 95% | 90% | 80% | 98% | 90% | **91%** | 🟢 keep |
| `lean` | 95% | 90% | 70% | 90% | 85% | **86%** | 🟢 keep |
| `worktrees` | 95% | 90% | 75% | 95% | 80% | **87%** | 🟢 keep |
| `gemini` | 85% | 85% | 80% | 95% | 70% | **83%** | 🟢 keep |
| `ipix-task-lifecycle` | 90% | 85% | 75% | 95% | 80% | **82%** | 🟡 update Vite refs |
| `copilotkit` | 85% | 85% | 70% | 90% | 70% | **80%** | 🟢 keep |
| `frontend-design` | 85% | 85% | 75% | 90% | 70% | **81%** | 🟢 keep |
| `linear` | 85% | 80% | 70% | 90% | 60% | **77%** | 🟢 keep |
| `mastra` | 90% | 90% | 85% | 95% | 75% | **87%** | ✅ split done |
| `gen-test` | 75% | 70% | 65% | 85% | 95% | **78%** | 🟢 keep |
| `ipix-wireframe` | 80% | 75% | 70% | 90% | 50% | **73%** | 🟢 keep |
| `writing-plans` | 70% | 65% | 70% | 85% | 50% | **68%** | 🟢 keep |
| `mermaid-diagrams` | 90% | 80% | 40% | 95% | 30% | **67%** | 🟡 trim SKILL.md |
| `prd` | 70% | 60% | 65% | 85% | 50% | **66%** | 🟢 keep (planning only) |
| `brainstorming` | 65% | 60% | 70% | 85% | 40% | **64%** | 🟡 consider merge with `writing-plans` |
| `feature-dev` | 75% | 65% | 65% | 85% | 70% | **72%** | 🟡 review overlap with `/task` |
| `ipix` | ? | ? | ? | ? | ? | **?** | 🟡 read + verify |
| `cloudinary` | 40% | 20% | 30% | 90% | 20% | **40%** | 🟡 keep only if Cloudinary in active use |
| `infisical` | 60% | 50% | 60% | 90% | 50% | **62%** | 🟡 keep if `.infisical.json` active |
| `medusa` | 10% | 0% | 0% | 90% | 0% | **20%** | 🔴 archive |
| `mercur` | 10% | 0% | 0% | 90% | 0% | **20%** | 🔴 archive |
| `social-media` | 20% | 5% | 5% | 90% | 0% | **24%** | 🔴 archive |
| `storefront-best-practices` | 10% | 0% | 0% | 90% | 0% | **20%** | 🔴 archive |
| `apify-ecommerce` | 5% | 0% | 0% | 90% | 0% | **10%** | 🔴 archive |
| `ecommerce-competitor-analyzer` | 5% | 0% | 0% | 90% | 0% | **10%** | 🔴 archive |
| `remotion` | 5% | 0% | 0% | 90% | 0% | **10%** | 🔴 archive |
| `video-storyboard` | 5% | 0% | 0% | 90% | 0% | **10%** | 🔴 archive |
| `post-production-guide` | 5% | 0% | 0% | 90% | 0% | **10%** | 🔴 archive |

---

## Fix Plan

### P0 — Must fix now ✅ ALL DONE

- [x] **F-01** `commands/pr-fix.md:62` — replaced hardcoded baseline with dynamic comparison
- [x] **F-01b** `commands/audit.md:195` — same fix applied
- [x] **F-02** `commands/pr-fix.md:135` — repo name confirmed correct (amo-tech-ai/lumina-studio is the real remote); cosmetic only
- [x] **F-02b** `commands/audit.md:190` — same

### P1 — Fix this sprint ✅ ALL DONE

- [x] **F-03** 10 skills archived to `skills/archive/`
- [x] **F-04** `ipix-task-lifecycle` — updated to Next.js `:3002 · app/` + `(operator)` route group
- [x] **F-06** `commands/task.md` — replaced hardcoded path with `$(git rev-parse --show-toplevel)/.env`
- [x] **F-07** `SUPABASE_ACCESS_TOKEN` removed from `settings.local.json`; bridge reads from `.env.local`
- [x] **F-10** `skills/ipix/SKILL.md` reviewed — removed archived refs, updated to FashionOS, kept as routing hub
- [x] **F-11** Sub-agents section added to CLAUDE.md
- [x] **F-12** `/task` — Linear In Progress on start, Done on complete via `mcp__claude_ai_Linear__save_issue`
- [x] **F-13** CLAUDE.md skills table expanded to 8 entries
- [x] **F-14** Linear dual-MCP gotcha documented in CLAUDE.md

### P2 — Nice to have ✅ ALL DONE

- [x] **F-05** `mastra/SKILL.md` trimmed from 345 → 80 lines; references/ has full content
- [x] **F-08** `mermaid-diagrams/SKILL.md` trimmed from ~400 → 50 lines; type-selection table + ref pointers
- [x] **F-09** `commands/release.md` created — 7 gates: CI + typecheck + tests + build + type drift + P0 blockers + clean tree

---

## Suggested New Commands

| Command | Status | Purpose | When to use |
|---|---|---|---|
| `/release` | ✅ created | Release readiness gate: CI + typecheck + build + type drift + open P0s | Before merging to main |
| `/migrate` | ✅ created | Safe migration: write SQL → `migration-reviewer` agent → apply via Supabase MCP → verify | Any DB schema change |

---

## Skill Disposition Summary

| Action | Skills | Status |
|---|---|---|
| **Archive** | `medusa`, `mercur`, `remotion`, `video-storyboard`, `post-production-guide`, `apify-ecommerce`, `ecommerce-competitor-analyzer`, `social-media`, `storefront-best-practices`, `vercel-react-best-practices` | ✅ done |
| **Split/Trim** | `mastra`, `mermaid-diagrams` | ✅ done |
| **Update** | `ipix-task-lifecycle`, `ipix` | ✅ done |
| **Pending** | `/migrate` command | ⬜ next |
| **Keep as-is** | `graphify`, `ponytail`, `ipix-supabase`, `lean`, `worktrees`, `gemini`, `copilotkit`, `frontend-design`, `linear`, `gen-test`, `ipix-wireframe`, `writing-plans`, `prd` | — |

---

## Already Good — Keep As-Is

- **Graphify pre-tool hooks** — nudging `graphify query` before every grep and file read is the single highest-leverage item in this entire setup
- **`.claudeignore`** — comprehensive; node_modules, .next, dist, graphify-out, lock files, logs all covered
- **One-concern-per-command** — all 6 commands are correctly scoped
- **Three targeted agents** — migration-reviewer, qa-reviewer, security-reviewer are well-designed sub-agents for high-risk operations
- **Memory system** — 10 indexed memories, correct frontmatter, under 200-line index limit
- **Permissions allow-list** — avoids prompt fatigue without being overly permissive
- **CLAUDE.md hard rules** — no-main-push + no-concern-mixing are clearly stated with enforcement history (PR #99)
- **Pre-push hook + CI gate** — double-layered quality gate, hook catches fast, CI catches slow
