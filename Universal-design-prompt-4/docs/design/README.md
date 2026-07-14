# Design Documentation — Index

> **Design-only docs for Claude Design.** Engineering/backend tasks live separately in `IMPLEMENTATION-TASKS.md` (master) — this folder is screens, components, UX, AI interaction, motion, mobile, accessibility, and journeys.

## Separation of concerns
| Concern | Where |
|---|---|
| **Design tasks (improvements)** | `DESIGN-TASKS.md` |
| **Design principles** | `DESIGN-PRINCIPLES.md` |
| **States (empty/loading/error/offline/permission)** | `STATES.md` · `../handoff/08-state-map.md` |
| **Patterns (forms/tables/charts/KPI/notifications)** | `PATTERNS.md` |
| **Workflow design checklists** | `WORKFLOWS.md` |
| **Design system & tokens** | `DESIGN.md` · `DESIGN-TOKENS.md` · `tokens.css` |
| **Image standards** | `IMAGE-STANDARDS.md` |
| **Performance budget** | `PERFORMANCE.md` |
| **AI runtime + backend contract (Claude Code)** | `../handoff/14-ai-runtime-contract.md` |
| **Components** | `../../components/COMPONENTS.md` · `../handoff/03-component-map.md` |
| **Screens** | `../handoff/02-screen-map.md` |
| **User journeys** | `../handoff/04-user-journeys.md` |
| **AI interaction (UX contract)** | `AI-UX.md` · `../handoff/06-ai-workflows.md` |
| **States** | `../handoff/08-state-map.md` |
| **Motion** | `ANIMATIONS.md` |
| **Mobile / responsive** | `../../MOBILE-PLAN.md` |
| **Accessibility** | `ACCESSIBILITY.md` |
| **UX audit** | `improve.md` |
| **Master QA checklist (Design gate)** | `DESIGN-QA.md` |
| **Engineering tasks (move backend here)** | `IMPLEMENTATION-TASKS.md` (Supabase/RLS/OAuth/Edge Fns/Cloudinary/Mastra/CopilotKit/APIs) |

> **Rule:** design docs describe *what the user sees and how it behaves*; engineering docs describe *how it's built*. Backend specifics (schema, RLS, connectors, tools) belong only in `IMPLEMENTATION-TASKS.md` / future `ARCHITECTURE.md`, never in design docs.

## Design principles (quick reference)
1. **AI-first** — AI drafts, human approves (HITL); wizards arrive pre-filled.
2. **Image-first** — content leads with editorial photography at the correct ratio.
3. **Calm & editorial** — hairlines over shadows, generous whitespace, mono numerals.
4. **One system** — reuse shared components; never duplicate. Tokens only, no hardcoded hex.
5. **Every screen** — 3-panel desktop / tab+sheet mobile, a context-aware AI dock, and all 8 states.

## Visual hierarchy
```
Page (workspace, max-width column)
  └ Section (titled group, gap-stacked)
      └ Card (image-first, 1px hairline, ~20px radius)
          └ Component (chip · score · meta · action row)
              └ Action (black primary · outline secondary · ghost tertiary)
```
Emphasis order: imagery → object name → primary metric (mono) → status → secondary meta → actions. One primary action per surface.

## Document map
- `README.md` (this) · `DESIGN.md` · `DESIGN-PRINCIPLES.md` · `DESIGN-TOKENS.md` · `IMAGE-STANDARDS.md` · `DESIGN-TASKS.md` · `DESIGN-QA.md` · `AI-UX.md` · `STATES.md` · `PATTERNS.md` · `ANIMATIONS.md` · `ACCESSIBILITY.md` · `improve.md` · `IMPLEMENTATION-TASKS.md`
- Cross-folder: `../handoff/*` (screen/component/journey/state/AI maps), `../../MOBILE-PLAN.md`, `../../components/COMPONENTS.md`, `../../checklist.md`.
