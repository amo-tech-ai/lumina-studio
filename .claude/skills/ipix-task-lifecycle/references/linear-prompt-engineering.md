---
title: Linear issues as agent prompts (iPix)
impact: HIGH
tags: ipix-task-lifecycle, linear, prompt-engineering, IPI
---

# Linear prompt engineering (iPix standard)

Every executable Linear issue is a **prompt** to Cursor, Claude, and future engineers. Apply the same principles as [prompting-best-practices.mdc](../../../../.cursor/rules/prompting-best-practices.mdc) and [senior-prompt-engineer](../../archive/senior-prompt-engineer/SKILL.md): clarity, examples, constraints, chain-of-thought, eval hooks.

**Pair with:** [linear-issue-steps.md](linear-issue-steps.md) · [linear-spec-template.md](linear-spec-template.md) · Phase 1 [planning.md](../planning.md)

---

## Mental model

| Prompt concept | Linear section |
|----------------|----------------|
| **Role** | User story persona (Operator / Engineer / Shopper) |
| **Context** | Problem statement + blocked-by + SSOT links |
| **Task** | Acceptance criteria (outcomes, not implementation) |
| **Constraints** | Technical notes · **Do NOT** · Out of scope |
| **Examples (multishot)** | Wireframe + states table · good/bad SQL or API snippets |
| **Chain of thought** | Completion steps A→E (ordered reasoning) |
| **Output format** | Every step ends with `proof:` … |
| **Eval** | Verify block + regression guard AC |

**Litmus test:** If an agent cannot tell **done vs not done** from the issue alone, the prompt is weak.

---

## Prompt-optimized issue template

Use this as the **minimum bar** on top of [linear-issue-steps.md](linear-issue-steps.md). SSOT lives in `docs/linear/issues/IPI-*.md`; sync via `node scripts/linear-update-issue.mjs IPI-NNN`.

```markdown
## SPEC-ID — Title

**Role:** You are implementing this as an iPix engineer. Stack: Next.js `app/`, Supabase remote-only, one concern per PR.

**Plain English:** <one sentence outcome>

**Context — what's broken today:**
- Today: …
- Mistake we prevent: …
- SSOT: `docs/linear/issues/IPI-NNN-….md` §section

**Blocked by:** … · **Unblocks:** … · **Skills:** `@ipix-supabase` …

---

## User story
> As an **Operator**, when I …, I …, so I …

---

## Examples  ← required for security, AI, and ambiguous API/RLS tasks

<example name="denied">
-- MUST fail
UPDATE crm_deals SET stage = 'won' WHERE id = …;
</example>

<example name="allowed">
SELECT set_config('app.crm_convert', '1', true);
UPDATE crm_deals SET stage = 'won' WHERE id = …;
</example>

---

## Acceptance criteria (testable outcomes only)
- **A — Security:** … (proof: `verify-rls` probe name)
- **E — Regression guard:** … (proof: grep / test name)

---

## Technical notes
**Do NOT:** … · **Out of scope:** …

---

## Completion steps A–E
- [ ] **B2** … — proof: `<command>` exit 0 on `<sha>`
```

Optional XML-style tags (`<example>`, `<constraints>`) help agents parse sections; they render fine in Linear markdown.

---

## Seven rules for Linear prompts

### 1. Clarity — one interpretation only

Replace compound **OR** in AC with a **mandatory** path:

```diff
- won/lost blocked at RLS or route level
+ won/lost blocked at DB trigger; only convert route sets app.crm_convert=1
```

Security, auth, and terminal-state gates must never offer an "easier" implementation path.

### 2. Multishot — 2–3 examples per risky area

| Area | Examples to include |
|------|---------------------|
| **UI** | Wireframe + states table (empty · loading · success · unknown · error) |
| **Security / RLS** | Allowed vs denied SQL or API call |
| **AI / Mastra** | Tool input → draft → ApprovalCard → never auto-send |
| **Env / secrets** | Valid vs invalid env → expected startup error |

### 3. Chain prompts — one PR = one concern

- Completion steps A→E **are** the chain; do not one-shot epics in a single issue.
- If description > ~400 lines or >8 completion steps → split issues.
- WIP caps: Todo ≤8 · In Progress ≤12 ([tasks/linear/efficient.md](../../../../tasks/linear/efficient.md)).

### 4. Role + audience in every user story

Always name **Operator**, **Engineer**, or **Shopper** — never generic "user". Matches UX golden rule: proactive teammate, page-context-aware.

### 5. Prefill the agent's output — proof format

Every completion step ends with evaluable proof:

```text
proof: `infisical run -- npm run supabase:verify-rls` exit 0 · commit abc1234
```

Same idea as prefilling structured JSON in LLM prompts — forces measurable responses.

### 6. Negative prompting — Do NOT

Every issue needs 2–5 explicit prohibitions in **Technical notes**:

- Do NOT use service role in Mastra CRM tools
- Do NOT add a second won/lost write path
- Do NOT mix docs + code in one PR
- Do NOT call Mastra tools from UI routes — use API routes

### 7. Eval hooks — regression guards

Add **E — Regression guard** AC for safety-critical work:

- Code search: exactly one writer for terminal state
- Named `verify-rls` probe in AC
- Browser smoke: "click Approve → lands on `/app/brand/:id`"

---

## Relations must mirror AC

If AC says "requires Pipeline board" or "at-risk filter", set Linear `blockedBy` on that issue. Soft dependencies belong in **Out of scope** or a follow-up issue — not hidden inside AC without a relation edge.

---

## SSOT workflow (prevent prompt drift)

1. Edit `docs/linear/issues/IPI-*.md` first (never hand-edit Linear only).
2. Push: `node scripts/linear-update-issue.mjs IPI-NNN`
3. On PR merge: checkboxes in spec md + Linear state Done stay aligned.

**Drift symptom:** Linear body says "RLS or route" while local spec says "DB trigger only" — agents pick the easier path.

---

## Anti-patterns (prompt failures)

| Anti-pattern | Fix |
|--------------|-----|
| Vague AC ("works correctly") | Observable outcome + proof command |
| No problem statement | 2–4 bullets: what breaks today + concrete mistake |
| Happy-path only | States table + error/empty examples |
| Implementation in AC | "Add migration" → "cross-org SELECT returns 0 rows" |
| Linear ≠ local spec | SSOT sync script |
| AC OR for security | Single mandatory mechanism |
| Relations ≠ AC | Add `blockedBy` / `blocks` edges |
| Missing proof on steps | Every A–E checkbox needs `proof:` |

---

## Phase 1 validation (prompt lint)

Run mentally (or via future `scripts/linear-lint-issue-spec.mjs`) before marking issue ready:

```
[ ] Role line or named persona in user story
[ ] Problem statement — not "we need X"
[ ] ≥2 Examples OR full wireframe + 5-state table (UI)
[ ] No "or" in security/auth AC
[ ] Every AC observable; maps to verify command
[ ] ≥2 Do NOT lines in technical notes
[ ] ≥2 Out of scope lines
[ ] Every A–E step has proof:
[ ] blockedBy matches any cross-issue AC dependency
[ ] Local md synced to Linear (or sync planned in step E)
```

---

## When to enrich an existing issue

| Trigger | Action |
|---------|--------|
| "Add Linear steps to IPI-###" | Fill missing sections per this doc + linear-issue-steps |
| Agent picked wrong implementation | Tighten AC; add good/bad examples |
| Security finding in review | Add regression guard AC + verify probe |
| Post-MVP issue in Todo | Move to Backlog until blocker Done; add blockedBy |

---

## Cross-references

| Resource | Path |
|----------|------|
| Issue step format | [linear-issue-steps.md](linear-issue-steps.md) |
| Spec md template | [linear-spec-template.md](linear-spec-template.md) |
| Prompting rules (Claude) | `.cursor/rules/prompting-best-practices.mdc` |
| WIP / queue hygiene | `tasks/linear/efficient.md` |
| CRM audit (prompt drift examples) | `tasks/crm/audit/02-linear-audit.md` |
