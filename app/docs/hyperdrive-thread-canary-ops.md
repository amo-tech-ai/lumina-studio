# Hyperdrive thread canary — preview ops runbook

**Linear:** [IPI-828 · CF-DB-009g](https://linear.app/amo100/issue/IPI-828) · related [IPI-623 · CF-DB-009](https://linear.app/amo100/issue/IPI-623) · [IPI-822 · CF-DB-009b](https://linear.app/amo100/issue/IPI-822) · [IPI-825 · CF-DEPLOY-031](https://linear.app/amo100/issue/IPI-825)

Preview-only prove-out for Mastra thread **create → immediate read** via `HYPERDRIVE_FRESH`. Production Worker (`ipix-operator`) is not cut over here — see [IPI-803 · CF-DB-012](https://linear.app/amo100/issue/IPI-803).

**No secret values belong in this file or in git.**

## Endpoint

| Item | Value |
|------|--------|
| URL | `https://ipix-operator-preview.sk-498.workers.dev/api/internal/hyperdrive-thread-canary` |
| Method | `POST` |
| Auth header | `X-Internal-Secret: <INTERNAL_WEBHOOK_SECRET>` (**not** `Authorization: Bearer`) |
| Body (required) | `{ "resourceId": "<org-scoped id>" }` |
| Flag | GitHub **preview** environment variable `ENABLE_HYPERDRIVE_THREAD_CANARY` (`true` / `false`) |
| Storage mode on preview | `MASTRA_STORAGE_MODE=noop` (canary uses Hyperdrive helper path; durable Mastra cutover is separate) |

### Expected responses

| Situation | HTTP | Body |
|-----------|------|------|
| Flag off / route gated | `404` | `{"error":"not_found", ...}` |
| Wrong / missing secret | `401` | unauthorized |
| Success | `200` | `matched: true`, `crossTenant: false`, `requestId` present |

## Critical: upload ≠ traffic

`opennextjs-cloudflare upload` / secrets-sync **creates a Worker version**. It does **not** put that version at 100% traffic unless you promote.

| Misleading | Truth |
|------------|--------|
| Cloudflare Dashboard bindings / vars “look updated” | Settings can sync while **traffic** still hits an older deployment |
| “Upload succeeded” in Actions | Version exists; check **deployments** for who serves 100% |

### Identify the version receiving 100% traffic

```bash
cd app
npx wrangler deployments list --env preview --json
# Latest entry by created_on → versions[0].version_id @ versions[0].percentage
```

Or human-readable:

```bash
npx wrangler deployments list --env preview
```

After [IPI-825 · CF-DEPLOY-031](https://linear.app/amo100/issue/IPI-825), secrets-sync with `promote_preview=true` runs:

```bash
npx wrangler versions deploy "${VERSION_ID}@100" --env preview --yes
```

Production promotion stays **manual / separately approved**.

## Enable → upload → promote → probe

1. GitHub → Settings → Environments → **preview** → set `ENABLE_HYPERDRIVE_THREAD_CANARY=true`.
2. Actions → **Cloudflare secrets sync**:
   - `secret_source=github`
   - `infisical_env=dev` (pairing label)
   - `wrangler_env=preview`
   - `dry_run=false`
   - `promote_preview=true` (after IPI-825; otherwise promote manually — step 3)
3. If promote was skipped:  
   `npx wrangler versions deploy "<worker_version_id>@100" --env preview --yes`
4. Confirm live version @100% (`deployments list`).
5. Probe (secret from Infisical / GitHub Actions secret — never commit):

```bash
curl -sS -X POST \
  "https://ipix-operator-preview.sk-498.workers.dev/api/internal/hyperdrive-thread-canary" \
  -H "Content-Type: application/json" \
  -H "X-Internal-Secret: $INTERNAL_WEBHOOK_SECRET" \
  -d '{"resourceId":"org_audit"}'
```

Expect `matched: true`, `crossTenant: false`. Wrong secret → `401`.

## Disable → upload → promote → verify 404

1. GitHub preview env: `ENABLE_HYPERDRIVE_THREAD_CANARY=false`.
2. Re-run secrets-sync (`wrangler_env=preview`, `dry_run=false`, `promote_preview=true`).
3. Confirm new version @100%.
4. Same curl → HTTP `404` with `"error":"not_found"`.

## Soak notes (from IPI-623)

| Mode | Result |
|------|--------|
| Serial concurrency 1, n=50 | Pass; record p95; 0 cross-tenant |
| Concurrency 2–3 | May return Worker CPU/memory **503** — platform capacity, not tenant/Hyperdrive data failures (see [IPI-827](https://linear.app/amo100/issue/IPI-827)) |

Interim recommendation: serial or concurrency 2 with gaps; hard max concurrency **3**.

## Related docs

- Secrets allowlist / bootstrap: `app/docs/infisical-cloudflare-secrets.md`
- OpenNext CI pipeline: `app/docs/opennext-ci.md`
- Hyperdrive local connection env (CI upload): [Wrangler system environment variables](https://developers.cloudflare.com/workers/wrangler/system-environment-variables/) · [Hyperdrive local development](https://developers.cloudflare.com/hyperdrive/configuration/local-development/)
- Versions / promote: [Deployment management](https://developers.cloudflare.com/workers/versions-and-deployments/deployment-management/)
