---
description: "Triage and fix PR review comments — inline threads, bot summaries, CI failures. Modes: fix|resolve|ship|ready."
argument-hint: "PR# [fix|resolve|ship|ready]"
allowed-tools: ["Bash", "Edit", "Write", "Read", "Grep", "Glob", "Task"]
---

# /pr-fix — PR review fix orchestrator

Act as a senior GitHub PR reviewer and fixer for the iPix / Lumina Studio codebase.

## Arguments

`$ARGUMENTS` — PR number (e.g. `162`) or full GitHub PR URL, **required**, plus an optional
mode. Default mode is `fix`.

```text
/pr-fix 170            # = /pr-fix 170 fix
/pr-fix 170 resolve
/pr-fix 170 ship
/pr-fix 170 ready
```

| Mode | Does | Commits / pushes? |
|------|------|-------------------|
| **`fix`** (default) | Phases 0–3 — triage, fix, verify. Stops before commit. | **No** |
| `resolve` | Phase 4 only — verify each fix at HEAD, GraphQL reply + resolve. No code edits. | No |
| `ship` | Phases 0–5 end to end — verify, commit, push, resolve, sign off. | **Yes** — invoking `ship` is explicit consent |
| `ready` | Undraft, CI + thread inventory, trigger bots, merge-ready summary. No code edits. | No |

Anything not `resolve` / `ship` / `ready` is treated as `fix`.

## Related

- **Pre-PR review (no PR yet):** `/review-pr` — read-only, runs the review subagents
- **State dashboard:** `/pr` — detects branch/PR/CI/thread state, recommends the next command
- **Canonical rules:** [`pr-workflow` skill](../skills/pr-workflow/SKILL.md) —
  [thread taxonomy + resolve protocol](../skills/pr-workflow/references/pr-review-resolve.md) ·
  [path→skill matrix + fix order](../skills/pr-workflow/references/pr-fix-triage.md) ·
  [verify matrix](../skills/pr-workflow/references/verify-matrix.md) ·
  [full audit report format](../skills/pr-workflow/references/forensic-audit.md)

---

## Injected context

- PR: !`gh pr view $ARGUMENTS --json number,url,headRefName,headRefOid,isDraft 2>/dev/null || echo "set PR in arguments"`
- Git status (first 20): !`git status -sb | head -20`
- Changed files (total): !`git status --porcelain | wc -l`
- Diff stat (first 20): !`git diff --stat HEAD | head -20`
- Diff totals: !`git diff --shortstat HEAD`
- Branch diff (first 20): !`{ git diff main...HEAD --stat 2>/dev/null || echo "n/a"; } | head -20`
- Recent commits: !`git log -5 --oneline`
- Local HEAD: !`git rev-parse HEAD`
- Branch: !`git branch --show-current`

---

## Comment taxonomy (classify first)

| Source | Blocks merge? | Action |
|--------|---------------|--------|
| **Inline review thread** (`isResolved = false`) | **Yes** | Fix → GraphQL reply → resolve |
| Bot summary review ("Needs Changes 🔧", Conversation tab) | **No** | Track in PR comment; do not treat as open thread |
| Bot summary-only nit (Codacy, CodeRabbit body) | **No** | Fix, dismiss, or PR comment — not GraphQL resolve |
| Codacy/CI check failure | **Yes** (if required check) | Fix or waiver in PR body |
| Draft PR | — | `/pr-fix <N> ready` before full bot review |

### Merge blockers — source of truth

**Only unresolved inline review threads block merge.**

Top-level bot reviews like "Needs Changes" may remain visible after fixes.
They are **not** the source of truth.

```text
GraphQL reviewThreads where isResolved = false
+
CI status (required checks)
+
latest HEAD SHA (fix verified on headRefOid)
```

Count unresolved threads:

```bash
REPO="$(gh repo view --json nameWithOwner --jq '.nameWithOwner' 2>/dev/null || echo 'amo-tech-ai/lumina-studio')"
OWNER="${REPO%%/*}"
NAME="${REPO#*/}"
gh api graphql -f query='
query { repository(owner:"'$OWNER'", name:"'$NAME'") {
  pullRequest(number:<N>) {
    reviewThreads(first:100) {
      nodes { id isResolved path line }
    }
  }
}}' --jq '[.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved==false)] | length'
```

If count > 0 → continue in `fix` mode.
If count = 0 but Conversation still shows "Needs Changes" → stale summary; proceed when CI green.

### Post-push thread re-fetch (mandatory)

After **every push**, re-fetch unresolved threads.

Bots may create **new threads on sibling files** after the first fix (e.g. fix `panel/route.ts`
→ new thread on `suggestions/route.ts`).

**Do not sign off until unresolved thread count stays 0 on latest HEAD.**

```text
push → wait ~10s → re-fetch GraphQL count
→ if new threads: fix siblings/shared callers → push again → repeat
→ sign off only when count = 0 at headRefOid
```

**Example (#164):** `parseBrandScore` had to land in both `intelligence/panel/route.ts` and
`brands/[id]/suggestions/route.ts`. Fixing only one triggered a follow-up optibot thread.

### Sign-off gate (merge-ready)

```text
Wait for bot re-review on latest HEAD
→ confirm unresolved threads = 0
→ confirm CI green (required checks)
→ merge or /pr-fix <N> ready
```

---

## Worktree + HEAD gate

Before triage: `headRefOid` from `gh pr view` must match `git rev-parse HEAD`.
If not on the PR branch/worktree → stop.

Run `npm run worktree:audit` before every fix (see #173).

---

## Fix efficiency tiers

**Default to Tier A.** Escalate only when confidence drops below 80% or the issue touches
auth, RLS, agents, migrations, CI, or runtime UI.

| Tier | When | Skills / MCP | Verify |
|------|------|--------------|--------|
| **A — Thread-only** | Clear inline comment with exact file/line | None unless confidence < 80% | Targeted test + lint |
| **B — Domain** | UI architecture, Supabase/RLS, auth, agents, migrations, shared components | Max 1–2 skills from the [path→skill matrix](../skills/pr-workflow/references/pr-fix-triage.md); MCP only if external truth needed | `npm test` on affected glob |
| **C — Forensic** | CI red, runtime disputed, AC drift, stacked PR state unclear | `task-verifier` + MCP probes + browser snapshot | Full [verify matrix](../skills/pr-workflow/references/verify-matrix.md) |

**Efficient loop:**

```text
0. npm run worktree:audit
1. gh pr view N --json files → unresolved threads (GraphQL)
2. Classify each thread: A | B | C (show in triage table)
3. IF any B/C: graphify query → load 1 skill → optional 1 MCP probe
4. Smallest diff → verify by tier → reply (SHA + commands) → resolve
```

---

## Git safety (before commit)

```bash
git status -sb
git diff --stat HEAD
git diff main...HEAD --stat
git log -5 --oneline
```

**NEVER stage:** `.env*`, `.mcp.json`, `.agents/**`, `skills-lock.json`, unrelated `docs/**`

**Do not commit** unless the user asks or mode is `ship`.

---

## Phase 0 — Pre-flight (skills & MCP audit)

**Tier gate:** Skip heavy Phase 0 for Tier A threads. Run full Phase 0 only for Tier B/C (or
when confidence < 80%).

```bash
gh pr view <N> --json number,title,body,headRefName,files
```

1. **Read changed paths** → load domain skills via the canonical
   [path→skill / MCP matrix](../skills/pr-workflow/references/pr-fix-triage.md) (read the real
   `SKILL.md`, not memory). That table is the single source of truth — do not maintain a second
   copy here.
2. **If the PR closes IPI-###** → read `docs/linear/issues/IPI-<N>-*.md`.
3. **`graphify query "<concept>"`** before reading flagged source files.
4. **Output:** one paragraph — PR intent, skills loaded, MCP probes planned.

**Hub router:** [`ipix` skill](../skills/ipix/SKILL.md) when the domain is unclear.

**Evidence over memory** for every dismissal — cite `tsc`, a test run, an MCP probe, or a
file+line.

---

## Phase 1 — Fetch & triage

1. Extract the PR number and mode from `$ARGUMENTS`.
2. HEAD gate + fetch unresolved threads (GraphQL — snippet above).
3. Bucket: **Fix** · **Already fixed** · **Out of scope** · **Dismiss**
4. Assign tier **A | B | C** per thread.
5. Show the triage table **before** coding.

---

## Phase 2 — Fix

Order: Bug → Refactor → Tech debt → Style

1. Checkout the PR branch (worktree required if not already there).
2. Tier A: read flagged lines only. Tier B/C: `graphify query` → read flagged lines.
3. Smallest safe diff; >3 files → confirm with the user.
4. One concern per commit.

### iPix defaults

- Auth: `withOperatorAuth(req)` → `OperatorAuthError` → 401
- RLS: `createSupabaseServerClient()` (async)
- CopilotKit: v2 imports only
- Mastra: `tool.execute!()` from routes
- Gemini: server-only; see the `gemini` skill
- AI SDK 6.x: `maxOutputTokens`
- Never `--no-verify`
- Stop if the fix needs a migration — report, then use the `ipix-supabase` skill +
  **migration-reviewer** subagent

---

## Phase 3 — Verify

Verify depth matches tier.

### 3a. Static

```bash
cd app && npm run typecheck
cd app && npm test
```

Also lint, build, `supabase:verify-rls`, edge/BI/DNA scripts as applicable — see the
[verify matrix](../skills/pr-workflow/references/verify-matrix.md).

### 3b. Domain (skills + MCP)

Tier B/C only. Run the Phase 0 probes. DB claims → Supabase MCP.

### 3c. Spec compliance

Tier C, or the `ready` gate. If the PR closes IPI-###: each AC → probe → result. Run the
`task-verifier` skill before calling anything merge-ready.

### 3d. CI

```bash
gh pr checks <N> --watch=false
gh pr view <N> --json statusCheckRollup
```

**`fix` mode stops here.** Report what's fixed and offer:

```text
/pr-fix <N> ship     — commit + push + resolve
/pr-fix <N> resolve  — if already pushed
```

---

## Phase 4 — Push & resolve

> Modes: `resolve` runs this phase alone. `ship` runs it after Phases 0–3.

### 4a. Commit + push (`ship` only)

- Stage the **allowlist only** — paths from triage/fix
- Commit: `fix(pr-<N>): address review — <summary>`
- Never `--no-verify`
- `git push -u origin HEAD`, then re-fetch `headRefOid`

### 4b. Reply + resolve (per thread)

Verify the fix exists at the current `headRefOid` first (read the file at path/line; MCP for a
DB claim). If **not** fixed → skip and report it as "needs `/pr-fix <N>`".

```bash
# Reply — pullRequestReviewThreadId takes the thread's own node ID (PRRT_...),
# NOT the PR's node ID.
gh api graphql -f query='
mutation {
  addPullRequestReviewThreadReply(input: {
    pullRequestReviewThreadId: "'$THREAD_ID'"
    body: "Fixed in <SHA>. Verified: <commands>."
  }) { comment { id } }
}'

# Resolve — resolveReviewThread takes threadId (the same PRRT_... value), not pullRequestReviewThreadId
gh api graphql -f query='
mutation {
  resolveReviewThread(input: { threadId: "'$THREAD_ID'" }) { thread { isResolved } }
}'
```

### 4c. Gate

Re-count unresolved — must be `0` on the latest `headRefOid`. Re-fetch ~10s after every push
(sibling-thread rule above). Re-trigger `cursor review` / `bugbot run` if the diff is >50 LOC
or touches sensitive paths.

**Bot summary-only findings:** do not use the resolve API — post a PR comment referencing the
commit instead.

### 4d. Sign-off comment

```markdown
## Review sign-off — all threads resolved ✅
| Finding | Fix | Commit |
|---------|-----|--------|
| … | … | `<sha>` |
Verified: `<commands>` on `<sha>`. Unresolved threads: 0.
```

**Do not:** resolve without verifying at HEAD · resolve out-of-scope threads (reply only +
follow-up Linear issue) · stage `.env*`, `.mcp.json`, `.agents/**`, `skills-lock.json`.

---

## Phase READY (`ready` mode)

Local verify passed and fixes are pushed — open it up for full Bugbot/CodeRabbit + human
review. **No code edits in this mode.**

1. **Pre-flight** — confirm the local branch matches `headRefName`; do not undraft from the
   wrong checkout.

   ```bash
   gh pr view <N> --json number,url,headRefName,headRefOid,isDraft,mergeable,statusCheckRollup
   git rev-parse HEAD && git branch --show-current
   ```

2. **Undraft if needed** — `gh pr view <N> --json isDraft --jq .isDraft`; if `true`, run
   `gh pr ready <N>`. Report was-draft → now-ready. **Re-check `isDraft` after any later
   `gh pr edit` or push — it can flip back.**

3. **CI + thread inventory** — `gh pr checks <N> --watch=false` plus the GraphQL unresolved
   count above.

4. **Trigger bots** — post `cursor review`, `bugbot run`, or `@coderabbitai review` on the PR.
   **Do not claim bots ran** — report "trigger requested", and note the user may need to comment
   manually if the CLI cannot post.

5. **Summarize:**

   ```markdown
   # PR Ready — #<N>
   **URL:** <url> · **Branch:** `<headRefName>` @ `<headRefOid>`
   **Draft:** cleared | was already ready · **Mergeable:** yes/no

   ## CI
   | Check | Status |
   |-------|--------|

   ## Review threads
   - Unresolved inline: **<n>** (merge blocker if >0 unless waived)
   - Bot summary-only findings: not resolvable via GraphQL — track in PR comments

   ## Next step
   - Unresolved > 0 → `/pr-fix <N>` then `/pr-fix <N> ship`
   - Unresolved = 0 + CI green → merge when a human approves
   - CI red → fix, then re-run `/pr-fix <N> ready`
   ```

---

## Phase 5 — Final report

For a full audit or merge recommendation, use the
[forensic-audit.md](../skills/pr-workflow/references/forensic-audit.md) report format — that's
the canonical one. The box below is the lightweight variant for a quick fix-cycle summary.

```text
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

Spec compliance (if it closes an issue):
  - AC #1: ✅ | 🔴

Remaining blockers:  <none | list>

Prevention:
  - <why this class of comment won't recur>

Suggested improvements (out of scope):
  - <title> — <one-line rationale>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Rules

- **Only unresolved inline threads block merge** — ignore stale "Needs Changes" summaries when
  the GraphQL count = 0
- Re-fetch the thread count after every push; fix sibling files before sign-off
- Never resolve unread threads
- Verify "already fixed" at HEAD (+ MCP for a DB claim)
- Load the domain skill before arguing a pattern
- One concern per commit
- Never `--no-verify`
- Docs-only fixes → separate PR

## Project context

- Repo: resolved dynamically via `gh repo view --json nameWithOwner`
- Stack: Next.js (`app/`), Mastra, Supabase, CopilotKit v2
- Test baseline: compare `npm test` vs main — new failures are a blocker
