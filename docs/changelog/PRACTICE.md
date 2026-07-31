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
The problem isn't tooling, it's cadence. **36 commits have landed on `main` since
the last changelog entry**, and there's a month-shaped hole before that.

---

## 1. What we have

| Thing | State |
|-------|-------|
| `changelog.md` (root) | 385 lines, Keep a Changelog style, **excellent quality** |
| `.claude/skills/release-notes/` | A skill that drafts entries from git log + Linear |
| `tasks/changelog.md` | Docs/tracker changes |
| `tasks/cloudflare/changelog.md` | Cloudflare lane |
| `linear/changelog.md` | Linear sync |
| `Universal-design-prompt-4/changelog.md` | Design import |
| `Universal-design-prompt-4/design-patched/changelog.md` | Design import, patched copy |

**Six changelogs.** Nobody knows which one to update, so the default is none.

---

## 2. The gap, measured

| Metric | Value |
|--------|-------|
| Last entry | **2026-07-26** |
| Commits since | **36** — `git rev-list --count 3fee13b..origin/main`, measured 2026-07-31 |
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
| **Pulls Linear issue context** | ❌ | ✅ — turns a bare `IPI-812` into *IPI-812 · BRAND-REG-003 — Authenticate Brand Analysis at the Request Boundary*, plus what changed and why |
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

## 3b. We claim Keep a Changelog. We don't follow it.

`changelog.md` line 5 says *"Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)."*
Checked against the actual 1.1.0 spec:

| KaC 1.1.0 rule | Us | |
|----------------|-----|:-:|
| Changelogs are for humans, not machines | Yes — very much so | 🟢 |
| Latest version first | Yes | 🟢 |
| Release date displayed | Yes, dated headers | 🟢 |
| Versions and sections linkable | PR links, no anchors | 🟡 |
| **Group by the six change types** — `Added` · `Changed` · `Deprecated` · `Removed` · `Fixed` · `Security` | **No.** We group by ticket | 🔴 |
| An entry for every version | No versions at all — permanent `[Unreleased]` | 🔴 |
| State whether you follow SemVer | Not stated | 🔴 |

So "loosely follows" is doing heavy lifting. Three of seven principles aren't met.

**That's a fork in the road, and it's worth being deliberate:**

| Option | What it means | Verdict |
|--------|---------------|---------|
| **A. Conform to KaC properly** | Add the six change-type headings under each dated entry; adopt versions | 🟡 Real work, and the six types fit a library better than a pre-launch app |
| **B. Stop claiming it** | Change line 5 to name our own documented style in `CHANGELOG_STYLE.md` | ✅ **Recommended for `changelog.md`** — the format works, the claim is what's wrong |
| **C. Apply KaC to `SHIPPED.md` only** | The six types are a good fit for a weekly user-facing digest | ✅ **Recommended for `SHIPPED.md`** |

B + C together: the engineering journal keeps its ticket-shaped format and stops
mislabelling itself; the new weekly file gets the standard structure, where it
genuinely helps a reader scan.

⚠️ KaC's headline warning is *"don't let your friends dump git logs into
changelogs."* Every automated tool in §3c does exactly that unless a human edits
the output. That is the whole argument against full automation, stated by the spec
we already cite.

---

## 3c. The tool landscape — and why more tools is the wrong answer

Searching for changelog skills returns at least six competing options:

| Tool | What it is | Verdict for iPix |
|------|-----------|:----------------:|
| **Our `release-notes` skill** | Git log + **Linear context** + repo voice + shows draft first | ✅ **Keep. Best fit** |
| [Composio `changelog-generator`](https://github.com/ComposioHQ/awesome-claude-skills/blob/master/changelog-generator/SKILL.md) | Git log → categorised, user-friendly | ❌ Strict subset of ours |
| [`ai-changelog-generator`](https://github.com/entro314-labs/AI-Changelog-Generator) (CLI + **MCP server**) | Diffs any two git refs, AI-cleans messages, multi-provider incl. local models | 🟡 **The one genuinely new capability** — see below |
| [MCPmarket `changelog-writer`](https://mcpmarket.com/tools/skills/mp-changelog-writer-chlg0001) | Skill | ❌ Duplicate |
| [MCPmarket `git-changelog-generator`](https://mcpmarket.com/tools/skills/git-changelog-generator-5) | Skill | ❌ Duplicate |
| [MCPmarket `automated-changelog-release-management`](https://mcpmarket.com/tools/skills/automated-changelog-release-management) | Skill | ❌ Duplicate |
| [Common Changelog](https://common-changelog.org/) | A *style guide*, not a tool — stricter KaC variant | 🟡 Worth reading before writing `CHANGELOG_STYLE.md` |

**Installing any of the duplicates makes things worse.** [`reports/09-dev-system.md`](../stack/reports/09-dev-system.md)
already flags the problem: **46 skills with no routing test.** Add three more with
overlapping descriptions and "which skill fires for *update the changelog*" becomes
a coin flip. The skill that loses that coin flip is ours — the only one that knows
about Linear, our voice, and the docs-only PR rule.

**The one worth a second look** is `ai-changelog-generator`, and only for its MCP
server: it diffs arbitrary git refs and can run against a **local model**. For the
36-commit backfill that's attractive — a bulk, low-stakes, cheap pass. Not for
routine entries, where Linear context is the thing that makes an entry useful.

---

## 4. Our changelog is excellent — and it isn't a changelog

Look at a real entry — *IPI-812 · BRAND-REG-003 — Authenticate Brand Analysis at
the Request Boundary and Enforce Editor/Owner Permission*, 2026-07-26:

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

**Retire the other five.** `tasks/changelog.md`, `tasks/cloudflare/changelog.md`,
`linear/changelog.md` and the two design ones become sections or get archived per
[`TEMPLATE.md`](../stack/TEMPLATE.md). Six changelogs is the same problem as two SSOTs.

---

## 6. How to make "always add" actually stick

This is the same finding as [`reports/09-dev-system.md`](../stack/reports/09-dev-system.md):
**46 skills describe, 4 hooks prevent.** A changelog skill nobody remembers to run
has exactly the failure mode the current gap demonstrates.

Ranked by how well they actually work:

| Option | Enforcement | Verdict |
|--------|:-----------:|---------|
| "Remember to update the changelog" in `CLAUDE.md` | None | ❌ This is the status quo. 36 commits |
| PR template checkbox | Honour system | 🟡 Better than nothing |
| CI check: **every PR** must touch `changelog.md` or carry a `no-changelog` label | Real | ❌ **Rejected** — see below |
| **CI check: `main`'s changelog may not fall more than N merges behind** | **Real** | ✅ **Recommended** |
| Conventional commits + `release-please` | Full automation | 🟡 See below |
| Weekly scheduled job that drafts `SHIPPED.md` | Automatic | ✅ **Recommended, paired** |

### ❌ Why the per-PR gate was rejected

The obvious design — *"this PR must change `changelog.md`"* — was written, reviewed,
and thrown away. It fails on this repo's most-enforced rule:

> **NEVER mix docs and production files, or two different concerns, in one PR or
> commit.** — `AGENTS.md`, `CLAUDE.md`

A per-PR gate makes that rule unsatisfiable. Every code PR would have to bundle a
docs file to go green, and the only escape is a `no-changelog` label — so the gate
teaches people to reach for the label, which is exactly the enforcement-shaped
nothing it was supposed to replace.

**Plain English:** it's a smoke alarm wired to the light switch. You'd disable it
on day two, and then it isn't protecting anything.

### Why not full automation

The 2026 consensus is split, and the criticism is specific: fully automated
changelogs from commit messages *"results in poor changelogs, defeating their
purpose."* Given our entries include root-cause analysis a commit subject could
never carry, auto-generation would be a downgrade.

**But that reasoning only holds for `changelog.md`.** For `SHIPPED.md` — a weekly
digest in plain language — a drafted-then-reviewed job is exactly right.

### The recommended pair

**A. CI gate — a staleness budget, not a per-PR tax**

The gate measures **`main`**, not your diff. It asks one question: *how many
commits have landed on `main` since anything last touched `changelog.md`?* Under
the budget, every PR is green. Over it, every PR goes red until someone merges a
docs-only changelog PR — which is a clean, one-concern PR, exactly the shape the
repo's rules want.

```yaml
# .github/workflows/ci.yml — new job
changelog-staleness:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
      with: { fetch-depth: 0 }
    - name: changelog.md must not fall behind main
      env:
        MAX_BEHIND: "12"
      run: |
        set -euo pipefail
        git fetch --no-tags origin "${{ github.base_ref }}"
        # A PR that updates the changelog is always mergeable.
        if git diff --name-only "origin/${{ github.base_ref }}...HEAD" \
             | grep -qE '^(changelog\.md|SHIPPED\.md)$'; then exit 0; fi
        last=$(git log -1 --format=%H "origin/${{ github.base_ref }}" -- changelog.md)
        behind=$(git rev-list --count "$last..origin/${{ github.base_ref }}")
        [ "$behind" -le "$MAX_BEHIND" ] || { echo "::error::$behind behind"; exit 1; }
```

**Why `main` and not the PR:** your code PR stays code-only. The debt is a
property of the branch everyone shares, so the branch is what gets measured — and
anyone can clear it for everyone with one docs PR.

⚠️ **No `paths:` filter on the job** — `CLAUDE.md` is explicit that a path-gated
required check can hang permanently "pending" and block merges.

**Threshold, honestly.** `MAX_BEHIND: 12` is a guess anchored to one real number:
the gap this document exists because of was **36 commits** (measured
2026-07-31 — last `changelog.md` commit on `main` was `3fee13b`, 2026-07-26).
Twelve is roughly a fortnight at this repo's merge rate. Tune it after one month
of living with it; a threshold nobody ever hits is decoration, and one that fires
weekly is a tax.

**B. Weekly draft — makes it a ritual**

A Friday-scheduled workflow runs the `release-notes` skill over the week's merges
and opens a docs-only PR with a `SHIPPED.md` draft. A human edits and merges. The
writing burden drops to reviewing prose, which is the part humans are good at.

---

## 7. How this improves development

Not vague benefits — specific ones tied to problems already documented in this repo:

| Problem we have | How the changelog fixes it |
|-----------------|---------------------------|
| **`tasks/plan/todo.md` is 4 weeks stale** | A weekly ritual forces a weekly look at what actually shipped |
| **Linear statuses unverified against code** ([08](../stack/reports/08-linear-process.md)) | Writing "what shipped" surfaces issues marked Done with nothing behind them |
| **Scores drift** ([README](../stack/README.md)) | Every entry is a dated checkpoint. Reconstructing "when did this break" stops being archaeology |
| **Four cutover gates 6+ days stale** | A weekly "nothing shipped on Cloudflare again" line is uncomfortable in the productive way |
| **PR descriptions are the only record** | PRs get buried. A changelog is one file with `Ctrl-F` |
| **Onboarding** | `SHIPPED.md` is the fastest way to learn what a product actually does |

And Linear's own argument, which lands harder for a pre-launch product: *startups
rarely die mid-keystroke, they get demoralised.* Thirty-six unlogged commits is
real work that currently looks, to anyone not reading git, like a quiet month.

---

## 8. The most efficient path

**Install nothing.** Use what's here, add one gate and one schedule.

The efficiency argument in one line: writing a changelog entry costs ~5 minutes at
PR time when the change is fresh in your head. Reconstructing 36 commits' worth
later costs hours and produces worse entries, because the *why* is gone.

### Do this, in order

| # | Task | Effort | Enforcement | Status |
|:-:|------|:------:|-------------|:------:|
| 1 | **`changelog-staleness` CI job** (measures `main`, not your diff) | S | **Real** | ⚪ config PR |
| 2 | Fix line 5 of `changelog.md` — name our own style, not KaC | XS | — | 🟢 **done** |
| 3 | `CHANGELOG_STYLE.md` at root | S | — | 🟢 **done** |
| 4 | Backfill the 36 commits as **one** grouped entry | M | — | 🟢 **done** |
| 5 | `SHIPPED.md` using KaC's six change types | S | — | 🟢 **done** |
| 6 | Friday workflow drafting `SHIPPED.md` → docs-only PR | M | **Automatic** | ⚪ config PR |
| 7 | Archive the **5** secondary changelogs | S | — | ⚪ needs link sweep |
| 8 | Point `release-notes` at `CHANGELOG_STYLE.md` + the two-file split | S | — | ⚪ skill PR |

Tasks 2–5 ship in this PR (docs-only). 1, 6 and 8 are config/skill changes in a
separate PR, per the one-concern rule — which is also why they are *not* bundled
here. 7 needs an inbound-link sweep first
(`grep -rn "tasks/changelog.md" docs tasks *.md`).

**Tasks 1 and 6 are the whole point.** The rest is setup. Without the gate and the
schedule, this document becomes the 47th thing that describes good practice without
causing it — which is precisely the failure mode the 36-commit gap already proves.

### Effort, honestly

| | Time | Result |
|---|:----:|--------|
| Tasks 1–3 | **~1 hour** | Gap can't silently re-open; the format claim becomes true |
| Task 4 | ~1 hour | History is whole again |
| Tasks 5–8 | ~half a day | The weekly ritual runs itself |

### What we are explicitly not doing

| Not doing | Because |
|-----------|---------|
| Installing a second changelog skill | 46 skills, no routing test. A duplicate description makes ours lose the coin flip |
| Conventional commits + `release-please` for `changelog.md` | KaC's own warning: don't dump git logs. Our entries carry root causes no commit subject holds |
| Rewriting existing entries to KaC's six types | They're good. The claim was wrong, not the format |
| A public-facing changelog site | Later. Get the internal ritual first — that's Linear's own sequence |

---

## 9. Sources

- [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/) — the format `changelog.md` **claims** to follow; conformance checked in §3b
- [Linear — Startups, Write Changelogs](https://linear.app/now/startups-write-changelogs) · [Medium mirror](https://medium.com/linear-app/startups-write-changelogs-c6a1d2ff4820)
- [Composio changelog-generator SKILL.md](https://github.com/ComposioHQ/awesome-claude-skills/blob/master/changelog-generator/SKILL.md)
- [entro314-labs/AI-Changelog-Generator](https://github.com/entro314-labs/AI-Changelog-Generator) — CLI + MCP server, multi-provider, local models
- [MCPmarket changelog skills](https://mcpmarket.com/tools/skills/ai-changelog-generator) — four overlapping options, see §3c
- [Common Changelog](https://common-changelog.org/) · [vweevers/common-changelog](https://github.com/vweevers/common-changelog) — stricter style guide; read before writing `CHANGELOG_STYLE.md`
- [How Linear used a public changelog to drive growth](https://lastrelease.io/blog/how-linear-uses-a-public-changelog)
- [Changelog generation in GitHub Actions](https://oneuptime.com/blog/post/2025-12-20-changelog-generation-github-actions/view)
- [semantic-release vs changesets vs release-it, 2026](https://www.pkgpulse.com/guides/semantic-release-vs-changesets-vs-release-it-release-2026)
- Local: `changelog.md` · `.claude/skills/release-notes/SKILL.md`
