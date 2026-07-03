# Linear issue spec template (iPix)

Use for `docs/linear/issues/IPI-<n>-<SPEC-ID>.md`. Mirror structure in Linear description via [linear-issue-steps.md](linear-issue-steps.md).

---

## File header

```markdown
# IPI-<n> — <SPEC-ID> <title>

**Linear:** https://linear.app/amo100/issue/IPI-<n>
**Track:** Platform | Commerce | UI | DNA | AI | Media
**Blocked by:** … · **Unblocks:** …
**Skills:** ipix-task-lifecycle · …
**MVP proof:** #N (if applicable)
```

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

### 4. Flow diagram (async / multi-actor tasks)

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

### 5. Acceptance criteria

```markdown
## Acceptance criteria

- **A — <capability>:** <testable — what the user sees, not what the code does>
- **B — <edge case>:** …
- **C — <states>:** Loading shows …; error shows …; empty shows …
- **D — <live/reactive behaviour>:** …
- **E — <regression guard>:** Existing <feature> works unchanged.
```

≤10 items. Each observable. Map to wiring plan.

### 6. Technical notes

```markdown
## Technical notes

**Files to touch:**
- `app/src/...` — <what + why, ≈N lines>
- `app/src/...` — <what + why>
- No DB migrations required. / No new components required. (state explicitly)

**Do NOT:** <antipattern> — <one-line reason>

**Known data / constraints:** <exact slugs, enum values, IDs the code depends on>
```

### 7. Out of scope

```markdown
## Out of scope

- <related-sounding thing this PR does NOT do>
- <follow-on feature — its own issue>
- <data/seeding that is a separate task>
```

### 8. Wiring plan

```markdown
## Wiring plan

| Action | Path | Notes |
|--------|------|-------|
| Create | `app/src/app/api/...` | … |
| Modify | `app/src/app/(operator)/...` | … |
| Modify | `supabase/functions/.../index.ts` | … |
```

Order: schema → edge → server → UI.

### 9. Verify block

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
- [ ] todo.md row → 🟢 · Linear → Done
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
