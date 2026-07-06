---
name: ipix-wireframe
description: Wireframes, lo-fi clickable prototypes, Wire DSL mockups, and sketch-to-spec handoff for iPix / Lumina Studio operator UI. Use for wireframe, mockup, lo-fi UI, interactive prototype, early feedback, stakeholder alignment, operator dashboard, brand intake, DNA scoring UI, shoot wizard, or ideating UI before production code.
metadata:
  priority: 6
  pathPatterns:
    - 'tasks/wireframes-ipix/**'
    - 'tasks/wireframes/**'
  triggers:
    - wireframe
    - lo-fi
    - mockup
    - prototype
    - wire DSL
    - Balsamiq
    - sketch-to-spec
---

# iPix Wireframe

Lo-fi prototyping for iPix / Lumina Studio operator UI. Routes to clickable HTML/React SPA (wired-elements aesthetic), Wire DSL (.wire), ASCII + spec tables, or external tool guidance (Figma/Balsamiq).

## Methods (in order of preference)

### 1. Clickable HTML SPA
Inline HTML with wired-elements / sketchy CSS aesthetics. Use for interactive walkthroughs.

### 2. Wire DSL (.wire files)
Minimal ASCII-based wireframe language in text files under `tasks/wireframes-ipix/`.

### 3. ASCII + Spec Tables
Quick grid-based ASCII wireframes with a companion spec table for states, behavior, and data.

### 4. Figma / Balsamiq
Guidance for external tools when fidelity requires it.

## Workflow

1. **Scope** — What screen/flow? What user goal?
2. **Sketch** — Lo-fi, no color, no real copy, just layout
3. **Annotate** — States, transitions, edge cases
4. **Review** — Align with stakeholder before production

## Alignment

| Linear Epic | Focus |
|-------------|-------|
| UI-001 | Operator dashboard 3-panel |
| UI-002 | Brand intake wizard |
| UI-003 | DNA scoring UI |
| UI-004 | Shoot wizard |

See `tasks/wireframes-ipix/new/` for current wireframe files.
