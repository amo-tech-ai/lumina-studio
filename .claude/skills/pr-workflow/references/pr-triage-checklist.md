# PR triage checklist, dependency gate, Supabase/RLS gate

Covers steps 1–9 of SKILL.md's "Order of operations." Run these gates *before* fixing
anything — a fix built on top of an unmet dependency or a still-mixed PR is wasted work,
which is exactly the repeated-discovery loop this skill exists to prevent.

## The checklist

Fill this in for any PR audit — one row per check, don't skip rows by assuming "probably
fine." Evidence means a command output or a direct read, not a recollection.

```markdown
| Check | Status | Evidence | Blocks Merge | Fix |
|---|:---:|---|:---:|---|
| PR scope matches title/body | | | | |
| No unrelated files in diff | | | | |
| No missing dependency PR | | | | |
| Branch up to date with main | | | | |
| Mergeable status | | | | |
| CI exists and is green | | | | |
| app-build green | | | | |
| supabase-web015 green (and you know what it actually tests) | | | | |
| Codacy green or explained | | | | |
| CodeRabbit green or explained | | | | |
| Vercel green | | | | |
| No unresolved blocking threads | | | | |
| No auth/RLS/security blockers | | | | |
| No service-role misuse | | | | |
| No dead/unused filters or params | | | | |
| No IDOR / read-leak risk | | | | |
| No race conditions | | | | |
| No accessibility blockers | | | | |
| No dead UI buttons (wired to nothing, or silently no-op) | | | | |
| No untested critical behavior | | | | |
```

Status: 🟢/🟡/🔴/⚪ (same scale as [forensic-audit.md](forensic-audit.md)).

**"supabase-web015 green" is not proof migrations apply.** Read that job's own step
definition before trusting it — in this repo it applies exactly one specific migration in
isolation, not a full replay. A green check on that job says nothing about any *other*
migration in the same PR. Verify SQL correctness directly (rollback-safe transaction against
the linked project, or `supabase db push`) rather than inferring it from an unrelated CI
job passing.

## Dependency gate

Before fixing anything, establish the real dependency order for this feature area. Example
chain in this repo: `IPI-307 schema → IPI-308 RPC bridge/UI → IPI-309 profiles → IPI-311
booking`. A downstream PR (IPI-308+) cannot be correctly verified until its schema
dependency (IPI-307) actually exists somewhere reachable.

**If the dependency exists only locally, uncommitted, in a different worktree, or in
another unmerged PR:**

```
1. STOP — do not fix the downstream PR yet
2. Report exactly what's missing and where (worktree path, PR number, branch)
3. Resolve the dependency first (commit/push/open its own PR), or get explicit
   instruction to proceed anyway with the risk stated
4. Only then return to the downstream PR's fixes
```

Skipping this gate produces fixes that can't be verified (nothing to run them against) and
often have to be redone once the dependency actually lands and reveals a different real
shape than assumed.

## Supabase / RLS gate

Triggers whenever the PR touches: `supabase/migrations/**`, RPCs, RLS policies, auth,
`createSupabaseAdminClient`, `getAdminClient`, or `auth.uid()`.

Required before any fix in this area:

1. Load [`ipix-supabase`](../../ipix-supabase/SKILL.md) (or its `postgres.md` /
   `supabase-postgres-best-practices` reference directly if the `Skill` tool rejects the
   name — see SKILL.md's Required Skills fallback note).
2. Work through this checklist, not a general "looks fine" read:

| Item | What to check |
|---|---|
| RLS review | Every new/changed table has RLS enabled; policies scoped by actual ownership, not just "authenticated" |
| `SECURITY DEFINER` review | Every `security definer` function has an explicit `set search_path` — an unset search_path on a definer function is a privilege-escalation vector |
| `search_path` review | Matches the schemas the function actually needs, nothing broader |
| Grants review | `revoke all ... from public, anon` then `grant execute ... to authenticated` on sensitive RPCs — never leave the default broad grant |
| Ownership checks | Any RPC taking a client-supplied id (org id, shortlist id, etc.) re-derives the real owner server-side and checks membership — never trusts the client-supplied id alone |
| `auth.uid()` compatibility check | Does the calling code path actually have a real user JWT in scope? A service-role client never satisfies an `auth.uid()`-dependent check — see the explicit rule below |
| Service-role misuse check | Grep the diff for `getAdminClient`/`createSupabaseAdminClient`/`SUPABASE_SERVICE_ROLE_KEY` and confirm each usage is for genuinely public/global data, not something gated on the calling user's identity |
| `verify-rls` run | `infisical run -- npm run supabase:verify-rls` — must actually pass, not "should pass" |

**Explicit rule, not a suggestion:** never call an `auth.uid()`-dependent RPC with a
service-role admin client. Use a user-scoped client / access-token pattern —
`createUserScopedClient(accessToken)` sourced from `requestToken` (an `AsyncLocalStorage`
populated once per request in the CopilotKit route — see `app/src/mastra/tools/
brand-intelligence-tools.ts` for the established pattern) is the current, correct one in
this repo. It shipped wrong in this exact codebase once already (service-role client on
`search_talent`/`manageShortlist`, IPI-308) — this checklist exists so it's caught in triage
next time, not after merge.

3. If the migration hasn't been applied anywhere yet, verify it directly — either
   `supabase db push` to the linked project, or a `BEGIN; ... ROLLBACK;` transaction via the
   Supabase MCP `execute_sql` tool for a no-side-effects check. Don't trust `supabase-web015`
   passing as proof (see above). **If another open PR's migrations are already applied to
   the same shared project, do not copy that PR's migration files into this one's worktree
   to work around a `db push` history mismatch** — that's touching another PR's content
   without authorization. Use the rollback-safe transaction instead.
