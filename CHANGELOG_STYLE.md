# Changelog Style

Voice rules for [`changelog.md`](./changelog.md) and [`SHIPPED.md`](./SHIPPED.md).
The `release-notes` skill reads this file — keep rules here, not inside the skill.

---

## Two files, two audiences

| | `changelog.md` | `SHIPPED.md` |
|---|---|---|
| **Reader** | An engineer debugging this in six months | A teammate, stakeholder, or prospect |
| **Cadence** | Every merged PR | Weekly, Friday |
| **Grouping** | By ticket / theme | KaC's six change types |
| **Question it answers** | *Why did this happen and how do I not repeat it?* | *What can I do now that I couldn't last week?* |
| **Versions** | None — dated entries under `[Unreleased]` | None |

We deliberately do **not** follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
in `changelog.md` — entries group by ticket, there are no versions, and SemVer isn't
claimed. KaC's six types are used in `SHIPPED.md`, where they fit.

---

## `changelog.md` rules

1. **Lead with the defect, not the fix.** *"`withOperatorAuth` returns
   `"dev-unauthenticated"` without inspecting the request"* beats *"improved auth
   handling."*
2. **Name the root cause in one sentence a stranger could follow.** *"A string
   sentinel can never equal a uuid column, so the check failed 100% of the time."*
3. **Cite evidence.** Commit hash inline (`` `aa5d433` ``), PR link, `file:line`,
   migration id, test counts.
4. **Group by theme, never one entry per commit.** Nine Hyperdrive commits are one
   Hyperdrive paragraph.
5. **Pair every ticket id with its title on first mention.** The full form is
   `{ID} · {SPEC} — {Plain English title}`:

   | ❌ | ✅ |
   |---|---|
   | `IPI-812` | `IPI-812 · BRAND-REG-003 — Authenticate Brand Analysis at the Request Boundary` |
   | `IPI-812 · BRAND-REG-003` | *(same as above — the spec code is not a title)* |
   | `### IPI-815: Fix Racy Tests` | `### IPI-815 — Fix Racy NewPlanDialog Idempotency-Key Tests Blocking the Pre-Push Gate` |

   Drop the ` · {SPEC}` segment when the ticket genuinely has no spec code — do
   not invent one. A missing spec code is fine; a fabricated one is a lie a
   future reader will try to grep for.

   A bare number and an ID+SPEC pair fail this rule the same way: neither tells a
   reader what the ticket was about without opening Linear. (Repo-wide rule,
   `CLAUDE.md`.)
6. **Record what you deliberately did not fix,** and where it's tracked. The
   *IPI-817 · SEC-WF-001 — accessToken persisted in the workflow snapshot* note
   inside the IPI-812 entry is the model.
7. **State how it was verified.** *"232 files / 2298 passed, typecheck + build
   green."* No verification line means the entry is a claim, not a record.
8. **Prefer the schema-level fix.** When a change makes a bug class
   unrepresentable, say so — that's the most useful sentence in any entry.

### Anti-patterns

| ❌ | ✅ |
|---|---|
| "Various bug fixes and improvements" | Name them, or omit the entry |
| Pasted `git log` output | Group by theme, write prose. KaC: *"don't let your friends dump git logs into changelogs"* |
| "Fixed IPI-812" | The full name on first mention, then what broke, why, and how it's prevented |
| Passive voice hiding the actor | "The start route passed that string into the workflow" |
| An entry with no hash, PR, or file reference | Unverifiable |

---

## `SHIPPED.md` rules

1. **One line per change**, under a KaC heading: `Added` · `Changed` ·
   `Deprecated` · `Removed` · `Fixed` · `Security`.
2. **Write the user's outcome, not the mechanism.**
   > ❌ *"`validate-brand` now checks `is_org_editor_or_above()` instead of
   > `.eq("user_id", …)`"*
   > ✅ *"Editors can now run brand analysis — previously only the brand's creator
   > could, and teammates hit a confusing 'brand not found' error."*
3. **No ticket ids, no hashes, no file paths.** Link to `changelog.md` for depth.
4. **Skip anything with no user-visible effect.** Refactors, CI, dependency bumps
   belong in `changelog.md` only.
5. **A quiet week gets an honest short entry.** Padding destroys the signal — the
   point is that the trend is real.

---

## Writing a new entry

```bash
# Range since the last entry
git log --oneline --no-merges <last-hash>..HEAD
```

Then invoke the `release-notes` skill, which pulls Linear titles and acceptance
criteria for each `IPI-NNN` and drafts in this voice. **Always review the draft** —
these are prose describing shipped work, not a mechanical transform.

**Changelog updates are docs-only commits.** Never bundle one with code
(`CLAUDE.md` one-concern rule).
