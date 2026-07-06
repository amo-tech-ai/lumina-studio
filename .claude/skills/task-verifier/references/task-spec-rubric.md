# Task spec rubric (task-verifier)

Score **before execution** (spec quality) and **after** (execution readiness).

## Letter grades

| Grade | Spec score | Execution readiness |
|---|---:|---:|
| A | 90–100 | 90–100, zero blockers |
| B | 80–89 | 80–89 |
| C | 70–79 | 70–79 |
| D | 60–69 | 60–69 |
| F | &lt;60 | &lt;60 or any unresolved 🔴 blocker |

**Execution readiness** = spec score minus blocker penalties (−15 per unresolved 🔴, cap 0). With open spec blockers, readiness max **70** until patched.

---

## iPix spec quality (100 pts)

| Dimension | Weight | What to check |
|-----------|-------:|---------------|
| Source-of-truth alignment | 15 | `CLAUDE.md`, `tasks/plan/todo.md`, Linear spec |
| Disk/MCP accuracy | 25 | [verifier-probes-ipix.md](./verifier-probes-ipix.md) · probe script |
| DoD provability | 20 | AC → command + expected; area matrix |
| **Skills compliance** | **20** | [skills-compliance-ipix.md](./skills-compliance-ipix.md) Phase 5b |
| Template / contract | 10 | [task-type-router-ipix.md](./task-type-router-ipix.md) — IPI vs SCR vs audit |
| Security / PR hygiene | 10 | RLS, no client secrets, one-concern-per-PR |

### Composite (iPix ship gate)

```
composite = 0.35 × spec + 0.40 × execution_readiness + 0.25 × skills_compliance
```

| Composite | Verdict |
|----------:|---------|
| ≥85 | Safe to execute / merge-ready |
| 70–84 | Proceed with documented 🟡 |
| &lt;70 | 🛑 Not ready |

### DESIGN V2 parity (UI tasks)

Add to report when `design-to-production` applies:

| Parity | Meaning |
|--------|---------|
| 90–100% | Ship-ready visual match |
| 75–89% | Ship with documented gaps |
| &lt;75 | 🔴 or explicit waiver in PR |

---

## Audit documents (100 pts)

| Dimension | Weight |
|-----------|-------:|
| Claim → probe coverage | 35 |
| Link integrity | 15 |
| Stale vs disk | 25 |
| Actionable fixes ranked | 15 |
| Skills / SSOT alignment | 10 |

---

## Legacy mdeai extras

For `tasks/core/F*.md`, OpenClaw, CTI — use original weights:

| Dimension | Weight |
|-----------|-------:|
| Source-of-truth | 20 |
| Disk/MCP | 25 |
| DoD provability | 25 |
| Template §1–10 | 15 |
| Security | 15 |

### Mastra port pack (F13–F20) — −10 each if missing

See [legacy-mdeai.md](./legacy-mdeai.md).

---

## Dependency slug normalization (legacy)

| INDEX slug | Canonical file |
|------------|----------------|
| `F09-supp` | `F09-floor-script-and-vitest.md` |
| `F09` | `F09-floor-script-and-vitest.md` |

---

## Persona / user impact line

One sentence: who notices the change on which surface (`/app`, operator panel, edge fn, etc.).
