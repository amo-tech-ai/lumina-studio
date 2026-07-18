# Anti-fake-done checklist

> Every box needs a **probe + result**. Unchecked box without probe = invalid Done.

**Quick gate:** abbreviated checks only — full 10 gates required for **Full verify** (Done, release, security). See [quick-gate.md](./quick-gate.md).

## iPix (default — IPI / SCR / DESIGN V2)

Use for all Lumina Studio / iPix work unless verifying legacy mdeai `F*.md`. **Full verify mandatory** before marking Done.

```
[ ] 1. Implementation on disk
       PROBE: ls <artifact> · git diff --name-only main...HEAD
       RESULT: ____________________________________________

[ ] 2. Tests pass (operator)
       PROBE: cd app && npm test
       RESULT: exit 0 · pass count ____

[ ] 3. Lint + typecheck (operator)
       PROBE: cd app && npm run lint && npm run typecheck
       RESULT: exit 0

[ ] 4. Build passes (when routes/config/env touched)
       PROBE: cd app && npm run build
       RESULT: exit 0
       SKIP IF: docs-only / no app/** change (record reason)

[ ] 5. Supabase verify (when DB/edge touched)
       PROBE: infisical run -- npm run supabase:verify
              infisical run -- npm run supabase:verify-rls
       RESULT: exit 0
       N/A IF: zero supabase/** change

[ ] 6. Skills compliance (Phase 5b)
       PROBE: table in [skills-compliance-ipix.md](./skills-compliance-ipix.md)
       RESULT: skills score __/100 · zero 🔴 MUST failures

[ ] 7. PR hygiene
       PROBE: one Linear issue · no docs+code mix · verify matrix in PR body
       REF: [pr-workflow verify-matrix](../../pr-workflow/references/verify-matrix.md)
       RESULT: ____________________________________________

[ ] 8. Evidence captured
       PROBE: PR body excerpt · docs/ecommerce/evidence/YYYY-MM-DD/<slug>/ OR screenshots
       RESULT: ____________________________________________

[ ] 9. Linear / spec sync
       PROBE: AC checkboxes match probes · issue state not Done while blockers open
       RESULT: ____________________________________________

[ ] 10. No open 🔴 in verification report
        PROBE: Phase 8 report · composite ≥ threshold or waivers documented
        RESULT: ____________________________________________
```

**Legacy Vite (`src/**` only):** add `infisical run -- npm run build && npm run test` when root Vite touched.

**Failure:** status stays **In Progress**. Output:

> "🛑 Not Done. Gate \<N\> failed: \<probe + result\>. Required fix: \<action\>."

---

## Legacy mdeai (F* / mdeapp only)

See [legacy-mdeai.md](./legacy-mdeai.md). Original mdeapp gates:

```
[ ] 1. Implementation on disk — ls / git diff
[ ] 2. cd mdeapp && npm test — exit 0
[ ] 3. cd mdeapp && npm run build — exit 0
[ ] 4. cd mdeapp && npm run lint (if applicable)
[ ] 5. tasks/INDEX.md matches task frontmatter status
[ ] 6. tasks/notes/F<id>-evidence.md or changelog evidence
[ ] 7. No 🔴 in cross-cutting audit list
[ ] 8. Edge fn / RLS MCP probes where applicable
[ ] 9. Localhost runtime proof (mdeapp dev + copilotkit + Mastra studio)
```

---

## Common fake-done patterns

| Pattern | Gate | Fix |
|---------|------|-----|
| Status Done, no tests | iPix #2 | Add Vitest in `app/` |
| Build green, typecheck red | iPix #3 | Run `npm run typecheck` |
| Skills ✅ in table, never loaded | iPix #6 | Phase 5b MUST audit |
| Mixed docs + code PR | iPix #7 | Split per pr-workflow |
| Linear Done, PR open | iPix #9 | Align states |
| Checkbox AC, no probe | iPix #10 | Cite command + output |
