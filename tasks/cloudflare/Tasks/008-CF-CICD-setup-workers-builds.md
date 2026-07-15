# IPI-XXX · CF-CICD-010 — Set Up Workers Builds CI/CD

**Task ID:** CF-CICD-010  
**Phase:** 4 — Production  
**Difficulty:** Easy  
**Risk:** Low  
**Estimated time:** 1 hour  
**Dependencies:** Task CF-AI-020 (Worker must exist)

---

## Purpose

Connect the iPix GitHub repository to Cloudflare Workers Builds so that every pull request gets a preview deployment and every merge to main deploys to production automatically. No manual deploy commands needed.

### Real-world iPix example

A developer opens a pull request that updates the Creative Director agent's prompt. Within two minutes, Workers Builds detects the PR, builds the Next.js app, deploys a preview URL, and comments on the PR. The reviewer opens the preview URL, tests the updated agent, approves the PR, and merges. Workers Builds deploys to production automatically. The entire cycle — from code change to live production — happens without anyone running a deploy command.

---

## Recommended Setup Method

**Dashboard — connect the GitHub repository to Workers Builds.**

This is the officially recommended CI/CD method for Cloudflare Workers. It supports preview deployments, automatic production deploys, environment variable management, and automatic framework configuration.

**Priority order confirmation:** This is option 1 (dashboard setup) combined with option 5 (Workers Builds is an official Cloudflare product).

---

## Official Links

| Resource | Link |
|----------|------|
| Workers Builds | https://developers.cloudflare.com/workers/ci-cd/builds/ |
| Build configuration | https://developers.cloudflare.com/workers/ci-cd/builds/configuration/ |
| Automatic PRs | https://developers.cloudflare.com/workers/ci-cd/builds/automatic-prs/ |
| Connect existing Worker | https://developers.cloudflare.com/workers/ci-cd/builds/#connect-an-existing-worker |
| Preview URLs | https://developers.cloudflare.com/workers/configuration/versions-and-deployments/preview-urls/ |

---

## Dashboard Steps

### Step 1: Navigate to the Worker

1. Open the Cloudflare dashboard
2. Go to Workers and Pages
3. Select the `ipix-operator` Worker

### Step 2: Connect the repository

1. Click the Settings tab
2. Click Builds
3. Click Connect
4. Authorize Cloudflare to access your GitHub account if not already done
5. Select the `amo-tech-ai/lumina-studio` repository
6. Select the `main` branch as the production branch
7. Set the root directory to `app` (since the Next.js app is in the `app/` subdirectory of the monorepo)

### Step 3: Configure build settings

**⚠️ Corrected 2026-07-14 — real bug, verified against `app/package.json`:** `npm run build` is the plain Next.js build (`next build`), **not** the OpenNext build. Using it as the "build command" with `npx wrangler deploy` as a separate "deploy command" would deploy the wrong artifact. `app/package.json` defines a single combined command that does the whole pipeline correctly:

```
"deploy": "sync-groq-models.mjs && rm -rf .next .open-next && opennextjs-cloudflare build && opennextjs-cloudflare deploy"
```

1. Leave the build command **empty**, or set it to a non-deploying validation step (e.g. `npm run typecheck`)
2. Set the deploy command to `npm run deploy` — **not** `npm run build` + `npx wrangler deploy` separately
3. For non-production/preview branches, use a dedicated OpenNext preview/upload script (`npm run upload` exists in `app/package.json` for this) rather than the production `deploy` script
4. Save the configuration

### Step 4: Configure environment variables for builds

1. In the build settings, find Build Variables and Secrets
2. Add any variables needed during the build (for example, `NEXT_PUBLIC_*` variables)
3. These are separate from runtime secrets (which are in the Worker's Variables tab)

### Step 5: Trigger the first build

1. Push a commit to the `main` branch (or merge a pull request)
2. Workers Builds detects the push and starts a build
3. Watch the build progress in the dashboard
4. Once the build completes, the new version is deployed

### Step 6: Enable preview deployments

1. In the build settings, ensure preview deployments are enabled for non-main branches
2. Open a pull request on a branch
3. Workers Builds builds a preview and comments on the PR with a preview URL

---

## Commands

### Optional: Connect from the CLI

The dashboard method is recommended, but you can also connect via Wrangler:

Command: `npx wrangler github-info` — checks GitHub connection status

Command: `npx wrangler builds` — manages builds from the CLI (if supported)

The dashboard method is simpler and provides better visibility into build logs.

---

## Files Changed

### File 1: .github/workflows/ci.yml (optional)

If the repository has existing GitHub Actions CI, it should continue to run lint, typecheck, and tests. Workers Builds handles the deploy step. The CI workflow should not duplicate the deploy.

### No wrangler.jsonc changes needed

The existing wrangler.jsonc is already correct. Workers Builds uses it automatically.

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| GitHub repository | Exists | amo-tech-ai/lumina-studio |
| Worker deployed | Exists | ipix-operator Worker |
| wrangler.jsonc in app/ directory | Exists | Verified by repository |

---

## Tests

### Test 1: Build triggers on push

Push a commit to the main branch.

Pass criteria: Workers Builds starts a build within 30 seconds.

### Test 2: Build succeeds

Monitor the build in the dashboard.

Pass criteria: Build completes successfully and the new version is deployed.

### Test 3: Preview deployment works

Open a pull request on a feature branch.

Pass criteria: Workers Builds comments on the PR with a preview URL, and the preview URL serves the application.

### Test 4: Production deployment works

Merge the pull request to main.

Pass criteria: Workers Builds deploys the new version to production automatically.

### Test 5: Build logs are accessible

Open the build logs in the dashboard.

Pass criteria: Build logs show the OpenNext build output and any errors clearly.

---

## Managed-First Verification & Definition of Done

*(Added 2026-07-14, per `tasks/cloudflare/Tasks/notes/04-improvements.md` — fill in at execution time, not in advance. A dashboard toggle alone does not satisfy "done.")*

| Verification gate | Result |
|---|---|
| Cloudflare dashboard feature available? | — |
| Wrangler command available? | — |
| Cloudflare API available? | — |
| Official package/module available? | — |
| Official GitHub repository checked? | — |
| Official example checked? | — |
| Official tutorial/recipe checked? | — |
| Existing iPix code already implements it? | — |
| Configuration-only solution possible? | — |
| Minimum integration code required | — |
| Custom implementation necessary? | — |
| Why custom code is unavoidable | — |
| Rollback method | — |
| Production evidence | — |

**Definition of done:** Configured + integrated + tested + observed in logs + failure tested + rollback tested + documented = complete.

---

## Acceptance Criteria

- [ ] The `ipix-operator` Worker is connected to the GitHub repository
- [ ] The root directory is set to `app`
- [ ] The deploy command is `npm run deploy` (not `npm run build` + a separate `wrangler deploy`)
- [ ] A push to main triggers a build and deploy
- [ ] A pull request triggers a preview deployment
- [ ] Build logs are visible in the dashboard
- [ ] Build environment variables are configured
- [ ] **Missing gates, added 2026-07-14 (audit finding):** lint, typecheck, and unit tests run and pass (GitHub CI, not just Workers Builds) before this deploy step runs
- [ ] Deployment health check exists (a post-deploy smoke request, not just "build succeeded")
- [ ] Rollback has been tested at least once, not just documented
- [ ] Branch protection prevents direct pushes to `main` bypassing PR review
- [ ] Production deploys require explicit approval, not just an automatic merge trigger
- [ ] Confirmed preview deployments do not have access to production data/secrets

Workers Builds deploying on every push is not, by itself, a complete quality gate — it must run only after GitHub CI (lint/typecheck/test) passes.

---

## Rollback

Workers Builds deploys new versions without removing old ones. If a deploy breaks production:

1. Go to the Workers dashboard
2. Select the `ipix-operator` Worker
3. Go to the Versions tab (covered in Task CF-OPS-010)
4. Select the previous version
5. Click Roll back to this version

See Task CF-OPS-010 for the detailed rollback procedure.

---

## Evidence Required

1. Screenshot of the Workers Builds settings showing the connected repository
2. Screenshot of a successful build in the dashboard
3. Screenshot of a pull request with a preview deployment comment
4. Screenshot of the production deployment after merge
5. Screenshot of build logs

---

## What Custom Code This Removes

This task replaces:
- Manual `npm run deploy` commands
- Any custom deploy scripts in the repository
- Any external CI/CD pipelines that handle deployment (they can be simplified to lint/test only)

The GitHub Actions CI workflow should be updated to remove the deploy step if it currently handles deployment. Workers Builds takes over that responsibility.

---

## User Journey After This Task

> A developer finishes updating the CRM Assistant agent to handle a new type of client query. They push their branch and open a pull request. Within two minutes, Cloudflare Workers Builds has built the app and deployed a preview. The PR has a comment with a link. The developer shares the link with the product manager, who tests the new functionality on the preview deployment. The PM approves. The developer merges the PR. Workers Builds builds again and deploys to production. The whole team can see the build progress and deployment status in the Cloudflare dashboard. No one typed `npm run deploy`. No one wondered if the right branch was deployed. The system is fully automated.
