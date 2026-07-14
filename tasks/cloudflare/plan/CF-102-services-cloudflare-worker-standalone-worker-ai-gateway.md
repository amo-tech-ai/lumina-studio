# IPI-TBD · CF-102 — services/cloudflare-worker/ standalone Worker (ai-gateway)

> **IPI-TBD**: no real Linear ticket exists yet. Assign a real IPI number before implementation starts — do not invent one. This reconfirms an already-open backlog item, **IPI-472** ("Cloudflare Worker Deployment Pipeline"), rather than a novel finding; link the two when the real ticket is created.

## Purpose

The `ai-gateway` Worker in `services/cloudflare-worker/` is deployed by hand (`wrangler deploy` run locally) with no CI/CD, no rollback runbook, and no real observability beyond a boolean flag. Connect it to Cloudflare Workers Builds so every push to `main` deploys automatically, every PR gets a preview URL, and rollback is a dashboard click.

## Current state

- `services/cloudflare-worker/wrangler.jsonc` is already up to date: `compatibility_date: "2026-03-10"`, single correct `nodejs_compat` flag, `observability.enabled: true`, `keep_vars: true`, wrangler `^4.107.1`.
- `services/cloudflare-worker/package.json` deploy path is `deploy: wrangler deploy` / `dev: wrangler dev` — manual, developer-machine-only.
- `.github/workflows/ci.yml` (the only two workflow files alongside `pr-agent.yml`) has **zero** occurrences of `wrangler`, `cloudflare`, or `opennext` — confirmed by direct grep.
- The forensic audit `tasks/cloudflare/audits/AUDIT.md` (IPI-472, scored 40/100, "Todo, zero implementation") independently confirms: *"Zero PRs, zero branches, zero code anywhere... no rollback script exists anywhere. No observability config beyond a single `observability.enabled: true` boolean."*
- `tasks/cloudflare/plan/summary-plan.md` claims "Push to main → automatic build and deploy... GitHub Actions running" — this is **stale/aspirational**, contradicted by the newer evidence-based AUDIT.md and by the direct `ci.yml` grep above. Do not treat it as current state.
- The live deployed instance is on a personal `workers.dev` subdomain (`ai-gateway.sk-498.workers.dev`, per `tasks/cloudflare/audits/pr-336-audit.md`), consistent with ad hoc local deploys rather than a team pipeline.

## Recommended setup method

**Dashboard** — Cloudflare Workers Builds (native CI/CD, GitHub-integrated, no custom YAML).

Cloudflare's own docs state a CI/CD pipeline is "a best practice because it automates the build and deployment process, removing the need for manual `wrangler deploy` commands," and recommend Workers Builds specifically "if you want a fully integrated solution within Cloudflare's ecosystem that requires minimal setup... for GitHub or GitLab users" — iPix is GitHub-hosted. Source: https://developers.cloudflare.com/workers/ci-cd/

## Official links

- https://developers.cloudflare.com/workers/ci-cd/ — CI/CD overview, states manual `wrangler deploy` is the problem Workers Builds solves
- https://developers.cloudflare.com/workers/ci-cd/builds/ — Workers Builds setup and behavior (auto-deploy on push, PR preview URLs)
- https://developers.cloudflare.com/workers/ci-cd/builds/configuration/ — build command / root directory / branch configuration reference
- `tasks/cloudflare/audits/AUDIT.md` — IPI-472 forensic finding (repo-internal, not a public URL)
- `tasks/cloudflare/plan/DASHBOARD-VS-CODE.md` — repo's own "dashboard for infrastructure, code for behavior" rule (repo-internal)
- Alternative custom-pipeline path (not recommended here, noted for completeness): `cloudflare/wrangler-action` GitHub Action — TBD exact URL, not independently checked in this pass; verify at https://github.com/cloudflare/wrangler-action before using.

## Dashboard steps

1. Cloudflare dashboard → **Workers & Pages** → select the `ai-gateway` Worker.
2. **Settings → Builds → Connect**.
3. Authorize/select the GitHub repo (iPix), branch `main` for production.
4. Set **root directory**: `services/cloudflare-worker`.
5. Set **deploy command**: `npx wrangler deploy` (build command can stay default/empty — no bundler step beyond wrangler itself).
6. Save. Confirm non-production branches/PRs are enabled so PRs touching this path get automatic preview URLs + PR comments.

## Exact commands

None required — this is a dashboard-only connection step, no local commands, no PR. (If validating the deploy command locally first: `cd services/cloudflare-worker && npx wrangler deploy --dry-run`.)

## Files changed

None in this repo. This is a Cloudflare dashboard configuration change, not a code change — consistent with `tasks/cloudflare/plan/DASHBOARD-VS-CODE.md`'s existing rule to keep infrastructure wiring out of the codebase. No PR needed for the dashboard connection itself.

(Optional follow-up, separate task/PR if the team also wants it documented in-repo: add a short note to `services/cloudflare-worker/README.md` — file does not currently exist, verify before creating — describing the Workers Builds pipeline. Do not bundle that doc change with anything else per the one-concern-per-PR rule.)

## Dependencies

None. This can be done today — it only requires dashboard access to the `ai-gateway` Worker and the GitHub repo connection permission (Cloudflare needs read access to the iPix GitHub repo).

## Tests / validation

- Push a trivial commit to `main` touching `services/cloudflare-worker/src/**` → confirm a new build appears under **Workers & Pages → ai-gateway → Deployments** within a few minutes, with status "Success".
- Open a test PR touching the same path → confirm a preview URL is posted (as a GitHub check or PR comment, per current Workers Builds UI).
- `curl` the deployed Worker's health/root route after the auto-deploy completes → confirm response matches what a manual `wrangler deploy` would have produced (no behavior change expected, this is deploy-mechanism only).

## Acceptance criteria

- [ ] `ai-gateway` Worker shows a connected Git repository under Settings → Builds (proof: screenshot or `GET` via Cloudflare API of the Worker's build config)
- [ ] A push to `main` under `services/cloudflare-worker/**` triggers an automatic build+deploy without any local `wrangler deploy` invocation (proof: Deployments tab timestamp + git commit SHA match)
- [ ] A PR touching `services/cloudflare-worker/**` produces a preview deployment URL (proof: PR check/comment screenshot)
- [ ] Rollback via Version History is confirmed to work (proof: roll back to previous version once, confirm old code serves, then roll forward again)
- [ ] IPI-472 (or its real IPI-TBD replacement) is updated/closed referencing this evidence

## Rollback

No code changed, so no code rollback needed. If the Workers Builds connection causes an unwanted auto-deploy (e.g. wrong branch or root directory misconfigured): **Settings → Builds → Disconnect**, then resume manual `wrangler deploy` exactly as today — this is a strictly additive change with an instant off-switch, not a one-way door. If a bad build is already live, use **Deployments → Version History → Rollback** to the last known-good version.

## Evidence required

Before marking this done, paste into the PR/ticket:
1. Screenshot of Settings → Builds showing the connected repo, root directory (`services/cloudflare-worker`), and deploy command.
2. Screenshot of one successful auto-deploy in the Deployments tab, with the triggering commit SHA visible.
3. Screenshot of one PR preview URL/comment from a test PR.
4. Confirmation the old manual `wrangler deploy` path still works as a fallback (not removed, just no longer the primary path) — link `services/cloudflare-worker/package.json` unchanged.
5. Link to the real IPI number this replaces/closes (IPI-472 or its successor).
