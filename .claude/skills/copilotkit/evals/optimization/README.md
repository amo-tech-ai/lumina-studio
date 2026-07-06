# Description optimization (2026-07-01)

Eval sets: `trigger-eval.json` (20 queries — 10 should-trigger, 10 near-miss negatives).

## run_loop results

| Skill | Baseline test/train | Iterations improved | Notes |
|-------|--------------------|--------------------|-------|
| `copilotkit` | 4/8 · 6/12 | 0 | `claude -p` eval did not beat baseline — descriptions hand-tuned from failed triggers |
| `ipix-task-lifecycle` | 4/8 · 6/12 | 0 | Same — applied pushy description + negative triggers manually |

Failed **should-trigger** cases informed manual edits:

**copilotkit:** 401 `/info`, `useFrontendTool` not firing, agentId mismatch, SSE RunStarted hang

**ipix-task-lifecycle:** implement IPI-* with full PR path, ship/close Linear, forensic verify

Re-run after description change:

```bash
cd .claude/skills/skill-creator
python3 -m scripts.run_loop \
  --eval-set ../copilotkit/evals/trigger-eval.json \
  --skill-path ../copilotkit \
  --model sonnet --max-iterations 3 --runs-per-query 3 \
  --report none --results-dir ../copilotkit/evals/optimization
```
