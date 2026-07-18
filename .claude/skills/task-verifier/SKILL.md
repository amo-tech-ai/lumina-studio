---
name: task-verifier
description: >
  Forensic verifier for iPix Linear issues (IPI-*), DESIGN V2 screen specs (SCR-*),
  audit reports, and legacy mdeai F*.md tasks. Use whenever the user asks to "verify a task",
  "is this safe to execute", "audit the audit", "did this really ship", "check if X is done",
  "forensic verify", or before flipping In Progress → Done. Gates specs through task-type
  router + skills compliance (Phase 5b) + disk/MCP probes. Score with task-spec-rubric.md
  (spec, execution readiness, skills compliance, composite %). Prove every claim against disk,
  node_modules, and MCPs — never trust a status field. NOT for one-line typo fixes or
  explain-only questions without a Done gate. Supports **Quick gate** (merge safety, small fixes)
  and **Full verify** (Done gates, releases, security) — see quick-gate.md.
---

# task-verifier — forensic gate before any "Done"

> **Planning is not complete until you can prove the task is safe to execute, skills were followed, and outcomes are verifiable.** Fails closed.

## Quick vs Full

| Mode | When | Protocol |
|------|------|----------|
| **Quick** | Merge safety · small fixes · docs · ops triage · `@task-verifier quick` | [references/quick-gate.md](references/quick-gate.md) — 1–3 probes, compact report |
| **Full** | `In Progress → Done` · production release · security · `@task-verifier full` | Phases 0–10 below — rubric sub-scores + all 10 anti-fake-done gates |

Default when mode unspecified: **Quick** (router may escalate). Any 🔴 in Quick → stop or escalate to Full.

## When this skill fires

- Verify IPI / SCR / RF / BE / MOB / audit / legacy F* tasks
- Before `In Progress → Done` on Linear or task md → **Full** mandatory
- New spec or audit doc quality gate → **Full**
- Merge safety / small fix / status check → **Quick**

If none of the above — do not invoke.

## Evidence symbols

| Symbol | Meaning |
|--------|---------|
| ✅ | Verified this run (cite probe) |
| 🔴 | Blocker — not safe |
| 🟡 | Fix before Done; may execute |
| ⚪ | N/A |
| ⏭️ | Pending external |

Memory and `status:` fields are **not** evidence. Re-probe.

---

## iPix resources

| Resource | Path |
|----------|------|
| Quick gate | [references/quick-gate.md](references/quick-gate.md) |
| Task-type router | [references/task-type-router-ipix.md](references/task-type-router-ipix.md) |
| Skills compliance (5b) | [references/skills-compliance-ipix.md](references/skills-compliance-ipix.md) |
| Disk probes | [references/verifier-probes-ipix.md](references/verifier-probes-ipix.md) |
| Probe script | `bash .claude/skills/task-verifier/scripts/probe-disk-ipix.sh [app\|supabase\|skills\|git]` |
| MCP cadence | [references/mcp-cadence-ipix.md](references/mcp-cadence-ipix.md) |
| Anti-fake-done | [references/anti-fake-done-checklist.md](references/anti-fake-done-checklist.md) |
| Rubric | [references/task-spec-rubric.md](references/task-spec-rubric.md) |
| Skill map | `tasks/intelligence/ai/skill-map.md` · `index-skills.md` |
| Legacy mdeai | [references/legacy-mdeai.md](references/legacy-mdeai.md) |

**DESIGN-* / IPI-*:** skills per map · Linear steps · wireframe in Linear if UI · `@task-verifier` before Done · [linear-issue-steps.md](../ipix-task-lifecycle/references/linear-issue-steps.md).

---

## Verification protocol (Full)

For **Quick gate**, use [quick-gate.md](references/quick-gate.md) instead of Phases 0–10.

Run Full protocol in order. Stop at first 🔴 unless running a full audit report.

### Phase 0 — Task-type router

Load [task-type-router-ipix.md](references/task-type-router-ipix.md). Detect **IPI | SCR | RF | BE | MOB | Audit | Legacy F***. Apply matching template — **do not** require ipix-task-lifecycle §1–10 on SCR specs.

### Phase 1 — Source-of-truth

Priority (higher wins):

1. `CLAUDE.md`
2. `prd.md` + `mvp.md`
3. `tasks/plan/todo.md` (not root `todo.md`)
4. `docs/linear/issues/IPI-*.md`
5. Domain skills under `.claude/skills/`

Legacy mdeai only: [legacy-mdeai.md](references/legacy-mdeai.md).

Output: conflicts resolved, stale refs listed.

### Phase 2 — Current-state verification (iPix)

**Never trust prior status.** Run `probe-disk-ipix.sh` + probes from [verifier-probes-ipix.md](references/verifier-probes-ipix.md).

| Claim | Probe |
|-------|-------|
| File / route | `ls` / `rg` on `app/src/app/` |
| Operator scripts | `cd app && npm run lint \| test \| build` |
| Supabase | `infisical run -- npm run supabase:verify*` |
| No client AI keys | `rg GEMINI_API_KEY app/src` → 0 |
| Edge fn | `ls supabase/functions/<name>/` + MCP list |
| Migration | `ls supabase/migrations/` + MCP list_migrations |

Log every probe + result in the report.

Legacy mdeapp probes: [legacy-mdeai.md](references/legacy-mdeai.md) · `scripts/probe-disk.sh`.

### Phase 3 — Dependency validation

- IPI/SCR: Linear `blockedBy`, md dependencies, `tasks/plan/todo.md` order
- Legacy F*: `depends_on:` resolves under `tasks/core/` · INDEX sync

### Phase 4 — Scope validation

Classify **MVP / Core / Advanced / Deferred**. Reject undeferred scope creep. Vite `src/` = legacy — no new features per IPI-89.

### Phase 5 — MCP / docs validation

Use MCP cadence doc. Beta APIs: verify shape in `node_modules/` — never training data alone.

### Phase 5b — Skills compliance (required iPix)

Run [skills-compliance-ipix.md](references/skills-compliance-ipix.md):

1. Declare skills (frontmatter · SCR table · skill-map)
2. Exist on disk
3. Load proof
4. MUST audit per changed paths
5. Forbidden combos
6. Conflicts vs CLAUDE.md

Output: skills table + **skills compliance score /100**. Any 🔴 MUST → blocker.

### Phase 6 — Task file quality gate

| Type | Gate |
|------|------|
| **IPI** | AC provable · evidence path · Phase 5b skills |
| **SCR** | DoR · Phase 0 tables · skill routing · wireframe paths |
| **Legacy F*** | Sections 1–10 · frontmatter per ipix-task-lifecycle |
| **Audit** | Claims → probes · links resolve |

### Phase 7 — Anti-fake-done

[iPix checklist](references/anti-fake-done-checklist.md) — all 10 gates with probes. Refuse Done if any fails.

### Phase 8 — Verification report (required)

```markdown
## Verification report — <date> · <auditor>

| Task | Spec /100 | Execution /100 | Skills /100 | Composite | Blockers | Safe? |
|------|----------:|---------------:|------------:|----------:|----------|-------|
| IPI-404 | 88 | 72 | 80 | 79 | 0 | Yes* |

### Skills compliance
| Skill | Required | On disk | MUSTs | Failures |
|-------|:--------:|:-------:|:-----:|----------|

### Red flags
| Flag | Sev | Evidence |

### Failure points (pre-mortem)
- ...

### Claims verified / not verified / stale
- ...

### Commands before / after execution
1. ...

### Stop condition
- "✅ Safe to execute." — ZERO 🔴
- "🛑 Not ready. Blockers: ..."
```

**Composite:** `0.35×spec + 0.40×execution + 0.25×skills` ([rubric](references/task-spec-rubric.md)).

### Phase 9 — Stop condition (hard rule)

Any 🔴 across phases → output verbatim:

> "Not ready. These blockers must be fixed first: \<list\>"

Never false-positive "Safe to execute."

### Phase 10 — Tone

Tables over prose. No "looks good!" Cite probe for every ✅.

---

## iPix trap list (quick)

| Trap | Probe |
|------|-------|
| Root `todo.md` | Use `tasks/plan/todo.md` |
| New code in `src/` | Retired — use `app/` |
| `enrich-brand` | → `brand-intelligence` |
| Client Firecrawl SDK | Edge only |
| CopilotKit v1 | `rg copilotkit/react-core/v2` |
| `Skill()` Unknown | `Read` skill file directly |
| Docs + code same PR | Split — pr-workflow |
| SCR missing Phase 0 | 🔴 at implement time |

Full mdeai traps: [legacy-mdeai.md](references/legacy-mdeai.md).

---

## Files

| File | Purpose |
|------|---------|
| `SKILL.md` | Full protocol + routing |
| `references/quick-gate.md` | Quick gate (merge safety, ops triage) |
| `scripts/probe-disk-ipix.sh` | iPix disk probes |
| `scripts/probe-disk.sh` | Legacy mdeai |
| `references/skills-compliance-ipix.md` | Phase 5b |
| `references/task-type-router-ipix.md` | Phase 0 |
| `references/verifier-probes-ipix.md` | IPI-specific probes |
| `references/mcp-cadence-ipix.md` | MCP map |
| `references/task-spec-rubric.md` | Scoring |
| `references/anti-fake-done-checklist.md` | DoD gates |
| `references/legacy-mdeai.md` | F* / OpenClaw / mdeapp |
