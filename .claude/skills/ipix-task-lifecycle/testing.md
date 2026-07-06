# Phase 4 — Testing

Aggregate verification after Phase 3. **Per-task tests already ran in Phase 3** —
this phase confirms full-matrix coverage and captures ship evidence.

Matrix: [references/testing-matrix.md](references/testing-matrix.md) · per-task contract:
[references/per-task-testing.md](references/per-task-testing.md).

---

## Entry / exit criteria

| | Criterion |
|---|---|
| **Entry** | All plan tasks complete. Each task's `Test` command passed in Phase 3. |
| **Exit** | Aggregate gates pass. Smoke evidence captured. Linear verify checkboxes ready for Phase 5. |

---

## Required gates (iPix platform)

```bash
cd app && npm run lint && npm run typecheck && npm test
cd app && npm run build    # if routes/config/schema changed
```

From repo root (when touched):

```bash
infisical run -- npm run supabase:verify
infisical run -- npm run supabase:verify-rls    # migration / RLS
npm run supabase:verify-edge                     # edge fn
```

**Browser smoke (auth/UI):** `cd app && npm run dev` → `http://localhost:3002` → login → target route · four states.

Record evidence in issue spec verify section or Linear step proofs.

---

## Workflow checklist

```
[ ] 1.  Confirm Phase 3 per-task Test log — every task has PASS proof.
[ ] 2.  Map each AC to matrix row (below); fill gaps if any AC lacks a test.
[ ] 3.  cd app && npm test — full suite, no new failures vs main.
[ ] 4.  Run Supabase verify scripts per change shape.
[ ] 5.  Manual browser smoke for UI/auth flows not covered by Vitest.
[ ] 6.  Capture proof strings for Linear steps (counts, status codes).
[ ] 7.  Optional: task-verifier on spec md before Done.
[ ] 8.  Any gate fails → loop to implementation.md (identify failing task).
[ ] 9.  Hand off to shipping.md.
```

---

## Test type matrix

| Change shape | Per-task (Phase 3) | Aggregate (Phase 4) |
|--------------|-------------------|---------------------|
| Hook / service / util | Vitest per task | `npm test` full suite |
| React component | Vitest + RTL per task | smoke + full suite |
| Page / route | Vitest + smoke per task | browser smoke 375px + 1280px |
| Edge function | verify-edge per fn task | verify-edge + invoke |
| Migration + RLS | verify-rls per migration task | verify-rls + advisors |
| AI prompt / schema | manual eval in task notes | ≥5 cases logged |

Full matrix: [references/testing-matrix.md](references/testing-matrix.md).  
Vitest authoring: [gen-test](../gen-test/SKILL.md).

---

## Validation hierarchy

```
0. per-task Test commands (Phase 3) — already green
1. cd app && npm run lint
2. cd app && npm run typecheck
3. cd app && npm test
4. supabase:verify (+ rls / edge as needed)
5. cd app && npm run build (if applicable)
6. browser smoke
```

Stop at first failure; fix in Phase 3 at the task that regressed.

---

## Failure triage

1. Identify which **task** introduced the failure (git bisect or plan order).
2. Re-run that task's Vitest command in isolation.
3. Classify: test wrong → fix test; code wrong → Phase 3; flake → stable wait/assert.
4. Never `it.skip` without follow-up IPI issue.

---

## Routing

| Need | Route to |
|------|----------|
| Per-task contract | [references/per-task-testing.md](references/per-task-testing.md) |
| Matrix details | [references/testing-matrix.md](references/testing-matrix.md) |
| Test authoring | [gen-test](../gen-test/SKILL.md) |
| Forensic Done gate | [task-verifier](../task-verifier/SKILL.md) |

Hand off to [shipping.md](shipping.md) when gates green.
