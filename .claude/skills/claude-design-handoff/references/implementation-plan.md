# Implementation Plan — Phase A / B / C

**When to read:** after design intake and component mapping, before writing any code.

**Goal:** produce a prioritized, risk-ordered build plan with clear phase assignments.

---

## Phase definitions

| Phase | Name | Rule |
|-------|------|------|
| **A** | Reuse | Use an existing component exactly as-is |
| **B** | Extend | Modify an existing component (add prop, variant, or slot) |
| **C** | New Build | Build a net-new component (justify why nothing existing works) |

**All Phase A items complete before any Phase B starts. Phase B before Phase C.**

---

## Plan template

For each design screen, produce a table like this:

```markdown
## Implementation plan — [Screen Name]

### Phase A — Reuse (zero new code)

| Item | Existing component | Justification |
|------|--------------------|---------------|
| Card grid | `VenueBrowseCard` | Same structure, different data |
| Step progress | `WizardStepBar` (in partner-signup-wizard.tsx) | Already built |
| Form shell | `MarketingPageShell` | Standard marketing wrapper |

### Phase B — Extend (modify existing)

| Item | Base component | Change needed | Complexity | Risk |
|------|---------------|---------------|-----------|------|
| Source chips | New `SourceChip` primitive | Active vs soft state | XS | Low |
| Draft card | `VenueBrowseCard` | Add "Data pending" badge | S | Low |
| Visibility score | `PartnerProfileDraft` scorer | Add interactive "Add" buttons | M | Medium |

### Phase C — New Build (net-new)

| Item | Why new? | Complexity | Dependencies | Risk | Effort |
|------|---------|-----------|-------------|------|--------|
| AI analyzing animation | No spinner row pattern exists | S | API route | Low | 2h |
| Concierge preview strip | Design-specific layout | M | None | Low | 3h |
| Done state | First time we have this flow | M | Activate API | Low | 2h |

### Total estimate

| Phase | Items | Effort |
|-------|-------|--------|
| A — Reuse | N | 0h |
| B — Extend | N | Nh |
| C — New | N | Nh |
| **Total** | **N** | **Nh** |
```

---

## Complexity scale

| Level | Meaning | Typical effort |
|-------|---------|---------------|
| XS | Styling tweak, copy change, flag | < 1h |
| S | New primitive component, single state | 1–3h |
| M | Composite component, 2–3 states, basic tests | 3–6h |
| L | Full screen/page, 4+ states, interactions, tests | 6–12h |
| XL | Multi-screen flow, API integration, HITL, tests | 12–20h |

---

## Risk assessment

| Risk | Description | Mitigations |
|------|-------------|------------|
| Low | Well-understood pattern; existing analogue | Follow existing component style |
| Medium | New pattern or uncertain API shape | Spike first; use mock data initially |
| High | Uncharted territory, external dependency | Proof-of-concept before full build |

---

## Dependency mapping

Use this to order tasks:

```
[A items — no dependencies]
    ↓
[B items — depend on existing components]
    ↓
[C items, no deps — can run in parallel with B]
    ↓
[C items that depend on API routes]
    ↓
[Integration tests — depend on all C items complete]
```

---

## Anti-patterns to avoid during planning

- **Over-engineering Phase B into Phase C**: if you can add a prop, don't fork the component.
- **Skipping Phase A audit**: always grep for the component first.
- **Building POST-status routes**: check `sitemap.md` before creating a new page.
- **Mixing design work into an unrelated PR**: each design screen gets its own branch.
- **Coding before gap analysis is done**: the plan must exist before any file is edited.

---

## Output: save the plan

Save implementation plans to:

```
docs/design/plan-[screen-slug]-[date].md
```

Reference this file in the Linear task description and in the PR body.
