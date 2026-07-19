# Infisical → Cloudflare Secrets (IPI-606 · CF-SEC-010)

**Linear:** [IPI-606](https://linear.app/amo100/issue/IPI-606) · **Parent:** [IPI-487](https://linear.app/amo100/issue/IPI-487)  
**Pairs with:** [IPI-472](https://linear.app/amo100/issue/IPI-472) (OpenNext CI pipeline — see `app/docs/opennext-ci.md` when merged)  
**Wrangler SSOT:** `app/wrangler.jsonc`  
**Classification audit:** `docs/audits/secrets-classification-verification.md`

Infisical is the **single source of truth** for secret values. This document defines how secret **names** route to Cloudflare build-time vs runtime surfaces. **No secret values belong in git, CI logs, or this file.**

## Flow overview

```mermaid
flowchart LR
  subgraph infisical [Infisical SSOT]
    DEV[dev env]
    STG[staging env]
    PRD[prod env]
  end

  subgraph ci [GitHub Actions — build-time]
    OIDC[OIDC machine identity]
    SA[Infisical/secrets-action]
    BUILD[opennextjs-cloudflare build]
  end

  subgraph runtime [Cloudflare — runtime]
    SYNC[sync-wrangler-secrets-from-infisical.mjs]
    WR[wrangler versions upload --secrets-file]
    WK[Worker ipix-operator-preview / ipix-operator]
  end

  DEV --> OIDC
  STG --> OIDC
  PRD --> OIDC
  OIDC --> SA
  SA -->|"NEXT_PUBLIC_* only"| BUILD

  DEV --> SYNC
  STG --> SYNC
  PRD --> SYNC
  SYNC --> WR --> WK
```

**Three paths, least privilege:**

| Path | Identity allowlist | Destination | Tool |
|------|-------------------|-------------|------|
| **CI build** | `BUILD_TIME_SECRET_NAMES` | GitHub Actions job `env` | `Infisical/secrets-action@v1` (OIDC) |
| **Deploy sync** | `RUNTIME_SECRET_NAMES` | Cloudflare Worker secrets | `scripts/sync-wrangler-secrets-from-infisical.mjs` → `wrangler versions upload --secrets-file` |
| **Plain config** | `WRANGLER_VAR_NAMES` | Worker `vars` at deploy | GitHub environment **variables** → upload `--var` passthrough |

Allowlist module (SSOT for names): `app/scripts/cloudflare-secret-allowlist.mjs`

## Worker secrets vs Secrets Store (not interchangeable)

This repo uses **per-Worker secrets** (`wrangler secret put`, `--secrets-file`). Values are available as `process.env.SECRET_NAME` (Node.js compat) or `env.SECRET_NAME` in the fetch handler.

**Cloudflare Secrets Store** (account-level, beta) is a different product:

| | Worker secrets | Secrets Store binding |
|--|----------------|----------------------|
| Scope | One Worker | Account-level, reusable |
| Config | `secrets.required` in wrangler | `secrets_store_secrets` binding |
| Runtime access | `process.env.API_KEY` / `env.API_KEY` (string) | `await env.BINDING.get()` (async, throws on error) |
| Sync tool | `--secrets-file`, `wrangler secret put` | `wrangler secrets-store secret create` |

**Do not add `secrets_store_secrets` bindings** until [IPI-TBD CF-SEC-030] completes a full env inventory and operators choose centralized rotation. Store ID `6a663ade…` exists in the account but is **not wired** in this Worker. Mixing Worker secrets and Secrets Store bindings for the same logical credential causes duplicate-binding errors.

## Build-time vs runtime contract

### BUILD_TIME (CI / `next build` / OpenNext build)

Inlined into client bundles — **NEXT_PUBLIC_* only**.

| Secret name | Notes |
|-------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable anon key (not service role) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Optional — client-side Cloudinary |
| `NEXT_PUBLIC_CLOUDINARY_API_KEY` | Optional — client-side upload widget (public key, not API secret) |
| `NEXT_PUBLIC_MARKETING_CHAT_ENABLED` | Feature flag |
| `NEXT_PUBLIC_E2E_UPLOAD_POLL_MAX_MS` | E2E tuning |

**GitHub labeling:** `NEXT_PUBLIC_*` values are **not sensitive** — prefer GitHub repository **variables** (not secrets) for CI build injection.

**Forbidden in build export:** `SERVICE_ROLE`, `*_SECRET`, any non-`NEXT_PUBLIC_*` name (enforced by `assertNoForbiddenSecrets(..., "build")`).

### WRANGLER_VARS (deploy-time `vars`)

Non-secret configuration — plain text, available as `process.env` at Worker runtime. **Wrangler configuration is the deployment source of truth** — do not set production values in the Cloudflare Dashboard; a later deploy overwrites Dashboard edits.

| Var name | Required at bootstrap | Notes |
|----------|----------------------|-------|
| `MASTRA_STORAGE_MODE` | (committed) | `noop` until Hyperdrive (IPI-619) — in `wrangler.jsonc` |
| `OPERATOR_AUTH_ENABLED` | (committed) | Fail-closed operator auth (IPI-468) — in `wrangler.jsonc` |
| `INTELLIGENCE_API_URL` | **Yes** | CopilotKit Intelligence REST — GitHub env variable |
| `INTELLIGENCE_GATEWAY_WS_URL` | **Yes** | CopilotKit Intelligence WebSocket — GitHub env variable |
| `AI_GATEWAY_URL` | No | Legacy custom Worker gateway base URL (frozen) |
| `CLOUDINARY_CLOUD_NAME` | No | Public cloud id |
| `CLOUDINARY_API_KEY` | No | Public upload-widget key; **not** `CLOUDINARY_API_SECRET` |

**Ownership:** configure `INTELLIGENCE_*`, `AI_GATEWAY_URL`, and `CLOUDINARY_*` as GitHub **environment variables** on `preview` and `production`. The bootstrap workflow passes them to `upload-opennext-with-secrets.mjs`, which forwards `--var KEY:VALUE` to Wrangler during upload.

**Local dev:** copy `app/.dev.vars.example` → `.dev.vars` and set the same names for `wrangler dev` / `infisical run`.

### RUNTIME_WRANGLER (`wrangler versions upload --secrets-file`)

Server-only — never in client chunks. Synced by the allowlist script via a secure ephemeral JSON file (chmod 600, deleted in `finally`).

| Secret name | Required at bootstrap | Notes |
|-------------|----------------------|-------|
| `GEMINI_API_KEY` | **Yes** | Mastra / Gemini provider |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Server-side Supabase admin |
| `COPILOTKIT_LICENSE_TOKEN` | **Yes** | CopilotKit runtime license |
| `GROQ_API_KEY` | No | Groq provider |
| `OPENAI_API_KEY` | No | Optional OpenAI fallback |
| `DATABASE_URL` | No | Mastra Postgres — optional while `MASTRA_STORAGE_MODE=noop` (IPI-619 Hyperdrive) |
| `CLOUDINARY_API_SECRET` | No | Server signing |
| `CLOUDINARY_NOTIFICATION_API_SECRET` | No | Webhook verification |
| `INTELLIGENCE_API_KEY` | No | CopilotKit Intelligence auth |
| `FIRECRAWL_API_KEY` | No | Visual identity agent |
| `AI_GATEWAY_API_KEY` | No | Legacy gateway auth |
| `INTERNAL_WEBHOOK_SECRET` | No | Brand-intelligence workflow resume webhook auth |
| `CAPTURE_LEAD_PROXY_SECRET` | No | Marketing lead proxy HMAC (`/api/marketing-lead`) |

**Forbidden in runtime sync:** any `NEXT_PUBLIC_*`, any name in `WRANGLER_VAR_NAMES` (enforced by `assertNoForbiddenSecrets(..., "runtime")`).

### CI_ONLY (other surfaces — not Worker runtime)

Documented in `CI_ONLY_SECRET_NAMES` (`cloudflare-secret-allowlist.mjs`):

| Name | Surface |
|------|---------|
| `FIRECRAWL_WEBHOOK_SECRET` | Supabase edge function `firecrawl-webhook` only |
| `SENTRY_AUTH_TOKEN` | Build-time source map upload |
| `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | GitHub Actions deploy credentials |
| `INFISICAL_CLIENT_ID`, `INFISICAL_CLIENT_SECRET` | Bootstrap Universal Auth |

## `secrets.required` — do not expand blindly

`wrangler.jsonc` declares `secrets.required` for **cf-typegen** and deploy validation. Only names that **must** exist before any preview bootstrap belong here:

```jsonc
"secrets": {
  "required": ["GEMINI_API_KEY", "SUPABASE_SERVICE_ROLE_KEY", "COPILOTKIT_LICENSE_TOKEN"]
}
```

Optional secrets (e.g. `DATABASE_URL`, `GROQ_API_KEY`) stay in `RUNTIME_SECRET_NAMES` but **outside** `secrets.required` so partial bootstrap and noop-storage deploys succeed.

## `--secrets-file` omission preserves existing secrets

Per [Cloudflare Workers secrets docs](https://developers.cloudflare.com/workers/configuration/secrets/#upload-secrets-alongside-code): secrets **not** included in the upload JSON are **preserved** from the previous Worker version. Partial sync uploads only change listed keys — omitting a key does **not** delete it. Explicit deletion requires `wrangler secret delete` or `wrangler versions secret delete`.

## Environment mapping

| Infisical env | Wrangler target | Worker name | CLI |
|---------------|-----------------|-------------|-----|
| `dev` | `preview` | `ipix-operator-preview` | `--env preview` |
| `staging` | `preview` | `ipix-operator-preview` | `--env preview` |
| `prod` | `production` | `ipix-operator` (top-level) | **no `--env` flag** (matches `npm run deploy`) |

Infisical CLI is **not linked in this repo** (no `.infisical.json`). Operators run `infisical init` locally or use dashboard + CI identity only.

## Operator setup — Infisical machine identity (OIDC preferred)

### 1. Create GitHub OIDC machine identity (recommended)

In **Infisical Dashboard**:

1. **Organization Settings → Access Control → Machine Identities → Create Identity**
   - Name: `github-actions-ipix-operator` (example)
   - Assign org role with least privilege (read secrets for target project/env only)

2. **Add OIDC Auth** on the identity:
   - **OIDC Discovery URL:** `https://token.actions.githubusercontent.com`
   - **Issuer:** `https://token.actions.githubusercontent.com`
   - **Subject:** `repo:amo-tech-ai/lumina-studio:ref:refs/heads/main` (adjust owner/repo; use `environment:production` subject for prod-only sync)
   - **Audiences:** `https://github.com/amo-tech-ai` (your GitHub org URL)

3. **Add identity to Infisical project** with project role scoped to required environments (`dev`, `staging`, `prod`).

4. Copy the **Identity ID** (public UUID — safe in workflow files as `${{ vars.INFISICAL_IDENTITY_ID }}` or repo variable).

5. Note **project slug** and **env slug** for each environment.

### 2. GitHub repository configuration

| Variable / secret | Purpose |
|-------------------|---------|
| `INFISICAL_IDENTITY_ID` | Machine identity UUID (repo **variable**, not secret) |
| `INFISICAL_PROJECT_SLUG` | Infisical project slug (variable) |
| `INFISICAL_PROJECT_ID` | Infisical project ID for CLI `--projectId` (Universal Auth fallback) |
| `INFISICAL_CLIENT_ID` | **Bootstrap only** — Universal Auth if OIDC not ready |
| `INFISICAL_CLIENT_SECRET` | **Bootstrap only** — rotate after OIDC cutover |

### 3. Bootstrap fallback (temporary — Universal Auth)

If OIDC is not yet configured:

1. On the machine identity, enable **Universal Auth** and create a client secret.
2. Store `INFISICAL_CLIENT_ID` and `INFISICAL_CLIENT_SECRET` as GitHub **secrets**.
3. Use `method: universal-auth` in `Infisical/secrets-action` until OIDC is verified.
4. Remove Universal Auth credentials after OIDC cutover.

### 4. Local development

```bash
cd app
infisical init   # once — links project (creates .infisical.json locally, gitignored)
infisical run --env=dev -- npm run dev
```

## Sync runtime secrets to Cloudflare

**Order (required):** fetch runtime secrets → `build:cf` → **one** OpenNext upload with `--secrets-file` (code + secrets in the same Worker version).

| Scenario | Command | Why |
|----------|---------|-----|
| **Bootstrap / CI upload** | `node scripts/upload-opennext-with-secrets.mjs` | Writes chmod-600 JSON and passes `--secrets-file` to `opennextjs-cloudflare upload`; satisfies `secrets.required` before Wrangler validates the version |
| **Greenfield Worker** | Same script (auto-fallback) | If the Worker script does not exist, falls back to `opennextjs-cloudflare deploy -- --secrets-file` once |
| **Secret rotation only** (Worker already live) | `sync-wrangler-secrets-from-infisical.mjs` | Metadata-only version via `wrangler versions upload --secrets-file` without rebuilding |

Do **not** upload code first and sync secrets in a second step — that creates two versions and can fail when required secrets are missing from `secrets.required`.

### Dry-run (names only)

```bash
cd app
node scripts/upload-opennext-with-secrets.mjs \
  --infisical-env dev --wrangler-env preview --dry-run
```

Or GitHub Actions: workflow **Cloudflare secrets sync** with `dry_run=true`.

### First preview bootstrap (operator)

```bash
cd app
export NEXT_PUBLIC_SUPABASE_URL=...
export NEXT_PUBLIC_SUPABASE_ANON_KEY=...
export CLOUDFLARE_API_TOKEN=...
export CLOUDFLARE_ACCOUNT_ID=...
export GEMINI_API_KEY=...
export SUPABASE_SERVICE_ROLE_KEY=...
export COPILOTKIT_LICENSE_TOKEN=...
export INTELLIGENCE_API_URL=...
export INTELLIGENCE_GATEWAY_WS_URL=...
# ... other allowlisted runtime secrets and optional WRANGLER_VAR_NAMES
npm run cf-typegen
npm run build:cf
node scripts/upload-opennext-with-secrets.mjs \
  --infisical-env dev --wrangler-env preview
```

After bootstrap, routine CI may use `npm run upload -- --env preview` for code-only version uploads and gradual promotion (see `app/docs/opennext-ci.md`).

### Production sync

Same sequence with `--wrangler-env production` after `build:cf`. GitHub Actions job uses `environment: production` — configure repo **Environments** with required reviewers before production runs.

Requires in env: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, plus allowlisted runtime secrets. Values are written to a temp JSON file (mode 600) and passed to OpenNext → `wrangler versions upload --secrets-file` — **never echoed**.

**Not primary:** `wrangler secret bulk` (each bulk creates a separate deployment version; use `--secrets-file` with upload instead).

## CI integration (v1)

Workflow: `.github/workflows/cloudflare-secrets-sync.yml` (**workflow_dispatch**). Job `worker-bootstrap` uses GitHub **environment** `${{ inputs.wrangler_env }}` (`preview` | `production`) for scoped secrets and production approval gates.

Live run (`dry_run=false`):

```text
validate pairing → validate OIDC (if selected) → fetch secrets → build:cf → upload+secrets-file → record version ID
```

IPI-632 smoke is a separate manual gate after preview URL exists.

Configure repo **Settings → Environments** (each environment must define its complete `WRANGLER_VAR_NAMES` set — Wrangler named envs do not inherit vars from the top level):

| Environment | Purpose | GitHub variables (non-secret) |
|-------------|---------|-------------------------------|
| `preview` | Preview Worker bootstrap | `INTELLIGENCE_API_URL`, `INTELLIGENCE_GATEWAY_WS_URL`, optional `AI_GATEWAY_URL`, `CLOUDINARY_*` |
| `production` | Production bootstrap; **required reviewers** | Same variable names with production values |

Build job integration (when OIDC ready) — add to `app-build` in `ci.yml`:

```yaml
permissions:
  id-token: write
  contents: read

# Optional — enable after INFISICAL_IDENTITY_ID is configured:
# - name: Infisical build-time secrets (OIDC)
#   uses: Infisical/secrets-action@v1.0.9
#   with:
#     method: oidc
#     identity-id: ${{ vars.INFISICAL_IDENTITY_ID }}
#     project-slug: ${{ vars.INFISICAL_PROJECT_SLUG }}
#     env-slug: dev
```

The action exports all secrets from the configured path — scope the machine identity to a folder containing **only** `BUILD_TIME_SECRET_NAMES`, or filter in a follow-up step. There is no per-secret `secrets:` input on v1.0.9.

## Drift detection (v1 — names only)

Compare deployed Worker secret **names** against the allowlist (values are never compared):

```bash
cd app
wrangler secret list --env preview | jq -r '.[].name' | sort
# Compare mentally or script against allowlist:
node -e "
  import { diffSecretNames, runtimeSecretNamesForWranglerEnv } from './scripts/cloudflare-secret-allowlist.mjs';
  const deployed = process.argv.slice(2);
  console.log(diffSecretNames(deployed, 'preview'));
" $(wrangler secret list --env preview | jq -r '.[].name')
```

### Orphan secret inventory and deletion

When the allowlist shrinks (e.g. URLs reclassified from secrets → vars), deployed Workers may retain **orphan secrets** — names no longer in `RUNTIME_SECRET_NAMES`. Wrangler does not auto-delete omitted secrets on `--secrets-file` upload.

1. **List deployed names:** `wrangler secret list --env preview` (repeat for production).
2. **Diff against allowlist:** use `diffSecretNames()` — `extra` entries are orphans.
3. **Operator review:** confirm each orphan is unused (grep codebase + check Infisical path).
4. **Delete:** `wrangler secret delete <NAME> --env preview` (one name at a time; production requires approval).
5. **Record:** note deletions in the change ticket; re-run bootstrap dry-run to confirm allowlist parity.

**Drift remediation (values):** re-run sync from Infisical SSOT or GitHub environment secrets. **Do not** patch values in the Cloudflare Dashboard — use the bootstrap upload path so Wrangler remains SSOT.

## Rotation procedure

1. **Update value in Infisical** (dev → staging → prod per change window).
2. **Re-run sync** for the target wrangler env:
   `infisical run --env=prod -- node scripts/sync-wrangler-secrets-from-infisical.mjs --wrangler-env production`
3. **Redeploy Worker** if the secret is read at startup (OpenNext upload/deploy per IPI-472).
4. **Verify** runtime smoke (IPI-632) — auth, CopilotKit `/info`, one agent turn.

Rotate **Cloudflare API token** and **Infisical Universal Auth** bootstrap credentials on the same schedule if used.

## Rollback procedure

Cloudflare Worker secrets **do not retain previous values** after overwrite. Rollback path:

1. Restore previous value from **Infisical version history** (or re-issue from provider).
2. Re-run sync script for the affected wrangler env.
3. Redeploy Worker to the last known-good version if code changed (`wrangler versions list` / rollback per IPI-472).

There is no `wrangler secret restore` — Infisical remains SSOT.

## Security rules

- Never commit secret values, Universal Auth client secrets, or real account IDs if sensitive.
- Never `echo`, `printenv`, or log secret values in CI or scripts.
- CI build identity: **BUILD_TIME allowlist only**.
- Deploy sync identity: **RUNTIME allowlist + Cloudflare deploy token** only.
- Prefer OIDC over Universal Auth for GitHub Actions.
- Use `WRANGLER_VAR_NAMES` for URLs and public identifiers — not runtime secrets.

## Related

| Doc / issue | Scope |
|-------------|-------|
| `app/docs/opennext-ci.md` | IPI-472 CI pipeline, bundle gate, wrangler env names |
| `docs/audits/secrets-classification-verification.md` | CF-SEC-010 audit verification (82/100 baseline) |
| IPI-TBD CF-SEC-030 | Full env inventory + Secrets Store wiring decision |
| IPI-468 | Fail-closed operator auth (`OPERATOR_AUTH_ENABLED`) |
| IPI-619 | Hyperdrive — may remove Worker `DATABASE_URL` |
| IPI-632 | Protected preview runtime smoke after secrets land |
