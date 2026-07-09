# iPix Skills Inventory & Health

**34 active top-level skills** (+ 1 nested ref, + 2 archive symlinks, + **29** in [`archive/`](.claude/skills/archive/)).

Orientation: [`.claude/skills/README.md`](.claude/skills/README.md).

Stack: Next.js `app/` · Supabase/pgvector/edge · Mercur/Medusa · Gemini · CopilotKit/Mastra ·
Cloudinary · Linear · Firecrawl · Infisical · DESIGN V2 parity.

Last reviewed: **2026-07-06** (Next.js hub consolidation).

---

## Audit score — **A- (88/100)**

| Dimension | Score | Notes |
|-----------|------:|-------|
| Frontmatter (`name` + `description`) | 100 | 37/37; `mercur` slug fixed 2026-07-06 |
| `SKILL.md` size (<500 lines) | 100 | Max 322 (`lean`); no bloat |
| Description triggers | 90 | Next.js hub consolidated; copilotkit still weak |
| Link integrity | 96 | P0 fixes 2026-07-06 |
| Index / catalog accuracy | 85 | Next.js dedup applied |
| Dedup / overlap | 88 | Next.js: hub + satellite + vercel-react |

**Verdict:** Next.js cluster consolidated. Remaining debt: copilotkit triggers, deep vendor link rot (P2).

---

## Legend

| Dot | Grade | Meaning |
|-----|-------|---------|
| 🟢 | Core | Essential to iPix stack |
| 🟡 | Useful | Situational — load when topic matches |
| ⚪ | Archive symlink | Points at `archive/` — do not count as active |
| 🔴 | Degraded | Skill loads but dead `references/` or doc links |

---

## Summary

| | Count |
|---|------:|
| 🟢 Core hubs + stack | 25 |
| 🟡 Useful situational | 9 |
| ⚪ Top-level archive symlinks | 2 (`accessibility`, `design-md`) |
| ⚪ In `archive/` | 29 |
| **Active (excl. symlinks)** | **34** |

**Active hubs (14):** `ipix` · `ipix-task-lifecycle` · `ipix-supabase` · `design-to-production` ·
`fashion-production` · `copilotkit` · `mastra` · `cloudinary` · `cloudflare` · `infisical` ·
`firecrawl` · `linear` · `mercur` · `frontend-design`

---

## Best-practices compliance

| Check | Status |
|-------|--------|
| Frontmatter `name` + `description` on every `SKILL.md` | ✅ 37/37 |
| `name` matches directory slug | ✅ fixed 2026-07-06 (`mercur`) |
| Hub `SKILL.md` <500 lines | ✅ |
| Progressive disclosure (`references/` on demand) | ✅ hubs follow pattern |
| Negative triggers in `description` | ✅ Next.js hub; copilotkit gap remains |
| Cross-skill / doc links resolve | ✅ | P0 fixes 2026-07-06 — 9 skills patched |
| No phantom index entries | 🔴 `release-notes` removed (never existed on disk) |
| Archive symlinks not double-counted | ⚠️ `accessibility`, `design-md` at top level |

---

## 🔴 Degraded — fix links (P0) — **resolved 2026-07-06**

See [`tasks/skills/jul6-audit.md`](tasks/skills/jul6-audit.md). Remaining deep refs in vendor paste files (copilotkit runtime, ipix-supabase auth docs) are P2.

---

## 🟢 Core — active

### Platform / orchestration

| Skill | Lines | Refs | Health | Note |
|-------|------:|-----:|:------:|------|
| `ipix` | 68 | 0 | ✅ | Domain router |
| `ipix-task-lifecycle` | 270 | 12 | 🔴 | 5-phase IPI orchestrator; missing local README |
| `ipix-supabase` | 310 | 80 | 🔴 | Schema/RLS/edge hub |
| `pr-workflow` | 244 | 8 | ✅ | PR lifecycle + review threads |
| `gemini` | 237 | 20 | 🔴 | Edge AI — not Mastra/client |
| `copilotkit` | 116 | 93 | 🔴 | Single plugin hub |
| `mastra` | 79 | 33 | 🔴 | Agent registry |
| `cloudinary` | 94 | 15 | ✅ | Media hub |
| `cloudflare` | 175 | 340+ | ✅ | Platform hub (Workers, Wrangler, Agents SDK) |
| `infisical` | 79 | — | ✅ | Secrets |
| `firecrawl` | 100 | — | ✅ | Web crawl/scrape |
| `linear` | 153 | 29 | ✅ | Issue MCP |
| `graphify` | 98 | 0 | ✅ | KG queries — run before multi-file reads |
| `worktrees` | 233 | 3 | ✅ | Branch isolation |
| `lean` | 322 | 5 | ✅ | Dev speed audit |
| `task-verifier` | 276 | 7 | 🔴 | Forensic Done gate |
| `gen-test` | 50 | 0 | ✅ | Vitest `app/` only |
| `shadcn` | 275 | 0 | ✅ | Component patterns |
| `skill-creator` | 200 | 4 | ✅ | Authoring + eval workflow |

### Fashion / shoot / commerce / DESIGN V2

| Skill | Lines | Health | Note |
|-------|------:|:------:|------|
| `fashion-production` | 77 | 🔴 | 13-phase shoot hub |
| `mercur` | 69 | ✅ | `my-marketplace/` commerce |
| `ipix-wireframe` | 53 | ✅ | Operator ASCII wireframes |
| `claude-design-handoff` | 249 | ✅ | Claude Design → code program |
| `design-to-production` | 256 | 🔴 | **DESIGN V2 execute** — DC HTML → Next parity |

### Design / planning

| Skill | Health | Note |
|-------|:------:|------|
| `frontend-design` | ✅ | Production UI hub |
| `writing-plans` | ✅ | Implementation plans |
| `mvp` | ✅ | MVP scoping router |

---

## 🟡 Useful — situational

| Skill | Lines | Health | Note |
|-------|------:|:------:|------|
| `architecture-brief` | 108 | ✅ | One-shot “build X” scoping |
| `mermaid-diagrams` | 55 | ✅ | Linear/issue diagrams |
| `refactor-plan` | 66 | ✅ | Refactor scoping before multi-file edits |
| `migrate-radix-to-base` | 173 | ✅ | Radix → Base UI migration |
| `groq-inference` | 201 | ✅ | Groq API patterns |
| `nextjs-developer` | ~95 | ✅ | **Next.js hub** — RSC, routing, actions; refs include ipix-16 |
| `nextjs-16` | ~30 | ✅ | **Satellite** — path trigger for proxy/config/caching |
| `vercel-react-best-practices` | 153 | ⚠️ | Perf — don't load with hub on small tasks |
| `react-patterns` | 271 | ⚠️ | Generic React; load for non-Next UI |
| `linear/references/pm` | 177 | ⚠️ | Nested PM workflows (`name` ≠ path) |

---

## ⚪ Archive — do not load unless explicit

**Top-level symlinks (still on disk):**

| Symlink | Target |
|---------|--------|
| `accessibility` | `archive/accessibility` |
| `design-md` | `archive/design-md` — prefer root [`design.md`](design.md) |

**Restore from archive:** `mv .claude/skills/archive/<name> .claude/skills/<name>`

| Skill | Note |
|-------|------|
| `brainstorming`, `feature-dev`, `claude-md-improver` | Lifecycle links via `../archive/` |
| `create-migration` | Folded → `ipix-supabase/references/migrations/scaffold.md` |
| `medusa` | Use `mercur` |
| `nextjs-app-router-patterns`, `nextjs-react-typescript` | Use `nextjs-developer` hub |
| `nextjs-best-practices`, `nextjs-supabase-auth` | Archived 2026-07-06 → hub + `ipix-supabase` auth |
| `fashion-styling` | Linked from `fashion-production` — path broken |
| Others | See [`archive/README.md`](.claude/skills/archive/README.md) |

**Removed from index:** `release-notes` — no skill directory; use `changelog.md` manually or add skill in a dedicated PR.

---

## Recommended improvements (ranked)

### P0 — correctness (same PR as link fixes)

1. Fix **8 broken link** tables above (one concern: `fix/skills-link-integrity`).
2. Set `mercur` frontmatter `name: mercur` (match directory slug).
3. Add `ipix-task-lifecycle/README.md` or remove self-link.

### P1 — catalog hygiene

4. ~~**Next.js cluster**~~ ✅ Done 2026-07-06 — hub `nextjs-developer` + satellite `nextjs-16`; archived best-practices + supabase-auth
5. Remove or relocate top-level **`accessibility`** / **`design-md`** symlinks — document in README only.
6. Update **`skills-lock.json`** / **`skill-map.md`** if present after dedup.

### P2 — quality

7. Add **“Use when / NOT for”** to `copilotkit` description (Next.js cluster done).
8. Re-run **`skill-creator` eval workflow** on hubs after link fix (trigger precision).
9. Resolve **`ipix-supabase` harness “Unknown skill”** — document workaround in README until fixed.

---

## Progress log

### 2026-07-06 (Next.js consolidation)

| Action | Result |
|--------|--------|
| `nextjs-developer` v2 hub + `references/ipix-16.md` | SSOT for App Router |
| `nextjs-16` slim satellite | Path trigger only |
| Archived `nextjs-best-practices`, `nextjs-supabase-auth` | → hub + `ipix-supabase` auth |
| Updated skill-map, pr-fix, pr-workflow triage | |

### 2026-07-06 (audit)

| Action | Result |
|--------|--------|
| Full filesystem audit (37 `SKILL.md`, excl. `archive/`) | 35 active + 2 symlinks |
| Corrected counts (was 28/27) | Index synced to disk |
| Link check — 8 degraded skills | Was falsely ✅ since 2026-07-01 |
| Removed phantom `release-notes` | Never existed |
| Added `design-to-production`, Next cluster, refactor/groq/migrate skills | Were missing from index |
| Overall grade **B+ (81/100)** | P0 link + mercur slug |

### 2026-07-02

| Action | Result |
|--------|--------|
| New `pr-workflow` skill | Cursor PR rules → Claude Code skill |

### 2026-07-01 (improvements pass)

| Action | Result |
|--------|--------|
| `lean` / `skill-creator` progressive disclosure | Under 500 lines |
| Restored `firecrawl`, `infisical`, `fashion-production` | Stack-aligned |
| Next.js dedup partial | 2 archived; 4 still active at top level |
| CopilotKit hub consolidation | Single plugin |

### 2026-06-28

| Action | Result |
|--------|--------|
| Planning lane + hub consolidation | −24+ dirs |
