# Verify matrix — conditional scripts by changed path

Run the base checks always; add the conditional row for every path that changed. This table
merges the "Required verification" section of `pr-workflow.mdc` with the "3a/3b Static/Domain"
verify steps of `pr-fix.mdc` — same commands, one table instead of two.

## Base (run for almost every PR)

```bash
infisical run -- npm run supabase:verify
infisical run -- npm run supabase:verify-rls
```

## Operator app (`app/**` changed)

```bash
cd app && npm run typecheck   # tsc --noEmit, must be 0 errors
cd app && npm run lint
cd app && npm run build       # needs DATABASE_URL — only for routes/config/env/middleware changes
cd app && npm test            # no new failures vs main
```

## Root Vite (retiring — only if `src/**`, `index.html`, or root `vite.config.ts`/`tsconfig` changed)

```bash
infisical run -- npm run build
infisical run -- npm run test
```

## Conditional — by area

| Changed area | Also run |
|--------------|----------|
| `supabase/functions/**` (edge) | `npm run supabase:verify-edge` |
| AI / Gemini agents, Brand Intelligence pipeline | `npm run supabase:verify-brand-intelligence` |
| DNA scoring (`audit-asset-dna`) | `npm run supabase:verify-dna` |
| `supabase/migrations/**`, `*.sql` | `infisical run -- npm run supabase:verify-rls` (+ `supabase:push` if it's a new migration) — route through **rls-policy-auditor** subagent first |
| Vite env / client bootstrap (`src/**`) | `npm run check:env` |
| Commerce checkout touched | `node scripts/commerce/paid-order-smoke.mjs` |

## Any failure

Stop. Do not push, do not resolve threads, do not claim "already fixed" against a red run.
Fix the root cause and re-run before moving on — see the ladder in `ponytail` for how small
the fix should be, but never skip the re-run to save time.

## Fix touches a migration

Stop and report instead of pushing — migrations need `create-migration` +
**rls-policy-auditor** subagent review before they go out, even for a one-line fix found in
review.

## Spec compliance (PR closes an IPI issue)

Check every acceptance criterion in the issue markdown against a concrete probe (not a
skim-read), one row per AC, 🟢/🔴. Run [task-verifier](../../task-verifier/SKILL.md) before
signing off as merge-ready — any 🔴 is a blocker regardless of what CI says.
