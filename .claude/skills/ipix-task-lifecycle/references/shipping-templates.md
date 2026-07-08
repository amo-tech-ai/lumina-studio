# Shipping templates (iPix)

---

## tasks/plan/todo.md row update

Change dot in master table:

```markdown
| 12 | PLT-004 | Validate env at startup | M2 | 🟢 | [IPI-17](…) | IPI-17-PLT-004.md |
```

Update **Updated:** date in todo header. Refresh executive summary counts if milestone closed.

---

## Issue spec close-out

In `docs/linear/issues/IPI-*-<SPEC-ID>.md`:

```markdown
## Acceptance criteria

- [x] **AC1** … — VERIFIED 2026-06-15 (`npm run build`, smoke: …)
- [x] **AC2** … — VERIFIED 2026-06-15
```

Fill `## Verify` checkboxes with command output summary.

---

## Linear description

Tick each step in completion block:

```markdown
#### B. Implementation
- [x] **B1** Operator sees … — proof: screenshot / build log
```

Set issue state **Done** when all verify gates pass and `tasks/plan/todo.md` is 🟢.

---

## Commit examples

```
feat(plt): IPI-16 PLT-003 — brand profile row + RLS for operators

fix(ui): IPI-22 UI-001 — dashboard shell four-state loading

docs(linear): IPI-17 PLT-004 — sync verify steps to Linear
```

---

## Sync script

```bash
node scripts/linear-update-issue.mjs IPI-16
node scripts/linear-update-issue.mjs --all
```

Push descriptions from local `docs/linear/issues/` to Linear API.
