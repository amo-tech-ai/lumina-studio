# Phase 1 — Planning

Coordinator for **Linear-first** planning. Routes scoping to child skills; owns SPEC-ID traceability and issue description quality.

**Load:** [references/linear-issue-steps.md](references/linear-issue-steps.md) · [references/linear-spec-template.md](references/linear-spec-template.md) · [references/linear-prompt-engineering.md](references/linear-prompt-engineering.md)

---

## Entry / exit criteria

| | Criterion |
|---|---|
| **Entry** | New capability in [prd.md](../../../prd.md) / [mvp.md](../../../mvp.md) with no Linear spec, OR user asks to scope IPI-/PLT-/UI-/DNA-/COM- work, OR issue exists but lacks A–E steps + Gantt. |
| **Exit** | `docs/linear/issues/IPI-*-<SPEC-ID>.md` updated (or created) with acceptance criteria, wiring plan, verify block. Linear description has completion steps + Gantt. [todo.md](../../../todo.md) row exists or updated. |

---

## Workflow checklist

```
[ ] 1.  Read SPEC row in todo.md — confirm seq, blocked-by, MVP proof link.
[ ] 2.  Read matching docs/linear/issues/IPI-*.md (source of truth for wiring).
[ ] 3.  Read prd.md / mvp.md section for the SPEC-ID.
[ ] 4.  Route to child skill if scope ambiguous (routing table below).
[ ] 5.  Write the PROBLEM STATEMENT — what breaks today, concrete examples.
[ ] 6.  Write the USER STORY — single sentence: As / when / I see / so I can.
[ ] 7.  Draw ASCII wireframe (UI tasks) + states table (all 5 states).
[ ] 7b. Add Examples section (good/bad) for security, RLS, AI, or ambiguous API — see linear-prompt-engineering.md.
[ ] 8.  Add mermaid sequenceDiagram or flowchart for async/multi-actor flows.
[ ] 9.  Draft acceptance criteria A–E — each maps to a test type (vitest / smoke / verify).
[ ] 10. Add TECHNICAL NOTES — exact files to touch + explicit "Do NOT" antipatterns.
[ ] 11. Add OUT OF SCOPE — at least 2 explicit exclusions.
[ ] 12. Add Verify block — per-step proof commands ([per-task-testing](references/per-task-testing.md)).
[ ] 13. List Skills line (ipix-task-lifecycle + domain skills).
[ ] 14. Push description to Linear via mcp__linear-ipix__save_issue.
[ ] 15. Run validation checklist below.
[ ] 16. Hand off to research.md (Phase 2) or implementation.md if trivial + green-lit.
```

---

## Routing

| Need | Route to |
|------|----------|
| Explore intent / UX before specs | [brainstorming](../archive/brainstorming/SKILL.md) |
| Multi-step implementation plan | [writing-plans](../writing-plans/SKILL.md) |
| Multi-file feature, architecture | [feature-dev](../archive/feature-dev/SKILL.md) |
| MVP scope cuts, launch criteria | [mvp](../mvp/SKILL.md) |
| Full PRD from brief | [prd-template](references/prd-template.md) |
| Epic → feature PRD | [breakdown-feature-prd](../archive/brainstorming/breakdown-feature-prd/SKILL.md) |
| Repo / docs hygiene before large refactor | [lean](../lean/SKILL.md) |
| CLAUDE.md / glossary maintenance | [claude-md-improver](../archive/claude-md-improver/SKILL.md) |
| Linear step format / mermaid rules | [linear-issue-steps.md](references/linear-issue-steps.md) |
| Issue as agent prompt | [linear-prompt-engineering.md](references/linear-prompt-engineering.md) |
| Issue markdown structure | [linear-spec-template.md](references/linear-spec-template.md) |

### Planning decision tree

```
Ambiguous product intent
  └─ brainstorming → writing-plans

Large multi-file / architecture fork
  └─ feature-dev → writing-plans

MVP cut / launch scope
  └─ mvp

Linear issue already has A–E + Gantt + spec md
  └─ Skip Phase 1 → Phase 2 or 3

New PRD section needed first
  └─ prd-template → breakdown-feature-prd (if epic) → Linear spec
```

---

## Linear spec naming

```
docs/linear/issues/IPI-<n>-<SPEC-ID>.md
```

| Segment | Rule | Example |
|---------|------|---------|
| `IPI-<n>` | Linear issue number | `IPI-16` |
| `SPEC-ID` | Title prefix from issue | `PLT-003`, `UI-001`, `DNA-004` |
| Body sections | See [linear-spec-template.md](references/linear-spec-template.md) | AC, wiring plan, verify |

---

## Acceptance criteria rules

| Rule | Why |
|------|-----|
| ≤10 per issue | Forces shippable unit; split if larger |
| Observable / testable | "Works" fails; "Selecting IG Story shows 1080×1920 · 9:16 inline" passes |
| One verb per criterion | Compound criteria hide failures |
| Maps to wiring plan | Every AC → ≥1 file row |
| Five UI states | loading · error · empty · success · unknown/not-found |
| Plain language in Linear steps | Operator/Engineer personas — see linear-issue-steps.md |
| Problem before solution | Every issue must start with WHAT BREAKS TODAY, not what to build |
| Wireframe before AC | Draw the screen before writing ACs — ACs fall out of the wireframe naturally |
| Technical notes required | Name exact files + explicit "Do NOT" — prevents wrong-tool usage in impl |
| Out of scope required | ≥2 explicit exclusions — prevents scope creep during implementation |
| Prompt clarity | No OR in security/auth AC; blockedBy matches cross-issue AC |
| Examples (multishot) | Good/bad snippets for RLS/AI/API; wireframe+states for UI |
| Proof on every step | Each A–E checkbox ends with `proof:` command or smoke note |

---

## Dependency rules

| Rule | Detail |
|------|--------|
| `Blocked by` / `Unblocks` | Required in Linear description + spec md |
| Platform order | Follow [todo.md](../../../todo.md) seq — e.g. PLT-003 before AI-001 |
| Migrations before UI | Schema + RLS before hooks/components that query |
| Edge fn before client | Deploy + verify edge before Next.js client calls it |
| No cycles | If A blocks B and B blocks A, replan |

---

## Milestone vs issue vs spec

| Concept | Granularity | Lives in |
|---------|-------------|----------|
| MVP proof | End-user outcome | [mvp.md](../../../mvp.md) |
| SPEC-ID | One shippable platform unit | Linear issue + `docs/linear/issues/` |
| Sub-step | Checkbox inside A–E block | Linear description |
| Commerce track | COM-* on Mercur | Separate from Supabase platform |

Never merge or split mid-implementation — update Linear + spec md first.

---

## Validation checklist

```
[ ] SPEC-ID in issue title matches todo.md row
[ ] docs/linear/issues/IPI-*.md exists and links to Linear URL
[ ] PROBLEM STATEMENT present — concrete examples of what breaks today
[ ] USER STORY present — As / when / I see / so I can (single sentence)
[ ] ASCII wireframe present (UI tasks) — shows actual screen layout
[ ] States table present — all 5 states: empty · loading · success · unknown · error
[ ] mermaid sequenceDiagram or flowchart for any async/multi-actor flow
[ ] Each AC maps to vitest, smoke, or verify script
[ ] Linear steps A–E each have a proof command (test output or smoke note)
[ ] TECHNICAL NOTES — exact files to touch + at least one "Do NOT" antipattern
[ ] OUT OF SCOPE — at least 2 explicit exclusions
[ ] Wiring plan lists Create/Modify per file path
[ ] Completion steps A–E with proof per step
[ ] Skills line lists domain skills (ipix-supabase, gemini, etc.)
[ ] Blocked by / Unblocks accurate vs todo.md
[ ] No TBD anywhere in the issue
[ ] Prompt lint passed — see linear-prompt-engineering.md validation checklist
[ ] blockedBy in Linear matches any AC that depends on another issue
[ ] todo.md dot/status reflects planning state (🟡 or ⚪)
```

---

## Escalation

| Situation | Route to |
|-----------|----------|
| No PRD section for initiative | [prd-template](references/prd-template.md) → Linear spec |
| Architecture diagram for stakeholders | [mermaid-diagrams](../mermaid-diagrams/SKILL.md) |
| Roadmap / milestone reshuffle | [todo.md](../../../todo.md) + [docs/linear/linear-plan.md](../../../docs/linear/linear-plan.md) |
| Forensic verify before marking planned | [task-verifier](../task-verifier/SKILL.md) |

Hand off to [research.md](research.md) once spec + Linear steps exist.
