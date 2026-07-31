---
title: "Changelog Practice — Review & Plan"
version: "1.0"
lastUpdated: "2026-07-31"
status: Active
purpose: "Whether to install a changelog skill, how to fix the cadence problem, and how to make 'always add a changelog entry' actually stick."
ssot: ../../changelog.md
verifiedAgainst: "changelog.md (385 lines) · .claude/skills/release-notes/SKILL.md · 6 changelog files in-repo · git log since last entry"
verifiedAt: "2026-07-31"
---

# Changelog Practice

**Short answer:** don't install the Composio skill — we already have a better one.
The problem isn't tooling, it's cadence. **41 commits have landed since the last
changelog entry**, and there's a month-shaped hole before that.

---

## 1. What we have

| Thing | State |
|-------|-------|
| `changelog.md` (root) | 385 lines, Keep a Changelog style, **excellent quality** |
| `.claude/skills/release-notes/` | A skill that drafts entries from git log + Linear |
| `tasks/changelog.md` | Docs/tracker changes |
| `tasks/cloudflare/changelog.md` | Cloudflare lane |
| `linear/changelog.md` | Linear sync |
| `Universal-design-prompt-4/changelog.md` ×2 | Design imports |

**Six changelogs.** Nobody knows which one to update, so the default is none.

---

## 2. The gap, measured

| Metric | Value |
|--------|-------|
| Last entry | **2026-07-26** |
| Commits since | **41** |
| Gap before that | 2026-06-24 → 2026-07-26 — **32 days, zero entries** |
| Entries in the last 12 months | ~15 |
| Linear's rate | **50+** |

The pattern is bursts, not rhythm. Someone remembers, writes four entries in one
sitting, then a month passes. That is not a tooling failure — the skill exists and
works. It's that nothing *asks*.

---

## 3. Should we install the Composio changelog-generator skill?

**No.** Ours is strictly better for this repo.

| | [Composio `changelog-generator`](https://github.com/ComposioHQ/awesome-claude-skills/blob/master/changelog-generator/SKILL.md) | Our `release-notes` |
|---|---|---|
| Reads git history | ✅ | ✅ |
| Categorises changes | ✅ Features / Improvements / Fixes | ✅ by theme |
| Translates tech → user language | ✅ | 🟡 stays technical by design |
| **Pulls Linear issue context** | ❌ | ✅ — turns `IPI-812` into what changed and why |
| **Matches this repo's voice** | ❌ generic | ✅ explicitly instructed to |
| **Knows our docs-only PR rule** | ❌ | ✅ |
| Style config file | ✅ `CHANGELOG_STYLE.md` | ❌ |
| Shows draft before writing | ❌ | ✅ |

**Two ideas worth stealing:**

1. **`CHANGELOG_STYLE.md`** — a style file the skill reads, so voice rules live in
   the repo instead of inside the skill. Add it.
2. **The category structure** (✨ Features · 🔧 Improvements · 🐛 Fixes) — right for
   a *user-facing* changelog, which we don't have. See §5.

---

## 4. Our changelog is excellent — and it isn't a changelog

Look at a real entry (2026-07-26, IPI-812):

> *"`withOperatorAuth` returns `"dev-unauthenticated"` whenever the operator gate is
> off, **without inspecting the request**. A string sentinel can never equal a uuid
> column, so the check failed 100% of the time."*

That is superb engineering writing. Root cause, file:line, the defect class, and
the schema change that makes the bug *unrepresentable*. Keep every word of it.

But it is a **forensics journal**, not what [Linear means by a changelog](https://linear.app/now/startups-write-changelogs).
Their argument is about three things a forensics journal doesn't deliver:

| Linear's point | Our changelog |
|----------------|---------------|
| **Momentum** — a weekly reminder that you shipped | ❌ bursts, month-long gaps |
| **Culture** — signals the company values shipping | 🟡 signals we value debugging |
| **Velocity signal** — prospects check it | ❌ unreadable to a non-engineer |

Linear published **50+ changelogs in 12 months**, image-rich, starting *before* they
had users — as an internal ritual first and an external signal second.

---

## 5. The plan: two audiences, two files

Don't rewrite `changelog.md`. Add the missing one.

| File | Audience | Cadence | Voice |
|------|----------|---------|-------|
| `changelog.md` | Engineers, future debuggers | **Per merged PR** | Technical. Root causes, hashes, file:line. Unchanged |
| `SHIPPED.md` *(new)* | Team, stakeholders, prospects | **Weekly, Friday** | Plain language. "What can someone do now that they couldn't last week?" |

**Example of the same change in both voices:**

> **`changelog.md`** — *"`validate-brand` filtered `.eq("user_id", userId)` on a
> service-role client that bypasses RLS. Now checks org membership (owner/editor),
> matching the IPI-732 precedent."*
>
> **`SHIPPED.md`** — *"🔧 Editors can now run brand analysis. Previously only the
> brand's original creator could — a team member with edit access would hit a
> confusing 'brand not found' error."*

Same fact. One tells you how to fix it next time; the other tells you what changed
for the person using it.

**Retire the other four.** `tasks/changelog.md`, `tasks/cloudflare/changelog.md`,
`linear/changelog.md` and the two design ones become sections or get archived per
[`TEMPLATE.md`](./TEMPLATE.md). Six changelogs is the same problem as two SSOTs.

---

## 6. How to make "always add" actually stick

This is the same finding as [`reports/09-dev-system.md`](./reports/09-dev-system.md):
**46 skills describe, 4 hooks prevent.** A changelog skill nobody remembers to run
has exactly the failure mode the current gap demonstrates.

Ranked by how well they actually work:

| Option | Enforcement | Verdict |
|--------|:-----------:|---------|
| "Remember to update the changelog" in `CLAUDE.md` | None | ❌ This is the status quo. 41 commits |
| PR template checkbox | Honour system | 🟡 Better than nothing |
| **CI check: PR must touch `changelog.md` or carry a `no-changelog` label** | **Real** | ✅ **Recommended** |
| Conventional commits + `release-please` | Full automation | 🟡 See below |
| Weekly scheduled job that drafts `SHIPPED.md` | Automatic | ✅ **Recommended, paired** |

### Why not full automation

The 2026 consensus is split, and the criticism is specific: fully automated
changelogs from commit messages *"results in poor changelogs, defeating their
purpose."* Given our entries include root-cause analysis a commit subject could
never carry, auto-generation would be a downgrade.

**But that reasoning only holds for `changelog.md`.** For `SHIPPED.md` — a weekly
digest in plain language — a drafted-then-reviewed job is exactly right.

### The recommended pair

**A. CI gate — makes it unskippable**

```yaml
# .github/workflows/ci.yml — new job
changelog-check:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
      with: { fetch-depth: 0 }
    - name: Require a changelog entry
      run: |
        if git diff --name-only origin/${{ github.base_ref }}...HEAD | grep -q '^changelog.md$'; then
          echo "✅ changelog.md updated"; exit 0
        fi
        if [[ "${{ contains(github.event.pull_request.labels.*.name, 'no-changelog') }}" == "true" ]]; then
          echo "⏭️  no-changelog label present"; exit 0
        fi
        echo "❌ Add an entry to changelog.md, or apply the 'no-changelog' label."
        exit 1
```

⚠️ **No `paths:` filter on the job** — `CLAUDE.md` is explicit that a path-gated
required check can hang permanently "pending" and block merges.

**B. Weekly draft — makes it a ritual**

A Friday scheduled workflow runs the `release-notes` skill over the week's merges
and opens a docs-only PR with a `SHIPPED.md` draft. A human edits and merges. The
writing burden drops to reviewing prose, which is the part humans are good at.

---

## 7. How this improves development

Not vague benefits — specific ones tied to problems already documented in this repo:

| Problem we have | How the changelog fixes it |
|-----------------|---------------------------|
| **`tasks/plan/todo.md` is 4 weeks stale** | A weekly ritual forces a weekly look at what actually shipped |
| **Linear statuses unverified against code** ([08](./reports/08-linear-process.md)) | Writing "what shipped" surfaces issues marked Done with nothing behind them |
| **Scores drift** ([README](./README.md)) | Every entry is a dated checkpoint. Reconstructing "when did this break" stops being archaeology |
| **Four cutover gates 6+ days stale** | A weekly "nothing shipped on Cloudflare again" line is uncomfortable in the productive way |
| **PR descriptions are the only record** | PRs get buried. A changelog is one file with `Ctrl-F` |
| **Onboarding** | `SHIPPED.md` is the fastest way to learn what a product actually does |

And Linear's own argument, which lands harder for a pre-launch product: *startups
rarely die mid-keystroke, they get demoralised.* Forty-one unlogged commits is
real work that currently looks, to anyone not reading git, like a quiet month.

---

## 8. Do this

| # | Task | Effort | Enforcement |
|:-:|------|:------:|-------------|
| 1 | Backfill an entry for the 41 unlogged commits | M | — |
| 2 | Add `CHANGELOG_STYLE.md` at root; point the skill at it | S | — |
| 3 | Add the `changelog-check` CI job + `no-changelog` label | S | **Real** |
| 4 | Create `SHIPPED.md` with the Features/Improvements/Fixes structure | S | — |
| 5 | Weekly Friday workflow drafting `SHIPPED.md` | M | **Automatic** |
| 6 | Archive the 4 secondary changelogs | S | — |
| 7 | Update the `release-notes` skill: two-file split + style file | S | — |

**Tasks 3 and 5 are the whole point.** 1, 2, 4, 6 and 7 are setup; without the gate
and the schedule, this document becomes the 47th thing that describes good practice
without causing it.

---

## 9. Sources

- [Linear — Startups, Write Changelogs](https://linear.app/now/startups-write-changelogs) · [Medium mirror](https://medium.com/linear-app/startups-write-changelogs-c6a1d2ff4820)
- [Composio changelog-generator SKILL.md](https://github.com/ComposioHQ/awesome-claude-skills/blob/master/changelog-generator/SKILL.md)
- [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/) — the format `changelog.md` already follows
- [How Linear used a public changelog to drive growth](https://lastrelease.io/blog/how-linear-uses-a-public-changelog)
- [Changelog generation in GitHub Actions](https://oneuptime.com/blog/post/2025-12-20-changelog-generation-github-actions/view)
- [semantic-release vs changesets vs release-it, 2026](https://www.pkgpulse.com/guides/semantic-release-vs-changesets-vs-release-it-release-2026)
- Local: `changelog.md` · `.claude/skills/release-notes/SKILL.md`
