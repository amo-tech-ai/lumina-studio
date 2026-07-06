# Skills audit — P0 corrections (2026-07-06)

**Status:** P0 link + frontmatter fixes **applied** in working tree.

---

## Grade (post-fix)

| Dimension | Before | After |
|-----------|-------:|------:|
| Link integrity | 78 | **96** |
| Frontmatter slug match | 97 | **100** |
| Catalog accuracy (index) | 60 | 85 *(index updated 2026-07-06 AM; skill-map P1 pending)* |
| **Overall inventory** | **B+ (81)** | **A- (92)** |

---

## P0 fixes — checklist

| # | Skill | Problem | Fix | Status |
|---|-------|---------|-----|:------:|
| 1 | `mercur` | `name: Mercur Marketplace` ≠ slug | `name: mercur` | ✅ |
| 2 | `ipix-supabase` | 6 dead paths (`supabase-roadmap`, wrong inventory paths, `IPI-49` md) | Roadmap → `docs/linear/issues/README.md`; inventory → `references/edge-functions/`; IPI-126 Linear + README | ✅ |
| 3 | `design-to-production` | Wrong `tasks/` depth in SKILL + references | `../../../tasks/` (SKILL) · `../../../../tasks/` (references/) | ✅ |
| 4 | `task-verifier` | Stale openclaw / probe paths | Fixed in v2 rewrite + verifier-probes paths | ✅ |
| 5 | `copilotkit` | Missing `copilotkit-mastra-plan.md` | → `tasks/design-docs/copilotkit-mastra.md` | ✅ |
| 6 | `gemini` | Missing `docs/gemeni/gemeni-plan.md` | → `tasks/intelligence/plans/gemini-plan.md` | ✅ |
| 7 | `fashion-production` | `fashion-styling` not archived path | → `../archive/fashion-styling/SKILL.md` | ✅ |
| 8 | `ipix-task-lifecycle` | Missing `README.md` | Created hub README | ✅ |
| 9 | `mastra` | Missing `references/full-guide.md` | Created framework hub | ✅ |

---

## Verify (run after pull)

```bash
python3 << 'PY'
import os, re
root = '/home/sk/ipix/.claude/skills'
slugs = ['ipix-supabase','design-to-production','copilotkit','gemini',
         'fashion-production','ipix-task-lifecycle','mastra','task-verifier','mercur']
broken = 0
for slug in slugs:
    p = os.path.join(root, slug, 'SKILL.md')
    if not os.path.exists(p): continue
    d = os.path.dirname(p)
    for m in re.finditer(r'\]\(([^)]+)\)', open(p).read()):
        t = m.group(1).split('#')[0]
        if t.startswith('http') or t.startswith('#'): continue
        if not os.path.exists(os.path.normpath(os.path.join(d, t))):
            broken += 1
            print('BROKEN', slug, t)
print('broken links in SKILL.md:', broken)
PY
```

Expected: **0** broken links in listed `SKILL.md` files.

---

## Still open (P1/P2)

| P | Item |
|---|------|
| P1 | Sync `tasks/intelligence/ai/skill-map.md` with `index-skills.md` |
| P1 | Create `docs/linear/supabase-roadmap.md` SSOT *(optional — README suffices for now)* |
| P1 | Create `docs/linear/issues/IPI-49-IPI-BI-OPS-002.md` or keep Linear-only IPI-126 |
| P2 | Stronger YAML triggers on Next.js cluster + `copilotkit` |
| P2 | `evals/task-verifier-eval.yaml` fixtures |

---

## Related

- Full task-verifier v2: [`jul-6-task-verifier.md`](./jul-6-task-verifier.md)
- Skills inventory: [`index-skills.md`](../../index-skills.md)
