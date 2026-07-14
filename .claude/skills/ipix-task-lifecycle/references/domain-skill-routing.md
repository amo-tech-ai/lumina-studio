---
title: Domain skill routing (Phase 1 mandatory)
impact: HIGH
tags: ipix-task-lifecycle, skills, planning, IPI
---

# Domain skill routing

When **creating or enriching** any IPI task, declare and **load** the domain skills from `.claude/skills/` before writing acceptance criteria. Skills are not decoration — they are the implementation contract.

**Always start with:** `ipix-task-lifecycle` (this orchestrator).

**Task-specific map (when IPI row exists):** [`tasks/intelligence/ai/skill-map.md`](../../../../tasks/intelligence/ai/skill-map.md)

**If `Skill("slug")` fails:** `Read` `.claude/skills/<slug>/SKILL.md` directly — disk is authoritative.

---

## Phase 1 workflow (skills)

```
[ ] 1. Classify task domain (table below) + changed paths
[ ] 2. Pick required skills — merge skill-map row + path heuristics
[ ] 3. Read each skill's SKILL.md (full file, not memory)
[ ] 4. Copy MUST rules into Technical notes / Do NOT
[ ] 5. Write **Skills:** line in spec md + Linear description
[ ] 6. Map each AC + A–E step proof to a skill verify command
[ ] 7. task-verifier Phase 5b will re-check skills on Done
```

---

## Path heuristics (auto-add skills)

| Changed paths / topic | Required skill(s) | Also load when |
|----------------------|-------------------|----------------|
| `app/src/mastra/**` | **mastra** | gemini (if LLM), copilotkit (if agent UI) |
| `app/src/app/api/copilotkit/**` · CopilotKit UI | **copilotkit** | mastra (if agents), nextjs-developer |
| `supabase/migrations/**` · `supabase/schemas/**` | **ipix-supabase** | task-verifier (RLS) |
| `supabase/functions/**` | **ipix-supabase** · **gemini** (if AI) | gen-test / verify-edge |
| `app/src/app/**` · operator UI | **nextjs-developer** | frontend-design, shadcn (components) |
| New/changed UI surface | **design-md** · **frontend-design** | ipix-wireframe, claude-design-handoff |
| DC HTML → React parity | **design-to-production** · claude-design-handoff | vercel-react-best-practices |
| Cloudinary URLs / uploads | **cloudinary** | ipix-supabase (metadata) |
| `my-marketplace/**` · checkout | **mercur** | ipix-supabase (product links) |
| Shoot / campaign / shot list | **fashion-production** | cloudinary, fashion-production refs |
| Brand crawl / Firecrawl | **firecrawl** | ipix-supabase, gemini |
| Secrets / env / Infisical | **infisical** | pr-workflow (never commit `.env`) |
| Multi-step implementation | **worktrees** | pr-workflow |
| Graph / blast radius | **graphify** | feature-dev (if >5 files) |
| Linear issue hygiene | **linear** | mermaid-diagrams (diagrams in issue) |
| Done gate / ship | **task-verifier** · **pr-workflow** | — |

---

## Domain quick-pick (by task type)

| Task type | Minimum **Skills:** line |
|-----------|--------------------------|
| Mastra agent / tool / workflow | `ipix-task-lifecycle` · `mastra` · `gemini` · `worktrees` · `pr-workflow` |
| CopilotKit runtime / chat shell | `ipix-task-lifecycle` · `copilotkit` · `mastra` · `nextjs-developer` |
| Supabase migration + RLS | `ipix-task-lifecycle` · `ipix-supabase` · `worktrees` · `task-verifier` |
| Edge function (AI) | `ipix-task-lifecycle` · `ipix-supabase` · `gemini` · `worktrees` |
| Operator page (new route) | `ipix-task-lifecycle` · `design-md` · `nextjs-developer` · `frontend-design` · `ipix-wireframe` |
| DNA / asset scoring | `ipix-task-lifecycle` · `gemini` · `ipix-supabase` · `cloudinary` |
| Commerce / Mercur | `ipix-task-lifecycle` · `mercur` · `ipix-supabase` |
| Platform hygiene / refactor | `ipix-task-lifecycle` · `lean` · `worktrees` · `graphify` |

Add `gen-test` when new behavior needs Vitest. Add `vercel-react-best-practices` for perf-sensitive UI (not together with `nextjs-developer` on tiny polish — pick one primary).

---

## **Skills:** line format (Linear + spec md)

Put in file header and Linear description block A (Scope):

```markdown
**Skills:** ipix-task-lifecycle · mastra · gemini · worktrees · pr-workflow
```

Rules:

- Always include `ipix-task-lifecycle` for executable IPI work
- Use skill **slug** (directory name), not `@` mentions — agents resolve via `Read`
- List **required** skills only; optional skills go in Technical notes ("Also consult … if …")
- Every listed skill must have ≥1 AC or step whose `proof:` comes from that skill's verify pattern

---

## What to pull from each skill

| After reading SKILL.md | Copy into issue |
|----------------------|-----------------|
| Hard rules / MUST NOT | **Do NOT** in Technical notes |
| Verify commands | `proof:` on A–E steps |
| File path conventions | Wiring plan rows |
| Known gotchas | Examples (good/bad) for RLS/AI |
| MCP cadence | Research notes (Phase 2) |

---

## Forbidden / pick-one (from skill-map)

| Do not | Do instead |
|--------|------------|
| Load `nextjs-developer` + `vercel-react-best-practices` on small polish | Pick one primary |
| Load archived `nextjs-*` skills | `nextjs-developer` or `vercel-react-best-practices` |
| Client-side Firecrawl / Gemini keys | Edge or `app/src/mastra/` only |
| Skip `ipix-supabase` on any migration | RLS + verify-rls mandatory |

---

## Cross-references

| Resource | Path |
|----------|------|
| Task → skill inventory | [`tasks/intelligence/ai/skill-map.md`](../../../../tasks/intelligence/ai/skill-map.md) |
| Skills compliance (Done gate) | [task-verifier § Phase 5b](../../task-verifier/references/skills-compliance-ipix.md) |
| Spec template header | [linear-spec-template.md](linear-spec-template.md) |
| Phase 1 coordinator | [planning.md](../planning.md) |
| Phase 3 implement routing | [implementation.md](../implementation.md) |
| Skill index | [`index-skills.md`](../../../index-skills.md) |
