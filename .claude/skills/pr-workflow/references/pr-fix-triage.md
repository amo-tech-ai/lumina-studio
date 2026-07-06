# Fixing PR feedback — domain orientation, fix order, final report

Detail behind SKILL.md's "Fixing review feedback on an open PR" section. Thread taxonomy and
the reply/resolve mechanics are in [pr-review-resolve.md](pr-review-resolve.md) — this file is
about *how to find the right evidence* and *what order to fix things in*.

## Phase 0 — orient before triaging

```bash
gh pr view <N> --json number,title,body,headRefName,files
```

1. Read the changed paths and load the matching domain skill(s) below — read the real
   `SKILL.md`, don't answer from memory.
2. If the PR closes IPI-###, read `docs/linear/issues/IPI-<N>-*.md` and run
   [task-verifier](../../task-verifier/SKILL.md) before calling anything merge-ready.
3. `graphify query "<concept>"` before opening any flagged source file — get the scoped
   subgraph first, read raw files second.
4. State in one paragraph: PR intent, skills loaded, MCP probes planned — before writing
   any fix.

### Path → skill / MCP matrix

| Changed paths | Skills to load | MCP / subagent |
|---|---|---|
| `app/src/styles/**`, `tokens.css`, `design-system*` | `design-md`, `frontend-design`, `claude-design-handoff` | — |
| `app/src/components/**`, operator UI | `design-md`, `frontend-design`, `shadcn`, `accessibility` | browser snapshot for visual claims |
| `app/src/app/api/copilotkit/**`, CopilotKit hooks | `copilotkit` (v2 only, no v1 hooks) | — |
| `app/src/mastra/**` | `mastra`, `gemini` | Mastra docs search |
| `app/src/lib/supabase/**`, auth, onboarding, `proxy.ts` | `ipix-supabase`, `nextjs-developer` (auth → `references/auth/nextjs.md`) | Supabase MCP |
| App Router pages/layouts (non-auth) | `nextjs-developer` | Next.js DevTools MCP (`cd app && npm run dev` first) |
| `supabase/migrations/**`, `*.sql` | `ipix-supabase` | Supabase MCP + **migration-reviewer** subagent |
| `supabase/functions/**` | `ipix-supabase`, `gemini` | Supabase MCP (`list_edge_functions`, `get_edge_function`) |
| Edge AI / prompts / structured output | `gemini` | Gemini API docs |
| Cloudinary / media pipeline | `cloudinary` | Cloudinary MCP plugins |
| Firecrawl / brand crawl | `firecrawl`, `ipix-supabase` | Firecrawl MCP |
| Commerce / Mercur (`my-marketplace/`) | `mercur` | Mercur MCP |
| Multi-file feature / >3 paths touched | `graphify` | — |
| Tests added/broken | `gen-test` | — |
| Env / secrets / Infisical | `infisical` | — |
| Linear issue state / spec drift | `linear`, `ipix-task-lifecycle` | Linear MCP |
| Scope creep / bundle risk | `lean` | — |
| Any PR before final merge-ready sign-off | `task-verifier` | — |

Evidence over memory for every dismissal: cite `tsc`, a test run, a skill/MCP probe, or a
file+line — never "that's not how it works."

## Phase 1 — fetch & inventory

Covered in [pr-review-resolve.md](pr-review-resolve.md#graphql-resolve-protocol) — the
inventory query and taxonomy table live there since both loops (self-review and post-PR fix)
share it.

## Phase 2 — fix order

Fix in this order — a security fix built on top of an unresolved merge conflict, or a style
nit fixed before a real blocker, both waste a cycle:

```
1. Missing dependency        — see pr-triage-checklist.md's dependency gate; stop if unmet
2. Mixed scope                — split before any feature fix, see SKILL.md #1 rule
3. Merge conflicts             — resolve before anything else touches the same files
4. Security/auth/RLS bugs      — pr-triage-checklist.md's Supabase/RLS gate
5. Runtime blockers             — code that's factually wrong (won't compile/throws/wrong logic)
6. CI failures                  — after 1-5, CI should mostly self-resolve; fix what's left
7. Review comments               — the remaining threads, taxonomy in pr-review-resolve.md
8. Style/nits                     — only after every blocker above is closed
9. Documentation cleanup           — last, and only in its own commit (never mixed with 1-8)
```

Within any step:

```
Checkout the PR branch — worktree preferred, see [worktrees](../../worktrees/SKILL.md)
graphify query "<concept>" → read only the flagged lines, not the whole file
Re-read the relevant domain skill if the comment touches an established pattern
  (auth, CopilotKit v2, Mastra tools) — don't argue a pattern from memory
Smallest safe diff — match existing file patterns, no drive-by refactors
>3 files needed for one finding → confirm with the user before touching them
One concern per commit — never mix unrelated fixes in the same commit
```

### iPix defaults worth knowing before arguing with a reviewer

- Auth: `withOperatorAuth(req)` → `OperatorAuthError` → 401
- Brand RLS: `createSupabaseServerClient()` is async
- CopilotKit: `@copilotkit/react-core/v2` only
- Mastra tools: call `tool.execute!()` from routes — no raw `generateText` in routes
- Gemini: server-only, default `gemini-3.1-flash-lite`
- AI SDK `ai@6.x`: `maxOutputTokens`, not `maxTokens`
- Never `--no-verify` on push
- Fix needs a migration → stop and report, don't push (see `verify-matrix.md`)

## Phase 3 — verify

[verify-matrix.md](verify-matrix.md) — run the base checks plus every conditional row that
matches the changed paths. A failure means stop, don't push, don't resolve.

## Phase 4 — push & resolve

[pr-review-resolve.md](pr-review-resolve.md) — git safety, stage allowlist, GraphQL
reply+resolve, CI gate.

## Phase 5 — final report

For a full audit or a merge recommendation, use [forensic-audit.md](forensic-audit.md)'s
report format — that's the canonical one, don't maintain two report shapes. The box below is
the lightweight variant for a quick fix-cycle summary (e.g. "resolved 4 threads, nothing else
changed") where the full grading table would be overkill:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PR #<N> — REVIEW FIX REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PR link:        <url>
Branch:         <branch>
Closes:         IPI-### (or N/A)

Comments reviewed:   <total>
  Fixed:             <n>
  Already fixed:     <n>
  Out of scope:      <n>
  Dismissed:         <n>

Tests:          typecheck ✅ | tests <n> passed ✅ | build <skipped|✅>

Skills verified:
  - <skill> → <result>

MCP verified:
  - <server> → <result>

Spec compliance (if closes issue):
  - AC #1: ✅ | 🔴

Remaining blockers:  <none | list>

Suggested improvements (out of scope):
  - <title> — <one-line rationale>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
