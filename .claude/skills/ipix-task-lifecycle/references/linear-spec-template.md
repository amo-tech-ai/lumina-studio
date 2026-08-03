# Linear issue spec template (iPix)

<<<<<<< HEAD
Use for `docs/linear/issues/IPI-<n>-<SPEC-ID>.md`. Mirror structure in Linear description via [linear-issue-steps.md](linear-issue-steps.md). Prompt-engineering rules: [linear-prompt-engineering.md](linear-prompt-engineering.md).

---

## File header

```markdown
# IPI-<n> — <SPEC-ID> <title>

**Role:** You are implementing this as an iPix engineer. One concern per PR.

**Linear:** https://linear.app/amo100/issue/IPI-<n>
**Track:** Platform | Commerce | UI | DNA | AI | Media
**Blocked by:** … · **Unblocks:** …
**Skills:** ipix-task-lifecycle · mastra · gemini · worktrees · pr-workflow
**MVP proof:** #N (if applicable)
```

Slugs = `.claude/skills/<slug>/`. Pick from [domain-skill-routing.md](domain-skill-routing.md); **Read** each `SKILL.md` before writing AC.

---

## Required sections (in this order)

### 1. Problem statement

```markdown
## The problem this solves

- Today, <persona> does <action> and <bad outcome happens>.
- <Concrete example of the mistake — not abstract>.
- <Second failure mode if relevant>.

**Fix:** <one sentence on the solution>
```

### 2. User story

```markdown
## User story

> As a <Operator | Engineer>, when I <action>,
> I <see / get Y>,
> so I can <outcome>.
```

### 3. Wireframe (UI tasks only)

```markdown
## Wireframe — <screen name>

\`\`\`
┌──────────────────────────────────────────┐
│  <screen name>                           │
├──────────────────────────────────────────┤
│  <lo-fi layout>                          │
└──────────────────────────────────────────┘
\`\`\`

**States:**

| State | What to show |
|---|---|
| Empty | … |
| Loading | skeleton shimmer |
| Success | … |
| Unknown/not found | amber warning badge |
| Error | red inline + retry |
```

### 4. Examples (security / AI / ambiguous API)

```markdown
## Examples

<example name="denied">
…
</example>

<example name="allowed">
…
</example>
```

UI tasks: wireframe + states table satisfies multishot requirement.

### 5. Flow diagram (async / multi-actor tasks)

```markdown
## Flow

\`\`\`mermaid
sequenceDiagram
    participant Op as Operator
    participant UI as <Component>
    participant API as <Route>
    participant DB as <Table>
    Op->>UI: …
\`\`\`
```

### 6. Acceptance criteria
=======
**Canonical reusable body (Linear + spec md):** [`docs/process/templates/linear-issue-body.md`](../../../../docs/process/templates/linear-issue-body.md) — **SSOT paste body; edit there first.**  
**Guide + install:** [`docs/process/templates/README.md`](../../../../docs/process/templates/README.md) · Playbook [02](../../../../docs/process/02-task-template.md)  
**Prompt rules:** [linear-prompt-engineering.md](linear-prompt-engineering.md) · **A–E detail:** [linear-issue-steps.md](linear-issue-steps.md) · **Skills:** [domain-skill-routing.md](domain-skill-routing.md)

This file is a **thin skill entrypoint / mirror** for Phase 1. Do not duplicate section text here — link to `linear-issue-body.md`.

---

## Title

```text
IPI-<n> · <TASK-ID> — <Real-world plain English title>
```

Filename: `docs/linear/issues/IPI-<n>-<task-id-slug>.md`

---

## Required sections (order)

| # | Section | Notes |
|---|---------|-------|
| — | Header table | MVP stage · Parallel · Blocked by · Skills · Agents/hooks/commands · Stack · Scores |
| 1 | Purpose | One sentence |
| 2 | Real-world iPix example | Persona + named `/app` surface |
| 3 | User journey impact | Before → during → after |
| 4 | Business value | Launch / ops consequence |
| 5 | Quality checks | Required? MVP? Duplicate? Simpler? Reuse? Parallel? |
| 6 | Research checklist | Docs → GitHub → iPix → Dashboard/CLI |
| 7 | Platform-first plan | See ladder below |
| 8 | Multi-step implementation prompt + A→E | Each step ends with `proof:` |
| 9 | Acceptance criteria | Observable; ≤10; no security OR |
| 10 | Tests & real-world validation | Unit → browser → local → preview → prod-safe |
| 11 | Risks & rollback | |
| 12 | PR evidence required | One concern · proofs · CI |

**Optional:** Wireframe + states (UI) · Mermaid (async) · `<example>` blocks (RLS/AI/API)

---

## Platform-first ladder

```text
Dashboard → CLI → Existing iPix code → Official docs → SDK/module
  → GitHub examples → Templates/recipes → Smallest custom code
  → Tests → Browser verification → PR
```

---

## MVP stage

| Stage | Meaning |
|-------|---------|
| **Core** | Needed for real operators on launch path |
| **Launch Blocker** | Must clear before launch (can also be Core) |
| **Post-MVP** | After first brands are live |
| **Advanced** | Differentiator / park unless LV high and risk low |

---

## Quality scores (1–5)

Priority · Complexity · Risk · User value · Launch value — fill in header.  
Defer Advanced + launch value ≤2, or when Dashboard/CLI already solves it.

---

## Header stub

```markdown
# IPI-<n> · <TASK-ID> — <title>

**Role:** You are implementing this as an iPix engineer. One concern per PR. Research before custom code.

**Linear:** https://linear.app/amo100/issue/IPI-<n>
**Plain English:** <one sentence>

| Field | Value |
|-------|--------|
| **MVP stage** | Core · Launch Blocker · Post-MVP · Advanced |
| **Parallel** | OK / Must wait on **IPI-NNN · SPEC — Plain English title** (never bare `IPI-NNN`) |
| **Blocked by** | … · **Unblocks:** … |
| **Track** | Platform · UI · DNA · AI · Commerce · Media |
| **Skills** | ipix-task-lifecycle · <domain> · worktrees · pr-workflow |
| **Agents / hooks / commands** | … |
| **Stack** | Only stacks this task touches |
| **Quality scores** | P_ · C_ · R_ · UV_ · LV_ |
```

Slugs = `.claude/skills/<slug>/`. **Read** each `SKILL.md` before writing AC.

---

## Acceptance criteria shape
>>>>>>> origin/main

```markdown
## Acceptance criteria

<<<<<<< HEAD
- **A — <capability>:** <testable — what the user sees, not what the code does>
- **B — <edge case>:** …
- **C — <states>:** Loading shows …; error shows …; empty shows …
- **D — <live/reactive behaviour>:** …
- **E — <regression guard>:** Existing <feature> works unchanged.
```

≤10 items. Each observable. Map to wiring plan. No **OR** for security/auth — one mandatory mechanism.

### 7. Technical notes

```markdown
## Technical notes

**Files to touch:**
- `app/src/...` — <what + why, ≈N lines>
- `app/src/...` — <what + why>
- No DB migrations required. / No new components required. (state explicitly)

**Do NOT:** <antipattern> — <one-line reason>

**Known data / constraints:** <exact slugs, enum values, IDs the code depends on>
```

### 8. Out of scope

```markdown
## Out of scope

- <related-sounding thing this PR does NOT do>
- <follow-on feature — its own issue>
- <data/seeding that is a separate task>
```

### 9. Wiring plan

```markdown
## Wiring plan

| Action | Path | Notes |
|--------|------|-------|
| Create | `app/src/app/api/...` | … |
| Modify | `app/src/app/(operator)/...` | … |
| Modify | `supabase/functions/.../index.ts` | … |
```

Order: schema → edge → server → UI.

### 10. Verify block

```markdown
## Verify

### Per-task (Phase 3 — run after each plan task)
| Task | Test command | Proof |
|------|--------------|-------|
| 1 — … | `cd app && npx vitest run src/.../foo.test.tsx -t "…"` | N passed |
| 2 — … | smoke: `/app/route` four states | screenshot / note |

### Aggregate (Phase 4)
- [ ] `cd app && npm run lint && npm run typecheck && npm test`
- [ ] `cd app && npm run build` (if routes/config/schema)
- [ ] `infisical run -- npm run supabase:verify-rls` (if RLS touched)
- [ ] Browser smoke: <route> @ 375px + 1280px
- [ ] `tasks/plan/todo.md` row → 🟢 · Linear → Done
```

See [per-task-testing.md](per-task-testing.md).

---

## What makes a good issue vs a bad one

| Bad | Good |
|---|---|
| "Add spec display to wizard" | Problem statement → user story → wireframe → AC |
| "Handle states" | Named states table: empty · loading · success · unknown · error |
| "Implement X" | "Do NOT call Mastra tool directly — use server fn via API route" |
| "Out of scope: TBD" | Explicit list: "Editing specs, safe-zone viz, seeding missing channels" |
| AC: "Works correctly" | AC: "Selecting IG Story shows 1080×1920 · 9:16 · JPG/MP4 · 30MB inline" |
| AC: "RLS or route for won/lost" | AC: "DB trigger blocks won/lost; only convert route sets app.crm_convert" |
| No examples | Good/bad SQL or API snippets for security paths |

---

## Optional sections

```markdown
## Research notes
(Phase 2 output — add after audit)

## Open questions
…
```

---

## Naming

| Field | Example |
|-------|---------|
| SPEC-ID | `PLT-003`, `UI-001` |
| Filename | `IPI-16-PLT-003.md` |
| Commit area | `plt`, `ui`, `ai`, `dna`, `com`, `supabase` |
=======
- **A — <capability>:** <what the user sees>
- **B — <edge case>:** …
- **C — <states>:** empty · loading · success · error
- **D — <live behaviour>:** … (if needed)
- **E — Regression:** Existing <feature> unchanged
```

---

## Completion steps shape

```markdown
#### A. Research / setup
- [ ] **A1** … — proof: …

#### B. Core
- [ ] **B1** … — proof: …

#### C. Edges
- [ ] **C1** … — proof: …

#### D. Automated tests
- [ ] **D1** `cd app && npx vitest run …` — proof: N passed
- [ ] **D2** typecheck + lint — proof: green

#### E. Real-world + ship
- [ ] **E1** Playwright / MCP Chrome journey — proof: …
- [ ] **E2** localhost:3002 with qa@ipix.test — proof: …
- [ ] **E3** Preview / production-safe smoke as applicable — proof: …
- [ ] **E4** Agent validation if AI touched — proof: …
- [ ] **E5** PR evidence · CI · Linear Done — proof: …
```

---

## Good vs bad

| Bad | Good |
|-----|------|
| "Add DNA to assets" | Purpose + Assets surface + chip states AC |
| "Works correctly" | "Blocked chip visible on Assets row before shoot pick" |
| Custom-first | Platform-first table filled |
| No MVP tag | Core / Launch Blocker / Post-MVP / Advanced |
| Bare `IPI-492` | `IPI-492 · CF-AI-004c — Clear errors when…` |

Full paste body + example: [`docs/process/templates/`](../../../../docs/process/templates/).
>>>>>>> origin/main
