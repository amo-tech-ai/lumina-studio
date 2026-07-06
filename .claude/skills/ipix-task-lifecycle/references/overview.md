# ipix-task-lifecycle

Five-phase orchestrator for iPix platform work: **plan → research → implement → test → ship**.

## Discovery

```
.claude/skills/ipix-task-lifecycle/SKILL.md   ← hub (start here)
```

## Phase modules (read one at a time)

| Phase | File |
|-------|------|
| 1 Plan | [planning.md](../planning.md) |
| 2 Research | [research.md](../research.md) |
| 3 Implement | [implementation.md](../implementation.md) |
| 4 Test | [testing.md](../testing.md) |
| 5 Ship | [shipping.md](../shipping.md) |

## Child skills

| Child | Purpose |
|-------|---------|
| [brainstorming](../../archive/brainstorming/SKILL.md) | Intent / design exploration |
| [writing-plans](../../writing-plans/SKILL.md) | Implementation plan |
| [mvp](../../mvp/SKILL.md) | Scope cuts |
| [prd-template](prd-template.md) | Full PRD |
| [breakdown-feature-prd](../../archive/brainstorming/breakdown-feature-prd/SKILL.md) | Epic → PRD |
| [lean](../../lean/SKILL.md) | Repo / docs hygiene |
| [feature-dev](../../archive/feature-dev/SKILL.md) | Multi-file architecture |

## Sibling skills

| Skill | When |
|-------|------|
| [claude-md-improver](../../archive/claude-md-improver/SKILL.md) | CLAUDE.md + glossary |
| [task-verifier](../../task-verifier/SKILL.md) | Forensic Done gate |
| [mermaid-diagrams](../../mermaid-diagrams/SKILL.md) | Linear diagrams |
| [ipix-supabase](../../ipix-supabase/SKILL.md) | Schema, RLS, edge |

## References

| File | Contents |
|------|----------|
| [linear-issue-steps.md](linear-issue-steps.md) | A–E steps, gantt, personas |
| [linear-prompt-engineering.md](linear-prompt-engineering.md) | Issues as agent prompts — examples, proof, lint |
| [linear-spec-template.md](linear-spec-template.md) | Issue markdown shape |
| [prd-template.md](prd-template.md) | PRD structure |
| [per-task-testing.md](per-task-testing.md) | Test per plan task |
| [migration-safety.md](migration-safety.md) | Supabase migrations |
| [audit-checklist.md](audit-checklist.md) | Phase 2 forensic |
| [testing-matrix.md](testing-matrix.md) | Test routing |
| [verifier-probes-ipix.md](verifier-probes-ipix.md) | task-verifier hooks |
| [mcp-cadence-ipix.md](mcp-cadence-ipix.md) | Supabase MCP usage |
| [shipping-templates.md](shipping-templates.md) | todo / commit templates |

## Trackers

- [docs/plan/todo.md](../../../docs/plan/todo.md) — master backlog
- [docs/linear/issues/](../../../docs/linear/issues/) — spec source of truth
- [supabase/README.md](../../../supabase/README.md) — remote DB ops
