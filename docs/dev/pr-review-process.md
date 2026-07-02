# PR review process

The process this team uses to audit, fix, and merge a pull request. Written for any
contributor — no Claude Code required. If you're using Claude Code, the same process is
encoded (with more operational detail — exact `gh`/GraphQL commands, templates, checklists)
in the local `pr-workflow` skill at `.claude/skills/pr-workflow/` on your machine. That
skill directory is intentionally not version-controlled (see "Why the skill is local-only"
below) — this doc is the durable, shared version of the same knowledge.

## Order of operations

Work through these in order. Each step has a stop condition — don't skip ahead to fixing
code while an earlier gate is still open. That's how the same issue ends up getting
rediscovered two or three times on the same PR instead of once.

```
 1. Identify PR scope           — what is this PR actually for (title/body vs. the real diff)
 2. Load the relevant domain skills/docs for whatever changed
 3. Check dependencies          — does this PR need another PR/schema merged first?
 4. Check mixed concerns        — never mix docs/tooling with feature code, or two tasks in one PR
 5. Check merge conflicts       — mergeable state vs. main
 6. Check CI                    — and know what each check actually covers, not just its color
 7. Check review threads        — full inventory, not just the obvious ones
 8. Check Codacy / CodeRabbit / Vercel — including gates you can't inspect the detail of
 9. Audit auth/RLS/security     — if Supabase is touched, before any other fix
10. Fix blockers first          — style/nits/docs cleanup come last
11. Re-run verification         — on the commit you just made, not from memory
12. Resolve threads with evidence — never resolve on a hunch
13. Commit/push only clean changes — one concern per commit
14. Recommend merge only when every row above is true and backed by evidence
```

## The gates

### Mixed-scope gate

Never mix docs/tooling changes with feature code in the same PR or commit, and never mix two
unrelated tasks in one PR. This is the most-enforced rule in this repo (a real incident,
PR #99, is why). Common shapes it takes: feature code bundled with `.claude/commands/**` or
similar tooling, a schema migration bundled with unrelated docs, dashboard work bundled with
an unrelated feature area. If you spot it: stop fixing the feature, split the unrelated files
into their own PR first, then resume. Don't keep layering fixes onto a PR that's already
mixed.

### Dependency gate

Before fixing anything, confirm the PR's actual dependency chain is real and merged — not
just opened, not assumed. If the schema/feature this PR builds on exists only locally,
uncommitted, in a different worktree, or in another PR that hasn't merged yet: stop, report
exactly what's missing and where, and don't write or verify fixes against something that
might still change shape. This happened for real on this repo's IPI-307→IPI-308 chain — a
completed schema migration sat uncommitted in an unrelated local worktree for days while a
downstream PR tried to build on top of it.

### Supabase / RLS gate

Triggers whenever a PR touches migrations, RPCs, RLS policies, auth, or anything calling
`auth.uid()`. Before signing off:

- RLS is actually enabled on new tables, and the policy is scoped by real ownership — not
  just "any authenticated user" (`using (true)` is not a passing policy for tenant data).
- Any RPC taking a client-supplied id (org id, shortlist id, etc.) re-derives the real
  owner server-side and checks membership — never trusts the id as given.
- `SECURITY DEFINER` functions set an explicit `search_path`.
- Grants are scoped (`revoke ... from public, anon` then a narrow `grant ... to
  authenticated`), not left at the default broad grant.
- `infisical run -- npm run supabase:verify-rls` actually passes — not assumed.

**The rule that matters most here:** never call an `auth.uid()`-dependent RPC using a
service-role admin client. A service-role connection carries no user JWT, so `auth.uid()`
is always `null` inside that RPC — the call either always fails, or someone "fixes" the
failure by weakening the RPC's own auth check, which turns a scoped endpoint into an
unscoped one. Use a user-scoped client built from the operator's real access token instead.
This isn't hypothetical — it shipped in this codebase once (a Mastra tool calling a
talent-search RPC via a service-role client) and had to be found and fixed after the fact.

**One more thing this repo learned the hard way:** a green CI check doesn't automatically
mean a migration is valid. Read what each check actually applies before trusting it — one
of this repo's CI jobs applies exactly one specific migration in isolation, not the full
set. A genuinely broken migration (a SQL syntax error) shipped past that check undetected
and was only caught by an independent code review. If a migration hasn't been proven against
a real database, verify it directly (a rollback-safe `BEGIN; ...; ROLLBACK;` transaction, or
an actual `supabase db push`) rather than inferring correctness from an unrelated CI job
passing.

## Review-thread workflow

Every unresolved thread gets bucketed before any code changes — never resolve on a hunch:

| Bucket | Meaning | Action |
|---|---|---|
| Fix | Valid, in scope | Fix it, verify the fix with a real command, reply citing the fix + verification, resolve |
| Already fixed | Looks handled | Confirm against the current code at that exact line before claiming this |
| Out of scope | Real, but not this PR's job | Reply, note a follow-up, do not resolve |
| Dismiss (false positive) | Bot/reviewer got it wrong | Reply with concrete evidence (a file/line, a passing check) before resolving |
| Waiver | Valid, high severity, but safe to defer | Document the reason in the PR body, then resolve |

Rules that apply regardless of bucket: read the full comment body, not just the summary line.
Never claim "already fixed" from memory — read the current code. Every thread gets inventoried,
including bot-only ones — skipping one silently is itself a merge blocker.

## Definition of done

A PR isn't done because CI is green. It's done when all of these are true, each backed by
evidence:

```
Dependency PRs merged (not just opened) — or explicitly accepted as a documented risk
Scope clean — no unrelated files
Merge conflicts resolved — including semantic ones, not just auto-mergeable ones
CI green — and you know what each check actually covers
Typecheck / lint / test / build pass — on the commit being recommended, not an earlier one
Review threads resolved or explicitly waived — zero silently-skipped threads
Security/RLS verified, if Supabase was touched
Linear issue state matches reality
Docs/plan tracker updated, if this PR changed the plan
Merge recommendation issued explicitly — not left implicit because nothing looked wrong
```

## Evidence required

Never state that part of a PR is complete without evidence. "I fixed it" / "that should be
fine" is not evidence. Evidence is a commit SHA, a CI status, a real command's actual output,
a Linear issue state, or a direct read of the current code — not a memory of having checked
once. This applies to your own prior work too: a reviewer re-flagging a line you already
touched still needs fresh verification. If evidence genuinely can't be produced (e.g. a
dashboard-only quality gate you don't have login access to), say so explicitly rather than
silently treating it as resolved.

## Lessons learned from this session

- **Service-role client calling an `auth.uid()`-gated RPC.** Root cause: copied a client
  pattern from a different tool file that legitimately didn't need a user JWT, without
  checking whether the *target* RPC needed one. Fix: use a user-scoped client sourced from
  the operator's real access token for anything gated on caller identity.
- **A CI check passing was read as "this migration is valid SQL."** It wasn't — that check
  only applies one unrelated migration in isolation. Fix: verify SQL directly (a
  rollback-safe transaction, or a real push) instead of inferring correctness from an
  unrelated check's color.
- **A fully-verified PR was merged to `main` on the strength of bot review alone**, with no
  human review. The green checks were real, but "merge to main" is a bigger, different
  action than the narrower permissions that had actually been granted for that session.
  There's no gate that fully prevents this — it's a judgment boundary. The practical
  mitigation: when everything upstream is green, that's exactly the moment to slow down and
  confirm, not the moment green checks earn autopilot.

## Why the skill is local-only

`.claude/skills/` is gitignored repo-wide (a deliberate rule — skills/docs content has
historically tripped secret scanning with example keys). The operational detail that only
matters if you're running Claude Code — exact `gh`/GraphQL commands, PR body templates, the
19-item triage checklist, workflow eval scenarios — stays in the local skill, where it's
useful to an agent but doesn't need review or version history. This document is the subset
that's actually team-facing: the process, the gates, and what we've learned from real
incidents on this repo. If skills become something the team wants version-controlled and
reviewed generally, that's a separate, larger decision — not something to back into via one
PR.
