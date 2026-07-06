# task-verifier — audit & implementation (2026-07-06)

**Skill path:** [`.claude/skills/task-verifier/`](../../.claude/skills/task-verifier/)  
**Status:** P0 improvements **shipped** in working tree · P1/P2 remain

---

## Score — before vs after

| Dimension | Before | After | Δ |
|-----------|-------:|------:|--:|
| Protocol structure | 95 | 96 | +1 |
| iPix probes & MCP | 75 | 92 | +17 |
| **Skills / best-practices** | **35** | **88** | **+53** |
| Artifact coverage (IPI/SCR) | 55 | 85 | +30 |
| Self-maintenance | 70 | 88 | +18 |
| Rubric / composite scoring | 80 | 90 | +10 |
| **Weighted (iPix primary)** | **68** | **89** | **+21** |

**Target after P1:** ≥92 (skill-map sync, eval fixtures).

---

## Implementation checklist

### P0 — done ✅

- [x] **Phase 5b** — [skills-compliance-ipix.md](../../.claude/skills/task-verifier/references/skills-compliance-ipix.md)
- [x] **Phase 0** — [task-type-router-ipix.md](../../.claude/skills/task-verifier/references/task-type-router-ipix.md) (IPI / SCR / RF / audit / legacy)
- [x] **probe-disk-ipix.sh** — [scripts/probe-disk-ipix.sh](../../.claude/skills/task-verifier/scripts/probe-disk-ipix.sh) (`app` · `supabase` · `skills` · `git`)
- [x] **anti-fake-done** — iPix 10-gate checklist first; mdeai in § Legacy
- [x] **Rubric** — iPix weights + skills 20pts + composite formula
- [x] **SKILL.md rewrite** — iPix-first · 11 phases · extended report template · fixed broken external links → [legacy-mdeai.md](../../.claude/skills/task-verifier/references/legacy-mdeai.md)
- [x] **description** YAML — triggers IPI/SCR/forensic verify · negative trigger for trivial fixes
- [x] **SKILL.md size** — 277 → ~200 lines (mdeai traps moved to legacy ref)

### P1 — pending

- [ ] Sync [skill-map.md](../intelligence/ai/skill-map.md) with [index-skills.md](../../index-skills.md) (`design-to-production`, `pr-workflow`, drop archived `create-migration`)
- [ ] Add `design-to-production` parity % to Phase 8 report auto-table (manual for now via rubric)
- [ ] Wire Linear MCP wireframe check into probe script (optional `linear` filter)

### P2 — pending

- [ ] `evals/task-verifier-eval.yaml` — fixtures: SCR-01 spec, IPI-404 ship, bad spec
- [ ] Fold remaining mdeai-only refs in `openclaw-ocl.md` link targets (external repo)

---

## How to run verification (operator checklist)

Copy for each IPI/SCR Done gate:

### 0. Setup

```bash
cd /home/sk/ipix
bash .claude/skills/task-verifier/scripts/probe-disk-ipix.sh
bash .claude/skills/task-verifier/scripts/probe-disk-ipix.sh app
bash .claude/skills/task-verifier/scripts/probe-disk-ipix.sh supabase   # if DB/edge touched
```

### 1. Task-type (Phase 0)

| Step | Check | Pass |
|------|-------|:----:|
| Detect type | IPI / SCR / RF / BE / MOB / Audit | ☐ |
| Open router doc | [task-type-router-ipix.md](../../.claude/skills/task-verifier/references/task-type-router-ipix.md) | ☐ |
| Apply correct template | Not §1–10 on SCR | ☐ |

### 2. Source-of-truth (Phase 1)

| Step | Check | Pass |
|------|-------|:----:|
| `CLAUDE.md` | Hard rules respected | ☐ |
| `tasks/plan/todo.md` | Queue / priority aligned | ☐ |
| Linear spec md | AC present | ☐ |

### 3. Disk / MCP (Phase 2)

| Step | Probe | Pass |
|------|-------|:----:|
| Artifacts exist | `ls` / `rg` on changed paths | ☐ |
| Operator verify | `cd app && npm run lint && npm run typecheck && npm test` | ☐ |
| Build (if needed) | `cd app && npm run build` | ☐ |
| Supabase (if needed) | `infisical run -- npm run supabase:verify-rls` | ☐ |
| No client secrets | `rg GEMINI_API_KEY app/src` → 0 | ☐ |

### 4. Skills compliance (Phase 5b) — **new**

| Step | Check | Pass |
|------|-------|:----:|
| List required skills | SCR table / skill-map / frontmatter | ☐ |
| All exist on disk | `.claude/skills/<slug>/SKILL.md` | ☐ |
| Load proof | PR or session cites skill | ☐ |
| MUST audit | Per [skills-compliance-ipix.md](../../.claude/skills/task-verifier/references/skills-compliance-ipix.md) | ☐ |
| Forbidden combos | No dev+vercel-bp on tiny task | ☐ |
| **Skills score** | ___ /100 | ☐ |

### 5. Anti-fake-done (Phase 7)

| Gate | Pass |
|------|:----:|
| 1 Implementation on disk | ☐ |
| 2 Tests (`cd app && npm test`) | ☐ |
| 3 Lint + typecheck | ☐ |
| 4 Build (if applicable) | ☐ |
| 5 Supabase verify (if applicable) | ☐ |
| 6 Skills compliance table | ☐ |
| 7 PR hygiene (one concern, verify matrix) | ☐ |
| 8 Evidence path | ☐ |
| 9 Linear / spec sync | ☐ |
| 10 Zero 🔴 in report | ☐ |

### 6. Score & stop (Phases 8–9)

| Metric | Value |
|--------|------:|
| Spec quality /100 | |
| Execution readiness /100 | |
| Skills compliance /100 | |
| **Composite** | `0.35×spec + 0.40×exec + 0.25×skills` |
| Safe to execute? | Yes / No |

**Stop rule:** Any 🔴 → `"Not ready. These blockers must be fixed first: …"`

---

## Red flags — resolved vs open

| Sev | Finding | Status |
|-----|---------|--------|
| 🔴 | No skills compliance phase | ✅ Phase 5b |
| 🔴 | probe-disk mdeai-only | ✅ probe-disk-ipix.sh |
| 🔴 | anti-fake-done mdeapp-only | ✅ iPix 10 gates |
| 🔴 | Broken SKILL.md links | ✅ → legacy-mdeai.md |
| 🟡 | Description mdeai-first | ✅ iPix-first YAML |
| 🟡 | SCR false §6 failures | ✅ task-type router |
| 🟡 | No PR gate | ✅ gate 7 + pr-workflow ref |
| 🟡 | No composite % | ✅ rubric + report |
| 🟡 | skill-map stale | ⏳ P1 |
| 🟡 | Linear wireframe MCP | ⏳ P1 |

---

## Files touched (2026-07-06)

| File | Action |
|------|--------|
| `.claude/skills/task-verifier/SKILL.md` | Rewritten — iPix-first |
| `references/skills-compliance-ipix.md` | **Added** |
| `references/task-type-router-ipix.md` | **Added** |
| `references/legacy-mdeai.md` | **Added** |
| `references/anti-fake-done-checklist.md` | iPix-first rewrite |
| `references/task-spec-rubric.md` | iPix weights + composite |
| `scripts/probe-disk-ipix.sh` | **Added** |
| `tasks/skills/jul-6-task-verifier.md` | This doc |

---

## Original audit notes (archived)

<details>
<summary>Pre-implementation findings (2026-07-06 AM)</summary>

- Weighted iPix fit was **68%** — strong forensic method, weak skills enforcement
- Failure mode: checkbox skills without MUST probes
- Highest leverage: Phase 5b wired to `index-skills.md` + skill-map + per-skill MUST tables

</details>

---

## Next step

Run `@task-verifier` on **IPI-404 (SCR-08 Assets)** as first skills-aware verification using the checklist above — expect composite ~55→75+ after Phase 0 tables + wireframe probes filled.
