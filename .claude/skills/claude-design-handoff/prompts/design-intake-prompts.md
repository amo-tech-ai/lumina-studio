# Design Intake Prompts

Reusable prompts for extracting design specs from various input types.
Use these verbatim or adapt them. Always save outputs to `docs/design/handoff-*.md`.

---

## Prompt A — Full design analysis (image / screenshot)

```
Analyze this design screenshot and produce a structured implementation spec.

Extract:
1. **Layout tree** — all 3 regions (NavSidebar, Workspace, IntelligencePanel) as an ASCII tree
2. **Component inventory** — every distinct UI element: name, type (primitive/composite),
   region, visible states, any iPix analogue
3. **Design tokens** — colors (approximate), typography sizes, spacing patterns,
   border radius, shadows
4. **Interactions** — click/hover/focus behaviors, state transitions, navigation
5. **Accessibility** — keyboard requirements, ARIA needs, contrast concerns
6. **Five states** — populated, loading, empty, error, approval-pending for each screen
7. **Open questions** — anything ambiguous; note your confidence (High/Medium/Low)

For each extracted item, state: Reuse (exact existing component) / Extend (add prop) /
New Build (no existing analogue). Map to iPix stack:
Next.js 16, React 19, Tailwind v4, shadcn/ui, CopilotKit 1.61.0 (/v2 imports), Mastra, Supabase.

Flag any violations of these rules:
- No hardcoded colors (semantic tokens from tokens.css only)
- iPix orange (#E87C4D) = primary actions only, use sparingly
- Warm off-white (#FBF8F5) background, never pure white
- Geist Mono for all numbers/data values
- HITL gates on all AI write actions
- 3-panel shell on every operator screen
- prefers-reduced-motion on all animations
- data-testid on every interactive element

Output format: use the `templates/design-analysis.md` structure.
```

---

## Prompt B — Local JSX/HTML design file analysis

```
Read the design file at [FILE_PATH] and extract a structured implementation spec.

The file is a design mock — it uses window.* globals and import.meta.env; do not
import it as-is. Extract the visual/UX intent only.

Produce:
1. ASCII layout tree (3-panel structure)
2. Component inventory table (name, type, region, states, iPix mapping)
3. State transition table (trigger → result)
4. Five states analysis (populated, loading, empty, error, approval-pending)
5. Design token audit (any hardcoded values that need token.css mapping)

For each component, specify: Phase A (reuse) / Phase B (extend) / Phase C (new).
Reference these existing iPix components first:
- app/src/components/nav-sidebar/nav-sidebar.tsx
- app/src/components/operator-panel/operator-panel.tsx
- app/src/components/brand-context-panel/brand-context-panel.tsx
- app/src/components/brand-hub/approval-card.tsx
- app/src/components/ui/* (shadcn primitives)

Save the spec to docs/design/handoff-[screen-slug]-[date].md
```

---

## Prompt C — Component generation from spec

```
Generate a React component [ComponentName] for iPix/FashionOS based on this design spec:

[paste relevant section from design-analysis.md]

Requirements:
- "use client" directive if client-side state/effects
- Tailwind v4 + semantic tokens from tokens.css (no hardcoded colors)
- shadcn/ui primitives for forms, dialogs, buttons
- data-testid="[component]-[action]" on every interactive element
- iPix orange (#E87C4D) for primary actions only, use sparingly
- Geist Mono (font-mono tabular-nums) for all numbers/data values
- HITL approval card for any AI write action (amber border + bg, confidence %)
- 3-panel shell structure (NavSidebar · Workspace · IntelligencePanel)
- prefers-reduced-motion on all animations
- Skeleton layouts during loading (match populated exactly)
- All five states: populated, loading, empty, error, approval-pending

File: app/src/components/[domain]/[component-name].tsx
```

---

## Prompt D — API route generation from spec

```
Generate a Next.js App Router API route for [endpoint] based on this spec:

[describe the endpoint]

Requirements:
1. Verify user identity first: createClient() → auth.getUser() → 401 if no user
2. Zod schema to validate request body
3. Return typed JSON response
4. 15s timeout handling; return partial data on timeout
5. No service-role key (server-only API routes only)
6. Use anon client for user-scoped queries
7. Mastra + Gemini models only: @ai-sdk/google + gemini model
8. RLS on every table (enable row level security + ≥ 1 policy)

File: app/app/api/[path]/route.ts
```

---

## Prompt E — Linear task creation from design spec

```
Based on this design analysis:
[paste relevant sections]

Create 8 Linear tasks following the `templates/task-template.md` structure:
T1 Design Analysis, T2 Component Mapping, T3 Design System Check,
T4 UI Components, T5 State Management, T6 Tests, T7 Accessibility, T8 Production Verification.

For each task:
- Full title with IPI-NNN prefix
- 6-section description (Context → Problem → Proposal → AC → Verification → Out of scope)
- Labels: D-TRACK + type label + domain label
- Depends on: [list blocking tasks]
- Project: [Linear project name]

Branch naming: ipi/<issue-number>-<short-name>
Use the IPI-NNN · Full Title format.
```

---

## Prompt F — Gap analysis between design and existing app

```
Compare this design spec to the existing iPix implementation.

Design spec: [paste design-analysis.md section]

Run these checks:
1. Route status: check app/design/todo.md for the target route — is it 🔵 Now / ⬜ Next / ✅ Recently done?
2. Component exists: search app/src/components/ for matching components
3. Page exists: check app/app/[route]/page.tsx
4. State already handled: grep for key props/patterns

For each design element:
- COVERED: existing code handles it → reference the file:line
- PARTIAL: exists but needs extension → describe what's missing
- MISSING: no existing analogue → justify building new

Output: gap analysis table with COVERED/PARTIAL/MISSING per element.
Save to the design analysis doc under a "Gap Analysis" section.
```

---

## Prompt G — Design system validation

```
Validate this design implementation against iPix/FashionOS design system rules.

Check the following files/code for violations:
[paste or list the files to check]

Violations to flag:
🔴 BLOCK (hard fail):
- Service-role key in app/src/** (server-only API routes only)
- Missing RLS policy on a new table
- Non-Gemini AI models (no Anthropic, no OpenAI)
- CopilotKit v1 bare import (not /v2)
- Dark mode proposed (light-mode only)

🟡 WARN (fix before merge):
- Hardcoded hex/rgb colors (not from tokens.css)
- Hardcoded gray-* Tailwind shades (not in design system)
- iPix orange overused (use sparingly for primary actions only)
- Pure white background (use warm off-white #FBF8F5)
- Geist Mono not used for numbers/data
- 3-panel shell missing
- Missing five states (need populated, loading, empty, error, approval-pending)
- HITL gate missing on AI write action
- Animation without prefers-reduced-motion guard
- Missing data-testid on interactive element
- Gradients or heavy shadows (not in design system)

🔵 NOTE (fix when convenient):
- Missing data-testid on non-interactive element
- Non-alphabetical import order

Report: severity, rule violated, file:line, suggested fix.
```
