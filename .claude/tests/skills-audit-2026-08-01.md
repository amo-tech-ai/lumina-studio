# Claude Skills Audit — `.claude/skills/`

**Date:** 2026-08-01 · **Auditor:** Claude Code · **Base:** `main` @ `10db146d` (working tree byte-identical to `origin/main`)
**Scope:** 44 top-level entries in `/home/sk/ipix/.claude/skills` · 1,033 files
**Mode:** Read-only. No repository file was modified by this audit.

---

## 1. Executive summary

The skill *library* is structurally sound and the skill *catalog* is not. Every one of the 43
`SKILL.md` files parses as valid YAML, carries both required fields, and matches its directory
name — that part is genuinely healthy and better than most repos.

Three things undercut it:

**The index lies, and it lies confidently.** `index-skills.md` opens with "**33 active top-level
skills**" and grades itself "**A- (88/100)**". There are **41** real skills plus 2 symlinks. It
lists four skills as active that do not exist on disk (`infisical`, `groq-inference`,
`create-migration`, `cloudflare`), omits seven that do (`amazon-bedrock`, `cloudflare-ipix`,
`cloudflare-workflow`, `cloudflare-workers-testing`, `pr-agent`, `senior-prompt-engineer`,
`sentry-pr-code-review`), and states that `release-notes` "never existed" — a skill that exists,
was invoked twice, and drafted PR #724 earlier today. It was last reviewed 2026-07-06, four weeks
ago. Anyone using it to decide what to load is being actively misled.

**The validator that the repo just fixed is still wrong, in the same direction.** PR
[#712](https://github.com/amo-tech-ai/lumina-studio/pull/712) repaired `quick_validate.py`'s
frontmatter allow-list after a false positive sent PR
[#708](https://github.com/amo-tech-ai/lumina-studio/pull/708) deleting deliberate `paths:` scoping.
That fix was correct and incomplete. One invented rule remains — a ban on angle brackets in
`description`, which appears in **neither** governing document and fails `lean`, whose description
legitimately uses `>10 files`, `>2min` and `>60s` as trigger phrases. A second gap is latent: the documented `background` field is absent from the allow-list, so the next skill
that uses `context: fork` correctly will be reported as invalid. This is the same bug class, in
the same file, that already cost the repo one closed PR.

**Over half the library has never been used.** 23 of 43 skills have **zero** invocations across
51 session transcripts and 210 recorded skill calls. Meanwhile 5 skills account for 100 of those
210 calls. The library is carrying roughly 30 MB and 1,033 files of mostly-dormant reference
material.

The good news is that almost all of this is cheap to fix: one validator commit, one index rewrite,
one archive sweep. No skill is broken at load time.

---

## 2. Overall score — **69 / 100** (C+)

The index's self-assessment of **88/100** is not supportable against disk.

| Dimension | Weight | Score | Evidence |
|---|---:|---:|---|
| Frontmatter validity (official spec) | 15 | 92 | 43/43 parse; 43/43 have `name`+`description`; 43/43 `name` == directory |
| Validator correctness | 10 | 70 | 5 failures — **1 is a validator bug**, 4 genuine; `background` gap latent |
| Link integrity | 15 | 65 | 358 dead relative links; 281 in one vendored skill |
| Usage / necessity | 15 | 55 | 23/43 never invoked in 51 transcripts |
| Catalog accuracy | 10 | 35 | 7 missing, 4 phantom, counts wrong, 4 weeks stale |
| Size discipline | 10 | 80 | 2 skills over the Agent Skills spec's 500-line guidance |
| Duplication / overlap | 15 | 65 | 1 command/skill collision, 2 archive dupes, 2 symlinks, 3 clusters |
| Progressive disclosure | 10 | 85 | 33/43 use `references/`; hubs follow the pattern |

**Weighted total: 68.55 → 69/100.**

---

## 3. Inventory

`Inv` = Skill-tool invocations across 51 project transcripts (210 total calls).
`Dead` = dead relative markdown links inside the skill directory.
Every row loads: all 43 have parseable frontmatter and a resolvable `SKILL.md`.

| Skill | Purpose | Inv | Loads | Health | Errors | Recommendation |
|---|---|---:|:---:|:---:|---|---|
| `task-verifier` | Forensic Done gate | **31** | ✅ | 🟡 | 8 dead links | **Keep** — most-used skill |
| `ipix-supabase` | Schema/RLS/edge hub (`paths:` scoped) | **25** | ✅ | 🟡 | 6 dead links | **Keep** — scoping verified working |
| `cloudflare-workflow` | 9-stage CF accuracy gate | **23** | ✅ | 🟡 | 568 lines (>500) | **Keep**, split refs |
| `design-to-production` | DC HTML → Next parity | **12** | ✅ | 🟡 | 7 dead links | **Keep** |
| `ipix-task-lifecycle` | 5-phase IPI orchestrator | **9** | ✅ | 🔴 | 17 dead links | **Keep**, fix links |
| `mermaid-diagrams` | Diagram syntax | 9 | ✅ | 🟢 | 1 dead link | **Keep** |
| `lean` | Dev-speed audit | 6 | ✅ | 🟢 | **Validator false positive** (angle brackets) | **Keep** — fixed in #727 |
| `worktrees` | Branch isolation | 5 | ✅ | 🟢 | — | **Keep** |
| `pr-workflow` | PR lifecycle | 5 | ✅ | 🟢 | — | **Keep** |
| `mastra` | Agent registry (`paths:` scoped) | 4 | ✅ | 🔴 | validator FAIL, 12 dead links | **Keep**, clean frontmatter |
| `linear` | Issue MCP hub | 3 | ✅ | 🔴 | validator FAIL, **`/linear` collision** | **Keep**, resolve collision |
| `release-notes` | changelog/SHIPPED drafting | 2 | ✅ | 🟢 | — | **Keep** — index wrongly calls it nonexistent |
| `cloudinary` | Media hub | 2 | ✅ | 🔴 | **281 dead links** (vendored) | **Keep**, prune vendored docs |
| `skill-creator` | Authoring + validator | 2 | ✅ | 🟡 | ships the validator — rule fixed + self-test added in #727 | **Keep** |
| `architecture-brief` | "Build X" scoping | 1 | ✅ | 🔴 | description 1,059 chars — over the spec's 1,024 | **Keep**, shorten description |
| `frontend-design` | UI hub | 1 | ✅ | 🟢 | — | **Keep** |
| `shadcn` | Component patterns | 1 | ✅ | 🟢 | — | **Keep** |
| `ipix-wireframe` | Operator wireframes | 1 | ✅ | 🟢 | — | **Keep** |
| `writing-plans` | Implementation plans | 1 | ✅ | 🟢 | — | **Keep** |
| `refactor-plan` | Refactor scoping | 1 | ✅ | 🟢 | — | **Merge** → `writing-plans` |
| `copilotkit` | CopilotKit v2 hub | **0** | ✅ | 🟡 | 3 dead links, 102 files | **Keep** — stack-critical |
| `graphify` | KG queries | **0** | ✅ | 🟢 | — | **Keep** — CLAUDE.md mandates it |
| `gemini` | Edge AI | **0** | ✅ | 🟡 | 2 dead links | **Keep** — stack-critical |
| `firecrawl` | Crawl/scrape | **0** | ✅ | 🟡 | validator FAIL (`inputs`,`references`) | **Keep**, clean frontmatter |
| `ipix` | Domain router | **0** | ✅ | 🟢 | — | **Keep** — routing entry point |
| `fashion-production` | 13-phase shoot hub | **0** | ✅ | 🟢 | — | **Keep** — domain core |
| `mercur` | Marketplace commerce | **0** | ✅ | 🟢 | — | **Keep** — domain core |
| `nextjs-developer` | Next.js hub | **0** | ✅ | 🟢 | — | **Keep** |
| `nextjs-16` | Next satellite (`paths:`) | **0** | ✅ | 🟢 | — | **Merge** → `nextjs-developer` |
| `claude-design-handoff` | Design → code program | **0** | ✅ | 🟢 | — | **Keep** |
| `cloudflare-ipix` | CF platform hub (renamed #711) | **0** | ✅ | 🟡 | 3 dead links, 343 files | **Keep** — 0 inv is pre-rename artifact |
| `cloudflare-workers-testing` | Workers test patterns | **0** | ✅ | 🟡 | **814 lines** (>500) | **Merge** → `cloudflare-ipix` |
| `amazon-bedrock` | Bedrock patterns | **0** | ✅ | 🟡 | 367 lines, 1 dead link | **Keep** — backs the live `pr_agent_job` |
| `pr-agent` | Bedrock PR review | **0** | ✅ | 🟡 | 1 dead link | **Keep** — CI job is live and passing |
| `sentry-pr-code-review` | Seer PR review | **0** | ✅ | 🟢 | — | **Archive** — no CI wiring, overlaps `pr-workflow` |
| `react-patterns` | Generic React | **0** | ✅ | 🟢 | — | **Merge** → `nextjs-developer` |
| `vercel-react-best-practices` | React perf | **0** | ✅ | 🔴 | 3 dead links, **archive dupe** | **Merge** → `nextjs-developer` |
| `migrate-radix-to-base` | Radix → Base UI | **0** | ✅ | 🟢 | — | **Archive** — migration not started |
| `senior-prompt-engineer` | Prompt authoring | **0** | ✅ | 🔴 | **byte-identical archive dupe** | **Delete** live copy |
| `gen-test` | Vitest scaffolding | **0** | ✅ | 🟢 | — | **Merge** → `ipix-task-lifecycle` |
| `mvp` | MVP scoping router | **0** | ✅ | 🟢 | 24 lines | **Merge** → `architecture-brief` |
| `accessibility` | a11y/WCAG | **0** | ⚠️ | 🔴 | **symlink → `archive/`** | **Resolve** — promote or drop |
| `design-md` | Design doc format | **0** | ⚠️ | 🔴 | **symlink → `archive/`**, 13 dead links | **Drop** symlink |

**Not a skill:** `archive/` — 26 archived skill directories, no `SKILL.md` of its own. Correct as-is.

---

## 4. Duplicate / overlapping skills

### 4.1 `/linear` — command and skill both claim the same invocation

```
.claude/commands/linear.md          ← creates /linear
.claude/skills/linear/SKILL.md      ← also creates /linear
```

Per the official docs: *"A file at `.claude/commands/deploy.md` and a skill at
`.claude/skills/deploy/SKILL.md` both create `/deploy`."* Which one wins is not documented, so the
behaviour is unspecified — exactly the failure mode PR
[#711](https://github.com/amo-tech-ai/lumina-studio/pull/711) fixed for `cloudflare`, where the
losing side was invisible for weeks. **This is the single highest-value finding in the audit**,
because it is silent.

### 4.2 Live skills duplicated inside `archive/`

| Skill | Live | Archived | Status |
|---|---:|---:|---|
| `senior-prompt-engineer` | 226 lines | 226 lines | **byte-identical** |
| `vercel-react-best-practices` | 153 lines | 136 lines | diverged, 31 diff lines |

### 4.3 Three PR-review surfaces

`pr-workflow` (5 inv) · `pr-agent` (0) · `sentry-pr-code-review` (0), plus nine `.claude/commands/pr*`
files. PR [#723](https://github.com/amo-tech-ai/lumina-studio/pull/723) collapses the commands 7 → 3;
the skills were not part of that pass.

### 4.4 Cloudflare cluster — 3 skills, 512 files, 1 used

`cloudflare-workflow` (23 inv) · `cloudflare-ipix` (0, 343 files) · `cloudflare-workers-testing`
(0, 814 lines). `cloudflare-ipix`'s zero is partly an artifact: it was named `cloudflare` until
#711 merged today, and the 5 recorded `cloudflare` invocations resolved to the *user-global* skill
because of the collision. Do not archive it on the strength of that zero.

### 4.5 React/Next cluster — 4 skills, 0 invocations

`nextjs-developer` · `nextjs-16` · `react-patterns` · `vercel-react-best-practices`. The index
claims this cluster was "consolidated" on 2026-07-06. All four are still present.

### 4.6 Planning cluster — 4 skills, 3 invocations total

`architecture-brief` (1) · `writing-plans` (1) · `refactor-plan` (1) · `mvp` (0, 24 lines).

---

## 5. Unused skills

**23 of 43 (53%) have zero invocations** across 51 transcripts / 210 recorded skill calls.

> **Read this caveat before deleting anything.** Zero invocations means "never invoked via the
> Skill tool in the retained transcripts of *this project*". It does **not** prove a skill is
> worthless: `paths:`-scoped skills can auto-load without a Skill call, `graphify` is mandated by
> `CLAUDE.md`, and `cloudflare-ipix`'s zero is a rename artifact. Use this as a ranking signal,
> not a delete list.

| Category | Skills |
|---|---|
| **Zero use, stack-critical — keep** | `copilotkit`, `gemini`, `graphify`, `ipix`, `fashion-production`, `mercur`, `firecrawl`, `claude-design-handoff`, `nextjs-developer`, `cloudflare-ipix`, **`pr-agent`**, **`amazon-bedrock`** |
| **Zero use, real archive candidates** | `sentry-pr-code-review`, `migrate-radix-to-base` |
| **Zero use, merge candidates** | `react-patterns`, `vercel-react-best-practices`, `nextjs-16`, `gen-test`, `mvp`, `cloudflare-workers-testing` |
| **Zero use, duplicate — delete** | `senior-prompt-engineer` (identical archive copy) |
| **Zero use, symlinks into archive** | `accessibility`, `design-md` |

Concentration: the top 5 skills (`task-verifier`, `ipix-supabase`, `cloudflare-workflow`,
`design-to-production`, `ipix-task-lifecycle`) account for **100 of 210** calls (48%).

---

## 6. Missing or broken references

**358 dead relative links** across non-archive skill directories.

| Skill | Dead | Character |
|---|---:|---|
| `cloudinary` | **281** | Vendored Cloudinary docs using bare upstream slugs (`](transformation_reference)`). Cosmetic, not repo-authored — but 51 files of it |
| `ipix-task-lifecycle` | 17 | Repo-authored. Points at `../../ipix-supabase/postgres/SKILL.md`, `../SKILL.md`, `scripts/linear-update-issue.mjs` — none exist |
| `design-md` | 13 | Symlinked archive content |
| `mastra` | 12 | Points at `../../groq-api/SKILL.md`, `my-mastra-app/`, `copilotkit-integrations/` — none exist |
| `task-verifier` | 8 | `docs/linear/issues/*`, `../../../index-skills.md` (wrong depth) |
| `design-to-production` | 7 | `Universal-design-prompt-new/docs/design/improve.md` |
| `ipix-supabase` | 6 | `../../mde-infisical/`, `../../../rules/edge-function-patterns.md` |
| `cloudflare-ipix`, `copilotkit`, `vercel-react-best-practices` | 3 each | |
| `gemini` | 2 | Also 3 template-literal false hits (`${annotation.url}`) — ignore |
| `amazon-bedrock`, `mermaid-diagrams`, `pr-agent` | 1 each | |

**Catalog files (outside the per-skill counts):**

| File | Dead links |
|---|---|
| `index-skills.md` | 5 — `tasks/skills/jul6-audit.md`, `design.md`, `.claude/skills/README.md`, `.claude/skills/archive/README.md`, `.claude/skills/archive/` (all written repo-root-relative from inside `.claude/skills/`, so they resolve nowhere) |
| `README.md` | 2 — `./infisical/SKILL.md`, `./cloudflare/SKILL.md` (the latter is post-#711 rename rot) |

**Phantom skills named as active but absent from disk:** `infisical`, `groq-inference`,
`create-migration`, `cloudflare`.

---

## 7. Best-practice violations

Checked against the official reference at `https://code.claude.com/docs/en/skills`.

| # | Violation | Where | Severity |
|---|---|---|---|
| 1 | **Validator bans angle brackets in `description`.** This rule exists in neither the Agent Skills spec nor the Claude Code docs. `lean` legitimately uses `>10 files`, `>2min`, `>60s` as trigger phrases | `quick_validate.py:92-94` | **High** |
| 2 | **`architecture-brief`'s description is 1,059 characters**, over the Agent Skills spec's documented max of 1,024. A genuine violation — see the correction note below | `architecture-brief/SKILL.md` | Medium |
| 3 | **Documented `background` field missing from the allow-list.** Any skill using `context: fork` + `background: false` will be reported invalid | `quick_validate.py:46-55` | **Medium** (latent) |
| 4 | **Command/skill name collision on `/linear`** | `.claude/commands/linear.md` + `.claude/skills/linear/` | **High** |
| 5 | Non-standard frontmatter keys ignored by the runtime | `mastra` (`impact`,`impactDescription`,`tags`,`title`), `linear` (`impact`,`tags`), `firecrawl` (`inputs`,`references`) | Low |
| 6 | Agent Skills spec's "keep under 500 lines" guidance exceeded | `cloudflare-workers-testing` (814), `cloudflare-workflow` (568) | Medium |
| 7 | Active skills that are symlinks into `archive/` — ambiguous status | `accessibility`, `design-md` | Medium |
| 8 | Catalog contradicts disk | `index-skills.md` throughout | **High** |

> ### ⚠️ Correction, applied 2026-08-01 after this section was first written
>
> The original draft of this audit called the validator's **1,024-character description cap**
> invented, on the strength of Claude Code's own docs stating 1,536. That was wrong, and the
> two numbers are not the same rule:
>
> | Source | Limit | Nature |
> |---|---|---|
> | [agentskills.io/specification](https://agentskills.io/specification) — the Agent Skills standard Claude Code implements | `description` **max 1024** | **Hard cap** |
> | [code.claude.com/docs/en/skills](https://code.claude.com/docs/en/skills) | `description` + `when_to_use` **1,536** | **Listing truncation**, not rejection |
>
> So `architecture-brief` at 1,059 chars is a **real violation**, not a false positive. Only the
> angle-bracket rule was invented. Corrected in
> [#727](https://github.com/amo-tech-ai/lumina-studio/pull/727).
>
> Two further claims in the first draft are corrected by the same source:
>
> - **SKILL.md size:** the Agent Skills spec *does* say "Keep your main `SKILL.md` under 500
>   lines." It is a documented recommendation, not merely a house convention — so
>   `cloudflare-workers-testing` (814) and `cloudflare-workflow` (568) are over a real guideline.
> - **`name` matching the directory:** the spec states `name` "Must match the parent directory
>   name" for all skills, not only plugin skills. All 43 match, so this passes either way.

---

## 8. Failure points

| # | Failure | Trigger | Blast radius |
|---|---|---|---|
| 1 | `/linear` resolves to whichever of command-or-skill wins; the loser is silently invisible | Any `/linear` invocation | Silent wrong-behaviour. This is precisely the #711 failure mode |
| 2 | A valid skill is deleted or "fixed" because the validator called it invalid | Anyone running `quick_validate.py` before committing | **Already happened once** — PR #708, closed unmerged. Now pinned by `test_quick_validate.py` (#727) |
| 3 | Someone loads a skill from `index-skills.md` that does not exist | Reading the index | 4 phantom names |
| 4 | Someone does *not* load a skill because the index omits it | Reading the index | 7 omitted, incl. `cloudflare-workflow` (23 invocations — the 3rd most-used skill in the repo) |
| 5 | Editing `accessibility`/`design-md` silently edits `archive/` | Any edit through the symlink | Archive content mutated without intent |
| 6 | `cloudflare-ipix` gets archived on false "0 invocations" evidence | A future audit trusting the raw number | Loses a 343-file hub that was only just made reachable |

---

## 9. Performance improvements

| Action | Saving |
|---|---|
| Prune vendored Cloudinary reference tree (51 files, 281 dead links) to the pages actually cited by `SKILL.md` | Largest single link-rot source in the repo |
| Split `cloudflare-workers-testing` (814 lines) into `SKILL.md` + `references/` | Body loads on every trigger today |
| Split `cloudflare-workflow` (568 lines) the same way | Same |
| Merge the 4-skill React/Next cluster into `nextjs-developer` | 4 descriptions → 1 in the always-on listing |
| Delete `senior-prompt-engineer` live copy (byte-identical to archive) | Removes a duplicate description from the listing |
| Resolve the 2 archive symlinks | Removes 2 misleading entries |

Every skill's `description` sits in context on every turn. 43 descriptions at a mean of ~570 chars
is roughly **24.5 KB of always-on context**. Cutting the 7 merge/delete candidates removes about
**3.5 KB per turn, every turn**.

---

## 10. Skills to merge

| Merge | Into | Why |
|---|---|---|
| `react-patterns`, `vercel-react-best-practices`, `nextjs-16` | `nextjs-developer` | 4 skills, 0 invocations, overlapping scope. The index already claims this was done — it wasn't |
| `cloudflare-workers-testing` | `cloudflare-ipix` | 814-line testing doc belongs in the platform hub's `references/` |
| `mvp` | `architecture-brief` | `mvp` is 24 lines of routing |
| `refactor-plan` | `writing-plans` | Both scope multi-file work before edits |
| `gen-test` | `ipix-task-lifecycle` | 50 lines; test scaffolding is Phase 4 of the lifecycle |

---

## 11. Skills to archive / delete

| Skill | Action | Evidence |
|---|---|---|
| `senior-prompt-engineer` | **Delete live copy** | Byte-identical to `archive/senior-prompt-engineer/SKILL.md`; 0 invocations |
| `sentry-pr-code-review` | **Archive** | 0 invocations; **zero references in `.github/workflows/`** — nothing wires Seer up; overlaps `pr-workflow` |
| `migrate-radix-to-base` | **Archive** | 0 invocations; `app/package.json` has **6 `@radix-ui/*` packages and 0 `@base-ui*`** — the migration has not started |
| `design-md` (symlink) | **Delete symlink** | 0 invocations, 13 dead links, archive content |
| `accessibility` (symlink) | **Resolve** | Either promote out of `archive/` or delete the symlink — currently neither |
| `vercel-react-best-practices` | **Delete archive copy** | Live and archive diverged; keep one after the merge in §10 |

**Do NOT archive — verified live, corrected 2026-08-01 after the first draft of this report:**

| Skill | Why the 0 invocations is misleading |
|---|---|
| `pr-agent` | `.github/workflows/pr-agent.yml` and `.pr_agent.toml` both exist and `pr_agent_job` **passed in 45s on PR #723**. The pilot was adopted |
| `amazon-bedrock` | `.pr_agent.toml` sets `model = "bedrock/qwen.qwen3-coder-next"` — Bedrock is the model behind that live job |

---

## 12. Prioritized fixes

### 🔴 High

| # | Fix | File |
|---|---|---|
| H1 | Remove the undocumented 1,024-char cap and angle-bracket ban from the validator | `quick_validate.py:92-97` |
| H2 | Resolve the `/linear` command-vs-skill collision | `.claude/commands/linear.md` |
| H3 | Rewrite `index-skills.md` against disk — 7 additions, 4 phantom removals, corrected counts | `index-skills.md` |
| H4 | Add `background` to the validator allow-list | `quick_validate.py:46-55` |
| H5 | Fix `README.md`'s post-#711 rename rot | `.claude/skills/README.md` |

### 🟡 Medium

| # | Fix | File |
|---|---|---|
| M1 | Fix 17 dead links | `ipix-task-lifecycle/**` |
| M2 | Fix 12 dead links | `mastra/references/**` |
| M3 | Resolve `accessibility` / `design-md` symlinks | `.claude/skills/` |
| M4 | Split the two >500-line skills into `references/` | `cloudflare-workers-testing`, `cloudflare-workflow` |
| M5 | Delete the byte-identical `senior-prompt-engineer` live copy | `.claude/skills/senior-prompt-engineer/` |
| M6 | Fix 8 dead links | `task-verifier/references/**` |

### 🟢 Low

| # | Fix | File |
|---|---|---|
| L1 | Strip non-standard frontmatter keys | `mastra`, `linear`, `firecrawl` |
| L2 | Prune vendored Cloudinary docs (281 dead links) | `cloudinary/references/**` |
| L3 | Archive the 4 unadopted skills | §11 |
| L4 | Execute the 5 merges | §10 |

**Sequencing note.** H1 and H4 are one commit in one file and unblock everything else — until the
validator is trustworthy, every other verdict it produces has to be hand-checked. Do that first.
Per the repo's one-concern rule this is at least four PRs: validator fix, index rewrite, link
repairs, archive/merge sweep.

---

## 13. Exact fixes

### H1 — `.claude/skills/skill-creator/scripts/quick_validate.py:92-97`

```python
# Only the FIRST of these two is invented. The second is the Agent Skills spec.
        # Check for angle brackets
        if '<' in description or '>' in description:
            return False, "Description cannot contain angle brackets (< or >)"
        # Check description length (max 1024 characters per spec)
        if len(description) > 1024:
            return False, f"Description is too long ({len(description)} characters). Maximum is 1024 characters."
```

**Fix:** delete the angle-bracket check. **Keep** the 1,024 cap — it is the Agent Skills standard's
documented maximum — and name its source in the code. Then add the Claude Code listing budget as a
separate, softer signal that warns rather than fails:

```python
        # https://code.claude.com/docs/en/skills — description + when_to_use are
        # truncated at 1,536 chars in the skill listing. Truncation, not rejection:
        # warn so the author knows the tail is invisible, do not fail the skill.
        listing_len = len(description) + len(str(frontmatter.get('when_to_use', '')))
        if listing_len > 1536:
            print(f"warning: description + when_to_use is {listing_len} chars; "
                  f"the listing truncates at 1536")
```

**Clears:** `lean` (`>10 files`, `>2min`, `>60s` — valid). **Does not clear**
`architecture-brief` (1,059 chars), which is a genuine spec violation and needs its description
shortened in its own PR.

### H4 — `.claude/skills/skill-creator/scripts/quick_validate.py:46-55`

```python
        'paths', 'shell', 'license', 'metadata', 'compatibility',
```
**→**
```python
        'paths', 'shell', 'background', 'license', 'metadata', 'compatibility',
```

`background` is documented (requires Claude Code ≥ 2.1.218) and pairs with `context: fork`.

### H2 — `/linear` collision

Both exist and both bind `/linear`:
```
.claude/commands/linear.md
.claude/skills/linear/SKILL.md
```
Pick one. Given `.claude/skills/linear/` is the 8 KB hub with 35 files and 3 recorded invocations,
**delete or rename `.claude/commands/linear.md`** — mirroring the #711 resolution.

### H3 — `index-skills.md`, line by line

| Line | Current | Corrected |
|---:|---|---|
| 3 | "**33 active top-level skills** … + **29** in `archive/`" | **41** active + 2 symlinks + **26** in `archive/` |
| 10 | "Last reviewed: **2026-07-06**" | **2026-08-01** |
| 14 | "Audit score — **A- (88/100)**" | **C+ (69/100)** |
| 18 | "Frontmatter … 37/37" | **43/43** |
| 19 | "`SKILL.md` size (<500 lines) — 100 — Max 322 (`lean`)" | Max **814** (`cloudflare-workers-testing`); 2 over |
| 44-48 | Summary counts 24/9/2/29/33 | Recount: 41 active, 2 symlinks, 26 archived |
| 51 | Active hubs list includes `infisical` | **Remove** — not on disk |
| 60 | "✅ 37/37" | **43/43** |
| 66 | "`release-notes` removed (never existed on disk)" | **Wrong** — exists, 95 lines, 2 invocations |
| 91 | `infisical` row | **Remove** |
| 130 | `groq-inference` row | **Remove** |
| 135 | `linear/references/pm` listed as a skill | **Remove** — nested reference, not a skill |
| 153 | `create-migration` | Already folded; keep only as an archive note |
| 160 | "**Removed from index:** `release-notes` — no skill directory" | **Delete this line** |

**Missing rows to add:** `amazon-bedrock`, `cloudflare-ipix`, `cloudflare-workflow`,
`cloudflare-workers-testing`, `pr-agent`, `senior-prompt-engineer`, `sentry-pr-code-review`.

Also fix the 5 dead links — they are written repo-root-relative from inside `.claude/skills/`:
`.claude/skills/README.md` → `README.md`, `.claude/skills/archive/` → `archive/`.

### H5 — `.claude/skills/README.md`

Two dead links: `./cloudflare/SKILL.md` → `./cloudflare-ipix/SKILL.md` (post-#711), and
`./infisical/SKILL.md` → remove, the skill does not exist.

---

## Method & limits

- **Disk state:** `/home/sk/ipix` at `10db146d`, verified byte-identical to `origin/main`.
- **Validator:** `quick_validate.py` run per skill, judged on **exit code**. An earlier pass in
  this audit judged on stdout keywords and wrongly reported 0 failures; the exit-code run found 5.
  Corrected before reporting.
- **Official docs:** fetched live from **both** `https://code.claude.com/docs/en/skills` (Claude
  Code's own extensions and the 1,536 listing budget) and `https://agentskills.io/specification`
  (the Agent Skills standard Claude Code implements — `description` max 1024, the 500-line
  guidance, and the name-matches-directory rule). Reading only the first produced a wrong
  conclusion, corrected in §7; **checking a single source is what caused it**.
- **Usage:** 51 JSONL transcripts in `~/.claude/projects/-home-sk-ipix/`, 210 `Skill` tool calls.
  **Limit:** covers only this project's retained transcripts and only explicit Skill invocations.
  A `paths:`-scoped auto-load leaves no Skill call, so `ipix-supabase`, `mastra` and `nextjs-16`
  may be undercounted. Treat zero as a ranking signal, never as proof.
- **Dead links:** relative markdown links resolved against each file's own directory; `http`,
  anchors, and `${...}` template literals excluded. `archive/` excluded throughout.
- **Not verified:** whether each skill's *body* is factually current against the code it describes.
  That is a per-skill content review, not a catalog audit.
