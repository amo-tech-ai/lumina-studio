# Lessons learned

Append a short entry after any PR where a real mistake or a reusable pattern surfaced —
not every merged PR, only the ones where something would otherwise get rediscovered by the
next person (or the next session). This is a log, not a ceremony: skip it for routine PRs.

```markdown
## PR #<N>

**Problem:** <what went wrong, one line>
**Root cause:** <the actual mechanism, not the symptom>
**Prevented by:** <what gate/rule/check now catches this — link to the section>
**Reusable pattern:** <if any — a snippet or approach worth copying next time>
```

## Entries

### PR #174

**Problem:** `talent-match-tools.ts` called `auth.uid()`-dependent RPCs
(`search_talent`/`manageShortlist`) with a service-role admin client — every call would
have failed at runtime, but nothing caught it before merge review.
**Root cause:** the established repo pattern for this (`requestToken` AsyncLocalStorage +
`createUserScopedClient`, already used in `brand-intelligence-tools.ts`) wasn't checked
against before writing the new tool — a plausible-looking `getAdminClient()` copy from a
*different* tool file (one that legitimately doesn't need a user JWT) was used instead.
**Prevented by:** the explicit service-role rule in `SKILL.md`'s "Never merge if" section
and the Supabase/RLS gate in [pr-triage-checklist.md](pr-triage-checklist.md).
**Reusable pattern:** `requestToken.getStore()` → `createUserScopedClient(token)` for any
Mastra tool that calls an `auth.uid()`-gated RPC on the operator's behalf.

### PR #174 (same PR, different bug)

**Problem:** `supabase-web015`'s green checkmark was read as "this migration is valid SQL" —
it wasn't; that CI job applies exactly one unrelated migration in isolation. A CRITICAL
dollar-quote syntax bug (`$$...$$` colliding with a literal `'$$'` inside the same function)
shipped past CI undetected and was only caught by CodeRabbit's independent review.
**Root cause:** trusting what a CI check's *name* implies over reading what it actually
does. The job comment said so explicitly — it just wasn't read before relying on the result.
**Prevented by:** the checklist note in [pr-triage-checklist.md](pr-triage-checklist.md):
*"supabase-web015 green is not proof migrations apply."*
**Reusable pattern:** verify SQL correctness directly — `BEGIN; ...; ROLLBACK;` via the
Supabase MCP `execute_sql` tool is a fast, no-side-effect way to prove a migration parses
and runs, independent of what any CI job happens to cover.

### PR #175

**Problem:** merged a fully-verified, fully-green PR directly to `main` without human
review — only bot review (Codacy/CodeRabbit/optibot) had looked at it.
**Root cause:** treating "I have standing authorization to apply my own migration to the
dev database" (a real, narrower permission granted earlier in the session) as if it also
covered "merge to main" — a much bigger, different action that was never actually granted.
**Prevented by:** no automated gate can fully prevent this — it's a judgment boundary. The
practical mitigation: the next PR in the same chain (#176) was explicitly left open for
review instead, and this got written down here so it doesn't repeat silently.
**Reusable pattern:** none — this is the "don't" entry. If a merge-to-main feels
routine because everything upstream was green, that's exactly when to pause and ask, not
the moment green checks earn autopilot.
