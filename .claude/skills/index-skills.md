# iPix Skills Inventory & Health

**38 active top-level skills** (+ 2 archive symlinks, + **28** in [`archive/`](archive/)).

Orientation: [`README.md`](README.md).

Stack: Next.js `app/` · Supabase/pgvector/edge · Mercur/Medusa · Gemini · CopilotKit/Mastra ·
Cloudinary · Linear · Firecrawl · Cloudflare Workers · DESIGN V2 parity.

Last reviewed: **2026-08-01** — full disk audit, evidence in
[`.claude/tests/skills-audit-2026-08-01.md`](../tests/skills-audit-2026-08-01.md).

---

## Audit score — **C+ (69/100)**

Measured against disk, the live spec at <https://code.claude.com/docs/en/skills>, and 51 session
transcripts (210 recorded `Skill` calls).

| Dimension | Score | Notes |
|-----------|------:|-------|
| Frontmatter validity | 92 | 40/40 parse; all carry `name` + `description`; all match their directory |
| Validator correctness | 70 | 4 genuine failures; 1 false positive (angle brackets) fixed in #727 |
| Link integrity | 65 | 358 dead relative links — 281 of them in `cloudinary`'s vendored docs |
| Usage | 55 | 18/40 never invoked |
| Catalog accuracy | 35 → **fixed here** | Was 4 weeks stale: 7 skills missing, 4 phantom |
| `SKILL.md` size | 80 | 2 over the house 500-line rule |
| Dedup / overlap | 65 | 2 archive symlinks; React/Next cluster still 4-wide |
| Progressive disclosure | 85 | 31/40 use `references/` |

**The previous entry claimed A- (88/100). That was not supportable against disk** — it counted 33
skills when there were 41, and listed 4 that did not exist.

> ⚠️ **Two documents govern skills, and they set different limits.** The
> [Agent Skills standard](https://agentskills.io/specification) that Claude Code implements sets
> `description` at **max 1024 characters**, recommends keeping `SKILL.md` **under 500 lines**, and
> requires `name` to match the directory. [Claude Code's own docs](https://code.claude.com/docs/en/skills)
> add its extensions (`paths`, `context`, `background`, …) and a **1,536-character** budget on
> `description` + `when_to_use` in the listing — that one truncates rather than rejects.

---

## Legend

| Dot | Meaning |
|-----|---------|
| 🟢 | Loads, links resolve, validator passes |
| 🟡 | Loads; dead links, size, or frontmatter nits |
| 🔴 | Validator fails, heavy link rot, or duplicated |
| ⚪ | Archive symlink — not counted as active |

---

## Summary

| | Count |
|---|------:|
| Active skills (real directories) | **38** |
| Archive symlinks at top level | 2 (`accessibility`, `design-md`) |
| In `archive/` | 28 |
| Never invoked across 51 transcripts | 18 |

**Most used:** `task-verifier` (31) · `ipix-supabase` (25) · `cloudflare-workflow` (23) ·
`design-to-production` (12) · `ipix-task-lifecycle` (9). These five are 48% of all skill calls.

> **How to read the invocation counts.** They count explicit `Skill` tool calls in this project's
> retained transcripts. A `paths:`-scoped skill can auto-load without one, a skill read as a
> prerequisite document never registers one, and a recently renamed skill starts from zero. A zero
> is a **ranking signal, not proof of worthlessness** — three archive candidates were dropped on
> exactly this basis (see the progress log).

---

## Best-practices compliance

| Check | Status |
|-------|--------|
| Frontmatter `name` + `description` on every `SKILL.md` | ✅ 40/40 |
| `name` matches directory slug | ✅ 40/40 (the spec only requires this for plugin skills) |
| `quick_validate.py` passes | 🔴 36/40 — `architecture-brief` description is 1,059 > 1,024; `mastra`, `linear`, `firecrawl` carry non-standard keys |
| Hub `SKILL.md` under house 500-line rule | 🔴 `cloudflare-workers-testing` 814, `cloudflare-workflow` 568 |
| Progressive disclosure (`references/` on demand) | ✅ 31/40 |
| Cross-skill / doc links resolve | 🔴 358 dead |
| No phantom index entries | ✅ fixed 2026-08-01 |
| No command↔skill name collisions | 🟡 `/linear` — fix in flight (#728) |
| Archive symlinks not counted as active | ✅ excluded from the 38 |

---

## 🟢 Active — platform / orchestration

| Skill | Lines | Inv | Health | Note |
|-------|------:|----:|:------:|------|
| `task-verifier` | 227 | 31 | 🟡 | Forensic Done gate — 8 dead links |
| `ipix-supabase` | 333 | 25 | 🟡 | Schema/RLS/edge hub · `paths: supabase/**` |
| `cloudflare-workflow` | 568 | 23 | 🟡 | CF accuracy gate — over the 500-line house rule |
| `ipix-task-lifecycle` | 285 | 9 | 🔴 | 5-phase IPI orchestrator — 17 dead links |
| `lean` | 322 | 6 | 🟢 | Dev-speed audit |
| `pr-workflow` | 244 | 5 | 🟢 | PR lifecycle + review threads |
| `worktrees` | 345 | 5 | 🟢 | Branch isolation |
| `mastra` | 79 | 4 | 🔴 | Agent registry · `paths: app/src/mastra/**` — validator fail, 12 dead links |
| `linear` | 153 | 3 | 🔴 | Linear hub — validator fail; `/linear` collision fixed in #728 |
| `cloudinary` | 98 | 2 | 🔴 | Media hub — 281 dead links in vendored docs |
| `release-notes` | 95 | 2 | 🟢 | `changelog.md` / `SHIPPED.md` drafting |
| `skill-creator` | 200 | 2 | 🟢 | Authoring + `quick_validate.py` + its self-test |
| `graphify` | 98 | 0 | 🟢 | KG queries — mandated by `CLAUDE.md`, so the 0 is expected |
| `gemini` | 237 | 0 | 🟡 | Edge AI — not Mastra/client |
| `copilotkit` | 116 | 0 | 🟡 | CopilotKit v2 hub — 102 files |
| `firecrawl` | 100 | 0 | 🔴 | Crawl/scrape — validator fail (`inputs`, `references`) |
| `ipix` | 69 | 0 | 🟢 | Domain router |
| `cloudflare-ipix` | 167 | 0 | 🟡 | CF platform hub, 343 files — renamed from `cloudflare` in #711; the 0 is a rename artifact |
| `cloudflare-workers-testing` | 814 | 0 | 🟡 | **Largest skill** — merge candidate into `cloudflare-ipix/references/` |
| `amazon-bedrock` | 367 | 0 | 🟡 | **Keep** — backs the live `pr_agent_job` |
| `pr-agent` | 53 | 0 | 🟡 | **Keep** — `pr_agent_job` runs green in CI |

## 🟢 Active — fashion / commerce / design

| Skill | Lines | Inv | Health | Note |
|-------|------:|----:|:------:|------|
| `design-to-production` | 268 | 12 | 🟡 | DESIGN V2 execute — DC HTML → Next parity |
| `frontend-design` | 60 | 1 | 🟢 | Production UI hub |
| `ipix-wireframe` | 53 | 1 | 🟢 | Operator wireframes |
| `shadcn` | 275 | 1 | 🟢 | Component patterns |
| `claude-design-handoff` | 249 | 0 | 🟢 | Claude Design → code program |
| `fashion-production` | 77 | 0 | 🟢 | 13-phase shoot hub |
| `mercur` | 69 | 0 | 🟢 | `my-marketplace/` commerce |

## 🟢 Active — planning / engineering

| Skill | Lines | Inv | Health | Note |
|-------|------:|----:|:------:|------|
| `mermaid-diagrams` | 55 | 9 | 🟢 | Diagram syntax |
| `architecture-brief` | 108 | 1 | 🔴 | One-shot "build X" scoping — description 1,059 chars, over the spec's 1,024 |
| `refactor-plan` | 66 | 1 | 🟢 | Refactor scoping — merge candidate |
| `writing-plans` | 121 | 1 | 🟢 | Implementation plans |
| `gen-test` | 50 | 0 | 🟢 | Vitest `app/` only — merge candidate |
| `mvp` | 24 | 0 | 🟢 | MVP scoping router — merge candidate |
| `nextjs-developer` | 102 | 0 | 🟢 | **Next.js hub** |
| `nextjs-16` | 29 | 0 | 🟢 | Satellite · `paths: app/next.config.ts` — merge candidate |
| `react-patterns` | 271 | 0 | 🟢 | Generic React — merge candidate |
| `vercel-react-best-practices` | 153 | 0 | 🔴 | Perf — a diverged copy also sits in `archive/` |

---

## ⚪ Archive symlinks — resolve, do not count as active

| Symlink | Target |
|---------|--------|
| `accessibility` | `archive/accessibility` |
| `design-md` | `archive/design-md` — prefer root [`design.md`](../../design.md) |

⚠️ Both resolve **into `archive/`**, so editing them silently mutates archived content.

Neither can be archived as unused. `design-md` is a **mandatory** prerequisite of
`design-to-production` (`design-to-production/SKILL.md:30`, "Load before line 1") and is named in
5 live routing tables; `accessibility` is the only a11y guidance in the repo. Promoting them to
real directories is a follow-up, not an archive action.

**Restore from archive:** `mv .claude/skills/archive/<name> .claude/skills/<name>`

---

## Recommended improvements (ranked)

### 🔴 High

1. ~~Validator rejects a valid skill~~ — **in flight, [#727](https://github.com/amo-tech-ai/lumina-studio/pull/727)**.
   `quick_validate.py` banned angle brackets in `description`, a rule in neither spec, which failed
   `lean`. Also adds the documented `background` field and a self-test. The 1,024-char cap is
   **real** (Agent Skills spec) and stays.
2. ~~`/linear` bound by both a command and a skill~~ — **in flight,
   [#728](https://github.com/amo-tech-ai/lumina-studio/pull/728)** (renamed to `/linear-enrich`).
3. Fix [`README.md`](README.md) — it points at `./cloudflare/SKILL.md` (renamed in #711) and
   `./infisical/SKILL.md` (does not exist).

### 🟡 Medium

4. Fix dead links: `ipix-task-lifecycle` (17), `mastra` (12), `task-verifier` (8),
   `design-to-production` (7), `ipix-supabase` (6).
5. Promote or drop the two archive symlinks.
6. Split `cloudflare-workers-testing` (814) and `cloudflare-workflow` (568) into `references/`.
7. Shorten `architecture-brief`'s description to ≤1,024 chars, and move the non-standard keys in
   `mastra`, `linear` and `firecrawl` under `metadata:` (a spec field that accepts arbitrary
   keys) — the 4 remaining validator failures.

### 🟢 Low

8. Prune the vendored Cloudinary tree — 281 dead links across 51 files, the single largest source
   of link rot in the repo.
9. Merge the React/Next cluster (`react-patterns`, `vercel-react-best-practices`, `nextjs-16`)
   into `nextjs-developer` — 4 skills, 0 invocations between them.
10. Merge `cloudflare-workers-testing` → `cloudflare-ipix`, `mvp` → `architecture-brief`,
    `refactor-plan` → `writing-plans`, `gen-test` → `ipix-task-lifecycle`.

---

## Progress log

### 2026-08-01 (full audit + archive sweep)

| Action | Result |
|--------|--------|
| Filesystem audit — 43 `SKILL.md`, 1,033 files | 41 active + 2 symlinks; this index had said 33 |
| Archived `migrate-radix-to-base`, `sentry-pr-code-review`, `senior-prompt-engineer` | 41 → 38 active, 26 → 28 archived |
| Removed 4 phantom entries | `infisical`, `groq-inference`, `cloudflare`, `linear/references/pm` |
| Added the 7 missing skills | `amazon-bedrock`, `cloudflare-ipix`, `cloudflare-workflow`, `cloudflare-workers-testing`, `pr-agent`, plus `senior-prompt-engineer` / `sentry-pr-code-review` (both now archived) |
| Reinstated `release-notes` | This index recorded it as "never existed on disk". It exists, has 2 invocations, and drafted [#724](https://github.com/amo-tech-ai/lumina-studio/pull/724) |
| Validator re-run **by exit code** | 5 failures — 1 was a validator bug (fixed in #727), 4 are genuine |
| Usage measured from 51 transcripts | 18/38 never invoked |
| Overall grade **C+ (69/100)** | Was self-graded A- (88/100) |

**Three archive candidates were dropped after checking them** — each had 0 invocations and a live
subject: `pr-agent` and `amazon-bedrock` back a green CI job (`.pr_agent.toml` sets
`model = "bedrock/qwen.qwen3-coder-next"`), and `design-md` is a mandatory prerequisite loaded as a
document rather than called as a skill.

### 2026-07-06 (Next.js consolidation)

| Action | Result |
|--------|--------|
| `nextjs-developer` v2 hub + `references/ipix-16.md` | SSOT for App Router |
| `nextjs-16` slim satellite | Path trigger only |
| Archived `nextjs-best-practices`, `nextjs-supabase-auth` | → hub + `ipix-supabase` auth |

> Correction: that entry claimed the Next.js cluster was consolidated. As of 2026-08-01 all four of
> `nextjs-developer`, `nextjs-16`, `react-patterns`, `vercel-react-best-practices` are still active
> with 0 invocations between them. The consolidation was partial.

### 2026-07-02

| Action | Result |
|--------|--------|
| New `pr-workflow` skill | Cursor PR rules → Claude Code skill |
