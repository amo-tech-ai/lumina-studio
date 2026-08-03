# 08 · Architecture Review

**Goal:** Prefer Dashboard/CLI/templates over custom code; refactor UI only when it speeds MVP journeys.

**Depends on:** [06](./06-tech-stack-playbook.md)  
**Aligns with:** ponytail + platform-first ladder

---

## Custom-code smell checklist

| Smell | Prefer instead |
|-------|----------------|
| Hand-rolled auth admin | Supabase Dashboard / CLI |
| One-off Worker glue for managed feature | Cloudflare Dashboard / Wrangler |
| Duplicate form/table markup | Shared app components / shadcn |
| New package for 20 lines | Stdlib or existing util |
| Parallel Vite feature | Build in `app/` only |

---

## Multistep prompt — architecture efficiency review

```xml
<role>You audit iPix for unnecessary custom code and risky complexity.</role>

<task>
1. Pick scope: {auth | AI gateway | Brand Hub UI | agents | crawl}.
2. Trace current flow (graphify path + key files).
3. For each custom piece: could Dashboard/CLI/template/SDK replace it?
4. Score: essential · MVP · over-engineered · duplicate.
5. Recommend: keep · configure · replace · delete.
6. Mermaid: current vs simplified; mark failure points and live blockers.
7. Impact on operator journey in one sentence each.
</task>

<constraints>
- Shortest working path wins.
- No drive-by refactors in the same PR as features.
- Split docs vs code concerns.
</constraints>

<output_format>
| Area | Custom today | Platform alternative | Verdict | MVP? |
Plus Mermaid + ordered fix list.
</output_format>
```

---

## HTML / component reuse

1. Inventory repeated patterns (filters, DNA chips, shoot headers).
2. Promote to shared components only if ≥2 call sites and MVP uses them.
3. Otherwise leave; file Post-MVP cleanup.

---

## Done when

- [ ] One scoped review complete with keep/replace/delete table
- [ ] Follow-up Linear issues created only for essential items
