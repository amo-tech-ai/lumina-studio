# IPI-TBD · CF-103 — CI/CD for Cloudflare deployment (services/cloudflare-worker, the "ai-gateway" Worker)

> `IPI-TBD`: no real Linear ticket exists yet for this gap. Assign a real IPI number before implementation starts — do not invent one.

## Purpose

The `ai-gateway` Worker in `services/cloudflare-worker` has no automated deploy path — every deploy is a human running `wrangler deploy` from a local shell. This task adds a gated GitHub Actions pipeline so deploys are tested and repeatable, matching how the rest of the repo already ships.

## Current state

- `.github/workflows/ci.yml` has exactly two jobs — `app-build` (Next.js lint/build/typecheck/test) and `supabase-web015` (+ `booking-gate-check`) for Supabase RLS. Neither touches `services/cloudflare-worker`. There is no `deploy.yml` (or any `*cloudflare*` workflow) in `.github/workflows/` — confirmed via `ls .github/workflows/` (only `ci.yml`, `pr-agent.yml`).
- `services/cloudflare-worker/package.json` defines `"deploy": "wrangler deploy"` with no CI trigger wired to it — it's a script meant to be run by hand.
- `services/cloudflare-worker/AGENTS.md` documents `npx wrangler dev` / `npx wrangler deploy` / `npx wrangler types` as commands a person runs, not steps in a pipeline.
- Ironically, `.claude/skills/cloudflare/references/email-routing/configuration.md:168-186` already contains a GitHub Actions CI/CD snippet — but it's stale: raw `npx wrangler deploy` plus `actions/checkout@v3` and `actions/setup-node@v3`, not the current official `cloudflare/wrangler-action`, and it lives in reference docs for a *different* feature (email routing), not wired to this Worker.
- **Verified gap: iPix has zero deployment automation for this Worker today.** 100% manual, local-only.

## Recommended setup method

**GitHub Actions + the official `cloudflare/wrangler-action@v3`** (external CI/CD path), not Cloudflare's dashboard-native Workers Builds.

Cloudflare documents two supported paths at https://developers.cloudflare.com/workers/ci-cd/:
1. **Workers Builds** — dashboard git-integration, zero YAML, deploys on every push with no test gate unless combined with branch protection.
2. **External CI/CD via `cloudflare/wrangler-action@v3`** (https://github.com/cloudflare/wrangler-action) — deploy runs inside your own pipeline, gated behind whatever steps precede it.

This repo's existing quality-gate culture (`ci.yml` gates `app-build` behind lint/build/typecheck/test) makes option 2 the better fit: reuse the Worker's own `npm ci && npm test` (Vitest, already present per `package.json`) as a gate before `wrangler deploy` runs. Workers Builds remains a valid lighter-weight fallback if the team later wants zero-YAML, but it bypasses the test gate unless paired with branch protection — flag as an alternative, not the recommendation.

Token-based auth only — global API-key auth and Wrangler v1 are no longer supported by the official action.

## Official links

- Cloudflare Workers CI/CD overview (Workers Builds vs. external CI): https://developers.cloudflare.com/workers/ci-cd/
- Official `cloudflare/wrangler-action` (v3, token auth): https://github.com/cloudflare/wrangler-action
- Live-state evidence: `/home/sk/ipix/.github/workflows/ci.yml`
- Live-state evidence: `/home/sk/ipix/services/cloudflare-worker/package.json`
- Live-state evidence: `/home/sk/ipix/services/cloudflare-worker/AGENTS.md`
- Stale snippet to replace: `/home/sk/ipix/.claude/skills/cloudflare/references/email-routing/configuration.md` (lines ~168-186)

## Exact commands

New workflow file — `.github/workflows/deploy-cloudflare-worker.yml`:

```yaml
name: Deploy Cloudflare Worker (ai-gateway)

on:
  push:
    branches: [main]
    paths:
      - "services/cloudflare-worker/**"

jobs:
  deploy:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: services/cloudflare-worker
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: npm
          cache-dependency-path: services/cloudflare-worker/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Unit tests
        run: npm test

      - name: Deploy to Cloudflare
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          workingDirectory: services/cloudflare-worker
```

Local dry-run before merging (from `services/cloudflare-worker`):

```bash
npm ci
npm test
npx wrangler deploy --dry-run
```

## Dashboard steps

Not the recommended path for the deploy itself (see above), but the API token still requires one-time dashboard setup:

`Cloudflare dashboard → My Profile → API Tokens → Create Token → "Edit Cloudflare Workers" template → scope to the ai-gateway Worker's account/zone → copy token`, then add it as a GitHub repo secret: `Settings → Secrets and variables → Actions → New repository secret → CLOUDFLARE_API_TOKEN`.

## Files changed

- `.github/workflows/deploy-cloudflare-worker.yml` — new file (this task)
- `.claude/skills/cloudflare/references/email-routing/configuration.md` — update the stale CI/CD snippet to use `cloudflare/wrangler-action@v3` instead of raw `npx wrangler deploy` + `actions/checkout@v3`/`actions/setup-node@v3` (separate commit — docs-only, per repo's no-mixing rule)
- No changes needed to `services/cloudflare-worker/package.json` or `AGENTS.md`

## Dependencies

- `CLOUDFLARE_API_TOKEN` GitHub repo secret must exist before the workflow can run (one-time dashboard step above). Nothing else blocks this — `services/cloudflare-worker` already has its own `package-lock.json`, Vitest suite, and `wrangler.jsonc`.

## Tests / validation

- Push a no-op change under `services/cloudflare-worker/**` on a feature branch → confirm the workflow triggers only on `main` push (not on this branch) by checking `gh run list --workflow=deploy-cloudflare-worker.yml` shows nothing for the feature branch.
- Merge to `main` → `gh run list --workflow=deploy-cloudflare-worker.yml --limit 1` shows a completed, green run.
- `gh run view <run-id> --log` shows `npm test` executed and passed before the `wrangler-action` deploy step ran (proves the test gate, not just the deploy).
- Manually verify the deployed Worker responds (e.g. `curl` its route) matches the commit that triggered the run.

## Acceptance criteria

- [ ] `.github/workflows/deploy-cloudflare-worker.yml` exists, path-filtered to `services/cloudflare-worker/**`, triggers only on push to `main`. Proof: paste the file diff.
- [ ] Workflow run gates deploy behind `npm test` — a failing test blocks the `wrangler-action` step. Proof: paste a `gh run view` log showing test failure stopping the pipeline before deploy (test locally by introducing a temporary failing assertion, observe the run fail, then revert).
- [ ] A successful merge to `main` touching `services/cloudflare-worker/**` produces a green run and a live deploy. Proof: paste `gh run list --workflow=deploy-cloudflare-worker.yml --limit 1` output plus Cloudflare dashboard "Last deployed" timestamp for the Worker.
- [ ] Stale CI/CD snippet in `.claude/skills/cloudflare/references/email-routing/configuration.md` updated to `cloudflare/wrangler-action@v3`, in its own docs-only commit. Proof: paste the diff.

## Rollback

- Delete `.github/workflows/deploy-cloudflare-worker.yml` (or revert the commit) — this disables automated deploys with zero effect on `app-build`/`supabase-web015`, since it's an isolated new job in a separate file.
- If a bad deploy already went out, roll back via Wrangler's own rollback: `npx wrangler rollback` from `services/cloudflare-worker`, or the Cloudflare dashboard's Worker → Deployments → previous version → "Rollback to this deployment". No app-side rollback needed — this workflow only touches the Worker, not `app/` or Supabase.

## Evidence required

Before marking Done, paste into the PR/ticket:
1. The new workflow file diff.
2. A `gh run view <run-id> --log` (or link) showing a green run with `npm test` passing before the deploy step.
3. `gh run list --workflow=deploy-cloudflare-worker.yml --limit 1` output.
4. Cloudflare dashboard screenshot or `wrangler deployments list` output confirming the live Worker's deployed timestamp matches the merged commit.
5. Diff of the `.claude/skills/cloudflare/references/email-routing/configuration.md` snippet update (separate commit reference).
