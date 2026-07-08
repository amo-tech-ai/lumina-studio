## BUILD-GROQ-CONFIG — Fix Turbopack groq-models.json Import Boundary

**In plain terms:** `next build` fails because Turbopack treats `app/` as the workspace root while `provider.ts` statically imports `config/groq-models.json` from the repo root. Fix the import boundary without changing Groq runtime behavior.

**Linear:** [IPI-428](https://linear.app/amo100/issue/IPI-428)

**Track:** Platform · Build · INFRA · LLM

**Blocked by:** none

**Blocks:** [IPI-358](https://linear.app/amo100/issue/IPI-358) · [IPI-359](https://linear.app/amo100/issue/IPI-359) · any `app/**` PR whose CI `app-build` job runs `next build`

**Not part of:** IPI-357 · IPI-358 feature work · IPI-426 · cover/design PRs · PLT-004 `check-client-env` literal cleanup

**Branch:** `ipi/build-groq-config`

**Worktree:** `../wt-build-groq-config`

**Verify:**

```bash
cd app && rm -rf .next && CI=true npm run build
cd app && npm run lint
cd app && npm run typecheck
cd app && npm test
node scripts/check-client-env.mjs   # baseline only — see AC4
```

**Estimate:** 1 point

**Related:** [IPI-356](https://linear.app/amo100/issue/IPI-356) GROQ-002 (provider abstraction — do not bundle)

### Skills (load in order)

| # | Skill | Path | Role |
|---|--------|------|------|
| 1 | nextjs-16 | `.claude/skills/nextjs-16/SKILL.md` | **Primary** — Turbopack root + build |
| 2 | ipix-task-lifecycle | `.claude/skills/ipix-task-lifecycle/SKILL.md` | Branch / AC / ship |
| 3 | pr-workflow | `.claude/skills/pr-workflow/SKILL.md` | Verify matrix + one-concern PR |
| 4 | worktrees | `.claude/skills/worktrees/SKILL.md` | `../wt-build-groq-config` setup |
| 5 | task-verifier | `.claude/skills/task-verifier/SKILL.md` | Pre-ship forensic gate |
| 6 | groq-inference | `.claude/skills/groq-inference/SKILL.md` | *Optional* — do not change runtime/API behavior |

**SSOT context:** allowlist contract is in `tasks/llm/groq-plan.md` + IPI-356, not groq-inference API docs.

---

### Problem

`app/src/lib/ai/provider.ts` imports:

```text
../../../../config/groq-models.json
```

`app/next.config.ts` pins Turbopack root to `__dirname` (`app/`). Turbopack refuses to resolve files outside that root.

```text
Module not found: Can't resolve '../../../../config/groq-models.json'
```

Repro: `cd app && rm -rf .next && CI=true npm run build`

Typecheck + Vitest pass; only full `next build` fails. CI `app-build` runs `check-client-env` then `lint` then `build` (`.github/workflows/ci.yml`).

**Verified on main (2026-07-06):** build fails with module-not-found; typecheck + `provider.test.ts` pass.

---

### Options to evaluate

1. Move/copy `config/groq-models.json` under `app/` and update imports.
2. Widen Turbopack root to repo root safely (may re-trigger multi-lockfile root inference).
3. Load allowlist server-side at runtime via `fs` (tests already read repo SSOT this way — see `provider.test.ts:73-78`).
4. Avoid duplicating config — keep `config/groq-models.json` as SSOT for Edge + app.

---

### Implementation recommendation (preferred)

**Option 3 (runtime `fs`, SSOT preserved)** — smallest blast radius:

- Replace static JSON import in `app/src/lib/ai/provider.ts` and `provider.test.ts` with module-init `readFileSync(join(process.cwd(), '..', 'config', 'groq-models.json'))` (same path as existing test).
- `process.cwd()` is `app/` during local build and CI; SSOT stays at `config/groq-models.json`.
- Add `import "server-only"` to `provider.ts` if not already present (module is server/RSC-only per build import trace).
- Edge (`supabase/functions/_shared/llm/allowlist.ts`) unchanged.
- Do **not** widen `turbopack.root` unless Option 3 fails on Vercel — then try prebuild copy fallback first.

**Fallback:** prebuild copy `config/groq-models.json` → `app/src/lib/ai/groq-models.generated.json`.

---

### Acceptance criteria

- [ ] **AC1** `cd app && rm -rf .next && CI=true npm run build` passes
- [ ] **AC2** `cd app && npm run lint` passes
- [ ] **AC3** `cd app && npm run typecheck` passes
- [ ] **AC4** `cd app && npm test` passes
- [ ] **AC5** `config/groq-models.json` remains single SSOT (no divergent allowlists)
- [ ] **AC6** No Groq runtime/provider behavior changes
- [ ] **AC7** No Mastra/CopilotKit behavior changes
- [ ] **AC8** No Edge Function behavior changes
- [ ] **AC9** `node scripts/check-client-env.mjs` — **baseline unchanged** (pre-existing literal hits in `app/src/lib/ai/*` for `GROQ_API_KEY` / `GEMINI_API_KEY` env names are **out of scope**; tracked under PLT-004, not this PR)

---

### Out of scope (explicit)

- Fixing `check-client-env.mjs` false positives on server-only `lib/ai/*` (PLT-004)
- Groq inference, Mastra tier wiring, Edge allowlist changes
- `tasks/intelligence/ai/skill-map.md` row — add in separate docs PR if desired

---

### Completion steps

#### A. Scope

- [ ] **A1** Confirm repro on `origin/main` — proof: build log excerpt

#### B. Implement

- [ ] **B1** Fix import boundary (Option 3 preferred) — proof: diff ≤3 files (`provider.ts`, `provider.test.ts`, optional `server-only`)

#### C. Verify

- [ ] **C1** Run verify commands (lint · typecheck · test · build) — proof: green output
- [ ] **C2** `@task-verifier` report attached — proof: composite ≥85 or documented 🟡

#### E. Ship

- [ ] **E1** Merge PR; clear blockers on IPI-358/IPI-359 — proof: Linear relations

---

_Source: `docs/linear/issues/IPI-428-build-groq-config.md` · sync via Linear plugin `save_issue` or `node scripts/linear-update-issue.mjs IPI-428`_
