# Forensic PR audit format

Use this structure whenever the ask is a full audit ("audit this PR," "is this safe to
merge," "forensic review") rather than a narrow single-comment fix. Narrow fixes use the
taxonomy in [pr-review-resolve.md](pr-review-resolve.md) instead — don't force every small
fix through this heavier format.

## Before writing anything

1. Load the domain skill(s) for every changed path — see SKILL.md's "Required skills"
   table. Don't reason about Next.js/React/CopilotKit/Mastra/Supabase/RLS/shadcn patterns
   from memory when the skill exists to check against.
2. Read the actual diff (`gh pr diff <N>` or `git diff main...HEAD`), not just the PR
   description — PR bodies claim things the diff doesn't always back up.
3. Check the PR against **repository conventions and existing architecture**, not
   abstract best practice. A finding that says "this should use X pattern" only counts if
   X pattern is already established elsewhere in this repo — cite the file where it's
   used. Reusing an existing pattern beats introducing new architecture; flag any new
   abstraction, new dependency, or new pattern that duplicates something the repo already
   has.
4. Verify, don't assume: CI status (`gh pr checks`), CodeRabbit/Codacy/Vercel check
   conclusions, `mergeable` state (`gh pr view --json mergeable`), every review thread's
   resolved/unresolved state, and any cross-PR dependency (does this PR need another PR
   merged first — check with the same rigor as a blocker, not a footnote).

## Findings categories

Bucket every finding into exactly one category — don't leave findings uncategorized:

| Category | What goes here |
|---|---|
| **Errors** | Code that is factually wrong — won't compile, throws, wrong logic |
| **Blockers** | Anything that must be fixed before merge, regardless of severity elsewhere |
| **Security issues** | AuthN/authZ gaps, secret exposure, injection risk, privilege escalation |
| **RLS/auth issues** | Missing/incorrect Postgres RLS policies, service-role misuse, `auth.uid()` gaps — see `ipix-supabase`'s RLS guidance before asserting a policy is wrong |
| **Performance issues** | N+1 queries, missing indexes, unnecessary re-renders, unbounded result sets — see `ipix-supabase/postgres.md` for Postgres-specific rules |
| **Accessibility issues** | Keyboard nav, ARIA, focus management, contrast — see the `accessibility` skill for the checklist |
| **Merge risks** | Conflicts, CI never triggering, stale base branch, cross-PR dependencies not yet merged |
| **Recommended fixes** | One line per finding above: the specific, minimal change — not a redesign |

A finding with no category is a finding you haven't finished triaging — don't report it
yet.

## Grading table

Open every forensic audit report with the PR's own identity — don't make the reader dig for
it:

```markdown
PR link:            <url>
Branch:              <branch>
Commit SHA:          <sha you actually verified, not an earlier one>
Files changed:       <count, and the list if under ~15>
```

Then the grading table, one row per audited area, using this scale:

| Symbol | Meaning |
|---|---|
| 🟢 | Correct — verified, no action needed |
| 🟡 | Needs work — real but non-blocking |
| 🔴 | Blocking — must fix before merge |
| ⚪ | Informational — not gradable (e.g. "no RLS changes in this PR") |

```markdown
| Area | Status | Score | Evidence |
|---|:---:|---:|---|
| Scope check (PR matches title/body, no unrelated files) | 🟢/🟡/🔴/⚪ | n/10 | |
| Dependency (cross-PR blockers) | 🟢/🟡/🔴/⚪ | n/10 | |
| Merge Conflicts | 🟢/🟡/🔴/⚪ | n/10 | |
| CI (which checks, what each actually tests) | 🟢/🟡/🔴/⚪ | n/10 | |
| Review threads (resolved/unresolved count) | 🟢/🟡/🔴/⚪ | n/10 | |
| Auth Pattern | 🟢/🟡/🔴/⚪ | n/10 | |
| RPC/API Correctness | 🟢/🟡/🔴/⚪ | n/10 | |
| RLS/Authorization | 🟢/🟡/🔴/⚪ | n/10 | |
| Performance | 🟢/🟡/🔴/⚪ | n/10 | |
| Accessibility | 🟢/🟡/🔴/⚪ | n/10 | |
| Tests (typecheck/lint/test/verify-rls) | 🟢/🟡/🔴/⚪ | n/10 | |
```

`Evidence` is the command/output/file+line that backs the score — a row with no evidence is
a row you haven't actually verified yet, don't fill in a score for it. Rows are illustrative,
not fixed — drop rows that don't apply (mark ⚪ instead of forcing a score), add rows for
areas this specific PR actually touches.

Close with:

```markdown
Remaining blockers:      <none | list>
Merge recommendation:    🟢 Ready to merge | 🟡 Fixable now | 🔴 Stop — missing prerequisite
```

## Verify before recommending merge

Every fix claimed in the audit must be backed by a fresh run, not a memory of a prior run:

```bash
npm run typecheck
npm run lint
npm test
infisical run -- npm run supabase:verify-rls   # if RLS/migrations touched
npm run supabase:types                          # if schema touched — diff should be empty or expected
```

Then confirm CI is actually green (`gh pr checks <N>`) on the commit you just verified, not
an earlier one. Only recommend 🟢 Ready to merge when every row above is backed by a
command you ran in this session, on the current HEAD SHA — not a prior finding, not an
assumption that "it probably still passes."

**Never merge or resolve a review comment without this verification and evidence in hand**
— this applies even when you personally authored the fix.
