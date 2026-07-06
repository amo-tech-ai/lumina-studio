---
name: writing-plans
description: >
  Write bite-sized implementation plans for iPix multi-step tasks before touching code.
  Use after brainstorming or when a Linear spec exists and you need a task-by-task plan
  with exact file paths, verify commands, and worktree branch. Triggers: "implementation
  plan", "break this into tasks", "how do we build this", post-design handoff from
  brainstorming. Do NOT use for one-line fixes or when issue already has complete A–E steps.
---

# Writing Plans (iPix)

Write implementation plans assuming the engineer has zero codebase context. Document files,
commands, and verification. DRY. YAGNI. Frequent commits — one concern per PR.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

**Context:** Run in a dedicated worktree (`ipi/<task-id>-<slug>` per `worktrees` skill).

**Save plans to:** `docs/plan/tasks/YYYY-MM-DD-<feature-name>.md`

## Plan Document Header

Every plan MUST start with this header:

```markdown
# [Feature Name] Implementation Plan

**Linear:** IPI-NNN · SPEC-ID
**Goal:** [One sentence]
**Architecture:** [2-3 sentences]
**Tech stack:** Next.js `app/` · Supabase · [edge/Mastra/Gemini if applicable]

**Verify (app changes):**
```bash
cd app && npm run lint && npm run typecheck && npm test
# if route/config/schema: npm run build
```
**Verify (Supabase):** `infisical run -- npm run supabase:verify-rls`

---
```

## Bite-Sized Task Granularity

Each step is one action (2–5 minutes). **Every task includes a Test block** — see
[per-task-testing](../ipix-task-lifecycle/references/per-task-testing.md).

Loop: write failing test → confirm fail → implement → confirm pass → next task.

## Task Structure

**Every task MUST include `Maps to AC`, `Test`, and numbered steps.**

````markdown
### Task N: [Component Name]

**Maps to AC:** [criterion — observable outcome]

**Files:**
- Create: `app/src/exact/path.tsx`
- Modify: `app/src/existing.tsx:123-145`
- Test: `app/src/exact/path.test.tsx`

**Test:**
- Type: vitest
- Command: `cd app && npx vitest run src/exact/path.test.tsx -t "behaviour"`
- Pass when: [expected assertion or output]

**Step 1: Write the failing test**

```typescript
// vitest + @testing-library/react — see gen-test skill
```

**Step 2: Run test — confirm FAIL**

```bash
cd app && npx vitest run src/exact/path.test.tsx -t "behaviour"
```

**Step 3: Minimal implementation**

**Step 4: Run test — confirm PASS**

**Step 5: Typecheck**

```bash
cd app && npm run typecheck
```

**Step 6: Commit** (only when user asks)
````

### Tasks without Vitest

Use `Type: smoke` or `Type: verify-rls` with exact command and pass criteria. Never omit `Test`.

## iPix rules (embed in every plan)

- Branch: `ipi/<task-id>-<slug>` · worktree before code
- One Linear issue per PR · no mixed concerns
- No secrets client-side · RLS on every new table
- Canonical app: `app/` not root `src/`
- After migration: `npm run supabase:types`

## Remember

- Exact file paths always
- Complete code snippets in plan (not "add validation")
- Exact commands with expected output
- Reference skills: `ipix-task-lifecycle`, `gen-test`, `ipix-supabase`

## Execution Handoff

After saving the plan, offer:

1. **This session** — implement task-by-task via `/task IPI-NNN` or `ipix-task-lifecycle` Phase 3
2. **New session** — open worktree, load plan from `docs/plan/tasks/`, run verification gates

Default to `ipix-task-lifecycle` Phase 3 for iPix work — no external superpowers skills.
