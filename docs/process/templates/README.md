# iPix Linear Task Template (reusable)

**SSOT for paste into Linear + `docs/linear/issues/IPI-*.md`.**  
**Agents:** load via `ipix-task-lifecycle` Phase 1 · mirrors [linear-spec-template](../../.claude/skills/ipix-task-lifecycle/references/linear-spec-template.md).

## Research (before this template)

| Source | Takeaway |
|--------|----------|
| Existing iPix | `linear-issue-steps.md` + `linear-prompt-engineering.md` already treat issues as agent prompts (AC, A–E, `proof:`) |
| Sample issue | `docs/linear/issues/IPI-536-PLN-009-milestone-tracking.md` — strong A–E, weak purpose/MVP/platform-first |
| Linear docs | Team templates + placeholders ([issue templates](https://linear.app/docs/issue-templates)); set as **IPI team default** |
| GitHub | Agent-ready tickets need: testable AC, file paths, non-goals, definition of done (e.g. [b-open-io issue-template](https://github.com/b-open-io/prompts/blob/master/skills/linear-planning/references/issue-template.md)) |
| Platform-first | Dashboard/CLI before custom — same ladder as Cloudflare/Mastra plans in-repo |

**Install in Linear:** Team **IPI** → Settings → Templates → New → paste [linear-issue-body.md](./linear-issue-body.md) → set default for members.

---

## Title format (required)

```text
IPI-NNN · TASK-ID — Real-world operator title
```

| ❌ | ✅ |
|----|----|
| Fix embeddings | IPI-492 · CF-AI-004c — Clear errors when brand-matching embeddings fail |
| Add RLS | IPI-727 · SB-RLS-012 — Block cross-brand shoot draft commits |

---

## Quality gate (fill before coding)

| Check | Y/N |
|-------|-----|
| Required for launch / operators? | |
| Moves Core MVP or clears a Launch Blocker? | |
| Duplicate of another IPI? | |
| Simpler Dashboard/CLI/SDK exists? | |
| Reuses existing iPix code? | |
| Parallel OK with sibling tasks? | |
| Blockers / failure points named? | |

**Scores (1–5):** Priority __ · Complexity __ · Risk __ · User value __ · Launch value __  
**MVP stage:** Core · Launch Blocker · Post-MVP · Advanced

Defer if Launch value ≤2 and stage is Advanced, or if a platform feature already solves it.

---

## Platform-first order (every task)

```text
Dashboard → CLI → Existing iPix code → Official docs → SDK/module
  → GitHub examples → Templates/recipes → Smallest custom code
  → Tests → Browser verification → PR
```

---

## Copy-paste body

Use **[linear-issue-body.md](./linear-issue-body.md)** (Linear description + spec md).

## Filled example

See **[linear-task-example.md](./linear-task-example.md)** (DNA chip / Assets — illustrative).
